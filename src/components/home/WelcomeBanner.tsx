import React from 'react';
import { Sparkles, ArrowRight, Compass } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface WelcomeBannerProps {
  onExploreClick: () => void;
  onOpenCvClick: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  onExploreClick,
  onOpenCvClick,
}) => {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 shadow-sm border border-blue-700/40">
      {/* Subtle technology-themed background accents */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Grid Lines Overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          {/* Unboxed pill tag */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Modern Cards Dashboard</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {isUrdu ? 'عباس پرو میں خوش آمدید' : 'Welcome to AbbasPro'}
          </h1>

          <p className="text-base sm:text-lg font-medium text-blue-100">
            {isUrdu ? 'آپ کا مکمل فری ٹولز ہب' : 'Your All-in-One Free Tools Hub'}
          </p>

          <p className="text-xs sm:text-sm text-blue-200/90 font-medium tracking-wide">
            {isUrdu
              ? 'ہوشیار کام کریں • وقت بچائیں • نتیجہ خیز بنیں'
              : 'Work Smarter • Save Time • Be Productive'}
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onExploreClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Compass className="w-4 h-4 text-blue-700" />
            <span>{isUrdu ? 'تمام ٹولز دریافت کریں' : 'Explore All Tools'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenCvClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-800/80 hover:bg-blue-700 border border-blue-500/40 text-white text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer backdrop-blur-xs"
          >
            <span>{isUrdu ? 'سی وی بنائیں' : 'Create Resume'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
