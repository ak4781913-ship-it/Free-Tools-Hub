import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { HOMEPAGE_FAQS } from '../../data/seoRegistry';

export const FAQSection: React.FC = () => {
  const { language, t } = useLanguage();
  const isUrdu = language === 'ur';
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqs = HOMEPAGE_FAQS;

  return (
    <section className="w-full py-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
          <HelpCircle className="w-4 h-4" />
          <span>{isUrdu ? 'مدد اور شفافیت' : 'Help & Transparency'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t.home.faqHeading}
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
          {t.home.faqSub}
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 transition-colors"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full px-5 py-4 text-start flex items-center justify-between gap-4 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 text-indigo-600' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
