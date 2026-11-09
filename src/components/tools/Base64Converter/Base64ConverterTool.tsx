import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Binary,
  ArrowRightLeft,
  Copy,
  CheckCircle,
  AlertTriangle,
  Upload,
  Download,
  RotateCcw,
  Sparkles,
  Image as ImageIcon,
  FileText,
  FileCode,
  Eye,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

type TabMode = 'text' | 'image';
type ActionType = 'encode' | 'decode';

// Helper for UTF-8 safe encoding/decoding
const utf8ToBase64 = (str: string, urlSafe = false): string => {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  let base64 = btoa(binary);
  if (urlSafe) {
    base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return base64;
};

const base64ToUtf8 = (base64Str: string): { text: string; error?: string } => {
  try {
    let clean = base64Str.trim();
    // Support URL-safe base64 decoding
    clean = clean.replace(/-/g, '+').replace(/_/g, '/');
    while (clean.length % 4 !== 0) {
      clean += '=';
    }

    // Verify valid base64 character set
    if (!/^[A-Za-z0-9+/=]+$/.test(clean)) {
      return { text: '', error: 'Contains characters outside the Base64 alphabet.' };
    }

    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { text: decoded };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid Base64 sequence';
    return { text: '', error: `Decode failed: ${message}` };
  }
};

// Preset text examples
const TEXT_PRESETS = [
  {
    name: 'Greeting & Emoji',
    content: 'Hello, World! 🌍✨ Welcome to FreeTools Hub!',
  },
  {
    name: 'Urdu & Multilingual',
    content: 'خوش آمدید! السلام علیکم - FreeTools Hub Base64 Utility',
  },
  {
    name: 'JSON Payload',
    content: '{"user":"developer","role":"admin","permissions":["read","write","deploy"]}',
  },
  {
    name: 'Basic Auth Token',
    content: 'user_admin:superSecretPassword987!',
  },
];

// Sample Image (tiny 16x16 colorful SVG base64)
const SAMPLE_IMAGE_BASE64 =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0Ij48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxNiIgZmlsbD0iIzQzMzhjYSIvPjxwYXRoIGQ9Ik0zMiAxNkw0NCAzOEgyMEwzMiAxNloiIGZpbGw9IiNmZmYiLz48L3N2Zz4=';

export const Base64ConverterTool: React.FC = () => {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  // State
  const [tabMode, setTabMode] = useState<TabMode>('text');
  const [action, setAction] = useState<ActionType>('encode');
  const [urlSafe, setUrlSafe] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);

  // Text mode state
  const [textInput, setTextInput] = useState('Hello, World! 🌍✨ Welcome to FreeTools Hub!');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Image mode state
  const [imageInputBase64, setImageInputBase64] = useState('');
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{
    name: string;
    type: string;
    size: number;
    base64: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copy feedback helper
  const handleCopy = (text: string, key = 'output') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Text Mode conversion calculation
  const textResult = useMemo(() => {
    if (!textInput.trim()) {
      return { output: '', error: null, byteLength: 0 };
    }

    if (action === 'encode') {
      try {
        let encoded = utf8ToBase64(textInput, urlSafe);
        if (wrapLines) {
          encoded = encoded.match(/.{1,76}/g)?.join('\n') || encoded;
        }
        const byteLength = new TextEncoder().encode(textInput).length;
        return { output: encoded, error: null, byteLength };
      } catch (e: unknown) {
        return {
          output: '',
          error: e instanceof Error ? e.message : 'Encoding failed',
          byteLength: 0,
        };
      }
    } else {
      const res = base64ToUtf8(textInput);
      return {
        output: res.text,
        error: res.error || null,
        byteLength: res.text ? new TextEncoder().encode(res.text).length : 0,
      };
    }
  }, [textInput, action, urlSafe, wrapLines]);

  // Image / Data URI decoding analysis
  const decodedImageDetails = useMemo(() => {
    const raw = (tabMode === 'image' && action === 'decode' ? imageInputBase64 : '').trim();
    if (!raw) return { isValid: false, src: '', mimeType: '', sizeApprox: 0, error: null };

    let src = raw;
    let mimeType = 'image/png';

    // If it doesn't have data: prefix, test if it looks like raw base64
    if (!raw.startsWith('data:')) {
      // Clean up whitespace
      const clean = raw.replace(/\s+/g, '');
      // Check if valid base64
      if (/^[A-Za-z0-9+/=]+$/.test(clean)) {
        // Default to PNG or SVG or JPG
        if (clean.startsWith('PHN2Zy')) {
          mimeType = 'image/svg+xml';
        } else if (clean.startsWith('/9j/')) {
          mimeType = 'image/jpeg';
        } else if (clean.startsWith('R0lGOD')) {
          mimeType = 'image/gif';
        } else if (clean.startsWith('UklGR')) {
          mimeType = 'image/webp';
        }
        src = `data:${mimeType};base64,${clean}`;
      } else {
        return {
          isValid: false,
          src: '',
          mimeType: '',
          sizeApprox: 0,
          error: 'Input string is not a valid Base64 or Data URI format.',
        };
      }
    } else {
      const match = raw.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
      }
    }

    // Estimate decoded bytes
    const base64Content = src.split(',')[1] || '';
    const cleanB64 = base64Content.replace(/=/g, '');
    const sizeApprox = Math.round((cleanB64.length * 3) / 4);

    return {
      isValid: true,
      src,
      mimeType,
      sizeApprox,
      error: null,
    };
  }, [imageInputBase64, tabMode, action]);

  // Handle file upload for Image/File mode
  const handleFileUpload = (file: File) => {
    const MAX_BYTES = 10 * 1024 * 1024; // 10 MB limit to protect browser memory
    if (file.size > MAX_BYTES) {
      setUploadError(
        isUrdu
          ? 'فائل کا سائز 10MB سے زیادہ ہے۔ براہ کرم چھوٹی فائل منتخب کریں۔'
          : 'File exceeds the 10 MB browser Base64 encoding limit. Please select a file under 10 MB.'
      );
      return;
    }
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedFileInfo({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        base64: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const onDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Swap input and output for text
  const handleSwap = () => {
    if (textResult.output && !textResult.error) {
      setTextInput(textResult.output);
      setAction(action === 'encode' ? 'decode' : 'encode');
    }
  };

  // Download text result
  const handleDownloadText = () => {
    if (!textResult.output) return;
    const blob = new Blob([textResult.output], {
      type: action === 'encode' ? 'text/plain;charset=utf-8' : 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = action === 'encode' ? 'encoded-base64.txt' : 'decoded-output.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download image result
  const handleDownloadImage = () => {
    if (!decodedImageDetails.src) return;
    const a = document.createElement('a');
    a.href = decodedImageDetails.src;
    const ext = decodedImageDetails.mimeType.split('/')[1] || 'png';
    a.download = `decoded-image.${ext}`;
    a.click();
  };

  // Calculate stats
  const inputCharCount = textInput.length;
  const outputCharCount = textResult.output.length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Binary className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isUrdu ? 'بیس 64 انکوڈر / ڈیکوڈر' : 'Base64 Encoder & Decoder'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {isUrdu
                  ? 'ٹیکسٹ اور تصاویر کو آسانی سے بیس 64 میں تبدیل کریں یا واپس لائیں۔'
                  : 'Convert text and images to Base64 data with UTF-8 support, URL-safe mode & error detection.'}
              </p>
            </div>
          </div>

          {/* Quick Info Badges */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isUrdu ? 'مکمل کلائنٹ سائیڈ (محفوظ)' : '100% Client-Side Private'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Zap className="w-3.5 h-3.5" />
              {isUrdu ? 'لائیو کنورژن' : 'Instant Reactive'}
            </span>
          </div>
        </div>

        {/* Primary Tabs: Text vs Image Mode */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pt-2 pb-0">
          <div className="flex gap-2">
            <button
              onClick={() => setTabMode('text')}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm border-b-2 transition-all ${
                tabMode === 'text'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              {isUrdu ? 'ٹیکسٹ کنورٹر' : 'Text Base64'}
            </button>
            <button
              onClick={() => setTabMode('image')}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm border-b-2 transition-all ${
                tabMode === 'image'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              {isUrdu ? 'تصویر / فائل کنورٹر' : 'Image & File Base64'}
            </button>
          </div>

          {/* Action Switcher: Encode vs Decode */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-2">
            <button
              onClick={() => setAction('encode')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                action === 'encode'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isUrdu ? 'انکوڈ (Encode)' : 'Encode'}
            </button>
            <button
              onClick={() => setAction('decode')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                action === 'decode'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isUrdu ? 'ڈیکوڈ (Decode)' : 'Decode'}
            </button>
          </div>
        </div>
      </div>

      {/* TEXT MODE */}
      {tabMode === 'text' && (
        <div className="space-y-6">
          {/* Options & Presets Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                {isUrdu ? 'اختیارات:' : 'Options:'}
              </span>

              {action === 'encode' && (
                <>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={urlSafe}
                      onChange={(e) => setUrlSafe(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{isUrdu ? 'URL-Safe (- اور _)' : 'URL-Safe (- and _)'}</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wrapLines}
                      onChange={(e) => setWrapLines(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{isUrdu ? '76 حروف پر نئی لائن' : 'Wrap at 76 chars (RFC 2045)'}</span>
                  </label>
                </>
              )}

              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs font-medium text-slate-500">
                {isUrdu ? 'انکوڈنگ: UTF-8 محفوظ' : 'Encoding: UTF-8 Compliant'}
              </span>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 hidden sm:inline">
                {isUrdu ? 'مثالیں:' : 'Presets:'}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {TEXT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setAction('encode');
                      setTextInput(preset.content);
                    }}
                    className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Two-Column Editor Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Input Card */}
            <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {action === 'encode'
                      ? isUrdu
                        ? 'ان پٹ ٹیکسٹ (Plain Text)'
                        : 'Input Plain Text'
                      : isUrdu
                      ? 'ان پٹ بیس 64 (Base64 Input)'
                      : 'Input Base64 String'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {inputCharCount} chars
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setTextInput('')}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                    title={isUrdu ? 'صاف کریں' : 'Clear'}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  {textResult.output && !textResult.error && (
                    <button
                      onClick={handleSwap}
                      className="px-2 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded flex items-center gap-1 transition-colors"
                      title={isUrdu ? 'ان پٹ اور آؤٹ پٹ تبدیل کریں' : 'Swap Input & Output'}
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>{isUrdu ? 'تبدیل کریں' : 'Swap'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={
                    action === 'encode'
                      ? isUrdu
                        ? 'یہاں ٹیکسٹ لکھیں یا پیسٹ کریں...'
                        : 'Type or paste plain text here to encode...'
                      : isUrdu
                      ? 'یہاں بیس 64 اسٹرنگ پیسٹ کریں...'
                      : 'Paste valid Base64 string here (e.g. SGVsbG8sIFdvcmxkIQ==)...'
                  }
                  rows={12}
                  className="w-full flex-1 p-3 font-mono text-xs sm:text-sm bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-slate-800 dark:text-slate-200 resize-y"
                  spellCheck={false}
                />
              </div>

              {/* Input Footer Note */}
              <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
                <span>
                  {action === 'encode'
                    ? isUrdu
                      ? 'ہر قسم کے ایموجیز اور اردو ٹیکسٹ کو سپورٹ کرتا ہے'
                      : 'Full UTF-8 Unicode support for symbols and languages'
                    : isUrdu
                    ? 'خودکار پیڈنگ اور ایرر چیکنگ فعال ہے'
                    : 'Auto-padded RFC compliant Base64 decoding'}
                </span>
                <span>{textResult.byteLength > 0 ? `${textResult.byteLength} bytes` : ''}</span>
              </div>
            </div>

            {/* Output Card */}
            <div className="flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {action === 'encode'
                      ? isUrdu
                        ? 'نتیجہ بیس 64 (Base64 Output)'
                        : 'Base64 Output'
                      : isUrdu
                      ? 'نتیجہ ٹیکسٹ (Decoded Plain Text)'
                      : 'Decoded Plain Text'}
                  </span>
                  {textResult.output && (
                    <span className="text-xs text-slate-400 font-mono">
                      {outputCharCount} chars
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(textResult.output, 'text-output')}
                    disabled={!textResult.output || !!textResult.error}
                    className={`px-3 py-1 text-xs font-medium rounded flex items-center gap-1.5 transition-all ${
                      copiedKey === 'text-output'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none text-white'
                    }`}
                  >
                    {copiedKey === 'text-output' ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{isUrdu ? 'کاپی ہوگیا!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{isUrdu ? 'کاپی کریں' : 'Copy'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadText}
                    disabled={!textResult.output || !!textResult.error}
                    aria-label={isUrdu ? 'نتائج ڈاؤن لوڈ کریں' : 'Download output file'}
                    className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-40 rounded"
                    title={isUrdu ? 'ڈاؤن لوڈ کریں' : 'Download file'}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col relative">
                {/* Error Banner */}
                {textResult.error ? (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg flex items-start gap-3 text-rose-700 dark:text-rose-400">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-1">
                        {isUrdu ? 'غلط بیس 64 اسٹرنگ' : 'Invalid Base64 Error'}
                      </h4>
                      <p className="text-xs">{textResult.error}</p>
                      <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-2">
                        {isUrdu
                          ? 'براہ کرم یقینی بنائیں کہ ان پٹ میں صرف درست A-Z، a-z، 0-9، + اور / حروف شامل ہیں۔'
                          : 'Ensure the input string contains only standard Base64 characters and correct padding.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <textarea
                    readOnly
                    value={textResult.output}
                    placeholder={
                      isUrdu
                        ? 'کنورژن کا نتیجہ یہاں ظاہر ہوگا...'
                        : 'Conversion output will appear here...'
                    }
                    rows={12}
                    className="w-full flex-1 p-3 font-mono text-xs sm:text-sm bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none text-slate-800 dark:text-slate-200 resize-y"
                  />
                )}
              </div>

              {/* Output Ratio Footer */}
              <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
                <span>
                  {action === 'encode' && inputCharCount > 0
                    ? `Overhead: ~${Math.round((outputCharCount / (inputCharCount || 1) - 1) * 100)}% (+33% standard Base64 expansion)`
                    : action === 'decode' && outputCharCount > 0
                    ? `Decoded text size: ${textResult.byteLength} bytes`
                    : 'Ready'}
                </span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                  {textResult.output ? `${outputCharCount} characters` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE / FILE MODE */}
      {tabMode === 'image' && (
        <div className="space-y-6">
          {action === 'encode' ? (
            /* IMAGE TO BASE64 ENCODE */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Upload Card (5 cols) */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                    {isUrdu ? 'تصویر یا فائل اپ لوڈ کریں' : 'Upload Image or File'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isUrdu
                      ? 'پی این جی، جے پی جی، ایس وی جی، ویب پی، یا کوئی بھی فائل منتخب کریں۔'
                      : 'Convert any PNG, JPEG, SVG, WebP, GIF or file to Base64 Data URI.'}
                  </p>
                </div>

                {/* Drag and drop zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDropFile}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-950/40'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {isUrdu ? 'فائل منتخب کرنے کے لیے کلک کریں' : 'Click to upload or drag & drop'}
                    </p>
                     <p className="text-[11px] text-slate-400 mt-0.5">
                       PNG, JPG, SVG, WebP, GIF, PDF, etc. (Max 10 MB)
                     </p>
                   </div>
                 </div>

                 {uploadError && (
                   <div role="alert" className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                     <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                     <span>{uploadError}</span>
                   </div>
                 )}

                 {/* Sample quick button */}
                 <div className="flex items-center justify-between pt-2">
                   <span className="text-xs text-slate-500">
                     {isUrdu ? 'فوری ٹیسٹ:' : 'Quick demo:'}
                   </span>
                   <button
                     onClick={() => {
                       setUploadError(null);
                       setUploadedFileInfo({
                         name: 'sample-icon.svg',
                         type: 'image/svg+xml',
                         size: 216,
                         base64: SAMPLE_IMAGE_BASE64,
                       });
                     }}
                     className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                   >
                     <Sparkles className="w-3.5 h-3.5" />
                     <span>{isUrdu ? 'سیمپل ایس وی جی لوگو لوڈ کریں' : 'Load Sample SVG Badge'}</span>
                   </button>
                 </div>

                {/* Selected File Overview & Preview */}
                {uploadedFileInfo && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3">
                    <div className="flex items-center gap-3">
                      {uploadedFileInfo.type.startsWith('image/') ? (
                        <img
                          src={uploadedFileInfo.base64}
                          alt="preview"
                          className="w-12 h-12 rounded object-contain bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
                          {uploadedFileInfo.name.split('.').pop() || 'FILE'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {uploadedFileInfo.name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {(uploadedFileInfo.size / 1024).toFixed(1)} KB ({uploadedFileInfo.type})
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div>
                        Original: {(uploadedFileInfo.size / 1024).toFixed(2)} KB
                      </div>
                      <div>
                        Base64: {(uploadedFileInfo.base64.length / 1024).toFixed(2)} KB (+33%)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Output Formats Card (7 cols) */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {isUrdu ? 'بیس 64 کوڈ کے فارمیٹس' : 'Generated Base64 Code Snippets'}
                </h3>

                {uploadedFileInfo ? (
                  <div className="space-y-4">
                    {/* 1. Complete Data URI */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Data URI (Standard for web & APIs)</span>
                        </label>
                        <button
                          onClick={() => handleCopy(uploadedFileInfo.base64, 'data-uri')}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
                        >
                          {copiedKey === 'data-uri' ? (
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedKey === 'data-uri' ? 'Copied!' : 'Copy Data URI'}</span>
                        </button>
                      </div>
                      <textarea
                        readOnly
                        rows={3}
                        value={uploadedFileInfo.base64}
                        className="w-full p-2.5 font-mono text-[11px] bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-300 resize-none"
                      />
                    </div>

                    {/* 2. HTML <img> Tag */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>HTML &lt;img&gt; Embed Tag</span>
                        </label>
                        <button
                          onClick={() =>
                            handleCopy(
                              `<img src="${uploadedFileInfo.base64}" alt="${uploadedFileInfo.name}" />`,
                              'html-tag'
                            )
                          }
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
                        >
                          {copiedKey === 'html-tag' ? (
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedKey === 'html-tag' ? 'Copied!' : 'Copy HTML Tag'}</span>
                        </button>
                      </div>
                      <textarea
                        readOnly
                        rows={2}
                        value={`<img src="${uploadedFileInfo.base64.slice(0, 80)}..." alt="${uploadedFileInfo.name}" />`}
                        className="w-full p-2.5 font-mono text-[11px] bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-300 resize-none"
                      />
                    </div>

                    {/* 3. CSS Background Image */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>CSS background-image rule</span>
                        </label>
                        <button
                          onClick={() =>
                            handleCopy(
                              `background-image: url("${uploadedFileInfo.base64}");`,
                              'css-rule'
                            )
                          }
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
                        >
                          {copiedKey === 'css-rule' ? (
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedKey === 'css-rule' ? 'Copied!' : 'Copy CSS'}</span>
                        </button>
                      </div>
                      <textarea
                        readOnly
                        rows={2}
                        value={`background-image: url("${uploadedFileInfo.base64.slice(0, 80)}...");`}
                        className="w-full p-2.5 font-mono text-[11px] bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-300 resize-none"
                      />
                    </div>

                    {/* 4. Raw Base64 string without data: header */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>Raw Base64 (Without MIME prefix)</span>
                        </label>
                        <button
                          onClick={() => {
                            const raw = uploadedFileInfo.base64.split(',')[1] || '';
                            handleCopy(raw, 'raw-b64');
                          }}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
                        >
                          {copiedKey === 'raw-b64' ? (
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedKey === 'raw-b64' ? 'Copied!' : 'Copy Raw'}</span>
                        </button>
                      </div>
                      <textarea
                        readOnly
                        rows={2}
                        value={uploadedFileInfo.base64.split(',')[1] || ''}
                        className="w-full p-2.5 font-mono text-[11px] bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-300 resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">
                      {isUrdu
                        ? 'کوئی فائل منتخب کریں۔ بیس 64 کوڈ یہاں خود بخود تیار ہو جائے گا۔'
                        : 'Upload an image or file on the left to generate its Base64 Data URI.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* BASE64 TO IMAGE DECODE */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Input Base64 string */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      {isUrdu ? 'بیس 64 تصویر اسٹرنگ درج کریں' : 'Paste Base64 Image String'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isUrdu
                        ? 'ڈیٹا یو آر آئی یا خام بیس 64 پیسٹ کریں'
                        : 'Paste Data URI or raw Base64 bytes string'}
                    </p>
                  </div>

                  <button
                    onClick={() => setImageInputBase64(SAMPLE_IMAGE_BASE64)}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isUrdu ? 'نمونہ لوڈ کریں' : 'Load Sample'}</span>
                  </button>
                </div>

                <textarea
                  value={imageInputBase64}
                  onChange={(e) => setImageInputBase64(e.target.value)}
                  placeholder="Paste data:image/png;base64,iVBORw0KGgo... or raw Base64 string here..."
                  rows={14}
                  className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200 resize-y"
                  spellCheck={false}
                />

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">
                    {imageInputBase64.length} chars
                  </span>
                  <button
                    onClick={() => setImageInputBase64('')}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    {isUrdu ? 'صاف کریں' : 'Clear'}
                  </button>
                </div>
              </div>

              {/* Decoded Image Output Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-500" />
                    <span>{isUrdu ? 'تصویر کا پیش نظارہ' : 'Decoded Image Preview'}</span>
                  </h3>

                  {decodedImageDetails.isValid && (
                    <button
                      onClick={handleDownloadImage}
                      className="px-3 py-1.5 text-xs font-semibold rounded bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isUrdu ? 'تصویر ڈاؤن لوڈ کریں' : 'Download Image'}</span>
                    </button>
                  )}
                </div>

                {decodedImageDetails.error ? (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg flex items-start gap-3 text-rose-700 dark:text-rose-400">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider mb-1">
                        {isUrdu ? 'غلط فارمیٹ' : 'Invalid Image Data'}
                      </h4>
                      <p className="text-xs">{decodedImageDetails.error}</p>
                    </div>
                  </div>
                ) : decodedImageDetails.isValid ? (
                  <div className="space-y-4">
                    {/* Rendered Preview Canvas */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6 bg-slate-100 dark:bg-slate-950 flex items-center justify-center min-h-[260px] max-h-[380px] overflow-auto">
                      <img
                        src={decodedImageDetails.src}
                        alt="Decoded Preview"
                        className="max-h-[320px] max-w-full object-contain rounded shadow-sm bg-white dark:bg-slate-900"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Metadata Specs */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Detected MIME:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                          {decodedImageDetails.mimeType}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Estimated Size:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                          {(decodedImageDetails.sizeApprox / 1024).toFixed(2)} KB
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">
                      {isUrdu
                        ? 'پیش نظارہ دیکھنے کے لیے بائیں جانب درست بیس 64 اسٹرنگ درج کریں۔'
                        : 'Paste a valid Base64 image string on the left to render the decoded preview.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Educational & Guide Section */}
      <div className="mt-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
          {isUrdu ? 'بیس 64 انکوڈنگ کے بارے میں مفید معلومات' : 'About Base64 Encoding & Best Practices'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              {isUrdu ? 'بیس 64 کیا ہے؟' : 'What is Base64?'}
            </h4>
            <p>
              {isUrdu
                ? 'بیس 64 بائنری ڈیٹا کو 64 پرنٹ ایبل ASCII حروف کے ذریعے ظاہر کرتا ہے۔ یہ ای میلز، ڈیٹا یو آر آئی اور ویب ٹوکنز میں محفوظ منتقلی کے لیے استعمال ہوتا ہے۔'
                : 'Base64 is a binary-to-text encoding scheme that represents binary data in an ASCII string format using 64 safe printable characters: A-Z, a-z, 0-9, +, and /.'}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              {isUrdu ? 'سائز کا فرق (+33%)' : 'The 33% Size Overhead'}
            </h4>
            <p>
              {isUrdu
                ? 'ہر 3 بائٹس کے بائنری ڈیٹا کو 4 حروف میں تبدیل کیا جاتا ہے، جس سے ڈیٹا کا حجم تقریباً 33 فیصد بڑھ جاتا ہے۔ چھوٹے آئیکنز کے لیے موزوں ہے، بڑی ویڈیوز کے لیے نہیں۔'
                : 'Because every 3 bytes (24 bits) are divided into four 6-bit chunks, Base64 strings are approximately 33% larger than the original raw binary file.'}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              {isUrdu ? 'URL-Safe بیس 64 کیا ہے؟' : 'What is URL-Safe Base64?'}
            </h4>
            <p>
              {isUrdu
                ? 'یو آر ایل میں + اور / علامات کی بجائے - اور _ استعمال ہوتے ہیں اور برابری کا نشان (=) ہٹا دیا جاتا ہے تاکہ ویب ایڈریس اور ٹوکنز محفوظ رہیں۔'
                : 'Standard Base64 contains `+` and `/`, which have special meaning in URLs. URL-Safe Base64 replaces them with `-` and `_`, and typically omits padding `=`.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
