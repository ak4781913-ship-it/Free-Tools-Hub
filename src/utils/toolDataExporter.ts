/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Universal Tool Data Exporter for FreeTools Hub
 * Extracts input states, drafts, and computed results from any active tool page
 * and formats them into clean, standardized JSON or RFC 4180 CSV files with UTF-8 BOM.
 * 100% client-side: zero telemetry, zero server-side transmission.
 */

import { getSiteBaseUrl } from './seoManager';

export interface ExtractedDataResult {
  toolId: string;
  toolName: string;
  exportedAt: string;
  timestamp: number;
  source: string;
  inputs: Record<string, any>;
  results: Record<string, any>;
  rawStructuredData?: any;
  hasData: boolean;
  fieldCount: number;
}

export interface ExportExecutionResult {
  success: boolean;
  reason?: 'NO_DATA' | 'ERROR';
  filename?: string;
  format?: 'json' | 'csv';
  fieldCount?: number;
  errorMessage?: string;
}

/**
 * Escape CSV cell following RFC 4180 with quote doubling
 */
function escapeCSVCell(val: any): string {
  if (val === null || val === undefined) return '""';
  if (typeof val === 'object') {
    val = JSON.stringify(val);
  }
  const str = String(val).trim();
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Formats a date into a safe, human-readable filename segment (e.g. 2026-10-23_14-30)
 */
function formatDateForFilename(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}_${hh}${mm}`;
}

/**
 * Normalizes tool name or ID for a filesystem-safe filename
 */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Inspects a DOM element to derive a clear, friendly human label for an input field
 */
function deriveFieldLabel(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, index: number): string {
  // 1. Explicit id with <label for="...">
  if (element.id) {
    const label = document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
    if (label && label.textContent?.trim()) {
      return label.textContent.trim().replace(/[*:]/g, '').replace(/\s+/g, ' ');
    }
  }

  // 2. Enclosing parent <label>
  const parentLabel = element.closest('label');
  if (parentLabel && parentLabel.textContent) {
    // Clone without input to get text
    const text = Array.from(parentLabel.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE || (n as HTMLElement).tagName !== element.tagName)
      .map((n) => n.textContent)
      .join(' ')
      .trim();
    if (text) {
      return text.replace(/[*:]/g, '').replace(/\s+/g, ' ');
    }
  }

  // 3. Preceding sibling label or span
  let prev = element.previousElementSibling;
  while (prev) {
    if (
      prev.tagName === 'LABEL' ||
      prev.classList.contains('font-semibold') ||
      prev.classList.contains('font-medium') ||
      prev.classList.contains('text-xs') ||
      prev.classList.contains('text-sm')
    ) {
      const text = prev.textContent?.trim();
      if (text && text.length < 60) {
        return text.replace(/[*:]/g, '').replace(/\s+/g, ' ');
      }
    }
    prev = prev.previousElementSibling;
  }

  // 4. Look in parent's previous sibling
  const parentPrev = element.parentElement?.previousElementSibling;
  if (parentPrev && (parentPrev.tagName === 'LABEL' || parentPrev.classList.contains('text-sm') || parentPrev.classList.contains('font-medium'))) {
    const text = parentPrev.textContent?.trim();
    if (text && text.length < 60) {
      return text.replace(/[*:]/g, '').replace(/\s+/g, ' ');
    }
  }

  // 5. aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim()) {
    return ariaLabel.trim().replace(/[*:]/g, '');
  }

  // 6. placeholder
  const placeholder = element.getAttribute('placeholder');
  if (placeholder && placeholder.trim() && placeholder.length < 40) {
    return placeholder.trim();
  }

  // 7. name or id attribute
  const name = element.getAttribute('name') || element.id;
  if (name) {
    // Convert camelCase or snake_case to Title Case
    return name
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return `Field ${index + 1}`;
}

/**
 * Extracts all input states, structured tool models, and computed results from the active tool
 */
export function extractToolData(toolId: string, toolName: string): ExtractedDataResult {
  const inputs: Record<string, any> = {};
  const results: Record<string, any> = {};
  let rawStructuredData: any = null;
  let fieldCount = 0;

  // 1. Tool-Specific Storage Check (Highest fidelity)
  try {
    if (toolId === 'resume-builder' || toolId === 'cv-maker') {
      const saved = localStorage.getItem('freetools_resume_saved');
      if (saved) {
        rawStructuredData = JSON.parse(saved);
        if (rawStructuredData?.personalInfo) {
          const pi = rawStructuredData.personalInfo;
          if (pi.fullName) inputs['Full Name'] = pi.fullName;
          if (pi.jobTitle) inputs['Target Job Title'] = pi.jobTitle;
          if (pi.email) inputs['Email Address'] = pi.email;
          if (pi.phone) inputs['Phone Number'] = pi.phone;
          if (pi.location) inputs['Location / City'] = pi.location;
          if (pi.summary) inputs['Professional Summary'] = pi.summary;
          if (pi.linkedin) inputs['LinkedIn URL'] = pi.linkedin;
          if (pi.website) inputs['Portfolio / Website'] = pi.website;
        }
        if (Array.isArray(rawStructuredData?.experience) && rawStructuredData.experience.length > 0) {
          inputs['Work Experience Count'] = rawStructuredData.experience.length;
        }
        if (Array.isArray(rawStructuredData?.education) && rawStructuredData.education.length > 0) {
          inputs['Education Entries Count'] = rawStructuredData.education.length;
        }
        if (Array.isArray(rawStructuredData?.skills) && rawStructuredData.skills.length > 0) {
          inputs['Skills Listed'] = rawStructuredData.skills.join(', ');
        }
      }
    } else if (toolId === 'gemini-photo-prompt' || toolId === 'photo-prompts') {
      const savedInputs = localStorage.getItem('ft_photo_prompt_inputs');
      const savedText = localStorage.getItem('ft_photo_prompt_text');
      if (savedInputs) {
        rawStructuredData = JSON.parse(savedInputs);
        Object.entries(rawStructuredData).forEach(([k, v]) => {
          if (v) inputs[k] = v;
        });
      }
      if (savedText) {
        results['Generated Photo Prompt'] = savedText;
      }
    } else if (toolId === 'ai-video-prompt' || toolId === 'video-prompts') {
      const savedInputs = localStorage.getItem('ft_video_prompt_inputs');
      const savedOutput = localStorage.getItem('ft_video_prompt_output');
      if (savedInputs) {
        rawStructuredData = JSON.parse(savedInputs);
        Object.entries(rawStructuredData).forEach(([k, v]) => {
          if (v) inputs[k] = v;
        });
      }
      if (savedOutput) {
        results['Generated Video Prompt Script'] = savedOutput;
      }
    } else if (toolId === 'json-formatter') {
      const draft = localStorage.getItem('ft_json_formatter_draft');
      if (draft && draft.trim()) {
        try {
          rawStructuredData = JSON.parse(draft);
          inputs['JSON Document Content'] = draft;
        } catch {
          inputs['JSON Raw Content'] = draft;
        }
      }
    } else if (toolId === 'markdown-editor') {
      const draft = localStorage.getItem('ft_markdown_draft');
      if (draft && draft.trim()) {
        inputs['Markdown Document Content'] = draft;
      }
    } else if (toolId === 'word-counter') {
      const draft = localStorage.getItem('ft_wordcounter_text');
      if (draft && draft.trim()) {
        inputs['Document Text Content'] = draft;
      }
    }
  } catch (err) {
    console.warn('[ToolDataExporter] Error reading local drafts:', err);
  }

  // 2. DOM Form Extraction inside Tool Workspace
  const workspace = document.getElementById('tool-workspace-content') || document.querySelector('main') || document.body;
  if (workspace) {
    // Query interactive inputs
    const elements = workspace.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]), textarea, select'
    );

    let index = 0;
    elements.forEach((el) => {
      // Skip global header search input or modal inputs
      if (el.id === 'global-search-input' || el.closest('#share-modal') || el.closest('#tour-modal')) {
        return;
      }

      const label = deriveFieldLabel(el, index++);
      let value: any = null;

      if (el instanceof HTMLInputElement) {
        if (el.type === 'checkbox') {
          value = el.checked;
        } else if (el.type === 'radio') {
          if (el.checked) {
            value = el.value || 'Selected';
          } else {
            return; // Only capture checked radio button
          }
        } else if (el.type === 'number' || el.type === 'range') {
          value = el.value !== '' ? Number(el.value) : '';
        } else {
          value = el.value.trim();
        }
      } else if (el instanceof HTMLSelectElement) {
        const selectedOpt = el.options[el.selectedIndex];
        value = selectedOpt ? selectedOpt.text.trim() : el.value;
      } else if (el instanceof HTMLTextAreaElement) {
        value = el.value.trim();
      }

      // Check if value is meaningful
      if (value !== null && value !== '' && value !== undefined) {
        // Disambiguate duplicate labels
        let key = label;
        if (inputs[key] !== undefined && inputs[key] !== value) {
          key = `${label} (${el.name || el.id || index})`;
        }
        inputs[key] = value;
      }
    });

    // 3. Extract computed results / stat badges if visible in workspace
    const statCards = workspace.querySelectorAll<HTMLElement>(
      '[data-result], [data-metric], .stat-card, [role="region"]'
    );
    statCards.forEach((card) => {
      const heading = card.querySelector('h2, h3, h4, .text-xs, .text-sm, span');
      const val = card.querySelector('.text-xl, .text-2xl, .text-3xl, .font-bold, strong, p');
      if (heading && val && heading.textContent && val.textContent) {
        const hText = heading.textContent.trim().replace(/[*:]/g, '');
        const vText = val.textContent.trim();
        if (hText && vText && hText !== vText && !results[hText] && hText.length < 50 && vText.length < 100) {
          results[hText] = vText;
        }
      }
    });
  }

  // Count detected fields
  fieldCount = Object.keys(inputs).length + Object.keys(results).length;
  if (rawStructuredData && typeof rawStructuredData === 'object') {
    fieldCount += Object.keys(rawStructuredData).length;
  }

  const hasData = fieldCount > 0;

  return {
    toolId,
    toolName,
    exportedAt: new Date().toISOString(),
    timestamp: Date.now(),
    source: getSiteBaseUrl() ? `FreeTools Hub (${getSiteBaseUrl()})` : 'FreeTools Hub',
    inputs,
    results,
    rawStructuredData,
    hasData,
    fieldCount,
  };
}

/**
 * Triggers a browser download of a generated Blob
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Exports current tool data as a formatted JSON file
 */
export function exportDataAsJson(toolId: string, toolName: string): ExportExecutionResult {
  try {
    const data = extractToolData(toolId, toolName);
    if (!data.hasData) {
      return {
        success: false,
        reason: 'NO_DATA',
      };
    }

    const exportPayload = {
      exportMetadata: {
        toolId: data.toolId,
        toolName: data.toolName,
        exportedAt: data.exportedAt,
        source: data.source,
        format: 'JSON (Application Data Backup)',
        fieldsCount: data.fieldCount,
        license: 'FreeTools Hub (Open Browser Utility - 100% Client-Side)',
      },
      inputs: data.inputs,
      results: Object.keys(data.results).length > 0 ? data.results : undefined,
      structuredData: data.rawStructuredData || undefined,
    };

    const jsonString = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const filename = `${sanitizeFilename(toolName)}_data_${formatDateForFilename()}.json`;

    triggerDownload(blob, filename);

    return {
      success: true,
      filename,
      format: 'json',
      fieldCount: data.fieldCount,
    };
  } catch (err: any) {
    console.error('[ToolDataExporter] JSON Export failed:', err);
    return {
      success: false,
      reason: 'ERROR',
      errorMessage: err?.message || 'Unknown error during JSON export',
    };
  }
}

/**
 * Exports current tool data as an RFC 4180 compliant CSV spreadsheet file with UTF-8 BOM
 */
export function exportDataAsCsv(toolId: string, toolName: string): ExportExecutionResult {
  try {
    const data = extractToolData(toolId, toolName);
    if (!data.hasData) {
      return {
        success: false,
        reason: 'NO_DATA',
      };
    }

    const rows: string[][] = [
      // Metadata Header Block
      ['FreeTools Hub - Data Export', '', ''],
      ['Tool Name', data.toolName, ''],
      ['Tool Identifier', data.toolId, ''],
      ['Exported At (UTC)', data.exportedAt, ''],
      ['Platform Source', data.source, ''],
      ['Privacy & Security', '100% Client-Side Processed in Browser', ''],
      ['', '', ''],

      // Section: Form Inputs
      ['SECTION', 'INPUT FIELD / PARAMETER', 'VALUE'],
    ];

    // Append inputs
    const inputEntries = Object.entries(data.inputs);
    if (inputEntries.length > 0) {
      inputEntries.forEach(([field, val]) => {
        let displayVal = val;
        if (typeof val === 'boolean') {
          displayVal = val ? 'Yes / Enabled' : 'No / Disabled';
        } else if (typeof val === 'object' && val !== null) {
          displayVal = JSON.stringify(val);
        }
        rows.push(['Input', field, String(displayVal)]);
      });
    } else {
      rows.push(['Input', 'No direct form inputs', 'N/A']);
    }

    // Section: Calculated Results (if any)
    const resultEntries = Object.entries(data.results);
    if (resultEntries.length > 0) {
      rows.push(['', '', '']);
      rows.push(['SECTION', 'CALCULATED RESULT / METRIC', 'OUTPUT VALUE']);
      resultEntries.forEach(([metric, val]) => {
        rows.push(['Result', metric, String(val)]);
      });
    }

    // Special handling for structured sub-collections (e.g. Resume Builder)
    if (data.rawStructuredData) {
      const raw = data.rawStructuredData;

      // Work Experience Table
      if (Array.isArray(raw.experience) && raw.experience.length > 0) {
        rows.push(['', '', '']);
        rows.push(['EXPERIENCE HISTORY', 'ROLE / EMPLOYER', 'TIMELINE & DETAILS']);
        raw.experience.forEach((exp: any, i: number) => {
          rows.push([
            `Position #${i + 1}`,
            `${exp.position || 'N/A'} at ${exp.company || 'N/A'}`,
            `${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''} | ${exp.description || ''}`,
          ]);
        });
      }

      // Education Table
      if (Array.isArray(raw.education) && raw.education.length > 0) {
        rows.push(['', '', '']);
        rows.push(['EDUCATION HISTORY', 'DEGREE / INSTITUTION', 'TIMELINE & DETAILS']);
        raw.education.forEach((edu: any, i: number) => {
          rows.push([
            `Degree #${i + 1}`,
            `${edu.degree || 'N/A'} at ${edu.institution || 'N/A'}`,
            `${edu.year || ''} | ${edu.location || ''} | ${edu.grade || ''}`,
          ]);
        });
      }

      // Skills
      if (Array.isArray(raw.skills) && raw.skills.length > 0) {
        rows.push(['', '', '']);
        rows.push(['SKILLS & PROFICIENCIES', 'ITEM', 'VALUE']);
        raw.skills.forEach((skill: any, i: number) => {
          rows.push(['Skill', `Skill #${i + 1}`, typeof skill === 'string' ? skill : skill.name || JSON.stringify(skill)]);
        });
      }

      // Projects
      if (Array.isArray(raw.projects) && raw.projects.length > 0) {
        rows.push(['', '', '']);
        rows.push(['PROJECTS', 'TITLE', 'DESCRIPTION & URL']);
        raw.projects.forEach((proj: any, i: number) => {
          rows.push(['Project', proj.title || `Project #${i + 1}`, `${proj.description || ''} ${proj.url ? `(${proj.url})` : ''}`]);
        });
      }
    }

    // Convert to CSV string with \r\n line endings and UTF-8 BOM
    const csvContent = '\uFEFF' + rows.map((r) => r.map(escapeCSVCell).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `${sanitizeFilename(toolName)}_data_${formatDateForFilename()}.csv`;

    triggerDownload(blob, filename);

    return {
      success: true,
      filename,
      format: 'csv',
      fieldCount: data.fieldCount,
    };
  } catch (err: any) {
    console.error('[ToolDataExporter] CSV Export failed:', err);
    return {
      success: false,
      reason: 'ERROR',
      errorMessage: err?.message || 'Unknown error during CSV export',
    };
  }
}
