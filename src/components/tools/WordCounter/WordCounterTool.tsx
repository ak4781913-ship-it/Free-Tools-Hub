import React, { useState, useMemo } from 'react';
import { analyzeText } from '../../../utils/textConverters';
import { useLanguage } from '../../../context/LanguageContext';
import { recordPrintDocument } from '../../../utils/printHistoryTracking';
import { downloadWordCounterPDF } from '../../../utils/wordCounterPdfGenerator';
import { useAutoSave, formatSavedTime } from '../../../utils/useAutoSave';
import {
  Type,
  Copy,
  RotateCcw,
  CheckCircle,
  FileText,
  Clock,
  BarChart3,
  Printer,
  FileDown,
  Loader2,
} from 'lucide-react';

const DEFAULT_SAMPLE_TEXT =
  'FreeTools Hub empowers professionals, developers, and creators worldwide with zero-barrier browser utilities. Our suite provides instant CV generation, legal UAE gratuity estimations, generative AI prompt engineering, and everyday text optimization tools without collecting or storing your personal data.';

export const WordCounterTool: React.FC = () => {
  const { language, t } = useLanguage();
  const isUrdu = language === 'ur';

  const {
    data: text,
    setData: setText,
    lastSaved,
    isSaving,
    clearDraft,
    restoreBackup,
  } = useAutoSave<string>('ft_wordcounter_text', DEFAULT_SAMPLE_TEXT, 300);

  const [copied, setCopied] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const stats = useMemo(() => analyzeText(text), [text]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    clearDraft();
    setText('');
    showToast(isUrdu ? 'متن صاف ہو گیا (پچھلا ڈرافٹ بیک اپ میں محفوظ ہے)' : 'Text cleared (previous draft backed up).');
  };

  const handleRestore = () => {
    const ok = restoreBackup();
    if (ok) {
      showToast(isUrdu ? 'پچھلا ڈرافٹ بحال ہو گیا!' : 'Previous draft restored!');
    } else {
      showToast(isUrdu ? 'کوئی بیک اپ دستیاب نہیں ہے' : 'No previous draft found.');
    }
  };

  const loadSample = () => {
    setText(
      'Artificial intelligence systems continue to reshape how engineers and product teams collaborate across industries. By structuring clear prompt specifications and providing contextual boundary conditions, creative professionals achieve repeatable, production-ready outputs.'
    );
  };

  const handleDownloadPDF = () => {
    if (isExportingPDF) return;
    setIsExportingPDF(true);
    showToast(isUrdu ? 'پی ڈی ایف رپورٹ تیار ہو رہی ہے...' : 'Generating executive text metrics report...');

    try {
      const topKeywords = stats.topWords.map((item) => ({
        word: item.word,
        count: item.count,
        percentage: stats.words > 0 ? (item.count / stats.words) * 100 : 0,
      }));

      const fileName = downloadWordCounterPDF(text, stats, topKeywords);
      showToast(isUrdu ? `رپورٹ "${fileName}" ڈاؤن لوڈ ہو گئی!` : `Downloaded "${fileName}" successfully!`);
    } catch (err) {
      console.error('Error generating PDF report:', err);
      showToast(isUrdu ? 'پی ڈی ایف میں خرابی، پرنٹ ونڈو کھولی جا رہی ہے...' : 'PDF generation failed. Opening print dialog...');
      window.print();
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handlePrint = () => {
    recordPrintDocument('word-counter', `Text Analysis Report (${stats.words} words)`, {
      toolName: 'Word & Character Counter',
      format: 'Executive Audit Print',
      summary: `${stats.words} words • ${stats.charactersWithSpaces} characters • ${stats.readingTimeMinutes} min read`,
    });
    window.print();
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <Type className="w-4 h-4" />
              <span>Text Statistics & Analysis</span>
            </div>
            {/* Auto-save Status Badge */}
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              title="Your text is automatically saved to browser local storage so you never lose your draft"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`} />
              <span>
                {isSaving
                  ? (isUrdu ? 'محفوظ ہو رہا ہے...' : 'Saving...')
                  : (isUrdu ? `خودکار محفوظ: ${formatSavedTime(lastSaved, true)}` : `Auto-saved ${formatSavedTime(lastSaved)}`)}
              </span>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Word & Character Counter
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time word counts, character lengths, sentence density, and reading time metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadSample}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {isUrdu ? 'نمونہ لوڈ کریں' : 'Load Sample'}
          </button>
          <button
            type="button"
            onClick={handleRestore}
            className="px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
            title="Restore previous draft if cleared"
          >
            {isUrdu ? 'ڈرافٹ بحال کریں' : 'Restore Draft'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
          >
            {isUrdu ? 'صاف کریں' : 'Clear'}
          </button>

          {/* Print Report */}
          <button
            type="button"
            onClick={handlePrint}
            title={isUrdu ? 'رپورٹ پرنٹ کریں (پرنٹ ہسٹری میں محفوظ ہوگا)' : 'Print report (recorded in Print History)'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'پرنٹ' : 'Print'}</span>
          </button>

          {/* Download PDF Report */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isExportingPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 rounded-lg transition-all shadow-xs cursor-pointer"
            title={isUrdu ? 'رپورٹ کو پی ڈی ایف کے طور پر محفوظ کریں' : 'Save text metrics as executive PDF report'}
          >
            {isExportingPDF ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>{isUrdu ? 'تیار ہو رہا ہے...' : 'Generating...'}</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5 text-white" />
                <span>{isUrdu ? 'پی ڈی ایف ڈاؤن لوڈ کریں' : 'Download PDF'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Floating Status Notification */}
      {toastMsg && (
        <div className="px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-medium text-indigo-900 dark:text-indigo-200 flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-indigo-500 hover:text-indigo-800 dark:hover:text-indigo-100 p-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Total Words</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
            {stats.words.toLocaleString()}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Characters (with spaces)</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {stats.charactersWithSpaces.toLocaleString()}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Characters (no spaces)</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {stats.charactersWithoutSpaces.toLocaleString()}
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Sentences</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {stats.sentences.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Main Textarea & Extra Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
            <span>Type or paste your content below:</span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy All'}</span>
            </button>
          </div>

          <textarea
            rows={12}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here..."
            className="w-full p-3.5 text-sm leading-relaxed rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 font-sans"
          />
        </div>

        {/* Right: Detailed timing & word frequency metrics */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3.5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Pacing & Reading Estimates</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Reading Time (200 wpm)</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-white">
                  ~{stats.readingTimeMinutes} min
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Speaking Time (130 wpm)</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-white">
                  ~{stats.speakingTimeMinutes} min
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Paragraphs</span>
                <span className="font-semibold font-mono text-slate-900 dark:text-white">
                  {stats.paragraphs}
                </span>
              </div>
            </div>
          </div>

          {/* Keyword density */}
          {stats.topWords.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <span>Top Frequent Keywords</span>
              </h3>
              <div className="space-y-1.5 text-xs">
                {stats.topWords.map(({ word, count }) => (
                  <div key={word} className="flex justify-between items-center py-0.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{word}</span>
                    <span className="font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                      {count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
