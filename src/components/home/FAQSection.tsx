import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Are these tools completely free to use?',
      a: 'Yes, 100% free. FreeTools Hub does not require registration, login, credit cards, or hidden subscription plans. You have unlimited access to all utilities including the CV Generator, UAE Gratuity Calculator, and AI Prompt Builders.',
    },
    {
      q: 'Is my personal data or CV uploaded to your servers?',
      a: 'No. FreeTools Hub prioritizes privacy. Your resume data, salary inputs, text conversions, and uploaded images are processed entirely on your local machine within your web browser memory. No data is stored or logged on remote servers.',
    },
    {
      q: 'How accurate is the UAE Gratuity Calculator?',
      a: 'The calculation strictly mirrors UAE Federal Decree-Law No. 33 of 2021 (in force from February 2, 2022). It handles the statutory 21-day tier (years 1-5), 30-day tier (years 5+), pro-rata calculation on working days, and the mandatory 24-month basic salary maximum cap. It also supports historical Law No. 8 of 1980 rules for reference. Note that results are estimates and final settlements are governed by MOHRE or applicable Free Zone authorities.',
    },
    {
      q: 'Can I export my resume as a PDF?',
      a: 'Yes. Our CV Generator produces print-ready A4 documents with precise typography and margin containment. You can download directly via high-quality print-to-PDF or export your resume data as JSON backup to reload anytime.',
    },
    {
      q: 'How does the Gemini Photo Prompt Generator preserve face likeness?',
      a: 'When you activate "Reference Image Identity Preservation Mode", the generator formulates strict directive modifiers instructing multimodal AI models (such as Gemini 2.5 / Imagen / Midjourney v6) to maintain the exact facial bone structure, eyes, and likeness of your reference photo while changing only the requested wardrobe, background, or lighting.',
    },
    {
      q: 'Does FreeTools Hub support Urdu and Right-to-Left (RTL) reading?',
      a: 'Yes. You can switch between English and Urdu with a single click at the top bar. The application automatically configures RTL direction, input alignments, and translated labels without clearing any data you have already entered.',
    },
  ];

  return (
    <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
          <HelpCircle className="w-4 h-4" />
          <span>Help & Transparency</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t.home.faqHeading}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
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
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
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
