import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import {
  FileJson,
  CheckCircle,
  AlertCircle,
  Copy,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Sliders,
  ChevronRight,
  ChevronDown,
  Layers,
  Search,
  ArrowUpDown,
  Minimize2,
  Maximize2,
  FileText,
  Wand2,
} from 'lucide-react';
import { useAutoSave, formatSavedTime } from '../../../utils/useAutoSave';

type IndentSize = '2' | '4' | 'tab' | '0';
type ViewMode = 'code' | 'tree';

interface JsonStats {
  sizeBytes: number;
  lines: number;
  keysCount: number;
  depth: number;
  itemType: string;
}

const SAMPLE_JSONS = {
  apiResponse: `{
  "status": "success",
  "statusCode": 200,
  "data": {
    "organization": "FreeTools Hub Global",
    "version": "2.4.0",
    "activeFeatures": [
      "realtime_conversion",
      "offline_storage",
      "pwa_installed"
    ],
    "metrics": {
      "activeUsersToday": 14280,
      "uptime": 99.99,
      "cacheHitRate": 0.942
    },
    "endpoints": [
      {
        "id": "ep_1",
        "path": "/api/v1/tools",
        "method": "GET",
        "rateLimit": 1000,
        "isPublic": true
      },
      {
        "id": "ep_2",
        "path": "/api/v1/seo/validate",
        "method": "POST",
        "rateLimit": 500,
        "isPublic": true
      }
    ]
  },
  "timestamp": "2026-10-13T10:15:00.000Z",
  "debug": null
}`,
  ecommerce: `{
  "store": "NeoCraft Goods",
  "currency": "USD",
  "products": [
    {
      "sku": "NC-8821",
      "title": "Minimalist Oak Desk Organizer",
      "price": 49.99,
      "inStock": true,
      "tags": ["office", "wood", "handmade"],
      "dimensions": { "width": 24, "depth": 12, "height": 6, "unit": "cm" }
    },
    {
      "sku": "NC-9940",
      "title": "Acoustic Felt Desk Divider",
      "price": 89.00,
      "inStock": false,
      "tags": ["acoustic", "soundproofing", "modular"],
      "dimensions": { "width": 120, "depth": 2, "height": 45, "unit": "cm" }
    }
  ]
}`,
  invalidSample: `{
  "title": "Unquoted keys or trailing comma test",
  description: 'Single quotes and trailing comma below',
  "count": 42,
  "items": [
    "first item",
    "second item",
  ]
}`,
};

