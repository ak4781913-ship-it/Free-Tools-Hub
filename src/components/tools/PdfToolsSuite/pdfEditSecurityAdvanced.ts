/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';
import { Document, Packer, Paragraph, TextRun, PageBreak } from 'docx';
import {
  PdfHeaderFooterConfig,
  PdfImageOverlay,
  PdfMetadataInfo,
  PdfOutputArtifact,
  PdfPageNumberConfig,
  PdfSearchMatch,
  PdfSuiteFileItem,
  PdfTextOverlay,
  PdfWatermarkConfig,
} from './pdfSuiteTypes';
import {
  createOutputArtifact,
  inspectPdfQuick,
  closePdfJsDocument,
  openPdfJsDocument,
  parsePageRanges,
  renderPdfPageToDataUrl,
  runQpdfCommand,
} from './pdfEngineCore';
import { sanitizeOutputBasename } from './pdfValidation';
import { ProgressCallback } from './pdfConverters';

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0');
  const num = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(num)) return rgb(0.1, 0.1, 0.1);
  return rgb(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
}

function sanitizeWinAnsi(str: string): string {
  return str.replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
}

// ===========================================================================
// CATEGORY E: EDIT PDF (Text, Images, Page Numbers, Watermarks, Headers/Footers)
// ===========================================================================

