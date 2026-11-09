import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Calculator, Wallet, CheckCircle2, ArrowRight } from 'lucide-react';

interface FeaturedUAESectionProps {
  onOpenGratuity: () => void;
  onOpenSalary?: () => void;
}

export const FeaturedUAESection: React.FC<FeaturedUAESectionProps> = ({
  onOpenGratuity,
  onOpenSalary,
}) => {
  const { language, t } = useLanguage();
  const isUrdu = language === 'ur';

  return (
    <section className="w-full py-14 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-w-0">
          {/* Left Column: Context & Actions */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-4 min-w-0">
            <div className="text-xs font-semibold text-blue-700 dark:text-blue-400">
              {isUrdu ? 'یو اے ای ملازمین کے مالیاتی کیلکولیٹرز' : 'UAE Payroll & End-of-Service Estimators'}
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white text-balance break-words">
              {t.home.featuredUAEHeading}
            </h2>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              {t.home.featuredUAESubtitle}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>Monthly basic, housing, transport & net take-home AED breakdown</span>
              </div>
              <div className="flex items-start gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>21-day & 30-day basic wage gratuity tiers (Decree-Law No. 33 of 2021)</span>
              </div>
              <div className="flex items-start gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>Unpaid leave pro-rata adjustments & 2-year salary cap check</span>
              </div>
              <div className="flex items-start gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>Transparent step-by-step formulas with printable AED statements</span>
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              {onOpenSalary && (
                <a
                  href="/tools/uae-salary-calculator"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                      e.preventDefault();
                      onOpenSalary();
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 min-h-[44px] text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors shadow-2xs text-center"
                >
                  <Wallet className="w-4 h-4 shrink-0" />
                  <span>Open UAE Salary Calculator</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 rtl:rotate-180" />
                </a>
              )}

              <a
                href="/tools/uae-gratuity-calculator"
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onOpenGratuity();
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 min-h-[44px] text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors text-center"
              >
                <Calculator className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                <span>Open UAE Gratuity Calculator</span>
              </a>
            </div>
          </div>

          {/* Right Column: Reference Summary Card */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Standard Calculation Reference
                    </span>
                    <span className="text-[11px] text-slate-500">UAE Private-Sector Guidelines</span>
                  </div>
                </div>
                <span className="text-xs font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                  AED
                </span>
              </div>

              <div className="space-y-2.5 pt-4 text-xs tabular-nums">
                <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400">Personal Income Tax (Standard)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">0%</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400">Gratuity (&lt; 1 Year Service)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">AED 0.00</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400">Gratuity (Years 1 – 5)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">21 basic days / yr</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-slate-600 dark:text-slate-400">Gratuity (After 5 Years)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">30 basic days / yr</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600 dark:text-slate-400">Gratuity Ceiling</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-400">Max 2 years&apos; wage (Art. 51)</span>
                </div>
              </div>
            </div>

            <p className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Note: Estimates are provided for informational planning and depend on your employment contract, free-zone jurisdiction (e.g., DIFC DEWS), and applicable law.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