export const JsonFormatterTool: React.FC = () => {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';
  const {
    data: inputRaw,
    setData: setInputRaw,
    lastSaved,
    isSaving,
    clearDraft: resetJsonDraft,
    restoreBackup: restoreJsonBackup,
  } = useAutoSave<string>('ft_json_formatter_draft', SAMPLE_JSONS.apiResponse, 300);
  const [indent, setIndent] = useState<IndentSize>('2');
  const [sortKeys, setSortKeys] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('code');
  const [treeSearch, setTreeSearch] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [lineWrap, setLineWrap] = useState<boolean>(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parsing and validation
  const validationResult = useMemo(() => {
    const rawTrimmed = inputRaw.trim();
    if (!rawTrimmed) {
      return {
        isValid: true,
        isEmpty: true,
        parsed: null,
        error: null,
        errorLine: null,
        errorCol: null,
      };
    }

    try {
      const parsed = JSON.parse(rawTrimmed);
      return {
        isValid: true,
        isEmpty: false,
        parsed,
        error: null,
        errorLine: null,
        errorCol: null,
      };
    } catch (err: any) {
      const msg = err.message || 'Invalid JSON syntax';
      let errorLine: number | null = null;
      let errorCol: number | null = null;

      // Match "at line X column Y" or "at position Z"
      const lineMatch = msg.match(/line (\d+) column (\d+)/i);
      if (lineMatch) {
        errorLine = parseInt(lineMatch[1], 10);
        errorCol = parseInt(lineMatch[2], 10);
      } else {
        const posMatch = msg.match(/position (\d+)/i);
        if (posMatch) {
          const pos = parseInt(posMatch[1], 10);
          const linesUpToPos = rawTrimmed.substring(0, pos).split('\n');
          errorLine = linesUpToPos.length;
          errorCol = linesUpToPos[linesUpToPos.length - 1].length + 1;
        }
      }

      return {
        isValid: false,
        isEmpty: false,
        parsed: null,
        error: msg,
        errorLine,
        errorCol,
      };
    }
  }, [inputRaw]);

  // Recursively sort object keys
  const sortObjectKeys = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(sortObjectKeys);
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj)
        .sort()
        .reduce((acc: any, key: string) => {
          acc[key] = sortObjectKeys(obj[key]);
          return acc;
        }, {});
    }
    return obj;
  };

  // Formatted Output string
  const formattedOutput = useMemo(() => {
    if (!validationResult.isValid || validationResult.isEmpty) {
      return '';
    }

    let dataToFormat = validationResult.parsed;
    if (sortKeys) {
      dataToFormat = sortObjectKeys(dataToFormat);
    }

    let indentSpacing: number | string = 2;
    if (indent === '4') indentSpacing = 4;
    else if (indent === 'tab') indentSpacing = '\t';
    else if (indent === '0') indentSpacing = 0;

    return JSON.stringify(dataToFormat, null, indentSpacing);
  }, [validationResult, indent, sortKeys]);

  // Statistics calculation
  const stats = useMemo<JsonStats | null>(() => {
    if (!validationResult.isValid || validationResult.isEmpty) return null;

    const data = validationResult.parsed;
    let keysCount = 0;
    let maxDepth = 0;

    const traverse = (node: any, currentDepth: number) => {
      maxDepth = Math.max(maxDepth, currentDepth);
      if (Array.isArray(node)) {
        node.forEach((item) => traverse(item, currentDepth + 1));
      } else if (node !== null && typeof node === 'object') {
        const keys = Object.keys(node);
        keysCount += keys.length;
        keys.forEach((k) => traverse(node[k], currentDepth + 1));
      }
    };

    traverse(data, 1);

    const encoder = new TextEncoder();
    const sizeBytes = encoder.encode(inputRaw).length;
    const lines = formattedOutput ? formattedOutput.split('\n').length : 0;
    const itemType = Array.isArray(data) ? `Array (${data.length} items)` : typeof data === 'object' && data !== null ? 'Object' : typeof data;

    return {
      sizeBytes,
      lines,
      keysCount,
      depth: maxDepth,
      itemType,
    };
  }, [validationResult, inputRaw, formattedOutput]);

  // Quick automated fix for common issues (single quotes, trailing commas, unquoted keys)
  const handleAutoFix = () => {
    try {
      let text = inputRaw;
      // Replace single quoted keys: 'key': -> "key":
      text = text.replace(/'([a-zA-Z0-9_$-]+)'\s*:/g, '"$1":');
      // Replace unquoted keys: { key: or , key: -> { "key": or , "key":
      text = text.replace(/([{,]\s*)([a-zA-Z0-9_$-]+)\s*:/g, '$1"$2":');
      // Replace single quoted strings: : 'val' -> : "val"
      text = text.replace(/:\s*'([^']*)'/g, ': "$1"');
      // Remove trailing commas in objects: , \n } -> \n }
      text = text.replace(/,(\s*[}\]])/g, '$1');

      setInputRaw(text);
    } catch {
      // ignore
    }
  };

  const handleCopy = () => {
    const textToCopy = formattedOutput || inputRaw;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = formattedOutput || inputRaw;
    if (!text) return;
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = indent === '0' ? 'minified.json' : 'formatted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('JSON file exceeds the 5 MB browser limit. Please upload a file under 5 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputRaw(content);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Syntax Highlighting generator
  const renderHighlightedJson = (jsonString: string) => {
    if (!jsonString) return null;

    // Tokenizer regex for JSON
    const tokenRegex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|[{}[\],:])/g;

    const tokens: React.ReactNode[] = [];
    let lastIdx = 0;
    let match;

    while ((match = tokenRegex.exec(jsonString)) !== null) {
      const matchText = match[0];
      const startIdx = match.index;

      // Add leading whitespace/newlines
      if (startIdx > lastIdx) {
        tokens.push(jsonString.substring(lastIdx, startIdx));
      }
      lastIdx = tokenRegex.lastIndex;

      if (/^"/.test(matchText)) {
        if (/:$/.test(matchText)) {
          // Key name
          tokens.push(
            <span key={startIdx} className="text-sky-600 dark:text-sky-400 font-semibold">
              {matchText}
            </span>
          );
        } else {
          // String value
          tokens.push(
            <span key={startIdx} className="text-emerald-600 dark:text-emerald-400">
              {matchText}
            </span>
          );
        }
      } else if (/true|false/.test(matchText)) {
        // Boolean
        tokens.push(
          <span key={startIdx} className="text-purple-600 dark:text-purple-400 font-medium">
            {matchText}
          </span>
        );
      } else if (/null/.test(matchText)) {
        // Null
        tokens.push(
          <span key={startIdx} className="text-rose-500 font-medium italic">
            {matchText}
          </span>
        );
      } else if (/^-?\d/.test(matchText)) {
        // Number
        tokens.push(
          <span key={startIdx} className="text-amber-600 dark:text-amber-400 font-medium">
            {matchText}
          </span>
        );
      } else {
        // Braces / brackets / punctuation
        tokens.push(
          <span key={startIdx} className="text-slate-500 dark:text-slate-400 font-bold">
            {matchText}
          </span>
        );
      }
    }

    if (lastIdx < jsonString.length) {
      tokens.push(jsonString.substring(lastIdx));
    }

    return tokens;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FileJson className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {isUrdu ? 'جے ایس او این فارمیٹر اور ویلیڈیٹر' : 'JSON Formatter & Validator'}
                </h1>
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  title="Your JSON input is automatically saved to local storage"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`} />
                  <span>
                    {isSaving
                      ? (isUrdu ? 'محفوظ ہو رہا ہے...' : 'Saving...')
                      : (isUrdu ? `خودکار محفوظ: ${formatSavedTime(lastSaved, true)}` : `Auto-saved ${formatSavedTime(lastSaved)}`)}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isUrdu
                  ? 'جے ایس او این کو خوبصورت بنائیں، خامیاں پکڑیں اور کمپریس کریں'
                  : 'Beautify, inspect, validate syntax, fix errors, and minify JSON data with interactive tree navigation'}
              </p>
            </div>
          </div>
        </div>

        {/* Top Sample Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isUrdu ? 'نمونے:' : 'Samples:'}
          </span>
          <button
            onClick={() => setInputRaw(SAMPLE_JSONS.apiResponse)}
            className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            API Response
          </button>
          <button
            onClick={() => setInputRaw(SAMPLE_JSONS.ecommerce)}
            className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            Catalog
          </button>
          <button
            onClick={() => setInputRaw(SAMPLE_JSONS.invalidSample)}
            className="px-2.5 py-1 text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-300 rounded-lg transition-colors border border-rose-200 dark:border-rose-900"
          >
            Syntax Error Sample
          </button>
          <button
            onClick={() => setInputRaw('')}
            title="Clear"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Control Action Toolbar */}
      <div className="mb-6 bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Left: Indentation & Sorting */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-medium">
            <button
              onClick={() => setIndent('2')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                indent === '2'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              2 Spaces
            </button>
            <button
              onClick={() => setIndent('4')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                indent === '4'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              4 Spaces
            </button>
            <button
              onClick={() => setIndent('tab')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                indent === 'tab'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Tab
            </button>
            <button
              onClick={() => setIndent('0')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                indent === '0'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Minify (Compact)
            </button>
          </div>

          {/* Sort Keys button */}
          <button
            onClick={() => setSortKeys(!sortKeys)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border ${
              sortKeys
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300'
                : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort Keys A-Z</span>
          </button>

          {/* Auto Fix helper button if invalid */}
          {!validationResult.isValid && !validationResult.isEmpty && (
            <button
              onClick={handleAutoFix}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Auto-Fix Quotes & Commas</span>
            </button>
          )}
        </div>

        {/* Right: File operations & View toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* File Upload Hidden Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,application/json,text/plain"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload .json</span>
          </button>

          <button
            onClick={handleCopy}
            disabled={!formattedOutput && !inputRaw}
            className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={!formattedOutput && !inputRaw}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Status Bar / Error Highlight Banner */}
      {uploadError && (
        <div role="alert" className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-[11px] font-semibold underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="mb-6">
        {validationResult.isEmpty ? (
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-400" />
            <span>Paste your JSON text into the left editor to validate and format it instantly.</span>
          </div>
        ) : validationResult.isValid ? (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Valid JSON Syntax</span>
            </div>
            {stats && (
              <div className="flex items-center gap-4 text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">
                <span>Type: {stats.itemType}</span>
                <span>Size: {(stats.sizeBytes / 1024).toFixed(2)} KB</span>
                <span>Keys: {stats.keysCount}</span>
                <span>Max Depth: {stats.depth}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>JSON Syntax Error Detected</span>
              </div>
              {validationResult.errorLine !== null && (
                <span className="font-mono bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 px-2 py-0.5 rounded text-[11px] font-semibold">
                  Line {validationResult.errorLine}
                  {validationResult.errorCol !== null ? ` : Col ${validationResult.errorCol}` : ''}
                </span>
              )}
            </div>
            <p className="font-mono text-[11px] pl-6 text-rose-700 dark:text-rose-400">
              {validationResult.error}
            </p>
          </div>
        )}
      </div>

      {/* Main Split Panels: Raw Input & Formatted Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Panel: Raw Input */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[580px]">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Raw JSON Input
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {inputRaw.length} characters
            </span>
          </div>

          <textarea
            value={inputRaw}
            onChange={(e) => setInputRaw(e.target.value)}
            placeholder="Paste raw JSON here..."
            spellCheck={false}
            className="flex-1 w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white resize-none leading-relaxed overflow-auto"
          />
        </div>

        {/* Right Panel: Formatted Output / Tree Inspector */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[580px]">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setViewMode('code')}
                  className={`px-2 py-0.5 rounded ${
                    viewMode === 'code'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs font-semibold'
                      : 'text-slate-500'
                  }`}
                >
                  Formatted Code
                </button>
                <button
                  onClick={() => setViewMode('tree')}
                  disabled={!validationResult.isValid || validationResult.isEmpty}
                  className={`px-2 py-0.5 rounded disabled:opacity-40 ${
                    viewMode === 'tree'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs font-semibold'
                      : 'text-slate-500'
                  }`}
                >
                  Interactive Tree
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {viewMode === 'code' && (
                <button
                  onClick={() => setLineWrap(!lineWrap)}
                  title="Toggle Word Wrap"
                  className={`text-[11px] px-2 py-0.5 rounded font-medium border ${
                    lineWrap
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-400'
                      : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                  }`}
                >
                  Wrap
                </button>
              )}
              {stats && (
                <span className="text-[11px] text-slate-400 font-mono">
                  {stats.lines} lines
                </span>
              )}
            </div>
          </div>

          {/* Body Viewer */}
          <div className="flex-1 overflow-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-100 border border-slate-800">
            {validationResult.isEmpty ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-sans">
                Formatted JSON output will appear here
              </div>
            ) : !validationResult.isValid ? (
              <div className="p-4 text-rose-400 space-y-2 font-mono text-xs">
                <p className="font-bold">⚠️ Cannot format invalid JSON syntax</p>
                <p className="text-slate-400 text-[11px]">
                  Check the red error banner above for the exact location of the syntax error.
                </p>
              </div>
            ) : viewMode === 'code' ? (
              <pre className={`${lineWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'} leading-relaxed`}>
                <code>{renderHighlightedJson(formattedOutput)}</code>
              </pre>
            ) : (
              <div className="font-sans text-xs space-y-2 text-slate-200">
                <div className="mb-3 flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={treeSearch}
                    onChange={(e) => setTreeSearch(e.target.value)}
                    placeholder="Filter keys or values..."
                    className="bg-transparent text-xs text-white focus:outline-none flex-1 placeholder:text-slate-600"
                  />
                  {treeSearch && (
                    <button
                      onClick={() => setTreeSearch('')}
                      className="text-[10px] text-slate-500 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <JsonTreeNode
                  name="root"
                  value={validationResult.parsed}
                  isLast={true}
                  searchTerm={treeSearch.toLowerCase()}
                  depth={0}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Guide & Shortcuts */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" /> RFC 8259 Compliant
          </h4>
          <p className="text-[11px]">
            Complies with standard JSON specifications: double quotes required for strings and object keys, no trailing commas.
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Wand2 className="w-4 h-4 text-purple-500" /> Smart Auto-Fixer
          </h4>
          <p className="text-[11px]">
            Converts single quotes to double quotes, quotes unquoted JavaScript object keys, and strips stray trailing commas.
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-500" /> Fast Client-Side Processing
          </h4>
          <p className="text-[11px]">
            All JSON parsing runs 100% locally in your browser. No sensitive data or payload is ever sent to any remote server.
          </p>
        </div>
      </div>
    </div>
  );
};

// Recursive Tree Node Explorer Component
interface JsonTreeNodeProps {
  name: string;
  value: any;
  isLast: boolean;
  searchTerm: string;
  depth: number;
}

const JsonTreeNode: React.FC<JsonTreeNodeProps> = ({
  name,
  value,
  isLast,
  searchTerm,
  depth,
}) => {
  const [collapsed, setCollapsed] = useState<boolean>(depth > 2);

  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  const matchSearch = useMemo(() => {
    if (!searchTerm) return true;
    if (name.toLowerCase().includes(searchTerm)) return true;
    if (!isObject && String(value).toLowerCase().includes(searchTerm)) return true;
    return false;
  }, [name, value, isObject, searchTerm]);

  if (!matchSearch && !searchTerm.includes(name.toLowerCase())) {
    // If not matching, check if children match
    if (isObject) {
      const stringified = JSON.stringify(value).toLowerCase();
      if (!stringified.includes(searchTerm)) return null;
    } else {
      return null;
    }
  }

  if (isObject) {
    const keys = Object.keys(value);
    const count = keys.length;

    return (
      <div className="pl-3 border-l border-slate-800 my-0.5">
        <div
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1.5 py-0.5 cursor-pointer hover:bg-slate-900/80 rounded px-1 group"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
          )}
          <span className="text-sky-400 font-semibold">{name}</span>
          <span className="text-slate-500 text-[10px]">
            {isArray ? `Array[${count}]` : `Object{${count}}`}
          </span>
        </div>

        {!collapsed && (
          <div className="pl-2">
            {keys.map((k, i) => (
              <JsonTreeNode
                key={k}
                name={k}
                value={value[k]}
                isLast={i === keys.length - 1}
                searchTerm={searchTerm}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Primitive value
  let valueDisplay: React.ReactNode;
  if (typeof value === 'string') {
    valueDisplay = <span className="text-emerald-400">"{value}"</span>;
  } else if (typeof value === 'number') {
    valueDisplay = <span className="text-amber-400">{value}</span>;
  } else if (typeof value === 'boolean') {
    valueDisplay = <span className="text-purple-400">{value ? 'true' : 'false'}</span>;
  } else if (value === null) {
    valueDisplay = <span className="text-rose-400 italic">null</span>;
  } else {
    valueDisplay = <span className="text-slate-300">{String(value)}</span>;
  }

  return (
    <div className="flex items-center gap-1.5 py-0.5 pl-4 hover:bg-slate-900/60 rounded px-1 text-[11px] font-mono">
      <span className="text-sky-400 font-medium">{name}:</span>
      {valueDisplay}
      {!isLast && <span className="text-slate-600">,</span>}
    </div>
  );
};
