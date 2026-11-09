import React, { useState, useMemo } from 'react';
import { SeoAnalysisResult } from './seoAnalysisTypes';
import {
  computeSeoChecklist,
  SeoChecklistItem,
  ChecklistCategory,
  ChecklistSeverity,
} from './seoChecklistService';
import { useLanguage } from '../../../context/LanguageContext';
import {
  CheckSquare,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Search,
  Filter,
  Download,
  Share2,
  ExternalLink,
  Code2,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SeoChecklistTabProps {
  result: SeoAnalysisResult;
  onNavigateToTab?: (tab: 'issues' | 'meta' | 'headings' | 'performance' | 'links' | 'keywords' | 'fixcode' | 'social') => void;
}

export const SeoChecklistTab: React.FC<SeoChecklistTabProps> = ({
  result,
  onNavigateToTab,
}) => {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  // Compute checklist model
  const checklist = useMemo(() => computeSeoChecklist(result), [result]);

  // Filtering state
  const [severityFilter, setSeverityFilter] = useState<'all' | 'missing' | 'warning' | 'passed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ChecklistCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());

  // Toggle item expand
  const toggleExpand = (id: string) => {
    setExpandedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return checklist.items.filter((item) => {
      // Severity filter
      if (severityFilter === 'missing') {
        if (!item.isMissing && item.severity !== 'critical') return false;
      } else if (severityFilter === 'warning') {
        if (item.severity !== 'warning') return false;
      } else if (severityFilter === 'passed') {
        if (item.severity !== 'passed') return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesTag = item.elementTag.toLowerCase().includes(query);
        const matchesStatus = item.statusMessage.toLowerCase().includes(query);
        const matchesCategory = item.categoryLabel.toLowerCase().includes(query);
        if (!matchesName && !matchesTag && !matchesStatus && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [checklist.items, severityFilter, categoryFilter, searchQuery]);

  // Copy code snippet
  const handleCopySnippet = (item: SeoChecklistItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.fixSnippet) return;
    navigator.clipboard.writeText(item.fixSnippet);
    setCopiedSnippetId(item.id);
    setTimeout(() => setCopiedSnippetId(null), 2500);
  };

  // Copy markdown report of missing critical items
  const handleCopyMissingReport = () => {
    const missing = checklist.items.filter((i) => i.isMissing || i.severity === 'critical');
    let md = `# SEO Critical Elements Audit Report\n`;
    md += `Target URL: ${result.finalUrl || result.url}\n`;
    md += `Audit Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
    md += `Health Score: ${checklist.healthScore}% (${checklist.passedCount}/${checklist.totalItems} passed)\n\n`;

    if (missing.length === 0) {
      md += `✅ All critical SEO elements are present and configured on this page.\n`;
    } else {
      md += `## ❌ Missing or Critical SEO Elements (${missing.length})\n\n`;
      missing.forEach((item, idx) => {
        md += `### ${idx + 1}. ${item.name} (${item.elementTag})\n`;
        md += `- **Severity**: CRITICAL\n`;
        md += `- **Current Status**: ${item.statusMessage}\n`;
        md += `- **SEO Impact**: ${item.seoImpact}\n`;
        md += `- **Actionable Fix**: ${item.recommendation}\n`;
        if (item.fixSnippet) {
          md += `\`\`\`html\n${item.fixSnippet}\n\`\`\`\n`;
        }
        md += `\n`;
      });
    }

    const warnings = checklist.items.filter((i) => i.severity === 'warning');
    if (warnings.length > 0) {
      md += `## ⚠️ Recommended Optimizations (${warnings.length})\n\n`;
      warnings.forEach((item, idx) => {
        md += `- **${item.name}** (${item.elementTag}): ${item.statusMessage} — *Fix: ${item.recommendation}*\n`;
      });
    }

    navigator.clipboard.writeText(md);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 3000);
  };

  // Download checklist CSV
  const handleDownloadCsv = () => {
    const headers = ['Element Name', 'HTML Tag', 'Category', 'Status', 'Is Missing', 'Current Value', 'Recommendation', 'Fix Snippet'];
    const rows = checklist.items.map((i) => [
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.elementTag.replace(/"/g, '""')}"`,
      `"${i.categoryLabel.replace(/"/g, '""')}"`,
      `"${i.severity.toUpperCase()}"`,
      i.isMissing ? 'YES' : 'NO',
      `"${(i.currentValue || '').replace(/"/g, '""')}"`,
      `"${i.recommendation.replace(/"/g, '""')}"`,
      `"${(i.fixSnippet || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo_checklist_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Hero Card with Health Score & Quick Stats */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Title & Health Explanation */}
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" />
                {isUrdu ? 'ایس ای او آڈٹ چیک لسٹ' : 'SEO Core Elements Audit'}
              </span>
              <span className="text-xs text-slate-400">
                {isUrdu ? 'گوگل کرالر کے بنیادی معیارات' : 'Search Engine Crawlability Verification'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isUrdu ? 'اہم ترین ایس ای او عناصر کی فہرست' : 'Critical SEO Elements Checklist'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isUrdu
                ? 'گوگل اور بڑے سرچ انجنز کے لیے لازمی عناصر جیسے میٹا ڈسکرپشن، H1 ہیڈنگ، اور کینونیکل لنکس کی تصدیق کریں۔'
                : 'Scans the fetched HTML content for foundational on-page elements required by Google, Bing, and social crawlers for proper indexing, ranking, and rich snippet generation.'}
            </p>

            {/* Quick Missing Elements Notice */}
            {checklist.criticalMissingCount > 0 ? (
              <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-rose-300 bg-rose-950/60 border border-rose-800/80 px-3 py-2 rounded-xl">
                <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  {isUrdu
                    ? `${checklist.criticalMissingCount} انتہائی اہم عناصر غائب ہیں: ${checklist.missingCriticalList.join('، ')}`
                    : `Action Required: ${checklist.criticalMissingCount} critical element${checklist.criticalMissingCount > 1 ? 's' : ''} missing (${checklist.missingCriticalList.join(', ')})`}
                </span>
              </div>
            ) : (
              <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 px-3 py-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {isUrdu
                    ? 'تمام بنیادی اور انتہائی اہم ایس ای او عناصر کامیابی سے موجود ہیں!'
                    : 'All critical SEO elements (Meta Description, H1, Canonical URL, Title, Viewport) are present!'}
                </span>
              </div>
            )}
          </div>

          {/* Right Column: Health Score Dial & Metrics */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl shrink-0 backdrop-blur-xs">
            {/* Score Ring Visual */}
            <div className="text-center sm:text-left space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {isUrdu ? 'چیک لسٹ ہیلتھ اسکور' : 'Checklist Health'}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-4xl sm:text-5xl font-black ${
                  checklist.healthScore >= 80
                    ? 'text-emerald-400'
                    : checklist.healthScore >= 50
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}>
                  {checklist.healthScore}%
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  ({checklist.passedCount}/{checklist.totalItems} {isUrdu ? 'پاس' : 'passed'})
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-44 bg-slate-800 rounded-full h-2 overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    checklist.healthScore >= 80
                      ? 'bg-emerald-500'
                      : checklist.healthScore >= 50
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${checklist.healthScore}%` }}
                />
              </div>
            </div>

            {/* Metric Pills */}
            <div className="flex flex-col gap-2 w-full sm:w-auto text-xs border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-4">
              <button
                type="button"
                onClick={() => setSeverityFilter('missing')}
                className={`flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  checklist.criticalMissingCount > 0
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  {isUrdu ? 'غائب / اہم مسائل' : 'Critical / Missing'}
                </span>
                <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-200">
                  {checklist.criticalMissingCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSeverityFilter('warning')}
                className={`flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  checklist.warningCount > 0
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  {isUrdu ? 'انتباہات / بہتری' : 'Warnings / Attention'}
                </span>
                <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200">
                  {checklist.warningCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSeverityFilter('passed')}
                className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg border bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {isUrdu ? 'کامیاب معیارات' : 'Passed Checks'}
                </span>
                <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-200">
                  {checklist.passedCount}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Toolbar on Bottom of Hero */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-300 text-xs">
            {isUrdu
              ? `دکھائے جا رہے ہیں: ${filteredItems.length} از ${checklist.totalItems} عناصر`
              : `Displaying ${filteredItems.length} of ${checklist.totalItems} tracked elements`}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyMissingReport}
              className="px-3 py-1.5 rounded-lg font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Copy audit markdown report with all missing elements and fixes"
            >
              {copiedReport ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isUrdu ? 'رپورٹ کاپی ہو گئی!' : 'Report Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-indigo-300" />
                  <span>{isUrdu ? 'غائب عناصر کی رپورٹ کاپی کریں' : 'Copy Missing Elements Report'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 rounded-lg font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Export complete checklist to CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-teal-300" />
              <span>{isUrdu ? 'سی ایس وی ڈاؤن لوڈ' : 'Export CSV'}</span>
            </button>

            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('fixcode')}
                className="px-3 py-1.5 rounded-lg font-bold bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isUrdu ? '1-کلک فکس کوڈ دیکھیں' : '1-Click Fix Head Code'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Interactive Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Severity Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSeverityFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                severityFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {isUrdu ? 'تمام عناصر' : 'All Elements'} ({checklist.totalItems})
            </button>

            <button
              type="button"
              onClick={() => setSeverityFilter('missing')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                severityFilter === 'missing'
                  ? 'bg-rose-600 text-white shadow-2xs font-bold'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'غائب / اہم ترین' : 'Missing / Critical'}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                severityFilter === 'missing' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {checklist.criticalMissingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSeverityFilter('warning')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                severityFilter === 'warning'
                  ? 'bg-amber-500 text-white shadow-2xs font-bold'
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'انتباہات' : 'Warnings'}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                severityFilter === 'warning' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {checklist.warningCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSeverityFilter('passed')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                severityFilter === 'passed'
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'پاس شدہ' : 'Passed'}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                severityFilter === 'passed' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {checklist.passedCount}
              </span>
            </button>
          </div>

          {/* Search Field */}
          <div className="relative min-w-[200px] md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isUrdu ? 'ٹیگ یا عنصر تلاش کریں...' : 'Search tags (e.g. h1, canonical)...'}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            {isUrdu ? 'کیٹیگری:' : 'Category:'}
          </span>

          {[
            { id: 'all', label: isUrdu ? 'سب کیٹیگریز' : 'All Categories' },
            { id: 'basics', label: isUrdu ? 'بنیادی میٹا ٹیگز' : 'Core Meta' },
            { id: 'content', label: isUrdu ? 'مواد کی ساخت' : 'Content Structure' },
            { id: 'indexing', label: isUrdu ? 'انڈیکسنگ اور لنکس' : 'Indexing & URLs' },
            { id: 'social', label: isUrdu ? 'سوشل شیئرنگ' : 'Social & Sharing' },
            { id: 'technical', label: isUrdu ? 'موبائل اور تکنیکی' : 'Mobile & Technical' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                categoryFilter === cat.id
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Checklist Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isUrdu ? 'کوئی عنصر نہیں ملا' : 'No Checklist Items Found'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isUrdu
                ? 'منتخب کردہ فلٹر کے مطابق کوئی آئٹم نہیں ہے۔ فلٹرز کو ری سیٹ کر کے دوبارہ دیکھیں۔'
                : 'No elements match your selected filter or search query. Try clearing your filters or search term.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSeverityFilter('all');
                setCategoryFilter('all');
                setSearchQuery('');
              }}
              className="mt-2 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
            >
              {isUrdu ? 'تمام فلٹرز ری سیٹ کریں' : 'Reset All Filters'}
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = expandedItemIds.has(item.id);
            const isMissing = item.isMissing;
            const isCritical = item.severity === 'critical';
            const isWarning = item.severity === 'warning';
            const isPassed = item.severity === 'passed';

            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isMissing || isCritical
                    ? 'bg-rose-50/40 dark:bg-rose-950/15 border-rose-200 dark:border-rose-900/60 shadow-xs'
                    : isWarning
                    ? 'bg-amber-50/40 dark:bg-amber-950/15 border-amber-200 dark:border-amber-900/60'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Collapsed / Main Card Row */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    {/* Status Icon */}
                    <div className="shrink-0 mt-0.5 sm:mt-0">
                      {isMissing || isCritical ? (
                        <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center ring-2 ring-rose-500/20">
                          <XCircle className="w-5 h-5" />
                        </div>
                      ) : isWarning ? (
                        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center ring-2 ring-amber-500/20">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-2 ring-emerald-500/20">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    {/* Element Title & Tag info */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {item.name}
                        </span>

                        <span className="px-2 py-0.5 rounded-md font-mono text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                          {item.elementTag}
                        </span>

                        {/* Criticality Tag */}
                        {item.isCritical ? (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            {isUrdu ? 'لازمی عنصر' : 'Critical Requirement'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {isUrdu ? item.categoryLabelUrdu : item.categoryLabel}
                          </span>
                        )}
                      </div>

                      {/* Status Message */}
                      <p className={`text-xs font-medium ${
                        isMissing || isCritical
                          ? 'text-rose-700 dark:text-rose-300 font-semibold'
                          : isWarning
                          ? 'text-amber-700 dark:text-amber-300 font-semibold'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {isUrdu ? item.statusMessageUrdu : item.statusMessage}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions & Status Badge */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Status Pill */}
                    {isMissing ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white shadow-2xs flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        {isUrdu ? 'غائب' : 'Missing'}
                      </span>
                    ) : isCritical ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white shadow-2xs flex items-center gap-1">
                        <AlertOctagon className="w-3.5 h-3.5" />
                        {isUrdu ? 'ناکام' : 'Critical'}
                      </span>
                    ) : isWarning ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-white shadow-2xs flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {isUrdu ? 'انتباہ' : 'Warning'}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-2xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isUrdu ? 'پاس' : 'Passed'}
                      </span>
                    )}

                    {/* Quick Copy Snippet */}
                    {item.fixSnippet && (
                      <button
                        type="button"
                        onClick={(e) => handleCopySnippet(item, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                        title={isUrdu ? 'فکس کوڈ کاپی کریں' : 'Copy HTML fix snippet'}
                      >
                        {copiedSnippetId === item.id ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {/* Expand/Collapse Chevron */}
                    <div className="p-1 text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Pane */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-200/60 dark:border-slate-800/80 space-y-4 text-xs animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {/* Left: What Was Found & SEO Impact */}
                      <div className="space-y-3">
                        {/* Current Value Found */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            {isUrdu ? 'صفحے کے HTML کوڈ میں کیا ملا:' : 'Detected Value in Fetched HTML:'}
                          </span>
                          <div className="font-mono text-slate-800 dark:text-slate-200 break-all font-semibold">
                            {item.currentValue ? item.currentValue : (
                              <span className="text-rose-600 dark:text-rose-400 italic">
                                {isUrdu ? '(کوڈ میں یہ ٹیگ موجود نہیں ہے)' : '(Element tag not found in document <head>)'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* SEO Ranking Impact */}
                        <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 space-y-1">
                          <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-indigo-500" />
                            {isUrdu ? 'سرچ انجن پر اثر (SEO Impact):' : 'SEO & Ranking Impact:'}
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            {isUrdu ? item.seoImpactUrdu : item.seoImpact}
                          </p>
                        </div>
                      </div>

                      {/* Right: Recommendation & Fix Snippet */}
                      <div className="space-y-3">
                        {/* Actionable Recommendation */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                            {isUrdu ? 'تجویز کردہ حل (Actionable Fix):' : 'Actionable Fix & Best Practice:'}
                          </span>
                          <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                            {isUrdu ? item.recommendationUrdu : item.recommendation}
                          </p>
                        </div>

                        {/* Ready-to-paste Code Snippet */}
                        {item.fixSnippet && (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <Code2 className="w-3 h-3 text-indigo-500" />
                                {isUrdu ? 'کاپی کرنے کے لیے تیار HTML کوڈ:' : 'Ready-to-Paste HTML Fix Code:'}
                              </span>

                              <button
                                type="button"
                                onClick={(e) => handleCopySnippet(item, e)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500 hover:bg-indigo-600 text-white transition-colors cursor-pointer shadow-2xs"
                              >
                                {copiedSnippetId === item.id ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>{isUrdu ? 'کاپی ہو گیا' : 'Copied!'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>{isUrdu ? 'کوڈ کاپی کریں' : 'Copy Fix'}</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <pre className="p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[11.5px] leading-relaxed overflow-x-auto border border-slate-800 whitespace-pre-wrap select-all">
                              {item.fixSnippet}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Tab Jump if relevant */}
                    {onNavigateToTab && (
                      <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                        {item.id.includes('h1') || item.category === 'content' ? (
                          <button
                            type="button"
                            onClick={() => onNavigateToTab('headings')}
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-semibold"
                          >
                            <span>{isUrdu ? 'ہیڈنگ ہائرارکی ٹیب میں دیکھیں' : 'Inspect in Headings Structure Tab'}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        ) : item.category === 'social' ? (
                          <button
                            type="button"
                            onClick={() => onNavigateToTab('social')}
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-semibold"
                          >
                            <span>{isUrdu ? 'سوشل شیئر پریویو ٹیب میں دیکھیں' : 'Open in Social Preview Tab'}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        ) : item.category === 'indexing' && item.id.includes('links') ? (
                          <button
                            type="button"
                            onClick={() => onNavigateToTab('links')}
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-semibold"
                          >
                            <span>{isUrdu ? 'اندرونی لنکس کرالر ٹیب کھولیں' : 'Open in Broken Links & Crawl Tab'}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onNavigateToTab('fixcode')}
                            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-semibold"
                          >
                            <span>{isUrdu ? 'تمام ٹیگز کا مشترکہ فکس کوڈ حاصل کریں' : 'Generate Full Combined <head> Snippet'}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
