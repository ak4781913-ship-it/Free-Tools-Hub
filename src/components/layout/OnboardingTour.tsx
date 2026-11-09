import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Search,
  Bookmark,
  Keyboard,
  SlidersHorizontal,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (viewId: string) => void;
}

interface TourStep {
  id: string;
  targetSelector: string;
  icon: React.ElementType;
  titleKey: 'step1Title' | 'step2Title' | 'step3Title' | 'step4Title';
  descKey: 'step1Desc' | 'step2Desc' | 'step3Desc' | 'step4Desc';
  shortcutBadge?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'search',
    targetSelector: '#tour-search-header, #tour-search-hero',
    icon: Search,
    titleKey: 'step1Title',
    descKey: 'step1Desc',
    shortcutBadge: '/ or ⌘K',
  },
  {
    id: 'favorites',
    targetSelector: '#tour-favorites-header',
    icon: Bookmark,
    titleKey: 'step2Title',
    descKey: 'step2Desc',
    shortcutBadge: 'Alt+F',
  },
  {
    id: 'shortcuts',
    targetSelector: '#tour-shortcuts-header',
    icon: Keyboard,
    titleKey: 'step3Title',
    descKey: 'step3Desc',
    shortcutBadge: '?',
  },
  {
    id: 'catalog',
    targetSelector: '#tour-category-tabs, #tools-directory-section',
    icon: SlidersHorizontal,
    titleKey: 'step4Title',
    descKey: 'step4Desc',
    shortcutBadge: 'Alt+H',
  },
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { language, t } = useLanguage();
  const isUrdu = language === 'ur';

  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = TOUR_STEPS[currentStep] || TOUR_STEPS[0];
  const Icon = step.icon;

  // Measure and spotlight target element
  const updateTargetPosition = () => {
    if (!isOpen) return;

    const selectors = step.targetSelector.split(',').map((s) => s.trim());
    let targetEl: HTMLElement | null = null;

    for (const sel of selectors) {
      const el = document.querySelector(sel) as HTMLElement;
      if (el && el.offsetParent !== null) {
        targetEl = el;
        break;
      }
    }

    if (targetEl) {
      // Scroll into view if needed
      const rect = targetEl.getBoundingClientRect();
      const inView =
        rect.top >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);

      if (!inView) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Re-measure after short tick
      setTimeout(() => {
        if (targetEl) {
          setTargetRect(targetEl.getBoundingClientRect());
        }
      }, 100);
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateTargetPosition();
      const handleResize = () => updateTargetPosition();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleResize, true);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleResize, true);
      };
    }
  }, [isOpen, currentStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleFinish();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStep < TOUR_STEPS.length - 1) {
          e.preventDefault();
          handleNext();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleFinish();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStep > 0) {
          e.preventDefault();
          handleBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    try {
      localStorage.setItem('freetools_hub_tour_seen', 'true');
    } catch {
      // ignore
    }
    onClose();
    setCurrentStep(0);
  };

  if (!isOpen) return null;

  // Calculate popover positioning
  const PADDING = 8;
  const spotlightTop = targetRect ? Math.max(0, targetRect.top - PADDING) : 0;
  const spotlightLeft = targetRect ? Math.max(0, targetRect.left - PADDING) : 0;
  const spotlightWidth = targetRect ? targetRect.width + PADDING * 2 : 0;
  const spotlightHeight = targetRect ? targetRect.height + PADDING * 2 : 0;

  // Decide if popover goes below or above spotlight
  const isTargetInUpperHalf = targetRect ? targetRect.top < window.innerHeight / 2 : true;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Getting Started Tour"
      className="fixed inset-0 z-50 overflow-hidden select-none animate-in fade-in duration-200"
    >
      {/* 1. Backdrop Overlay with Spotlight Cutout */}
      {targetRect ? (
        <div
          onClick={handleFinish}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
          style={{
            clipPath: `polygon(
              0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
              ${spotlightLeft}px ${spotlightTop}px,
              ${spotlightLeft + spotlightWidth}px ${spotlightTop}px,
              ${spotlightLeft + spotlightWidth}px ${spotlightTop + spotlightHeight}px,
              ${spotlightLeft}px ${spotlightTop + spotlightHeight}px,
              ${spotlightLeft}px ${spotlightTop}px
            )`,
          }}
        />
      ) : (
        <div
          onClick={handleFinish}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* 2. Spotlight Border Glow Indicator around Target */}
      {targetRect && (
        <div
          className="pointer-events-none fixed rounded-2xl border-2 border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.6)] animate-pulse transition-all duration-300"
          style={{
            top: spotlightTop,
            left: spotlightLeft,
            width: spotlightWidth,
            height: spotlightHeight,
          }}
        />
      )}

      {/* 3. Floating Tooltip Popover Card */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in zoom-in-95 duration-200"
          style={
            targetRect
              ? {
                  position: 'absolute',
                  top: isTargetInUpperHalf
                    ? Math.min(window.innerHeight - 320, spotlightTop + spotlightHeight + 16)
                    : Math.max(16, spotlightTop - 290),
                  left: Math.max(
                    16,
                    Math.min(
                      window.innerWidth - 440,
                      spotlightLeft + spotlightWidth / 2 - 200
                    )
                  ),
                }
              : undefined
          }
        >
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold font-mono tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
                  {t.tour.stepOf
                    .replace('{current}', String(currentStep + 1))
                    .replace('{total}', String(TOUR_STEPS.length))}
                </span>
                {step.shortcutBadge && (
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {step.shortcutBadge}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              aria-label="Close tour"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={t.tour.skip}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {t.tour[step.titleKey]}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.tour[step.descKey]}
            </p>
          </div>

          {/* Step Progress Dots & Navigation Buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentStep === idx
                      ? 'w-6 bg-indigo-600 dark:bg-indigo-400'
                      : 'w-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                  }`}
                  aria-label={`Jump to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Actions: Skip, Back, Next/Finish */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFinish}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                {t.tour.skip}
              </button>

              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  {t.tour.back}
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>
                  {currentStep === TOUR_STEPS.length - 1 ? t.tour.finish : t.tour.next}
                </span>
                {currentStep === TOUR_STEPS.length - 1 ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className={`w-3.5 h-3.5 ${isUrdu ? 'rotate-180' : ''}`} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
