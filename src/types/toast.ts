/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'sync';

export interface ToastAction {
  label: string;
  onClick: () => void;
  isPrimary?: boolean;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // Duration in milliseconds. 0 = persistent until dismissed. Default 5000ms.
  action?: ToastAction;
  icon?: React.ReactNode;
  compact?: boolean;
  dedupeKey?: string;
  onDismiss?: () => void;
  timestamp: number;
}

export type ToastOptions = Omit<ToastItem, 'id' | 'timestamp'>;
