/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { User } from 'firebase/auth';
import {
  Timestamp,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { DEFAULT_FAVORITES, HistoryEntry } from '../context/FavoritesContext';
import { OperationType, db, handleFirestoreError } from '../firebase/firebase';
import { getTodayDateString } from '../utils/dailyGoalTracking';

export const WORKSPACE_HYDRATED_EVENT = 'freetools_cloud_hydrated';
export const WORKSPACE_MUTATED_EVENT = 'freetools_workspace_mutated';
export const LAST_SYNCED_UID_KEY = 'freetools_hub_last_synced_uid';
const PENDING_SYNC_PREFIX = 'freetools_hub_pending_sync_';

const DEFAULT_SAVED_COLORS = [
  '#2563EB',
  '#4F46E5',
  '#0EA5E9',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#1E293B',
];

export interface SavedColorEntry {
  hex: string;
  label: string;
  timestamp: number;
}

export interface SavedPromptEntry {
  title: string;
  prompt: string;
  date: string;
}

export interface SyncedPrintHistoryItem {
  id: string;
  title: string;
  toolId: string;
  toolName: string;
  timestamp: string;
  formattedDate: string;
  format: string;
}

export interface WorkspaceSyncSnapshot {
  theme: 'light' | 'dark';
  language: 'en' | 'ur';
  sidebarCollapsed: boolean;
  favorites: string[];
  recentTools: string[];
  history: HistoryEntry[];
  dailyGoal: number;
  dailyProgress: {
    date: string;
    toolsUsed: string[];
  };
  streakData: {
    lastCompletedDate: string;
    streakCount: number;
  };
  dailyHistory: Record<string, number>;
  savedColors: string[];
  recentColors: SavedColorEntry[];
  savedPrompts: SavedPromptEntry[];
  printHistory: SyncedPrintHistoryItem[];
}

export interface CloudWorkspaceRecord {
  snapshot: WorkspaceSyncSnapshot;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
}

function clampString(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.slice(0, maxLen);
}

/**
 * Strictly sanitizes any snapshot so every field matches firestore.rules & firebase-blueprint.json invariants.
 */
export function sanitizeWorkspaceSnapshot(raw: Partial<WorkspaceSyncSnapshot>): WorkspaceSyncSnapshot {
  const theme: 'light' | 'dark' = raw.theme === 'dark' ? 'dark' : 'light';
  const language: 'en' | 'ur' = raw.language === 'ur' ? 'ur' : 'en';
  const sidebarCollapsed = Boolean(raw.sidebarCollapsed);

  const rawFavs = Array.isArray(raw.favorites) ? raw.favorites : [];
  const favorites = Array.from(
    new Set(
      rawFavs
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .map((x) => clampString(x.trim(), 64))
    )
  ).slice(0, 50);

  const rawHistory = Array.isArray(raw.history) ? raw.history : [];
  const seenHistoryIds = new Set<string>();
  const history: HistoryEntry[] = [];
  for (const item of rawHistory) {
    if (!item || typeof item !== 'object') continue;
    const toolId = clampString((item as HistoryEntry).toolId, 64).trim();
    if (!toolId || seenHistoryIds.has(toolId)) continue;
    seenHistoryIds.add(toolId);
    const ts = Number((item as HistoryEntry).timestamp);
    const vc = Number((item as HistoryEntry).visitCount);
    history.push({
      toolId,
      timestamp: Number.isFinite(ts) && ts > 0 ? Math.round(ts) : Date.now(),
      visitCount: Number.isFinite(vc) && vc >= 1 ? Math.round(vc) : 1,
    });
    if (history.length >= 25) break;
  }

  const rawRecents = Array.isArray(raw.recentTools)
    ? raw.recentTools
    : history.map((h) => h.toolId);
  const recentTools = Array.from(
    new Set(
      rawRecents
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .map((x) => clampString(x.trim(), 64))
    )
  ).slice(0, 25);

  const rawGoal = Number(raw.dailyGoal);
  const dailyGoal = Number.isFinite(rawGoal)
    ? Math.max(1, Math.min(20, Math.round(rawGoal)))
    : 5;

  const today = getTodayDateString();
  const rawProgressDate = clampString(raw.dailyProgress?.date, 16) || today;
  const rawToolsToday = Array.isArray(raw.dailyProgress?.toolsUsed)
    ? raw.dailyProgress!.toolsUsed
    : [];
  const toolsUsed = Array.from(
    new Set(
      rawToolsToday
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .map((x) => clampString(x.trim(), 64))
    )
  ).slice(0, 30);

  const lastCompletedDate = clampString(raw.streakData?.lastCompletedDate, 16);
  const rawStreakCount = Number(raw.streakData?.streakCount);
  const streakCount = Number.isFinite(rawStreakCount)
    ? Math.max(0, Math.min(36500, Math.round(rawStreakCount)))
    : 0;

  const dailyHistory: Record<string, number> = {};
  if (raw.dailyHistory && typeof raw.dailyHistory === 'object') {
    const sortedKeys = Object.keys(raw.dailyHistory)
      .filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k))
      .sort()
      .slice(-60);
    for (const k of sortedKeys) {
      const val = Number(raw.dailyHistory[k]);
      if (Number.isFinite(val) && val >= 0) {
        dailyHistory[k] = Math.min(100, Math.round(val));
      }
    }
  }

  const rawColors = Array.isArray(raw.savedColors) ? raw.savedColors : [];
  const savedColors = Array.from(
    new Set(
      rawColors
        .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
        .map((c) => clampString(c.trim().toUpperCase(), 32))
    )
  ).slice(0, 40);

  const recentColors: SavedColorEntry[] = [];
  if (Array.isArray(raw.recentColors)) {
    for (const rc of raw.recentColors) {
      if (!rc || typeof rc !== 'object') continue;
      const hex = clampString((rc as SavedColorEntry).hex, 32).trim().toUpperCase();
      if (!hex) continue;
      recentColors.push({
        hex,
        label: clampString((rc as SavedColorEntry).label || hex, 64),
        timestamp: Number.isFinite(Number((rc as SavedColorEntry).timestamp))
          ? Math.round(Number((rc as SavedColorEntry).timestamp))
          : Date.now(),
      });
      if (recentColors.length >= 40) break;
    }
  }

  const savedPrompts: SavedPromptEntry[] = [];
  if (Array.isArray(raw.savedPrompts)) {
    for (const sp of raw.savedPrompts) {
      if (!sp || typeof sp !== 'object') continue;
      const promptText = clampString((sp as SavedPromptEntry).prompt, 2000).trim();
      if (!promptText) continue;
      savedPrompts.push({
        title: clampString((sp as SavedPromptEntry).title || 'Photo Prompt', 120),
        prompt: promptText,
        date: clampString((sp as SavedPromptEntry).date || new Date().toISOString(), 40),
      });
      if (savedPrompts.length >= 40) break;
    }
  }

  const printHistory: SyncedPrintHistoryItem[] = [];
  if (Array.isArray(raw.printHistory)) {
    for (const ph of raw.printHistory) {
      if (!ph || typeof ph !== 'object') continue;
      const id = clampString((ph as SyncedPrintHistoryItem).id, 80).trim();
      if (!id) continue;
      printHistory.push({
        id,
        title: clampString((ph as SyncedPrintHistoryItem).title || 'Untitled Document', 200),
        toolId: clampString((ph as SyncedPrintHistoryItem).toolId || 'resume-builder', 64),
        toolName: clampString((ph as SyncedPrintHistoryItem).toolName || 'Online Utility', 100),
        timestamp: clampString((ph as SyncedPrintHistoryItem).timestamp || new Date().toISOString(), 40),
        formattedDate: clampString((ph as SyncedPrintHistoryItem).formattedDate || '', 64),
        format: clampString((ph as SyncedPrintHistoryItem).format || 'A4 Document', 64),
      });
      if (printHistory.length >= 10) break;
    }
  }

  return {
    theme,
    language,
    sidebarCollapsed,
    favorites,
    recentTools,
    history,
    dailyGoal,
    dailyProgress: {
      date: rawProgressDate,
      toolsUsed,
    },
    streakData: {
      lastCompletedDate,
      streakCount,
    },
    dailyHistory,
    savedColors,
    recentColors,
    savedPrompts,
    printHistory,
  };
}

