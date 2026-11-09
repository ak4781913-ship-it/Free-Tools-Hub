/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageToggleSwitchProps {
  className?: string;
  size?: 'sm' | 'md';
  showGlobe?: boolean;
  showFullLabels?: boolean;
}

export const LanguageToggleSwitch: React.FC<LanguageToggleSwitchProps> = ({
  className = '',
  size = 'md',
  showGlobe = true,
  showFullLabels = false,
}) => {
  const { language, setLanguage, toggleLanguage, isUrdu } = useLanguage();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleLanguage();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setLanguage('en');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setLanguage('ur');
    }
  };

  const isSm = size === 'sm';
  const baseDisplay = /\bhidden\b/.test(className) ? '' : 'inline-flex';

  return (
    <div
      dir="ltr"
      className={`${baseDisplay} items-center gap-1.5 ${className}`.trim()}
    >
      {showGlobe && (
        <Globe
          className={`${
            isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'
          } text-slate-400 dark:text-slate-500 transition-colors shrink-0`}
          aria-hidden="true"
        />
      )}

      {/* Interactive Switch Container */}
      <div
        role="switch"
        aria-checked={isUrdu}
        aria-label={
          isUrdu
            ? 'انٹرفیس کی زبان انگریزی یا اردو میں تبدیل کریں'
            : 'Toggle interface language between English and Urdu'
        }
        tabIndex={0}
        onClick={toggleLanguage}
        onKeyDown={handleKeyDown}
        title={
          isUrdu
            ? 'انگریزی میں تبدیل کریں (Switch to English - LTR)'
            : 'Switch to Urdu (اردو - RTL)'
        }
        className={`relative inline-flex items-center p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800/90 shadow-2xs select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 transition-all ${
          showFullLabels ? 'w-[148px]' : isSm ? 'w-[74px]' : 'w-[86px]'
        } ${
          isSm ? 'text-[11px]' : 'text-xs'
        }`}
      >
        {/* Animated Background Slider Pill */}
        <div
          className={`absolute top-0.5 bottom-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-all duration-200 ease-out pointer-events-none ${
            isUrdu
              ? 'left-[50%] right-0.5'
              : 'left-0.5 right-[50%]'
          }`}
        />

        {/* English Segment Button */}
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            setLanguage('en');
          }}
          className={`relative z-10 flex-1 flex items-center justify-center font-semibold rounded-lg transition-colors cursor-pointer ${
            isSm ? 'py-1 min-h-[28px]' : 'py-1.5 min-h-[32px]'
          } ${
            !isUrdu
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          aria-pressed={!isUrdu}
          aria-label="Switch language to English"
        >
          <span>{showFullLabels ? 'English' : 'EN'}</span>
        </button>

        {/* Urdu Segment Button */}
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            setLanguage('ur');
          }}
          className={`relative z-10 flex-1 flex items-center justify-center font-semibold rounded-lg transition-colors cursor-pointer ${
            isSm ? 'py-1 min-h-[28px]' : 'py-1.5 min-h-[32px]'
          } ${
            isUrdu
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          aria-pressed={isUrdu}
          aria-label="زبان اردو میں تبدیل کریں (Switch language to Urdu)"
        >
          <span className="font-urdu leading-none">اردو</span>
        </button>
      </div>
    </div>
  );
};
