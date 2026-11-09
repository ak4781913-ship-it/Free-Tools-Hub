/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { Printer } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { recordPrintDocument } from '../../utils/printHistoryTracking';
import { extractToolResultText } from '../../utils/toolResultExtractor';

export type PrintVariant = 'toolbar' | 'secondary' | 'subtle' | 'icon' | 'primary' | 'link';
export type PrintSize = 'sm' | 'md';

export interface PrintProps {
  /**
   * DOM element ID of the tool content area to isolate when printing.
   * Defaults to 'tool-workspace-content'.
   */
  targetId?: string;
  /**
   * Optional React ref to a specific printable container element.
   * Takes precedence over `targetId` when provided.
   */
  targetRef?: React.RefObject<HTMLElement | null>;
  /**
   * Optional tool ID used to log the document in client-side Print History
   * and extract a fallback summary of current results.
   */
  toolId?: string;
  /**
   * Optional human-readable tool name for accessibility and Print History.
   */
  toolName?: string;
  /**
   * Optional document title (or getter) temporarily applied to `document.title`
   * during `window.print()` so Save-as-PDF filenames are descriptive.
   */
  documentTitle?: string | (() => string);
  /**
   * Optional format label stored in Print History (e.g. 'Official Calculation Statement').
   */
  documentFormat?: string;
  /**
   * Optional summary (or getter) stored in Print History.
   */
  documentSummary?: string | (() => string | undefined);
  /**
   * Optional synchronous hook invoked right before `window.print()`.
   * Returning `false` cancels printing (useful for form validation).
   */
  onBeforePrint?: () => boolean | void;
  /**
   * Optional callback invoked after the browser print dialog closes and print state is cleaned up.
   */
  onAfterPrint?: () => void;
  /**
   * Visual button style matching FreeTools Hub toolbars and cards.
   */
  variant?: PrintVariant;
  /**
   * Button sizing preset.
   */
  size?: PrintSize;
  /**
   * Optional custom visible label. Defaults to localized 'Print' / 'پرنٹ'.
   */
  label?: string;
  /**
   * Optional custom tooltip (`title` attribute).
   */
  tooltip?: string;
  /**
   * Optional accessible label (`aria-label` attribute).
   */
  ariaLabel?: string;
  /**
   * Hide text label below `sm` (640px) breakpoint while keeping the icon accessible.
   */
  hideLabelOnMobile?: boolean;
  /**
   * Show non-intrusive toast confirmation (never visible on printed output).
   * Defaults to true.
   */
  showToastFeedback?: boolean;
  /**
   * Disable the print button.
   */
  disabled?: boolean;
  /**
   * Optional extra Tailwind utility classes.
   */
  className?: string;
}

const DEFAULT_WORKSPACE_ID = 'tool-workspace-content';
const RESUME_PREVIEW_ID = 'printable-resume-area';

/**
 * Reusable Print component that isolates the active tool's content area
 * and triggers the browser's native `window.print()` dialog.
 */
