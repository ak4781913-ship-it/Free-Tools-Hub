/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PDFDocument, degrees } from 'pdf-lib';
import {
  CompressionEngineMode,
  CompressionQualityPreset,
  CompressionStats,
  PdfOutputArtifact,
  PdfSuiteFileItem,
} from './pdfSuiteTypes';
import {
  createOutputArtifact,
  parsePageRanges,
  renderPdfPageToDataUrl,
  runQpdfCommand,
} from './pdfEngineCore';
import { formatBytes, sanitizeOutputBasename } from './pdfValidation';
import { ProgressCallback } from './pdfConverters';

// ===========================================================================
// CATEGORY C: ORGANIZE PDF
// ===========================================================================

export async function mergePdfs(
  files: PdfSuiteFileItem[],
  onProgress?: ProgressCallback
): Promise<PdfOutputArtifact> {
  if (files.length < 2) {
    throw new Error('Please upload at least 2 PDF files to merge.');
  }

  const mergedPdf = await PDFDocument.create();
  let totalPages = 0;

  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    onProgress?.(Math.round(((i + 0.5) / files.length) * 90), `Merging "${item.name}"...`);

    const srcPdf = await PDFDocument.load(item.bytes);
    const srcCount = srcPdf.getPageCount();
    const pageNums = item.pageRangeFilter?.trim()
      ? parsePageRanges(item.pageRangeFilter, srcCount, { preserveOrder: true })
      : Array.from({ length: srcCount }, (_, idx) => idx + 1);

    const copiedPages = await mergedPdf.copyPages(
      srcPdf,
      pageNums.map((p) => p - 1)
    );
    for (const p of copiedPages) {
      mergedPdf.addPage(p);
      totalPages += 1;
    }
  }

  onProgress?.(95, 'Finalizing merged PDF...');
  const bytes = await mergedPdf.save({ useObjectStreams: true });
  onProgress?.(100, 'Done');

  return createOutputArtifact('merged_document.pdf', bytes, 'application/pdf', {
    pageCount: totalPages,
    summaryNote: `Merged ${files.length} PDFs (${totalPages} total pages).`,
  });
}

export async function splitPdf(
  fileItem: PdfSuiteFileItem,
  options: {
    mode: 'every-n' | 'custom-ranges' | 'single-pages';
    everyN?: number;
    customRanges?: string; // semicolon or newline separated ranges e.g. "1-3; 4-5; 6"
  },
  onProgress?: ProgressCallback
): Promise<PdfOutputArtifact[]> {
  const srcPdf = await PDFDocument.load(fileItem.bytes);
  const totalPages = srcPdf.getPageCount();
  const baseName = sanitizeOutputBasename(fileItem.name);

  const groups: { label: string; pages: number[] }[] = [];

  if (options.mode === 'single-pages') {
    for (let p = 1; p <= totalPages; p++) {
      groups.push({ label: `page_${p}`, pages: [p] });
    }
  } else if (options.mode === 'every-n') {
    const step = Math.max(1, options.everyN || 1);
    let part = 1;
    for (let start = 1; start <= totalPages; start += step) {
      const end = Math.min(totalPages, start + step - 1);
      const pages: number[] = [];
      for (let p = start; p <= end; p++) pages.push(p);
      groups.push({ label: `part_${part}_p${start}-${end}`, pages });
      part += 1;
    }
  } else {
    const rawGroups = (options.customRanges || '')
      .split(/[;\n]+/)
      .map((g) => g.trim())
      .filter(Boolean);
    if (rawGroups.length === 0) {
      throw new Error('Enter at least one range (e.g. "1-2; 3-4").');
    }
    rawGroups.forEach((rangeStr, idx) => {
      const pages = parsePageRanges(rangeStr, totalPages, { preserveOrder: true });
      groups.push({ label: `part_${idx + 1}`, pages });
    });
  }

  const artifacts: PdfOutputArtifact[] = [];
  for (let i = 0; i < groups.length; i++) {
    const grp = groups[i];
    onProgress?.(Math.round(((i + 0.5) / groups.length) * 95), `Creating ${baseName}_${grp.label}.pdf...`);
    const outPdf = await PDFDocument.create();
    const copied = await outPdf.copyPages(
      srcPdf,
      grp.pages.map((p) => p - 1)
    );
    copied.forEach((p) => outPdf.addPage(p));
    const bytes = await outPdf.save({ useObjectStreams: true });
    artifacts.push(
      createOutputArtifact(`${baseName}_${grp.label}.pdf`, bytes, 'application/pdf', {
        pageCount: grp.pages.length,
        summaryNote: `Pages: ${grp.pages.join(', ')}`,
      })
    );
  }

  onProgress?.(100, 'Done');
  return artifacts;
}

