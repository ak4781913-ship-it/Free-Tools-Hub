/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolDefinition } from '../types';
import { recordPrintDocument } from './printHistoryTracking';

export interface ToolPdfExportOptions {
  elementOrId?: string | HTMLElement;
  tool: ToolDefinition;
  isUrdu?: boolean;
  documentTitle?: string;
  onProgress?: (status: string) => void;
}

/**
 * Captures a tool output/workspace element and downloads it as a polished,
 * multi-page A4 PDF document with custom FreeTools Hub branding and header/footer.
 */
export async function exportToolContentToPdf({
  elementOrId,
  tool,
  isUrdu = false,
  documentTitle,
  onProgress,
}: ToolPdfExportOptions): Promise<{ success: boolean; filename: string }> {
  try {
    onProgress?.('Locating content...');

    // 1. Identify target DOM element
    let targetElement: HTMLElement | null = null;

    if (elementOrId instanceof HTMLElement) {
      targetElement = elementOrId;
    } else if (typeof elementOrId === 'string' && elementOrId.trim()) {
      targetElement = document.getElementById(elementOrId);
    }

    // Fallbacks if not found
    if (!targetElement) {
      targetElement =
        document.getElementById('tool-workspace-content') ||
        document.getElementById('printable-resume-area') ||
        document.querySelector('.tool-output-area') ||
        document.querySelector('[data-tool-output]') ||
        document.querySelector('main');
    }

    if (!targetElement) {
      throw new Error('Could not find content element to export.');
    }

    onProgress?.('Rendering layout...');

    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);

    // 2. High-DPI canvas capture with html2canvas
    const canvas = await html2canvas(targetElement, {
      scale: 2, // 2x retina clarity
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
      windowWidth: targetElement.scrollWidth || 1200,
      onclone: (clonedDoc) => {
        // Remove interactive toolbars or floating elements in the cloned capture
        const ignored = clonedDoc.querySelectorAll('.no-print, [data-no-print="true"]');
        ignored.forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      },
    });

    onProgress?.('Generating PDF document...');

    // 3. Initialize jsPDF in A4 Portrait mode
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const marginX = 12;
    const contentWidth = pageWidth - marginX * 2; // 186mm

    // Header & Footer dimensions
    const headerHeight = 16;
    const footerHeight = 10;
    const printableHeightPerPage = pageHeight - headerHeight - footerHeight - 8; // ~263mm

    // Calculate image dimensions
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const toolName = isUrdu ? tool.nameUrdu : tool.name;
    const titleText = documentTitle || `${toolName} Report`;
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const timeFormatted = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    // Helper: Draw header banner on any page
    const drawHeader = (pageNumber: number) => {
      // Header background bar
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.rect(marginX, 8, contentWidth, headerHeight, 'F');

      // Accent color strip
      doc.setFillColor(79, 70, 229); // Indigo 600
      doc.rect(marginX, 8 + headerHeight - 1.2, contentWidth, 1.2, 'F');

      // Title & Branding
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(titleText.toUpperCase(), marginX + 4, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(199, 210, 254); // Indigo 200
      doc.text('FreeTools Hub VIP • Client-Side Verified', marginX + 4, 20);

      // Date / Time on right
      doc.setTextColor(226, 232, 240);
      doc.text(`${dateFormatted} • ${timeFormatted}`, pageWidth - marginX - 4, 15, { align: 'right' });
      doc.setTextColor(148, 163, 184);
      doc.text(`Doc Ref: FT-${now.getTime().toString().slice(-6)}`, pageWidth - marginX - 4, 20, { align: 'right' });
    };

    // Helper: Draw footer on any page
    const drawFooter = (pageNumber: number, totalPages: number) => {
      const footerY = pageHeight - 7;

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginX, footerY - 3, pageWidth - marginX, footerY - 3);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('100% Free & Privacy-Protected • Client-Side Generated', marginX, footerY);

      doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - marginX, footerY, { align: 'right' });
    };

    // 4. Multi-page slicing
    const totalPages = Math.ceil(imgHeight / printableHeightPerPage);
    let heightRemaining = imgHeight;
    let page = 1;
    let sY = 0; // source Y offset on canvas

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    while (heightRemaining > 0) {
      if (page > 1) {
        doc.addPage();
      }

      // Draw header
      drawHeader(page);

      // Slice portion of canvas for this page
      const currentSliceHeight = Math.min(heightRemaining, printableHeightPerPage);
      const canvasSliceHeight = (currentSliceHeight * canvas.width) / imgWidth;

      // Create a temporary canvas for this specific page slice
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = canvasSliceHeight;
      const ctx = sliceCanvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(
          canvas,
          0,
          sY,
          canvas.width,
          canvasSliceHeight,
          0,
          0,
          canvas.width,
          canvasSliceHeight
        );

        const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
        doc.addImage(
          sliceData,
          'JPEG',
          marginX,
          8 + headerHeight + 3,
          imgWidth,
          currentSliceHeight,
          undefined,
          'FAST'
        );
      }

      // Draw footer
      drawFooter(page, totalPages);

      sY += canvasSliceHeight;
      heightRemaining -= currentSliceHeight;
      page++;
    }

    onProgress?.('Saving file...');

    // 5. Trigger download with clean filename
    const cleanToolSlug = tool.id.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const filename = `${cleanToolSlug}-document-${now.toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);

    // 6. Record event in client-side print history tracker
    try {
      recordPrintDocument(tool.id, titleText, {
        toolName: tool.name,
        format: 'A4 Vector PDF',
        summary: `Exported document with ${totalPages} page(s) on ${dateFormatted}`,
        details: {
          totalPages,
          exportDate: dateFormatted,
        },
      });
    } catch {
      // ignore
    }

    return { success: true, filename };
  } catch (error) {
    console.error('[ToolPdfExporter] Failed to export PDF:', error);
    throw error;
  }
}
