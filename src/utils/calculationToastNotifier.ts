/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { ToolDefinition } from '../types';
import { useToast } from '../context/ToastContext';
import { extractToolResultText } from './toolResultExtractor';

export const CALCULATION_TOAST_DEDUPE_KEY = 'tool-calculation-result';
const CALCULATION_EVENT_NAME = 'freetools:calculation-result';

export interface CalculationSuccessPayload {
  toolId: string;
  title?: string;
  titleUrdu?: string;
  message?: string;
  messageUrdu?: string;
}

export interface CalculationSnapshot {
  signature: string;
  title: string;
  message: string;
}

/**
 * Tools that generate results via explicit primary action buttons or async workflows
 * (e.g. "Generate Prompt", "Analyze Page", "Compress Image", or Case Transform buttons)
 * and dispatch `emitCalculationSuccess` directly when the result is ready.
 */
const EXPLICIT_ACTION_TOOLS = new Set<string>([
  'gemini-photo-prompt',
  'ai-video-prompt',
  'seo-page-analyzer',
  'image-compressor',
  'text-case-converter',
]);

/**
 * Long-form authoring tools use a slightly gentler typing settle window
 * so continuous writing is never interrupted mid-sentence.
 */
const DOCUMENT_EDITOR_TOOLS = new Set<string>([
  'word-counter',
  'markdown-editor',
  'resume-builder',
]);

/**
 * Dispatches an explicit calculation/result-generated notification event.
 */
export function emitCalculationSuccess(payload: CalculationSuccessPayload): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<CalculationSuccessPayload>(CALCULATION_EVENT_NAME, {
      detail: payload,
    })
  );
}

/**
 * Determines whether a clicked button or control inside the tool workspace is a
 * non-calculation utility action (Copy, Download, Print, Reset, View Tab, Modal, etc.)
 * that should NOT trigger a calculation-complete notification.
 */
function isNonCalculationButton(button: HTMLElement): boolean {
  const combinedLabel = [
    button.textContent || '',
    button.getAttribute('aria-label') || '',
    button.getAttribute('title') || '',
  ]
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  if (!combinedLabel) return true;

  const ignoredPatterns = [
    /\bcopy\b/,
    /\bcopied\b/,
    /کاپی/,
    /\bdownload\b/,
    /\bexport\b/,
    /\bsave\b/,
    /\bprint\b/,
    /\breset\b/,
    /\bclear\b/,
    /\brestore\b/,
    /\bupload\b/,
    /\bimport\b/,
    /ڈاؤن لوڈ/,
    /محفوظ/,
    /پرنٹ/,
    /ری سیٹ/,
    /صاف/,
    /بحال/,
    /\bshow password\b/,
    /\bhide password\b/,
    /\bcompare scenarios\b/,
    /\btest cases\b/,
    /\bclose\b/,
    /\bdismiss\b/,
    /\bcancel\b/,
    /\bshare\b/,
    /\byearly\b/,
    /\bmonthly\b/,
    /\bdesktop\b/,
    /\bmobile\b/,
    /\btree view\b/,
    /\bcode view\b/,
  ];

  return ignoredPatterns.some((regex) => regex.test(combinedLabel));
}

/**
 * Checks whether an input is an internal search/filter box (such as currency/crypto
 * dropdown filters or JSON tree search) rather than a calculation parameter.
 */
function isSearchOrFilterInput(el: HTMLElement): boolean {
  if (!(el instanceof HTMLInputElement)) return false;
  if (el.type === 'search' || el.readOnly) return true;
  const hint = `${el.placeholder || ''} ${el.getAttribute('aria-label') || ''}`.toLowerCase();
  return hint.includes('search') || hint.includes('filter') || hint.includes('تلاش');
}

function cleanInlineSummary(raw: string, maxLen = 68): string {
  const normalized = raw.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLen) return normalized;
  return `${normalized.slice(0, maxLen - 1).trim()}…`;
}

/**
 * Extracts a deterministic signature of the active tool's calculated output
 * along with a concise localized title and summary for the confirmation toast.
 * Returns `null` if the tool is currently in an empty or validation-error state.
 */
