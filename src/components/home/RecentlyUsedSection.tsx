/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useFavorites, HistoryEntry } from '../../context/FavoritesContext';
import { TOOLS_LIST } from '../../data/tools';
import { ToolDefinition } from '../../types';
import { resolveToolIcon } from '../../utils/toolIcons';
import {
  Clock,
  ArrowRight,
  Trash2,
  Sparkles,
  ExternalLink,
  RotateCcw,
  History,
  X,
  Compass,
  Star,
} from 'lucide-react';
import { getToolRating } from '../../utils/toolRatingStorage';

interface RecentlyUsedSectionProps {
  onSelectTool: (toolId: string) => void;
  onViewAllTools?: () => void;
}

export const RecentlyUsedSection: React.FC<RecentlyUsedSectionProps> = ({
  onSelectTool,
  onViewAllTools,
}) => {
  const { language, t } = useLanguage();
  const { history, removeHistoryItem, clearRecents } = useFavorites();
  const isUrdu = language === 'ur';

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Format relative timestamp
  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diffMs = Math.max(0, now - timestamp);
    const diffMin = Math.floor(diffMs / (1000 * 60));
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

  // Strictly extract the LAST 5 tools accessed by the user
  const recent5Entries = useMemo(() => {
    return history.slice(0, 5);
  }, [history]);

  // Resolve metadata for the last 5 tools
  const resolvedTools = useMemo(() => {
    return recent5Entries
      .map((entry) => {
        const tool = TOOLS_LIST.find((t) => t.id === entry.toolId);
        if (!tool) return null;
        return { entry, tool };
      })
      .filter((item): item is { entry: HistoryEntry; tool: ToolDefinition } => item !== null);
  }, [recent5Entries]);

  // Fallback 5 common starter workflows if user clears recents
  const starterWorkflows = useMemo(() => {
    const starterIds = [
      'resume-builder',
      'uae-gratuity',
      'gemini-photo-prompt',
      'image-compressor',
      'qr-generator',
    ];
    return starterIds
      .map((id) => TOOLS_LIST.find((t) => t.id === id))
      .filter((t): t is ToolDefinition => !!t);
  }, []);

  return (
    <section
      id="recently-used-section"
      className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 transition-colors min-w-0"
      aria-label="Recently Used Tools Section"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden min-w-0">
        {/* Subtle decorative glow kept strictly within card bounds */}
        <div className="absolute top-0 right-0 w-44 sm:w-80 max-w-full h-44 sm:h-80 bg-gradient-to-bl from-indigo-500/8 via-cyan-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800/80 relative z-10 min-w-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 ring-1 ring-indigo-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white break-words">
                  {t.recentlyUsedSection.title}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800 max-w-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                  <span className="truncate">
                    {resolvedTools.length > 0
                      ? `${resolvedTools.length}/5 ${t.recentlyUsedSection.badge}`
                      : t.recentlyUsedSection.badge}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 break-words">
                {t.recentlyUsedSection.subtitle}
              </p>
            </div>
          </div>

          {/* Action controls: Clear & View All Tools remain visible, accessible, and properly spaced */}
          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap w-full sm:w-auto min-w-0">
            {resolvedTools.length > 0 && (
              <>
                {showClearConfirm ? (
                  <div className="flex items-center gap-1.5 p-1.5 bg-red-50 dark:bg-red-950/60 rounded-lg border border-red-200 dark:border-red-900 animate-in fade-in duration-150 flex-wrap max-w-full">
                    <span className="text-[11px] font-medium text-red-700 dark:text-red-300 px-1.5">
                      {t.recentlyUsedSection.clearConfirm}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        clearRecents();
                        setShowClearConfirm(false);
                      }}
                      className="min-h-[32px] px-2.5 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer"
                    >
                      {isUrdu ? 'ہاں' : 'Yes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(false)}
                      className="min-h-[32px] px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                    >
                      {isUrdu ? 'نہیں' : 'No'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                    title={t.recentlyUsedSection.clear}
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{t.recentlyUsedSection.clear}</span>
                  </button>
                )}
              </>
            )}

            {onViewAllTools && (
              <button
                type="button"
                onClick={onViewAllTools}
                className="min-h-[38px] inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg cursor-pointer px-3 py-1.5 transition-colors ml-auto sm:ml-0 rtl:ml-0 rtl:mr-auto sm:rtl:mr-0"
              >
                <span>{t.recentlyUsedSection.viewAll}</span>
                <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isUrdu ? '-scale-x-100' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* 5 Last Accessed Tools Grid */}
        {resolvedTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 relative z-10 min-w-0">
            {resolvedTools.map(({ entry, tool }, index) => {
              const ToolIcon = resolveToolIcon(tool.iconName);
              const savedRating = getToolRating(tool.id);

              const title = isUrdu ? tool.nameUrdu : tool.name;
              const categoryName = isUrdu ? tool.categoryNameUrdu : tool.categoryName;
              const timeAgo = formatTimeAgo(entry.timestamp);

              return (
                <div
                  key={`recent-5-tool-${tool.id}-${entry.timestamp}`}
                  onClick={() => onSelectTool(tool.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectTool(tool.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="group relative flex flex-col justify-between p-4 bg-slate-50/90 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 hover:border-indigo-400 dark:hover:border-indigo-500/80 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden min-w-0 w-full text-left rtl:text-right"
                >
                  {/* Top Bar inside Card: Category Badge, Rating & Remove Button */}
                  <div className="flex items-center justify-between gap-1.5 mb-3 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide bg-slate-200/70 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                        {categoryName}
                      </span>
                      {savedRating.userRating !== null && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-500 dark:text-amber-400 shrink-0 tabular-nums">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
                          <span>{savedRating.userRating}/5</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-mono tabular-nums text-slate-400 dark:text-slate-400">
                        #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeHistoryItem(tool.id);
                        }}
                        title={isUrdu ? 'فہرست سے ہٹائیں' : 'Remove from recent tools'}
                        aria-label={isUrdu ? `${title} کو فہرست سے ہٹائیں` : `Remove ${title} from recent tools`}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 min-w-[30px] min-h-[30px] inline-flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-opacity cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-center gap-3 mb-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100/70 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-200 shadow-2xs">
                      <ToolIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {title}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 min-w-0">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span className="truncate">{timeAgo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action: Resume Workflow */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs min-w-0">
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono tabular-nums truncate">
                      {t.recentlyUsedSection.timesUsed.replace('{count}', String(entry.visitCount || 1))}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                      <span>{t.recentlyUsedSection.resumeWorkflow}</span>
                      <ArrowRight className={`w-3 h-3 ${isUrdu ? '-scale-x-100' : ''}`} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State: Suggests 5 common starter workflows */
          <div className="text-center py-6 px-3 sm:px-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700/80 min-w-0">
            <div className="w-10 h-10 mx-auto mb-2.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              {t.recentlyUsedSection.emptyTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
              {t.recentlyUsedSection.emptySubtitle}
            </p>

            <div className="max-w-4xl mx-auto min-w-0">
              <div className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{t.recentlyUsedSection.quickStarters}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 min-w-0">
                {starterWorkflows.map((tool) => {
                  const Icon = resolveToolIcon(tool.iconName);

                  return (
                    <button
                      key={`starter-wf-${tool.id}`}
                      type="button"
                      onClick={() => onSelectTool(tool.id)}
                      className="min-h-[48px] flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-800 text-left rtl:text-right border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xs transition-all group cursor-pointer min-w-0 w-full"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
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
          </div>
        )}
      </div>
    </section>
  );
};
