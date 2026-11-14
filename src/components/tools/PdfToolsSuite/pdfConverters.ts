/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { jsPDF } from 'jspdf';
import { Document, HeadingLevel, Packer, Paragraph, TextRun, PageBreak } from 'docx';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { PdfOutputArtifact, PdfSuiteFileItem } from './pdfSuiteTypes';
import {
  createOutputArtifact,
  extractStructuredPdfText,
  parsePageRanges,
  renderPdfPageToDataUrl,
} from './pdfEngineCore';
import { detectImageSignature, sanitizeOutputBasename } from './pdfValidation';

export type ProgressCallback = (percent: number, stage: string) => void;

// ===========================================================================
// CATEGORY A: CONVERT PDF
// ===========================================================================

export async function convertPdfToWord(
  fileItem: PdfSuiteFileItem,
  onProgress?: ProgressCallback
): Promise<{ artifact: PdfOutputArtifact; extractedChars: number; isLikelyScanned: boolean }> {
  onProgress?.(10, 'Reading PDF layout and text blocks...');
  const { pages, totalPages } = await extractStructuredPdfText(fileItem.bytes);

  const children: Paragraph[] = [];
  let totalChars = 0;

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    onProgress?.(15 + Math.round(((i + 1) / Math.max(1, pages.length)) * 65), `Converting page ${p.page} of ${totalPages}...`);

    if (p.lines.length === 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `[Page ${p.page}: No selectable text found — may contain scanned images or vector graphics]`,
              italics: true,
              color: '64748b',
            }),
          ],
        })
      );
    } else {
      const medianFontSize =
        p.lines.map((l) => l.fontSize).sort((a, b) => a - b)[Math.floor(p.lines.length / 2)] || 11;

      for (const line of p.lines) {
        totalChars += line.text.length;
        const isLargeHeading = line.fontSize >= medianFontSize * 1.45 && line.text.length < 120;
        const isSubHeading = !isLargeHeading && line.fontSize >= medianFontSize * 1.2 && line.text.length < 140;

        children.push(
          new Paragraph({
            heading: isLargeHeading
              ? HeadingLevel.HEADING_1
              : isSubHeading
              ? HeadingLevel.HEADING_2
              : undefined,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: line.text,
                bold: isLargeHeading || isSubHeading,
                size: Math.min(48, Math.max(18, Math.round(line.fontSize * 2))),
              }),
            ],
          })
        );
      }
    }

    if (i < pages.length - 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

  onProgress?.(88, 'Packaging authentic .docx archive...');
  const doc = new Document({
    sections: [
      {
        properties: {},
        children:
          children.length > 0
            ? children
            : [new Paragraph({ children: [new TextRun('No extractable text was found in this PDF.')] })],
      },
    ],
  });

  const docxBlob = await Packer.toBlob(doc);
  const baseName = sanitizeOutputBasename(fileItem.name);
  const previewText = pages
    .map((p) => `--- Page ${p.page} ---\n${p.rawText || '(No selectable text)'}`)
    .join('\n\n');

  onProgress?.(100, 'Done');
  const isLikelyScanned = totalChars < Math.max(15, pages.length * 10);

  return {
    artifact: createOutputArtifact(
      `${baseName}.docx`,
      docxBlob,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      {
        pageCount: totalPages,
        textPreview: previewText.slice(0, 4000),
        summaryNote: isLikelyScanned
          ? 'Low selectable text detected — document may be scanned (consider OCR for Scanned PDFs).'
          : `${pages.length} page(s) exported cleanly to Word (.docx).`,
      }
    ),
    extractedChars: totalChars,
    isLikelyScanned,
  };
}

