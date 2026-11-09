import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, MessageSquare, Keyboard, Printer, RefreshCw } from 'lucide-react';
import { getPrintHistory, subscribeToPrintHistory } from '../../utils/printHistoryTracking';

interface FooterProps {
  onNavigate: (viewId: string) => void;
  onOpenLegal?: (type: 'privacy' | 'terms' | 'disclaimer' | 'contact') => void;
  onOpenFeedback: () => void;
  onOpenShortcuts?: () => void;
  onStartTour?: () => void;
  onOpenPrintHistory?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  onOpenFeedback,
  onOpenShortcuts,
  onStartTour,
  onOpenPrintHistory,
}) => {
  const { language, t } = useLanguage();
  const { syncApp, isSyncing } = useToast();
  const isUrdu = language === 'ur';

  const [printCount, setPrintCount] = useState<number>(() => {
    try {
      return getPrintHistory().length;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    setPrintCount(getPrintHistory().length);
    const unsubscribe = subscribeToPrintHistory((items) => {
      setPrintCount(items.length);
    });
    return () => unsubscribe();
  }, []);

  const handleLinkClick = (path: string, e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <footer className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Brand & Privacy Commitment */}
          <div className="space-y-3">
            <a
              href="/"
              onClick={(e) => handleLinkClick('/', e)}
              className="inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md"
            >
              <div className="w-7 h-7 rounded-md bg-slate-900 dark:bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                FT
              </div>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                {t.siteName}
              </span>
            </a>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.siteTagline}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{isUrdu ? 'براؤزر کے اندر محفوظ پروسیسنگ' : 'Client-Side Browser Processing'}</span>
            </div>
          </div>

          {/* Column 2: Featured Tools */}
          <div className="space-y-2.5">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              {isUrdu ? 'نمایاں ٹولز' : 'Featured Tools'}
            </h2>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <a
                  href="/tools/cv-maker"
                  onClick={(e) => handleLinkClick('/tools/cv-maker', e)}
                  className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  CV & Resume Generator
                </a>
              </li>
              <li>
                <a
                  href="/tools/uae-salary-calculator"
                  onClick={(e) => handleLinkClick('/tools/uae-salary-calculator', e)}
                  className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  UAE Salary Calculator
                </a>
              </li>
              <li>
                <a
                  href="/tools/uae-gratuity-calculator"
                  onClick={(e) => handleLinkClick('/tools/uae-gratuity-calculator', e)}
                  className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  UAE Gratuity Calculator
                </a>
              </li>
              <li>
                <a
                  href="/tools/ai-photo-prompt-generator"
                  onClick={(e) => handleLinkClick('/tools/ai-photo-prompt-generator', e)}
                  className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  AI Image Prompt Generator
                </a>
              </li>
              <li>
                <a
                  href="/tools/ai-video-prompt-generator"
                  onClick={(e) => handleLinkClick('/tools/ai-video-prompt-generator', e)}
                  className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  AI Video Prompt Generator
                </a>
              </li>
              <li>
                <a
                  href="/tools"
                  onClick={(e) => handleLinkClick('/tools', e)}
                  className="font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                >
                  Browse All 27 Tools →
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Popular Utilities */}
          <div className="space-y-2.5">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              {isUrdu ? 'آن لائن یوٹیلیٹیز' : 'Online Utilities'}
            </h2>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <a
                  href="/tools/seo-page-analyzer"
                  onClick={(e) => handleLinkClick('/tools/seo-page-analyzer', e)}
                  className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  SEO Page Analyzer
                </a>
              </li>
              <li>
                <a
                  href="/tools/image-compressor"
                  onClick={(e) => handleLinkClick('/tools/image-compressor', e)}
                  className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  Image Compressor
                </a>
              </li>
              <li>
                <a
                  href="/tools/qr-code-generator"
                  onClick={(e) => handleLinkClick('/tools/qr-code-generator', e)}
                  className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  QR Code Generator
                </a>
              </li>
              <li>
                <a
                  href="/tools/json-formatter"
                  onClick={(e) => handleLinkClick('/tools/json-formatter', e)}
                  className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  JSON Formatter & Validator
                </a>
              </li>
              <li>
                <a
                  href="/tools/loan-calculator"
                  onClick={(e) => handleLinkClick('/tools/loan-calculator', e)}
                  className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  Loan & EMI Calculator
                </a>
              </li>
              <li>
                <a
                  href="/tools/unit-converter"
                  onClick={(e) => handleLinkClick('/tools/unit-converter', e)}
                  className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  Universal Unit Converter
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Company, Legal & Support */}
          <div className="space-y-2.5">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              {isUrdu ? 'قانونی معلومات اور رابطہ' : 'Information & Legal'}
            </h2>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <a
                  href="/about"
                  onClick={(e) => handleLinkClick('/about', e)}
                  className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  {isUrdu ? 'ہمارے بارے میں (About)' : 'About FreeTools Hub'}
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => handleLinkClick('/contact', e)}
                  className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  {t.nav.contact}
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => handleLinkClick('/privacy', e)}
                  className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  {t.nav.privacy}
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => handleLinkClick('/terms', e)}
                  className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  {t.nav.terms}
                </a>
              </li>
              <li>
                <a
                  href="/disclaimer"
                  onClick={(e) => handleLinkClick('/disclaimer', e)}
                  className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  {isUrdu ? 'قانونی دستبرداری (Disclaimer)' : 'Legal & Calculator Disclaimer'}
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenFeedback}
                  className="font-semibold text-blue-700 dark:text-blue-400 hover:underline transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{isUrdu ? 'فیچر یا بگ رپورٹ' : 'Report Issue / Request Tool'}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Hairline divider & bottom bar */}
        <div className="mt-10 pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} AbbasPro / FreeTools Hub. All rights reserved.</p>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {onStartTour && (
              <button
                type="button"
                onClick={onStartTour}
                className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                {t.tour.gettingStarted}
              </button>
            )}

            {onOpenPrintHistory && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={onOpenPrintHistory}
                  className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer inline-flex items-center gap-1"
                  title="View recent printed or exported documents"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t.printHistory?.footerLink || 'Print History'}</span>
                  <span className="font-mono tabular-nums text-[11px]">({printCount}/5)</span>
                </button>
              </>
            )}

            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={syncApp}
              disabled={isSyncing}
              className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-60"
              title="Verify Service Worker offline cache and check for updates"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? (t.syncToasts?.syncingTitle || 'Syncing...') : (t.syncToasts?.syncNow || 'Offline Cache Sync')}</span>
            </button>

            {onOpenShortcuts && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={onOpenShortcuts}
                  className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Shortcuts (?)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
