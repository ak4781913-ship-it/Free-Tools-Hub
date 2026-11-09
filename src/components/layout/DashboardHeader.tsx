import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  User,
  Settings,
  HelpCircle,
  ExternalLink,
  Shield,
  Check,
  Bookmark,
  Share2,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useFavorites } from '../../context/FavoritesContext';
import { ThemeToggleSwitch } from './ThemeToggleSwitch';
import { LanguageToggleSwitch } from './LanguageToggleSwitch';

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onNavigateTo: (path: string) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onToggleSidebar,
  onOpenSearch,
  onOpenSettings,
  onOpenHelp,
  onNavigateTo,
}) => {
  const { language } = useLanguage();
  const { favorites, toggleDrawer } = useFavorites();
  const isUrdu = language === 'ur';

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="sticky top-0 z-20 w-full h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 no-print select-none">
      {/* Left: Sidebar Toggle + Global Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search trigger input */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center justify-between w-full max-w-md h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 text-xs font-medium transition-all shadow-2xs group cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
            <span className="truncate">
              {isUrdu ? 'ٹولز تلاش کریں... (Ctrl + K)' : 'Search tools, calculators, guides... (Ctrl + K)'}
            </span>
          </div>

          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-400 font-semibold shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Language, Theme, Notifications & User Account */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Pinned Favorites Drawer Button */}
        <button
          type="button"
          onClick={toggleDrawer}
          title={isUrdu ? 'پسندیدہ ٹولز' : 'Pinned Favorites'}
          aria-label="Open pinned tools drawer"
          className="relative p-2 rounded-xl text-slate-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Bookmark className="w-4 h-4" />
          {favorites.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>

        {/* Language Toggle */}
        <LanguageToggleSwitch />

        {/* Light/Dark Theme Toggle */}
        <ThemeToggleSwitch size="sm" />

        {/* User Account / Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            aria-expanded={isUserMenuOpen}
            aria-label="User account menu"
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-500/20 shadow-xs">
              AP
            </div>
            <span className="hidden md:block text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
              AbbasPro Guest
            </span>
          </button>

          {/* Account Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  AbbasPro Workspace
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  100% Free · Client-Side Privacy
                </p>
              </div>

              <div className="p-1.5 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>{isUrdu ? 'ترجیحات اور سیٹنگز' : 'Settings & Preferences'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenHelp();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>{isUrdu ? 'مدد اور رہنمائی' : 'Help & Documentation'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onNavigateTo('/about');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span>{isUrdu ? 'ہمارے بارے میں' : 'About AbbasPro'}</span>
                </button>
              </div>

              <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                Work Smarter • Save Time • Be Productive
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
