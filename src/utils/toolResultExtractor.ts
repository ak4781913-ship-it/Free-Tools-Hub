/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Universal Tool Result Extractor
 * Extracts clean, human-readable result text from any tool's output workspace
 * for instant one-click copying to the user's system clipboard.
 */

export interface ToolResultExtract {
  text: string;
  summary: string;
  charCount: number;
}

/**
 * Safely copies text to the system clipboard across modern and legacy browser contexts
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text || text.trim() === '') return false;

  // 1. Modern Async Clipboard API (Secure Context)
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('[ToolResultExtractor] navigator.clipboard failed, attempting fallback:', err);
  }

  // 2. Fallback using temporary textarea execCommand
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('[ToolResultExtractor] Clipboard copy fallback failed:', err);
    return false;
  }
}

/**
 * Extracts result text from the active tool based on tool ID, local storage, or DOM inspection
 */
export function extractToolResultText(toolId: string, toolName: string): ToolResultExtract | null {
  const workspace = document.getElementById('tool-workspace-content') || document.body;

  // -------------------------------------------------------------
  // Tool-Specific High-Fidelity Extractors
  // -------------------------------------------------------------

  // 1. CV / Resume Maker
  if (toolId === 'resume-builder' || toolId === 'cv-maker') {
    const printableArea = document.getElementById('printable-resume-area');
    if (printableArea && printableArea.innerText?.trim()) {
      const cleanText = printableArea.innerText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join('\n');
      return {
        text: cleanText,
        summary: cleanText.slice(0, 80),
        charCount: cleanText.length,
      };
    }
    const saved = localStorage.getItem('freetools_resume_saved');
    if (saved) {
      try {
        const d = JSON.parse(saved);
        const lines: string[] = [];
        if (d.personalInfo?.fullName) lines.push(d.personalInfo.fullName);
        if (d.personalInfo?.jobTitle) lines.push(d.personalInfo.jobTitle);
        const contact = [d.personalInfo?.email, d.personalInfo?.phone, d.personalInfo?.location].filter(Boolean).join(' | ');
        if (contact) lines.push(contact);
        if (d.personalInfo?.summary) lines.push('\nPROFESSIONAL SUMMARY\n' + d.personalInfo.summary);
        if (Array.isArray(d.skills) && d.skills.length > 0) lines.push('\nKEY SKILLS\n' + d.skills.join(', '));
        const full = lines.join('\n');
        if (full.trim()) {
          return { text: full, summary: full.slice(0, 80), charCount: full.length };
        }
      } catch {}
    }
  }

  // 2. Gemini Photo Prompt Generator
  if (toolId === 'gemini-photo-prompt' || toolId === 'photo-prompts') {
    const savedText = localStorage.getItem('ft_photo_prompt_text');
    if (savedText && savedText.trim()) {
      return { text: savedText, summary: savedText.slice(0, 80), charCount: savedText.length };
    }
    const promptTextarea = workspace.querySelector<HTMLTextAreaElement>('textarea');
    if (promptTextarea && promptTextarea.value?.trim()) {
      return { text: promptTextarea.value, summary: promptTextarea.value.slice(0, 80), charCount: promptTextarea.value.length };
    }
  }

  // 3. AI Video Prompt Generator
  if (toolId === 'ai-video-prompt' || toolId === 'video-prompts') {
    const savedOutput = localStorage.getItem('ft_video_prompt_output');
    if (savedOutput && savedOutput.trim()) {
      return { text: savedOutput, summary: savedOutput.slice(0, 80), charCount: savedOutput.length };
    }
    const codeEl = workspace.querySelector('pre, code');
    if (codeEl && codeEl.textContent?.trim()) {
      return { text: codeEl.textContent.trim(), summary: codeEl.textContent.trim().slice(0, 80), charCount: codeEl.textContent.trim().length };
    }
  }

  // 4. UAE Gratuity Calculator
  if (toolId === 'uae-gratuity') {
    // Look for net gratuity badge & breakdown cards
    const statCards = Array.from(workspace.querySelectorAll<HTMLElement>('.bg-slate-900, .bg-indigo-600, .border, .stat-card'));
    const resultLines: string[] = ['--- UAE END-OF-SERVICE GRATUITY CALCULATION ---'];
    
    // Check for AED amount
    const aedEl = workspace.querySelector('.text-3xl, .text-4xl, .text-5xl');
    if (aedEl && aedEl.textContent) {
      resultLines.push(`Estimated Net Gratuity: ${aedEl.textContent.trim()}`);
    }

    statCards.forEach((card) => {
      const heading = card.querySelector('h3, h4, .text-xs, .text-sm, span');
      const val = card.querySelector('.text-lg, .text-xl, .text-2xl, strong, p');
      if (heading && val && heading.textContent && val.textContent) {
        const h = heading.textContent.trim().replace(/[*:]/g, '');
        const v = val.textContent.trim();
        if (h && v && h !== v && h.length < 40 && v.length < 80 && !resultLines.some(l => l.includes(h))) {
          resultLines.push(`${h}: ${v}`);
        }
      }
    });

    if (resultLines.length > 1) {
      const text = resultLines.join('\n');
      return { text, summary: text.slice(0, 80), charCount: text.length };
    }
  }

  // 4b. UAE Salary Calculator
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
        const gross = basic + housing + transport + other;
        const unpaidDed = (gross / 30) * unpaidDays;
        const pensionDed = d.includeUAEGPSSA ? gross * 0.05 : 0;
        const net = Math.max(0, gross - fixedDed - unpaidDed - pensionDed);
        const fmt = (n: number) => `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const text = [
          'UAE Monthly Salary Breakdown (FreeTools Hub)',
          `Basic Salary: ${fmt(basic)}`,
          `Allowances (Housing + Transport + Other): ${fmt(housing + transport + other)}`,
          `Gross Monthly Salary: ${fmt(gross)}`,
          `Total Deductions: ${fmt(fixedDed + unpaidDed + pensionDed)}`,
          `Estimated Net Monthly Take-Home: ${fmt(net)}`,
          `Estimated Annual Net Package: ${fmt(net * 12)}`,
        ].join('\n');
        return { text, summary: `Net Monthly: ${fmt(net)}`, charCount: text.length };
      } catch {}
    }
  }

  // 5. JSON Formatter
  if (toolId === 'json-formatter') {
    const draft = localStorage.getItem('ft_json_formatter_draft');
    if (draft && draft.trim()) {
      try {
        const parsed = JSON.parse(draft);
        const formatted = JSON.stringify(parsed, null, 2);
        return { text: formatted, summary: formatted.slice(0, 80), charCount: formatted.length };
      } catch {
        return { text: draft, summary: draft.slice(0, 80), charCount: draft.length };
      }
    }
  }

  // 6. Text Case Converter
  if (toolId === 'text-case-converter') {
    const textareas = workspace.querySelectorAll('textarea');
    if (textareas.length > 0) {
      const target = textareas[textareas.length - 1];
      if (target && target.value.trim()) {
        return { text: target.value, summary: target.value.slice(0, 80), charCount: target.value.length };
      }
    }
  }

  // 7. Password Generator
  if (toolId === 'password-generator') {
    const pwInputs = workspace.querySelectorAll<HTMLElement>('input[type="text"], input[readonly], .font-mono');
    for (const inp of Array.from(pwInputs)) {
      const val = inp instanceof HTMLInputElement ? inp.value : inp.textContent;
      if (val && val.length >= 8 && !val.includes(' ') && !val.includes('http')) {
        return { text: val.trim(), summary: `Password: ${val.trim()}`, charCount: val.trim().length };
      }
    }
  }

  // 8. Markdown Editor
  if (toolId === 'markdown-editor') {
    const draft = localStorage.getItem('ft_markdown_draft');
    if (draft && draft.trim()) {
      return { text: draft, summary: draft.slice(0, 80), charCount: draft.length };
    }
  }

  // 9. Word Counter
  if (toolId === 'word-counter') {
    const statCards = Array.from(workspace.querySelectorAll<HTMLElement>('.border, .stat-card'));
    const metrics: string[] = ['--- WORD COUNTER ANALYSIS ---'];
    statCards.forEach((c) => {
      const label = c.querySelector('h3, h4, .text-xs, span');
      const val = c.querySelector('.text-xl, .text-2xl, strong');
      if (label && val && label.textContent && val.textContent) {
        metrics.push(`${label.textContent.trim()}: ${val.textContent.trim()}`);
      }
    });
    const draft = localStorage.getItem('ft_wordcounter_text');
    if (draft) {
      metrics.push('\n--- DOCUMENT TEXT ---\n' + draft);
    }
    if (metrics.length > 1) {
      const full = metrics.join('\n');
      return { text: full, summary: full.slice(0, 80), charCount: full.length };
    }
  }

  // 10. QR Code Generator
  if (toolId === 'qr-generator' || toolId === 'qrcode-generator') {
    const input = workspace.querySelector<HTMLInputElement | HTMLTextAreaElement>('input[type="text"], input[type="url"], textarea');
    if (input && input.value.trim()) {
      return {
        text: input.value.trim(),
        summary: `QR Content: ${input.value.trim().slice(0, 60)}`,
        charCount: input.value.trim().length,
      };
    }
  }

  // 11. Base64 Converter
  if (toolId === 'base64-converter') {
    const textareas = workspace.querySelectorAll('textarea');
    if (textareas.length >= 2) {
      const outputArea = textareas[1];
      if (outputArea && outputArea.value.trim()) {
        return { text: outputArea.value, summary: outputArea.value.slice(0, 80), charCount: outputArea.value.length };
      }
    }
  }

  // -------------------------------------------------------------
  // Universal DOM Result Extraction Strategy
  // -------------------------------------------------------------

  // Priority A: Elements with explicit result markup
  const explicitResults = workspace.querySelectorAll<HTMLElement>(
    '[data-result-area="true"], [data-result], [data-tool-result], .tool-result-area, .result-content, output'
  );
  if (explicitResults.length > 0) {
    const collected: string[] = [];
    explicitResults.forEach((el) => {
      const t = el.innerText?.trim();
      if (t) collected.push(t);
    });
    if (collected.length > 0) {
      const full = collected.join('\n\n');
      return { text: full, summary: full.slice(0, 80), charCount: full.length };
    }
  }

  // Priority B: Preformatted blocks (pre, code)
  const preElements = workspace.querySelectorAll<HTMLElement>('pre, code');
  for (const el of Array.from(preElements)) {
    const txt = el.innerText?.trim();
    if (txt && txt.length > 5) {
      return { text: txt, summary: txt.slice(0, 80), charCount: txt.length };
    }
  }

  // Priority C: Prominent Metric / Result Cards
  const resultCards = Array.from(workspace.querySelectorAll<HTMLElement>('.text-2xl, .text-3xl, .text-4xl'));
  if (resultCards.length > 0) {
    const lines: string[] = [`--- ${toolName.toUpperCase()} RESULTS ---`];
    resultCards.forEach((rc) => {
      const parent = rc.closest('.border, .rounded-xl, .rounded-2xl, [role="region"], div');
      if (parent) {
        const heading = parent.querySelector('h2, h3, h4, .text-xs, .text-sm, span');
        const hText = heading?.textContent?.trim().replace(/[*:]/g, '') || 'Result';
        const vText = rc.textContent?.trim() || '';
        if (hText && vText && hText !== vText && !lines.some((l) => l.includes(vText))) {
          lines.push(`${hText}: ${vText}`);
        }
      }
    });

    if (lines.length > 1) {
      const full = lines.join('\n');
      return { text: full, summary: full.slice(0, 80), charCount: full.length };
    }
  }

  // Priority D: Textareas inside workspace (often contains transformed or generated output)
  const allTextareas = workspace.querySelectorAll<HTMLTextAreaElement>('textarea');
  if (allTextareas.length > 0) {
    const target = allTextareas[allTextareas.length - 1];
    if (target && target.value?.trim()) {
      return { text: target.value, summary: target.value.slice(0, 80), charCount: target.value.length };
    }
  }

  return null;
}