export async function convertPdfToExcel(
  fileItem: PdfSuiteFileItem,
  combineIntoSingleSheet = false,
  onProgress?: ProgressCallback
): Promise<PdfOutputArtifact> {
  onProgress?.(10, 'Extracting positioned text cells from PDF...');
  const { pages, totalPages } = await extractStructuredPdfText(fileItem.bytes);

  const wb = XLSX.utils.book_new();
  const tablePreview: { sheetName: string; rows: string[][] }[] = [];
  const combinedRows: string[][] = [];

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    onProgress?.(15 + Math.round(((i + 1) / Math.max(1, pages.length)) * 70), `Detecting columns on page ${p.page}...`);

    // Cluster X coordinates across items on this page to infer column buckets
    const allItems = p.lines.flatMap((line) => line.items);
    const xPositions = allItems.map((it) => Math.round(it.x / 18) * 18).sort((a, b) => a - b);
    const colAnchors: number[] = [];
    for (const xp of xPositions) {
      if (colAnchors.length === 0 || xp - colAnchors[colAnchors.length - 1] > 28) {
        colAnchors.push(xp);
      }
    }

    const pageRows: string[][] = [];
    for (const line of p.lines) {
      if (colAnchors.length <= 1) {
        pageRows.push([line.text]);
      } else {
        const rowArr = new Array<string>(colAnchors.length).fill('');
        for (const item of line.items) {
          // Find nearest column anchor
          let bestIdx = 0;
          let bestDist = Infinity;
          for (let c = 0; c < colAnchors.length; c++) {
            const dist = Math.abs(item.x - colAnchors[c]);
            if (dist < bestDist) {
              bestDist = dist;
              bestIdx = c;
            }
          }
          rowArr[bestIdx] = rowArr[bestIdx] ? `${rowArr[bestIdx]} ${item.str}` : item.str;
        }
        // Trim trailing empty cells
        while (rowArr.length > 1 && rowArr[rowArr.length - 1] === '') {
          rowArr.pop();
        }
        pageRows.push(rowArr);
      }
    }

    if (pageRows.length === 0) {
      pageRows.push([`Page ${p.page}: No selectable text found`]);
    }

    if (combineIntoSingleSheet) {
      if (combinedRows.length > 0) combinedRows.push([]);
      combinedRows.push([`--- Page ${p.page} ---`]);
      combinedRows.push(...pageRows);
    } else {
      const sheetName = `Page_${p.page}`.slice(0, 31);
      const ws = XLSX.utils.aoa_to_sheet(pageRows);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      if (tablePreview.length < 5) {
        tablePreview.push({ sheetName, rows: pageRows.slice(0, 30) });
      }
    }
  }

  if (combineIntoSingleSheet) {
    const ws = XLSX.utils.aoa_to_sheet(combinedRows);
    XLSX.utils.book_append_sheet(wb, ws, 'All_Pages');
    tablePreview.push({ sheetName: 'All_Pages', rows: combinedRows.slice(0, 50) });
  }

  onProgress?.(90, 'Writing .xlsx workbook...');
  const xlsxArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  const baseName = sanitizeOutputBasename(fileItem.name);

  onProgress?.(100, 'Done');
  return createOutputArtifact(
    `${baseName}.xlsx`,
    new Uint8Array(xlsxArray),
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    {
      pageCount: totalPages,
      tablePreview,
      summaryNote: `${pages.length} page(s) mapped to Excel table sheets.`,
    }
  );
}

export async function convertPdfToImages(
  fileItem: PdfSuiteFileItem,
  options: {
    format: 'jpg' | 'png';
    scale: number;
    quality?: number;
    pageRange?: string;
  },
  onProgress?: ProgressCallback
): Promise<PdfOutputArtifact[]> {
  const totalPages = fileItem.pageCount || 1;
  const targetPages = options.pageRange?.trim()
    ? parsePageRanges(options.pageRange, totalPages)
    : Array.from({ length: totalPages }, (_, i) => i + 1);

  const mimeType = options.format === 'jpg' ? 'image/jpeg' : 'image/png';
  const baseName = sanitizeOutputBasename(fileItem.name);
  const artifacts: PdfOutputArtifact[] = [];

  for (let i = 0; i < targetPages.length; i++) {
    const pageNum = targetPages[i];
    onProgress?.(
      Math.round(((i + 0.5) / targetPages.length) * 100),
      `Rendering page ${pageNum} of ${totalPages} (${options.format.toUpperCase()})...`
    );

    const rendered = await renderPdfPageToDataUrl(fileItem.bytes, pageNum, {
      scale: options.scale,
      format: mimeType,
      quality: options.quality ?? 0.92,
    });

    const art = createOutputArtifact(
      `${baseName}_page_${pageNum}.${options.format}`,
      rendered.blob,
      mimeType,
      {
        pageCount: 1,
        summaryNote: `${rendered.width} × ${rendered.height} px`,
      }
    );
    art.previewUrl = art.url;
    artifacts.push(art);
  }

  onProgress?.(100, 'Done');
  return artifacts;
}