export async function applyPdfEdits(
  fileItem: PdfSuiteFileItem,
  edits: {
    textOverlays: PdfTextOverlay[];
    imageOverlays: PdfImageOverlay[];
    watermark: PdfWatermarkConfig;
    pageNumbers: PdfPageNumberConfig;
    headerFooter: PdfHeaderFooterConfig;
  },
  onProgress?: ProgressCallback
): Promise<PdfOutputArtifact> {
  onProgress?.(10, 'Loading PDF document...');
  const pdfDoc = await PDFDocument.load(fileItem.bytes);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  // Pre-embed unique overlay images by id
  const embeddedOverlayImages = new Map<string, Awaited<ReturnType<typeof pdfDoc.embedPng>>>();
  for (const imgOv of edits.imageOverlays) {
    const emb =
      imgOv.mimeType === 'image/png'
        ? await pdfDoc.embedPng(imgOv.bytes)
        : await pdfDoc.embedJpg(imgOv.bytes);
    embeddedOverlayImages.set(imgOv.id, emb);
  }

  let watermarkEmbeddedImg: Awaited<ReturnType<typeof pdfDoc.embedPng>> | null = null;
  if (edits.watermark.enabled && edits.watermark.type === 'image' && edits.watermark.imageBytes) {
    watermarkEmbeddedImg =
      edits.watermark.imageMime === 'image/png'
        ? await pdfDoc.embedPng(edits.watermark.imageBytes)
        : await pdfDoc.embedJpg(edits.watermark.imageBytes);
  }

  let watermarkPagesSet: Set<number> | null = null;
  if (edits.watermark.enabled && edits.watermark.pageScope === 'custom' && edits.watermark.customRange.trim()) {
    watermarkPagesSet = new Set(parsePageRanges(edits.watermark.customRange, totalPages));
  }

  const todayStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;
    const page = pages[i];
    const { width: pageW, height: pageH } = page.getSize();
    onProgress?.(15 + Math.round(((i + 1) / totalPages) * 75), `Applying edits to page ${pageNum} of ${totalPages}...`);

    // 1. Watermark
    if (edits.watermark.enabled && (!watermarkPagesSet || watermarkPagesSet.has(pageNum))) {
      if (edits.watermark.type === 'text' && edits.watermark.text.trim()) {
        const wmText = sanitizeWinAnsi(edits.watermark.text.trim());
        const wmSize = Math.max(12, Math.min(120, edits.watermark.fontSize));
        const textWidth = boldFont.widthOfTextAtSize(wmText, wmSize);
        const rad = (edits.watermark.rotation * Math.PI) / 180;
        const cx = pageW / 2;
        const cy = pageH / 2;
        // Center rotated text around page center
        const drawX = cx - (textWidth / 2) * Math.cos(rad) + (wmSize / 3) * Math.sin(rad);
        const drawY = cy - (textWidth / 2) * Math.sin(rad) - (wmSize / 3) * Math.cos(rad);

        page.drawText(wmText, {
          x: drawX,
          y: drawY,
          size: wmSize,
          font: boldFont,
          color: hexToRgb(edits.watermark.color),
          opacity: Math.max(0.05, Math.min(1, edits.watermark.opacity)),
          rotate: degrees(edits.watermark.rotation),
        });
      } else if (edits.watermark.type === 'image' && watermarkEmbeddedImg) {
        const targetW = (pageW * Math.max(10, Math.min(90, edits.watermark.imageScalePercent))) / 100;
        const ratio = watermarkEmbeddedImg.height / watermarkEmbeddedImg.width;
        const targetH = targetW * ratio;
        page.drawImage(watermarkEmbeddedImg, {
          x: (pageW - targetW) / 2,
          y: (pageH - targetH) / 2,
          width: targetW,
          height: targetH,
          opacity: Math.max(0.05, Math.min(1, edits.watermark.opacity)),
        });
      }
    }

    // 2. Headers & Footers
    if (edits.headerFooter.enabled && !(edits.headerFooter.skipFirstPage && pageNum === 1)) {
      const hf = edits.headerFooter;
      const fontSize = Math.max(7, Math.min(20, hf.fontSize));
      const color = hexToRgb(hf.color);
      const marginX = 36;
      const headerY = pageH - 28;
      const footerY = 22;

      const replaceTokens = (tpl: string) =>
        sanitizeWinAnsi(
          tpl
            .replace(/\{page\}/gi, String(pageNum))
            .replace(/\{total\}/gi, String(totalPages))
            .replace(/\{date\}/gi, todayStr)
        );

      const hL = replaceTokens(hf.headerLeft);
      const hC = replaceTokens(hf.headerCenter);
      const hR = replaceTokens(hf.headerRight);
      const fL = replaceTokens(hf.footerLeft);
      const fC = replaceTokens(hf.footerCenter);
      const fR = replaceTokens(hf.footerRight);

      if (hL) page.drawText(hL, { x: marginX, y: headerY, size: fontSize, font: regularFont, color });
      if (hC) {
        const w = regularFont.widthOfTextAtSize(hC, fontSize);
        page.drawText(hC, { x: Math.max(marginX, (pageW - w) / 2), y: headerY, size: fontSize, font: regularFont, color });
      }
      if (hR) {
        const w = regularFont.widthOfTextAtSize(hR, fontSize);
        page.drawText(hR, { x: Math.max(marginX, pageW - marginX - w), y: headerY, size: fontSize, font: regularFont, color });
      }

      if (fL) page.drawText(fL, { x: marginX, y: footerY, size: fontSize, font: regularFont, color });
      if (fC) {
        const w = regularFont.widthOfTextAtSize(fC, fontSize);
        page.drawText(fC, { x: Math.max(marginX, (pageW - w) / 2), y: footerY, size: fontSize, font: regularFont, color });
      }
      if (fR) {
        const w = regularFont.widthOfTextAtSize(fR, fontSize);
        page.drawText(fR, { x: Math.max(marginX, pageW - marginX - w), y: footerY, size: fontSize, font: regularFont, color });
      }

      if (hf.showDividerLine) {
        if (hL || hC || hR) {
          page.drawLine({
            start: { x: marginX, y: headerY - 6 },
            end: { x: pageW - marginX, y: headerY - 6 },
            thickness: 0.6,
            color: rgb(0.8, 0.84, 0.89),
          });
        }
        if (fL || fC || fR) {
          page.drawLine({
            start: { x: marginX, y: footerY + fontSize + 4 },
            end: { x: pageW - marginX, y: footerY + fontSize + 4 },
            thickness: 0.6,
            color: rgb(0.8, 0.84, 0.89),
          });
        }
      }
    }

    // 3. Page Numbers
    if (edits.pageNumbers.enabled) {
      const pn = edits.pageNumbers;
      const displayNum = pn.startFrom + i;
      const displayTotal = pn.startFrom + totalPages - 1;
      const label =
        pn.format === 'page-x-of-n'
          ? `Page ${displayNum} of ${displayTotal}`
          : pn.format === 'x-slash-n'
          ? `${displayNum} / ${displayTotal}`
          : `${displayNum}`;

      const sz = Math.max(8, Math.min(24, pn.fontSize));
      const tw = regularFont.widthOfTextAtSize(label, sz);
      const m = Math.max(12, pn.marginPt);

      let x = (pageW - tw) / 2;
      if (pn.position.endsWith('left')) x = m;
      if (pn.position.endsWith('right')) x = Math.max(m, pageW - m - tw);

      const y = pn.position.startsWith('top') ? pageH - m - sz : m;

      page.drawText(label, {
        x,
        y,
        size: sz,
        font: regularFont,
        color: hexToRgb(pn.color),
      });
    }

    // 4. Draggable / Resizable Image Overlays on this page
    const pageImages = edits.imageOverlays.filter((ov) => ov.page === pageNum);
    for (const imgOv of pageImages) {
      const emb = embeddedOverlayImages.get(imgOv.id);
      if (!emb) continue;
      const drawW = (imgOv.widthPercent / 100) * pageW;
      const drawH = (imgOv.heightPercent / 100) * pageH;
      const drawX = (imgOv.xPercent / 100) * pageW;
      const drawY = pageH - ((imgOv.yPercent + imgOv.heightPercent) / 100) * pageH;

      page.drawImage(emb, {
        x: drawX,
        y: drawY,
        width: drawW,
        height: drawH,
        opacity: Math.max(0.1, Math.min(1, imgOv.opacity)),
      });
    }

    // 5. Draggable / Resizable Text Overlays on this page
    const pageTexts = edits.textOverlays.filter((ov) => ov.page === pageNum && ov.text.trim());
    for (const txtOv of pageTexts) {
      const font = txtOv.bold ? boldFont : regularFont;
      const sz = Math.max(8, Math.min(72, txtOv.fontSize));
      const drawX = (txtOv.xPercent / 100) * pageW;
      const boxMaxW = Math.max(40, (txtOv.widthPercent / 100) * pageW);
      let drawY = pageH - (txtOv.yPercent / 100) * pageH - sz;

      const rawLines = sanitizeWinAnsi(txtOv.text).split('\n');
      const wrappedLines: string[] = [];
      for (const rl of rawLines) {
        if (!rl.trim()) {
          wrappedLines.push('');
          continue;
        }
        const words = rl.split(/\s+/);
        let cur = '';
        for (const w of words) {
          const cand = cur ? `${cur} ${w}` : w;
          if (font.widthOfTextAtSize(cand, sz) <= boxMaxW) {
            cur = cand;
          } else {
            if (cur) wrappedLines.push(cur);
            cur = w;
          }
        }
        if (cur) wrappedLines.push(cur);
      }

      for (const line of wrappedLines) {
        if (line) {
          page.drawText(line, {
            x: drawX,
            y: drawY,
            size: sz,
            font,
            color: hexToRgb(txtOv.color),
            opacity: Math.max(0.1, Math.min(1, txtOv.opacity)),
          });
        }
        drawY -= sz * 1.25;
      }
    }
  }

  onProgress?.(94, 'Saving edited PDF...');
  const outBytes = await pdfDoc.save({ useObjectStreams: true });
  const baseName = sanitizeOutputBasename(fileItem.name);
  onProgress?.(100, 'Done');

  return createOutputArtifact(`${baseName}_edited.pdf`, outBytes, 'application/pdf', {
    pageCount: totalPages,
    summaryNote: `Saved edited ${totalPages}-page PDF.`,
  });
}

