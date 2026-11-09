import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { MousePointerClick, SlidersHorizontal, Download } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const { t } = useLanguage();

  const steps = [
    {
      num: '01',
      title: t.home.step1Title,
      desc: t.home.step1Desc,
      icon: MousePointerClick,
    },
    {
      num: '02',
      title: t.home.step2Title,
      desc: t.home.step2Desc,
      icon: SlidersHorizontal,
    },
    {
      num: '03',
      title: t.home.step3Title,
      desc: t.home.step3Desc,
      icon: Download,
    },
  ];

  return (
    <section className="w-full py-16 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.home.howItWorksHeading}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Engineered for pure speed, clean outputs, and maximum data confidentiality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="relative p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xl font-bold font-mono text-slate-300 dark:text-slate-700">
                    {step.num}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
