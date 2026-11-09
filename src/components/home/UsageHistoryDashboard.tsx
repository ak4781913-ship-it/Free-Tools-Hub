import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useFavorites, HistoryEntry } from '../../context/FavoritesContext';
import { TOOLS_LIST } from '../../data/tools';
import { ToolDefinition } from '../../types';
import { resolveToolIcon } from '../../utils/toolIcons';
import {
  Clock,
  History,
  ArrowRight,
  Star,
  Trash2,
  Search,
  X,
  ExternalLink,
  Sparkles,
  RotateCcw,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';

interface UsageHistoryDashboardProps {
  onSelectTool: (toolId: string) => void;
  onViewAllTools?: () => void;
}

export const UsageHistoryDashboard: React.FC<UsageHistoryDashboardProps> = ({ onSelectTool, onViewAllTools }) => {
  const { language, t } = useLanguage();
  const {
    history,
    removeHistoryItem,
    clearRecents,
    isFavorite,
    toggleFavorite
  } = useFavorites();

  const isUrdu = language === 'ur';
  const [searchFilter, setSearchFilter] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Format relative timestamp
  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diffMs = Math.max(0, now - timestamp);
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) {
      return t.usageHistory.justNow;
    }
    if (diffMin < 60) {
      return `${diffMin}${t.usageHistory.minutesAgo}`;
    }
    if (diffHours < 24) {
      return `${diffHours}${t.usageHistory.hoursAgo}`;
    }
    if (diffDays === 1) {
      return t.usageHistory.yesterday;
    }
    return `${diffDays}${t.usageHistory.daysAgo}`;
  };

  // Limit to the LAST 10 tools accessed in chronological order
  const last10Entries = useMemo(() => {
    return history.slice(0, 10);
  }, [history]);

  // Resolve tools for each history entry with metadata
  const resolvedItems = useMemo(() => {
    return last10Entries
      .map((entry) => {
        const tool = TOOLS_LIST.find((t) => t.id === entry.toolId);
        if (!tool) return null;
        return {
          entry,
          tool,
        };
      })
      .filter((item): item is { entry: HistoryEntry; tool: ToolDefinition } => item !== null);
  }, [last10Entries]);

  // Filter within history items if search query is entered
  const filteredItems = useMemo(() => {
    if (!searchFilter.trim()) return resolvedItems;
    const q = searchFilter.toLowerCase().trim();
    return resolvedItems.filter(({ tool }) => {
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.nameUrdu.toLowerCase().includes(q) ||
        tool.shortDescription.toLowerCase().includes(q) ||
        tool.categoryName.toLowerCase().includes(q) ||
        tool.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [resolvedItems, searchFilter]);

  // Starter tools for empty state
  const quickStartTools = useMemo(() => {
    const starterIds = ['resume-builder', 'uae-gratuity', 'image-compressor', 'color-picker'];
    return starterIds
      .map((id) => TOOLS_LIST.find((t) => t.id === id))
      .filter((t): t is ToolDefinition => !!t);
  }, []);

  return (
    <section
      id="usage-history-dashboard"
      className="w-full py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-colors"
      aria-label="Usage History Dashboard"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/5 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs ring-1 ring-indigo-500/20">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t.usageHistory.title}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Clock className="w-3 h-3 text-indigo-500" />
                  <span>
                    {resolvedItems.length} {t.usageHistory.badge}
                  </span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                {t.usageHistory.subtitle}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Search filter if there are items */}
            {resolvedItems.length > 2 && (
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={t.usageHistory.searchPlaceholder}
                  aria-label={t.usageHistory.searchPlaceholder}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder-slate-400"
                />
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => setSearchFilter('')}
                    aria-label={isUrdu ? 'تلاش صاف کریں' : 'Clear search filter'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Clear History Button with inline confirmation */}
            {resolvedItems.length > 0 && (
              <div className="relative">
                {showClearConfirm ? (
                  <div className="flex items-center gap-1.5 p-1 bg-red-50 dark:bg-red-950/60 rounded-lg border border-red-200 dark:border-red-900 animate-in fade-in duration-150">
                    <span className="text-[11px] font-medium text-red-700 dark:text-red-300 px-1.5">
                      {isUrdu ? 'ہسٹری مٹائیں؟' : 'Clear all?'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        clearRecents();
                        setShowClearConfirm(false);
                      }}
                      className="px-2 py-1 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                    >
                      {isUrdu ? 'ہاں' : 'Yes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"
                    >
                      {isUrdu ? 'نہیں' : 'No'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-200 dark:border-slate-800 transition-colors"
                    title={t.usageHistory.clearHistory}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.usageHistory.clearHistory}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chronological List of Last 10 Accessed Tools */}
        {filteredItems.length > 0 ? (
          <div className="relative">
            {/* Timeline Vertical Guide Line on desktop */}
            <div className="hidden md:block absolute left-[31px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-indigo-500 via-indigo-300 to-slate-200 dark:from-indigo-400 dark:via-indigo-800 dark:to-slate-800" />

            <div className="space-y-3 relative z-10">
              {filteredItems.map(({ entry, tool }, index) => {
                const ToolIcon = resolveToolIcon(tool.iconName);

                const favorited = isFavorite(tool.id);
                const title = isUrdu ? tool.nameUrdu : tool.name;
                const description = isUrdu ? tool.shortDescriptionUrdu : tool.shortDescription;
                const categoryName = isUrdu ? tool.categoryNameUrdu : tool.categoryName;
                const timeAgo = formatTimeAgo(entry.timestamp);
                const exactTime = new Date(entry.timestamp).toLocaleString();
                const visitCount = entry.visitCount || 1;

                return (
                  <div
                    key={`history-item-${tool.id}-${entry.timestamp}`}
                    onClick={() => onSelectTool(tool.id)}
                    className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-4.5 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-500/80 hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    {/* Left & Center: Chronological Indicator, Icon, Info */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      {/* Step Number / Node */}
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 group-hover:border-indigo-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center justify-center font-mono text-xs font-bold transition-colors shadow-2xs">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                      </div>

                      {/* Tool Icon */}
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                        <ToolIcon className="w-5 h-5" />
                      </div>

                      {/* Tool Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                            {title}
                          </h3>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                            · {categoryName}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 sm:line-clamp-2">
                          {description}
                        </p>
                      </div>
                    </div>

                    {/* Right Side: Timestamp, Visits, Quick Pin & Re-entry Button */}
                    <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60 dark:border-slate-700/60 shrink-0">
                      {/* Metadata: Time ago and Visit count */}
                      <div className="flex flex-col md:items-end text-left md:text-right">
                        <span
                          title={exactTime}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300"
                        >
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{timeAgo}</span>
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                          {t.usageHistory.visited} {visitCount}{' '}
                          {visitCount > 1 ? t.usageHistory.times : t.usageHistory.once}
                        </span>
                      </div>

                      {/* Interactive Actions */}
                      <div className="flex items-center gap-1.5">
                        {/* Quick Pin/Unpin */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(tool.id);
                          }}
                          title={favorited ? 'Unpin from favorites' : 'Pin to favorites'}
                          aria-label={favorited ? 'Unpin from favorites' : 'Pin to favorites'}
                          className="p-2 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Star
                            className={`w-4 h-4 transition-transform active:scale-125 ${
                              favorited
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-400 hover:text-amber-400'
                            }`}
                          />
                        </button>

                        {/* Remove item from history */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeHistoryItem(tool.id);
                          }}
                          title={t.usageHistory.removeTooltip}
                          aria-label={t.usageHistory.removeTooltip}
                          className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        {/* Re-enter Primary Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTool(tool.id);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs group-hover:shadow transition-all active:scale-95"
                        >
                          <span>{t.usageHistory.reEnter}</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Empty State when history is empty or filter yielded no match */
          <div className="text-center py-12 px-4 bg-slate-50/70 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700/80">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {searchFilter
                ? isUrdu
                  ? 'کوئی ٹول ہسٹری میں نہیں ملا'
                  : 'No matching tools in your history'
                : t.usageHistory.emptyTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
              {searchFilter
                ? isUrdu
                  ? 'کسی دوسرے لفظ سے تلاش کریں یا تلاش ختم کریں۔'
                  : 'Try searching with another keyword or clear the search filter above.'
                : t.usageHistory.emptySubtitle}
            </p>

            {searchFilter ? (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
              >
                {t.clearSearch}
              </button>
            ) : (
              /* Quick Start Recommendations */
              <div className="max-w-2xl mx-auto">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{t.usageHistory.quickStartTitle}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {quickStartTools.map((tool) => {
                    const Icon = resolveToolIcon(tool.iconName);

                    return (
                      <button
                        key={`qs-${tool.id}`}
                        type="button"
                        onClick={() => onSelectTool(tool.id)}
                        className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800 text-left border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xs transition-all group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                            {isUrdu ? tool.nameUrdu : tool.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {isUrdu ? tool.categoryNameUrdu : tool.categoryName}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dashboard Bottom Footer summary */}
        {filteredItems.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
            <span className="font-mono text-[11px]">
              {isUrdu
                ? `آخری ${filteredItems.length} وزٹ کیے گئے ٹولز دکھائے جا رہے ہیں`
                : `Showing last ${filteredItems.length} accessed utilities in chronological order`}
            </span>
            <button
              type="button"
              onClick={() => {
                if (onViewAllTools) onViewAllTools();
                else onSelectTool('resume-builder');
              }}
              className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium hover:underline cursor-pointer"
            >
              <span>{t.usageHistory.viewAllTools}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