// ===========================================================================
// CATEGORY F: PDF SECURITY (Protect, Unlock, Status)
// ===========================================================================

export async function protectPdfWithPassword(
  fileItem: PdfSuiteFileItem,
  options: {
    userPassword: string;
    ownerPassword?: string;
    allowPrinting: boolean;
    allowModifying: boolean;
    allowCopying: boolean;
  },
  onProgress?: ProgressCallback
): Promise<{ artifact: PdfOutputArtifact; encryptionMethod: string; verifiedEncrypted: boolean }> {
  const userPw = options.userPassword;
  if (!userPw) {
    throw new Error('Please enter a non-empty password to protect the PDF.');
  }
  const ownerPw = options.ownerPassword?.trim() || `${userPw}_owner`;

  onProgress?.(25, 'Encrypting PDF with 256-bit AES protection...');
  let encryptedBytes: Uint8Array;
  let encryptionMethod = 'QPDF 256-bit AES Encryption';

  try {
    const res = await runQpdfCommand(fileItem.bytes, (inPath, outPath) => [
      '--encrypt',
      userPw,
      ownerPw,
      '256',
      `--print=${options.allowPrinting ? 'full' : 'none'}`,
      `--modify=${options.allowModifying ? 'all' : 'none'}`,
      `--extract=${options.allowCopying ? 'y' : 'n'}`,
      '--',
      inPath,
      outPath,
    ]);
    encryptedBytes = res.outputBytes;
  } catch {
    // Fallback to pure-JS RC4 128-bit encryption if WASM runtime fails
    onProgress?.(55, 'Applying 128-bit RC4 PDF encryption...');
    encryptionMethod = 'RC4 128-bit Standard PDF Encryption';
    encryptedBytes = await encryptPDF(fileItem.bytes, userPw, ownerPw);
  }

  onProgress?.(85, 'Verifying encrypted PDF status...');
  const verify = await inspectPdfQuick(encryptedBytes);
  const baseName = sanitizeOutputBasename(fileItem.name);
  onProgress?.(100, 'Done');

  return {
    encryptionMethod,
    verifiedEncrypted: verify.isEncrypted,
    artifact: createOutputArtifact(`${baseName}_protected.pdf`, encryptedBytes, 'application/pdf', {
      pageCount: fileItem.pageCount,
      summaryNote: `Encrypted with ${encryptionMethod}. Password required to open.`,
    }),
  };
}

