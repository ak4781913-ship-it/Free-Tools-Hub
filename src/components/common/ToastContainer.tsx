/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ToastItem, ToastType } from '../../types/toast';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  X,
  Sparkles,
} from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  dir?: 'ltr' | 'rtl';
}

const getToastIcon = (type: ToastType, customIcon?: React.ReactNode) => {
  if (customIcon) return customIcon;
  switch (type) {
    case 'sync':
      return <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />;
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    case 'warning':
      return <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
    case 'info':
    default:
      return <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
  }
};

const getToastBadgeStyles = (type: ToastType) => {
  switch (type) {
    case 'sync':
      return 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300';
    case 'success':
      return 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300';
    case 'warning':
      return 'bg-amber-50 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800/80 text-amber-700 dark:text-amber-300';
    case 'error':
      return 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300';
    case 'info':
    default:
      return 'bg-sky-50 dark:bg-sky-950/70 border-sky-200 dark:border-sky-800/80 text-sky-700 dark:text-sky-300';
  }
};

const getProgressBarColor = (type: ToastType) => {
  switch (type) {
    case 'sync':
      return 'bg-indigo-500';
    case 'success':
      return 'bg-emerald-500';
    case 'warning':
      return 'bg-amber-500';
    case 'error':
      return 'bg-rose-500';
    case 'info':
    default:
      return 'bg-sky-500';
  }
};

interface ToastItemComponentProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const ToastItemComponent: React.FC<ToastItemComponentProps> = ({ toast, onDismiss }) => {
  const duration = toast.duration ?? 5000;
  const isAutoDismiss = duration > 0;
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(duration);

  useEffect(() => {
    remainingTimeRef.current = duration;
    setProgress(100);
  }, [toast.timestamp, duration]);

  useEffect(() => {
    if (!isAutoDismiss) return;

    let animFrame: number;
    let lastTick = Date.now();

    const tick = () => {
      if (!isPaused) {
        const now = Date.now();
        const delta = now - lastTick;
        remainingTimeRef.current -= delta;

        const nextPercent = Math.max(0, (remainingTimeRef.current / duration) * 100);
        setProgress(nextPercent);

        if (remainingTimeRef.current <= 0) {
          onDismiss(toast.id);
          return;
        }
      }
      lastTick = Date.now();
      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animFrame);
  }, [toast.id, duration, isAutoDismiss, isPaused, onDismiss]);

  if (toast.compact) {
    return (
      <div
        data-testid="toast-notification"
        data-toast-type={toast.type}
        role={toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status'}
        aria-live="polite"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="pointer-events-auto relative w-full max-w-[calc(100vw-1.5rem)] sm:w-auto sm:min-w-[240px] sm:max-w-sm rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-lg px-3 py-2.5 transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 overflow-hidden select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${getToastBadgeStyles(
              toast.type
            )}`}
          >
            {getToastIcon(toast.type, toast.icon)}
          </div>

          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {toast.title}
            </h5>
            {toast.message && (
              <p className="text-[11px] text-slate-600 dark:text-slate-300 tabular-nums truncate">
                {toast.message}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="inline-flex items-center justify-center w-8 h-8 -mr-1 rtl:mr-0 rtl:-ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isAutoDismiss && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full transition-all duration-75 ease-linear ${getProgressBarColor(
                toast.type
              )}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      data-testid="toast-notification"
      data-toast-type={toast.type}
      role={toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status'}
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      className="pointer-events-auto relative w-full max-w-full sm:max-w-sm rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xl p-3.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 overflow-hidden group select-none"
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {/* Icon Badge */}
        <div
          className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${getToastBadgeStyles(
            toast.type
          )}`}
        >
          {getToastIcon(toast.type, toast.icon)}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {toast.title}
            </h5>
            <span className="hidden xs:inline text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
              {new Date(toast.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {toast.message && (
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words">
              {toast.message}
            </p>
          )}

          {/* Action Button */}
          {toast.action && (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  onDismiss(toast.id);
                }}
                className={`px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  toast.action.isPrimary
                    ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                {toast.action.label}
              </button>
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="inline-flex items-center justify-center w-8 h-8 -mr-1 rtl:mr-0 rtl:-ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Auto-Dismiss Progress Bar */}
      {isAutoDismiss && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full transition-all duration-75 ease-linear ${getProgressBarColor(
              toast.type
            )}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  dir = 'ltr',
}) => {
  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="System notifications"
      className={`fixed bottom-3 sm:bottom-5 z-50 flex flex-col gap-2 pointer-events-none left-3 right-3 sm:w-full sm:max-w-sm no-print ${
        dir === 'rtl'
          ? 'sm:left-5 sm:right-auto items-start'
          : 'sm:right-5 sm:left-auto items-end'
      }`}
    >
      {toasts.map((toast) => (
        <ToastItemComponent key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </aside>
  );
};