export function extractCalculationSnapshot(
  tool: ToolDefinition,
  workspace: HTMLElement,
  isUrdu: boolean
): CalculationSnapshot | null {
  const toolId = tool.id;
  const toolTitle = isUrdu ? tool.nameUrdu : tool.name;

  // 1. UAE Salary Calculator
  if (toolId === 'uae-salary-calculator') {
    const saved = localStorage.getItem('ft_uae-salary-calculator_inputs');
    if (saved) {
      try {
        const d = JSON.parse(saved);
        const basic = Math.max(0, Number(d.basicSalary) || 0);
        const housing = Math.max(0, Number(d.housingAllowance) || 0);
        const transport = Math.max(0, Number(d.transportAllowance) || 0);
        const other = Math.max(0, Number(d.otherAllowances) || 0);
        const fixedDed = Math.max(0, Number(d.fixedDeductions) || 0);
        const unpaidDays = Math.min(30, Math.max(0, Number(d.unpaidLeaveDays) || 0));
        const weeklyHrs = Math.max(1, Number(d.weeklyHours) || 48);
        const gross = basic + housing + transport + other;
        const unpaidDed = (gross / 30) * unpaidDays;
        const pensionDed = d.includeUAEGPSSA ? gross * 0.05 : 0;
        const net = Math.max(0, gross - fixedDed - unpaidDed - pensionDed);
        const fmt = (n: number) =>
          `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        return {
          signature: `salary:${gross.toFixed(2)}:${net.toFixed(2)}:${weeklyHrs}:${Boolean(d.includeUAEGPSSA)}`,
          title: isUrdu ? 'تنخواہ کا حساب مکمل ہو گیا' : 'Calculation Complete',
          message: isUrdu ? `خالص ماہانہ: ${fmt(net)}` : `Net Monthly: ${fmt(net)}`,
        };
      } catch {
        // Fallback below
      }
    }
  }

  // 2. UAE Gratuity Calculator
  if (toolId === 'uae-gratuity') {
    const prominent = Array.from(
      workspace.querySelectorAll<HTMLElement>('.text-3xl, .text-4xl, .text-5xl')
    )
      .map((el) => el.textContent?.trim() || '')
      .find((txt) => txt.includes('AED') || /\d/.test(txt));

    if (prominent) {
      const formattedVal = prominent.startsWith('AED') ? prominent : `AED ${prominent}`;
      return {
        signature: `gratuity:${formattedVal}`,
        title: isUrdu ? 'گریجویٹی کا حساب مکمل ہو گیا' : 'Calculation Complete',
        message: isUrdu
          ? `متوقع گریجویٹی: ${cleanInlineSummary(formattedVal)}`
          : `Estimated Gratuity: ${cleanInlineSummary(formattedVal)}`,
      };
    }
  }

  // 3. Percentage & Discount Calculator (3-module grid)
  if (toolId === 'percentage-calculator') {
    const monoResults = Array.from(
      workspace.querySelectorAll<HTMLElement>('.text-2xl.font-mono, .text-indigo-600.font-mono')
    )
      .map((el) => el.textContent?.trim() || '')
      .filter(Boolean);

    if (monoResults.length > 0) {
      const summary = monoResults.slice(0, 3).join(' · ');
      return {
        signature: `pct:${monoResults.join('|')}`,
        title: isUrdu ? 'فیصد کا حساب مکمل ہو گیا' : 'Calculation Complete',
        message: isUrdu ? `نتائج: ${cleanInlineSummary(summary)}` : `Results: ${cleanInlineSummary(summary)}`,
      };
    }
  }

  // 4. Age Calculator
  if (toolId === 'age-calculator') {
    const heroVal = workspace.querySelector<HTMLElement>('.bg-indigo-600 .font-mono');
    const ageText = heroVal?.textContent?.replace(/\s+/g, ' ').trim();
    if (!ageText) return null;
    return {
      signature: `age:${ageText}`,
      title: isUrdu ? 'عمر کا حساب مکمل ہو گیا' : 'Calculation Complete',
      message: cleanInlineSummary(ageText),
    };
  }

  // 5. Date Difference Calculator
  if (toolId === 'date-difference') {
    const durationEl = workspace.querySelector<HTMLElement>('.text-3xl.font-mono, .text-4xl.font-mono');
    const bizEl = workspace.querySelector<HTMLElement>('.text-2xl.font-mono');
    const durationText = durationEl?.textContent?.trim();
    if (!durationText) return null;
    const bizText = bizEl?.textContent?.trim();
    return {
      signature: `datediff:${durationText}:${bizText || ''}`,
      title: isUrdu ? 'تاریخوں کے فرق کا حساب مکمل' : 'Calculation Complete',
      message: bizText
        ? cleanInlineSummary(`${durationText} (${bizText} business days)`)
        : cleanInlineSummary(durationText),
    };
  }

  // 6. BMI Calculator
  if (toolId === 'bmi-calculator') {
    const metrics = Array.from(
      workspace.querySelectorAll<HTMLElement>('.text-4xl, .text-5xl, .font-mono')
    )
      .map((el) => el.textContent?.trim() || '')
      .filter((t) => /^\d+(\.\d+)?$/.test(t));

    if (metrics.length > 0) {
      const bmiVal = metrics[0];
      return {
        signature: `bmi:${bmiVal}:${metrics.slice(0, 3).join('|')}`,
        title: isUrdu ? 'بی ایم آئی کا حساب مکمل' : 'Calculation Complete',
        message: isUrdu ? `بی ایم آئی اسکور: ${bmiVal}` : `BMI Score: ${bmiVal}`,
      };
    }
  }

  // 7. Loan & Amortization Calculator
  if (toolId === 'loan-calculator') {
    const figures = Array.from(
      workspace.querySelectorAll<HTMLElement>('.text-3xl, .text-4xl, .text-2xl.font-mono')
    )
      .map((el) => el.textContent?.replace(/\s+/g, ' ').trim() || '')
      .filter((t) => /\d/.test(t));

    if (figures.length > 0) {
      return {
        signature: `loan:${figures.slice(0, 4).join('|')}`,
        title: isUrdu ? 'قسط کا حساب مکمل ہو گیا' : 'Calculation Complete',
        message: isUrdu
          ? `ماہانہ قسط: ${cleanInlineSummary(figures[0])}`
          : `Monthly Payment: ${cleanInlineSummary(figures[0])}`,
      };
    }
  }

  // 8. Discount & Sale Calculator
  if (toolId === 'discount-calculator') {
    const figures = Array.from(
      workspace.querySelectorAll<HTMLElement>('.text-3xl, .text-4xl, .text-2xl.font-mono')
    )
      .map((el) => el.textContent?.replace(/\s+/g, ' ').trim() || '')
      .filter((t) => /\d/.test(t));

    if (figures.length > 0) {
      return {
        signature: `discount:${figures.slice(0, 4).join('|')}`,
        title: isUrdu ? 'رعایت کا حساب مکمل ہو گیا' : 'Calculation Complete',
        message: isUrdu
          ? `حتمی قیمت: ${cleanInlineSummary(figures[0])}`
          : `Final Price: ${cleanInlineSummary(figures[0])}`,
      };
    }
  }

  // 9. Currency / Crypto / Unit / TimeZone Converters
  if (
    toolId === 'currency-converter' ||
    toolId === 'crypto-converter' ||
    toolId === 'unit-converter' ||
    toolId === 'timezone-converter'
  ) {
    const figures = Array.from(
      workspace.querySelectorAll<HTMLElement>('.text-2xl, .text-3xl, .text-4xl, .font-mono')
    )
      .map((el) => el.textContent?.replace(/\s+/g, ' ').trim() || '')
      .filter((t) => /\d/.test(t) && t.length <= 60);

    if (figures.length > 0) {
      const topSummary = figures[0];
      return {
        signature: `${toolId}:${figures.slice(0, 5).join('|')}`,
        title: isUrdu ? 'تبادلہ مکمل ہو گیا' : 'Conversion Complete',
        message: cleanInlineSummary(topSummary),
      };
    }
  }

  // 10. Strong Password Generator
  if (toolId === 'password-generator') {
    const pwInput = workspace.querySelector<HTMLInputElement>('input[readonly]');
    const pw = pwInput?.value?.trim();
    if (!pw) return null;
    return {
      signature: `pwgen:${pw}`,
      title: isUrdu ? 'نیا پاس ورڈ تیار ہو گیا' : 'Password Generated',
      message: isUrdu
        ? `${pw.length} حروف پر مشتمل محفوظ کلید تیار`
        : `${pw.length}-character secure password ready`,
    };
  }

  // 11. Password Strength Checker
  if (toolId === 'password-strength') {
    const pwInput = workspace.querySelector<HTMLInputElement>('input[type="text"], input[type="password"]');
    if (!pwInput || !pwInput.value) return null;
    const monoStats = Array.from(workspace.querySelectorAll<HTMLElement>('.font-mono'))
      .map((el) => el.textContent?.trim() || '')
      .filter(Boolean)
      .slice(0, 3);
    return {
      signature: `pwstrength:${pwInput.value.length}:${monoStats.join('|')}`,
      title: isUrdu ? 'پاس ورڈ تجزیہ مکمل ہو گیا' : 'Strength Calculated',
      message:
        monoStats.length > 0
          ? cleanInlineSummary(monoStats.join(' · '))
          : isUrdu
            ? 'اینٹروپی اور سیکیورٹی اسکور اپ ڈیٹ ہو گیا'
            : 'Entropy & crack-time metrics updated',
    };
  }

  // 12. QR Code Generator
  if (toolId === 'qr-generator' || toolId === 'qrcode-generator') {
    const canvas = workspace.querySelector<HTMLCanvasElement>('canvas');
    const inputs = Array.from(
      workspace.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')
    ).map((el) => el.value);
    const primaryText = inputs[0]?.trim() || '';
    if (!canvas || !primaryText) return null;
    return {
      signature: `qr:${inputs.join('|')}`,
      title: isUrdu ? 'کیو آر کوڈ تیار ہو گیا' : 'QR Code Generated',
      message: isUrdu ? 'اسکین یا ڈاؤن لوڈ کے لیے تیار ہے' : 'Updated QR code ready to scan or download',
    };
  }

  // 13. JSON Formatter & Validator
  if (toolId === 'json-formatter') {
    const textarea = workspace.querySelector<HTMLTextAreaElement>('textarea');
    const raw = textarea?.value?.trim() || localStorage.getItem('ft_json_formatter_draft')?.trim() || '';
    if (!raw) return null;
    try {
      JSON.parse(raw);
    } catch {
      return null; // Do not confirm success when JSON has a syntax error
    }
    const pre = workspace.querySelector<HTMLElement>('pre');
    const formattedLen = pre?.textContent?.length || raw.length;
    return {
      signature: `json:${raw.length}:${formattedLen}:${pre?.textContent?.slice(0, 80) || ''}`,
      title: isUrdu ? 'جے ایس او این فارمیٹ مکمل' : 'JSON Formatted & Valid',
      message: isUrdu
        ? `${formattedLen.toLocaleString()} حروف کی تصدیق ہو گئی`
        : `Valid JSON (${formattedLen.toLocaleString()} chars)`,
    };
  }

  // 14. Base64 Encoder & Decoder
  if (toolId === 'base64-converter') {
    const textareas = workspace.querySelectorAll<HTMLTextAreaElement>('textarea');
    if (textareas.length >= 2) {
      const out = textareas[1].value?.trim() || '';
      if (!out) return null;
      return {
        signature: `b64:${out.length}:${out.slice(0, 64)}`,
        title: isUrdu ? 'بیس 64 نتیجہ تیار ہو گیا' : 'Base64 Result Generated',
        message: isUrdu
          ? `${out.length.toLocaleString()} حروف تیار`
          : `${out.length.toLocaleString()} output characters ready`,
      };
    }
    const imgPreview = workspace.querySelector<HTMLImageElement>('img');
    if (imgPreview?.src) {
      return {
        signature: `b64img:${imgPreview.src.length}:${imgPreview.src.slice(-40)}`,
        title: isUrdu ? 'بیس 64 تصویر تیار ہو گئی' : 'Base64 Conversion Complete',
        message: isUrdu ? 'امیج ڈیٹا کامیابی سے تبدیل ہو گیا' : 'Image Base64 payload generated',
      };
    }
    return null;
  }

  // 15. Color Picker & Converter
  if (toolId === 'color-picker') {
    const hexMatch = workspace.innerText.match(/#[0-9A-Fa-f]{6}\b/);
    if (hexMatch) {
      const hex = hexMatch[0].toUpperCase();
      return {
        signature: `color:${hex}`,
        title: isUrdu ? 'رنگ کی قدریں اپ ڈیٹ ہو گئیں' : 'Color Conversion Updated',
        message: isUrdu ? `منتخب رنگ: ${hex}` : `Active Color: ${hex} (RGB, HSL, CMYK synced)`,
      };
    }
  }

  // 16. SEO Meta Tags Generator
  if (toolId === 'seo-meta-generator') {
    const inputs = Array.from(
      workspace.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        'input, textarea, select'
      )
    ).map((el) => (el instanceof HTMLInputElement && el.type === 'checkbox' ? String(el.checked) : el.value));
    const titleVal = inputs[0]?.trim() || '';
    if (!titleVal) return null;
    return {
      signature: `seometa:${inputs.join('|')}`,
      title: isUrdu ? 'ایس ای او میٹا ٹیگز تیار ہو گئے' : 'Meta Tags Generated',
      message: isUrdu
        ? `ٹائٹل (${titleVal.length} حروف) اور اوپن گراف ٹیگز اپ ڈیٹ ہو گئے`
        : `Title (${titleVal.length} chars) & OpenGraph tags updated`,
    };
  }

  // 17. Word & Character Counter
  if (toolId === 'word-counter') {
    const textarea = workspace.querySelector<HTMLTextAreaElement>('textarea');
    const raw = textarea?.value ?? '';
    if (!raw.trim()) return null;
    const words = raw.trim().split(/\s+/).filter(Boolean).length;
    const chars = raw.length;
    return {
      signature: `words:${words}:${chars}`,
      title: isUrdu ? 'متن کا شمار مکمل ہو گیا' : 'Text Analysis Updated',
      message: isUrdu
        ? `${words.toLocaleString()} الفاظ · ${chars.toLocaleString()} حروف`
        : `${words.toLocaleString()} words · ${chars.toLocaleString()} characters`,
    };
  }

  // 18. Markdown Live Editor
  if (toolId === 'markdown-editor') {
    const textarea = workspace.querySelector<HTMLTextAreaElement>('textarea');
    const raw = textarea?.value?.trim() || '';
    if (!raw) return null;
    const words = raw.split(/\s+/).filter(Boolean).length;
    return {
      signature: `md:${raw.length}:${words}:${raw.slice(0, 40)}`,
      title: isUrdu ? 'مارک ڈاؤن پری ویو تیار ہو گیا' : 'Markdown Output Updated',
      message: isUrdu ? `${words.toLocaleString()} الفاظ رینڈر ہو گئے` : `Rendered ${words.toLocaleString()} words`,
    };
  }

  // 19. CV & Resume Generator
  if (toolId === 'resume-builder') {
    const preview = document.getElementById('printable-resume-area');
    const text = preview?.innerText?.replace(/\s+/g, ' ').trim() || '';
    if (!text) return null;
    return {
      signature: `cv:${text.length}:${text.slice(0, 120)}`,
      title: isUrdu ? 'سی وی پری ویو اپ ڈیٹ ہو گیا' : 'Resume Preview Updated',
      message: isUrdu ? 'لائیو ٹیمپلیٹ میں تبدیلیاں لاگو ہو گئیں' : 'Live CV template updated successfully',
    };
  }

  // Universal fallback for any additional tool
  const extracted = extractToolResultText(toolId, toolTitle);
  if (extracted && extracted.text.trim()) {
    return {
      signature: `generic:${toolId}:${extracted.charCount}:${extracted.summary}`,
      title: isUrdu ? 'نتیجہ تیار ہو گیا' : 'Calculation Complete',
      message: cleanInlineSummary(extracted.summary || toolTitle),
    };
  }

  return null;
}

interface UseToolCalculationToastParams {
  tool: ToolDefinition;
  isUrdu: boolean;
  resetKey: number;
  isResetting: boolean;
}

/**
 * Monitors the active tool workspace (`#tool-workspace-content`) and triggers a
 * non-intrusive toast confirmation whenever a user interaction generates or updates
 * a calculation/tool result. Never triggers on initial page load or tool reset.
 */
export function useToolCalculationToast({
  tool,
  isUrdu,
  resetKey,
  isResetting,
}: UseToolCalculationToastParams): void {
  const { showToast, dismissToast } = useToast();
  const lastSignatureRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isResettingRef = useRef<boolean>(isResetting);
  const isUrduRef = useRef<boolean>(isUrdu);
  const toolRef = useRef<ToolDefinition>(tool);

  isResettingRef.current = isResetting;
  isUrduRef.current = isUrdu;
  toolRef.current = tool;

  // Listen to explicit `emitCalculationSuccess` events from button/async tools
  useEffect(() => {
    const handleExplicitEvent = (e: Event) => {
      if (isResettingRef.current) return;
      const custom = e as CustomEvent<CalculationSuccessPayload>;
      const detail = custom.detail;
      if (!detail || detail.toolId !== toolRef.current.id) return;

      const localizedTitle = isUrduRef.current
        ? detail.titleUrdu || detail.title || 'نتیجہ تیار ہو گیا'
        : detail.title || 'Result Generated';
      const localizedMessage = isUrduRef.current
        ? detail.messageUrdu || detail.message
        : detail.message;

      showToast({
        type: 'success',
        title: localizedTitle,
        message: localizedMessage,
        duration: 3200,
        compact: true,
        dedupeKey: CALCULATION_TOAST_DEDUPE_KEY,
      });
    };

    window.addEventListener(CALCULATION_EVENT_NAME, handleExplicitEvent);
    return () => {
      window.removeEventListener(CALCULATION_EVENT_NAME, handleExplicitEvent);
    };
  }, [showToast]);

  // Observe user-driven reactive calculations inside `#tool-workspace-content`
  useEffect(() => {
    lastSignatureRef.current = null;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (EXPLICIT_ACTION_TOOLS.has(tool.id)) {
      return;
    }

    const captureBaseline = () => {
      const workspace = document.getElementById('tool-workspace-content');
      if (!workspace) return;
      const snap = extractCalculationSnapshot(toolRef.current, workspace, isUrduRef.current);
      if (snap) {
        lastSignatureRef.current = snap.signature;
      }
    };

    // Capture initial baseline once lazy-loaded tool workspace mounts
    const initTimer = setTimeout(captureBaseline, 320);

    const scheduleEvaluation = (delayMs: number) => {
      if (isResettingRef.current) return;
      // Ensure baseline was captured if user interacted immediately after lazy load
      if (lastSignatureRef.current === null) {
        captureBaseline();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        if (isResettingRef.current) return;
        const workspace = document.getElementById('tool-workspace-content');
        if (!workspace) return;

        const nextSnap = extractCalculationSnapshot(toolRef.current, workspace, isUrduRef.current);
        if (!nextSnap) return;

        if (lastSignatureRef.current === nextSnap.signature) {
          return;
        }

        lastSignatureRef.current = nextSnap.signature;
        showToast({
          type: 'success',
          title: nextSnap.title,
          message: nextSnap.message,
          duration: 3200,
          compact: true,
          dedupeKey: CALCULATION_TOAST_DEDUPE_KEY,
        });
      }, delayMs);
    };

    const handleWorkspaceInput = (e: Event) => {
      if (!e.isTrusted || isResettingRef.current) return;
      const target = e.target as HTMLElement | null;
      if (!target || isSearchOrFilterInput(target)) return;

      if (
        (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) &&
        target.value === ''
      ) {
        // Wait while user clears input before entering a new value
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        return;
      }

      const settleMs = DOCUMENT_EDITOR_TOOLS.has(toolRef.current.id) ? 1050 : 600;
      scheduleEvaluation(settleMs);
    };

    const handleWorkspaceChange = (e: Event) => {
      if (!e.isTrusted || isResettingRef.current) return;
      const target = e.target as HTMLElement | null;
      if (!target || isSearchOrFilterInput(target)) return;

      if (
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLInputElement &&
          ['checkbox', 'radio', 'date', 'time', 'file'].includes(target.type))
      ) {
        scheduleEvaluation(160);
      }
    };

    const handleWorkspaceClick = (e: MouseEvent) => {
      if (!e.isTrusted || isResettingRef.current) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const button = target.closest('button');
      if (!button) return;

      const workspace = document.getElementById('tool-workspace-content');
      if (!workspace || !workspace.contains(button)) return;
      if (isNonCalculationButton(button)) return;

      scheduleEvaluation(160);
    };

    const attachListeners = () => {
      const workspace = document.getElementById('tool-workspace-content');
      if (!workspace) return () => {};
      workspace.addEventListener('input', handleWorkspaceInput);
      workspace.addEventListener('change', handleWorkspaceChange);
      workspace.addEventListener('click', handleWorkspaceClick);
      return () => {
        workspace.removeEventListener('input', handleWorkspaceInput);
        workspace.removeEventListener('change', handleWorkspaceChange);
        workspace.removeEventListener('click', handleWorkspaceClick);
      };
    };

    const cleanupListeners = attachListeners();

    return () => {
      clearTimeout(initTimer);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      cleanupListeners();
      dismissToast(`toast-key-${CALCULATION_TOAST_DEDUPE_KEY}`);
    };
  }, [tool.id, resetKey, showToast, dismissToast]);
}
