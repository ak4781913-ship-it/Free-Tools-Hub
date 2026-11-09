import React, { useState } from 'react';
import { convertTextCase, cleanExtraSpaces, CaseConversionType } from '../../../utils/textConverters';
import { useLanguage } from '../../../context/LanguageContext';
import { CaseSensitive, Copy, Download, RotateCcw, CheckCircle, Sparkles } from 'lucide-react';
import { emitCalculationSuccess } from '../../../utils/calculationToastNotifier';

export const TextCaseConverterTool: React.FC = () => {
  const { t } = useLanguage();

  const [text, setText] = useState(
    'the quick brown fox jumps over the lazy dog. master your copywriting with instant formatting.'
  );
  const [copied, setCopied] = useState(false);

  const applyCase = (type: CaseConversionType) => {
    if (!text.trim()) return;
    const next = convertTextCase(text, type);
    setText(next);
    const labels: Record<CaseConversionType, string> = {
      upper: 'UPPERCASE',
      lower: 'lowercase',
      title: 'Title Case',
      sentence: 'Sentence case',
      camel: 'camelCase',
      snake: 'snake_case',
      kebab: 'kebab-case',
      alternating: 'aLtErNaTiNg cAsE',
    };
    emitCalculationSuccess({
      toolId: 'text-case-converter',
      title: 'Text Case Converted',
      titleUrdu: 'ٹیکسٹ فارمیٹ تبدیل ہو گیا',
      message: `Converted to ${labels[type] || type} (${next.length.toLocaleString()} chars)`,
      messageUrdu: `${labels[type] || type} میں تبدیل ہو گیا`,
    });
  };

  const handleCleanSpaces = () => {
    if (!text.trim()) return;
    const next = cleanExtraSpaces(text);
    setText(next);
    emitCalculationSuccess({
      toolId: 'text-case-converter',
      title: 'Whitespace Cleaned',
      titleUrdu: 'اضافی خالی جگہیں ختم ہو گئیں',
      message: `${next.length.toLocaleString()} characters formatted`,
      messageUrdu: `${next.length.toLocaleString()} حروف درست ہو گئے`,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formatted_text_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setText('');
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
            <CaseSensitive className="w-4 h-4" />
            <span>String Manipulation & Formatting</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Text Case Converter
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Switch between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, and remove redundant whitespace.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Text</span>
        </button>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          Transform text format:
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyCase('upper')}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            UPPERCASE
          </button>
          <button
            type="button"
            onClick={() => applyCase('lower')}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            lowercase
          </button>
          <button
            type="button"
            onClick={() => applyCase('title')}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            Title Case
          </button>
          <button
            type="button"
            onClick={() => applyCase('sentence')}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            Sentence case
          </button>
          <button
            type="button"
            onClick={() => applyCase('camel')}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            camelCase
          </button>
          <button
            type="button"
            onClick={() => applyCase('snake')}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            snake_case
          </button>
          <button
            type="button"
            onClick={() => applyCase('kebab')}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            kebab-case
          </button>
          <button
            type="button"
            onClick={() => applyCase('alternating')}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            aLtErNaTiNg
          </button>
          <button
            type="button"
            onClick={handleCleanSpaces}
            className="px-3 py-1.5 text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200 dark:border-amber-800"
          >
            Clean Extra Spaces
          </button>
        </div>
      </div>

      {/* Editor & Output Box */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
          <span>Type or paste your text to convert:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download TXT</span>
            </button>
          </div>
        </div>

        <textarea
          rows={12}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or write your text here..."
          className="w-full p-4 text-sm leading-relaxed rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 font-mono"
        />

        <div className="flex justify-between text-[11px] text-slate-400 pt-1">
          <span>Length: {text.length} characters</span>
          <span>Words: {text.trim() ? text.trim().split(/\s+/).length : 0}</span>
        </div>
      </div>
    </div>
  );
};