export function readLocalWorkspaceSnapshot(): WorkspaceSyncSnapshot {
  const themeRaw = localStorage.getItem('freetools_hub_theme');
  const langRaw = localStorage.getItem('freetools_hub_lang');
  const sidebarRaw =
    localStorage.getItem('freetools_hub_sidebar_collapsed') ??
    localStorage.getItem('abbaspro_sidebar_collapsed');
  const sidebarCollapsed = sidebarRaw === 'true';

  const favorites = safeReadJson<string[]>('freetools_hub_favorites', DEFAULT_FAVORITES);
  const history = safeReadJson<HistoryEntry[]>('freetools_hub_history', []);
  const recentTools = safeReadJson<string[]>(
    'freetools_hub_recents',
    history.map((h) => h.toolId)
  );

  const rawGoal = parseInt(localStorage.getItem('freetools_hub_daily_goal') || '5', 10);
  const dailyGoal = Number.isNaN(rawGoal) ? 5 : rawGoal;
  const dailyProgress = safeReadJson<{ date: string; toolsUsed: string[] }>(
    'freetools_hub_daily_progress',
    { date: getTodayDateString(), toolsUsed: [] }
  );
  const streakData = safeReadJson<{ lastCompletedDate: string; streakCount: number }>(
    'freetools_hub_streak_data',
    { lastCompletedDate: '', streakCount: 0 }
  );
  const dailyHistory = safeReadJson<Record<string, number>>('freetools_hub_daily_history', {});

  const savedColors = safeReadJson<string[]>('freetools_color_palette', DEFAULT_SAVED_COLORS);
  const recentColors = safeReadJson<SavedColorEntry[]>('freetools_recent_colors', []);
  const savedPrompts = safeReadJson<SavedPromptEntry[]>('freetools_saved_photo_prompts', []);
  const printHistory = safeReadJson<SyncedPrintHistoryItem[]>('freetools_hub_print_history', []);

  return sanitizeWorkspaceSnapshot({
    theme: themeRaw === 'dark' ? 'dark' : 'light',
    language: langRaw === 'ur' ? 'ur' : 'en',
    sidebarCollapsed,
    favorites,
    recentTools,
    history,
    dailyGoal,
    dailyProgress,
    streakData,
    dailyHistory,
    savedColors,
    recentColors,
    savedPrompts,
    printHistory,
  });
}