export const Print: React.FC<PrintProps> = ({
  targetId = DEFAULT_WORKSPACE_ID,
  targetRef,
  toolId,
  toolName,
  documentTitle,
  documentFormat = 'Browser Print / A4 Report',
  documentSummary,
  onBeforePrint,
  onAfterPrint,
  variant = 'toolbar',
  size = 'sm',
  label,
  tooltip,
  ariaLabel,
  hideLabelOnMobile = false,
  showToastFeedback = true,
  disabled = false,
  className = '',
}) => {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const isUrdu = language === 'ur';
  const cleanupRef = useRef<(() => void) | null>(null);

  // Ensure any active print attributes are restored if component unmounts mid-session
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  const handlePrintClick = useCallback(() => {
    if (disabled || typeof window === 'undefined') return;

    // 1. Run optional validation or pre-print preparation synchronously
    if (onBeforePrint) {
      const shouldContinue = onBeforePrint();
      if (shouldContinue === false) {
        return;
      }
    }

    if (typeof window.print !== 'function') {
      toast.error(
        isUrdu ? 'پرنٹ دستیاب نہیں ہے' : 'Print Not Supported',
        isUrdu
          ? 'آپ کا موجودہ براؤزر براہ راست پرنٹ کی سہولت فراہم نہیں کرتا۔'
          : 'Your current browser environment does not support native printing.'
      );
      return;
    }

    // Clean up any leftover state from an earlier invocation
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // 2. Resolve target element for print scoping
    const explicitElement = targetRef?.current ?? null;
    const resolvedTarget =
      explicitElement ||
      document.getElementById(targetId) ||
      document.getElementById(DEFAULT_WORKSPACE_ID);

    const isCustomTarget = Boolean(
      resolvedTarget &&
        resolvedTarget.id !== DEFAULT_WORKSPACE_ID &&
        resolvedTarget.id !== RESUME_PREVIEW_ID
    );

    // 3. Resolve clean document title for browser Save-as-PDF filename & Print History
    const rawTitle =
      typeof documentTitle === 'function' ? documentTitle() : documentTitle;
    const resolvedTitle =
      (rawTitle && rawTitle.trim()) ||
      (toolName ? `${toolName} – FreeTools Hub` : document.title);

    const previousDocTitle = document.title;

    // Apply print scoping classes/attributes synchronously before window.print()
    document.body.classList.add('printing-tool-workspace');
    if (isCustomTarget && resolvedTarget) {
      resolvedTarget.setAttribute('data-print-active-target', 'true');
      document.body.setAttribute('data-printing-custom-target', 'true');
    }
    if (resolvedTitle) {
      document.title = resolvedTitle;
    }

    let cleanedUp = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;

      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }

      document.body.classList.remove('printing-tool-workspace');
      document.body.removeAttribute('data-printing-custom-target');
      if (resolvedTarget) {
        resolvedTarget.removeAttribute('data-print-active-target');
      }
      document.title = previousDocTitle;

      window.removeEventListener('afterprint', cleanup);
      cleanupRef.current = null;
      onAfterPrint?.();
    };

    cleanupRef.current = cleanup;
    window.addEventListener('afterprint', cleanup);

    // 4. Record in local Print History when tool context is available
    if (toolId) {
      const explicitSummary =
        typeof documentSummary === 'function' ? documentSummary() : documentSummary;
      const fallbackSummary =
        explicitSummary ??
        extractToolResultText(toolId, toolName || toolId)?.summary;

      recordPrintDocument(toolId, resolvedTitle, {
        toolName,
        format: documentFormat,
        summary: fallbackSummary,
      });
    }

    // 5. Trigger native browser print synchronously within user gesture
    try {
      window.focus();
      window.print();

      // Safety fallback cleanup for environments that don't emit `afterprint` reliably
      fallbackTimer = setTimeout(cleanup, 1500);

      if (showToastFeedback) {
        toast.info(
          isUrdu ? 'پرنٹ ڈائیلاگ کھولا گیا' : 'Print Dialog Opened',
          isUrdu
            ? 'موجودہ ٹول کا مواد پرنٹ کے لیے تیار ہے۔'
            : toolName
              ? `Ready to print ${toolName} content.`
              : 'Current tool content formatted for printing.',
          {
            compact: true,
            duration: 3000,
            dedupeKey: 'tool-print-dialog',
          }
        );
      }
    } catch (err) {
      console.warn('[Print] Browser print invocation failed:', err);
      cleanup();
      toast.error(
        isUrdu ? 'پرنٹ شروع نہیں ہو سکا' : 'Unable to Open Print Dialog',
        isUrdu
          ? 'براہ کرم کی بورڈ شارٹ کٹ Ctrl+P (یا Cmd+P) استعمال کریں۔'
          : 'Please press Ctrl+P (or Cmd+P) to print this tool.',
        {
          compact: true,
          duration: 4000,
          dedupeKey: 'tool-print-dialog',
        }
      );
    }
  }, [
    disabled,
    onBeforePrint,
    targetRef,
    targetId,
    documentTitle,
    toolName,
    toolId,
    documentSummary,
    documentFormat,
    onAfterPrint,
    showToastFeedback,
    toast,
    isUrdu,
  ]);

  const resolvedLabel = label ?? (isUrdu ? 'پرنٹ' : t.print || 'Print');
  const resolvedTooltip =
    tooltip ??
    (isUrdu
      ? 'اس ٹول کی رپورٹ یا نتائج پرنٹ کریں (Ctrl+P)'
      : t.printTooltip || "Print this tool's report or output (Ctrl+P / Cmd+P)");
  const resolvedAriaLabel =
    ariaLabel ??
    (isUrdu
      ? `${toolName ? `${toolName} ` : ''}پرنٹ کریں`
      : `Print ${toolName ? `${toolName} ` : 'tool '}content`);

  const sizeClasses =
    variant === 'icon'
      ? size === 'md'
        ? 'p-2 min-h-[38px] min-w-[38px]'
        : 'p-1.5 min-h-[32px] min-w-[32px]'
      : variant === 'link'
        ? 'py-1 px-0.5'
        : size === 'md'
          ? 'px-3.5 py-2 text-xs sm:text-sm min-h-[38px]'
          : 'px-3 py-1.5 text-xs min-h-[32px]';

  const variantClasses: Record<PrintVariant, string> = {
    toolbar:
      'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-750 font-semibold shadow-2xs',
    secondary:
      'rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold shadow-2xs',
    subtle:
      'rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium',
    icon:
      'rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800',
    primary:
      'rounded-lg bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold shadow-xs',
    link:
      'rounded text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400',
  };

  const iconColorClasses =
    variant === 'primary'
      ? 'text-white'
      : variant === 'toolbar' || variant === 'link'
        ? 'text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform'
        : 'text-slate-600 dark:text-slate-300';

  return (
    <button
      type="button"
      onClick={handlePrintClick}
      disabled={disabled}
      title={resolvedTooltip}
      aria-label={resolvedAriaLabel}
      data-no-print="true"
      data-testid="print-tool-button"
      className={`no-print inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 group ${sizeClasses} ${variantClasses[variant]} ${className}`.trim()}
    >
      <Printer className={`${variant === 'icon' ? 'w-4 h-4' : 'w-3.5 h-3.5'} shrink-0 ${iconColorClasses}`} />
      {variant !== 'icon' && (
        <span className={hideLabelOnMobile ? 'hidden sm:inline' : undefined}>
          {resolvedLabel}
        </span>
      )}
    </button>
  );
};

export default Print;
