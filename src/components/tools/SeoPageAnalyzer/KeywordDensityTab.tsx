import React, { useState, useMemo } from 'react';
import { SeoAnalysisResult, KeywordItem } from './seoAnalysisTypes';
import {
  findKeywordOccurrences,
  evaluateCustomKeyword,
} from './keywordDensityService';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Hash,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  BookOpen,
  Sparkles,
  Layers,
  ArrowRight,
  Eye,
  Check,
  X,
  Target,
  FileText,
} from 'lucide-react';

interface KeywordDensityTabProps {
  result: SeoAnalysisResult;
}

export const KeywordDensityTab: React.FC<KeywordDensityTabProps> = ({ result }) => {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  const { keywords } = result;

  // Selected phrase length sub-tab: 1-word, 2-word, or 3-word
  const [ngramTab, setNgramTab] = useState<'1' | '2' | '3'>('1');

  // Active highlighted keyword
  const defaultInitialKeyword =
    keywords.topKeywords1[0]?.keyword ||
    keywords.topKeywords2[0]?.keyword ||
    '';
  const [selectedKeyword, setSelectedKeyword] = useState<string>(defaultInitialKeyword);
  const [customKeywordInput, setCustomKeywordInput] = useState<string>('');

  // Evaluated custom or selected keyword
  const activeKeyword = customKeywordInput.trim() || selectedKeyword;

  const evaluatedActiveKeyword = useMemo(() => {
    if (!activeKeyword) return null;
    return evaluateCustomKeyword(
      activeKeyword,
      keywords.rawVisibleText,
      keywords.totalWords,
      result.meta.title.content || '',
      result.meta.description.content || '',
      result.headings.h1List[0] || '',
      result.headings.items.map((h) => h.text),
      keywords.contentBlocks
    );
  }, [activeKeyword, keywords, result]);

  // Occurrences of active keyword in content
  const occurrenceData = useMemo(() => {
    if (!activeKeyword) return { totalMatches: 0, occurrences: [] };
    return findKeywordOccurrences(keywords.contentBlocks, activeKeyword);
  }, [keywords.contentBlocks, activeKeyword]);

  // Active N-gram list
  const activeNgramList: KeywordItem[] = useMemo(() => {
    if (ngramTab === '1') return keywords.topKeywords1;
    if (ngramTab === '2') return keywords.topKeywords2;
    return keywords.topKeywords3;
  }, [ngramTab, keywords]);

  return (
    <div className="space-y-6">
      {/* 1. Header Overview & Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Total Words */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span>{isUrdu ? 'کل الفاظ' : 'Total Words'}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {keywords.totalWords.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>~{keywords.readingTimeMinutes} min read</span>
          </p>
        </div>

        {/* Unique Vocabulary */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{isUrdu ? 'منفرد الفاظ' : 'Unique Words'}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
              {keywords.uniqueWords.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {keywords.totalWords > 0
              ? `${Math.round((keywords.uniqueWords / keywords.totalWords) * 100)}% lexical diversity`
              : '0%'}
          </p>
        </div>

        {/* Top Keyword */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
            <Target className="w-4 h-4 text-emerald-500" />
            <span>{isUrdu ? 'مرکزی کی ورڈ' : 'Top Keyword'}</span>
          </div>
          <div className="mt-2 truncate">
            <span className="text-lg font-black text-slate-900 dark:text-white truncate block">
              {keywords.topKeywords1[0]?.keyword || '—'}
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            {keywords.topKeywords1[0]
              ? `${keywords.topKeywords1[0].count} uses • ${keywords.topKeywords1[0].density}% density`
              : 'No keywords'}
          </p>
        </div>

        {/* Stuffing Health */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
            <Hash className="w-4 h-4 text-teal-500" />
            <span>{isUrdu ? 'کی ورڈ اسٹفنگ کی جانچ' : 'Stuffing Health'}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            {keywords.hasKeywordStuffing ? (
              <span className="text-base font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Over-Optimized</span>
              </span>
            ) : (
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Natural Density</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {keywords.hasKeywordStuffing
              ? `${keywords.stuffingKeywords.length} term(s) >3.5% density`
              : 'Zero keyword stuffing detected'}
          </p>
        </div>
      </div>

      {/* 2. Interactive Keyword Search & Inspector Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{isUrdu ? 'کی ورڈ اینالائزر اور ہائی لائٹر' : 'Keyword Inspector & Occurrence Highlighter'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isUrdu
                ? 'کسی بھی مخصوص کی ورڈ کی ڈینسٹی کا حساب لگائیں اور صفحے کے اندر اس کے تمام مقامات دیکھیں:'
                : 'Inspect density, title/heading placement, and jump to highlighted occurrences throughout the page:'}
            </p>
          </div>

          {/* Quick Keyword Pill Suggestions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium">Quick Pick:</span>
            {keywords.topKeywords1.slice(0, 4).map((kw) => (
              <button
                key={kw.keyword}
                type="button"
                onClick={() => {
                  setSelectedKeyword(kw.keyword);
                  setCustomKeywordInput('');
                }}
                className={`px-2 py-0.5 text-xs rounded-md border transition-all cursor-pointer ${
                  activeKeyword === kw.keyword
                    ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/40'
                }`}
              >
                {kw.keyword}
              </button>
            ))}
          </div>
        </div>

        {/* Input Field for Custom Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={customKeywordInput}
              onChange={(e) => setCustomKeywordInput(e.target.value)}
              placeholder={isUrdu ? 'کوئی بھی کی ورڈ درج کریں... (مثلاً: pricing, tools, cloud)' : 'Type any custom keyword or phrase (e.g., pricing, cloud, free tools)...'}
              className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs placeholder-slate-400"
            />
            {customKeywordInput && (
              <button
                type="button"
                onClick={() => setCustomKeywordInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Active Inspected Keyword Performance Card */}
        {evaluatedActiveKeyword && (
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    "{evaluatedActiveKeyword.keyword}"
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      evaluatedActiveKeyword.status === 'optimal'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : evaluatedActiveKeyword.status === 'high'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                    }`}
                  >
                    {evaluatedActiveKeyword.status === 'optimal'
                      ? (isUrdu ? 'بہترین ڈینسٹی' : 'Optimal Density (1-3.5%)')
                      : evaluatedActiveKeyword.status === 'high'
                      ? (isUrdu ? 'زیادہ تکرار (اسٹفنگ)' : 'High Density (>3.5%)')
                      : (isUrdu ? 'کم تکرار' : 'Low Density (<1%)')}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                  <span>Occurrences: <strong className="text-slate-900 dark:text-white font-mono">{evaluatedActiveKeyword.count}</strong></span>
                  <span>Density: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{evaluatedActiveKeyword.density}%</strong></span>
                </div>
              </div>
            </div>

            {/* Placement Checklist */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${
                  evaluatedActiveKeyword.inTitle
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
                title="Keyword present in <title>"
              >
                {evaluatedActiveKeyword.inTitle ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                <span>Title</span>
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${
                  evaluatedActiveKeyword.inMetaDescription
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
                title="Keyword present in Meta Description"
              >
                {evaluatedActiveKeyword.inMetaDescription ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                <span>Meta Desc</span>
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${
                  evaluatedActiveKeyword.inH1
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
                title="Keyword present in <h1> Headline"
              >
                {evaluatedActiveKeyword.inH1 ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                <span>H1</span>
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${
                  evaluatedActiveKeyword.inHeadings
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
                title="Keyword present in H2-H6 Subheadings"
              >
                {evaluatedActiveKeyword.inHeadings ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                <span>Subheadings</span>
              </span>

              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${
                  evaluatedActiveKeyword.inFirst100Words
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
                title="Keyword present in first 100 words of page content"
              >
                {evaluatedActiveKeyword.inFirst100Words ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                <span>First 100 Words</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Highlighted Occurrences Throughout the Content */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isUrdu ? 'صفحے کے متن میں کی ورڈ کے مقامات' : 'Occurrences in Page Content'}
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold">
              {occurrenceData.totalMatches} {isUrdu ? 'مرتبہ' : 'matches found'}
            </span>
          </div>

          <span className="text-xs text-slate-400">
            Keyword: <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">{activeKeyword || 'None'}</strong>
          </span>
        </div>

        {/* Occurrences List */}
        {occurrenceData.occurrences.length > 0 ? (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {occurrenceData.occurrences.map((item, idx) => (
              <div
                key={`${item.blockIndex}-${idx}`}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors flex items-start gap-3"
              >
                <span className="inline-block px-1.5 py-0.5 rounded uppercase text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0 mt-0.5">
                  {item.blockTag}
                </span>

                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans flex-1">
                  <span>{item.snippetBefore}</span>
                  <mark className="bg-amber-300 dark:bg-amber-400 text-slate-950 font-bold px-1 py-0.5 rounded shadow-2xs mx-0.5">
                    {item.matchedText}
                  </mark>
                  <span>{item.snippetAfter}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 space-y-1">
            <p>No direct occurrences found in visible body text for "{activeKeyword}".</p>
            <p className="text-[11px] text-slate-500">Pick a recommended keyword from the tables below or adjust your search.</p>
          </div>
        )}
      </div>

      {/* 4. Ranked Keyword Frequency Tables (1-Word, 2-Word, 3-Word) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isUrdu ? 'کی ورڈ فریکوئنسی اور ڈینسٹی ٹیبل' : 'Keyword Frequency & Density Catalog'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isUrdu
                ? 'مقبول ترین الفاظ اور فقروں کا تجزیہ بشمول ان کی پوزیشنز:'
                : 'Ranked analysis of 1-word, 2-word, and 3-word n-gram terms across your page content:'}
            </p>
          </div>

          {/* Sub-tab selection: 1-word, 2-word, 3-word */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setNgramTab('1')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                ngramTab === '1'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              1-Word ({keywords.topKeywords1.length})
            </button>
            <button
              type="button"
              onClick={() => setNgramTab('2')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                ngramTab === '2'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              2-Word Phrases ({keywords.topKeywords2.length})
            </button>
            <button
              type="button"
              onClick={() => setNgramTab('3')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                ngramTab === '3'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              3-Word Long-Tail ({keywords.topKeywords3.length})
            </button>
          </div>
        </div>

        {/* Table of Keywords */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Keyword / Phrase</th>
                <th className="py-2.5 px-3">Count</th>
                <th className="py-2.5 px-3">Density</th>
                <th className="py-2.5 px-3">Density Status</th>
                <th className="py-2.5 px-3">Placements</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeNgramList.map((item) => {
                const isSelected = activeKeyword === item.keyword;

                return (
                  <tr
                    key={item.keyword}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Keyword */}
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{item.keyword}</span>
                        {item.inTitle && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold">
                            Title
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Count */}
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {item.count}
                    </td>

                    {/* Density Meter */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.status === 'optimal'
                                ? 'bg-emerald-500'
                                : item.status === 'high'
                                ? 'bg-amber-500'
                                : 'bg-blue-400'
                            }`}
                            style={{ width: `${Math.min(100, item.density * 25)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {item.density}%
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'optimal'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : item.status === 'high'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                        }`}
                      >
                        {item.status === 'optimal'
                          ? 'Optimal (1-3%)'
                          : item.status === 'high'
                          ? 'High (>3.5%)'
                          : 'Low (<1%)'}
                      </span>
                    </td>

                    {/* Placements */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1 text-[10px]">
                        <span
                          className={`px-1.5 py-0.2 rounded font-mono ${
                            item.inH1
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          H1
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-mono ${
                            item.inHeadings
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          H2-H6
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded font-mono ${
                            item.inMetaDescription
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          Meta
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedKeyword(item.keyword);
                          setCustomKeywordInput('');
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600'
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        <span>{isSelected ? 'Highlighting' : 'Highlight'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
