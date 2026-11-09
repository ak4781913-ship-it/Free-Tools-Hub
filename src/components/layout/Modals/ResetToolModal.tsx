/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { RotateCcw, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

export interface ResetToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  toolName: string;
  isResetting?: boolean;
}

export const ResetToolModal: React.FC<ResetToolModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  toolName,
  isResetting = false,
}) => {
  const { language, dir, t } = useLanguage();
  const isUrdu = language === 'ur';
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Focus trap / auto-focus on confirm button when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 80);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isResetting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isResetting, onClose]);

  if (!isOpen) return null;

  const modalTitle = t.resetModal?.title || (isUrdu ? 'تمام ان پٹس ری سیٹ کریں؟' : 'Reset All Inputs?');
  const modalDescTemplate =
    t.resetModal?.desc ||
    (isUrdu
      ? 'کیا آپ واقعی {toolName} کے تمام خانے دوبارہ ترتیب دینا چاہتے ہیں؟ تمام درج کردہ ڈیٹا، حسابات اور ڈرافٹس واپس بنیادی حالت میں آ جائیں گے۔'
      : 'Are you sure you want to reset all inputs for {toolName}? All entered fields, calculations, and active drafts will be cleared back to defaults.');
  const modalDesc = modalDescTemplate.replace('{toolName}', toolName);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
      aria-describedby="reset-modal-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isResetting) {
          onClose();
        }
      }}
    >
      <div
        dir={dir}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isResetting}
          aria-label={isUrdu ? 'بند کریں' : 'Close'}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon + Titles */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-2xs">
            <RotateCcw className={`w-6 h-6 ${isResetting ? 'animate-spin' : ''}`} />
          </div>

          <div className="flex-1 min-w-0 pr-4 rtl:pr-0 rtl:pl-4">
            <h3
              id="reset-modal-title"
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
            >
              {modalTitle}
            </h3>
            <span className="inline-block mt-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {toolName}
            </span>
          </div>
        </div>

        {/* Description Body */}
        <p
          id="reset-modal-description"
          className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
        >
          {modalDesc}
        </p>

        {/* Warning callout card */}
        <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 leading-normal">
            {isUrdu
              ? 'موجودہ غیر محفوظ شدہ ڈیٹا ضائع ہو جائے گا۔ آپ کی پرنٹ ہسٹری اور پسندیدہ محفوظ رہیں گے۔'
              : 'Current active inputs will be cleared. Your saved favorites and print history will remain safe.'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 flex-wrap">
          <button
            type="button"
            onClick={onClose}
            disabled={isResetting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          >
            {t.resetModal?.cancel || (isUrdu ? 'منسوخ کریں' : 'Cancel')}
          </button>

          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={isResetting}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-2 disabled:opacity-60"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>
              {isResetting
                ? isUrdu
                  ? 'ری سیٹ ہو رہا ہے...'
                  : 'Resetting...'
                : t.resetModal?.confirm || (isUrdu ? 'ہاں، سب ری سیٹ کریں' : 'Reset All Inputs')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
