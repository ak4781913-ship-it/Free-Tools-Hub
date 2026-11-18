/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  Cloud,
  CloudOff,
  HelpCircle,
  Loader2,
  LogOut,
  MoreVertical,
  RefreshCw,
  Settings,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { GoogleLoginButton } from './GoogleLoginButton';

interface UserAccountMenuProps {
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onNavigateTo: (path: string) => void;
}

export const UserAccountMenu: React.FC<UserAccountMenuProps> = ({
  onOpenSettings,
  onOpenHelp,
  onNavigateTo,
}) => {
  const {
    user,
    loading,
    authActionLoading,
    syncStatus,
    openAuthModal,
    openAccountModal,
    signOut,
  } = useAuth();
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [user?.photoURL]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  if (loading) {
    return (
      <div
        className="w-24 sm:w-36 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse shrink-0"
        aria-hidden="true"
      />
    );
  }

  // Logged-Out Entry Point: Clear Google-Branded Sign In + Preserved Guest Menu
  if (!user) {
    return (
      <div className="flex items-center gap-1.5 relative" ref={menuRef}>
        <GoogleLoginButton
          variant="header"
          loading={authActionLoading}
          onClick={openAuthModal}
          label={isUrdu ? 'گوگل کے ساتھ سائن ان کریں' : 'Sign in with Google'}
          compactLabel={isUrdu ? 'سائن ان' : 'Sign in'}
        />

        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-label={isUrdu ? 'ورک اسپیس مینو' : 'Workspace options'}
          title={isUrdu ? 'سیٹنگز اور مدد' : 'Settings & Help'}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {isMenuOpen && (
          <div className="absolute end-0 top-12 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {isUrdu ? 'گیسٹ ورک اسپیس' : 'FreeTools Hub Guest'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isUrdu
                  ? 'لاگ ان کے بغیر تمام ٹولز مفت استعمال کریں'
                  : 'All 28 tools work free without login'}
              </p>
            </div>

            <div className="p-1.5 space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  openAuthModal();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors text-start cursor-pointer"
              >
                <Cloud className="w-4 h-4 shrink-0" />
                <span>{isUrdu ? 'کلاؤڈ سنک کے لیے سائن ان کریں' : 'Sign in for Cloud Sync'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-start cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{isUrdu ? 'ترجیحات اور سیٹنگز' : 'Settings & Preferences'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenHelp();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-start cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{isUrdu ? 'مدد اور رہنمائی' : 'Help & Documentation'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onNavigateTo('/about');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-start cursor-pointer"
              >
                <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{isUrdu ? 'ہمارے بارے میں' : 'About MAWA FreeTools Hub'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Logged-In User Avatar + Profile Name + Required Account Dropdown
  const displayName =
    user.displayName?.trim() || user.email?.split('@')[0] || 'Google User';
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U';

  const getSyncBadge = () => {
    switch (syncStatus) {
      case 'synced':
        return {
          dot: 'bg-emerald-500',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
          text: isUrdu ? 'کلاؤڈ سنک فعال' : 'Cloud Synced',
          bg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
        };
      case 'syncing':
        return {
          dot: 'bg-blue-500',
          icon: <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" />,
          text: isUrdu ? 'سنک ہو رہا ہے...' : 'Syncing...',
          bg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
        };
      case 'conflict':
        return {
          dot: 'bg-amber-500',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
          text: isUrdu ? 'سنک کی تصدیق درکار ہے' : 'Sync Choice Needed',
          bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
        };
      case 'offline':
      case 'pending':
        return {
          dot: 'bg-amber-500',
          icon: <CloudOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
          text: isUrdu ? 'آف لائن کیشڈ موڈ' : 'Offline (Queued)',
          bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300',
        };
      default:
        return {
          dot: 'bg-slate-400',
          icon: <Cloud className="w-3.5 h-3.5 text-slate-500" />,
          text: isUrdu ? 'کلاؤڈ سے منسلک' : 'Connected',
          bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
        };
    }
  };

  const syncMeta = getSyncBadge();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        aria-expanded={isMenuOpen}
        aria-label="User account menu"
        className="flex items-center gap-2 p-1 pe-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer group max-w-[200px]"
      >
        <div className="relative shrink-0">
          {user.photoURL && !avatarLoadError ? (
            <img
              src={user.photoURL}
              alt={displayName}
              referrerPolicy="no-referrer"
              onError={() => setAvatarLoadError(true)}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-600/20 shadow-xs"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-500/20 shadow-xs">
              {initials}
            </div>
          )}
          <span
            className={`absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full ${syncMeta.dot} ring-2 ring-white dark:ring-slate-900`}
          />
        </div>

        <span className="hidden md:block text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
          {displayName}
        </span>
        <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Identity Summary Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-3 min-w-0">
              {user.photoURL && !avatarLoadError ? (
                <img
                  src={user.photoURL}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarLoadError(true)}
                  className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-blue-500/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {displayName}
                </p>
                {user.email && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                if (syncStatus === 'conflict') {
                  openAuthModal();
                } else {
                  openAccountModal('account');
                }
              }}
              className={`w-full inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${syncMeta.bg} cursor-pointer`}
            >
              {syncMeta.icon}
              <span className="truncate">{syncMeta.text}</span>
            </button>
          </div>

          {/* Primary Account Actions */}
          <div className="p-1.5 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                openAccountModal('account');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left rtl:text-right cursor-pointer"
            >
              <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>{isUrdu ? 'میرا اکاؤنٹ' : 'My Account'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                openAccountModal('saved');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left rtl:text-right cursor-pointer"
            >
              <Bookmark className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{isUrdu ? 'میرے محفوظ کردہ آئٹمز' : 'My Saved Items'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onOpenSettings();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left rtl:text-right cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{isUrdu ? 'سیٹنگز' : 'Settings'}</span>
            </button>
          </div>

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          <div className="p-1.5">
            <button
              type="button"
              disabled={authActionLoading}
              onClick={async () => {
                setIsMenuOpen(false);
                await signOut();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left rtl:text-right cursor-pointer disabled:opacity-60"
            >
              {authActionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <LogOut className="w-4 h-4 shrink-0" />
              )}
              <span>{isUrdu ? 'سائن آؤٹ کریں' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
