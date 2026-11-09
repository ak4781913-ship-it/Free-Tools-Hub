import jsPDF from 'jspdf';
import { toCanvas } from 'html-to-image';
import html2canvas from 'html2canvas-pro';
import { recordPrintDocument } from './printHistoryTracking';

export interface MarkdownPdfStats {
  words: number;
  readingTime: number;
  chars: number;
  lines?: number;
}

export interface MarkdownPdfOptions {
  title?: string;
  author?: string;
  mode?: 'vector' | 'visual';
  previewElement?: HTMLElement | null;
}

/**
 * Generates a clean, multi-page vector-rendered PDF from markdown text
 */
export function generateVectorMarkdownPDF(
  markdown: string,
  stats: MarkdownPdfStats,
  title?: string
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const marginTop = 18;
  const marginBottom = 18;
  const contentWidth = pageWidth - marginX * 2; // 178mm

  const cleanTitle = (
    title ||
    markdown.split('\n').find((l) => l.trim().length > 0)?.replace(/^#+\s*/, '') ||
    'Markdown Document'
  ).trim();

  let currentY = marginTop;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      currentY = marginTop;
      return true;
    }
    return false;
  };

  // ==========================================
  // TOP DOCUMENT HEADER
  // ==========================================
  // Background card for header
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(marginX, currentY, contentWidth, 24, 2, 2, 'FD');

  // Decorative indigo accent bar
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.rect(marginX, currentY, 2.5, 24, 'F');

  // Title text
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const truncatedTitle = doc.splitTextToSize(cleanTitle, contentWidth - 12);
  doc.text(truncatedTitle[0] || 'Markdown Document', marginX + 6, currentY + 9);

  // Metadata badges
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const metaText = `${stats.words.toLocaleString()} words  •  ${stats.readingTime} min read  •  ${stats.chars.toLocaleString()} characters  •  Generated on ${dateStr}`;
  doc.text(metaText, marginX + 6, currentY + 18);

  currentY += 32;

  // ==========================================
  // BODY PARSING & RENDERING
  // ==========================================
  const rawLines = markdown.split('\n');
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const trimmed = rawLine.trim();

    // Code blocks toggle
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block: render collected code
        if (codeBuffer.length > 0) {
          doc.setFont('courier', 'normal');
          doc.setFontSize(8.5);
          const blockHeight = codeBuffer.length * 4.2 + 6;
          checkPageBreak(blockHeight + 4);

          // Draw code container
          doc.setFillColor(241, 245, 249); // slate-100
          doc.setDrawColor(203, 213, 225); // slate-300
          doc.roundedRect(marginX, currentY, contentWidth, blockHeight, 1.5, 1.5, 'FD');

          doc.setTextColor(30, 41, 59);
          let codeY = currentY + 4.5;
          for (const cLine of codeBuffer) {
            const safeCLine = doc.splitTextToSize(cLine, contentWidth - 8);
            for (const subLine of safeCLine) {
              doc.text(subLine, marginX + 4, codeY);
              codeY += 4.2;
            }
          }
          currentY += blockHeight + 4;
          codeBuffer = [];
        }
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Empty lines
    if (trimmed === '') {
      currentY += 3;
      continue;
    }

    // Horizontal Rule
    if (/^(---+|___+|\*\*\*+)$/.test(trimmed)) {
      checkPageBreak(6);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(marginX, currentY + 2, marginX + contentWidth, currentY + 2);
      currentY += 6;
      continue;
    }

    // Heading 1
    if (trimmed.startsWith('# ')) {
      checkPageBreak(14);
      currentY += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      const hText = trimmed.replace(/^#\s+/, '').replace(/[*_`]/g, '');
      const lines = doc.splitTextToSize(hText, contentWidth);
      doc.text(lines, marginX, currentY);
      currentY += lines.length * 6.5 + 2;

      // Subtle underline for H1
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(marginX, currentY - 1, marginX + contentWidth, currentY - 1);
      currentY += 3;
      continue;
    }

    // Heading 2
    if (trimmed.startsWith('## ')) {
      checkPageBreak(12);
      currentY += 2.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(30, 41, 59);
      const hText = trimmed.replace(/^##\s+/, '').replace(/[*_`]/g, '');
      const lines = doc.splitTextToSize(hText, contentWidth);
      doc.text(lines, marginX, currentY);
      currentY += lines.length * 5.5 + 2;
      continue;
    }

    // Heading 3
    if (trimmed.startsWith('### ')) {
      checkPageBreak(10);
      currentY += 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(51, 65, 85);
      const hText = trimmed.replace(/^###\s+/, '').replace(/[*_`]/g, '');
      const lines = doc.splitTextToSize(hText, contentWidth);
      doc.text(lines, marginX, currentY);
      currentY += lines.length * 5 + 1.5;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const qText = trimmed.replace(/^>\s*/, '').replace(/[*_`]/g, '');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      const lines = doc.splitTextToSize(qText, contentWidth - 10);
      const bHeight = lines.length * 4.6 + 4;
      checkPageBreak(bHeight + 2);

      // Quote background & border
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, currentY, contentWidth, bHeight, 'F');
      doc.setFillColor(79, 70, 229); // indigo bar
      doc.rect(marginX, currentY, 2, bHeight, 'F');

      doc.text(lines, marginX + 5, currentY + 4);
      currentY += bHeight + 3;
      continue;
    }

    // Bullet List Item
    if (/^[-*+]\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^[-*+]\s+/, '').replace(/[*_`]/g, '');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      const lines = doc.splitTextToSize(itemText, contentWidth - 8);
      checkPageBreak(lines.length * 4.5 + 2);

      // Bullet dot
      doc.setFillColor(79, 70, 229);
      doc.circle(marginX + 2.5, currentY + 1.5, 0.9, 'F');

      doc.text(lines, marginX + 6, currentY + 2.5);
      currentY += lines.length * 4.5 + 1.5;
      continue;
    }

    // Numbered List Item
    if (/^\d+\.\s+/.test(trimmed)) {
      const match = trimmed.match(/^(\d+\.)\s+(.*)/);
      const numLabel = match ? match[1] : '•';
      const itemText = (match ? match[2] : trimmed).replace(/[*_`]/g, '');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(79, 70, 229);
      checkPageBreak(6);
      doc.text(numLabel, marginX + 1, currentY + 2.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9.5);
      const lines = doc.splitTextToSize(itemText, contentWidth - 10);
      doc.text(lines, marginX + 7, currentY + 2.5);
      currentY += lines.length * 4.5 + 1.5;
      continue;
    }

    // Standard Paragraph
    const cleanPara = trimmed.replace(/[*_`]/g, '');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(cleanPara, contentWidth);
    checkPageBreak(lines.length * 4.6 + 2);
    doc.text(lines, marginX, currentY + 2.5);
    currentY += lines.length * 4.6 + 2.5;
  }

  // ==========================================
  // FOOTER (Page X of Y)
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 12, marginX + contentWidth, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('FreeTools Hub  •  Markdown Document', marginX, pageHeight - 7);

    const pageStr = `Page ${p} of ${totalPages}`;
    doc.text(pageStr, marginX + contentWidth - doc.getTextWidth(pageStr), pageHeight - 7);
  }

  return doc;
}

/**
 * Downloads a high-resolution PDF of the markdown content
 * Offers both ATS-clean vector generation and high-accuracy visual snapshot
 */
export async function downloadMarkdownPDF(
  markdown: string,
  stats: MarkdownPdfStats,
  options?: MarkdownPdfOptions
): Promise<string> {
  const mode = options?.mode || 'vector';
  const cleanTitle = (
    options?.title ||
    markdown.split('\n').find((l) => l.trim().length > 0)?.replace(/^#+\s*/, '') ||
    'Markdown_Document'
  )
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '_') || 'Markdown_Document';

  const fileName = `${cleanTitle}.pdf`;

  if (mode === 'visual' && options?.previewElement) {
    // Visual Canvas Capture Mode
    const element = options.previewElement;
    let canvas: HTMLCanvasElement;

    try {
      canvas = await toCanvas(element, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
    } catch {
      canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
      });
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    pdf.save(fileName);

    recordPrintDocument('markdown-editor', options?.title || cleanTitle, {
      toolName: 'Markdown Editor',
      format: 'A4 Visual Snapshot PDF',
      summary: `${stats.words} words • ${stats.readingTime} min read • Visual Layout Capture`,
    });

    return fileName;
  }

  // Vector Mode
  const doc = generateVectorMarkdownPDF(markdown, stats, options?.title);
  doc.save(fileName);

  recordPrintDocument('markdown-editor', options?.title || cleanTitle, {
    toolName: 'Markdown Editor',
    format: 'A4 Vector PDF',
    summary: `${stats.words} words • ${stats.readingTime} min read • Clean Document Layout`,
  });

  return fileName;
}
