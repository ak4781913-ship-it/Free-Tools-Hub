/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface AutoSaveState<T> {
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  updateData: (newData: T) => void;
  lastSaved: Date | null;
  isSaving: boolean;
  hasSavedDraft: boolean;
  clearDraft: () => void;
  restoreBackup: () => boolean;
  saveNow: () => void;
}

/**
 * Custom React hook for robust, automatic localStorage state persistence.
 * Prevents data loss during accidental page refreshes, tab closures, or network blips.
 * Includes automatic backup before clearing, debounced writes, and formatted save status.
 *
 * @param storageKey Unique localStorage key
 * @param defaultValue Default fallback value if no saved draft exists
 * @param debounceMs Delay before writing to localStorage (defaults to 300ms)
 */
export function useAutoSave<T>(
  storageKey: string,
  defaultValue: T,
  debounceMs: number = 300
): AutoSaveState<T> {
  const backupKey = `${storageKey}_backup`;
  const timestampKey = `${storageKey}_timestamp`;

  const [hasSavedDraft, setHasSavedDraft] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) !== null;
    } catch {
      return false;
    }
  });

  const [data, setData] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved) as T;
      }
    } catch (err) {
      console.warn(`[AutoSave] Failed to parse draft for "${storageKey}":`, err);
    }
    return defaultValue;
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(() => {
    try {
      const savedTime = localStorage.getItem(timestampKey);
      return savedTime ? new Date(savedTime) : null;
    } catch {
      return null;
    }
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestDataRef = useRef<T>(data);

  // Keep ref synchronized
  useEffect(() => {
    latestDataRef.current = data;
  }, [data]);

  // Synchronous write helper
  const performSave = useCallback(
    (currentVal: T) => {
      try {
        setIsSaving(true);
        const serialized = JSON.stringify(currentVal);
        localStorage.setItem(storageKey, serialized);
        const now = new Date();
        localStorage.setItem(timestampKey, now.toISOString());
        setLastSaved(now);
        setHasSavedDraft(true);
      } catch (err) {
        console.warn(`[AutoSave] Failed to save draft for "${storageKey}":`, err);
      } finally {
        setTimeout(() => setIsSaving(false), 200);
      }
    },
    [storageKey, timestampKey]
  );

  // Save on changes with debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsSaving(true);
    debounceTimerRef.current = setTimeout(() => {
      performSave(data);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, debounceMs, performSave]);

  // Manual immediate save
  const saveNow = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    performSave(latestDataRef.current);
  }, [performSave]);

  // Direct updater
  const updateData = useCallback(
    (newData: T) => {
      setData(newData);
    },
    []
  );

  // Clear draft with automatic safety backup
  const clearDraft = useCallback(() => {
    try {
      // Save current state as backup before wipe
      const current = localStorage.getItem(storageKey);
      if (current) {
        localStorage.setItem(backupKey, current);
      }
      localStorage.removeItem(storageKey);
      localStorage.removeItem(timestampKey);
      setData(defaultValue);
      setHasSavedDraft(false);
      setLastSaved(null);
    } catch (err) {
      console.warn(`[AutoSave] Failed to clear draft for "${storageKey}":`, err);
    }
  }, [storageKey, backupKey, timestampKey, defaultValue]);

  // Restore from previous backup if user cleared accidentally
  const restoreBackup = useCallback((): boolean => {
    try {
      const backup = localStorage.getItem(backupKey);
      if (backup) {
        const parsed = JSON.parse(backup) as T;
        setData(parsed);
        performSave(parsed);
        return true;
      }
    } catch (err) {
      console.warn(`[AutoSave] Failed to restore backup for "${storageKey}":`, err);
    }
    return false;
  }, [backupKey, storageKey, performSave]);

  return {
    data,
    setData,
    updateData,
    lastSaved,
    isSaving,
    hasSavedDraft,
    clearDraft,
    restoreBackup,
    saveNow,
  };
}

/**
 * Formats a Date object into a readable time string (e.g. "10:45 AM" or "Just now")
 */
export function formatSavedTime(date: Date | null, isUrdu: boolean = false): string {
  if (!date) return isUrdu ? 'محفوظ نہیں' : 'Not saved';
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 5) return isUrdu ? 'ابھی محفوظ ہوا' : 'Just now';
  if (diffSec < 60) return isUrdu ? `${diffSec} سیکنڈ پہلے` : `${diffSec}s ago`;

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
