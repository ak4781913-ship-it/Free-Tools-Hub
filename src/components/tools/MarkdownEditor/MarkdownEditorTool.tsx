import React, { useState, useEffect, useMemo, useRef } from 'react';
import { marked } from 'marked';
import { useLanguage } from '../../../context/LanguageContext';
import { Print } from '../../common/Print';
import {
  FileText,
  Copy,
  Download,
  RotateCcw,
  CheckCircle,
  Eye,
  Edit3,
  Columns,
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Code,
  FileCode,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  Sparkles,
  Maximize2,
  Minimize2,
  FileDown,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { downloadMarkdownPDF } from '../../../utils/markdownPdfGenerator';
import { useAutoSave, formatSavedTime } from '../../../utils/useAutoSave';
import { sanitizeHtml } from '../../../utils/sanitizeHtml';

const SAMPLE_MARKDOWN = `# Project Title

A clean, modern, and high-performance application built for developers and creators.

## ✨ Features

- **Split-Screen Live Preview:** Instant rendered output as you type.
- **Rich Formatting Toolbar:** Headings, lists, tables, code blocks, and math.
- **Privacy First:** 100% in-browser processing with zero server telemetry.
- **Export Options:** Download as \`.md\`, HTML document, or print to PDF.

---

## 🚀 Quick Start

To install dependencies and start the local development server:

\`\`\`bash
# Clone the repository
git clone https://github.com/example/project.git

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

## 📊 Feature Comparison Table

| Feature | FreeTools Hub | Standard Utilities |
| :--- | :--- | :--- |
| **Live Markdown** | ✅ Instant Split View | ❌ Basic Editor |
| **Data Privacy** | ✅ Browser Sandboxed | ⚠️ Cloud Uploaded |
| **Export Formats** | ✅ MD, HTML, Print PDF | ❌ Plain Text Only |

## 💡 Code Example

\`\`\`typescript
interface UserProfile {
  id: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
}

export function formatGreeting(user: UserProfile): string {
  return \`Welcome back, \${user.name} (\${user.role})!\`;
}
\`\`\`

> "Simplicity is prerequisite for reliability."  
> — *Edsger W. Dijkstra*

### ✅ Next Steps

- [x] Implement split-screen real-time renderer
- [x] Add GitHub Flavored Markdown (GFM) tables
- [x] Configure one-click clipboard copying and file export
- [ ] Share with development team
`;

const TEMPLATES = {
  readme: SAMPLE_MARKDOWN,
  doc: `# API Documentation: UserService

## Overview
The \`UserService\` handles authentication, user profiles, and permission validations.

### Endpoints

#### 1. \`GET /api/v1/users\`
Returns a paginated list of active users.

**Headers:**
\`\`\`http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
\`\`\`

**Response:**
\`\`\`json
{
  "status": "success",
  "data": [
    { "id": "usr_101", "name": "Sarah Connor", "active": true }
  ]
}
\`\`\`
`,
  blog: `# Building Scalable Web Tools with React & Vite

Published on October 13, 2026 • 5 min read

### Introduction
Modern web utility applications require blazing-fast startup times, immediate feedback, and client-side privacy.

### Key Architectural Decisions
1. **Zero-Backend Processing:** Perform all transforms, calculations, and conversions directly in the browser.
2. **Accessible Keyboard Navigation:** Ensure power users can navigate efficiently.
3. **Resilient Offline Fallbacks:** Keep utilities operational even in disconnected environments.

### Conclusion
By prioritizing speed, design restraint, and privacy, developer tools become indispensable companions.
`,
  cheatsheet: `# Markdown Cheat Sheet

# H1 Heading
## H2 Heading
### H3 Heading

**Bold Text** or __Bold Text__  
*Italic Text* or _Italic Text_  
~~Strikethrough~~

* Unordered List Item 1
* Unordered List Item 2
  * Nested Item

1. Ordered Item 1
2. Ordered Item 2

- [x] Completed task
- [ ] Incomplete task

[Link Text](https://example.com)
![Image Alt](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400 "Abstract Art")

> Blockquote block with important advice.

\`Inline Code\`

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

| Header 1 | Header 2 |
| :--- | :--- |
| Cell A | Cell B |
`,
};

export const MarkdownEditorTool: React.FC = () => {
  const { language } = useLanguage();

  const {
    data: markdown,
    setData: setMarkdown,
    lastSaved,
    isSaving,
    hasSavedDraft,
    clearDraft,
    restoreBackup,
  } = useAutoSave<string>('ft_markdown_draft', SAMPLE_MARKDOWN, 300);

  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [copiedType, setCopiedType] = useState<'md' | 'html' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [showPdfMenu, setShowPdfMenu] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Render markdown to sanitized HTML (export-grade and preview-grade)
  const { exportSafeHtml, previewSafeHtml } = useMemo(() => {
    try {
      const rawHtml = marked.parse(markdown, {
        gfm: true,
        breaks: true,
      }) as string;
      return {
        exportSafeHtml: sanitizeHtml(rawHtml),
        previewSafeHtml: sanitizeHtml(rawHtml, { demoteH1ToH2: true }),
      };
    } catch {
      const fallback = '<p class="text-rose-500 font-medium">Failed to parse markdown.</p>';
      return { exportSafeHtml: fallback, previewSafeHtml: fallback };
    }
  }, [markdown]);

  // Statistics
  const stats = useMemo(() => {
    const trimmed = markdown.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const chars = markdown.length;
    const lines = markdown.split('\n').length;
    const readingTime = Math.max(1, Math.ceil(words / 200));

    return { words, chars, lines, readingTime };
  }, [markdown]);

  // Toolbar action: insert or wrap text
  const insertFormatting = (prefix: string, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const replacement = selectedText
      ? `${prefix}${selectedText}${suffix}`
      : `${prefix}${defaultText}${suffix}`;

    const newContent =
      textarea.value.substring(0, start) +
      replacement +
      textarea.value.substring(end);

    setMarkdown(newContent);

    setTimeout(() => {
      textarea.focus();
      const cursorPosition = selectedText
        ? start + replacement.length
        : start + prefix.length + defaultText.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    }, 0);
  };

  // Copy Markdown
  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    setCopiedType('md');
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Copy HTML
  const handleCopyHtml = () => {
    navigator.clipboard.writeText(exportSafeHtml);
    setCopiedType('html');
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Download .md file
  const handleDownloadMd = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download .html file
  const handleDownloadHtml = () => {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Markdown Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 860px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    h1, h2, h3, h4 { color: #0f172a; margin-top: 1.5em; margin-bottom: 0.5em; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
    pre { background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; color: inherit; padding: 0; }
    blockquote { border-left: 4px solid #6366f1; margin: 0; padding-left: 16px; color: #475569; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; }
    img { max-width: 100%; border-radius: 8px; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 30px 0; }
  </style>
</head>
<body>
${exportSafeHtml}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3400);
  };

  // Download as PDF (Vector ATS or Visual Snapshot)
  const handleDownloadPdfDocument = async (mode: 'vector' | 'visual' = 'vector') => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setShowPdfMenu(false);
    showToast(language === 'ur' ? 'پی ڈی ایف دستاویز تیار ہو رہی ہے...' : 'Generating high-resolution PDF document...');

    try {
      const firstLine = markdown.split('\n').find((l) => l.trim().length > 0) || 'Markdown Document';
      const cleanTitle = firstLine.replace(/^#+\s*/, '').replace(/[*_`]/g, '').trim() || 'Markdown Document';

      const fileName = await downloadMarkdownPDF(
        markdown,
        { words: stats.words, readingTime: stats.readingTime, chars: stats.chars, lines: stats.lines },
        {
          title: cleanTitle,
          mode,
          previewElement: previewRef.current,
        }
      );

      showToast(
        language === 'ur'
          ? `پی ڈی ایف "${fileName}" کامیابی سے ڈاؤن لوڈ ہو گئی!`
          : `Downloaded "${fileName}" (${mode === 'visual' ? 'Visual' : 'Vector'} PDF) successfully!`
      );
    } catch (err) {
      console.error('Error generating PDF:', err);
      showToast(language === 'ur' ? 'براہ راست پی ڈی ایف میں خرابی، پرنٹ ونڈو کھولی جا رہی ہے...' : 'PDF generation failed. Opening print dialog...');
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Reset with iframe-safe inline confirmation and safe backup
  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmResetEditor = () => {
    clearDraft();
    setMarkdown('');
    setShowResetConfirm(false);
    showToast(
      language === 'ur'
        ? 'ایڈیٹر صاف ہو گیا۔ پچھلا ڈرافٹ بیک اپ میں محفوظ ہے۔'
        : 'Editor cleared. Previous draft backed up in local storage.'
    );
  };

  const handleRestoreDraft = () => {
    const success = restoreBackup();
    if (success) {
      showToast(language === 'ur' ? 'پچھلا ڈرافٹ کامیابی سے بحال ہو گیا!' : 'Previous draft restored successfully!');
    } else {
      showToast(language === 'ur' ? 'کوئی سابقہ بیک اپ دستیاب نہیں ہے' : 'No previous draft backup found.');
    }
  };

  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-slate-950 p-6 overflow-y-auto' : ''}`}>
      {/* Header Bar */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <FileText className="w-3.5 h-3.5" />
                Live Markdown Editor
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Real-Time Render
              </span>
              {/* Auto-save Status Badge */}
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                title="Your document changes are automatically saved to browser local storage on every keystroke"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`} />
                <span>
                  {isSaving
                    ? (language === 'ur' ? 'محفوظ ہو رہا ہے...' : 'Saving...')
                    : (language === 'ur' ? `خودکار محفوظ: ${formatSavedTime(lastSaved, true)}` : `Auto-saved ${formatSavedTime(lastSaved)}`)}
                </span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {language === 'ur' ? 'مارک ڈاؤن لائیو ایڈیٹر' : 'Markdown Live Editor'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              {language === 'ur'
                ? 'فوری ریئل ٹائم پیش نظارہ، فارمیٹنگ ٹول بار، اور ایچ ٹی ایم ایل/مارک ڈاؤن ایکسپورٹ کے ساتھ طاقتور ایڈیٹر۔'
                : 'Write, preview, and format GitHub Flavored Markdown with real-time split-screen rendering, instant stats, and export.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle (Mobile / Desktop) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                title="Editor Only"
                className={`p-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'editor'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                title="Split View"
                className={`hidden md:block p-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Columns className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                title="Preview Only"
                className={`p-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === 'preview'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            {/* Template Selector */}
            <select
              onChange={(e) => {
                const val = e.target.value as keyof typeof TEMPLATES;
                if (val && TEMPLATES[val]) {
                  setMarkdown(TEMPLATES[val]);
                }
              }}
              defaultValue=""
              className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="" disabled>
                Load Template...
              </option>
              <option value="readme">Project README</option>
              <option value="doc">API Documentation</option>
              <option value="blog">Technical Blog Post</option>
              <option value="cheatsheet">Syntax Cheat Sheet</option>
            </select>

            {/* Restore Draft */}
            <button
              type="button"
              onClick={handleRestoreDraft}
              title="Restore previous draft if cleared or replaced"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'ur' ? 'ڈرافٹ بحال کریں' : 'Restore Draft'}</span>
            </button>

            {/* Copy Markdown */}
            <button
              onClick={handleCopyMarkdown}
              title="Copy Markdown code"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              {copiedType === 'md' ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied MD!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy MD</span>
                </>
              )}
            </button>

            {/* Copy HTML */}
            <button
              onClick={handleCopyHtml}
              title="Copy Rendered HTML"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              {copiedType === 'html' ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied HTML!</span>
                </>
              ) : (
                <>
                  <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Copy HTML</span>
                </>
              )}
            </button>

            {/* Primary Action: Download as PDF Button with options */}
            <div className="relative inline-flex items-center shadow-2xs rounded-lg">
              <button
                type="button"
                onClick={() => handleDownloadPdfDocument('vector')}
                disabled={isGeneratingPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 rounded-l-lg transition-all cursor-pointer shadow-xs"
                title={language === 'ur' ? 'پی ڈی ایف فائل ڈاؤن لوڈ کریں' : 'Download document as professionally formatted PDF'}
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>{language === 'ur' ? 'تیار ہو رہا ہے...' : 'Generating...'}</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5 text-white" />
                    <span>{language === 'ur' ? 'پی ڈی ایف' : 'Download PDF'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowPdfMenu(!showPdfMenu)}
                disabled={isGeneratingPdf}
                className="p-1.5 border-l border-indigo-500 text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 rounded-r-lg transition-colors cursor-pointer"
                title="More PDF export options"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPdfMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* PDF Options Menu */}
              {showPdfMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {language === 'ur' ? 'پی ڈی ایف فارمیٹ' : 'PDF Export Modes'}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadPdfDocument('vector')}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
                  >
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {language === 'ur' ? 'ویکٹر ڈاکومنٹ (تجویز کردہ)' : 'Vector Document (ATS / Clean)'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {language === 'ur' ? 'صاف ملٹی پیج اور قابلِ تلاش ٹیکسٹ' : 'Multi-page document with selectable text & pagination'}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPdfDocument('visual')}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
                  >
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {language === 'ur' ? 'ویژول اسنیپ شاٹ' : 'Visual Snapshot'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {language === 'ur' ? 'پیش نظارہ کا ہو بہو تصویری عکس' : 'Pixel-accurate canvas capture of rendered HTML'}
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Other Formats (MD / HTML) */}
            <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
              <button
                onClick={handleDownloadMd}
                title="Download .md file"
                className="px-2.5 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.MD</span>
              </button>
              <button
                onClick={handleDownloadHtml}
                title="Download .html file"
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                .HTML
              </button>
            </div>

            {/* Print Button (with Tracker) */}
            <Print
              variant="icon"
              toolId="markdown-editor"
              toolName="Markdown Editor"
              documentTitle={() => {
                const firstLine = markdown.split('\n').find((l) => l.trim().length > 0) || 'Markdown Document';
                return firstLine.replace(/^#+\s*/, '').replace(/[*_`]/g, '').trim() || 'Markdown Document';
              }}
              documentFormat="A4 Document / Print"
              documentSummary={`${stats.words} words • ${stats.readingTime} min read • ${stats.chars} characters`}
              tooltip={language === 'ur' ? 'پرنٹ کریں (پرنٹ ہسٹری میں محفوظ ہوگا)' : 'Print document (saved in Print History)'}
            />

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit full screen' : 'Full screen'}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Reset */}
            {showResetConfirm ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs">
                <span className="font-semibold text-rose-700 dark:text-rose-300">
                  {language === 'ur' ? 'صاف کریں؟' : 'Clear editor?'}
                </span>
                <button
                  type="button"
                  onClick={confirmResetEditor}
                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors cursor-pointer"
                >
                  {language === 'ur' ? 'ہاں' : 'Yes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {language === 'ur' ? 'نہیں' : 'Cancel'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                title="Clear editor"
                aria-label="Clear editor"
                className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Status Notification */}
      {toastMsg && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-medium text-indigo-900 dark:text-indigo-200 flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-indigo-500 hover:text-indigo-800 dark:hover:text-indigo-100 p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Editor & Preview Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        {/* Formatting Toolbar */}
        <div className="flex flex-wrap items-center gap-1 px-4 py-2 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs">
          <button
            type="button"
            onClick={() => insertFormatting('**', '**', 'bold text')}
            title="Bold (**text**)"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('*', '*', 'italic text')}
            title="Italic (*text*)"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('~~', '~~', 'strikethrough')}
            title="Strikethrough (~~text~~)"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() => insertFormatting('# ', '', 'Heading 1')}
            title="Heading 1"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('## ', '', 'Heading 2')}
            title="Heading 2"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('### ', '', 'Heading 3')}
            title="Heading 3"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() => insertFormatting('- ', '', 'List item')}
            title="Unordered List"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('1. ', '', 'Numbered item')}
            title="Numbered List"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('- [ ] ', '', 'Task to complete')}
            title="Task List"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ListTodo className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() => insertFormatting('> ', '', 'Quote text')}
            title="Blockquote"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('`', '`', 'code')}
            title="Inline Code"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('```typescript\n', '\n```', '// Code snippet here')}
            title="Code Block"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() => insertFormatting('[', '](https://example.com)', 'Link title')}
            title="Insert Link"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('![', '](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600)', 'Alt text')}
            title="Insert Image"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              insertFormatting(
                '\n| Column 1 | Column 2 | Column 3 |\n| :--- | :---: | ---: |\n| Value 1 | Value 2 | Value 3 |\n'
              )
            }
            title="Insert Table"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('\n---\n')}
            title="Horizontal Divider"
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Split Screen Workspace */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 min-h-[580px] h-[640px]">
          {/* Left Panel: Markdown Textarea Input */}
          {(viewMode === 'split' || viewMode === 'editor') && (
            <div className={`flex flex-col h-full ${viewMode === 'editor' ? 'md:col-span-2' : ''}`}>
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <span>Markdown Input</span>
                <span className="font-mono text-slate-400">UTF-8 • GFM</span>
              </div>
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Type or paste your Markdown here..."
                spellCheck="false"
                className="flex-1 w-full p-4 font-mono text-sm leading-relaxed text-slate-900 dark:text-slate-100 bg-transparent resize-none focus:outline-none selection:bg-indigo-100 dark:selection:bg-indigo-950 overflow-y-auto"
              />
            </div>
          )}

          {/* Right Panel: Rendered HTML Preview */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div className={`flex flex-col h-full bg-white dark:bg-slate-900 ${viewMode === 'preview' ? 'md:col-span-2' : ''}`}>
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <span>Rendered HTML Output</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">Live Sync</span>
              </div>
              <div
                ref={previewRef}
                className="flex-1 p-6 overflow-y-auto prose dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline prose-code:font-mono prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950 prose-pre:text-slate-100 prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50/40 dark:prose-blockquote:bg-indigo-950/20 prose-blockquote:py-1 prose-blockquote:px-4 prose-table:border-collapse prose-th:border prose-th:border-slate-300 dark:prose-th:border-slate-700 prose-th:p-2 prose-th:bg-slate-100 dark:prose-th:bg-slate-800 prose-td:border prose-td:border-slate-300 dark:prose-td:border-slate-700 prose-td:p-2"
                dangerouslySetInnerHTML={{ __html: previewSafeHtml }}
              />
            </div>
          )}
        </div>

        {/* Footer Statistics Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-4 font-mono">
            <span>
              <strong className="text-slate-700 dark:text-slate-200">{stats.words.toLocaleString()}</strong> words
            </span>
            <span>
              <strong className="text-slate-700 dark:text-slate-200">{stats.chars.toLocaleString()}</strong> chars
            </span>
            <span>
              <strong className="text-slate-700 dark:text-slate-200">{stats.lines.toLocaleString()}</strong> lines
            </span>
            <span>
              <strong className="text-slate-700 dark:text-slate-200">{stats.readingTime}</strong> min read
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Draft saved locally</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
