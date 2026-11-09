import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { TOOLS_LIST } from '../../data/tools';
import { Search, X, Sparkles, Shield, Zap } from 'lucide-react';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectQuickTag: (tag: string) => void;
  onOpenSearch?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  searchQuery,
  onSearchChange,
  onSelectQuickTag,
  onOpenSearch,
}) => {
  const { language, t } = useLanguage();
  const isUrdu = language === 'ur';
  const totalTools = TOOLS_LIST.length;

  const quickSearches = [
    { label: 'CV Builder', labelUrdu: 'سی وی بلڈر', term: 'resume' },
    { label: 'UAE Salary', labelUrdu: 'یو اے ای سیلری', term: 'uae salary' },
    { label: 'UAE Gratuity', labelUrdu: 'یو اے ای گریجویٹی', term: 'gratuity' },
    { label: 'Image Prompts', labelUrdu: 'امیج پرامپٹس', term: 'photo' },
    { label: 'Video Prompts', labelUrdu: 'ویڈیو پرامپٹس', term: 'video' },
    { label: 'QR Generator', labelUrdu: 'کیو آر کوڈ', term: 'qr' },
    { label: 'Image Compressor', labelUrdu: 'تصویر کمپریس', term: 'compress' },
  ];

  return (
    <section className="relative w-full max-w-full pt-8 pb-10 sm:pt-12 sm:pb-14 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center min-w-0">
        {/* Clean unboxed metadata kicker */}
        <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-3 tracking-wide max-w-full">
          <span>{t.home.searchBadge}</span>
          <span aria-hidden="true">·</span>
          <span>{isUrdu ? 'براؤزر کے اندر محفوظ پروسیسنگ' : 'Zero Account Sign-Up'}</span>
        </div>

        {/* Headline */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight text-balance break-words max-w-full mb-3.5 sm:mb-4">
          {t.home.heroTitle}
        </h1>

        {/* Concise Introduction */}
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed break-words">
          {t.home.heroSubtitle}
        </p>

        {/* Search Field */}
        <div id="tour-search-hero" className="relative w-full max-w-2xl mx-auto min-w-0">
          <div className="relative flex items-center w-full min-w-0">
            <label htmlFor="homepage-tool-search" className="sr-only">
              {isUrdu ? 'ٹولز تلاش کریں' : 'Search tools by name or category'}
            </label>
            <div className="absolute left-3.5 rtl:left-auto rtl:right-3.5 pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              id="homepage-tool-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full min-w-0 pl-11 rtl:pl-11 rtl:pr-11 py-3 sm:py-3.5 bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl border border-slate-300 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm sm:text-base shadow-2xs transition-all ${
                onOpenSearch
                  ? 'pr-11 sm:pr-36 rtl:sm:pr-11 rtl:sm:pl-36'
                  : 'pr-11'
              }`}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label={t.clearSearch}
                className="absolute right-2 rtl:right-auto rtl:left-2 min-w-[36px] min-h-[36px] inline-flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              onOpenSearch && (
                <button
                  type="button"
                  onClick={onOpenSearch}
                  title="Open Command Palette (Press / or Ctrl+K)"
                  className="absolute right-2.5 rtl:right-auto rtl:left-2.5 hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-400 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  <span>Quick Jump</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                    Ctrl+K
                  </kbd>
                </button>
              )
            )}
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 max-w-full">
          <span className="font-medium text-slate-600 dark:text-slate-300 py-1">
            {isUrdu ? 'مقبول تلاش:' : 'Quick filter:'}
          </span>
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="min-h-[36px] px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/60 rounded-lg font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
              <span>{isUrdu ? `تمام ${totalTools} ٹولز` : `All ${totalTools} Tools`}</span>
            </button>
          )}
          {quickSearches.map((qs) => (
            <button
              key={qs.term}
              type="button"
              onClick={() => onSelectQuickTag(qs.term)}
              className="min-h-[36px] px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-700 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {isUrdu ? qs.labelUrdu : qs.label}
            </button>
          ))}
        </div>

        {/* 3 Factual Platform Highlights */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-200/70 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center justify-center gap-2 min-w-0">
            <Zap className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
            <span className="break-words">{t.home.statsTools}</span>
          </div>
          <div className="flex items-center justify-center gap-2 min-w-0">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="break-words">{t.home.statsPrivacy}</span>
          </div>
          <div className="flex items-center justify-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
            <span className="break-words">{t.home.statsCost}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
