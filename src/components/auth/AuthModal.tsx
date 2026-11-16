/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  Cloud,
  ExternalLink,
  History,
  Layers,
  ShieldCheck,
  Target,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { GoogleLoginButton } from './GoogleLoginButton';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    isConfigured,
    authActionLoading,
    authError,
    authErrorDetails,
    pendingConflict,
    syncStatus,
    signInWithGoogle,
    signInWithGoogleRedirect,
    resolveSyncConflict,
  } = useAuth();
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !authActionLoading && syncStatus !== 'syncing') {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isAuthModalOpen, authActionLoading, syncStatus, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => {
        if (!authActionLoading && syncStatus !== 'syncing') {
          closeAuthModal();
        }
      }}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-700/20">
              {pendingConflict ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Cloud className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                NEXORA · FreeTools Hub
              </p>
              <h2
                id="auth-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate"
              >
                {pendingConflict
                  ? isUrdu
                    ? 'کلاؤڈ اور مقامی ڈیٹا کا انتخاب'
                    : 'Choose How to Sync Your Data'
                  : isUrdu
                  ? 'اپنے گوگل اکاؤنٹ سے سائن ان کریں'
                  : 'Sign in with Google'}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={closeAuthModal}
            disabled={authActionLoading || syncStatus === 'syncing'}
            aria-label="Close sign in dialog"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Conflict Resolution Mode */}
        {pendingConflict ? (
          <div className="p-5 sm:p-6 space-y-4">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {isUrdu
                ? 'آپ کے گوگل اکاؤنٹ میں پہلے سے محفوظ ڈیٹا موجود ہے، اور اس براؤزر میں بھی نئی مقامی تبدیلیاں موجود ہیں۔ کوئی بھی ڈیٹا ضائع ہوئے بغیر طریقہ منتخب کریں:'
                : 'Your Google account already has saved cloud workspace data, and this browser also has guest activity. Choose how to proceed without overwriting anything silently:'}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1.5">
                <p className="font-bold text-slate-900 dark:text-white">
                  {isUrdu ? 'مقامی براؤزر' : 'This Browser'}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  {pendingConflict.localSnapshot.favorites.length}{' '}
                  {isUrdu ? 'پسندیدہ' : 'favorites'}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  {pendingConflict.localSnapshot.history.length}{' '}
                  {isUrdu ? 'حالیہ ٹولز' : 'recent tools'}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  {pendingConflict.localSnapshot.savedPrompts.length}{' '}
                  {isUrdu ? 'محفوظ پرامپٹس' : 'saved prompts'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 space-y-1.5">
                <p className="font-bold text-blue-900 dark:text-blue-300">
                  {isUrdu ? 'گوگل کلاؤڈ' : 'Cloud Account'}
                </p>
                <p className="text-blue-800/80 dark:text-blue-300/80">
                  {pendingConflict.cloudSnapshot.favorites.length}{' '}
                  {isUrdu ? 'پسندیدہ' : 'favorites'}
                </p>
                <p className="text-blue-800/80 dark:text-blue-300/80">
                  {pendingConflict.cloudSnapshot.history.length}{' '}
                  {isUrdu ? 'حالیہ ٹولز' : 'recent tools'}
                </p>
                <p className="text-blue-800/80 dark:text-blue-300/80">
                  {pendingConflict.cloudSnapshot.savedPrompts.length}{' '}
                  {isUrdu ? 'محفوظ پرامپٹس' : 'saved prompts'}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                disabled={syncStatus === 'syncing'}
                onClick={() => resolveSyncConflict('merge')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span>
                  {isUrdu
                    ? 'دونوں کو محفوظ طریقے سے ضم کریں (تجویز کردہ)'
                    : 'Merge Local & Cloud Data (Recommended)'}
                </span>
              </button>

              <button
                type="button"
                disabled={syncStatus === 'syncing'}
                onClick={() => resolveSyncConflict('use-cloud')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                {isUrdu
                  ? 'صرف کلاؤڈ اکاؤنٹ ڈیٹا لوڈ کریں'
                  : 'Keep Existing Cloud Account Data'}
              </button>

              <button
                type="button"
                disabled={syncStatus === 'syncing'}
                onClick={() => resolveSyncConflict('use-local')}
                className="w-full px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-950/30 text-xs font-medium transition-colors cursor-pointer disabled:opacity-60"
              >
                {isUrdu
                  ? 'اس براؤزر کے ڈیٹا سے کلاؤڈ کو اپ ڈیٹ کریں'
                  : 'Replace Cloud Data with This Browser'}
              </button>
            </div>
          </div>
        ) : (
          /* Body: Standard Google Sign-In Interface */
          <div className="p-5 sm:p-6 space-y-5">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {isUrdu
                ? 'تمام 28 ٹولز بغیر لاگ ان کے 100٪ مفت کام کرتے ہیں۔ مختلف ڈیوائسز پر اپنے پسندیدہ ٹولز، یومیہ ہدف، ہسٹری اور محفوظ پرامپٹس سنک کرنے کے لیے گوگل اکاؤنٹ سے سائن ان کریں۔'
                : 'Sign in optionally to sync your pinned favorites, recent tools history, daily goals, and saved items securely across devices under your Google account.'}
            </p>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 gap-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Bookmark className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  {isUrdu
                    ? 'پسندیدہ ٹولز، رنگ پیلیٹ اور محفوظ پرامپٹس سنک کریں'
                    : 'Sync pinned favorites, color palettes & saved prompts'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  {isUrdu
                    ? 'روزمرہ ہدف، اسٹریک اور 7 دن کی ہسٹری محفوظ رکھیں'
                    : 'Preserve daily goals, streaks & usage analytics'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  {isUrdu
                    ? 'تھیم، زبان اور حالیہ ٹولز خودکار بحال کریں'
                    : 'Restore theme, language & recent tools anywhere'}
                </span>
              </div>
            </div>

            {!isConfigured && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/70 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-bold">
                    {isUrdu ? 'Firebase ترتیب درکار ہے' : 'Firebase Not Configured'}
                  </p>
                  <p className="mt-0.5 leading-relaxed opacity-90">
                    {isUrdu
                      ? 'اس انوائرنمنٹ میں VITE_FIREBASE_* متغیرات سیٹ نہیں ہیں۔ آپ گیسٹ کے طور پر تمام ٹولز استعمال کر سکتے ہیں۔'
                      : 'Firebase client credentials are missing in this environment. Add your VITE_FIREBASE_* environment variables to enable Google Sign-In.'}
                  </p>
                </div>
              </div>
            )}

            {authError && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 space-y-2 text-xs text-red-700 dark:text-red-300"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{authError}</span>
                </div>

                {authErrorDetails && (
                  <div className="pt-2 border-t border-red-200/70 dark:border-red-900/60 space-y-1 text-[11px] font-mono text-red-800/90 dark:text-red-200/90">
                    <div>
                      <span className="font-bold">Code:</span> {authErrorDetails.code} ·{' '}
                      <span className="font-bold">Flow:</span> {authErrorDetails.operation} ({authErrorDetails.flow})
                    </div>
                    <div className="break-all">
                      <span className="font-bold">Host:</span> {authErrorDetails.hostname || 'unknown'} ·{' '}
                      <span className="font-bold">AuthDomain:</span> {authErrorDetails.authDomain || 'unset'}
                    </div>
                    <div>
                      <span className="font-bold">Config:</span>{' '}
                      {authErrorDetails.isConfigured ? `loaded (${authErrorDetails.configSource})` : 'missing'} ·{' '}
                      <span className="font-bold">Project:</span> {authErrorDetails.projectId || 'unset'}
                    </div>
                    <p className="font-sans text-[11px] leading-relaxed text-red-700 dark:text-red-300 pt-0.5">
                      {authErrorDetails.diagnosticHint}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <GoogleLoginButton
                variant="full"
                loading={authActionLoading}
                disabled={!isConfigured}
                onClick={signInWithGoogle}
                label={isUrdu ? 'گوگل کے ساتھ سائن ان کریں' : 'Sign in with Google'}
              />

              {isConfigured && (
                <button
                  type="button"
                  disabled={authActionLoading}
                  onClick={signInWithGoogleRedirect}
                  className={`w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                    authErrorDetails?.popupBlocked
                      ? 'bg-blue-700 hover:bg-blue-800 text-white font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>
                    {isUrdu
                      ? 'پاپ اپ بلاک ہونے کی صورت میں ری ڈائریکٹ استعمال کریں'
                      : 'Popup blocked? Sign in via browser redirect'}
                  </span>
                </button>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {isUrdu ? 'ہر صارف کا ڈیٹا UID سے محفوظ' : 'Private per-user UID isolation'}
                </span>
              </span>
              <button
                type="button"
                onClick={closeAuthModal}
                className="font-semibold text-slate-700 dark:text-slate-300 hover:underline cursor-pointer shrink-0"
              >
                {isUrdu ? 'بطور گیسٹ جاری رکھیں' : 'Continue as Guest'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
