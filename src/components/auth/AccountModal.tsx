/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  Check,
  CheckCircle2,
  Clock,
  Cloud,
  CloudOff,
  Copy,
  FileText,
  LogOut,
  Palette,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useLanguage } from '../../context/LanguageContext';
import { TOOLS_LIST } from '../../data/tools';
import { getToolPrimaryPath } from '../../data/toolsRouting';
import { getDailyProgress } from '../../utils/dailyGoalTracking';
import { getPrintHistory, PrintHistoryItem } from '../../utils/printHistoryTracking';
import { SavedPromptEntry, notifyWorkspaceMutated } from '../../services/userSyncService';

interface AccountModalProps {
  onNavigateTo: (path: string) => void;
  onOpenSettings: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  onNavigateTo,
  onOpenSettings,
}) => {
  const {
    user,
    isAccountModalOpen,
    accountModalTab,
    openAccountModal,
    closeAccountModal,
    syncStatus,
    lastSyncedAt,
    pendingConflict,
    openAuthModal,
    syncNow,
    signOut,
    authActionLoading,
  } = useAuth();
  const { favorites, removeFavorite, recentTools } = useFavorites();
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savedPrompts, setSavedPrompts] = useState<SavedPromptEntry[]>([]);
  const [savedColors, setSavedColors] = useState<string[]>([]);
  const [printHistory, setPrintHistory] = useState<PrintHistoryItem[]>([]);

  const dailyProgress = useMemo(() => getDailyProgress(), [isAccountModalOpen, syncStatus]);

  useEffect(() => {
    if (!isAccountModalOpen) return;

    try {
      const rawPrompts = localStorage.getItem('freetools_saved_photo_prompts');
      setSavedPrompts(rawPrompts ? JSON.parse(rawPrompts) : []);
    } catch {
      setSavedPrompts([]);
    }

    try {
      const rawColors = localStorage.getItem('freetools_color_palette');
      setSavedColors(rawColors ? JSON.parse(rawColors) : []);
    } catch {
      setSavedColors([]);
    }

    setPrintHistory(getPrintHistory());
  }, [isAccountModalOpen, syncStatus]);

  useEffect(() => {
    if (!isAccountModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAccountModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAccountModalOpen, closeAccountModal]);

  if (!isAccountModalOpen || !user) return null;

  const displayName = user.displayName?.trim() || user.email?.split('@')[0] || 'Google User';

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      // ignore
    }
  };

  const handleDeletePrompt = (index: number) => {
    const next = savedPrompts.filter((_, idx) => idx !== index);
    setSavedPrompts(next);
    try {
      localStorage.setItem('freetools_saved_photo_prompts', JSON.stringify(next));
      notifyWorkspaceMutated();
    } catch {}
  };

  const favoriteToolDefs = favorites
    .map((id) => TOOLS_LIST.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const recentToolDefs = recentTools
    .slice(0, 5)
    .map((id) => TOOLS_LIST.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={closeAccountModal}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3 min-w-0">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-600/20 shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2
                id="account-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate"
              >
                {displayName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user.email || 'Google Account'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeAccountModal}
            aria-label="Close account modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 px-5 sm:px-6 pt-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20">
          <button
            type="button"
            onClick={() => openAccountModal('account')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              accountModalTab === 'account'
                ? 'border-blue-700 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>{isUrdu ? 'میرا اکاؤنٹ' : 'My Account'}</span>
          </button>

          <button
            type="button"
            onClick={() => openAccountModal('saved')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              accountModalTab === 'saved'
                ? 'border-blue-700 text-blue-700 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>{isUrdu ? 'محفوظ کردہ آئٹمز' : 'My Saved Items'}</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {accountModalTab === 'account' ? (
            <>
              {/* Conflict Alert if unresolved */}
              {pendingConflict && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      {isUrdu
                        ? 'مقامی اور کلاؤڈ ڈیٹا کو ضم کرنے کی تصدیق باقی ہے۔'
                        : 'Pending cloud vs local workspace sync decision.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      closeAccountModal();
                      openAuthModal();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 cursor-pointer"
                  >
                    {isUrdu ? 'حل کریں' : 'Resolve'}
                  </button>
                </div>
              )}

              {/* Account Identity Details */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{isUrdu ? 'گوگل اکاؤنٹ کی تفصیلات' : 'Verified Google Identity'}</span>
                  </div>
                  {user.emailVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isUrdu ? 'تصدیق شدہ' : 'Verified'}</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {isUrdu ? 'پورا نام' : 'Display Name'}
                    </p>
                    <p className="font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
                      {displayName}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {isUrdu ? 'ای میل' : 'Email Address'}
                    </p>
                    <p className="font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
                      {user.email || '—'}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-slate-500 dark:text-slate-400">
                      {isUrdu ? 'یوزر آئی ڈی (UID)' : 'Account Ownership Key (Firebase UID)'}
                    </p>
                    <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 break-all">
                      {user.uid}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cloud Sync Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {syncStatus === 'offline' || syncStatus === 'pending' ? (
                      <CloudOff className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                    <span>{isUrdu ? 'کلاؤڈ سنکرونائزیشن' : 'Cloud Synchronization'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={syncNow}
                    disabled={syncStatus === 'syncing'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}
                    />
                    <span>{isUrdu ? 'ابھی سنک کریں' : 'Sync Now'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {syncStatus === 'synced' &&
                    (isUrdu
                      ? 'آپ کے پسندیدہ ٹولز، یومیہ ہدف، حالیہ ہسٹری اور محفوظ کردہ آئٹمز محفوظ طریقے سے آپ کے اکاؤنٹ سے سنک ہیں۔'
                      : 'Your favorites, recent tool history, daily goals, and saved items are securely synced under your Firebase UID.')}
                  {syncStatus === 'syncing' &&
                    (isUrdu ? 'تبدیلیاں کلاؤڈ پر محفوظ کی جا رہی ہیں...' : 'Synchronizing changes with cloud...')}
                  {(syncStatus === 'offline' || syncStatus === 'pending') &&
                    (isUrdu
                      ? 'آف لائن موڈ: تبدیلیاں محفوظ کر لی گئی ہیں اور انٹرنیٹ بحال ہوتے ہی خودکار سنک ہوں گی۔'
                      : 'You are currently offline. Changes are queued safely on your device and will sync automatically when online.')}
                  {syncStatus === 'error' &&
                    (isUrdu
                      ? 'کلاؤڈ سنک عارضی طور پر دستیاب نہیں ہے۔ مقامی ڈیٹا محفوظ ہے۔'
                      : 'Cloud sync encountered an issue. Your local changes remain safe; click Sync Now to retry.')}
                </p>

                {lastSyncedAt && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isUrdu ? 'آخری سنک:' : 'Last synced:'}{' '}
                    <span className="font-medium">
                      {new Date(lastSyncedAt).toLocaleString()}
                    </span>
                  </p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    closeAccountModal();
                    onOpenSettings();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>{isUrdu ? 'سیٹنگز کھولیں' : 'Workspace Settings'}</span>
                </button>

                <button
                  type="button"
                  disabled={authActionLoading}
                  onClick={signOut}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isUrdu ? 'سائن آؤٹ کریں' : 'Sign Out'}</span>
                </button>
              </div>
            </>
          ) : (
            /* Tab 2: My Saved Items */
            <div className="space-y-5">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50">
                  <div className="text-lg font-extrabold text-amber-700 dark:text-amber-300">
                    {favoriteToolDefs.length}
                  </div>
                  <div className="text-[11px] font-medium text-amber-800/80 dark:text-amber-300/80">
                    {isUrdu ? 'پسندیدہ ٹولز' : 'Pinned Tools'}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50">
                  <div className="text-lg font-extrabold text-blue-700 dark:text-blue-300">
                    {dailyProgress.completedCount}/{dailyProgress.goal}
                  </div>
                  <div className="text-[11px] font-medium text-blue-800/80 dark:text-blue-300/80">
                    {isUrdu ? 'آج کا ہدف' : "Today's Goal"}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50">
                  <div className="text-lg font-extrabold text-indigo-700 dark:text-indigo-300">
                    {savedPrompts.length}
                  </div>
                  <div className="text-[11px] font-medium text-indigo-800/80 dark:text-indigo-300/80">
                    {isUrdu ? 'محفوظ پرامپٹس' : 'Saved Prompts'}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50">
                  <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                    {savedColors.length}
                  </div>
                  <div className="text-[11px] font-medium text-emerald-800/80 dark:text-emerald-300/80">
                    {isUrdu ? 'رنگ پیلیٹ' : 'Saved Colors'}
                  </div>
                </div>
              </div>

              {/* Pinned Favorite Tools */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>{isUrdu ? 'پسندیدہ ٹولز' : 'Pinned Favorite Tools'}</span>
                </div>
                {favoriteToolDefs.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {favoriteToolDefs.map((tool) => (
                      <div
                        key={tool.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            closeAccountModal();
                            onNavigateTo(getToolPrimaryPath(tool.id));
                          }}
                          className="font-semibold text-slate-800 dark:text-slate-100 hover:text-blue-700 dark:hover:text-blue-400 cursor-pointer"
                        >
                          {isUrdu ? tool.nameUrdu : tool.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFavorite(tool.id)}
                          aria-label={`Remove ${tool.name} from favorites`}
                          className="text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isUrdu ? 'کوئی پسندیدہ ٹول محفوظ نہیں ہے۔' : 'No pinned favorite tools yet.'}
                  </p>
                )}
              </div>

              {/* Saved AI Photo Prompts */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>{isUrdu ? 'محفوظ کردہ اے آئی پرامپٹس' : 'Saved AI Photo Prompts'}</span>
                </div>
                {savedPrompts.length > 0 ? (
                  <div className="space-y-2">
                    {savedPrompts.map((item, idx) => (
                      <div
                        key={`${item.title}-${idx}`}
                        className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 space-y-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                            {item.prompt}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopy(item.prompt, `prompt-${idx}`)}
                            aria-label="Copy prompt"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            {copiedKey === `prompt-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePrompt(idx)}
                            aria-label="Delete saved prompt"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isUrdu
                      ? 'ابھی تک کوئی پرامپٹ محفوظ نہیں کیا گیا۔'
                      : 'Save prompts inside the AI Photo Prompt Studio to access them across devices.'}
                  </p>
                )}
              </div>

              {/* Saved Color Palette */}
              {savedColors.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                    <Palette className="w-4 h-4 text-emerald-500" />
                    <span>{isUrdu ? 'محفوظ کردہ رنگ' : 'Saved Color Swatches'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {savedColors.slice(0, 16).map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => handleCopy(hex, `color-${hex}`)}
                        title={`Copy ${hex}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-200 cursor-pointer hover:border-blue-500"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                        <span>{copiedKey === `color-${hex}` ? 'Copied' : hex}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recently Used & Print History */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>{isUrdu ? 'حالیہ ٹولز' : 'Recent Tools'}</span>
                  </div>
                  {recentToolDefs.length > 0 ? (
                    <ul className="space-y-1.5">
                      {recentToolDefs.map((t) => (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => {
                              closeAccountModal();
                              onNavigateTo(getToolPrimaryPath(t.id));
                            }}
                            className="text-xs text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            {isUrdu ? t.nameUrdu : t.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isUrdu ? 'کوئی حالیہ ٹول نہیں۔' : 'No recent tools recorded.'}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>{isUrdu ? 'پرنٹ ہسٹری' : 'Recent Print Logs'}</span>
                  </div>
                  {printHistory.length > 0 ? (
                    <ul className="space-y-1.5">
                      {printHistory.map((item) => (
                        <li
                          key={item.id}
                          className="text-xs text-slate-700 dark:text-slate-300 truncate"
                          title={item.title}
                        >
                          • {item.title}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isUrdu ? 'کوئی پرنٹ ہسٹری نہیں۔' : 'No printed documents yet.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>
              {isUrdu
                ? `${dailyProgress.streakDays} روزہ اسٹریک`
                : `${dailyProgress.streakDays}-day productivity streak`}
            </span>
          </span>
          <button
            type="button"
            onClick={closeAccountModal}
            className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {isUrdu ? 'بند کریں' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
