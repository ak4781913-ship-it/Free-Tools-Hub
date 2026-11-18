import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useFavorites, DEFAULT_FAVORITES } from '../../context/FavoritesContext';
import { TOOLS_LIST } from '../../data/tools';
import { getToolPrimaryPath } from '../../data/toolsRouting';
import { ToolDefinition } from '../../types';
import { resolveToolIcon } from '../../utils/toolIcons';
import {
  Star,
  Pin,
  Plus,
  ArrowRight,
  Search,
  X,
  RotateCcw,
  Trash2,
  ExternalLink,
  Sparkles,
  LayoutGrid
} from 'lucide-react';

interface FavoritesSectionProps {
  onSelectTool: (toolId: string) => void;
}

export const FavoritesSection: React.FC<FavoritesSectionProps> = ({ onSelectTool }) => {
  const { language, t } = useLanguage();
  const {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
    resetFavorites,
    openDrawer
  } = useFavorites();

  const isUrdu = language === 'ur';

  // State for in-place "Pin More Tools" picker modal/popover
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCategory, setPickerCategory] = useState<string>('all');

  useEffect(() => {
    if (!isPickerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPickerOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPickerOpen]);

  // Resolved list of favorited tool objects
  const favoriteTools = useMemo(() => {
    return favorites
      .map((id) => TOOLS_LIST.find((t) => t.id === id))
      .filter((t): t is ToolDefinition => !!t);
  }, [favorites]);

  // Recommended tools for empty state or quick additions
  const recommendedTools = useMemo(() => {
    return DEFAULT_FAVORITES
      .map((id) => TOOLS_LIST.find((t) => t.id === id))
      .filter((t): t is ToolDefinition => !!t);
  }, []);

  // Filtered list of tools for the picker modal
  const pickerFilteredTools = useMemo(() => {
    let list = TOOLS_LIST;
    if (pickerCategory !== 'all') {
      list = list.filter((tool) => tool.category === pickerCategory);
    }
    if (pickerSearch.trim()) {
      const q = pickerSearch.toLowerCase().trim();
      list = list.filter(
        (tool) =>
          tool.name.toLowerCase().includes(q) ||
          tool.nameUrdu.toLowerCase().includes(q) ||
          tool.shortDescription.toLowerCase().includes(q) ||
          tool.categoryName.toLowerCase().includes(q) ||
          tool.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }
    return list;
  }, [pickerSearch, pickerCategory]);

  return (
    <section
      id="favorites-section"
      className="w-full transition-colors"
      aria-label="Favorites & Pinned Tools"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 relative min-w-0">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800/80 min-w-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-x-2 gap-y-0.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t.pinnedSection.title}
                </h2>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
                  {favorites.length} {isUrdu ? 'ٹولز' : 'pinned'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {t.pinnedSection.subtitle}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pin More Tools Button */}
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t.pinnedSection.pinMore}</span>
            </button>

            {/* Quick Open Sidebar Button */}
            <button
              type="button"
              onClick={openDrawer}
              title={t.pinnedSection.openSidebar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">{isUrdu ? 'سائیڈبار' : 'Sidebar'}</span>
            </button>

            {/* Reset or Clear dropdown if favorites exist */}
            {favorites.length > 0 ? (
              <button
                type="button"
                onClick={clearFavorites}
                title={t.pinnedSection.clearAll}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.pinnedSection.clearAll}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={resetFavorites}
                title={t.pinnedSection.resetToDefault}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.pinnedSection.resetToDefault}</span>
              </button>
            )}
          </div>
        </div>

        {/* Pinned Tools Grid */}
        {favoriteTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {favoriteTools.map((tool) => {
              const IconComponent = resolveToolIcon(tool.iconName);

              const title = isUrdu ? tool.nameUrdu : tool.name;
              const description = isUrdu ? tool.shortDescriptionUrdu : tool.shortDescription;
              const categoryName = isUrdu ? tool.categoryNameUrdu : tool.categoryName;

              const primaryPath = getToolPrimaryPath(tool.id);

              return (
                <article
                  key={`pinned-${tool.id}`}
                  className="group relative flex flex-col justify-between min-w-0 p-4 bg-slate-50/70 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/80 focus-within:ring-2 focus-within:ring-blue-600 transition-colors text-start"
                >
                  <div>
                    {/* Card Top: Icon, Category & Unpin Star */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-colors group-hover:bg-amber-500 group-hover:text-white">
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="flex items-center gap-1 relative z-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFavorite(tool.id);
                          }}
                          title={isUrdu ? 'پسندیدہ سے ہٹائیں' : 'Unpin from favorites'}
                          aria-label={isUrdu ? `${title} کو پسندیدہ سے ہٹائیں` : `Unpin ${title} from favorites`}
                          className="p-1.5 text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                        >
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400 active:scale-110 transition-transform" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 truncate">
                      {categoryName}
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1 mb-1">
                      <a
                        href={primaryPath}
                        onClick={(e) => {
                          if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                            e.preventDefault();
                            onSelectTool(tool.id);
                          }
                        }}
                        className="after:absolute after:inset-0 focus:outline-none"
                      >
                        {title}
                      </a>
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {description}
                    </p>
                  </div>

                  {/* Card Bottom: Direct Launch Action */}
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Pin className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{isUrdu ? 'پن شدہ' : 'Quick Access'}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:ltr:translate-x-0.5 group-hover:rtl:-translate-x-0.5 transition-transform">
                      <span>{isUrdu ? 'کھولیں' : 'Launch'}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Empty State when no tools are pinned */
          <div className="text-center py-10 px-4 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-dashed border-amber-300 dark:border-amber-800/60">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {t.pinnedSection.emptyTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
              {t.pinnedSection.emptySubtitle}
            </p>

            {/* Quick Pin Recommendations */}
            <div className="max-w-2xl mx-auto">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.pinnedSection.recommendationsTitle}</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {recommendedTools.map((tool) => {
                  const Icon = resolveToolIcon(tool.iconName);
                  return (
                    <button
                      key={`rec-${tool.id}`}
                      type="button"
                      onClick={() => addFavorite(tool.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-all shadow-xs"
                    >
                      <Icon className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isUrdu ? tool.nameUrdu : tool.name}</span>
                      <Plus className="w-3 h-3 text-slate-400 group-hover:text-amber-500" />
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={resetFavorites}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                >
                  {t.pinnedSection.resetToDefault}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pin More Tools Picker Modal */}
      {isPickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setIsPickerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[calc(100vw-1.5rem)] sm:max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85dvh] animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Pin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isUrdu ? 'ٹولز کو پسندیدہ میں پن کریں' : 'Manage Pinned Tools'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isUrdu
                      ? 'کسی بھی ٹول کو پن یا ان پن کرنے کے لیے اسٹار پر کلک کریں۔'
                      : 'Click the star or button on any tool to pin or unpin it.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close manage pinned tools dialog"
                onClick={() => setIsPickerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="relative">
                <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  aria-label="Search tools to pin"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder={isUrdu ? 'تمام ٹولز تلاش کریں...' : `Search from all ${TOOLS_LIST.length} tools...`}
                  className="w-full ps-9 pe-9 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
                />
                {pickerSearch && (
                  <button
                    type="button"
                    aria-label="Clear search query"
                    onClick={() => setPickerSearch('')}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Modal Tools List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
              {pickerFilteredTools.map((tool) => {
                const isPinned = isFavorite(tool.id);
                const ToolIcon = resolveToolIcon(tool.iconName);

                return (
                  <div
                    key={`modal-tool-${tool.id}`}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                        <ToolIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {isUrdu ? tool.nameUrdu : tool.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0 hidden sm:inline">
                            {isUrdu ? tool.categoryNameUrdu : tool.categoryName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {isUrdu ? tool.shortDescriptionUrdu : tool.shortDescription}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleFavorite(tool.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isPinned
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            isPinned
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-slate-400'
                          }`}
                        />
                        <span>
                          {isPinned
                            ? isUrdu
                              ? 'پن ہے'
                              : 'Pinned'
                            : isUrdu
                            ? 'پن کریں'
                            : 'Pin'}
                        </span>
                      </button>

                      <button
                        type="button"
                        aria-label={`Launch ${tool.name}`}
                        onClick={() => {
                          setIsPickerOpen(false);
                          onSelectTool(tool.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        title={isUrdu ? 'ٹول کھولیں' : 'Launch tool directly'}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                {favorites.length} {isUrdu ? 'ٹولز منتخب شدہ' : 'tools currently pinned'}
              </span>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                {isUrdu ? 'مکمل ہوا' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