export async function convertPdfToTxt(
  fileItem: PdfSuiteFileItem,
  options?: { includePageHeaders?: boolean; pageRange?: string },
  onProgress?: ProgressCallback
): Promise<{ artifact: PdfOutputArtifact; fullText: string }> {
  onProgress?.(15, 'Extracting text from PDF pages...');
  const totalPages = fileItem.pageCount || 1;
  const pageNumbers = options?.pageRange?.trim()
    ? parsePageRanges(options.pageRange, totalPages)
    : undefined;

  const { pages } = await extractStructuredPdfText(fileItem.bytes, pageNumbers);
  onProgress?.(85, 'Formatting UTF-8 text output...');

  const includeHeaders = options?.includePageHeaders ?? true;
  const fullText = pages
    .map((p) => {
      const header = includeHeaders ? `=== Page ${p.page} ===\n` : '';
      return `${header}${p.rawText || '(No selectable text on this page)'}`;
    })
    .join('\n\n');

  const baseName = sanitizeOutputBasename(fileItem.name);
  onProgress?.(100, 'Done');

  return {
    fullText,
    artifact: createOutputArtifact(`${baseName}.txt`, fullText, 'text/plain;charset=utf-8', {
      pageCount: pages.length,
      textPreview: fullText.slice(0, 6000),
      summaryNote: `${fullText.length.toLocaleString()} characters across ${pages.length} page(s)`,
    }),
  };
}

// ===========================================================================
// CATEGORY B: CONVERT TO PDF
// ===========================================================================

async function normalizeImageToEmbeddable(
  bytes: Uint8Array,
  filename: string
): Promise<{ bytes: Uint8Array; type: 'jpg' | 'png' }> {
  const sig = detectImageSignature(bytes);
  if (sig === 'jpg' || sig === 'png') {
    return { bytes, type: sig };
  }

  // Convert WebP or non-standard raster image cleanly to PNG via browser Canvas
  const blobCopy = new Uint8Array(bytes.byteLength);
  blobCopy.set(bytes);
  const blob = new Blob([blobCopy.buffer], { type: 'image/webp' });
  const imgUrl = URL.createObjectURL(blob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`Could not decode image "${filename}".`));
      el.src = imgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable.');
    ctx.drawImage(img, 0, 0);

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG conversion failed'))), 'image/png');
    });
    const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
    return { bytes: pngBytes, type: 'png' };
  } finally {
    URL.revokeObjectURL(imgUrl);
  }
}

export async function convertImagesToPdf(
  files: PdfSuiteFileItem[],
  options: {
    pageSize: 'fit' | 'a4' | 'letter';
    orientation: 'auto' | 'portrait' | 'landscape';
    marginPt: number;
  },
  onProgress?: ProgressCallback
): Promise<PdfOutputArtifact> {
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    onProgress?.(Math.round(((i + 0.5) / files.length) * 90), `Embedding image ${i + 1} of ${files.length}: ${f.name}`);

    const normalized = await normalizeImageToEmbeddable(f.bytes, f.name);
    const embedded =
      normalized.type === 'jpg'
        ? await pdfDoc.embedJpg(normalized.bytes)
        : await pdfDoc.embedPng(normalized.bytes);

    const imgW = embedded.width;
    const imgH = embedded.height;

    let pageW: number;
    let pageH: number;

    if (options.pageSize === 'fit') {
      pageW = imgW + options.marginPt * 2;
      pageH = imgH + options.marginPt * 2;
    } else {
      const baseW = options.pageSize === 'a4' ? 595.28 : 612;
      const baseH = options.pageSize === 'a4' ? 841.89 : 792;
      const isLandscape =
        options.orientation === 'landscape' ||
        (options.orientation === 'auto' && imgW > imgH);
      pageW = isLandscape ? baseH : baseW;
      pageH = isLandscape ? baseW : baseH;
    }

    const page = pdfDoc.addPage([pageW, pageH]);
    const maxW = Math.max(10, pageW - options.marginPt * 2);
    const maxH = Math.max(10, pageH - options.marginPt * 2);
    const scale = Math.min(maxW / imgW, maxH / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const x = (pageW - drawW) / 2;
    const y = (pageH - drawH) / 2;

    page.drawImage(embedded, { x, y, width: drawW, height: drawH });
  }

  onProgress?.(95, 'Finalizing PDF binary...');
  const pdfBytes = await pdfDoc.save();
  const baseName = files.length === 1 ? sanitizeOutputBasename(files[0].name) : 'images_combined';
  onProgress?.(100, 'Done');

  return createOutputArtifact(`${baseName}.pdf`, pdfBytes, 'application/pdf', {
    pageCount: files.length,
    summaryNote: `${files.length} image(s) converted into a ${files.length}-page PDF.`,
  });
}