export async function unlockPdfWithAuthorizedPassword(
  fileItem: PdfSuiteFileItem,
  password: string,
  onProgress?: ProgressCallback
): Promise<{ artifact: PdfOutputArtifact; verifiedUnlocked: boolean }> {
  if (!password) {
    throw new Error('Please enter the authorized password for this protected PDF.');
  }

  onProgress?.(25, 'Validating authorized password & decrypting PDF...');
  let decryptedBytes: Uint8Array;
  try {
    const res = await runQpdfCommand(fileItem.bytes, (inPath, outPath) => [
      `--password=${password}`,
      '--decrypt',
      inPath,
      outPath,
    ]);
    decryptedBytes = res.outputBytes;
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : '';
    if (msg.includes('password') || msg.includes('invalid')) {
      throw new Error('Incorrect password. Please verify the authorized password and try again.');
    }
    throw new Error(err instanceof Error ? err.message : 'Unable to decrypt PDF with the supplied password.');
  }

  onProgress?.(85, 'Verifying decrypted output...');
  const verify = await inspectPdfQuick(decryptedBytes);
  if (verify.isEncrypted) {
    throw new Error('Decryption did not remove encryption flags. Please check the password.');
  }

  const baseName = sanitizeOutputBasename(fileItem.name);
  onProgress?.(100, 'Done');

  return {
    verifiedUnlocked: !verify.isEncrypted,
    artifact: createOutputArtifact(`${baseName}_unlocked.pdf`, decryptedBytes, 'application/pdf', {
      pageCount: verify.pageCount || fileItem.pageCount,
      summaryNote: 'Authorized password verified; encryption removed cleanly.',
    }),
  };
}

