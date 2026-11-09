import React, { useEffect } from 'react';
import { ToolDefinition } from '../../types';
import { TOOLS_LIST } from '../../data/tools';
import { TOOL_ROUTES, ToolRouteConfig } from '../../data/toolsRouting';
import { TOOL_SEO_GUIDES } from '../../data/toolSeoGuides';
import { useLanguage } from '../../context/LanguageContext';
import { useFavorites } from '../../context/FavoritesContext';
import {
  Home,
  ArrowLeft,
  ArrowRight,
  Star,
  ShieldCheck,
  Zap,
  Info,
  ChevronRight,
  Share2,
  Check,
  Sparkles,
  X,
  Link as LinkIcon,
  Copy,
  FileDown,
  Loader2,
  BookOpen,
  Minimize2,
  RotateCcw,
} from 'lucide-react';
import { ShareModal } from './Modals/ShareModal';
import { ResetToolModal } from './Modals/ResetToolModal';
import { ToolRatingCard } from './ToolRatingCard';
import { getToolRating, subscribeToToolRating } from '../../utils/toolRatingStorage';
import { SocialShareBar } from './SocialShareBar';
import { ThemeToggleSwitch } from './ThemeToggleSwitch';
import { ExportDataDropdown } from './ExportDataDropdown';
import { ExportExecutionResult } from '../../utils/toolDataExporter';
import { extractToolResultText, copyTextToClipboard } from '../../utils/toolResultExtractor';
import { useToast } from '../../context/ToastContext';
import { useToolCalculationToast } from '../../utils/calculationToastNotifier';
import { Print } from '../common/Print';

interface ToolPageLayoutProps {
  tool: ToolDefinition;
  routeConfig: ToolRouteConfig;
  onNavigateTo: (path: string) => void;
  children: React.ReactNode;
  isReaderMode?: boolean;
  onToggleReaderMode?: () => void;
}