function wrapLinesForPdf(doc: jsPDF, text: string, maxWidth: number): string[] {
  const clean = text.replace(/\r\n/g, '\n');
  const rawParagraphs = clean.split('\n');
  const out: string[] = [];
  for (const para of rawParagraphs) {
    if (!para.trim()) {
      out.push('');
    } else {
      const wrapped = doc.splitTextToSize(para, maxWidth) as string[];
      out.push(...wrapped);
    }
  }
  return out;
}

export async function convertWordToPdf(
  fileItem: PdfSuiteFileItem,
  onProgress?: ProgressCallback
): Promise<{ artifact: PdfOutputArtifact; htmlPreview: string; warnings: string[] }> {
  onProgress?.(15, 'Parsing Word (.docx) structure locally...');
  const buf = fileItem.bytes.slice().buffer;
  const result = await mammoth.convertToHtml({ arrayBuffer: buf });
  const html = result.value || '<p>(Empty document)</p>';
  const warnings = result.messages.map((m) => m.message);

  onProgress?.(55, 'Laying out formatted PDF pages...');
  const parser = new DOMParser();
  const dom = parser.parseFromString(html, 'text/html');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const renderBlock = (el: Element) => {
    const tag = el.tagName.toLowerCase();
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text && tag !== 'table') return;

    if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
      const size = tag === 'h1' ? 18 : tag === 'h2' ? 14 : 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(size);
      doc.setTextColor(15, 23, 42);
      const lines = wrapLinesForPdf(doc, text, maxWidth);
      y += tag === 'h1' ? 8 : 5;
      for (const line of lines) {
        ensureSpace(size * 1.4);
        doc.text(line, margin, y);
        y += size * 1.35;
      }
      y += 4;
      return;
    }

    if (tag === 'ul' || tag === 'ol') {
      const lis = Array.from(el.querySelectorAll(':scope > li'));
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(30, 41, 59);
      lis.forEach((li, idx) => {
        const prefix = tag === 'ol' ? `${idx + 1}. ` : '• ';
        const liText = `${prefix}${(li.textContent || '').replace(/\s+/g, ' ').trim()}`;
        const lines = wrapLinesForPdf(doc, liText, maxWidth - 14);
        for (const line of lines) {
          ensureSpace(15);
          doc.text(line, margin + 10, y);
          y += 14.5;
        }
      });
      y += 4;
      return;
    }

    if (tag === 'table') {
      const rows = Array.from(el.querySelectorAll('tr'));
      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const cells = Array.from(rows[rIdx].querySelectorAll('th, td'));
        if (cells.length === 0) continue;
        const colW = maxWidth / cells.length;
        const cellLines = cells.map((c) => {
          doc.setFont('helvetica', rIdx === 0 ? 'bold' : 'normal');
          doc.setFontSize(9.5);
          return doc.splitTextToSize((c.textContent || '').trim(), Math.max(20, colW - 8)) as string[];
        });
        const maxLines = Math.max(1, ...cellLines.map((l) => l.length));
        const rowH = maxLines * 13 + 8;
        ensureSpace(rowH);
        cells.forEach((_, cIdx) => {
          const x = margin + cIdx * colW;
          if (rIdx === 0) {
            doc.setFillColor(241, 245, 249);
            doc.rect(x, y - 10, colW, rowH, 'FD');
          } else {
            doc.rect(x, y - 10, colW, rowH, 'S');
          }
          doc.setFont('helvetica', rIdx === 0 ? 'bold' : 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(15, 23, 42);
          cellLines[cIdx].forEach((l, li) => {
            doc.text(l, x + 4, y + li * 13);
          });
        });
        y += rowH;
      }
      y += 6;
      return;
    }

    // Default paragraph / blockquote
    doc.setFont('helvetica', tag === 'blockquote' ? 'italic' : 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);
    const lines = wrapLinesForPdf(doc, text, maxWidth);
    for (const line of lines) {
      ensureSpace(15);
      doc.text(line, tag === 'blockquote' ? margin + 12 : margin, y);
      y += 14.5;
    }
    y += 5;
  };

  const bodyChildren = Array.from(dom.body.children);
  if (bodyChildren.length === 0) {
    const fallbackText = (dom.body.textContent || '').trim();
    if (fallbackText) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      for (const l of wrapLinesForPdf(doc, fallbackText, maxWidth)) {
        ensureSpace(15);
        doc.text(l, margin, y);
        y += 15;
      }
    }
  } else {
    bodyChildren.forEach(renderBlock);
  }

  onProgress?.(92, 'Generating PDF file...');
  const arrayBuffer = doc.output('arraybuffer');
  const baseName = sanitizeOutputBasename(fileItem.name);
  onProgress?.(100, 'Done');

  return {
    htmlPreview: html,
    warnings,
    artifact: createOutputArtifact(`${baseName}.pdf`, new Uint8Array(arrayBuffer), 'application/pdf', {
      pageCount: doc.getNumberOfPages(),
      summaryNote: `Converted .docx into ${doc.getNumberOfPages()}-page PDF`,
    }),
  };
}

