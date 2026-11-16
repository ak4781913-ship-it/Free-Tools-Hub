import React from 'react';
import {
  Menu,
  Search,
  Bookmark,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useFavorites } from '../../context/FavoritesContext';
import { ThemeToggleSwitch } from './ThemeToggleSwitch';
import { LanguageToggleSwitch } from './LanguageToggleSwitch';
import { UserAccountMenu } from '../auth/UserAccountMenu';

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

      {/* Right: Actions, Language, Theme, and Google Account Menu */}
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

        {/* Google Auth / User Account Menu */}
        <UserAccountMenu
          onOpenSettings={onOpenSettings}
          onOpenHelp={onOpenHelp}
          onNavigateTo={onNavigateTo}
        />
      </div>
    </header>
  );
};

