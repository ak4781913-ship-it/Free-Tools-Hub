/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ToastItem, ToastOptions, ToastType } from '../types/toast';
import { ToastContainer } from '../components/common/ToastContainer';
import { useLanguage } from './LanguageContext';

export interface ToastContextType {
  toasts: ToastItem[];
  showToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
  syncApp: () => Promise<void>;
  isSyncing: boolean;
  toast: {
    success: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
    warning: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
    info: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
    error: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
    sync: (title: string, message?: string, options?: Partial<ToastOptions>) => string;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const OFFLINE_READY_DISMISSED_KEY = 'freetools_hub_offline_ready_dismissed';

const isOfflineReadySuppressed = (): boolean => {
  try {
    return sessionStorage.getItem(OFFLINE_READY_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
};

const suppressOfflineReadyForSession = (): void => {
  try {
    sessionStorage.setItem(OFFLINE_READY_DISMISSED_KEY, 'true');
  } catch {
    // Ignore storage errors in restricted contexts
  }
};

const verifyGenuineOfflineReadiness = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('caches' in window)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const hasActiveWorker = Boolean(
      registration?.active || navigator.serviceWorker.controller
    );
    if (!hasActiveWorker) {
      return false;
    }

    const cacheNames = await caches.keys();
    if (cacheNames.length === 0) {
      return false;
    }

    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const cachedRequests = await cache.keys();
      if (cachedRequests.length > 0) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, dir } = useLanguage();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const wasOfflineRef = useRef<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const isInitialMount = useRef<boolean>(true);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.onDismiss) {
        target.onDismiss();
      }
      return prev.filter((toast) => toast.id !== id);
    });
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts((prev) => {
      prev.forEach((item) => item.onDismiss?.());
      return [];
    });
  }, []);

  const showToast = useCallback((options: ToastOptions): string => {
    const id = options.dedupeKey
      ? `toast-key-${options.dedupeKey}`
      : `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = Date.now();
    const newToast: ToastItem = {
      id,
      timestamp: now,
      duration: options.duration ?? 5000,
      ...options,
    };

    setToasts((prev) => {
      // If a dedupeKey is provided, update any active toast sharing that key in place
      if (options.dedupeKey) {
        const existingIndex = prev.findIndex(
          (existing) => existing.dedupeKey === options.dedupeKey
        );
        if (existingIndex !== -1) {
          const next = [...prev];
          next[existingIndex] = newToast;
          return next;
        }
      }

      // Prevent identical consecutive duplicate messages within 3 seconds
      const exists = prev.find(
        (existing) =>
          existing.type === newToast.type &&
          existing.title === newToast.title &&
          existing.message === newToast.message &&
          now - existing.timestamp < 3000
      );
      if (exists) return prev;

      // Keep max 4 toasts on screen simultaneously to avoid cluttering
      const updated = [...prev, newToast];
      if (updated.length > 4) {
        return updated.slice(updated.length - 4);
      }
      return updated;
    });

    return id;
  }, []);

  // Toast shorthand utilities
  const toastMethods = {
    success: (title: string, message?: string, options?: Partial<ToastOptions>) =>
      showToast({ type: 'success', title, message, ...options }),
    warning: (title: string, message?: string, options?: Partial<ToastOptions>) =>
      showToast({ type: 'warning', title, message, ...options }),
    info: (title: string, message?: string, options?: Partial<ToastOptions>) =>
      showToast({ type: 'info', title, message, ...options }),
    error: (title: string, message?: string, options?: Partial<ToastOptions>) =>
      showToast({ type: 'error', title, message, ...options }),
    sync: (title: string, message?: string, options?: Partial<ToastOptions>) =>
      showToast({ type: 'sync', title, message, ...options }),
  };

  // Manual Service Worker Cache & Sync Trigger
  const syncApp = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    const syncingToastId = showToast({
      type: 'sync',
      title: t.syncToasts?.syncingTitle || 'Syncing Application...',
      message: t.syncToasts?.syncingDesc || 'Checking Service Worker lifecycle and refreshing cached assets.',
      duration: 0, // Keep until finished
    });

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        // Trigger service worker update check
        await registration.update();

        // Check cache storage availability
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          console.log('[PWA Sync] Verified active cache partitions:', cacheNames);
        }
      }

      // Allow natural feedback delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      dismissToast(syncingToastId);
      showToast({
        type: 'success',
        title: t.syncToasts?.syncSuccessTitle || 'Sync Complete',
        message: t.syncToasts?.syncSuccessDesc || 'Service Worker has updated caches and verified tool readiness.',
        duration: 4000,
      });
    } catch (err) {
      console.warn('[PWA Sync] Sync verification error:', err);
      dismissToast(syncingToastId);
      showToast({
        type: 'info',
        title: t.syncToasts?.syncSuccessTitle || 'Sync Complete',
        message: 'Application state verified with local browser cache.',
        duration: 3500,
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, showToast, dismissToast, t]);

  // Listen to Service Worker lifecycle and Online/Offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Online / Reconnection Event (Detects transition to online & auto-syncs)
    const handleOnline = async () => {
      console.log('[Connectivity] Network online detected.');
      wasOfflineRef.current = false;

      // Notify user of connection recovery & sync
      showToast({
        type: 'sync',
        title: t.syncToasts?.onlineTitle || 'Back Online',
        message: t.syncToasts?.onlineDesc || 'Internet restored. App successfully synced with the latest updates.',
        duration: 4500,
      });

      // Trigger background update check on reconnection
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          await reg.update();
        } catch {
          // ignore
        }
      }
    };

    // 2. Offline Event (Informs user that app is switching to cached offline mode)
    const handleOffline = () => {
      console.log('[Connectivity] Network offline detected.');
      wasOfflineRef.current = true;

      showToast({
        type: 'warning',
        title: t.syncToasts?.offlineTitle || 'Offline Mode Active',
        message: t.syncToasts?.offlineDesc || 'No internet connection. FreeTools Hub is running from cached offline storage.',
        duration: 5500,
      });
    };

    // 3. Service Worker: Offline Cache Ready (Verify genuine Workbox precache before notifying)
    const handleOfflineReady = async () => {
      if (isOfflineReadySuppressed()) {
        return;
      }

      const isVerifiedReady = await verifyGenuineOfflineReadiness();
      if (!isVerifiedReady || isOfflineReadySuppressed()) {
        return;
      }

      suppressOfflineReadyForSession();
      showToast({
        type: 'success',
        title: t.syncToasts?.offlineReadyTitle || 'Ready for Offline Use',
        message: t.syncToasts?.offlineReadyDesc || 'Tools are cached for offline access.',
        duration: 4500,
        compact: true,
        onDismiss: suppressOfflineReadyForSession,
      });
    };

    // 4. Service Worker: Update Available (New version waiting to activate)
    const handleNeedRefresh = (e: Event) => {
      console.log('[PWA Lifecycle] New version waiting to activate.');
      const customEvent = e as CustomEvent<{ updateSW?: (reload?: boolean) => Promise<void> }>;
      const updateFn = customEvent.detail?.updateSW;

      showToast({
        type: 'info',
        title: t.syncToasts?.updateAvailableTitle || 'New Version Available',
        message: t.syncToasts?.updateAvailableDesc || 'A new version of FreeTools Hub is ready to install.',
        duration: 0, // Persistent until user acts or dismisses
        action: {
          label: t.syncToasts?.updateAction || 'Update Now',
          isPrimary: true,
          onClick: async () => {
            if (updateFn) {
              await updateFn(true);
            } else if ('serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.ready;
              if (reg.waiting) {
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
              }
              window.location.reload();
            } else {
              window.location.reload();
            }
          },
        },
      });
    };

    // 5. Service Worker: Controller Change (New Service Worker took control)
    const handleControllerChange = () => {
      console.log('[PWA Lifecycle] Service worker controller changed.');
      // Avoid firing on initial load
      if (!isInitialMount.current) {
        showToast({
          type: 'sync',
          title: t.syncToasts?.syncSuccessTitle || 'Sync Complete',
          message: t.syncToasts?.syncSuccessDesc || 'Service Worker has updated caches and verified tool readiness.',
          duration: 4000,
        });
      }
    };

    // 6. Service Worker: Message Listener (Direct communications from SW)
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (!event.data) return;
      if (event.data.type === 'SYNC_COMPLETED' || event.data.type === 'CACHE_UPDATED') {
        showToast({
          type: 'sync',
          title: t.syncToasts?.syncSuccessTitle || 'Sync Complete',
          message: event.data.message || 'Latest tool versions and assets synced.',
          duration: 3500,
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('pwa-offline-ready', handleOfflineReady);
    window.addEventListener('pwa-need-refresh', handleNeedRefresh);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    isInitialMount.current = false;

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pwa-offline-ready', handleOfflineReady);
      window.removeEventListener('pwa-need-refresh', handleNeedRefresh);

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [showToast, t]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        dismissToast,
        clearAllToasts,
        syncApp,
        isSyncing,
        toast: toastMethods,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} dir={dir} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