export function applyWorkspaceSnapshotToLocal(snapshot: WorkspaceSyncSnapshot): void {
  const clean = sanitizeWorkspaceSnapshot(snapshot);
  try {
    localStorage.setItem('freetools_hub_theme', clean.theme);
    localStorage.setItem('freetools_hub_lang', clean.language);
    localStorage.setItem('freetools_hub_sidebar_collapsed', String(clean.sidebarCollapsed));
    localStorage.removeItem('abbaspro_sidebar_collapsed');
    localStorage.setItem('freetools_hub_favorites', JSON.stringify(clean.favorites));
    localStorage.setItem('freetools_hub_history', JSON.stringify(clean.history));
    localStorage.setItem('freetools_hub_recents', JSON.stringify(clean.recentTools));
    localStorage.setItem('freetools_hub_recent_tools', JSON.stringify(clean.recentTools.slice(0, 5)));
    localStorage.setItem('freetools_hub_daily_goal', String(clean.dailyGoal));
    localStorage.setItem('freetools_hub_daily_progress', JSON.stringify(clean.dailyProgress));
    localStorage.setItem('freetools_hub_streak_data', JSON.stringify(clean.streakData));
    localStorage.setItem('freetools_hub_daily_history', JSON.stringify(clean.dailyHistory));
    if (clean.savedColors.length > 0) {
      localStorage.setItem('freetools_color_palette', JSON.stringify(clean.savedColors));
    }
    if (clean.recentColors.length > 0) {
      localStorage.setItem('freetools_recent_colors', JSON.stringify(clean.recentColors));
    }
    localStorage.setItem('freetools_saved_photo_prompts', JSON.stringify(clean.savedPrompts));
    localStorage.setItem('freetools_hub_print_history', JSON.stringify(clean.printHistory));
  } catch (err) {
    console.warn('[Sync] Failed to apply snapshot to localStorage:', err);
  }

  dispatchHydrationEvents();
}

