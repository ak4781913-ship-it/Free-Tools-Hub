import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Globe,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Code,
  Zap,
  ShieldCheck,
  Layers,
  Heading,
  Image as ImageIcon,
  Link as LinkIcon,
  Clock,
  Sparkles,
  RefreshCw,
  Sliders,
  Download,
  Smartphone,
  Monitor,
  ChevronDown,
  ChevronUp,
  FileText,
  Lock,
  Unlock,
  Eye,
  Terminal,
  Link2,
  FileSpreadsheet,
  Hash,
  CheckSquare,
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { SeoAnalysisResult, SeoIssue, HeadingItem } from './seoAnalysisTypes';
import { parseAndAnalyzeSeo } from './seoAnalysisParser';
import { SAMPLE_PAGES, SamplePage } from './samplePages';
import { generateSeoReportPDF } from './seoPdfGenerator';
import { crawlInternalLinks, computeInternalLinksReport } from './linkCrawlerService';
import { KeywordDensityTab } from './KeywordDensityTab';
import { SeoChecklistTab } from './SeoChecklistTab';
import { computeSeoChecklist } from './seoChecklistService';
import { SocialSharePreview } from './SocialSharePreview';
import { recordPrintDocument } from '../../../utils/printHistoryTracking';
import { emitCalculationSuccess } from '../../../utils/calculationToastNotifier';

