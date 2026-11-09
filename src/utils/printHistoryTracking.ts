/**
 * Utility to track and manage the last 5 documents generated or printed across tools.
 * Data is stored purely client-side in localStorage and dispatches change events.
 */

export interface PrintHistoryItem {
  id: string;
  title: string;
  toolId: string;
  toolName: string;
  timestamp: string; // ISO 8601
  formattedDate: string;
  format: string; // e.g. "A4 Vector PDF", "Browser Print", "Official Statement", "Technical Report"
  summary?: string;
  details?: Record<string, string | number>;
}

const STORAGE_KEY = 'freetools_hub_print_history';
const MAX_HISTORY_ITEMS = 5;
const CHANGE_EVENT_NAME = 'freetools_print_history_changed';

/**
 * Formats date into readable string e.g. "Oct 19, 2026 • 12:45 PM"
 */
function formatDateTime(date: Date): string {
  try {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' • ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return date.toISOString().slice(0, 16).replace('T', ' ');
  }
}

/**
 * Retrieves the stored print history array (up to 5 items, newest first).
 */
export function getPrintHistory(): PrintHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_HISTORY_ITEMS);
  } catch (err) {
    console.warn('Failed to parse print history from localStorage:', err);
    return [];
  }
}

/**
 * Adds a new document to the print history. Enforces the 5-document limit.
 * Dispatches a custom event so UI updates immediately.
 */
export function recordPrintDocument(
  toolId: string,
  title: string,
  options?: {
    toolName?: string;
    format?: string;
    summary?: string;
    details?: Record<string, string | number>;
  }
): PrintHistoryItem[] {
  const now = new Date();
  const newItem: PrintHistoryItem = {
    id: `print_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: title.trim() || 'Untitled Document',
    toolId,
    toolName: options?.toolName || getDefaultToolName(toolId),
    timestamp: now.toISOString(),
    formattedDate: formatDateTime(now),
    format: options?.format || 'A4 Document / Print',
    summary: options?.summary,
    details: options?.details,
  };

  try {
    const existing = getPrintHistory();
    // Avoid exact duplicate within 2 seconds
    const isRecentDuplicate = existing.length > 0 &&
      existing[0].title === newItem.title &&
      existing[0].toolId === newItem.toolId &&
      Date.now() - new Date(existing[0].timestamp).getTime() < 2500;

    if (isRecentDuplicate) {
      return existing;
    }

    const updated = [newItem, ...existing.filter((item) => item.id !== newItem.id)].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch update event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT_NAME, { detail: updated }));
    }

    return updated;
  } catch (err) {
    console.warn('Failed to save print history item:', err);
    return getPrintHistory();
  }
}

/**
 * Removes a specific document from print history by ID.
 */
export function removePrintDocument(id: string): PrintHistoryItem[] {
  try {
    const existing = getPrintHistory();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT_NAME, { detail: updated }));
    }

    return updated;
  } catch (err) {
    console.warn('Failed to delete print history item:', err);
    return getPrintHistory();
  }
}

/**
 * Clears all print history records.
 */
export function clearPrintHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT_NAME, { detail: [] }));
    }
  } catch (err) {
    console.warn('Failed to clear print history:', err);
  }
}

/**
 * Subscribes to print history change events across components.
 */
export function subscribeToPrintHistory(callback: (items: PrintHistoryItem[]) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = () => {
    callback(getPrintHistory());
  };

  window.addEventListener(CHANGE_EVENT_NAME, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(CHANGE_EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
}

/**
 * Seeds sample print records for quick demonstration and testing.
 */
export function seedSamplePrintHistory(): PrintHistoryItem[] {
  const now = Date.now();
  const samples: PrintHistoryItem[] = [
    {
      id: `print_sample_1`,
      title: 'Muhammad Usman - Senior Full-Stack Engineer CV',
      toolId: 'resume-builder',
      toolName: 'CV & Resume Generator',
      timestamp: new Date(now - 1000 * 60 * 25).toISOString(), // 25 mins ago
      formattedDate: formatDateTime(new Date(now - 1000 * 60 * 25)),
      format: 'A4 Vector PDF',
      summary: '8+ yrs exp • React, TypeScript, Node.js • 3 projects & education details',
    },
    {
      id: `print_sample_2`,
      title: 'UAE Gratuity Statement - 15,000 AED / 3.5 Years',
      toolId: 'uae-gratuity',
      toolName: 'UAE Gratuity Calculator',
      timestamp: new Date(now - 1000 * 60 * 180).toISOString(), // 3 hours ago
      formattedDate: formatDateTime(new Date(now - 1000 * 60 * 180)),
      format: 'Official Calculation Statement',
      summary: 'Private Sector Limited Contract • Resignation • Total Gratuity: 36,750 AED',
    },
    {
      id: `print_sample_3`,
      title: 'Q4 Product Roadmap & API Architecture Specs',
      toolId: 'markdown-editor',
      toolName: 'Markdown Editor',
      timestamp: new Date(now - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      formattedDate: formatDateTime(new Date(now - 1000 * 60 * 60 * 24)),
      format: 'A4 Document / Print',
      summary: '1,420 words • 8 section headers • Styled markdown documentation',
    },
    {
      id: `print_sample_4`,
      title: 'SEO Audit Report - pulseanalytics.io',
      toolId: 'seo-page-analyzer',
      toolName: 'SEO Page Analyzer',
      timestamp: new Date(now - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      formattedDate: formatDateTime(new Date(now - 1000 * 60 * 60 * 48)),
      format: 'Technical PDF Audit Report',
      summary: 'Health Score: 94% • 0 Critical Issues • Full Meta & Headings Breakdown',
    },
  ];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT_NAME, { detail: samples }));
    }
  } catch {
    // ignore
  }

  return samples;
}

/**
 * Exports the 5-item print history to a CSV file for personal records.
 */
export function downloadPrintHistoryCSV(history?: PrintHistoryItem[]): void {
  const items = history || getPrintHistory();
  const headers = ['Document Title', 'Tool Name', 'Tool ID', 'Format', 'Printed Date & Time', 'Summary'];
  const rows = items.map((item) => [
    `"${item.title.replace(/"/g, '""')}"`,
    `"${item.toolName.replace(/"/g, '""')}"`,
    `"${item.toolId}"`,
    `"${item.format.replace(/"/g, '""')}"`,
    `"${item.formattedDate}"`,
    `"${(item.summary || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `print_history_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function getDefaultToolName(toolId: string): string {
  switch (toolId) {
    case 'resume-builder':
      return 'CV & Resume Generator';
    case 'markdown-editor':
      return 'Markdown Editor';
    case 'uae-gratuity':
      return 'UAE Gratuity Calculator';
    case 'seo-page-analyzer':
      return 'SEO Page Analyzer';
    case 'word-counter':
      return 'Word & Character Counter';
    case 'ai-video-prompt':
      return 'AI Video Production Script';
    case 'gemini-photo-prompt':
      return 'Photo Prompt Studio';
    default:
      return 'Online Utility';
  }
}
