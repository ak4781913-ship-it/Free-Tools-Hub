/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, Check } from 'lucide-react';
import { usePWAInstall } from '../../utils/usePWAInstall';
import { useLanguage } from '../../context/LanguageContext';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'button' | 'menu';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { language, dir } = useLanguage();
  const isUrdu = language === 'ur';

  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Suppress button if already installed in standalone mode
  if (isInstalled) {
    return null;
  }

  const baseDisplay = /\bhidden\b/.test(className) ? '' : 'inline-flex';
  const isMenuVariant = variant === 'menu';

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        title={isUrdu ? 'ایپ کو ہوم سکرین پر انسٹال کریں' : 'Install FreeTools Hub as offline app'}
        className={`${baseDisplay} items-center justify-center gap-1.5 ${
          isMenuVariant ? 'min-h-[44px] w-full px-3.5 py-2.5' : 'px-2.5 py-1.5'
        } text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors cursor-pointer ${className}`.trim()}
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>{isUrdu ? 'ایپ انسٹال کریں' : 'Install App'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          title={isUrdu ? 'آئی فون پر انسٹال کریں' : 'Install on iPhone / iPad'}
          className={`${baseDisplay} items-center justify-center gap-1.5 ${
            isMenuVariant ? 'min-h-[44px] w-full px-3.5 py-2.5' : 'px-2.5 py-1.5'
          } text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer ${className}`.trim()}
        >
          <Download className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>{isUrdu ? 'آئی فون پر انسٹال کریں' : isMenuVariant ? 'Install on iPhone / iPad' : 'Install'}</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setShowIOSGuide(false)}
            role="dialog"
            aria-modal="true"
            aria-label={isUrdu ? 'آئی فون یا آئی پیڈ پر انسٹال کریں' : 'Install on iPhone or iPad'}
          >
            <div
              className="relative w-full max-w-[calc(100vw-2rem)] sm:max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-left rtl:text-right"
              onClick={(e) => e.stopPropagation()}
              dir={dir}
            >
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <Download className="w-5 h-5 text-indigo-600 shrink-0" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {isUrdu ? 'آئی فون یا آئی پیڈ پر انسٹال کریں' : 'Install on iPhone / iPad'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label={isUrdu ? 'بند کریں' : 'Close dialog'}
                  className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </div>
                  <p>
                    {isUrdu ? (
                      <>صفاری کے نیچے موجود <Share2 className="w-3.5 h-3.5 inline mx-1 text-indigo-500" /> <strong>شیئر (Share)</strong> بٹن پر ٹیپ کریں۔</>
                    ) : (
                      <>Tap the <Share2 className="w-3.5 h-3.5 inline mx-1 text-indigo-500" /> <strong>Share</strong> button in Safari toolbar.</>
                    )}
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </div>
                  <p>
                    {isUrdu ? (
                      <>نیچے سکرول کریں اور <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-indigo-500" /> <strong>ہوم اسکرین پر شامل کریں (Add to Home Screen)</strong> منتخب کریں۔</>
                    ) : (
                      <>Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-indigo-500" /> <strong>Add to Home Screen</strong>.</>
                    )}
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </div>
                  <p>
                    {isUrdu ? 'اوپر دائیں کونے میں شامل کریں (Add) پر کلک کریں۔' : 'Tap Add in the top-right corner to complete installation.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {isUrdu ? 'سمجھ آگیا' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
