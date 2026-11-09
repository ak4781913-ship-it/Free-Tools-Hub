import jsPDF from 'jspdf';

/**
 * Clean, vector-rendered A4 PDF generation utility for text-based tools.
 * Standard A4 portrait: 210mm x 297mm
 */

interface DocumentHeaderOptions {
  title: string;
  subtitle?: string;
  toolName?: string;
  metadata?: Record<string, string | number | undefined>;
}

/**
 * Renders a standardized header banner across pages
 */
function renderDocumentHeader(doc: jsPDF, options: DocumentHeaderOptions, marginX: number, contentWidth: number): number {
  let y = 14;

  // Dark Navy Header Banner
  const bannerHeight = options.subtitle || options.metadata ? 24 : 18;
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(marginX, y, contentWidth, bannerHeight, 2, 2, 'F');

  // Indigo Accent Stripe
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.rect(marginX, y + bannerHeight - 1.5, contentWidth, 1.5, 'F');

  // Tool / Brand Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(165, 180, 252); // indigo-300
  doc.text((options.toolName || 'FREETOOLS HUB DOCUMENT').toUpperCase(), marginX + 6, y + 6);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(255, 255, 255);
  const truncatedTitle = options.title.length > 55 ? options.title.slice(0, 52) + '...' : options.title;
  doc.text(truncatedTitle, marginX + 6, y + 13);

  // Subtitle / Date Info
  if (options.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(options.subtitle.slice(0, 80), marginX + 6, y + 19);
  } else if (options.metadata) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    const metaString = Object.entries(options.metadata)
      .filter(([_, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${k}: ${v}`)
      .join('  •  ');
    doc.text(metaString.slice(0, 95), marginX + 6, y + 19);
  }

  return y + bannerHeight + 6;
}

/**
 * Adds running footer with page numbers to all pages
 */
function addRunningFooters(doc: jsPDF, marginX: number, contentWidth: number, pageHeight: number): void {
  const totalPages = doc.getNumberOfPages();
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 10;

    // Hairline divider
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(marginX, footerY - 3, marginX + contentWidth, footerY - 3);

    // Left: Brand & Date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Generated via FreeTools Hub  •  ${dateStr}`, marginX, footerY + 1.5);

    // Right: Page X of Y
    doc.text(`Page ${i} of ${totalPages}`, marginX + contentWidth, footerY + 1.5, { align: 'right' });
  }
}

/**
 * 1. Generates a formatted PDF from Markdown / Rich Text content
 */
export function generateMarkdownPDF(
  title: string,
  markdownText: string,
  stats?: { words?: number; readingTime?: number; chars?: number }
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2; // 180mm
  const marginBottom = 18;

  let currentY = renderDocumentHeader(
    doc,
    {
      title: title || 'Markdown Document',
      toolName: 'Markdown Editor',
      metadata: stats
        ? {
            Words: stats.words?.toLocaleString(),
            'Reading Time': stats.readingTime ? `~${stats.readingTime} min` : undefined,
            Characters: stats.chars?.toLocaleString(),
          }
        : undefined,
    },
    marginX,
    contentWidth
  );

  const lines = markdownText.split('\n');

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const trimmed = rawLine.trim();

    // Check if new page is needed
    if (currentY > pageHeight - marginBottom) {
      doc.addPage();
      currentY = 16;
    }

    // Blank line
    if (!trimmed) {
      currentY += 3.5;
      continue;
    }

    // Heading 1 (# Heading)
    if (trimmed.startsWith('# ')) {
      if (currentY + 14 > pageHeight - marginBottom) {
        doc.addPage();
        currentY = 16;
      }
      currentY += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42); // slate-900
      const text = trimmed.replace(/^#\s+/, '');
      const wrapped = doc.splitTextToSize(text, contentWidth);
      doc.text(wrapped, marginX, currentY);
      currentY += wrapped.length * 6.5;

      // Underline rule for H1
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.4);
      doc.line(marginX, currentY - 1.5, marginX + contentWidth, currentY - 1.5);
      currentY += 3;
      continue;
    }

    // Heading 2 (## Heading)
    if (trimmed.startsWith('## ')) {
      if (currentY + 12 > pageHeight - marginBottom) {
        doc.addPage();
        currentY = 16;
      }
      currentY += 3.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(30, 41, 59); // slate-800
      const text = trimmed.replace(/^##\s+/, '');
      const wrapped = doc.splitTextToSize(text, contentWidth);
      doc.text(wrapped, marginX, currentY);
      currentY += wrapped.length * 5.5 + 2;
      continue;
    }

    // Heading 3 (### Heading)
    if (trimmed.startsWith('### ')) {
      if (currentY + 10 > pageHeight - marginBottom) {
        doc.addPage();
        currentY = 16;
      }
      currentY += 2.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(51, 65, 85); // slate-700
      const text = trimmed.replace(/^###\s+/, '');
      const wrapped = doc.splitTextToSize(text, contentWidth);
      doc.text(wrapped, marginX, currentY);
      currentY += wrapped.length * 4.8 + 1.5;
      continue;
    }

    // Blockquote (> Quote)
    if (trimmed.startsWith('>')) {
      const text = trimmed.replace(/^>\s*/, '').replace(/[*_`]/g, '');
      const wrapped = doc.splitTextToSize(text, contentWidth - 10);
      const boxHeight = wrapped.length * 4.5 + 4;

      if (currentY + boxHeight > pageHeight - marginBottom) {
        doc.addPage();
        currentY = 16;
      }

      // Background card
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(marginX, currentY, contentWidth, boxHeight, 1, 1, 'F');

      // Left bar
      doc.setFillColor(79, 70, 229);
      doc.rect(marginX, currentY, 2, boxHeight, 'F');

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(wrapped, marginX + 6, currentY + 4.5);
      currentY += boxHeight + 2;
      continue;
    }

    // Bullet points (- or * or 1.)
    if (/^[-*+]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const isOrdered = /^\d+\.\s+/.test(trimmed);
      const bulletSymbol = isOrdered ? trimmed.match(/^\d+\./)![0] : '•';
      const text = trimmed.replace(/^([-*+]|\d+\.)\s+/, '').replace(/[*_`]/g, '');
      const wrapped = doc.splitTextToSize(text, contentWidth - 8);

      if (currentY + wrapped.length * 4.5 > pageHeight - marginBottom) {
        doc.addPage();
        currentY = 16;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(79, 70, 229);
      doc.text(bulletSymbol, marginX + 2, currentY);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(wrapped, marginX + 8, currentY);
      currentY += wrapped.length * 4.4 + 1.5;
      continue;
    }

    // Code blocks (``` or `code`)
    if (trimmed.startsWith('```')) {
      continue; // Skip code fence markers
    }

    // Regular Paragraph
    const cleanParagraph = rawLine.replace(/[*_`]/g, '');
    const wrapped = doc.splitTextToSize(cleanParagraph, contentWidth);

    if (currentY + wrapped.length * 4.5 > pageHeight - marginBottom) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(wrapped, marginX, currentY);
    currentY += wrapped.length * 4.6 + 2;
  }

  addRunningFooters(doc, marginX, contentWidth, pageHeight);
  return doc;
}

/**
 * 2. Generates a clean PDF for General Text Tools (Word Counter, Text Case Converter)
 */
export function generateTextDocumentPDF(
  title: string,
  content: string,
  options?: {
    toolName?: string;
    subtitle?: string;
    statsSummary?: string;
    kpis?: Array<{ label: string; value: string | number }>;
  }
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2;
  const marginBottom = 18;

  let currentY = renderDocumentHeader(
    doc,
    {
      title: title || 'Text Document',
      toolName: options?.toolName || 'Text Utility',
      subtitle: options?.subtitle,
    },
    marginX,
    contentWidth
  );

  // If KPI metrics strip is provided (e.g. Word Counter stats)
  if (options?.kpis && options.kpis.length > 0) {
    const kpiCount = options.kpis.length;
    const cardWidth = (contentWidth - (kpiCount - 1) * 3) / kpiCount;
    const cardHeight = 13;

    options.kpis.forEach((kpi, idx) => {
      const cardX = marginX + idx * (cardWidth + 3);
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

      // Metric label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label.toUpperCase(), cardX + 3, currentY + 4.5);

      // Metric value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(79, 70, 229);
      doc.text(String(kpi.value), cardX + 3, currentY + 10);
    });

    currentY += cardHeight + 6;
  }

  // Section Heading: Document Content
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DOCUMENT CONTENT', marginX, currentY);
  currentY += 2;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(marginX, currentY, marginX + contentWidth, currentY);
  currentY += 5;

  // Split content by paragraphs
  const paragraphs = content.split('\n');

  for (const para of paragraphs) {
    if (currentY > pageHeight - marginBottom) {
      doc.addPage();
      currentY = 16;
    }

    if (!para.trim()) {
      currentY += 3.5;
      continue;
    }

    const wrapped = doc.splitTextToSize(para, contentWidth);

    if (currentY + wrapped.length * 4.6 > pageHeight - marginBottom) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(wrapped, marginX, currentY);
    currentY += wrapped.length * 4.6 + 2.5;
  }

  addRunningFooters(doc, marginX, contentWidth, pageHeight);
  return doc;
}

/**
 * 3. Generates a structured Creative Brief / Production Sheet PDF for AI Prompt tools
 */
export function generatePromptSpecPDF(
  title: string,
  fullPrompt: string,
  options: {
    toolName: string;
    subject?: string;
    style?: string;
    aspectRatio?: string;
    negativePrompt?: string;
    parameters?: Record<string, string>;
  }
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2;
  const marginBottom = 18;

  let currentY = renderDocumentHeader(
    doc,
    {
      title: title || 'AI Prompt Production Specification',
      toolName: options.toolName,
      subtitle: 'Complete Prompt Parameters, Creative Directives & Production Specs',
    },
    marginX,
    contentWidth
  );

  // Creative Parameters Pill Strip
  if (options.parameters) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('DIRECTIVE PARAMETERS', marginX, currentY);
    currentY += 3;

    const entries = Object.entries(options.parameters).filter(([_, v]) => Boolean(v));
    const entriesPerRow = 3;
    const colWidth = (contentWidth - 6) / entriesPerRow;

    for (let i = 0; i < entries.length; i += entriesPerRow) {
      const row = entries.slice(i, i + entriesPerRow);
      row.forEach(([k, v], cIdx) => {
        const x = marginX + cIdx * (colWidth + 3);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, currentY, colWidth, 10, 1, 1, 'FD');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(k.toUpperCase(), x + 2.5, currentY + 3.8);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(String(v).slice(0, 26), x + 2.5, currentY + 7.8);
      });
      currentY += 12;
    }
    currentY += 2;
  }

  // Primary Prompt Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PRIMARY AI GENERATION PROMPT', marginX, currentY);
  currentY += 3;

  const wrappedPrompt = doc.splitTextToSize(fullPrompt, contentWidth - 8);
  const promptBoxHeight = wrappedPrompt.length * 4.6 + 6;

  if (currentY + promptBoxHeight > pageHeight - marginBottom) {
    doc.addPage();
    currentY = 16;
  }

  // Box background
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(marginX, currentY, contentWidth, promptBoxHeight, 1.5, 1.5, 'FD');

  // Accent left border
  doc.setFillColor(79, 70, 229);
  doc.rect(marginX, currentY, 2, promptBoxHeight, 'F');

  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(wrappedPrompt, marginX + 5, currentY + 5);
  currentY += promptBoxHeight + 6;

  // Negative Prompt if present
  if (options.negativePrompt) {
    if (currentY + 25 > pageHeight - marginBottom) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(220, 38, 38); // red-600
    doc.text('NEGATIVE PROMPT (EXCLUSIONS)', marginX, currentY);
    currentY += 3;

    const wrappedNeg = doc.splitTextToSize(options.negativePrompt, contentWidth - 8);
    const negHeight = wrappedNeg.length * 4.4 + 5;

    doc.setFillColor(254, 242, 242); // red-50
    doc.setDrawColor(254, 202, 202); // red-200
    doc.roundedRect(marginX, currentY, contentWidth, negHeight, 1.5, 1.5, 'FD');

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(153, 27, 27);
    doc.text(wrappedNeg, marginX + 4, currentY + 4.5);
    currentY += negHeight + 6;
  }

  addRunningFooters(doc, marginX, contentWidth, pageHeight);
  return doc;
}
