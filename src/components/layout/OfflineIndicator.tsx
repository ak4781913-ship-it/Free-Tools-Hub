/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, X } from 'lucide-react';
import { useOnlineStatus } from '../../utils/useOnlineStatus';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { language, t } = useLanguage();
  const { syncApp, isSyncing } = useToast();
  const isUrdu = language === 'ur';
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isOnline) {
      setIsDismissed(false);
    }
  }, [isOnline]);

  if (isOnline || isDismissed) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed bottom-3 left-3 right-3 sm:right-auto rtl:sm:left-auto rtl:sm:right-4 sm:max-w-md z-40 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-600/95 text-white shadow-lg border border-amber-400/40 backdrop-blur-md text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
      </span>

      <WifiOff className="w-3.5 h-3.5 shrink-0" />

      <span className="flex-1 min-w-0 truncate">
        {isUrdu
          ? 'آف لائن موڈ فعال ہے'
          : 'Offline Mode — Cached tools active'}
      </span>

      <button
        type="button"
        onClick={syncApp}
        disabled={isSyncing}
        className="px-2.5 py-1 min-h-[30px] rounded-lg bg-white/20 hover:bg-white/30 active:scale-95 text-white text-[11px] font-bold transition-all inline-flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
        title={isUrdu ? 'کنکشن کی جانچ اور سنک کریں' : 'Check connection and sync'}
      >
        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
        <span>{isSyncing ? (isUrdu ? 'سنک...' : 'Syncing...') : (t.syncToasts?.syncNow || 'Sync')}</span>
      </button>

      <button
        type="button"
        onClick={() => setIsDismissed(true)}
        aria-label={isUrdu ? 'آف لائن بینر بند کریں' : 'Dismiss offline indicator'}
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/20 text-white/90 hover:text-white transition-colors shrink-0 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </aside>
  );
};
