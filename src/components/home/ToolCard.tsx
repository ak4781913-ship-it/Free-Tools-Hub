import React, { useState, useEffect } from 'react';
import { ToolDefinition } from '../../types';
import { getToolPrimaryPath } from '../../data/toolsRouting';
import { useLanguage } from '../../context/LanguageContext';
import { useFavorites } from '../../context/FavoritesContext';
import { Star, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { resolveToolIcon } from '../../utils/toolIcons';
import { getToolRating, subscribeToToolRating, ToolRatingData } from '../../utils/toolRatingStorage';

interface ToolCardProps {
  tool: ToolDefinition;
  onSelect: (toolId: string) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onSelect }) => {
  const { language } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(tool.id);
  const isUrdu = language === 'ur';

  const [ratingData, setRatingData] = useState<ToolRatingData>(() => getToolRating(tool.id));

  useEffect(() => {
    setRatingData(getToolRating(tool.id));
    const unsubscribe = subscribeToToolRating(tool.id, (newData) => {
      setRatingData(newData);
    });
    return () => unsubscribe();
  }, [tool.id]);

  const IconComponent = resolveToolIcon(tool.iconName);

  const title = isUrdu ? tool.nameUrdu : tool.name;
  const description = isUrdu ? tool.shortDescriptionUrdu : tool.shortDescription;
  const categoryName = isUrdu ? tool.categoryNameUrdu : tool.categoryName;
  const primaryPath = getToolPrimaryPath(tool.id);

  const handleCardLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    onSelect(tool.id);
  };

  return (
    <article className="group relative flex flex-col justify-between p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-600/70 dark:hover:border-blue-500/70 focus-within:ring-2 focus-within:ring-blue-600 transition-all duration-150 hover:shadow-sm min-w-0 w-full">
      <div className="min-w-0">
        {/* Top bar of card: Icon & Favorite Action */}
        <div className="flex items-center justify-between mb-3.5 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-400 flex items-center justify-center transition-colors group-hover:bg-blue-700 group-hover:text-white shrink-0">
            <IconComponent className="w-5 h-5" />
          </div>

          <div className="flex items-center gap-0.5 relative z-10 shrink-0 -mr-1.5 rtl:mr-0 rtl:-ml-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(tool.id);
              }}
              title={favorited ? 'Remove from favorites' : 'Add to favorites'}
              aria-label={favorited ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
              className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center text-slate-400 hover:text-amber-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Star
                className={`w-4 h-4 transition-transform active:scale-110 ${
                  favorited
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-400 hover:text-amber-400'
                }`}
              />
            </button>
            <div className="p-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block" aria-hidden="true">
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 dark:group-hover:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Clean unboxed metadata (category + optional user rating) */}
        <div className="flex items-center justify-between gap-2 mb-1.5 min-w-0">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate min-w-0">
            {categoryName}
          </span>

          {ratingData.userRating !== null && (
            <div
              className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 tabular-nums shrink-0"
              title={
                isUrdu
                  ? `آپ کی محفوظ کردہ ریٹنگ: ${ratingData.userRating}/5`
                  : `Your saved rating in this browser: ${ratingData.userRating}/5`
              }
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span className="font-bold text-slate-900 dark:text-white">
                {ratingData.userRating}.0
              </span>
            </div>
          )}
        </div>

        {/* Semantic Crawlable Card Link */}
        <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1.5 break-words">
          <a
            href={primaryPath}
            onClick={handleCardLinkClick}
            className="after:absolute after:inset-0 focus:outline-none"
          >
            {title}
          </a>
        </h3>

        {/* Card Description */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed break-words">
          {description}
        </p>
      </div>

      {/* Bottom indicator */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 min-w-0">
        {ratingData.userRating ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 truncate">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {isUrdu ? `آپ نے ریٹ کیا: ${ratingData.userRating}★` : `You rated: ${ratingData.userRating}★`}
            </span>
          </span>
        ) : (
          <span className="text-[11px] truncate">
            {isUrdu ? 'فوری · مفت' : 'Free · Browser-Based'}
          </span>
        )}
        <span className="text-blue-700 dark:text-blue-400 font-semibold group-hover:underline shrink-0">
          {isUrdu ? 'ٹول کھولیں ←' : 'Open Tool →'}
        </span>
      </div>
    </article>
  );
};