export async function convertExcelToPdf(
  fileItem: PdfSuiteFileItem,
  options?: { orientation?: 'portrait' | 'landscape'; selectedSheet?: string },
  onProgress?: ProgressCallback
): Promise<{ artifact: PdfOutputArtifact; sheetNames: string[]; previewRows: string[][] }> {
  onProgress?.(15, 'Parsing workbook sheets...');
  const workbook = XLSX.read(fileItem.bytes.slice(), { type: 'array' });
  const sheetNames = workbook.SheetNames || [];
  if (sheetNames.length === 0) {
    throw new Error('No readable worksheets were found in this file.');
  }

  const targetSheets =
    options?.selectedSheet && sheetNames.includes(options.selectedSheet)
      ? [options.selectedSheet]
      : sheetNames;

  const orientation = options?.orientation || 'landscape';
  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 32;
  const usableWidth = pageWidth - margin * 2;

  let firstSheetPreview: string[][] = [];

  for (let sIdx = 0; sIdx < targetSheets.length; sIdx++) {
    const sName = targetSheets[sIdx];
    onProgress?.(20 + Math.round(((sIdx + 1) / targetSheets.length) * 65), `Rendering sheet "${sName}"...`);

    if (sIdx > 0) doc.addPage();
    const sheet = workbook.Sheets[sName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][];
    const normalizedRows: string[][] = rows.map((r) => r.map((cell) => String(cell ?? '')));

    if (sIdx === 0) {
      firstSheetPreview = normalizedRows.slice(0, 25);
    }

    let y = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(`${fileItem.name} — ${sName}`, margin, y);
    y += 18;

    const maxCols = Math.min(12, Math.max(1, ...normalizedRows.map((r) => r.length)));
    const colW = usableWidth / maxCols;

    for (let rIdx = 0; rIdx < normalizedRows.length; rIdx++) {
      const row = normalizedRows[rIdx].slice(0, maxCols);
      const isHeader = rIdx === 0;
      doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
      doc.setFontSize(8.5);

      const wrappedCols = Array.from({ length: maxCols }, (_, cIdx) =>
        doc.splitTextToSize(row[cIdx] || '', Math.max(18, colW - 6)) as string[]
      );
      const maxLines = Math.max(1, ...wrappedCols.map((lines) => Math.min(4, lines.length)));
      const rowHeight = maxLines * 11 + 6;

      if (y + rowHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      doc.setDrawColor(203, 213, 225);
      for (let cIdx = 0; cIdx < maxCols; cIdx++) {
        const x = margin + cIdx * colW;
        if (isHeader) {
          doc.setFillColor(226, 232, 240);
          doc.rect(x, y, colW, rowHeight, 'FD');
        } else {
          doc.rect(x, y, colW, rowHeight, 'S');
        }
        doc.setTextColor(15, 23, 42);
        const lines = wrappedCols[cIdx].slice(0, 4);
        lines.forEach((line, lIdx) => {
          doc.text(line, x + 3, y + 10 + lIdx * 11);
        });
      }

      y += rowHeight;
    }
  }

  onProgress?.(94, 'Exporting spreadsheet PDF...');
  const baseName = sanitizeOutputBasename(fileItem.name);
  const pdfBuffer = doc.output('arraybuffer');
  onProgress?.(100, 'Done');

  return {
    sheetNames,
    previewRows: firstSheetPreview,
    artifact: createOutputArtifact(`${baseName}.pdf`, new Uint8Array(pdfBuffer), 'application/pdf', {
      pageCount: doc.getNumberOfPages(),
      summaryNote: `${targetSheets.length} sheet(s) exported to ${doc.getNumberOfPages()}-page ${orientation} PDF.`,
    }),
  };
}

export interface ParsedPptSlide {
  slideNumber: number;
  title: string;
  paragraphs: string[];
  notes: string;
  images: { bytes: Uint8Array; ext: string }[];
}

export async function convertPptToPdf(
  fileItem: PdfSuiteFileItem,
  onProgress?: ProgressCallback
): Promise<{ artifact: PdfOutputArtifact; slides: ParsedPptSlide[] }> {
  onProgress?.(10, 'Unpacking .pptx presentation archive...');
  const zip = await JSZip.loadAsync(fileItem.bytes.slice());

  // Identify slides sorted numerically (slide1.xml, slide2.xml, ...)
  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/i.test(p))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      const nb = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
      return na - nb;
    });

  if (slidePaths.length === 0) {
    throw new Error('No slides (ppt/slides/slide*.xml) were found in this .pptx file.');
  }

  const slides: ParsedPptSlide[] = [];
  const parser = new DOMParser();

  for (let i = 0; i < slidePaths.length; i++) {
    const slidePath = slidePaths[i];
    const slideNum = i + 1;
    onProgress?.(15 + Math.round(((i + 1) / slidePaths.length) * 45), `Reading slide ${slideNum} of ${slidePaths.length}...`);

    const xmlText = await zip.files[slidePath].async('string');
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

    // Collect paragraphs (<a:p>) containing text runs (<a:t>)
    const pElements = Array.from(xmlDoc.getElementsByTagName('a:p'));
    const rawParas: string[] = [];
    for (const pEl of pElements) {
      const tNodes = Array.from(pEl.getElementsByTagName('a:t'));
      const combined = tNodes.map((n) => n.textContent || '').join('').trim();
      if (combined) rawParas.push(combined);
    }

    const title = rawParas[0] || `Slide ${slideNum}`;
    const paragraphs = rawParas.slice(1);

    // Optional slide speaker notes
    let notes = '';
    const notePath = `ppt/notesSlides/notesSlide${slideNum}.xml`;
    if (zip.files[notePath]) {
      const noteXml = await zip.files[notePath].async('string');
      const noteDoc = parser.parseFromString(noteXml, 'application/xml');
      notes = Array.from(noteDoc.getElementsByTagName('a:t'))
        .map((n) => n.textContent || '')
        .join(' ')
        .trim();
    }

    // Embedded images referenced by this slide's .rels file
    const relsPath = slidePath.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
    const images: { bytes: Uint8Array; ext: string }[] = [];
    if (zip.files[relsPath]) {
      const relsXml = await zip.files[relsPath].async('string');
      const relsDoc = parser.parseFromString(relsXml, 'application/xml');
      const relNodes = Array.from(relsDoc.getElementsByTagName('Relationship'));
      for (const rel of relNodes) {
        const type = rel.getAttribute('Type') || '';
        const target = rel.getAttribute('Target') || '';
        if (type.includes('/image') && target) {
          const cleanMediaPath = target.replace(/^\.\.\//, 'ppt/');
          const mediaFile = zip.files[cleanMediaPath];
          if (mediaFile) {
            const mediaBytes = await mediaFile.async('uint8array');
            const ext = cleanMediaPath.split('.').pop()?.toLowerCase() || 'png';
            if (['png', 'jpg', 'jpeg'].includes(ext)) {
              images.push({ bytes: mediaBytes, ext });
            }
          }
        }
      }
    }

    slides.push({ slideNumber: slideNum, title, paragraphs, notes, images });
  }

  onProgress?.(68, 'Building 16:9 widescreen PDF presentation...');
  // 16:9 slide PDF (960 x 540 pt)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [960, 540] });

  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    if (i > 0) doc.addPage([960, 540], 'landscape');

    // Slide background & header accent bar
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 960, 540, 'F');
    doc.setFillColor(29, 78, 216);
    doc.rect(0, 0, 960, 10, 'F');

    // Slide title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(15, 23, 42);
    const titleLines = doc.splitTextToSize(s.title, 860) as string[];
    let y = 58;
    for (const tl of titleLines.slice(0, 2)) {
      doc.text(tl, 48, y);
      y += 30;
    }

    // Subtle divider
    doc.setDrawColor(226, 232, 240);
    doc.line(48, y, 912, y);
    y += 26;

    const hasImages = s.images.length > 0;
    const textMaxW = hasImages ? 520 : 860;

    // Slide body paragraphs
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(15);
    doc.setTextColor(51, 65, 85);
    for (const para of s.paragraphs) {
      if (y > 480) break;
      const pLines = doc.splitTextToSize(`• ${para}`, textMaxW) as string[];
      for (const pl of pLines) {
        if (y > 480) break;
        doc.text(pl, 48, y);
        y += 22;
      }
      y += 6;
    }

    // First embedded slide image on the right column
    if (hasImages) {
      try {
        const firstImg = s.images[0];
        const mime = firstImg.ext === 'png' ? 'PNG' : 'JPEG';
        doc.addImage(firstImg.bytes, mime, 600, 120, 310, 230, undefined, 'MEDIUM');
      } catch {
        // Ignore unrenderable vector WMF/EMF media gracefully
      }
    }

    // Slide footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`${fileItem.name} · Slide ${s.slideNumber} of ${slides.length}`, 48, 514);
  }

  onProgress?.(94, 'Writing PDF bytes...');
  const pdfBuf = doc.output('arraybuffer');
  const baseName = sanitizeOutputBasename(fileItem.name);
  onProgress?.(100, 'Done');

  return {
    slides,
    artifact: createOutputArtifact(`${baseName}.pdf`, new Uint8Array(pdfBuf), 'application/pdf', {
      pageCount: slides.length,
      summaryNote: `${slides.length} slide(s) converted to 16:9 PDF.`,
    }),
  };
}

