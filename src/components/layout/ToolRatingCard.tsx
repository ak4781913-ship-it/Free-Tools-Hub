/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Star, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { ToolDefinition } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import {
  ToolRatingData,
  getToolRating,
  submitToolRating,
  subscribeToToolRating,
} from '../../utils/toolRatingStorage';

interface ToolRatingCardProps {
  tool: ToolDefinition;
  className?: string;
  onRatingSubmitted?: (rating: number) => void;
}

export const ToolRatingCard: React.FC<ToolRatingCardProps> = ({
  tool,
  className = '',
  onRatingSubmitted,
}) => {
  const { language, dir } = useLanguage();
  const isUrdu = language === 'ur';

  const [ratingData, setRatingData] = useState<ToolRatingData>(() => getToolRating(tool.id));
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [justSubmitted, setJustSubmitted] = useState<boolean>(false);

  useEffect(() => {
    setRatingData(getToolRating(tool.id));
    setHoveredStar(null);
    setJustSubmitted(false);

    const unsubscribe = subscribeToToolRating(tool.id, (newData) => {
      setRatingData(newData);
    });

    return () => unsubscribe();
  }, [tool.id]);

  const handleStarClick = (starValue: number) => {
    const updated = submitToolRating(tool.id, starValue);
    setRatingData(updated);
    setJustSubmitted(true);
    onRatingSubmitted?.(starValue);

    setTimeout(() => {
      setJustSubmitted(false);
    }, 4000);
  };

  const starLabels: Record<number, { en: string; ur: string }> = {
    5: { en: 'Excellent', ur: 'بہترین' },
    4: { en: 'Very Good', ur: 'بہت اچھا' },
    3: { en: 'Good', ur: 'اچھا' },
    2: { en: 'Fair', ur: 'مناسب' },
    1: { en: 'Needs Improvement', ur: 'بہتری درکار' },
  };

  const activeStarPreview = hoveredStar || ratingData.userRating || 0;
  const toolName = isUrdu ? tool.nameUrdu : tool.name;
  const hasUserRating = ratingData.userRating !== null;

  return (
    <div
      id="tool-rating-section"
      className={`w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs transition-colors space-y-5 ${className}`}
      dir={dir}
    >
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-2xs shrink-0">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {isUrdu ? `${toolName} کی ریٹنگ` : `Rate ${toolName}`}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isUrdu
                ? 'اس ٹول کی افادیت کی درجہ بندی کریں (آپ کی ریٹنگ مقامی طور پر اس براؤزر میں محفوظ رہتی ہے)'
                : 'Save a personal 1–5 star rating for this utility in your browser'}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs font-medium self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            {hasUserRating
              ? isUrdu
                ? 'آپ کے براؤزر میں محفوظ'
                : 'Saved in your browser'
              : isUrdu
              ? 'ابھی تک ریٹ نہیں کیا گیا'
              : 'Not rated in this browser yet'}
          </span>
        </div>
      </div>

      {/* Main Rating Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Summary Tile */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-center space-y-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
            {hasUserRating ? `${ratingData.userRating}.0` : '—'}
          </span>

          <div className="flex items-center gap-1 text-amber-400" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  hasUserRating && star <= (ratingData.userRating || 0)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-300 dark:text-slate-700'
                }`}
              />
            ))}
          </div>

          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {hasUserRating
              ? isUrdu
                ? `آپ کی ریٹنگ: ۵ میں سے ${ratingData.userRating}`
                : `Your rating: ${ratingData.userRating} out of 5`
              : isUrdu
              ? 'ستارہ منتخب کر کے ریٹ کریں'
              : 'Select stars to rate'}
          </p>
        </div>

        {/* Interactive Star Picker */}
        <div className="md:col-span-8 p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
              <span>
                {hasUserRating
                  ? isUrdu
                    ? 'آپ کی ریٹنگ (تبدیل کرنے کے لیے کلک کریں):'
                    : 'Your Rating (Click any star to update):'
                  : isUrdu
                  ? 'اس ٹول کو ریٹ کریں:'
                  : 'How useful was this tool?'}
              </span>
            </span>

            {activeStarPreview > 0 && (
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                {starLabels[activeStarPreview]
                  ? isUrdu
                    ? starLabels[activeStarPreview].ur
                    : starLabels[activeStarPreview].en
                  : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {[1, 2, 3, 4, 5].map((starValue) => {
              const isSelected = ratingData.userRating !== null && starValue <= ratingData.userRating;
              const isHovered = hoveredStar !== null && starValue <= hoveredStar;
              const isHighlighted = hoveredStar !== null ? isHovered : isSelected;

              return (
                <button
                  key={starValue}
                  type="button"
                  onClick={() => handleStarClick(starValue)}
                  onMouseEnter={() => setHoveredStar(starValue)}
                  onMouseLeave={() => setHoveredStar(null)}
                  title={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                  aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                  className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center p-1.5 rounded-xl transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                      isHighlighted
                        ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                        : 'text-slate-300 dark:text-slate-700 hover:text-amber-300'
                    }`}
                  />
                </button>
              );
            })}

            {hasUserRating && (
              <span className="ml-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>
                  {isUrdu
                    ? `آپ نے ${ratingData.userRating} ستارے دیے`
                    : `Rated ${ratingData.userRating}/5`}
                </span>
              </span>
            )}
          </div>

          {justSubmitted && (
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {isUrdu
                  ? 'آپ کی ریٹنگ اس براؤزر میں محفوظ ہو گئی ہے۔'
                  : 'Your rating has been saved locally in this browser.'}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