export async function extractSelectedPages(
  fileItem: PdfSuiteFileItem,
  selectedPages: number[],
  onProgress?: ProgressCallback
): Promise<PdfOutputArtifact> {
  if (selectedPages.length === 0) {
    throw new Error('Select at least one page to extract.');
  }
  onProgress?.(25, 'Extracting selected pages...');
  const srcPdf = await PDFDocument.load(fileItem.bytes);
  const total = srcPdf.getPageCount();
  const validIndices = selectedPages.filter((p) => p >= 1 && p <= total).map((p) => p - 1);
  if (validIndices.length === 0) {
    throw new Error('Selected pages are out of document bounds.');
  }

  const outPdf = await PDFDocument.create();
  const copied = await outPdf.copyPages(srcPdf, validIndices);
  copied.forEach((p) => outPdf.addPage(p));
  const bytes = await outPdf.save({ useObjectStreams: true });
  const baseName = sanitizeOutputBasename(fileItem.name);
  onProgress?.(100, 'Done');

  return createOutputArtifact(`${baseName}_extracted.pdf`, bytes, 'application/pdf', {
    pageCount: validIndices.length,
    summaryNote: `Extracted ${validIndices.length} page(s): ${selectedPages.join(', ')}`,
  });
}

export async function deleteSelectedPages(
  fileItem: PdfSuiteFileItem,
  pagesToDelete: number[],
  onProgress?: ProgressCallback
): Promise<PdfOutputArtifact> {
  const srcPdf = await PDFDocument.load(fileItem.bytes);
  const total = srcPdf.getPageCount();
  const deleteSet = new Set(pagesToDelete);
  const keepIndices: number[] = [];

  for (let p = 1; p <= total; p++) {
    if (!deleteSet.has(p)) keepIndices.push(p - 1);
  }

  if (keepIndices.length === 0) {
    throw new Error('You cannot delete every page from a PDF. At least 1 page must remain.');
  }
  if (keepIndices.length === total) {
    throw new Error('Select at least one page to delete.');
  }

  onProgress?.(45, 'Rebuilding PDF without deleted pages...');
  const outPdf = await PDFDocument.create();
  const copied = await outPdf.copyPages(srcPdf, keepIndices);
  copied.forEach((p) => outPdf.addPage(p));
  const bytes = await outPdf.save({ useObjectStreams: true });
  const baseName = sanitizeOutputBasename(fileItem.name);
  onProgress?.(100, 'Done');

  return createOutputArtifact(`${baseName}_trimmed.pdf`, bytes, 'application/pdf', {
    pageCount: keepIndices.length,
    summaryNote: `Removed ${total - keepIndices.length} page(s); ${keepIndices.length} page(s) remaining.`,
  });
}

export async function rotatePdfPages(
  fileItem: PdfSuiteFileItem,
  rotationsByPage: Record<number, number>, // pageNum (1-based) -> added rotation degrees (0, 90, 180, 270)
  onProgress?: ProgressCallback
): Promise<PdfOutputArtifact> {
  onProgress?.(30, 'Applying PDF page rotation matrices...');
  const pdfDoc = await PDFDocument.load(fileItem.bytes);
  const pages = pdfDoc.getPages();

  pages.forEach((page, idx) => {
    const pageNum = idx + 1;
    const addDeg = rotationsByPage[pageNum] || 0;
    if (addDeg % 360 !== 0) {
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + addDeg) % 360));
    }
  });

  onProgress?.(85, 'Saving rotated PDF...');
  const bytes = await pdfDoc.save({ useObjectStreams: true });
  const baseName = sanitizeOutputBasename(fileItem.name);
  onProgress?.(100, 'Done');

  return createOutputArtifact(`${baseName}_rotated.pdf`, bytes, 'application/pdf', {
    pageCount: pages.length,
    summaryNote: `Saved ${pages.length}-page PDF with updated page orientations.`,
  });
}

