/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  FileText,
  Home,
} from 'lucide-react';
import { CategoryLandingConfig, CATEGORY_LANDINGS } from '../../data/categorySeoData';
import { TOOLS_LIST } from '../../data/tools';
import { TOOL_ROUTES, getToolPrimaryPath } from '../../data/toolsRouting';
import { PDF_LANDING_ROUTES } from '../../data/pdfLandingRoutes';
import { getGuidesBySlugs } from '../../data/guidesData';
import { useLanguage } from '../../context/LanguageContext';
import { ToolCard } from '../home/ToolCard';

interface CategoryLandingPageProps {
  category: CategoryLandingConfig;
  onNavigateTo: (path: string) => void;
}

export const CategoryLandingPage: React.FC<CategoryLandingPageProps> = ({
  category,
  onNavigateTo,
}) => {
  const { language, dir } = useLanguage();
  const isUrdu = language === 'ur';
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const categoryToolIds = Object.values(TOOL_ROUTES)
    .filter((r) => r.categoryGroup === category.id)
    .map((r) => r.id);
  const tools = TOOLS_LIST.filter((t) => categoryToolIds.includes(t.id));
  const relatedGuides = getGuidesBySlugs(category.relatedGuideSlugs);
  const otherCategories = CATEGORY_LANDINGS.filter((c) => c.id !== category.id);

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
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 min-w-0">
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
              href="/tools"
              onClick={(e) => handleLinkClick('/tools', e)}
              className="hover:text-blue-700 dark:hover:text-blue-400 font-medium shrink-0"
            >
              {isUrdu ? 'تمام ٹولز' : 'All Tools'}
            </a>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">/</span>
            <span className="font-semibold text-slate-900 dark:text-white truncate">
              {isUrdu ? category.nameUrdu : category.name}
            </span>
          </nav>

          <a
            href="/tools"
            onClick={(e) => handleLinkClick('/tools', e)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0"
          >
            {dir === 'rtl' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{isUrdu ? 'تمام ٹولز' : 'All Tools'}</span>
          </a>
        </div>
      </div>

      {/* Category Hero */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
            {isUrdu ? category.nameUrdu : category.name}
          </p>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {category.h1}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            {category.overview}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Category Tools Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {isUrdu ? `شامل ٹولز (${tools.length})` : `Included Tools (${tools.length})`}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {tools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onSelect={(id) => onNavigateTo(getToolPrimaryPath(id))}
              />
            ))}
          </div>
        </section>

        {/* Direct PDF Action Shortcuts (only when viewing PDF category) */}
        {category.id === 'pdf-tools' && (
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Direct PDF Workflow Pages ({PDF_LANDING_ROUTES.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Launch any top PDF task on its own dedicated page with tailored instructions and FAQ guide.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PDF_LANDING_ROUTES.map((pdf) => (
                <a
                  key={pdf.primarySlug}
                  href={pdf.primaryPath}
                  onClick={(e) => handleLinkClick(pdf.primaryPath, e)}
                  className="flex items-center justify-between gap-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {pdf.h1}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {pdf.supportedFormats}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 rtl:rotate-180" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Highlights + FAQs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Key Capabilities &amp; Architecture
            </h2>
            <ul className="space-y-3">
              {category.highlights.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <div className="space-y-2.5">
              {category.faqs.map((faq, idx) => {
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
        </div>

        {/* Related Guides */}
        {relatedGuides.length > 0 && (
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Recommended Tutorials &amp; Guides
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {relatedGuides.map((g) => (
                <a
                  key={g.slug}
                  href={g.path}
                  onClick={(e) => handleLinkClick(g.path, e)}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-blue-500 transition-colors space-y-1.5"
                >
                  <div className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                    {g.category} · {g.readTimeMinutes} min read
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {g.title}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {g.summary}
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Explore Other Categories */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Browse Other Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherCategories.map((c) => (
              <a
                key={c.id}
                href={c.path}
                onClick={(e) => handleLinkClick(c.path, e)}
                className="flex items-center justify-between gap-2 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors"
              >
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {isUrdu ? c.nameUrdu : c.name}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 rtl:rotate-180" />
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