// ===========================================================================
// CATEGORY G: ADVANCED PDF TOOLS
// ===========================================================================

export interface ExtractedEmbeddedImage {
  id: string;
  page: number;
  width: number;
  height: number;
  artifact: PdfOutputArtifact;
}

export async function extractImagesFromPdf(
  fileItem: PdfSuiteFileItem,
  onProgress?: ProgressCallback
): Promise<ExtractedEmbeddedImage[]> {
  onProgress?.(10, 'Scanning PDF pages for embedded images...');
  const doc = await openPdfJsDocument(fileItem.bytes);
  const totalPages = doc.numPages;
  const baseName = sanitizeOutputBasename(fileItem.name);
  const extracted: ExtractedEmbeddedImage[] = [];
  const seenObjectKeys = new Set<string>();

  try {
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      onProgress?.(10 + Math.round((pageNum / totalPages) * 85), `Inspecting page ${pageNum} of ${totalPages}...`);
      const page = await doc.getPage(pageNum);
      // Force operator list + object resolution by ensuring viewport & operatorList
      const opList = await page.getOperatorList();

      for (let idx = 0; idx < opList.fnArray.length; idx++) {
        const fn = opList.fnArray[idx];
        if (fn !== pdfjsLib.OPS.paintImageXObject && fn !== pdfjsLib.OPS.paintInlineImageXObject) {
          continue;
        }

        const arg = opList.argsArray[idx]?.[0];
        let imgDataObj: unknown = null;
        let objKey = '';

        if (fn === pdfjsLib.OPS.paintInlineImageXObject && arg && typeof arg === 'object') {
          imgDataObj = arg;
          objKey = `inline_p${pageNum}_${idx}`;
        } else if (typeof arg === 'string') {
          objKey = arg;
          if (seenObjectKeys.has(objKey)) continue;
          try {
            imgDataObj = await new Promise<unknown>((resolve) => {
              const timeout = setTimeout(() => resolve(null), 1500);
              const pool = objKey.startsWith('g_') ? page.commonObjs : page.objs;
              pool.get(objKey, (data: unknown) => {
                clearTimeout(timeout);
                resolve(data);
              });
            });
          } catch {
            imgDataObj = null;
          }
        }

        if (!imgDataObj || seenObjectKeys.has(objKey)) continue;
        seenObjectKeys.add(objKey);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        const candidate = imgDataObj as {
          bitmap?: ImageBitmap;
          data?: Uint8ClampedArray | Uint8Array;
          width?: number;
          height?: number;
          kind?: number;
        };

        if (typeof ImageBitmap !== 'undefined' && candidate instanceof ImageBitmap) {
          canvas.width = candidate.width;
          canvas.height = candidate.height;
          ctx.drawImage(candidate, 0, 0);
        } else if (candidate.bitmap) {
          canvas.width = candidate.bitmap.width;
          canvas.height = candidate.bitmap.height;
          ctx.drawImage(candidate.bitmap, 0, 0);
        } else if (candidate.data && candidate.width && candidate.height) {
          const w = candidate.width;
          const h = candidate.height;
          canvas.width = w;
          canvas.height = h;
          const rgba = new Uint8ClampedArray(w * h * 4);
          const raw = candidate.data;
          if (raw.length === w * h * 4) {
            rgba.set(raw);
          } else if (raw.length === w * h * 3) {
            for (let p = 0, q = 0; p < raw.length; p += 3, q += 4) {
              rgba[q] = raw[p];
              rgba[q + 1] = raw[p + 1];
              rgba[q + 2] = raw[p + 2];
              rgba[q + 3] = 255;
            }
          } else if (raw.length === w * h) {
            for (let p = 0, q = 0; p < raw.length; p += 1, q += 4) {
              const v = raw[p];
              rgba[q] = v;
              rgba[q + 1] = v;
              rgba[q + 2] = v;
              rgba[q + 3] = 255;
            }
          } else {
            continue;
          }
          ctx.putImageData(new ImageData(rgba, w, h), 0, 0);
        } else {
          continue;
        }

        if (canvas.width < 4 || canvas.height < 4) continue;

        const pngBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/png');
        });
        if (!pngBlob) continue;

        const imgIndex = extracted.length + 1;
        const art = createOutputArtifact(
          `${baseName}_img_${imgIndex}_p${pageNum}.png`,
          pngBlob,
          'image/png',
          { summaryNote: `Page ${pageNum} · ${canvas.width} × ${canvas.height} px` }
        );
        art.previewUrl = art.url;
        extracted.push({
          id: art.id,
          page: pageNum,
          width: canvas.width,
          height: canvas.height,
          artifact: art,
        });
      }
    }
  } finally {
    await closePdfJsDocument(doc);
  }

  onProgress?.(100, 'Done');
  return extracted;
}

