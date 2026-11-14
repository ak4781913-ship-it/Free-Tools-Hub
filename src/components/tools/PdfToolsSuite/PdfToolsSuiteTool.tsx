/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  FileStack,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { PdfCategoryId, PdfSubToolId, PdfToolDescriptor } from './pdfSuiteTypes';
import {
  PDF_CATEGORIES,
  PDF_TOOLS_CATALOG,
  getPdfToolById,
  getPdfToolsByCategory,
} from './pdfSuiteCatalog';
import { PDF_SUITE_TEXT } from './pdfSuiteTranslations';
import { PdfIcon } from './PdfIcon';
import { PdfToolWorkspace } from './PdfToolWorkspace';

function readSubToolFromUrl(): PdfSubToolId | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('tool');
  if (!raw) return null;
  const match = PDF_TOOLS_CATALOG.find((item) => item.id === raw);
  return match ? match.id : null;
}

export const PdfToolsSuiteTool: React.FC = () => {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';
  const t = isUrdu ? PDF_SUITE_TEXT.ur : PDF_SUITE_TEXT.en;

  const [activeToolId, setActiveToolId] = useState<PdfSubToolId | null>(() => readSubToolFromUrl());
  const [selectedCategory, setSelectedCategory] = useState<PdfCategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);

  // Sync sub-tool selection with `?tool=` query param (preserves /tools/pdf-tools-suite canonical path)
  const selectSubTool = (id: PdfSubToolId | null) => {
    setActiveToolId(id);
    setShowQuickSwitcher(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (id) {
        url.searchParams.set('tool', id);
      } else {
        url.searchParams.delete('tool');
      }
      window.history.replaceState({}, '', `${url.pathname}${url.search}`);
    }
  };

  useEffect(() => {
    const handlePop = () => {
      setActiveToolId(readSubToolFromUrl());
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const popularTools = useMemo(
    () => PDF_TOOLS_CATALOG.filter((item) => item.isPopular),
    []
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredTools = useMemo(() => {
    return PDF_TOOLS_CATALOG.filter((tool) => {
      if (selectedCategory !== 'all' && tool.category !== selectedCategory) return false;
      if (!normalizedQuery) return true;
      return (
        tool.name.toLowerCase().includes(normalizedQuery) ||
        tool.nameUrdu.toLowerCase().includes(normalizedQuery) ||
        tool.description.toLowerCase().includes(normalizedQuery) ||
        tool.outputFormatLabel.toLowerCase().includes(normalizedQuery) ||
        tool.keywords.some((kw) => kw.toLowerCase().includes(normalizedQuery))
      );
    });
  }, [selectedCategory, normalizedQuery]);

  const activeTool = useMemo(
    () => (activeToolId ? getPdfToolById(activeToolId) : null),
    [activeToolId]
  );

  const renderToolCard = (tool: PdfToolDescriptor) => {
    const cat = PDF_CATEGORIES.find((c) => c.id === tool.category);
    return (
      <button
        key={tool.id}
        type="button"
        onClick={() => selectSubTool(tool.id)}
        className="group text-left rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 p-4 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-3"
      >
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 group-hover:bg-blue-700 group-hover:text-white transition-colors">
              <PdfIcon name={tool.iconName} className="w-5 h-5" />
            </div>
            <span className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {tool.outputFormatLabel}
            </span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
              {isUrdu ? tool.nameUrdu : tool.name}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {isUrdu ? tool.descriptionUrdu : tool.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-blue-700 dark:text-blue-300">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {cat ? `${cat.code}. ${isUrdu ? cat.nameUrdu : cat.name}` : ''}
          </span>
          <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            {t.openTool}
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </button>
    );
  };

  // =========================================================================
  // ACTIVE SUB-TOOL WORKSPACE VIEW
  // =========================================================================
  if (activeTool) {
    const activeCat = PDF_CATEGORIES.find((c) => c.id === activeTool.category);
    return (
      <div className="space-y-5" dir={isUrdu ? 'rtl' : 'ltr'}>
        {/* Top Sub-Tool Navigation Header */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => selectSubTool(null)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors min-h-[40px]"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.backToSuite} ({PDF_TOOLS_CATALOG.length})
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowQuickSwitcher((s) => !s)}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-3.5 py-2 text-xs sm:text-sm font-semibold text-blue-800 dark:text-blue-200 min-h-[40px]"
              >
                <FileStack className="w-4 h-4" />
                {t.switchTool}
                <ChevronDown className="w-4 h-4" />
              </button>

              {showQuickSwitcher && (
                <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-2 z-30 space-y-2">
                  {PDF_CATEGORIES.map((cat) => (
                    <div key={cat.id} className="space-y-1">
                      <p className="px-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {cat.code}. {isUrdu ? cat.nameUrdu : cat.name}
                      </p>
                      {getPdfToolsByCategory(cat.id).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectSubTool(item.id)}
                          className={`w-full text-left flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                            item.id === activeTool.id
                              ? 'bg-blue-700 text-white'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <PdfIcon name={item.iconName} className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{isUrdu ? item.nameUrdu : item.name}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0">
              <PdfIcon name={activeTool.iconName} className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {activeCat ? `${activeCat.code}. ${isUrdu ? activeCat.nameUrdu : activeCat.name}` : ''}
                </span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {activeTool.outputFormatLabel}
                </span>
              </div>
              <h2 className="mt-0.5 text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                {isUrdu ? activeTool.nameUrdu : activeTool.name}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {isUrdu ? activeTool.descriptionUrdu : activeTool.description}
              </p>
            </div>
          </div>
        </div>

        {/* Sub-Tool Execution Workspace */}
        <PdfToolWorkspace tool={activeTool} isUrdu={isUrdu} />
      </div>
    );
  }

  // =========================================================================
  // SUITE HUB DASHBOARD VIEW (43 Tools Across 7 Categories)
  // =========================================================================
  return (
    <div className="space-y-8" dir={isUrdu ? 'rtl' : 'ltr'}>
      {/* Hero Banner */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-lg bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-xs font-semibold text-blue-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t.badge}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t.heroTitle}</h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{t.heroSubtitle}</p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 shrink-0">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
              <p className="text-xl font-extrabold tabular-nums">{PDF_TOOLS_CATALOG.length}</p>
              <p className="text-[11px] text-slate-300 mt-0.5">{t.statTotalTools.replace(/^\d+\s*/, '')}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
              <p className="text-xl font-extrabold tabular-nums">{PDF_CATEGORIES.length}</p>
              <p className="text-[11px] text-slate-300 mt-0.5">{t.statCategories.replace(/^\d+\s*/, '')}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
              <p className="text-xl font-extrabold tabular-nums">100%</p>
              <p className="text-[11px] text-slate-300 mt-0.5">{isUrdu ? 'مقامی پرائیویسی' : 'Private'}</p>
            </div>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="mt-6 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchPlaceholder}
              className="w-full rounded-xl border border-white/15 bg-white/10 text-white placeholder:text-slate-300 pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors min-h-[38px] ${
                selectedCategory === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              {t.allCategories} ({PDF_TOOLS_CATALOG.length})
            </button>
            {PDF_CATEGORIES.map((cat) => {
              const count = getPdfToolsByCategory(cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors min-h-[38px] ${
                    selectedCategory === cat.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  <PdfIcon name={cat.iconName} className="w-3.5 h-3.5" />
                  <span>
                    {cat.code}. {isUrdu ? cat.nameUrdu : cat.name} ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Spotlight (when browsing All without active search) */}
      {selectedCategory === 'all' && !normalizedQuery && (
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{t.popularTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.popularSubtitle}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {popularTools.map(renderToolCard)}
          </div>
        </section>
      )}

      {/* Search Results OR Grouped Category Sections */}
      {normalizedQuery || selectedCategory !== 'all' ? (
        filteredTools.length > 0 ? (
          <section className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
              {selectedCategory !== 'all'
                ? (() => {
                    const cat = PDF_CATEGORIES.find((c) => c.id === selectedCategory);
                    return cat ? `${cat.code}. ${isUrdu ? cat.nameUrdu : cat.name}` : '';
                  })()
                : isUrdu
                ? `${filteredTools.length} ٹولز ملے`
                : `${filteredTools.length} Matching PDF Tools`}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredTools.map(renderToolCard)}
            </div>
          </section>
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-8 text-center space-y-3">
            <h4 className="text-base font-bold text-slate-900 dark:text-white">{t.emptySearchTitle}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t.emptySearchDesc}</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="rounded-xl bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 text-xs font-semibold"
            >
              {t.resetSearch}
            </button>
          </div>
        )
      ) : (
        <div className="space-y-8">
          {PDF_CATEGORIES.map((cat) => {
            const catTools = getPdfToolsByCategory(cat.id);
            return (
              <section key={cat.id} className="space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-blue-700 text-white flex items-center justify-center shrink-0">
                      <PdfIcon name={cat.iconName} className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                        {cat.code}. {isUrdu ? cat.nameUrdu : cat.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isUrdu ? cat.descriptionUrdu : cat.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                    {catTools.length} {t.toolsCountSuffix}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {catTools.map(renderToolCard)}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PdfToolsSuiteTool;
