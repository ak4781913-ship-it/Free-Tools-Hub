/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Clock, Home } from 'lucide-react';
import { EDITORIAL_GUIDES, EditorialGuide } from '../../data/guidesData';
import { useLanguage } from '../../context/LanguageContext';

interface GuidesIndexPageProps {
  onNavigateTo: (path: string) => void;
}

const GUIDE_CATEGORIES: Array<'All' | EditorialGuide['category']> = [
  'All',
  'UAE Payroll & Compliance',
  'Career & Resumes',
  'PDF Workflows & Privacy',
  'SEO & Security',
];

export const GuidesIndexPage: React.FC<GuidesIndexPageProps> = ({ onNavigateTo }) => {
  const { language, dir } = useLanguage();
  const isUrdu = language === 'ur';
  const [selectedCategory, setSelectedCategory] = useState<'All' | EditorialGuide['category']>('All');

  const filteredGuides = useMemo(() => {
    if (selectedCategory === 'All') return EDITORIAL_GUIDES;
    return EDITORIAL_GUIDES.filter((g) => g.category === selectedCategory);
  }, [selectedCategory]);

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
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <a
              href="/"
              onClick={(e) => handleLinkClick('/', e)}
              className="hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-1 font-medium"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'ہوم' : 'Home'}</span>
            </a>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">/</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {isUrdu ? 'گائیڈز اور مضامین' : 'Guides & Tutorials'}
            </span>
          </nav>

          <a
            href="/tools"
            onClick={(e) => handleLinkClick('/tools', e)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            {dir === 'rtl' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{isUrdu ? 'تمام ٹولز' : 'Browse Tools'}</span>
          </a>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400">
            <BookOpen className="w-4 h-4" />
            <span>MAWA Editorial Documentation · {EDITORIAL_GUIDES.length} Guides</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Practical Guides, Calculators &amp; Workflow Tutorials
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Clear technical walkthroughs covering UAE Federal Decree-Law No. 33 of 2021 gratuity math, ATS resume formatting, local browser PDF workflows, on-page SEO audits, and offline password entropy.
          </p>
        </div>
      </section>

      {/* Filter Tabs & Article Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {GUIDE_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGuides.map((guide) => (
            <article
              key={guide.slug}
              className="flex flex-col justify-between p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-blue-700 dark:text-blue-400">
                    {guide.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {guide.readTimeMinutes}m
                  </span>
                </div>

                <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                  <a
                    href={guide.path}
                    onClick={(e) => handleLinkClick(guide.path, e)}
                    className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                  >
                    {guide.title}
                  </a>
                </h2>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {guide.summary}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 dark:text-slate-500 font-mono">
                  {guide.updatedDate}
                </span>
                <a
                  href={guide.path}
                  onClick={(e) => handleLinkClick(guide.path, e)}
                  className="inline-flex items-center gap-1 font-bold text-blue-700 dark:text-blue-400 hover:underline"
                >
                  <span>Read Guide</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};