export async function updatePdfMetadataFields(
  fileItem: PdfSuiteFileItem,
  fields: Partial<Pick<PdfMetadataInfo, 'title' | 'author' | 'subject' | 'keywords' | 'creator'>>,
  onProgress?: ProgressCallback
): Promise<PdfOutputArtifact> {
  onProgress?.(30, 'Updating PDF metadata dictionary...');
  const pdfDoc = await PDFDocument.load(fileItem.bytes);
  if (fields.title !== undefined) pdfDoc.setTitle(fields.title);
  if (fields.author !== undefined) pdfDoc.setAuthor(fields.author);
  if (fields.subject !== undefined) pdfDoc.setSubject(fields.subject);
  if (fields.keywords !== undefined) {
    const kws = fields.keywords
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    pdfDoc.setKeywords(kws);
  }
  if (fields.creator !== undefined) pdfDoc.setCreator(fields.creator);
  pdfDoc.setModificationDate(new Date());

  onProgress?.(85, 'Saving updated PDF...');
  const outBytes = await pdfDoc.save({ useObjectStreams: true });
  const baseName = sanitizeOutputBasename(fileItem.name);
  onProgress?.(100, 'Done');

  return createOutputArtifact(`${baseName}_metadata_updated.pdf`, outBytes, 'application/pdf', {
    pageCount: pdfDoc.getPageCount(),
    summaryNote: 'PDF metadata updated cleanly.',
  });
}