export async function convertTxtToPdf(
  textContent: string,
  filenameBase: string,
  options: {
    fontSize: number;
    fontFamily: 'helvetica' | 'times' | 'courier';
    pageSize: 'a4' | 'letter';
    marginPt: number;
  },
  onProgress?: ProgressCallback
): Promise<PdfOutputArtifact> {
  onProgress?.(20, 'Paginating plain text lines...');
  const pdfDoc = await PDFDocument.create();

  const fontMap = {
    helvetica: StandardFonts.Helvetica,
    times: StandardFonts.TimesRoman,
    courier: StandardFonts.Courier,
  };
  const font = await pdfDoc.embedFont(fontMap[options.fontFamily]);
  const pageDims: [number, number] = options.pageSize === 'a4' ? [595.28, 841.89] : [612, 792];
  const [pageW, pageH] = pageDims;
  const maxWidth = pageW - options.marginPt * 2;
  const lineHeight = options.fontSize * 1.42;

  // Replace unsupported control chars / non-WinAnsi glyphs safely so StandardFont won't throw
  const sanitizeForWinAnsi = (str: string) =>
    str.replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');

  const paragraphs = textContent.replace(/\r\n/g, '\n').split('\n');
  const wrappedLines: string[] = [];

  for (const para of paragraphs) {
    const safePara = sanitizeForWinAnsi(para);
    if (!safePara.trim()) {
      wrappedLines.push('');
      continue;
    }
    const words = safePara.split(/\s+/);
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, options.fontSize) <= maxWidth) {
        current = candidate;
      } else {
        if (current) wrappedLines.push(current);
        current = word;
      }
    }
    if (current) wrappedLines.push(current);
  }

  if (wrappedLines.length === 0) wrappedLines.push('');

  let page = pdfDoc.addPage(pageDims);
  let y = pageH - options.marginPt - options.fontSize;

  for (const line of wrappedLines) {
    if (y < options.marginPt) {
      page = pdfDoc.addPage(pageDims);
      y = pageH - options.marginPt - options.fontSize;
    }
    if (line) {
      page.drawText(line, {
        x: options.marginPt,
        y,
        size: options.fontSize,
        font,
        color: rgb(0.09, 0.12, 0.18),
      });
    }
    y -= lineHeight;
  }

  onProgress?.(90, 'Saving PDF binary...');
  const pdfBytes = await pdfDoc.save();
  const baseName = sanitizeOutputBasename(filenameBase || 'text_document');
  onProgress?.(100, 'Done');

  return createOutputArtifact(`${baseName}.pdf`, pdfBytes, 'application/pdf', {
    pageCount: pdfDoc.getPageCount(),
    summaryNote: `${wrappedLines.length} lines formatted across ${pdfDoc.getPageCount()} page(s).`,
  });
}