export function dispatchHydrationEvents(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(WORKSPACE_HYDRATED_EVENT));
  window.dispatchEvent(new CustomEvent('freetools_daily_goal_updated'));
  window.dispatchEvent(new CustomEvent('freetools_print_history_changed'));
}

export function notifyWorkspaceMutated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(WORKSPACE_MUTATED_EVENT));
}

/**
 * Determines whether the local browser has meaningful user modifications beyond starter defaults.
 */
export function hasCustomLocalWorkspaceData(local: WorkspaceSyncSnapshot): boolean {
  const defaultFavSet = new Set(DEFAULT_FAVORITES);
  const favsDiffer =
    local.favorites.length !== DEFAULT_FAVORITES.length ||
    local.favorites.some((id) => !defaultFavSet.has(id));

  if (favsDiffer) return true;
  if (local.dailyGoal !== 5) return true;
  if (local.dailyProgress.toolsUsed.length > 0) return true;
  if (local.streakData.streakCount > 0) return true;
  if (Object.values(local.dailyHistory).some((v) => v > 0)) return true;
  if (local.savedPrompts.length > 0) return true;
  if (local.printHistory.length > 0) return true;

  const defaultColorsSet = new Set(DEFAULT_SAVED_COLORS);
  const colorsDiffer =
    local.savedColors.length > 0 &&
    (local.savedColors.length !== DEFAULT_SAVED_COLORS.length ||
      local.savedColors.some((c) => !defaultColorsSet.has(c)));
  if (colorsDiffer) return true;

  if (local.language === 'ur') return true;

  return false;
}

/**
 * Safely merges local guest activity with existing cloud account data without losing either side's saved items.
 */