export const ToolPageLayout: React.FC<ToolPageLayoutProps> = ({
  tool,
  routeConfig,
  onNavigateTo,
  children,
  isReaderMode: isReaderModeProp,
  onToggleReaderMode: onToggleReaderModeProp,
}) => {
  const { language, dir } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isUrdu = language === 'ur';
  const favorited = isFavorite(tool.id);
  const [internalReaderMode, setInternalReaderMode] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem('freetools_hub_reader_mode') === 'true';
    } catch {
      return false;
    }
  });

  const isReaderMode = isReaderModeProp !== undefined ? isReaderModeProp : internalReaderMode;

  const [copiedLink, setCopiedLink] = React.useState(false);
  const [isCopiedResult, setIsCopiedResult] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const [resetKey, setResetKey] = React.useState(0);
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);
  const [pdfProgressText, setPdfProgressText] = React.useState('');
  const [currentRating, setCurrentRating] = React.useState(() => getToolRating(tool.id));
  const [toastData, setToastData] = React.useState<{ title: string; subtitle: string; isSuccess: boolean }>({
    title: '',
    subtitle: '',
    isSuccess: true,
  });
  const toastTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const copyResultTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Trigger confirmation toast whenever a calculation or result is generated in the active tool
  useToolCalculationToast({
    tool,
    isUrdu,
    resetKey,
    isResetting,
  });

  const handleToggleReaderMode = () => {
    const next = !isReaderMode;
    if (onToggleReaderModeProp) {
      onToggleReaderModeProp();
    } else {
      setInternalReaderMode(next);
      try {
        localStorage.setItem('freetools_hub_reader_mode', String(next));
      } catch {}
    }

    triggerToast(
      next
        ? (isUrdu ? 'ریڈر موڈ فعال ہو گیا!' : 'Reader Mode Activated!')
        : (isUrdu ? 'ریڈر موڈ بند ہو گیا' : 'Reader Mode Exited'),
      next
        ? (isUrdu ? 'نیویگیشن اور سائیڈبار چھپا دی گئی ہے۔ واپس آنے کے لیے Esc دبائیں۔' : 'Navigation and sidebar collapsed for distraction-free tool usage. Press Esc to exit.')
        : (isUrdu ? 'معیاری لے آؤٹ اور نیویگیشن بحال کر دی گئی ہے۔' : 'Standard layout and navigation restored.'),
      true
    );
  };

  // Sync tool community rating
  useEffect(() => {
    setCurrentRating(getToolRating(tool.id));
    const unsubscribe = subscribeToToolRating(tool.id, (data) => setCurrentRating(data));
    return () => unsubscribe();
  }, [tool.id]);

  // Clean up toast and copy timers on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      if (copyResultTimeoutRef.current) {
        clearTimeout(copyResultTimeoutRef.current);
      }
    };
  }, []);

  const triggerToast = (title: string, subtitle: string, isSuccess = true) => {
    setToastData({ title, subtitle, isSuccess });
    setShowToast(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
      setCopiedLink(false);
    }, 3500);
  };

  // Route-level SEO metadata (title, description, canonical, OpenGraph, JSON-LD) is managed centrally in App.tsx via applyRouteSeo.

  const handleShare = async () => {
    const url = window.location.href;
    let copied = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        copied = true;
      }
    } catch {
      // Fallback below
    }

    if (!copied) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copied = document.execCommand('copy');
        textArea.remove();
      } catch (err) {
        console.warn('Clipboard copy fallback error:', err);
      }
    }

    setCopiedLink(true);
    triggerToast(
      isUrdu ? 'لنک کلپ بورڈ پر کاپی ہوگیا!' : 'Link copied to clipboard!',
      url,
      true
    );
  };

  // Web Share API native share handler (navigator.share)
  const handleWebShare = async () => {
    const shareTitle = isUrdu
      ? `${tool.nameUrdu} - فری ٹولز ہب`
      : `${tool.name} – FreeTools Hub`;
    const shareText = isUrdu
      ? tool.shortDescriptionUrdu
      : tool.shortDescription;
    const shareUrl = window.location.href;

    // Trigger Web Share API if supported by the browser
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        const shareData: ShareData = {
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        };

        if (!navigator.canShare || navigator.canShare(shareData)) {
          await navigator.share(shareData);
          triggerToast(
            isUrdu ? 'کامیابی سے شیئر کیا گیا!' : 'Shared successfully!',
            shareUrl,
            true
          );
          return;
        }
      } catch (err: unknown) {
        // User cancelled or dismissed the native share dialog
        if ((err as Error)?.name === 'AbortError') {
          return;
        }
        console.warn('Native Web Share API error or cancelled:', err);
      }
    }

    // Graceful fallback for browsers without navigator.share
    await handleShare();
    setIsShareModalOpen(true);
  };

  // Capture tool output area and download as multi-page A4 PDF
  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;

    try {
      setIsDownloadingPdf(true);
      setPdfProgressText(isUrdu ? 'پی ڈی ایف تیار ہو رہا ہے...' : 'Generating PDF...');

      const { exportToolContentToPdf } = await import('../../utils/toolPdfExporter');
      const result = await exportToolContentToPdf({
        elementOrId: 'tool-workspace-content',
        tool,
        isUrdu,
        documentTitle: isUrdu ? `${tool.nameUrdu} دستاویز` : `${tool.name} Output`,
        onProgress: (status) => setPdfProgressText(status),
      });

      triggerToast(
        isUrdu ? 'پی ڈی ایف کامیابی سے ڈاؤن لوڈ ہوگئی!' : 'PDF Downloaded Successfully!',
        result.filename,
        true
      );
    } catch (err) {
      console.error('PDF generation error:', err);
      triggerToast(
        isUrdu ? 'پی ڈی ایف بنانے میں مسئلہ پیش آیا' : 'PDF Generation Failed',
        isUrdu ? 'براہ کرم دوبارہ کوشش کریں۔' : 'Please check your browser permissions and try again.',
        false
      );
    } finally {
      setIsDownloadingPdf(false);
      setPdfProgressText('');
    }
  };

  // Handle Export Data (JSON / CSV) Result Feedback
  const handleExportDataComplete = (result: ExportExecutionResult, format: 'json' | 'csv') => {
    const formatLabel = format.toUpperCase();
    if (result.success) {
      triggerToast(
        isUrdu
          ? `ڈیٹا کامیابی سے بطور ${formatLabel} ڈاؤن لوڈ ہو گیا!`
          : `Data Exported as ${formatLabel}!`,
        result.filename || (isUrdu ? 'فائل آپ کے آلے میں محفوظ ہوگئی' : 'File downloaded to your device'),
        true
      );
    } else if (result.reason === 'NO_DATA') {
      triggerToast(
        isUrdu ? 'کوئی ان پٹ ڈیٹا نہیں ملا' : 'No Input Data Found to Export',
        isUrdu
          ? 'ایکسپورٹ کرنے سے پہلے براہ کرم اس ٹول میں کچھ معلومات یا ان پٹس درج کریں۔'
          : 'Please enter or change some fields in this tool before exporting.',
        false
      );
    } else {
      triggerToast(
        isUrdu ? 'ڈیٹا محفوظ کرنے میں خرابی پیش آئی' : 'Export Failed',
        result.errorMessage || (isUrdu ? 'براہ کرم دوبارہ کوشش کریں۔' : 'Please check your permissions and try again.'),
        false
      );
    }
  };

  // Handle copying tool results/output area text with visual feedback
  const handleCopyResult = async () => {
    const extracted = extractToolResultText(tool.id, tool.name);
    if (!extracted || !extracted.text || extracted.text.trim() === '') {
      triggerToast(
        isUrdu ? 'کاپی کرنے کے لیے کوئی نتائج نہیں ملے' : 'No Results to Copy',
        isUrdu
          ? 'کاپی کرنے سے پہلے براہ کرم ٹول میں معلومات درج کر کے نتائج حاصل کریں۔'
          : 'Please enter inputs or generate an output in this tool before copying.',
        false
      );
      toast.warning(
        isUrdu ? 'کوئی نتائج نہیں ملے' : 'No Results to Copy',
        isUrdu ? 'پہلے ٹول میں معلومات درج کریں۔' : 'Please configure inputs or generate an output first.'
      );
      return;
    }

    const success = await copyTextToClipboard(extracted.text);
    if (success) {
      setIsCopiedResult(true);
      if (copyResultTimeoutRef.current) {
        clearTimeout(copyResultTimeoutRef.current);
      }
      copyResultTimeoutRef.current = setTimeout(() => {
        setIsCopiedResult(false);
      }, 2500);

      triggerToast(
        isUrdu ? 'نتائج کلپ بورڈ پر کاپی ہو گئے!' : 'Results Copied to Clipboard!',
        extracted.summary || (isUrdu ? `${extracted.charCount} حروف کاپی ہوئے` : `${extracted.charCount} characters copied`),
        true
      );
      toast.success(
        isUrdu ? 'نتائج کلپ بورڈ پر کاپی ہو گئے!' : 'Results Copied to Clipboard!',
        extracted.summary
      );
    } else {
      triggerToast(
        isUrdu ? 'کاپی کرنے میں مسئلہ پیش آیا' : 'Failed to Copy',
        isUrdu ? 'براہ کرم دوبارہ کوشش کریں۔' : 'Please check your clipboard permissions and try again.',
        false
      );
    }
  };

  // Handle Resetting all user inputs and restarting task for the active tool
  const handleConfirmReset = async () => {
    setIsResetting(true);

    try {
      // 1. Wipe tool-specific localStorage drafts and timestamps cleanly before remounting
      const backupAndRemoveKey = (key: string) => {
        try {
          const current = localStorage.getItem(key);
          if (current !== null) {
            localStorage.setItem(`${key}_backup`, current);
          }
          localStorage.removeItem(key);
          localStorage.removeItem(`${key}_timestamp`);
        } catch {}
      };

      if (tool.id === 'resume-builder' || tool.id === 'cv-maker') {
        backupAndRemoveKey('freetools_resume_saved');
        localStorage.removeItem('freetools_resume_draft');
      } else if (tool.id === 'gemini-photo-prompt' || tool.id === 'photo-prompts') {
        backupAndRemoveKey('ft_photo_prompt_inputs');
        backupAndRemoveKey('ft_photo_prompt_text');
      } else if (tool.id === 'ai-video-prompt' || tool.id === 'video-prompts') {
        backupAndRemoveKey('ft_video_prompt_inputs');
        backupAndRemoveKey('ft_video_prompt_output');
      } else if (tool.id === 'json-formatter') {
        backupAndRemoveKey('ft_json_formatter_draft');
      } else if (tool.id === 'markdown-editor') {
        backupAndRemoveKey('ft_markdown_draft');
      } else if (tool.id === 'word-counter') {
        backupAndRemoveKey('ft_wordcounter_text');
      } else if (tool.id === 'uae-salary-calculator') {
        localStorage.removeItem('ft_uae-salary-calculator_inputs');
      }

      // Clear any remaining keys matching the current tool prefix (excluding _backup)
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (
            k &&
            !k.endsWith('_backup') &&
            (k.startsWith(`ft_${tool.id}`) || k.startsWith(`freetools_${tool.id}`))
          ) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {}

      // 2. Dispatch custom reset event for tools listening internally
      window.dispatchEvent(
        new CustomEvent('freetools-reset-active-tool', {
          detail: { toolId: tool.id },
        })
      );

      // 3. Force remount of the tool component to restore pristine default state
      setResetKey((prev) => prev + 1);

      // Brief animation buffer
      await new Promise((resolve) => setTimeout(resolve, 180));

      setIsResetModalOpen(false);

      triggerToast(
        isUrdu ? 'تمام خانے ری سیٹ ہو گئے!' : 'Tool Inputs Reset!',
        isUrdu
          ? `${toolTitle} کے تمام فیلڈز اور ڈرافٹس بنیادی حالت میں بحال کر دیے گئے۔`
          : `All fields, active drafts, and calculations for ${toolTitle} restored to defaults.`,
        true
      );

      toast.success(
        isUrdu ? 'تمام خانے ری سیٹ ہو گئے' : 'Tool Inputs Reset',
        isUrdu
          ? `${toolTitle} کو کامیابی سے دوبارہ شروع کر دیا گیا۔`
          : `${toolTitle} has been reset to defaults.`
      );
    } catch (err) {
      console.error('[ToolPageLayout] Reset error:', err);
      setIsResetModalOpen(false);
    } finally {
      setIsResetting(false);
    }
  };

  const toolTitle = isUrdu ? tool.nameUrdu : tool.name;
  const categoryTitle = isUrdu ? routeConfig.categoryGroupLabelUrdu : routeConfig.categoryGroupLabel;

  return (
    <div className={`w-full max-w-full min-w-0 min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col ${isReaderMode ? 'reader-mode-active' : ''}`}>
      {/* 1. Header Bar: Reader Mode Focused Bar vs Normal Breadcrumb Navigation Bar */}
      {isReaderMode ? (
        <header className="sticky top-0 z-40 w-full max-w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-indigo-200/80 dark:border-indigo-900/80 py-2.5 px-3 sm:px-6 lg:px-8 shadow-xs animate-in fade-in slide-in-from-top-2 duration-150 no-print">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 min-w-0">
            {/* Left: Tool Name + Reader Mode Focus Badge */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  {toolTitle}
                </span>
                <span className="hidden sm:inline text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                  · {isUrdu ? 'ریڈر موڈ فعال' : 'Reader Mode'}
                </span>
              </div>
            </div>

            {/* Right: Quick Controls & Exit Reader Mode Button */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Theme Toggle Switch inside Reader Mode */}
              <ThemeToggleSwitch size="sm" />

              {/* User Rating Chip in Reader Mode */}
              <div
                title={
                  currentRating.userRating !== null
                    ? isUrdu
                      ? `آپ کی محفوظ کردہ ریٹنگ: ${currentRating.userRating}/5 ستارے`
                      : `Your saved rating on this browser: ${currentRating.userRating}/5 stars`
                    : isUrdu
                    ? 'ابھی تک آپ نے اس ٹول کو ریٹ نہیں کیا'
                    : 'Not rated on this browser yet'
                }
                className="hidden md:inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-amber-200/80 dark:border-amber-800/70 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs font-bold shadow-2xs select-none"
              >
                <Star
                  className={`w-3.5 h-3.5 shrink-0 ${
                    currentRating.userRating !== null
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-amber-500 dark:text-amber-400'
                  }`}
                />
                <span>
                  {currentRating.userRating !== null
                    ? `${currentRating.userRating}/5`
                    : isUrdu
                    ? 'ریٹ کریں'
                    : 'Rate'}
                </span>
              </div>

              {/* Web Share API button in Reader Mode */}
              <button
                type="button"
                onClick={handleWebShare}
                title={isUrdu ? 'اس ٹول کو شیئر کریں (Web Share API)' : 'Share this tool with others (Web Share API)'}
                aria-label={isUrdu ? 'ٹول شیئر کریں' : 'Share Tool'}
                className="hidden xs:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold cursor-pointer shadow-2xs group"
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>{isUrdu ? 'شیئر' : 'Share'}</span>
              </button>

              {/* Download PDF button */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                title={isUrdu ? 'پی ڈی ایف ڈاؤن لوڈ کریں' : 'Download tool content as A4 PDF document'}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold cursor-pointer shadow-2xs"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                ) : (
                  <FileDown className="w-3.5 h-3.5 text-indigo-500" />
                )}
                <span>{isUrdu ? 'پی ڈی ایف' : 'PDF'}</span>
              </button>

              {/* Export Input Data Dropdown (JSON/CSV) */}
              <ExportDataDropdown
                tool={tool}
                variant="reader"
                onExportComplete={handleExportDataComplete}
              />

              {/* Copy Tool Results to Clipboard Button in Reader Mode */}
              <button
                type="button"
                onClick={handleCopyResult}
                title={
                  isUrdu
                    ? 'ٹول کے نتائج یا رپورٹ کلپ بورڈ پر کاپی کریں'
                    : 'Copy tool calculation or generated results to clipboard'
                }
                aria-label={isUrdu ? 'نتائج کاپی کریں' : 'Copy Results to Clipboard'}
                className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer shadow-2xs transition-all ${
                  isCopiedResult
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                {isCopiedResult ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-75 duration-150" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                )}
                <span>
                  {isCopiedResult
                    ? (isUrdu ? 'کاپی ہو گیا!' : 'Copied!')
                    : (isUrdu ? 'کاپی' : 'Copy Result')}
                </span>
              </button>

              {/* Reset Tool Inputs Button in Reader Mode */}
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                title={
                  isUrdu
                    ? 'اس ٹول کے تمام ان پٹس دوبارہ ترتیب دیں'
                    : 'Reset all inputs and restart task for this tool'
                }
                aria-label={isUrdu ? 'ان پٹس ری سیٹ کریں' : 'Reset Tool Inputs'}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold cursor-pointer shadow-2xs group transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500 group-hover:-rotate-45 transition-transform" />
                <span>{isUrdu ? 'ری سیٹ' : 'Reset'}</span>
              </button>

              {/* Print Tool Output Button in Reader Mode */}
              <Print
                targetId="tool-workspace-content"
                toolId={tool.id}
                toolName={toolTitle}
                documentTitle={`${toolTitle} – FreeTools Hub`}
                variant="toolbar"
                className="hidden sm:inline-flex px-2.5"
              />

              {/* Exit Reader Mode Button */}
              <button
                type="button"
                onClick={handleToggleReaderMode}
                title={isUrdu ? 'ریڈر موڈ سے باہر نکلیں (Esc)' : 'Exit Reader Mode and restore navigation (Esc)'}
                aria-label={isUrdu ? 'ریڈر موڈ سے باہر نکلیں' : 'Exit Reader Mode'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer group"
              >
                <Minimize2 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                <span>{isUrdu ? 'باہر نکلیں' : 'Exit Focus'}</span>
                <kbd className="hidden md:inline-block px-1.5 py-0.2 rounded bg-indigo-700/80 text-[10px] font-mono font-semibold text-indigo-100 border border-indigo-500/40">
                  Esc
                </kbd>
              </button>
            </div>
          </div>
        </header>
      ) : (
        /* Breadcrumb Navigation Bar */
        <div className="w-full max-w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3 px-4 sm:px-6 lg:px-8 no-print">
          <div className="max-w-7xl mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 min-w-0">
            {/* Breadcrumb Trail */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto scrollbar-none py-0.5 min-w-0 max-w-full">
              <a
                href="/"
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onNavigateTo('/');
                  }
                }}
                className="hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-1 font-medium transition-colors shrink-0"
              >
                <Home className="w-3.5 h-3.5" />
                <span>{isUrdu ? 'ہوم' : 'Home'}</span>
              </a>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700 shrink-0">/</span>
              <a
                href="/tools"
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onNavigateTo('/tools');
                  }
                }}
                className="hover:text-blue-700 dark:hover:text-blue-400 font-medium transition-colors shrink-0"
              >
                {isUrdu ? 'تمام ٹولز' : 'All Tools'}
              </a>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700 shrink-0">/</span>
              <a
                href={`/tools?category=${routeConfig.categoryGroup}`}
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onNavigateTo(`/tools?category=${routeConfig.categoryGroup}`);
                  }
                }}
                className="text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 font-medium transition-colors truncate max-w-[120px] sm:max-w-[200px]"
              >
                {categoryTitle}
              </a>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700 shrink-0">/</span>
              <span aria-current="page" className="font-bold text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-[240px]">
                {toolTitle}
              </span>
            </nav>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
              <a
                href="/tools"
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onNavigateTo('/tools');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors shadow-2xs"
              >
                {dir === 'rtl' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                <span>{isUrdu ? 'تمام ٹولز دیکھیں' : 'All Tools'}</span>
              </a>

              {/* Local 5-Star Rating Badge Chip */}
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('tool-rating-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                title={
                  currentRating.userRating !== null
                    ? isUrdu
                      ? `آپ کی ریٹنگ: ${currentRating.userRating}/5 ستارے - تبدیل کرنے کے لیے کلک کریں`
                      : `Your saved rating: ${currentRating.userRating}/5 stars - Click to update`
                    : isUrdu
                    ? 'اس ٹول کو ۵ ستاروں میں سے ریٹ کرنے کے لیے کلک کریں'
                    : 'Rate this tool on your browser (1 to 5 stars)'
                }
                aria-label={isUrdu ? 'ٹول کو ریٹ کریں' : 'Rate this tool'}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-200/80 dark:border-amber-800/70 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <Star
                  className={`w-3.5 h-3.5 shrink-0 ${
                    currentRating.userRating !== null
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-amber-500 dark:text-amber-400'
                  }`}
                />
                <span>
                  {currentRating.userRating !== null
                    ? `${currentRating.userRating}/5`
                    : isUrdu
                    ? 'ریٹ کریں'
                    : 'Rate'}
                </span>
              </button>

              {/* Favorite Star Button */}
              <button
                type="button"
                onClick={() => toggleFavorite(tool.id)}
                title={favorited ? 'Remove from favorites' : 'Add to favorites'}
                aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
                className={`min-w-[36px] min-h-[36px] inline-flex items-center justify-center p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  favorited
                    ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-amber-500'
                }`}
              >
                <Star className={`w-4 h-4 ${favorited ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>

              {/* Reader Mode (Distraction-Free Focus) Toggle */}
              <button
                type="button"
                onClick={handleToggleReaderMode}
                role="switch"
                aria-checked={false}
                title={
                  isUrdu
                    ? 'ریڈر موڈ: خلفشار سے پاک فوکس موڈ (Alt + R)'
                    : 'Reader Mode: Distraction-free, focused UI for active tool usage [Alt+R]'
                }
                aria-label={isUrdu ? 'ریڈر موڈ ٹوگل کریں' : 'Toggle Reader Mode'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold transition-all cursor-pointer shadow-2xs group"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>{isUrdu ? 'ریڈر موڈ' : 'Reader Mode'}</span>
              </button>

              {/* Download Tool Output as PDF Button */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                title={isUrdu ? 'اس ٹول کے مواد کو پی ڈی ایف کے طور پر ڈاؤن لوڈ کریں' : 'Download current tool content as A4 PDF document'}
                aria-label={isUrdu ? 'پی ڈی ایف ڈاؤن لوڈ کریں' : 'Download as PDF'}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                  isDownloadingPdf
                    ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 cursor-wait'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                {isDownloadingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold">{pdfProgressText || (isUrdu ? 'تیار ہو رہا ہے...' : 'Generating...')}</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    <span className="hidden xs:inline">{isUrdu ? 'پی ڈی ایف' : 'PDF'}</span>
                  </>
                )}
              </button>

              {/* Export Input Data Dropdown (JSON/CSV) */}
              <ExportDataDropdown
                tool={tool}
                variant="header"
                onExportComplete={handleExportDataComplete}
              />

              {/* Copy Tool Results to Clipboard Button */}
              <button
                type="button"
                onClick={handleCopyResult}
                title={
                  isUrdu
                    ? 'ٹول کے نتائج یا رپورٹ کلپ بورڈ پر کاپی کریں'
                    : 'Copy tool calculation or generated results to clipboard'
                }
                aria-label={isUrdu ? 'نتائج کاپی کریں' : 'Copy Results to Clipboard'}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-2xs group ${
                  isCopiedResult
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                {isCopiedResult ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-75 duration-150" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                )}
                <span className="hidden xs:inline">
                  {isCopiedResult
                    ? (isUrdu ? 'کاپی ہو گیا!' : 'Copied!')
                    : (isUrdu ? 'نتائج کاپی کریں' : 'Copy Results')}
                </span>
                <span className="xs:hidden">
                  {isCopiedResult ? (isUrdu ? 'کاپی' : 'Copied') : (isUrdu ? 'کاپی' : 'Copy')}
                </span>
              </button>

              {/* Reset Tool Inputs Button */}
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                title={
                  isUrdu
                    ? 'اس ٹول کے تمام ان پٹس دوبارہ ترتیب دیں'
                    : 'Reset all inputs and restart task for this tool'
                }
                aria-label={isUrdu ? 'ان پٹس ری سیٹ کریں' : 'Reset Tool Inputs'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold transition-all cursor-pointer shadow-2xs group"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500 group-hover:-rotate-45 transition-transform" />
                <span className="hidden xs:inline">{isUrdu ? 'ری سیٹ' : 'Reset'}</span>
                <span className="xs:hidden">{isUrdu ? 'ری سیٹ' : 'Reset'}</span>
              </button>

              {/* Print Tool Output Button */}
              <Print
                targetId="tool-workspace-content"
                toolId={tool.id}
                toolName={toolTitle}
                documentTitle={`${toolTitle} – FreeTools Hub`}
                variant="toolbar"
              />

              {/* Web Share API Native Share Button */}
              <button
                type="button"
                onClick={handleWebShare}
                title={
                  isUrdu
                    ? 'اس ٹول کو شیئر کریں (Web Share API)'
                    : 'Share this tool with others (Web Share API)'
                }
                aria-label={isUrdu ? 'ٹول شیئر کریں' : 'Share Tool'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold transition-all cursor-pointer shadow-2xs group"
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>{isUrdu ? 'شیئر' : 'Share'}</span>
              </button>

              {/* Social Share Dropdown: Copy Link, WhatsApp, Twitter / X, LinkedIn, More */}
              <SocialShareBar
                tool={tool}
                routeConfig={routeConfig}
                variant="dropdown"
                onCopySuccess={(url) => {
                  setCopiedLink(true);
                  triggerToast(
                    isUrdu ? 'لنک کلپ بورڈ پر کاپی ہوگیا!' : 'Link copied to clipboard!',
                    url,
                    true
                  );
                }}
                onOpenFullModal={() => setIsShareModalOpen(true)}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Dedicated Tool Workspace */}
      <div id="tool-workspace-content" className={`flex-1 w-full max-w-full min-w-0 ${isReaderMode ? 'py-4 sm:py-6' : ''}`}>
        {/* Printable Official Report Header (Only visible on paper / PDF print) */}
        <div className="hidden print:flex flex-col gap-1 pb-3 mb-6 border-b-2 border-slate-800 text-slate-900 tool-print-header">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-extrabold tracking-tight text-slate-900">
                {toolTitle}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                {isUrdu ? tool.shortDescriptionUrdu : tool.shortDescription}
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-500 font-mono">
              <div className="font-bold text-slate-800">FreeTools Hub</div>
              <div>{new Date().toLocaleDateString(isUrdu ? 'ur-PK' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
            </div>
          </div>
        </div>

        <div key={resetKey} className="w-full max-w-full min-w-0">
          {children}
        </div>

        {/* Printable Official Report Footer (Only visible on paper / PDF print) */}
        <div className="hidden print:flex items-center justify-between pt-3 mt-8 border-t border-slate-300 text-[10px] text-slate-500 font-mono tool-print-footer">
          <span>FreeTools Hub • {toolTitle}</span>
          <span>{isUrdu ? '۱۰۰٪ محفوظ اور نجی طور پر براؤزر میں تیار کردہ رپورٹ' : '100% Client-Side Private Tool Report'}</span>
        </div>
      </div>

      {/* 2b. Prominent Social Sharing Bar (Collapsed in Reader Mode) */}
      {!isReaderMode && (
        <section id="social-share-section" className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 no-print">
          <div className="bg-gradient-to-r from-indigo-50/70 via-white to-sky-50/70 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isUrdu ? 'اس ٹول کو دوستوں اور ساتھیوں کے ساتھ شیئر کریں' : 'Share this free tool with friends & colleagues'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isUrdu
                    ? 'واٹس ایپ یا ٹوئٹر (X) پر ایک کلک میں شیئر کریں یا صفحے کا لنک کاپی کریں۔'
                    : 'Quick 1-click sharing to WhatsApp, X (Twitter), or copy direct page link.'}
                </p>
              </div>
            </div>

            <SocialShareBar
              tool={tool}
              routeConfig={routeConfig}
              variant="inline"
              onCopySuccess={(url) => {
                setCopiedLink(true);
                triggerToast(
                  isUrdu ? 'لنک کلپ بورڈ پر کاپی ہوگیا!' : 'Link copied to clipboard!',
                  url,
                  true
                );
              }}
              onOpenFullModal={() => setIsShareModalOpen(true)}
            />
          </div>
        </section>
      )}

      {/* 3. Interactive 5-Star Community Rating & Feedback Section (Collapsed in Reader Mode) */}
      {!isReaderMode && (
        <section id="tool-rating-section" className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 no-print">
          <ToolRatingCard
            tool={tool}
            onRatingSubmitted={(newRating) => {
              triggerToast(
                isUrdu ? 'ریٹنگ محفوظ ہو گئی!' : 'Rating Submitted!',
                isUrdu
                  ? `آپ نے ۵ میں سے ${newRating} ستارے دیے۔ شکریہ!`
                  : `Thank you! You rated this tool ${newRating}/5 stars.`,
                true
              );
            }}
          />
        </section>
      )}

      {/* 4. Helpful Usage Instructions & Pro Tips Section (Collapsed in Reader Mode) */}
      {!isReaderMode && (
        <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-6 no-print">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isUrdu ? `${toolTitle} کے استعمال کی گائیڈ اور تجاویز` : `How to Use ${toolTitle} — Documentation & Tips`}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isUrdu ? 'طریقہ کار، مطلوبہ معلومات، نتائج اور اہم مفروضے' : 'Complete overview, required inputs, expected output, and calculation assumptions'}
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold self-start sm:self-auto">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{tool.id === 'seo-page-analyzer' ? 'Read-Only Public HTML Fetch' : '100% Client-Side Private'}</span>
              </div>
            </div>

            {/* Structured Tool Documentation & Assumptions (SEO + User Help) */}
            {TOOL_SEO_GUIDES[tool.id] && (
              <div className="space-y-5" dir="ltr">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      What This Tool Does
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {TOOL_SEO_GUIDES[tool.id].whatItDoes}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Who Can Use It
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {TOOL_SEO_GUIDES[tool.id].whoCanUseIt}
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Step-by-Step Instructions
                  </h3>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {TOOL_SEO_GUIDES[tool.id].howToUse.map((step, stepIdx) => (
                      <li key={stepIdx}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Required Inputs & Validation
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {TOOL_SEO_GUIDES[tool.id].requiredInputs}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Expected Results & Exports
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {TOOL_SEO_GUIDES[tool.id].expectedResults}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/25 border border-amber-200/80 dark:border-amber-900/50 space-y-1.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    Important Limitations & Assumptions
                  </h3>
                  <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                    {TOOL_SEO_GUIDES[tool.id].limitationsAndAssumptions}
                  </p>
                </div>
              </div>
            )}

            {/* Quick Pro Tips Grid */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {isUrdu ? 'ماہرانہ تجاویز' : 'Quick Practical Tips'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {routeConfig.tips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                      <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-mono">
                        {idx + 1}
                      </span>
                      <span>{tip.title}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6.5">
                      {tip.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Tools in Category (Crawlable Internal Links) */}
            {(() => {
              const sameCategoryRoutes = Object.values(TOOL_ROUTES).filter(
                (r) => r.categoryGroup === routeConfig.categoryGroup && r.id !== tool.id
              );
              const fallbackRoutes =
                sameCategoryRoutes.length > 0
                  ? sameCategoryRoutes.slice(0, 6)
                  : Object.values(TOOL_ROUTES)
                      .filter((r) => r.id !== tool.id)
                      .slice(0, 6);

              return (
                <div className="pt-2 space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {sameCategoryRoutes.length > 0
                      ? isUrdu
                        ? `${categoryTitle} میں مزید ٹولز`
                        : `Related Tools in ${categoryTitle}`
                      : isUrdu
                      ? 'مزید متعلقہ مفت ٹولز'
                      : 'More Popular Free Utilities'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {fallbackRoutes.map((relRoute) => {
                      const relDef = TOOLS_LIST.find((t) => t.id === relRoute.id);
                      if (!relDef) return null;
                      return (
                        <a
                          key={relRoute.id}
                          href={relRoute.primaryPath}
                          onClick={(e) => {
                            if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                              e.preventDefault();
                              onNavigateTo(relRoute.primaryPath);
                            }
                          }}
                          className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors min-w-0"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {isUrdu ? relDef.nameUrdu : relDef.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {isUrdu ? relDef.shortDescriptionUrdu : relDef.shortDescription}
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                        </a>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Bottom Bar: Back to All Tools & Category Link */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span>{isUrdu ? 'کیٹیگری:' : 'Category:'}</span>
                <a
                  href={`/tools?category=${routeConfig.categoryGroup}`}
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                      e.preventDefault();
                      onNavigateTo(`/tools?category=${routeConfig.categoryGroup}`);
                    }
                  }}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {categoryTitle}
                </a>
              </div>

              <div className="flex items-center gap-4 self-start sm:self-auto flex-wrap">
                <Print
                  targetId="tool-workspace-content"
                  toolId={tool.id}
                  toolName={toolTitle}
                  documentTitle={`${toolTitle} – FreeTools Hub`}
                  variant="link"
                  label={isUrdu ? 'نتائج پرنٹ کریں' : 'Print Tool'}
                />

                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                  ) : (
                    <FileDown className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  )}
                  <span>{isUrdu ? 'پی ڈی ایف محفوظ کریں' : 'Download as PDF'}</span>
                </button>

                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>

                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span>{isUrdu ? 'ٹول کا لنک شیئر کریں' : 'Share this tool'}</span>
                </button>

                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">•</span>

                <a
                  href="/tools"
                  onClick={(e) => {
                    if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                      e.preventDefault();
                      onNavigateTo('/tools');
                    }
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                >
                  <span>{isUrdu ? `تمام ${TOOLS_LIST.length} ٹولز ڈائرکٹری دیکھیں` : `Explore all ${TOOLS_LIST.length} tools in directory`}</span>
                  {dir === 'rtl' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Reader Mode Floating Exit Helper Bar */}
      {isReaderMode && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-max max-w-[calc(100vw-1.5rem)] z-40 inline-flex items-center justify-center gap-2.5 px-4 py-2 bg-slate-900/95 dark:bg-slate-800/95 text-white rounded-full shadow-2xl border border-slate-700/80 backdrop-blur-md text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200 no-print"
        >
          <span className="truncate">
            {isUrdu
              ? 'خلفشار سے پاک ریڈر موڈ فعال ہے'
              : 'Distraction-Free Reader Mode Active'}
          </span>
          <span className="text-slate-500 shrink-0">·</span>
          <button
            type="button"
            onClick={handleToggleReaderMode}
            className="text-blue-300 hover:text-white font-bold underline cursor-pointer flex items-center gap-1 transition-colors shrink-0"
          >
            <span>{isUrdu ? 'واپس جائیں (Esc)' : 'Exit (Esc)'}</span>
          </button>
        </aside>
      )}

      {/* Floating Toast Notification on Share / PDF Export / Clipboard Copy */}
      {showToast && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-3 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 rtl:sm:right-auto rtl:sm:left-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900/95 dark:bg-slate-800/95 text-white rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-200 sm:max-w-sm no-print"
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
              toastData.isSuccess
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}
          >
            {toastData.isSuccess ? <Check className="w-4 h-4" /> : <Info className="w-4 h-4" />}
          </div>

          <div className="flex flex-col min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">
                {toastData.title}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold ${
                  toastData.isSuccess
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {toastData.isSuccess ? 'Success' : 'Notice'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-mono truncate max-w-[220px]">
              {toastData.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowToast(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer ml-auto"
            aria-label={isUrdu ? 'نوٹیفکیشن بند کریں' : 'Dismiss notification'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        tool={tool}
        routeConfig={routeConfig}
        onDownloadPdf={handleDownloadPdf}
        onLinkCopied={() => {
          const url = window.location.href;
          setCopiedLink(true);
          triggerToast(
            isUrdu ? 'لنک کلپ بورڈ پر کاپی ہوگیا!' : 'Link copied to clipboard!',
            url,
            true
          );
        }}
      />

      {/* Reset Tool Inputs Confirmation Modal Dialog */}
      <ResetToolModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        toolName={toolTitle}
        isResetting={isResetting}
      />
    </div>
  );
};
