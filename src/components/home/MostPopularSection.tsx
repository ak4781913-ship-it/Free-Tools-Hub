import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useFavorites } from '../../context/FavoritesContext';
import { TOOLS_LIST } from '../../data/tools';
import { ToolDefinition } from '../../types';
import { getPopularToolStats, subscribeToToolAccess } from '../../utils/toolTracking';
import { resolveToolIcon } from '../../utils/toolIcons';
import {
  Flame,
  ArrowRight,
  Star,
  ArrowUpRight,
  Activity,
  Layers,
} from 'lucide-react';

interface MostPopularSectionProps {
  onSelectTool: (toolId: string) => void;
  onViewAll?: () => void;
}

export const MostPopularSection: React.FC<MostPopularSectionProps> = ({ onSelectTool, onViewAll }) => {
  const { language, t } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isUrdu = language === 'ur';

  const [popularStats, setPopularStats] = useState(() => getPopularToolStats(6));

  // Subscribe to real-time access logging events
  useEffect(() => {
    const unsubscribe = subscribeToToolAccess(() => {
      setPopularStats(getPopularToolStats(6));
    });
    return unsubscribe;
  }, []);

  // Map stats to tool definitions
  const popularTools = useMemo(() => {
    return popularStats
      .map((stat, index) => {
        const def = TOOLS_LIST.find((t) => t.id === stat.toolId);
        if (!def) return null;
        return {
          tool: def,
          rank: index + 1,
          count: stat.count,
        };
      })
      .filter((item): item is { tool: ToolDefinition; rank: number; count: number } => item !== null);
  }, [popularStats]);

  if (popularTools.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-200/80 dark:border-slate-800">
      {/* Header with Title and Unboxed Kicker */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>{t.mostPopular.badge}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t.mostPopular.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {t.mostPopular.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onViewAll) onViewAll();
            else onSelectTool('resume-builder');
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 self-start sm:self-auto cursor-pointer group"
        >
          <span>{t.mostPopular.viewAll}</span>
          <ArrowRight className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 ${isUrdu ? '-scale-x-100' : ''}`} />
        </button>
      </div>

      {/* Popular Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {popularTools.map(({ tool, rank, count }) => {
          const ToolIcon = resolveToolIcon(tool.iconName);

          const title = isUrdu ? tool.nameUrdu : tool.name;
          const description = isUrdu ? tool.shortDescriptionUrdu : tool.shortDescription;
          const categoryName = isUrdu ? tool.categoryNameUrdu : tool.categoryName;
          const favorited = isFavorite(tool.id);

          // Subtle rank badge styling
          const rankColors =
            rank === 1
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
              : rank === 2
              ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20'
              : rank === 3
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';

          return (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className="group relative flex flex-col justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-200 hover:shadow-md cursor-pointer"
            >
              <div>
                {/* Top Row: Icon, Rank Tag, and Favorite Button */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-colors group-hover:bg-indigo-600 group-hover:text-white shadow-2xs">
                      <ToolIcon className="w-5 h-5" />
                    </div>
                    {/* Rank Indicator */}
                    <span
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold font-mono border ${rankColors}`}
                      title={`Rank #${rank}`}
                    >
                      {t.mostPopular.rankPrefix}{rank}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(tool.id);
                      }}
                      title={favorited ? (isUrdu ? 'پسندیدہ سے ہٹائیں' : 'Remove favorite') : (isUrdu ? 'پسندیدہ میں شامل کریں' : 'Add favorite')}
                      aria-label="Toggle favorite"
                      className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Star
                        className={`w-4 h-4 transition-transform active:scale-125 ${
                          favorited
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-400 hover:text-amber-400'
                        }`}
                      />
                    </button>
                    <div className="p-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className={`w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 ${isUrdu ? '-scale-x-100' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* Unboxed Metadata (Anti-slop) */}
                <div className="text-[11px] font-medium text-slate-400 dark:text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-2">
                  <span>{categoryName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1 font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    <Activity className="w-3 h-3" />
                    <span>{count} {t.mostPopular.usesLabel}</span>
                  </span>
                </div>

                {/* Card Title */}
                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1.5">
                  {title}
                </h3>

                {/* Card Description */}
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Bottom Row */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono text-[10px]">
                  {isUrdu ? 'فوری اور مفت' : 'Instant · Free'}
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">
                  {isUrdu ? 'ٹول کھولیں ←' : 'Open Tool →'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