export const SeoPageAnalyzerTool: React.FC = () => {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  // Input states
  const [urlInput, setUrlInput] = useState<string>('https://example.com');
  const [inputMode, setInputMode] = useState<'url' | 'html'>('url');
  const [htmlInput, setHtmlInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Analysis result
  const [result, setResult] = useState<SeoAnalysisResult | null>(null);

  // Critical SEO Checklist summary
  const checklistSummary = useMemo(() => {
    return result ? computeSeoChecklist(result) : null;
  }, [result]);

  // UI view state
  const [activeTab, setActiveTab] = useState<'checklist' | 'issues' | 'meta' | 'social' | 'headings' | 'performance' | 'links' | 'keywords' | 'fixcode'>('checklist');
  const [issueFilter, setIssueFilter] = useState<'all' | 'critical' | 'warning' | 'info' | 'passed'>('all');
  const [linkFilter, setLinkFilter] = useState<'all' | 'broken' | 'ok' | 'redirect'>('all');
  const [linkSearchQuery, setLinkSearchQuery] = useState<string>('');
  const [isCrawlingLinks, setIsCrawlingLinks] = useState<boolean>(false);
  const [crawlProgress, setCrawlProgress] = useState<number>(0);
  const [crawledLinkCount, setCrawledLinkCount] = useState<number>(0);
  const [serpDevice, setSerpDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [copiedAllCode, setCopiedAllCode] = useState<boolean>(false);
  const [expandedIssueIds, setExpandedIssueIds] = useState<Set<string>>(new Set());
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Automatically analyze sample page on initial mount (silently without arrival toast)
  useEffect(() => {
    handleLoadSample(SAMPLE_PAGES[0], { silent: true });
  }, []);

  const handleDownloadPdf = () => {
    if (!result) return;
    setIsGeneratingPdf(true);
    try {
      const doc = generateSeoReportPDF(result);
      let domain = 'page';
      try {
        domain = new URL(result.url).hostname.replace(/[^a-zA-Z0-9_-]/g, '_');
      } catch {
        domain = 'seo_analysis';
      }
      const dateStr = new Date().toISOString().slice(0, 10);
      doc.save(`SEO_Report_${domain}_${dateStr}.pdf`);
      recordPrintDocument('seo-page-analyzer', `SEO Audit Report – ${domain}`, {
        toolName: 'SEO Page Analyzer',
        format: 'Technical PDF Audit Report',
        summary: `Health Score: ${result.scores.overall}% • ${result.scores.criticalCount} Critical Issues • ${result.scores.passedCount} Passed Checks`,
      });
    } catch (err) {
      console.error('Error generating PDF report:', err);
    } finally {
      setTimeout(() => setIsGeneratingPdf(false), 500);
    }
  };

  const handleCrawlLinks = async () => {
    if (!result || isCrawlingLinks || result.internalLinksReport.links.length === 0) return;

    setIsCrawlingLinks(true);
    setCrawlProgress(0);
    setCrawledLinkCount(0);

    try {
      const linksToCrawl = result.internalLinksReport.links.map((l) => ({ ...l }));
      const updatedLinks = await crawlInternalLinks(linksToCrawl, (prog) => {
        setCrawlProgress(Math.round((prog.crawledCount / prog.total) * 100));
        setCrawledLinkCount(prog.crawledCount);
        setResult((prev) => {
          if (!prev) return prev;
          const currentLinks = prev.internalLinksReport.links.map((item) =>
            item.id === prog.updatedLink.id ? prog.updatedLink : item
          );
          return {
            ...prev,
            internalLinksReport: computeInternalLinksReport(currentLinks, true),
          };
        });
      });

      const finalReport = computeInternalLinksReport(updatedLinks, false);

      setResult((prev) => {
        if (!prev) return prev;
        const otherIssues = prev.issues.filter((i) => i.id !== 'broken-internal-links' && i.id !== 'internal-links-passed');
        const newIssues = [...otherIssues];

        if (finalReport.brokenCount > 0) {
          const sampleBroken = finalReport.links
            .filter((l) => l.status === 'broken' || l.status === 'timeout')
            .slice(0, 3)
            .map((l) => `"${l.originalHref}" (${l.statusText})`)
            .join(', ');

          newIssues.unshift({
            id: 'broken-internal-links',
            category: 'links',
            severity: 'critical',
            title: `Broken Internal Links Detected (${finalReport.brokenCount} dead link${finalReport.brokenCount > 1 ? 's' : ''})`,
            description: `Discovered ${finalReport.brokenCount} internal links on this page returning 404 or 5xx server errors: ${sampleBroken}.`,
            impact: 'Broken internal links degrade user experience, waste search engine crawl budget, and stop PageRank from flowing smoothly.',
            recommendation: 'Update or remove broken href targets, or configure 301 server redirects for moved pages.',
          });
        } else if (finalReport.crawledCount > 0) {
          newIssues.push({
            id: 'internal-links-passed',
            category: 'links',
            severity: 'passed',
            title: 'Zero Broken Internal Links',
            description: `All ${finalReport.crawledCount} internal page links resolved successfully with 200 OK.`,
            impact: 'Healthy internal site architecture facilitates deep indexing and smooth user experience.',
            recommendation: 'Periodically monitor internal links across releases.',
          });
        }

        const critCount = newIssues.filter((i) => i.severity === 'critical').length;
        const warnCount = newIssues.filter((i) => i.severity === 'warning').length;
        const passCount = newIssues.filter((i) => i.severity === 'passed').length;

        let updatedPerf = prev.scores.performance;
        if (finalReport.brokenCount > 0) {
          updatedPerf = Math.max(10, updatedPerf - Math.min(25, finalReport.brokenCount * 8));
        }

        const updatedOverall = Math.round(prev.scores.meta * 0.35 + prev.scores.headings * 0.35 + updatedPerf * 0.30);

        return {
          ...prev,
          internalLinksReport: finalReport,
          issues: newIssues,
          scores: {
            ...prev.scores,
            overall: updatedOverall,
            performance: updatedPerf,
            criticalCount: critCount,
            warningCount: warnCount,
            passedCount: passCount,
          },
        };
      });

      emitCalculationSuccess({
        toolId: 'seo-page-analyzer',
        title: 'Internal Link Audit Complete',
        titleUrdu: 'اندرونی لنکس کا آڈٹ مکمل',
        message: `${finalReport.crawledCount} links checked · ${finalReport.brokenCount} broken`,
        messageUrdu: `${finalReport.crawledCount} لنکس کی جانچ مکمل`,
      });
    } catch (err) {
      console.error('Error during internal links crawl:', err);
    } finally {
      setIsCrawlingLinks(false);
    }
  };

  const handleExportBrokenLinksCsv = () => {
    if (!result || result.internalLinksReport.links.length === 0) return;
    const links = result.internalLinksReport.links;
    const headers = ['URL', 'Original Href', 'Anchor Text', 'HTTP Status', 'Status Code', 'Latency (ms)', 'Occurrences', 'Diagnosis'];
    const rows = links.map((l) => [
      `"${l.url}"`,
      `"${l.originalHref}"`,
      `"${(l.anchorText || '').replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${l.statusCode || ''}"`,
      `"${l.responseTimeMs || ''}"`,
      `"${l.occurrences}"`,
      `"${(l.diagnosticTip || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Internal_Links_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2500);
  };

  const handleCopyAllCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedAllCode(true);
    setTimeout(() => setCopiedAllCode(false), 2500);
  };

  const toggleExpandIssue = (id: string) => {
    setExpandedIssueIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLoadSample = (sample: SamplePage, options?: { silent?: boolean }) => {
    setUrlInput(sample.url);
    setInputMode('url');
    setErrorMsg(null);
    const analyzed = parseAndAnalyzeSeo({
      url: sample.url,
      html: sample.html,
      ttfbMs: sample.ttfbMs,
      sourceType: 'demo',
    });
    setResult(analyzed);
    if (!options?.silent) {
      emitCalculationSuccess({
        toolId: 'seo-page-analyzer',
        title: 'SEO Audit Complete',
        titleUrdu: 'ایس ای او آڈٹ مکمل ہو گیا',
        message: `Health Score: ${analyzed.scores.overall}% · ${analyzed.scores.passedCount} checks passed`,
        messageUrdu: `ایس ای او اسکور: ${analyzed.scores.overall}%`,
      });
    }
  };

  const handleAnalyzeUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let target = urlInput.trim();
    if (!target) {
      setErrorMsg('Please enter a website URL to analyze.');
      return;
    }

    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
      setUrlInput(target);
    }

    setIsLoading(true);
    setErrorMsg(null);

    const startTime = performance.now();

    try {
      let htmlText = '';
      let fetchTtfb = 150;
      let finalUrl = target;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 11000);

      try {
        const res = await fetch(`/api/analyze-seo?url=${encodeURIComponent(target)}`, {
          signal: controller.signal,
        });
        const payload = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(
            payload?.error ||
              `Target server or security policy rejected the request (HTTP ${res.status}).`
          );
        }

        if (payload && typeof payload.html === 'string') {
          htmlText = payload.html;
          fetchTtfb = typeof payload.ttfbMs === 'number' ? payload.ttfbMs : Math.round(performance.now() - startTime);
          finalUrl = payload.finalUrl || target;
        }
      } finally {
        clearTimeout(timeoutId);
      }

      if (!htmlText || htmlText.length < 30) {
        throw new Error(
          'Could not retrieve sufficient HTML content from this URL. The target website may block automated crawlers. Paste the page source into the "Raw HTML" tab to audit it directly.'
        );
      }

      const analyzed = parseAndAnalyzeSeo({
        url: target,
        finalUrl,
        html: htmlText,
        ttfbMs: fetchTtfb,
        sourceType: 'url',
      });

      setResult(analyzed);
      emitCalculationSuccess({
        toolId: 'seo-page-analyzer',
        title: 'SEO Audit Complete',
        titleUrdu: 'ایس ای او آڈٹ مکمل ہو گیا',
        message: `Health Score: ${analyzed.scores.overall}% · ${analyzed.scores.passedCount} checks passed`,
        messageUrdu: `ایس ای او اسکور: ${analyzed.scores.overall}%`,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch the URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeHtml = () => {
    if (!htmlInput.trim()) {
      setErrorMsg('Please paste HTML code to analyze.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const analyzed = parseAndAnalyzeSeo({
        url: urlInput || 'https://analyzed-page.local',
        html: htmlInput,
        ttfbMs: 65,
        sourceType: 'html-paste',
      });
      setResult(analyzed);
      emitCalculationSuccess({
        toolId: 'seo-page-analyzer',
        title: 'HTML SEO Audit Complete',
        titleUrdu: 'ایچ ٹی ایم ایل آڈٹ مکمل ہو گیا',
        message: `Health Score: ${analyzed.scores.overall}% · ${analyzed.scores.passedCount} checks passed`,
        messageUrdu: `ایس ای او اسکور: ${analyzed.scores.overall}%`,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse HTML.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredIssues = result
    ? result.issues.filter((issue) => {
        if (issueFilter === 'all') return true;
        return issue.severity === issueFilter;
      })
    : [];

  const filteredLinks = result?.internalLinksReport?.links
    ? result.internalLinksReport.links.filter((link) => {
        if (linkFilter === 'broken' && link.status !== 'broken' && link.status !== 'timeout') return false;
        if (linkFilter === 'ok' && link.status !== 'ok') return false;
        if (linkFilter === 'redirect' && link.status !== 'redirect') return false;

        if (linkSearchQuery.trim()) {
          const q = linkSearchQuery.toLowerCase().trim();
          const matchUrl = link.url.toLowerCase().includes(q) || link.originalHref.toLowerCase().includes(q);
          const matchAnchor = (link.anchorText || '').toLowerCase().includes(q);
          return matchUrl || matchAnchor;
        }

        return true;
      })
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Tool Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
          <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Professional Web & SEO Audit Suite</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          SEO Page Analyzer
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Audit any website URL for missing meta tags, heading hierarchy flaws, mobile viewport readiness, and core performance benchmarks with live SERP preview.
        </p>
      </div>

      {/* URL / HTML Input Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-4">
        {/* Mode Selector Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setInputMode('url')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                inputMode === 'url'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Analyze Web URL</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('html')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                inputMode === 'html'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Paste Raw HTML (Offline/Intranet)</span>
            </button>
          </div>

          {/* Quick Demo Previews */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[11px] text-slate-400 font-medium">Quick Demos:</span>
            {SAMPLE_PAGES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleLoadSample(sample)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title={sample.description}
              >
                {sample.name.split(' (')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* URL Form */}
        {inputMode === 'url' ? (
          <form onSubmit={handleAnalyzeUrl} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Globe className="w-5 h-5 text-indigo-500" />
                </div>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com or your-domain.com/blog/post"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850 text-slate-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors shrink-0"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Page...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Analyze URL</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Raw HTML Paste Mode */
          <div className="space-y-3">
            <textarea
              rows={6}
              value={htmlInput}
              onChange={(e) => setHtmlInput(e.target.value)}
              placeholder="Paste HTML source code here (<!DOCTYPE html><html><head>...)..."
              className="w-full p-3 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-slate-400">
                Ideal for testing local projects, draft files, or intranet pages.
              </span>
              <button
                type="button"
                onClick={handleAnalyzeHtml}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Code className="w-4 h-4" />
                <span>Parse HTML Code</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Analysis Notice:</span>
              <p>{errorMsg}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Analysis Results */}
      {result && (
        <div className="space-y-6">
          {/* Executive SEO Health Score Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-800">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              {/* Overall Score Badge */}
              <div className="flex items-center gap-5 w-full lg:w-auto">
                <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/5 border border-white/10 shadow-inner shrink-0">
                  <div className="text-center">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight block">
                      {result.scores.overall}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                      Score / 100
                    </span>
                  </div>
                  <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-md text-xs font-black uppercase font-mono bg-indigo-500 text-white shadow-md">
                    Grade {result.scores.grade}
                  </div>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-indigo-400/20 text-indigo-300 border border-indigo-400/30">
                      SEO Health Score
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono truncate">
                      {result.isHttps ? (
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 text-red-400" />
                      )}
                      {result.url}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-white truncate max-w-md">
                    {result.meta.title.content || 'Untitled Document'}
                  </h2>
                  <p className="text-xs text-slate-300 line-clamp-1 max-w-lg">
                    {result.meta.description.content || 'No meta description provided.'}
                  </p>
                </div>
              </div>

              {/* Sub-Score Bars */}
              <div className="grid grid-cols-3 gap-3 w-full lg:w-auto text-center shrink-0">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10.5px] text-slate-400 font-medium block">Meta Tags</span>
                  <span className="text-lg font-extrabold text-indigo-300 block">{result.scores.meta}%</span>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-400 h-full rounded-full"
                      style={{ width: `${result.scores.meta}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10.5px] text-slate-400 font-medium block">Headings</span>
                  <span className="text-lg font-extrabold text-teal-300 block">{result.scores.headings}%</span>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-teal-400 h-full rounded-full"
                      style={{ width: `${result.scores.headings}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10.5px] text-slate-400 font-medium block">Performance</span>
                  <span className="text-lg font-extrabold text-emerald-300 block">{result.scores.performance}%</span>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full"
                      style={{ width: `${result.scores.performance}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Status Pill Bar */}
            <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 font-semibold border border-red-500/30">
                  <XCircle className="w-3.5 h-3.5" />
                  {result.scores.criticalCount} Critical Issues
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {result.scores.warningCount} Warnings
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {result.scores.passedCount} Checks Passed
                </span>

                {checklistSummary && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('checklist')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold border transition-colors cursor-pointer ${
                      checklistSummary.criticalMissingCount > 0
                        ? 'bg-rose-500/25 text-rose-200 border-rose-500/40 hover:bg-rose-500/35'
                        : 'bg-emerald-500/25 text-emerald-200 border-emerald-500/40 hover:bg-emerald-500/35'
                    }`}
                    title={isUrdu ? 'اہم ایس ای او عناصر کی چیک لسٹ دیکھیں' : 'View Critical SEO Elements Checklist'}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>
                      {checklistSummary.criticalMissingCount > 0
                        ? `${checklistSummary.criticalMissingCount} Critical Element${checklistSummary.criticalMissingCount > 1 ? 's' : ''} Missing`
                        : `${checklistSummary.healthScore}% Checklist Passed`}
                    </span>
                  </button>
                )}

                {result.internalLinksReport && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('links')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold border transition-colors cursor-pointer ${
                      result.internalLinksReport.brokenCount > 0
                        ? 'bg-red-500/25 text-red-200 border-red-500/40 hover:bg-red-500/35'
                        : 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30 hover:bg-indigo-500/30'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>
                      {result.internalLinksReport.brokenCount > 0
                        ? `${result.internalLinksReport.brokenCount} Broken Link${result.internalLinksReport.brokenCount > 1 ? 's' : ''}`
                        : `${result.internalLinksReport.uniqueUrlsCount} Internal Links OK`}
                    </span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-900 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  title="Download complete technical SEO audit report as PDF"
                >
                  {isGeneratingPdf ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                  <span>
                    {isGeneratingPdf
                      ? (isUrdu ? 'پی ڈی ایف تیار ہو رہی ہے...' : 'Generating PDF...')
                      : (isUrdu ? 'رپورٹ پی ڈی ایف ڈاؤن لوڈ کریں' : 'Download Report as PDF')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('fixcode')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isUrdu ? '1-کلک فکس کوڈ' : 'Get 1-Click Fix Code'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Audit Scope & Architecture Clarification Banner */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                Audit Scope: HTML Source Only
              </span>
              <span>
                {result.isClientRenderedSpa
                  ? 'Client-Side SPA detected (<div id="root">). Dynamic DOM elements rendered via client-side JavaScript are not simulated. Static Prerendering (SSG) is recommended for basic crawlers.'
                  : result.isRedirectResponse
                  ? 'Notice: Evaluated an intermediate HTTP 301/302 redirect. Audit the final HTTPS URL directly to inspect the destination page.'
                  : 'Audited initial server-delivered HTML document (JavaScript execution disabled).'}
              </span>
            </div>
          </div>

          {/* Missing Critical SEO Elements Notice Banner */}
          {checklistSummary && checklistSummary.criticalMissingCount > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <XCircle className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-rose-950 dark:text-rose-100 text-sm">
                      {isUrdu ? 'اہم ترین ایس ای او عناصر غائب ہیں!' : 'Critical SEO Elements Missing!'}
                    </span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200 uppercase">
                      {checklistSummary.criticalMissingCount} {isUrdu ? 'مسائل' : 'Missing Items'}
                    </span>
                  </div>
                  <p className="text-rose-700 dark:text-rose-300 text-[11.5px] line-clamp-1">
                    <strong>{checklistSummary.missingCriticalList.join(', ')}</strong> — {isUrdu ? 'سرچ انجن رینکنگ اور کرالنگ متاثر ہو رہی ہے۔' : 'These foundational tags are required for Google crawlability and organic CTR.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('checklist')}
                className="px-3.5 py-2 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs self-end sm:self-center"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{isUrdu ? 'چیک لسٹ میں درست کریں' : 'Inspect SEO Checklist'}</span>
              </button>
            </div>
          )}

          {/* Navigation Tabs & Quick Export */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs sm:text-sm font-semibold">
              {/* Tab 0: Critical SEO Checklist */}
              <button
                type="button"
                onClick={() => setActiveTab('checklist')}
                className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'checklist'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>{isUrdu ? 'ایس ای او چیک لسٹ' : 'SEO Checklist'}</span>
                {checklistSummary && checklistSummary.criticalMissingCount > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 animate-pulse">
                    {checklistSummary.criticalMissingCount} missing
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                    {checklistSummary?.healthScore || 100}%
                  </span>
                )}
              </button>

              {/* Tab 1: Actionable Issues */}
              <button
                type="button"
                onClick={() => setActiveTab('issues')}
                className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'issues'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{isUrdu ? 'مسائل اور حل' : 'Issues & Fixes'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {result.issues.length}
                </span>
              </button>

              {/* Tab 2: Meta Tags */}
              <button
                type="button"
                onClick={() => setActiveTab('meta')}
                className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'meta'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>{isUrdu ? 'میٹا ٹیگز اور سرپ' : 'Meta Tags & SERP'}</span>
              </button>

              {/* Tab 3: Social Preview */}
              <button
                type="button"
                onClick={() => setActiveTab('social')}
                className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'social'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>{isUrdu ? 'سوشل شیئر پریویو' : 'Social Preview'}</span>
                {result.meta.openGraph.presentCount < 4 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>

              {/* Tab 4: Headings */}
              <button
                type="button"
                onClick={() => setActiveTab('headings')}
                className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'headings'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Heading className="w-4 h-4" />
                <span>{isUrdu ? 'ہیڈنگ ہائرارکی (H1–H6)' : 'Headings (H1–H6)'}</span>
                {result.headings.hasSkippedLevels && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>

              {/* Tab 5: Performance */}
              <button
                type="button"
                onClick={() => setActiveTab('performance')}
                className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'performance'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>{isUrdu ? 'پرفارمنس' : 'Performance'}</span>
              </button>

              {/* Tab 6: Broken Links */}
              <button
                type="button"
                onClick={() => setActiveTab('links')}
                className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'links'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                <span>{isUrdu ? 'ٹوٹے ہوئے لنکس' : 'Broken Links'}</span>
                {result.internalLinksReport && result.internalLinksReport.brokenCount > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-950/80 dark:text-red-400">
                    {result.internalLinksReport.brokenCount}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {result.internalLinksReport?.uniqueUrlsCount || 0}
                  </span>
                )}
              </button>

              {/* Tab 7: Keyword Density */}
              <button
                type="button"
                onClick={() => setActiveTab('keywords')}
                className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'keywords'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Hash className="w-4 h-4" />
                <span>{isUrdu ? 'کی ورڈ ڈینسٹی' : 'Keyword Density'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  {result.keywords?.totalWords ? `${result.keywords.totalWords}w` : '0w'}
                </span>
              </button>

              {/* Tab 8: 1-Click Fix Code */}
              <button
                type="button"
                onClick={() => setActiveTab('fixcode')}
                className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'fixcode'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Code className="w-4 h-4" />
                <span>{isUrdu ? '1-کلک فکس کوڈ' : '1-Click Fix Code'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer shrink-0 disabled:opacity-50 self-end sm:self-center"
              title="Download Report as PDF"
            >
              {isGeneratingPdf ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              ) : (
                <Download className="w-3.5 h-3.5 text-indigo-500" />
              )}
              <span>
                {isGeneratingPdf
                  ? (isUrdu ? 'پی ڈی ایف...' : 'Generating...')
                  : (isUrdu ? 'پی ڈی ایف رپورٹ' : 'Download PDF Report')}
              </span>
            </button>
          </div>

          {/* ========================================================== */}
          {/* TAB 0: CRITICAL SEO ELEMENTS CHECKLIST */}
          {/* ========================================================== */}
          {activeTab === 'checklist' && (
            <SeoChecklistTab result={result} onNavigateToTab={setActiveTab} />
          )}

          {/* ========================================================== */}
          {/* TAB 1: ACTIONABLE ISSUES & FIXES */}
          {/* ========================================================== */}
          {activeTab === 'issues' && (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Filter by Severity:
                </span>
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                  {(['all', 'critical', 'warning', 'info', 'passed'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setIssueFilter(lvl)}
                      className={`px-3 py-1 rounded-lg font-semibold capitalize transition-colors cursor-pointer ${
                        issueFilter === lvl
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      {lvl} (
                      {lvl === 'all'
                        ? result.issues.length
                        : result.issues.filter((i) => i.severity === lvl).length}
                      )
                    </button>
                  ))}
                </div>
              </div>

              {/* Issues List */}
              <div className="space-y-3">
                {filteredIssues.map((issue) => {
                  const isExpanded = expandedIssueIds.has(issue.id);
                  const isCritical = issue.severity === 'critical';
                  const isWarning = issue.severity === 'warning';
                  const isInfo = issue.severity === 'info';
                  const isPassed = issue.severity === 'passed';

                  return (
                    <div
                      key={issue.id}
                      className={`rounded-xl border transition-all ${
                        isCritical
                          ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/60'
                          : isWarning
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                          : isInfo
                          ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
                          : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                      }`}
                    >
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => toggleExpandIssue(issue.id)}
                        className="w-full text-left p-4 flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isCritical ? (
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                          ) : isWarning ? (
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                          ) : isInfo ? (
                            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                  isCritical
                                    ? 'bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200'
                                    : isWarning
                                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                                    : isInfo
                                    ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
                                    : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                                }`}
                              >
                                {issue.severity}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 uppercase">
                                [{issue.category}]
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                              {issue.title}
                            </h3>
                          </div>
                        </div>

                        <span
                          aria-hidden="true"
                          className="p-1 text-slate-400 shrink-0"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </span>
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-200/50 dark:border-slate-800 text-xs space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            <div className="space-y-1">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                Findings:
                              </span>
                              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                {issue.description}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                SEO Impact:
                              </span>
                              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                {issue.impact}
                              </p>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                              Recommended Fix:
                            </span>
                            <p className="text-slate-600 dark:text-slate-300 text-xs">
                              {issue.recommendation}
                            </p>

                            {issue.fixSnippet && (
                              <div className="mt-2 relative">
                                <pre className="p-2.5 rounded-lg bg-slate-950 text-indigo-200 font-mono text-[11px] overflow-x-auto">
                                  {issue.fixSnippet}
                                </pre>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCode(issue.fixSnippet!, issue.id)}
                                  className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                                >
                                  {copiedSnippetId === issue.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy Fix</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 2: META TAGS & SERP PREVIEW */}
          {/* ========================================================== */}
          {activeTab === 'meta' && (
            <div className="space-y-6">
              {/* Live SERP Google Search Simulation */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Live Google SERP Search Snippet Preview
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setSerpDevice('desktop')}
                      className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                        serpDevice === 'desktop'
                          ? 'bg-white dark:bg-slate-900 shadow-2xs text-slate-900 dark:text-white'
                          : 'text-slate-500'
                      }`}
                    >
                      Desktop View
                    </button>
                    <button
                      type="button"
                      onClick={() => setSerpDevice('mobile')}
                      className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                        serpDevice === 'mobile'
                          ? 'bg-white dark:bg-slate-900 shadow-2xs text-slate-900 dark:text-white'
                          : 'text-slate-500'
                      }`}
                    >
                      Mobile View
                    </button>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 font-sans ${
                    serpDevice === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-1">
                    <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                      G
                    </div>
                    <span className="truncate">{result.finalUrl}</span>
                  </div>

                  <h4 className="text-base sm:text-lg font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer line-clamp-1 leading-snug">
                    {result.meta.title.content || 'Untitled Page Document'}
                  </h4>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {result.meta.description.content ||
                      'No meta description provided. Google will extract text fragments from the page body.'}
                  </p>
                </div>
              </div>

              {/* Title & Description Character Length Meters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title Meter */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-indigo-500" />
                      Title Tag Character Count
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        result.meta.title.status === 'good'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : result.meta.title.status === 'warning'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {result.meta.title.length || 0} / 60 chars
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        result.meta.title.status === 'good'
                          ? 'bg-emerald-500'
                          : result.meta.title.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.min(100, ((result.meta.title.length || 0) / 60) * 100)}%`,
                      }}
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-600 dark:text-slate-300 font-mono break-all">
                    {result.meta.title.content || '(Missing <title>)'}
                  </div>
                  <p className="text-[11px] text-slate-500">{result.meta.title.message}</p>
                </div>

                {/* Description Meter */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      Meta Description Character Count
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        result.meta.description.status === 'good'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : result.meta.description.status === 'warning'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {result.meta.description.length || 0} / 160 chars
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        result.meta.description.status === 'good'
                          ? 'bg-emerald-500'
                          : result.meta.description.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          ((result.meta.description.length || 0) / 160) * 100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-600 dark:text-slate-300 font-mono break-all">
                    {result.meta.description.content || '(Missing meta description)'}
                  </div>
                  <p className="text-[11px] text-slate-500">{result.meta.description.message}</p>
                </div>
              </div>

              {/* Technical Meta Tags Checklist Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Technical Meta Tags Checklist
                </h3>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {/* Viewport */}
                  <div className="py-3 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Viewport Tag (Mobile Friendly)
                      </span>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {result.meta.viewport.content || 'Missing'}
                      </p>
                    </div>
                    {result.meta.viewport.status === 'good' ? (
                      <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> Passed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                        <XCircle className="w-4 h-4" /> Missing
                      </span>
                    )}
                  </div>

                  {/* Canonical */}
                  <div className="py-3 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Canonical URL Link
                      </span>
                      <p className="text-[11px] text-slate-500 font-mono truncate max-w-md">
                        {result.meta.canonical.content || 'Not declared'}
                      </p>
                    </div>
                    {result.meta.canonical.status === 'good' ? (
                      <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> Valid Canonical
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-4 h-4" /> Missing
                      </span>
                    )}
                  </div>

                  {/* Robots */}
                  <div className="py-3 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Search Indexing Directives (Robots)
                      </span>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {result.meta.robots.content || 'Default (Index, Follow)'}
                      </p>
                    </div>
                    {result.meta.robots.status === 'good' ? (
                      <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> Indexable
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                        <XCircle className="w-4 h-4" /> Blocked (noindex)
                      </span>
                    )}
                  </div>

                  {/* OpenGraph */}
                  <div className="py-3 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        OpenGraph Social Tags (Facebook, LinkedIn, Discord)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {result.meta.openGraph.presentCount} of 4 core tags present (
                        {result.meta.openGraph.missingTags.length === 0
                          ? 'Complete'
                          : `Missing: ${result.meta.openGraph.missingTags.join(', ')}`}
                        )
                      </p>
                    </div>
                    {result.meta.openGraph.status === 'good' ? (
                      <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> Configured
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-4 h-4" /> Incomplete
                      </span>
                    )}
                  </div>

                  {/* Structured Data */}
                  <div className="py-3 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Structured Data (Schema.org JSON-LD)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {result.meta.schemas.count > 0
                          ? `${result.meta.schemas.count} schema schemas declared (${result.meta.schemas.items
                              .map((s) => s.type)
                              .join(', ')})`
                          : 'No JSON-LD schemas detected.'}
                      </p>
                    </div>
                    {result.meta.schemas.count > 0 ? (
                      <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> Structured
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 font-semibold text-slate-400">
                        Optional
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 3: SOCIAL MEDIA SHARE PREVIEW */}
          {/* ========================================================== */}
          {activeTab === 'social' && (
            <SocialSharePreview result={result} />
          )}

          {/* ========================================================== */}
          {/* TAB 4: HEADING STRUCTURE (H1–H6) */}
          {/* ========================================================== */}
          {activeTab === 'headings' && (
            <div className="space-y-6">
              {/* Heading Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((tag) => {
                  const count = result.headings.counts[tag] || 0;
                  const isH1 = tag === 'h1';
                  const isH1Error = isH1 && (count === 0 || count > 1);

                  return (
                    <div
                      key={tag}
                      className={`p-3.5 rounded-xl border text-center space-y-1 ${
                        isH1Error
                          ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
                          : count > 0
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                      }`}
                    >
                      <span className="text-xs font-bold font-mono text-slate-500 uppercase block">
                        &lt;{tag}&gt;
                      </span>
                      <span className="text-2xl font-black text-slate-900 dark:text-white block">
                        {count}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {isH1
                          ? count === 1
                            ? 'Optimal (1)'
                            : count === 0
                            ? 'Missing!'
                            : 'Multiple!'
                          : 'Headings'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Warnings Banner if hierarchy skips detected */}
              {result.headings.hasSkippedLevels && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-sm block">Heading Level Skips Detected!</span>
                    <p className="text-[11.5px] leading-relaxed">
                      Search bots and screen readers require headings to follow a hierarchical nesting order.
                      Found {result.headings.skippedLevelNotes.length} instance(s) where heading levels jumped (e.g. from H1 directly to H3 without an H2 parent).
                    </p>
                  </div>
                </div>
              )}

              {/* Interactive Visual Heading Tree Outline */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-teal-500" />
                      Visual Document Heading Hierarchy Tree
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Sequential list of all {result.headings.items.length} headings in DOM order with indent levels.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 max-h-[500px] overflow-y-auto pr-1">
                  {result.headings.items.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No heading tags found in the document.
                    </div>
                  ) : (
                    result.headings.items.map((item) => (
                      <div
                        key={item.index}
                        style={{ marginLeft: `${(item.level - 1) * 20}px` }}
                        className={`p-2.5 rounded-xl border text-xs transition-all ${
                          item.hasSkippedLevel
                            ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                            : item.isEmpty
                            ? 'bg-red-50/80 dark:bg-red-950/40 border-red-300 dark:border-red-800'
                            : item.level === 1
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 font-bold'
                            : 'bg-slate-50/50 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                                item.level === 1
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {item.tag}
                            </span>
                            <span
                              className={`truncate ${
                                item.isEmpty ? 'italic text-red-500' : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {item.text}
                            </span>
                          </div>

                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {item.charLength} chars
                          </span>
                        </div>

                        {item.hasSkippedLevel && (
                          <div className="mt-1.5 text-[10.5px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{item.skippedLevelNote}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 4: PERFORMANCE & TECHNICAL BENCHMARKS */}
          {/* ========================================================== */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* Technical Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* TTFB */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    Time to First Byte (TTFB)
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {result.performance.ttfbMs} ms
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase font-mono ${
                      result.performance.ttfbMs < 300
                        ? 'text-emerald-500'
                        : result.performance.ttfbMs < 800
                        ? 'text-amber-500'
                        : 'text-red-500'
                    }`}
                  >
                    {result.performance.ttfbMs < 300
                      ? 'Fast Response'
                      : result.performance.ttfbMs < 800
                      ? 'Moderate'
                      : 'Slow TTFB'}
                  </span>
                </div>

                {/* HTML Weight */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-500" />
                    Initial HTML Payload
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {Math.round(result.performance.htmlSizeBytes / 1024)} KB
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {result.performance.domNodesCount} total DOM nodes
                  </span>
                </div>

                {/* Image Alt Coverage */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                    Image Alt Coverage
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {result.performance.images.total > 0
                      ? `${Math.round(
                          ((result.performance.images.total -
                            result.performance.images.missingAltCount) /
                            result.performance.images.total) *
                            100
                        )}%`
                      : 'N/A'}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {result.performance.images.missingAltCount} missing out of{' '}
                    {result.performance.images.total}
                  </span>
                </div>

                {/* Security Protocol */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Protocol & Security
                  </span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {result.isHttps ? 'HTTPS' : 'Insecure'}
                  </div>
                  <span
                    className={`text-[10px] font-bold font-mono ${
                      result.isHttps ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {result.isHttps ? 'SSL / TLS Active' : 'Unencrypted HTTP'}
                  </span>
                </div>
              </div>

              {/* Resource Architecture Audit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Links breakdown */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-indigo-500" />
                    Link Architecture Audit
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Internal Links</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {result.performance.links.internalCount}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">External Links</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {result.performance.links.externalCount}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Empty Anchors</span>
                      <span className="text-base font-bold text-red-500">
                        {result.performance.links.emptyAnchorCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-resource script count */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Code className="w-4 h-4 text-indigo-500" />
                    Page Scripts & Stylesheets
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Script Tags</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {result.performance.resources.scriptsCount}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Stylesheets</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {result.performance.resources.stylesheetsCount}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Inline Styles</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {result.performance.resources.inlineStylesCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB: INTERNAL LINKS & BROKEN LINK CRAWL REPORT */}
          {/* ========================================================== */}
          {activeTab === 'links' && (
            <div className="space-y-6">
              {/* Executive Crawl Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block">
                    {isUrdu ? 'دریافت شدہ لنکس' : 'Discovered Links'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      {result.internalLinksReport.totalDiscovered}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({result.internalLinksReport.uniqueUrlsCount} unique)
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block">
                    {isUrdu ? 'صحیح کام کرنے والے' : 'Healthy (200 OK)'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      {result.internalLinksReport.okCount}
                    </span>
                    <span className="text-[11px] text-emerald-600/70 font-semibold">
                      {result.internalLinksReport.uniqueUrlsCount > 0
                        ? `${Math.round((result.internalLinksReport.okCount / result.internalLinksReport.uniqueUrlsCount) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block">
                    {isUrdu ? 'ٹوٹے ہوئے لنکس' : 'Broken Links (Dead Ends)'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-2xl font-extrabold ${result.internalLinksReport.brokenCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                      {result.internalLinksReport.brokenCount}
                    </span>
                    {result.internalLinksReport.brokenCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300">
                        Action Needed
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block">
                    {isUrdu ? 'ری ڈائریکٹ لنکس' : 'Redirects (3xx)'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                      {result.internalLinksReport.redirectCount}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      301 / 302
                    </span>
                  </div>
                </div>
              </div>

              {/* Crawl Control Action Bar & Progress */}
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left w-full sm:w-auto">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-indigo-500" />
                      <span>{isUrdu ? 'لائیو انٹرنل کرالر' : 'Internal Page Link Crawler'}</span>
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isCrawlingLinks
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 animate-pulse'
                        : result.internalLinksReport.crawlCompleted
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {isCrawlingLinks ? 'Crawling in Progress...' : result.internalLinksReport.crawlCompleted ? 'Crawl Complete' : 'Pending Crawl'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 max-w-xl">
                    {isUrdu
                      ? 'تمام اندرونی لنکس کو چیک کریں تاکہ کوئی 404 ڈیڈ اینڈ یا 500 سرور ایرر سرچ رینکنگ کو متاثر نہ کرے۔'
                      : 'Checks HTTP status codes and response times for all internal hyperlinks discovered on this page to prevent crawler abandonment.'}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap justify-center sm:justify-end">
                  <button
                    type="button"
                    onClick={handleExportBrokenLinksCsv}
                    disabled={result.internalLinksReport.links.length === 0}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Export link audit to CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isUrdu ? 'سی ایس وی ایکسپورٹ' : 'Export CSV'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCrawlLinks}
                    disabled={isCrawlingLinks || result.internalLinksReport.links.length === 0}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCrawlingLinks ? 'animate-spin' : ''}`} />
                    <span>
                      {isCrawlingLinks
                        ? (isUrdu ? `کرال ہو رہا ہے (${crawlProgress}%)` : `Crawling (${crawlProgress}%)...`)
                        : (isUrdu ? 'انٹرنل لنکس دوبارہ کرال کریں' : 'Re-Crawl Internal Links')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Crawl Progress Bar (when crawling or active) */}
              {isCrawlingLinks && (
                <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      Crawling internal URLs ({crawledLinkCount} of {result.internalLinksReport.uniqueUrlsCount})
                    </span>
                    <span>{crawlProgress}%</span>
                  </div>
                  <div className="w-full bg-indigo-200/60 dark:bg-indigo-900/60 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${crawlProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Broken Links Alert Banner if any broken links exist */}
              {result.internalLinksReport.brokenCount > 0 ? (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-red-800 dark:text-red-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-red-900 dark:text-red-100">
                        {result.internalLinksReport.brokenCount} Broken Internal Link{result.internalLinksReport.brokenCount > 1 ? 's' : ''} Detected!
                      </h4>
                      <p className="text-red-700 dark:text-red-300 mt-0.5">
                        These links lead to 404 Not Found or 500 error pages. Fixing these will immediately recover wasted crawl budget and improve visitor conversion rates.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLinkFilter('broken')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shrink-0 cursor-pointer shadow-xs"
                  >
                    View Broken Links Only
                  </button>
                </div>
              ) : result.internalLinksReport.crawledCount > 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-100">
                      Zero Broken Internal Links Found!
                    </h4>
                    <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
                      All tested internal hyperlinks responded with valid HTTP 200 OK statuses. No dead ends or 404 errors detected.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setLinkFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      linkFilter === 'all'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    All Links ({result.internalLinksReport.uniqueUrlsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLinkFilter('broken')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      linkFilter === 'broken'
                        ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    Broken ({result.internalLinksReport.brokenCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLinkFilter('ok')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      linkFilter === 'ok'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    Working ({result.internalLinksReport.okCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLinkFilter('redirect')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      linkFilter === 'redirect'
                        ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    Redirects ({result.internalLinksReport.redirectCount})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={linkSearchQuery}
                    onChange={(e) => setLinkSearchQuery(e.target.value)}
                    placeholder="Search by URL or anchor text..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Links Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Target URL</th>
                        <th className="py-3 px-4">Anchor Text</th>
                        <th className="py-3 px-4">Latency</th>
                        <th className="py-3 px-4">Found On Page</th>
                        <th className="py-3 px-4">Diagnostic Tip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-xs">
                      {filteredLinks.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                            No links match your filter or search query.
                          </td>
                        </tr>
                      ) : (
                        filteredLinks.map((link) => {
                          const isBroken = link.status === 'broken' || link.status === 'timeout';
                          const isRedirect = link.status === 'redirect';
                          const isOk = link.status === 'ok';
                          const isChecking = link.status === 'checking';

                          return (
                            <tr
                              key={link.id}
                              className={`transition-colors ${
                                isBroken
                                  ? 'bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50/70 dark:hover:bg-red-950/30'
                                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                              }`}
                            >
                              <td className="py-3 px-4 whitespace-nowrap">
                                {isChecking ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-300 animate-pulse border border-indigo-200 dark:border-indigo-800">
                                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                    Checking
                                  </span>
                                ) : isOk ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                    {link.statusText || '200 OK'}
                                  </span>
                                ) : isBroken ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-300 dark:border-red-800">
                                    <XCircle className="w-2.5 h-2.5 text-red-500" />
                                    {link.statusText || '404 Dead Link'}
                                  </span>
                                ) : isRedirect ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                    <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                                    {link.statusText || '301 Redirect'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                    Untested
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 max-w-xs">
                                <div className="flex items-center gap-1.5 truncate">
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                                    title={link.url}
                                  >
                                    {link.originalHref}
                                  </a>
                                  <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                                </div>
                                <span className="text-[10px] text-slate-400 block truncate" title={link.url}>
                                  {link.url}
                                </span>
                              </td>

                              <td className="py-3 px-4 font-sans text-slate-700 dark:text-slate-300 max-w-xs truncate">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-medium inline-block max-w-[200px] truncate" title={link.anchorText}>
                                  {link.anchorText || '(Empty anchor text)'}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                {link.responseTimeMs ? `${link.responseTimeMs} ms` : '—'}
                              </td>

                              <td className="py-3 px-4 font-sans text-slate-500 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">
                                  {link.occurrences}x on page
                                </span>
                              </td>

                              <td className="py-3 px-4 font-sans text-[11px] text-slate-600 dark:text-slate-300 max-w-xs">
                                {link.diagnosticTip ? (
                                  <span className={isBroken ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
                                    {link.diagnosticTip}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">No issues found</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB: KEYWORD DENSITY ANALYSIS */}
          {/* ========================================================== */}
          {activeTab === 'keywords' && (
            <KeywordDensityTab result={result} />
          )}

          {/* ========================================================== */}
          {/* TAB 5: 1-CLICK CLEAN FIX CODE */}
          {/* ========================================================== */}
          {activeTab === 'fixcode' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Auto-Generated Clean SEO &lt;head&gt; Code
                  </h3>
                  <p className="text-xs text-slate-500">
                    Copy and replace or insert these optimized tags into your website's &lt;head&gt; to resolve all missing meta tag issues immediately.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyAllCode(result.generatedFixHeadCode)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  {copiedAllCode ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Complete &lt;head&gt; Code</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-slate-950 text-indigo-200 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                  {result.generatedFixHeadCode}
                </pre>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* BOTTOM SUMMARY & DOWNLOAD REPORT AS PDF CARD */}
          {/* ========================================================== */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-indigo-900/50 p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="space-y-1.5 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <FileText className="w-5 h-5 text-indigo-400" />
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white">
                  {isUrdu ? 'ایس ای او آڈٹ رپورٹ پی ڈی ایف ڈاؤن لوڈ کریں' : 'Download Complete SEO Audit Report'}
                </h4>
              </div>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                {isUrdu
                  ? 'مکمل آن پیج ایس ای او رپورٹ مع میٹا ٹیگز اسٹیٹس، ایچ ون سے ایچ سکس ہیڈنگ ہائرارکی، اسپیڈ میٹرکس اور ایکشن ایبل تجاویز کو بطور پی ڈی ایف محفوظ کریں۔'
                  : 'Save this full technical audit as a publication-ready PDF report, containing complete meta tag validations, heading structure outlines, Web Vitals performance benchmarks, and prioritized developer recommendations.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white flex items-center gap-2.5 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
            >
              {isGeneratingPdf ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Download className="w-4 h-4 text-white" />
              )}
              <span>
                {isGeneratingPdf
                  ? (isUrdu ? 'پی ڈی ایف تیار ہو رہی ہے...' : 'Generating PDF Report...')
                  : (isUrdu ? 'ڈاؤن لوڈ رپورٹ بطور پی ڈی ایف' : 'Download Report as PDF')}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