export function mergeWorkspaceSnapshots(
  local: WorkspaceSyncSnapshot,
  cloud: WorkspaceSyncSnapshot
): WorkspaceSyncSnapshot {
  const mergedFavorites = Array.from(new Set([...cloud.favorites, ...local.favorites])).slice(0, 50);

  const historyMap = new Map<string, HistoryEntry>();
  for (const item of [...cloud.history, ...local.history]) {
    const existing = historyMap.get(item.toolId);
    if (!existing) {
      historyMap.set(item.toolId, { ...item });
    } else {
      historyMap.set(item.toolId, {
        toolId: item.toolId,
        timestamp: Math.max(existing.timestamp, item.timestamp),
        visitCount: Math.max(existing.visitCount, item.visitCount),
      });
    }
  }
  const mergedHistory = Array.from(historyMap.values())
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 25);

  const today = getTodayDateString();
  const localTodayTools = local.dailyProgress.date === today ? local.dailyProgress.toolsUsed : [];
  const cloudTodayTools = cloud.dailyProgress.date === today ? cloud.dailyProgress.toolsUsed : [];
  const mergedToolsUsedToday = Array.from(new Set([...cloudTodayTools, ...localTodayTools])).slice(0, 30);

  const mergedDailyHistory: Record<string, number> = { ...cloud.dailyHistory };
  for (const [date, count] of Object.entries(local.dailyHistory)) {
    mergedDailyHistory[date] = Math.max(mergedDailyHistory[date] || 0, count);
  }
  if (mergedToolsUsedToday.length > 0) {
    mergedDailyHistory[today] = Math.max(mergedDailyHistory[today] || 0, mergedToolsUsedToday.length);
  }

  const mergedStreak =
    local.streakData.streakCount > cloud.streakData.streakCount
      ? local.streakData
      : cloud.streakData;

  const mergedColors = Array.from(new Set([...cloud.savedColors, ...local.savedColors])).slice(0, 40);

  const colorMap = new Map<string, SavedColorEntry>();
  for (const c of [...cloud.recentColors, ...local.recentColors]) {
    const prev = colorMap.get(c.hex);
    if (!prev || c.timestamp > prev.timestamp) {
      colorMap.set(c.hex, c);
    }
  }
  const mergedRecentColors = Array.from(colorMap.values())
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 40);

  const promptMap = new Map<string, SavedPromptEntry>();
  for (const p of [...cloud.savedPrompts, ...local.savedPrompts]) {
    const key = `${p.title}::${p.prompt}`;
    if (!promptMap.has(key)) {
      promptMap.set(key, p);
    }
  }
  const mergedPrompts = Array.from(promptMap.values()).slice(0, 40);

  const printMap = new Map<string, SyncedPrintHistoryItem>();
  for (const ph of [...cloud.printHistory, ...local.printHistory]) {
    if (!printMap.has(ph.id)) {
      printMap.set(ph.id, ph);
    }
  }
  const mergedPrintHistory = Array.from(printMap.values())
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 10);

  return sanitizeWorkspaceSnapshot({
    theme: cloud.theme,
    language: cloud.language,
    sidebarCollapsed: cloud.sidebarCollapsed,
    favorites: mergedFavorites,
    recentTools: mergedHistory.map((h) => h.toolId),
    history: mergedHistory,
    dailyGoal: cloud.dailyGoal || local.dailyGoal,
    dailyProgress: {
      date: today,
      toolsUsed: mergedToolsUsedToday,
    },
    streakData: mergedStreak,
    dailyHistory: mergedDailyHistory,
    savedColors: mergedColors,
    recentColors: mergedRecentColors,
    savedPrompts: mergedPrompts,
    printHistory: mergedPrintHistory,
  });
}

/**
 * Clears user-scoped synced items when signing out so switching Google accounts never leaks personal data across users.
 */
export function clearSyncedUserWorkspaceOnSignOut(): void {
  try {
    localStorage.removeItem(LAST_SYNCED_UID_KEY);
    localStorage.setItem('freetools_hub_favorites', JSON.stringify(DEFAULT_FAVORITES));
    localStorage.setItem('freetools_hub_history', JSON.stringify([]));
    localStorage.setItem('freetools_hub_recents', JSON.stringify([]));
    localStorage.setItem('freetools_hub_recent_tools', JSON.stringify([]));
    localStorage.setItem('freetools_hub_daily_goal', '5');
    localStorage.setItem(
      'freetools_hub_daily_progress',
      JSON.stringify({ date: getTodayDateString(), toolsUsed: [] })
    );
    localStorage.setItem(
      'freetools_hub_streak_data',
      JSON.stringify({ lastCompletedDate: '', streakCount: 0 })
    );
    localStorage.setItem('freetools_hub_daily_history', JSON.stringify({}));
    localStorage.setItem('freetools_saved_photo_prompts', JSON.stringify([]));
    localStorage.setItem('freetools_hub_print_history', JSON.stringify([]));
    localStorage.setItem('freetools_color_palette', JSON.stringify(DEFAULT_SAVED_COLORS));
    localStorage.removeItem('freetools_recent_colors');
    localStorage.removeItem('abbaspro_sidebar_collapsed');
  } catch {
    // ignore
  }
  dispatchHydrationEvents();
}

