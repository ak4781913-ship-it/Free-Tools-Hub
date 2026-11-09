import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useFavorites, DEFAULT_FAVORITES } from '../../context/FavoritesContext';
import { TOOLS_LIST } from '../../data/tools';
import { ToolDefinition } from '../../types';
import { resolveToolIcon } from '../../utils/toolIcons';
import {
  X,
  Star,
  Clock,
  Pin,
  Search,
  ArrowRight,
  Trash2,
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface FavoritesDrawerProps {
  onNavigate: (viewId: string) => void;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({ onNavigate }) => {
  const { language, t } = useLanguage();
  const {
    favorites,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    clearFavorites,
    resetFavorites,
    recentTools,
    clearRecents,
    isDrawerOpen,
    closeDrawer
  } = useFavorites();

  const isUrdu = language === 'ur';
  const [activeTab, setActiveTab] = useState<'pinned' | 'recent' | 'all'>('pinned');
  const [searchQuery, setSearchQuery] = useState('');
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  // Resolve pinned tools
  const pinnedToolObjects = useMemo(() => {
    let list = favorites
      .map((id) => TOOLS_LIST.find((t) => t.id === id))
      .filter((t): t is ToolDefinition => !!t);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (tool) =>
          tool.name.toLowerCase().includes(q) ||
          tool.nameUrdu.toLowerCase().includes(q) ||
          tool.shortDescription.toLowerCase().includes(q) ||
          tool.categoryName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [favorites, searchQuery]);

  // Resolve recent tools
  const recentToolObjects = useMemo(() => {
    let list = recentTools
      .map((id) => TOOLS_LIST.find((t) => t.id === id))
      .filter((t): t is ToolDefinition => !!t);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (tool) =>
          tool.name.toLowerCase().includes(q) ||
          tool.nameUrdu.toLowerCase().includes(q) ||
          tool.shortDescription.toLowerCase().includes(q) ||
          tool.categoryName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [recentTools, searchQuery]);

  // All tools for pinning browse
  const allFilteredTools = useMemo(() => {
    if (!searchQuery.trim()) return TOOLS_LIST;
    const q = searchQuery.toLowerCase().trim();
    return TOOLS_LIST.filter(
      (tool) =>
        tool.name.toLowerCase().includes(q) ||
        tool.nameUrdu.toLowerCase().includes(q) ||
        tool.shortDescription.toLowerCase().includes(q) ||
        tool.categoryName.toLowerCase().includes(q) ||
        tool.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  if (!isDrawerOpen) return null;

  const handleLaunch = (toolId: string) => {
    closeDrawer();
    onNavigate(`tool:${toolId}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label={t.favoritesSidebar.title}
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={closeDrawer}
      />

      {/* Slide-over panel container */}
      <div
        className={`fixed inset-y-0 ${
          isUrdu ? 'left-0' : 'right-0'
        } w-full sm:max-w-md max-w-full flex`}
      >
        <div
          ref={drawerRef}
          className={`w-full max-w-full sm:max-w-md bg-white dark:bg-slate-900 shadow-2xl border-slate-200 dark:border-slate-800 flex flex-col h-full duration-250 ease-out ${
            isUrdu
              ? 'border-r animate-in slide-in-from-left'
              : 'border-l animate-in slide-in-from-right'
          }`}
        >
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {t.favoritesSidebar.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {t.favoritesSidebar.subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Close drawer"
              className="inline-flex items-center justify-center w-10 h-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                aria-label="Filter saved or recent tools"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'all'
                    ? t.favoritesSidebar.searchAllPlaceholder
                    : isUrdu
                    ? 'ٹولز فلٹر کریں...'
                    : 'Filter tools...'
                }
                className="w-full pl-9 pr-9 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear filter query"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs inside Drawer */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 px-2.5 sm:px-3 pt-2 gap-1 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('pinned')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[40px] text-xs font-semibold rounded-t-lg transition-colors border-b-2 shrink-0 ${
                activeTab === 'pinned'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
              <span>{t.favoritesSidebar.pinnedTab}</span>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 rounded-full">
                {favorites.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('recent')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[40px] text-xs font-semibold rounded-t-lg transition-colors border-b-2 shrink-0 ${
                activeTab === 'recent'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{t.favoritesSidebar.recentTab}</span>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 rounded-full">
                {recentTools.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 min-h-[40px] text-xs font-semibold rounded-t-lg transition-colors border-b-2 shrink-0 ${
                activeTab === 'all'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Pin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>{t.favoritesSidebar.managePins}</span>
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {/* TAB 1: PINNED FAVORITES */}
            {activeTab === 'pinned' && (
              <>
                {pinnedToolObjects.length > 0 ? (
                  pinnedToolObjects.map((tool) => {
                    const ToolIcon = resolveToolIcon(tool.iconName);

                    return (
                      <div
                        key={`drawer-fav-${tool.id}`}
                        onClick={() => handleLaunch(tool.id)}
                        className="group flex items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xs transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <ToolIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                              {isUrdu ? tool.nameUrdu : tool.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {isUrdu ? tool.categoryNameUrdu : tool.categoryName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFavorite(tool.id);
                            }}
                            title={isUrdu ? 'پسندیدہ سے ہٹائیں' : 'Unpin'}
                            aria-label={`Unpin ${tool.name}`}
                            className="p-1.5 text-amber-500 hover:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          </button>
                          <div className="p-1 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 px-4">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
                      <Star className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {t.favoritesSidebar.noPinned}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                      {isUrdu
                        ? 'تمام ٹولز ٹیب میں جائیں اور کسی بھی ٹول کو پن کریں۔'
                        : 'Switch to Manage Pins to pin your favorite tools.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('all')}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                    >
                      {t.favoritesSidebar.managePins}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* TAB 2: RECENT HISTORY */}
            {activeTab === 'recent' && (
              <>
                {recentToolObjects.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between pb-1 px-1">
                      <span className="text-[11px] font-medium text-slate-400">
                        {isUrdu ? 'حالیہ وزٹ کیے گئے ٹولز' : 'Recently Visited'}
                      </span>
                      <button
                        type="button"
                        onClick={clearRecents}
                        className="text-[11px] text-slate-400 hover:text-red-500 transition-colors"
                      >
                        {isUrdu ? 'ہسٹری صاف کریں' : 'Clear history'}
                      </button>
                    </div>
                    {recentToolObjects.map((tool) => {
                      const ToolIcon = resolveToolIcon(tool.iconName);

                      return (
                        <div
                          key={`drawer-rec-${tool.id}`}
                          onClick={() => handleLaunch(tool.id)}
                          className="group flex items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xs transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                              <ToolIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {isUrdu ? tool.nameUrdu : tool.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {isUrdu ? tool.categoryNameUrdu : tool.categoryName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              aria-label={isFavorite(tool.id) ? `Unpin ${tool.name}` : `Pin ${tool.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(tool.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  isFavorite(tool.id)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-400'
                                }`}
                              />
                            </button>
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="text-center py-12 px-4">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                      <Clock className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {t.favoritesSidebar.noRecent}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {isUrdu
                        ? 'آپ جیسے جیسے مختلف ٹولز کھولیں گے، وہ یہاں درج ہوں گے۔'
                        : 'Tools will appear here automatically as you use them.'}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* TAB 3: MANAGE PINS / ALL TOOLS */}
            {activeTab === 'all' && (
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-slate-400 px-1 pb-1">
                  {isUrdu
                    ? 'کسی بھی ٹول کو پن کرنے کے لیے اسٹار پر کلک کریں:'
                    : 'Click Star on any tool to pin or unpin:'}
                </div>
                {allFilteredTools.map((tool) => {
                  const pinned = isFavorite(tool.id);
                  const ToolIcon = resolveToolIcon(tool.iconName);

                  return (
                    <div
                      key={`drawer-all-${tool.id}`}
                      className="flex items-center justify-between gap-3 p-2.5 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                    >
                      <div
                        onClick={() => handleLaunch(tool.id)}
                        className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                          <ToolIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate hover:underline">
                            {isUrdu ? tool.nameUrdu : tool.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 uppercase">
                            {isUrdu ? tool.categoryNameUrdu : tool.categoryName}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleFavorite(tool.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          pinned
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            pinned ? 'fill-amber-500 text-amber-500' : 'text-slate-400'
                          }`}
                        />
                        <span>{pinned ? (isUrdu ? 'پن ہے' : 'Pinned') : isUrdu ? 'پن کریں' : 'Pin'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={resetFavorites}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.pinnedSection.resetToDefault}</span>
            </button>

            {favorites.length > 0 && (
              <button
                type="button"
                onClick={clearFavorites}
                className="inline-flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.pinnedSection.clearAll}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