export async function reorderAndDuplicatePages(
  fileItem: PdfSuiteFileItem,
  orderedPageNumbers: number[], // e.g. [3, 1, 2, 2]
  filenameSuffix = 'reordered',
  onProgress?: ProgressCallback
): Promise<PdfOutputArtifact> {
  if (orderedPageNumbers.length === 0) {
    throw new Error('At least one page must remain in the output sequence.');
  }
  onProgress?.(35, 'Assembling new page sequence...');
  const srcPdf = await PDFDocument.load(fileItem.bytes);
  const total = srcPdf.getPageCount();
  const outPdf = await PDFDocument.create();

  for (const p of orderedPageNumbers) {
    if (p < 1 || p > total) continue;
    const [copied] = await outPdf.copyPages(srcPdf, [p - 1]);
    outPdf.addPage(copied);
  }

  onProgress?.(85, 'Writing updated PDF...');
  const bytes = await outPdf.save({ useObjectStreams: true });
  const baseName = sanitizeOutputBasename(fileItem.name);
  onProgress?.(100, 'Done');

  return createOutputArtifact(`${baseName}_${filenameSuffix}.pdf`, bytes, 'application/pdf', {
    pageCount: outPdf.getPageCount(),
    summaryNote: `Output contains ${outPdf.getPageCount()} page(s) in exact sequence.`,
  });
}

export async function createSeparatePdfsFromGroups(
  fileItem: PdfSuiteFileItem,
  groups: { name: string; range: string }[],
  onProgress?: ProgressCallback
): Promise<PdfOutputArtifact[]> {
  const srcPdf = await PDFDocument.load(fileItem.bytes);
  const total = srcPdf.getPageCount();
  const artifacts: PdfOutputArtifact[] = [];

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const pages = parsePageRanges(g.range, total, { preserveOrder: true });
    onProgress?.(Math.round(((i + 0.5) / groups.length) * 95), `Building "${g.name}"...`);

    const outPdf = await PDFDocument.create();
    const copied = await outPdf.copyPages(
      srcPdf,
      pages.map((p) => p - 1)
    );
    copied.forEach((p) => outPdf.addPage(p));
    const bytes = await outPdf.save({ useObjectStreams: true });
    const safeName = sanitizeOutputBasename(g.name || `document_${i + 1}`);

    artifacts.push(
      createOutputArtifact(`${safeName}.pdf`, bytes, 'application/pdf', {
        pageCount: pages.length,
        summaryNote: `Pages ${pages.join(', ')}`,
      })
    );
  }

  onProgress?.(100, 'Done');
  return artifacts;
}

// ===========================================================================
// CATEGORY D: COMPRESS & OPTIMIZE PDF
// ===========================================================================