export function savePendingOfflineSnapshot(uid: string, snapshot: WorkspaceSyncSnapshot): void {
  try {
    localStorage.setItem(`${PENDING_SYNC_PREFIX}${uid}`, JSON.stringify(sanitizeWorkspaceSnapshot(snapshot)));
  } catch {
    // ignore
  }
}

export function getPendingOfflineSnapshot(uid: string): WorkspaceSyncSnapshot | null {
  try {
    const raw = localStorage.getItem(`${PENDING_SYNC_PREFIX}${uid}`);
    if (!raw) return null;
    return sanitizeWorkspaceSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearPendingOfflineSnapshot(uid: string): void {
  try {
    localStorage.removeItem(`${PENDING_SYNC_PREFIX}${uid}`);
  } catch {
    // ignore
  }
}

function isOfflineOrUnavailableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes('offline') ||
    msg.includes('unavailable') ||
    msg.includes('network') ||
    msg.includes('failed to get document because the client is offline')
  );
}

/**
 * Ensures root ownership anchor exists at /users/{uid}.
 */
export async function ensureUserAccountRoot(uid: string): Promise<void> {
  if (!db) return;
  const docPath = `users/${uid}`;
  const ref = doc(db, 'users', uid);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        syncVersion: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const existingData = snap.data();
      const rawSyncVersion = Number(existingData?.syncVersion);
      const safeSyncVersion =
        Number.isInteger(rawSyncVersion) && rawSyncVersion >= 1 && rawSyncVersion <= 10
          ? rawSyncVersion
          : 1;
      await updateDoc(ref, {
        syncVersion: safeSyncVersion,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    if (isOfflineOrUnavailableError(err)) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

/**
 * Saves isolated PII profile at /users/{uid}/private/profile.
 */
export async function syncPrivateUserProfile(user: User): Promise<void> {
  if (!db) return;
  const docPath = `users/${user.uid}/private/profile`;
  const ref = doc(db, 'users', user.uid, 'private', 'profile');

  const payload = {
    email: clampString(user.email || '', 254),
    displayName: clampString(user.displayName || 'FreeTools User', 120),
    photoURL: clampString(user.photoURL || '', 1000),
    providerId: clampString(user.providerData?.[0]?.providerId || 'google.com', 64),
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, payload);
    }
  } catch (err) {
    if (isOfflineOrUnavailableError(err)) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}

/**
 * Reads user workspace document from /users/{uid}/workspace/state.
 */
export async function fetchCloudWorkspaceState(uid: string): Promise<CloudWorkspaceRecord | null> {
  if (!db) return null;
  const docPath = `users/${uid}/workspace/state`;
  const ref = doc(db, 'users', uid, 'workspace', 'state');

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return null;
    }
    const data = snap.data();
    return {
      snapshot: sanitizeWorkspaceSnapshot(data as Partial<WorkspaceSyncSnapshot>),
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : null,
    };
  } catch (err) {
    if (isOfflineOrUnavailableError(err)) {
      throw err;
    }
    handleFirestoreError(err, OperationType.GET, docPath);
  }
}

/**
 * Writes sanitized workspace state to /users/{uid}/workspace/state.
 */
export async function saveCloudWorkspaceState(
  uid: string,
  snapshot: WorkspaceSyncSnapshot
): Promise<void> {
  if (!db) return;
  const docPath = `users/${uid}/workspace/state`;
  const ref = doc(db, 'users', uid, 'workspace', 'state');
  const clean = sanitizeWorkspaceSnapshot(snapshot);

  try {
    const existingSnap = await getDoc(ref);
    if (!existingSnap.exists()) {
      await setDoc(ref, {
        uid,
        ...clean,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        ...clean,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    if (isOfflineOrUnavailableError(err)) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }
}
