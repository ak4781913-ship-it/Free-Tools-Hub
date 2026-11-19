/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronDown,
  Clock,
  Home,
  Info,
  Wrench,
} from 'lucide-react';
import { EDITORIAL_GUIDES, EditorialGuide } from '../../data/guidesData';
import { useLanguage } from '../../context/LanguageContext';

interface GuideArticlePageProps {
  guide: EditorialGuide;
  onNavigateTo: (path: string) => void;
}

export const GuideArticlePage: React.FC<GuideArticlePageProps> = ({
  guide,
  onNavigateTo,
}) => {
  const { language, dir } = useLanguage();
  const isUrdu = language === 'ur';
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const otherGuides = EDITORIAL_GUIDES.filter(
    (g) => g.slug !== guide.slug
  ).slice(0, 3);

  const handleLinkClick = (path: string, e: React.MouseEvent) => {
    if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
      e.preventDefault();
      onNavigateTo(path);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Breadcrumb */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 min-w-0">
            <a
              href="/"
              onClick={(e) => handleLinkClick('/', e)}
              className="hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-1 font-medium shrink-0"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'ہوم' : 'Home'}</span>
            </a>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">/</span>
            <a
              href="/guides"
              onClick={(e) => handleLinkClick('/guides', e)}
              className="hover:text-blue-700 dark:hover:text-blue-400 font-medium shrink-0"
            >
              {isUrdu ? 'گائیڈز' : 'Guides'}
            </a>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">/</span>
            <span className="font-semibold text-slate-900 dark:text-white truncate">
              {guide.title}
            </span>
          </nav>

          <a
            href="/guides"
            onClick={(e) => handleLinkClick('/guides', e)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0"
          >
            {dir === 'rtl' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{isUrdu ? 'تمام گائیڈز' : 'All Guides'}</span>
          </a>
        </div>
      </div>

      {/* Article Container */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8" dir="ltr">
        <header className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              {guide.category}
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {guide.readTimeMinutes} min read
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              Updated {guide.updatedDate} · Published by MAWA
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {guide.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {guide.summary}
          </p>
        </header>

        {/* Body Sections */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-7">
          {guide.sections.map((section, sIdx) => (
            <section key={sIdx} className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {section.heading}
              </h2>
              {section.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="list-disc list-inside space-y-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed ps-1">
                  {section.bullets.map((b, bIdx) => (
                    <li key={bIdx}>{b}</li>
                  ))}
                </ul>
              )}
              {section.callout && (
                <div
                  className={`p-4 rounded-xl border text-xs sm:text-sm leading-relaxed flex items-start gap-2.5 ${
                    section.callout.tone === 'warning'
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-200'
                      : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60 text-blue-950 dark:text-blue-200'
                  }`}
                >
                  {section.callout.tone === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                  )}
                  <div>
                    <strong className="block mb-0.5">{section.callout.title}</strong>
                    <span>{section.callout.body}</span>
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Related Tools CTA */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Try the Free Browser Tools Featured in This Guide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {guide.relatedToolPaths.map((toolLink) => (
              <a
                key={toolLink.path}
                href={toolLink.path}
                onClick={(e) => handleLinkClick(toolLink.path, e)}
                className="flex items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-blue-500 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {toolLink.label}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                    {toolLink.desc}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
              </a>
            ))}
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Browse Category:</span>
            {guide.relatedCategoryPaths.map((cat) => (
              <a
                key={cat.path}
                href={cat.path}
                onClick={(e) => handleLinkClick(cat.path, e)}
                className="font-bold text-blue-700 dark:text-blue-400 hover:underline"
              >
                {cat.label}
              </a>
            ))}
          </div>
        </section>

        {/* Visible FAQ Accordion (Matches Article + FAQPage JSON-LD 100%) */}
        {guide.faqs.length > 0 && (
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <div className="space-y-2.5">
              {guide.faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-start text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2.5">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* More Guides */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Continue Reading
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {otherGuides.map((g) => (
              <a
                key={g.slug}
                href={g.path}
                onClick={(e) => handleLinkClick(g.path, e)}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors space-y-1.5"
              >
                <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400">
                  {g.category}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                  {g.title}
                </div>
              </a>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
};