export async function compressPdfDocument(
  fileItem: PdfSuiteFileItem,
  options: {
    mode: CompressionEngineMode;
    qualityPreset: CompressionQualityPreset;
    customScale?: number; // 0.6..2.0
    customJpegQuality?: number; // 0.35..0.95
  },
  onProgress?: ProgressCallback
): Promise<{ artifact: PdfOutputArtifact; stats: CompressionStats }> {
  const originalSize = fileItem.bytes.byteLength;
  const baseName = sanitizeOutputBasename(fileItem.name);

  if (options.mode === 'lossless-stream') {
    onProgress?.(20, 'Running QPDF lossless stream & object-stream optimization...');
    let candidateBytes: Uint8Array;
    let engineLabel = 'QPDF Lossless Stream Recompression';

    try {
      const res = await runQpdfCommand(fileItem.bytes, (inPath, outPath) => [
        inPath,
        '--stream-data=compress',
        '--recompress-flate',
        '--object-streams=generate',
        '--compress-streams=y',
        outPath,
      ]);
      candidateBytes = res.outputBytes;
    } catch {
      // Fallback to pdf-lib object-stream rebuild
      engineLabel = 'PDF Object Stream Optimization';
      const doc = await PDFDocument.load(fileItem.bytes);
      candidateBytes = await doc.save({ useObjectStreams: true });
    }

    const compressedSize = candidateBytes.byteLength;
    const savedBytes = originalSize - compressedSize;
    const reductionPercent = originalSize > 0 ? Math.round((savedBytes / originalSize) * 1000) / 10 : 0;

    onProgress?.(100, 'Done');
    return {
      artifact: createOutputArtifact(`${baseName}_compressed.pdf`, candidateBytes, 'application/pdf', {
        pageCount: fileItem.pageCount,
        summaryNote:
          savedBytes > 0
            ? `Saved ${formatBytes(savedBytes)} (${reductionPercent}% smaller)`
            : 'Document streams were already tightly compressed losslessly.',
      }),
      stats: {
        originalSize,
        compressedSize,
        savedBytes,
        reductionPercent,
        modeUsed: engineLabel,
        note:
          savedBytes <= 0
            ? 'Lossless compression preserved all vector text/fonts; this PDF already had minimal stream overhead. Switch to Image/Raster Optimization to shrink embedded photos.'
            : undefined,
      },
    };
  }

  // Image / Raster Optimization mode (or Low/Medium/High quality presets)
  const presetMap: Record<CompressionQualityPreset, { scale: number; jpegQuality: number }> = {
    low: { scale: 1.75, jpegQuality: 0.85 }, // Low compression = High visual quality
    medium: { scale: 1.3, jpegQuality: 0.7 }, // Balanced
    high: { scale: 0.9, jpegQuality: 0.52 }, // High compression = Smallest size
  };

  const preset = presetMap[options.qualityPreset];
  const scale = options.customScale ?? (options.mode === 'aggressive-raster' ? Math.min(1.0, preset.scale) : preset.scale);
  const jpegQuality = options.customJpegQuality ?? (options.mode === 'aggressive-raster' ? Math.min(0.55, preset.jpegQuality) : preset.jpegQuality);

  const srcDoc = await PDFDocument.load(fileItem.bytes);
  const totalPages = srcDoc.getPageCount();
  const outDoc = await PDFDocument.create();

  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;
    onProgress?.(
      10 + Math.round(((i + 0.5) / totalPages) * 80),
      `Optimizing page ${pageNum} of ${totalPages} (${Math.round(jpegQuality * 100)}% quality)...`
    );

    const origPage = srcDoc.getPage(i);
    const { width: origW, height: origH } = origPage.getSize();

    const rendered = await renderPdfPageToDataUrl(fileItem.bytes, pageNum, {
      scale,
      format: 'image/jpeg',
      quality: jpegQuality,
    });

    const jpgBytes = new Uint8Array(await rendered.blob.arrayBuffer());
    const embeddedJpg = await outDoc.embedJpg(jpgBytes);
    const newPage = outDoc.addPage([origW, origH]);
    newPage.drawImage(embeddedJpg, { x: 0, y: 0, width: origW, height: origH });
  }

  onProgress?.(94, 'Packaging optimized PDF...');
  const optimizedBytes = await outDoc.save({ useObjectStreams: true });
  const compressedSize = optimizedBytes.byteLength;
  const savedBytes = originalSize - compressedSize;
  const reductionPercent = originalSize > 0 ? Math.round((savedBytes / originalSize) * 1000) / 10 : 0;

  onProgress?.(100, 'Done');
  return {
    artifact: createOutputArtifact(`${baseName}_optimized.pdf`, optimizedBytes, 'application/pdf', {
      pageCount: totalPages,
      summaryNote: `${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (${reductionPercent >= 0 ? `${reductionPercent}% smaller` : 'no reduction'})`,
    }),
    stats: {
      originalSize,
      compressedSize,
      savedBytes,
      reductionPercent,
      modeUsed: `Image Optimization (${options.qualityPreset.toUpperCase()} compression · ${Math.round(scale * 72)} DPI @ ${Math.round(jpegQuality * 100)}% JPEG)`,
      note:
        savedBytes <= 0
          ? 'Because this input is already a compact text/vector PDF, re-encoding pages as raster images did not shrink it further. Try Lossless Stream mode for tiny vector PDFs.'
          : 'Pages re-encoded at tuned JPEG resolution. Selectable text layers are flattened in image-optimization mode.',
    },
  };
}