export async function runPdfOcr(
  fileItem: PdfSuiteFileItem,
  options: {
    lang: string; // e.g. 'eng', 'urd', 'ara', 'eng+ara'
    pageRange?: string;
    outputFormat: 'txt' | 'docx';
  },
  onProgress?: ProgressCallback
): Promise<{
  artifact: PdfOutputArtifact;
  extractedText: string;
  avgConfidence: number;
  pagesProcessed: number;
}> {
  const totalPages = fileItem.pageCount || 1;
  const targetPages = options.pageRange?.trim()
    ? parsePageRanges(options.pageRange, totalPages)
    : Array.from({ length: totalPages }, (_, i) => i + 1);

  onProgress?.(5, `Initializing Tesseract OCR engine (${options.lang})...`);
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(options.lang, 1, {
    logger: (m: { status?: string; progress?: number }) => {
      if (m.status === 'loading tesseract core' || m.status === 'loading language traineddata') {
        onProgress?.(12, `Loading OCR language data (${options.lang})...`);
      }
    },
  });

  const pageTexts: { page: number; text: string; confidence: number }[] = [];

  try {
    for (let i = 0; i < targetPages.length; i++) {
      const pageNum = targetPages[i];
      const basePct = 15 + Math.round((i / targetPages.length) * 78);
      onProgress?.(basePct, `Rendering & running OCR on page ${pageNum} (${i + 1}/${targetPages.length})...`);

      const rendered = await renderPdfPageToDataUrl(fileItem.bytes, pageNum, {
        scale: 2.0,
        format: 'image/png',
      });

      const res = await worker.recognize(rendered.dataUrl);
      pageTexts.push({
        page: pageNum,
        text: (res.data.text || '').trim(),
        confidence: Math.round(res.data.confidence || 0),
      });
    }
  } finally {
    await worker.terminate();
  }

  const avgConfidence =
    pageTexts.length > 0
      ? Math.round(pageTexts.reduce((s, p) => s + p.confidence, 0) / pageTexts.length)
      : 0;

  const fullText = pageTexts
    .map((p) => `=== Page ${p.page} (OCR Confidence: ${p.confidence}%) ===\n${p.text || '(No text recognized)'}`)
    .join('\n\n');

  const baseName = sanitizeOutputBasename(fileItem.name);
  onProgress?.(95, 'Preparing OCR export file...');

  let artifact: PdfOutputArtifact;
  if (options.outputFormat === 'docx') {
    const children: Paragraph[] = [];
    pageTexts.forEach((pt, idx) => {
      const lines = (pt.text || '(No text recognized)').split('\n').filter((l) => l.trim());
      for (const l of lines) {
        children.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun(l)] }));
      }
      if (idx < pageTexts.length - 1) {
        children.push(new Paragraph({ children: [new PageBreak()] }));
      }
    });
    const doc = new Document({ sections: [{ children }] });
    const docxBlob = await Packer.toBlob(doc);
    artifact = createOutputArtifact(
      `${baseName}_ocr.docx`,
      docxBlob,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      {
        pageCount: pageTexts.length,
        textPreview: fullText.slice(0, 6000),
        summaryNote: `OCR completed across ${pageTexts.length} page(s) · Avg confidence ${avgConfidence}%`,
      }
    );
  } else {
    artifact = createOutputArtifact(`${baseName}_ocr.txt`, fullText, 'text/plain;charset=utf-8', {
      pageCount: pageTexts.length,
      textPreview: fullText.slice(0, 6000),
      summaryNote: `OCR completed across ${pageTexts.length} page(s) · Avg confidence ${avgConfidence}%`,
    });
  }

  onProgress?.(100, 'Done');
  return {
    artifact,
    extractedText: fullText,
    avgConfidence,
    pagesProcessed: pageTexts.length,
  };
}

export async function searchPdfText(
  fileItem: PdfSuiteFileItem,
  query: string,
  caseSensitive = false
): Promise<PdfSearchMatch[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const needle = caseSensitive ? cleanQuery : cleanQuery.toLowerCase();
  const doc = await openPdfJsDocument(fileItem.bytes);
  const matches: PdfSearchMatch[] = [];

  try {
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      const textContent = await page.getTextContent();

      const rects: PdfSearchMatch['rects'] = [];
      let pageTextConcat = '';
      let matchCountOnPage = 0;

      for (const item of textContent.items) {
        if (!('str' in item) || !item.str) continue;
        pageTextConcat += (pageTextConcat ? ' ' : '') + item.str;
        const hay = caseSensitive ? item.str : item.str.toLowerCase();
        if (hay.includes(needle)) {
          // Count occurrences inside this run
          let startIdx = 0;
          while (true) {
            const foundIdx = hay.indexOf(needle, startIdx);
            if (foundIdx === -1) break;
            matchCountOnPage += 1;
            startIdx = foundIdx + needle.length;
          }

          // Approximate bounding box in viewport %
          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const fontH = Math.max(8, Math.hypot(tx[2], tx[3]));
          const leftPt = tx[4];
          const baselineTopPt = tx[5];
          const widthPt = Math.max(10, item.width || cleanQuery.length * 6);

          rects.push({
            leftPercent: Math.max(0, Math.min(98, (leftPt / viewport.width) * 100)),
            topPercent: Math.max(0, Math.min(98, ((baselineTopPt - fontH) / viewport.height) * 100)),
            widthPercent: Math.max(2, Math.min(100, (widthPt / viewport.width) * 100)),
            heightPercent: Math.max(1.5, Math.min(20, ((fontH * 1.25) / viewport.height) * 100)),
          });
        }
      }

      if (matchCountOnPage > 0) {
        const hayPage = caseSensitive ? pageTextConcat : pageTextConcat.toLowerCase();
        const pos = hayPage.indexOf(needle);
        const start = Math.max(0, pos - 55);
        const end = Math.min(pageTextConcat.length, pos + needle.length + 75);
        const snippet = `${start > 0 ? '…' : ''}${pageTextConcat.slice(start, end)}${end < pageTextConcat.length ? '…' : ''}`;

        matches.push({
          page: pageNum,
          snippet,
          matchCountOnPage,
          rects,
        });
      }
    }
  } finally {
    await closePdfJsDocument(doc);
  }

  return matches;
}

