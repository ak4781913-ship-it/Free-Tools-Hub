/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export interface ThemeToggleSwitchProps {
  className?: string;
  size?: 'sm' | 'md';
  showLabels?: boolean;
}

export const ThemeToggleSwitch: React.FC<ThemeToggleSwitchProps> = ({
  className = '',
  size = 'md',
  showLabels = false,
}) => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const { language } = useLanguage();
  const isUrdu = language === 'ur';
  const isDark = theme === 'dark';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      toggleTheme();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setTheme('light');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setTheme('dark');
    }
  };

  const isSm = size === 'sm';

  const titleText = isDark
    ? isUrdu
      ? 'لائٹ موڈ میں تبدیل کریں (Switch to Light Mode)'
      : 'Switch to Light Mode'
    : isUrdu
      ? 'ڈارک موڈ میں تبدیل کریں (Switch to Dark Mode)'
      : 'Switch to Dark Mode';

  const baseDisplay = /\bhidden\b/.test(className) ? '' : 'inline-flex';

  return (
    <div
      dir="ltr"
      className={`${baseDisplay} items-center ${className}`.trim()}
    >
      <div
        role="switch"
        aria-checked={isDark}
        aria-label={
          isDark
            ? isUrdu
              ? 'ڈارک موڈ آن ہے، لائٹ موڈ پر تبدیل کرنے کے لیے دبائیں'
              : 'Dark mode is active. Click to switch to light mode'
            : isUrdu
              ? 'لائٹ موڈ آن ہے، ڈارک موڈ پر تبدیل کرنے کے لیے دبائیں'
              : 'Light mode is active. Click to switch to dark mode'
        }
        tabIndex={0}
        onClick={toggleTheme}
        onKeyDown={handleKeyDown}
        title={titleText}
        className={`relative inline-flex items-center p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800/90 shadow-2xs select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 transition-all ${
          isSm ? 'text-[11px]' : 'text-xs'
        }`}
      >
        {/* Animated Background Sliding Indicator Pill */}
        <div
          className={`absolute top-0.5 bottom-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-all duration-200 ease-out pointer-events-none ${
            isDark
              ? 'left-[50%] right-0.5'
              : 'left-0.5 right-[50%]'
          }`}
        />

        {/* Light Segment Button (Sun) */}
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            toggleTheme();
          }}
          className={`relative z-10 flex items-center justify-center gap-1 font-semibold rounded-lg transition-colors cursor-pointer ${
            isSm ? 'px-2 py-1 min-h-[28px]' : 'px-2.5 py-1.5 min-h-[32px]'
          } ${
            !isDark
              ? 'text-amber-500 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-amber-500'
          }`}
          aria-pressed={!isDark}
          aria-label={isUrdu ? 'لائٹ موڈ' : 'Switch to Light Mode'}
          title={isUrdu ? 'لائٹ موڈ' : 'Light Mode'}
        >
          <Sun className={`${isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0`} />
          {showLabels && (
            <span className="font-medium text-[11px]">
              {isUrdu ? 'روشن' : 'Light'}
            </span>
          )}
        </button>

        {/* Dark Segment Button (Moon) */}
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            toggleTheme();
          }}
          className={`relative z-10 flex items-center justify-center gap-1 font-semibold rounded-lg transition-colors cursor-pointer ${
            isSm ? 'px-2 py-1 min-h-[28px]' : 'px-2.5 py-1.5 min-h-[32px]'
          } ${
            isDark
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-indigo-400'
          }`}
          aria-pressed={isDark}
          aria-label={isUrdu ? 'ڈارک موڈ' : 'Switch to Dark Mode'}
          title={isUrdu ? 'ڈارک موڈ' : 'Dark Mode'}
        >
          <Moon className={`${isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0`} />
          {showLabels && (
            <span className="font-medium text-[11px]">
              {isUrdu ? 'تاریک' : 'Dark'}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
