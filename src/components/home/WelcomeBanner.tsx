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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 border border-blue-800/80">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 text-blue-200 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-blue-300 shrink-0" />
            <span>{isUrdu ? 'ماوا ڈیش بورڈ' : 'MAWA · Client-Side Utility Suite'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {isUrdu ? 'ماوا میں خوش آمدید' : 'Welcome to MAWA'}
          </h1>

          <p className="text-base sm:text-lg font-medium text-blue-100">
            {isUrdu ? 'آپ کا مکمل فری ٹولز ہب' : 'Your All-in-One Free Tools Hub'}
          </p>

          <p className="text-xs sm:text-sm text-blue-100/90 font-medium tracking-wide">
            {isUrdu
              ? 'ہوشیار کام کریں · وقت بچائیں · نتیجہ خیز بنیں'
              : 'Work Smarter · Save Time · Be Productive'}
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href="/tools"
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onExploreClick();
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs sm:text-sm font-bold transition-colors active:scale-95 cursor-pointer"
          >
            <Compass className="w-4 h-4 text-blue-700 shrink-0" />
            <span>{isUrdu ? 'تمام ٹولز دریافت کریں' : 'Explore All Tools'}</span>
          </a>

          <a
            href="/tools/cv-maker"
            onClick={(e) => {
              if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onOpenCvClick();
              }
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-800/80 hover:bg-blue-700 border border-blue-500/40 text-white text-xs sm:text-sm font-semibold transition-colors active:scale-95 cursor-pointer"
          >
            <span>{isUrdu ? 'سی وی بنائیں' : 'Create Resume'}</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0 rtl:rotate-180" />
          </a>
        </div>
      </div>
    </div>
  );
};