export async function repairPdfDocument(
  fileItem: PdfSuiteFileItem,
  onProgress?: ProgressCallback
): Promise<{
  artifact: PdfOutputArtifact;
  repairActions: string[];
  recoveredPages: number;
}> {
  const repairActions: string[] = [];
  let workingBytes = fileItem.bytes.slice();

  onProgress?.(15, 'Inspecting %PDF- header offset and file trailer...');
  // 1. Locate %PDF- header if preceded by stray bytes
  let pdfHeaderIndex = -1;
  const limit = Math.min(workingBytes.length, 4096);
  for (let i = 0; i <= limit - 5; i++) {
    if (
      workingBytes[i] === 0x25 &&
      workingBytes[i + 1] === 0x50 &&
      workingBytes[i + 2] === 0x44 &&
      workingBytes[i + 3] === 0x46 &&
      workingBytes[i + 4] === 0x2d
    ) {
      pdfHeaderIndex = i;
      break;
    }
  }

  if (pdfHeaderIndex === -1) {
    throw new Error('No %PDF- header was found in the first 4 KB of this file. The file cannot be parsed as a PDF.');
  }
  if (pdfHeaderIndex > 0) {
    workingBytes = workingBytes.slice(pdfHeaderIndex);
    repairActions.push(`Trimmed ${pdfHeaderIndex} stray leading byte(s) before %PDF- header.`);
  }

  onProgress?.(45, 'Rebuilding XRef table and object streams via QPDF...');
  let repairedBytes: Uint8Array | null = null;

  try {
    const qpdfRes = await runQpdfCommand(workingBytes, (inPath, outPath) => [inPath, outPath]);
    repairedBytes = qpdfRes.outputBytes;
    if (qpdfRes.logs) {
      repairActions.push(`QPDF structural recovery: ${qpdfRes.logs.split('\n')[0].slice(0, 140)}`);
    } else {
      repairActions.push('QPDF cleanly rebuilt XRef table and stream dictionary.');
    }
  } catch (qpdfErr) {
    repairActions.push(
      `QPDF reported structural issue (${qpdfErr instanceof Error ? qpdfErr.message.slice(0, 90) : 'error'}); trying pdf-lib recovery...`
    );
  }

  if (!repairedBytes) {
    onProgress?.(70, 'Attempting pdf-lib tolerant page recovery...');
    const fallbackDoc = await PDFDocument.load(workingBytes, {
      ignoreEncryption: true,
      updateMetadata: false,
    });
    repairedBytes = await fallbackDoc.save({ useObjectStreams: false, updateFieldAppearances: false });
    repairActions.push('Re-serialized pages and cross-reference table with pdf-lib.');
  }

  onProgress?.(90, 'Validating repaired PDF output...');
  const verified = await inspectPdfQuick(repairedBytes);
  if (verified.pageCount <= 0 && !verified.isEncrypted) {
    throw new Error('Repair finished but 0 readable pages could be recovered from this damaged file.');
  }

  const baseName = sanitizeOutputBasename(fileItem.name);
  onProgress?.(100, 'Done');

  return {
    repairActions,
    recoveredPages: verified.pageCount,
    artifact: createOutputArtifact(`${baseName}_repaired.pdf`, repairedBytes, 'application/pdf', {
      pageCount: verified.pageCount,
      summaryNote: `Recovered ${verified.pageCount} readable page(s).`,
    }),
  };
}
