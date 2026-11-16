/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface GoogleLoginButtonProps {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'header' | 'full';
  label?: string;
  compactLabel?: string;
  className?: string;
}

const GoogleMark: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
    />
  </svg>
);

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onClick,
  loading = false,
  disabled = false,
  variant = 'full',
  label = 'Sign in with Google',
  compactLabel = 'Sign in',
  className = '',
}) => {
  const isDisabled = disabled || loading;

  if (variant === 'header') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isDisabled}
        aria-label={label}
        className={`inline-flex items-center justify-center gap-2 h-9 px-2.5 sm:px-3.5 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 dark:bg-white dark:hover:bg-slate-100 text-slate-800 border border-slate-300 dark:border-slate-300 text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0 ${className}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
        ) : (
          <GoogleMark className="w-4 h-4 shrink-0" />
        )}
        <span className="hidden sm:inline truncate">{label}</span>
        <span className="sm:hidden truncate">{compactLabel}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`w-full inline-flex items-center justify-center gap-3 h-11 px-4 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 dark:bg-white dark:hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-xs text-sm font-semibold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-blue-600 shrink-0" />
      ) : (
        <GoogleMark className="w-5 h-5 shrink-0" />
      )}
      <span>{loading ? 'Connecting to Google...' : label}</span>
    </button>
  );
};
