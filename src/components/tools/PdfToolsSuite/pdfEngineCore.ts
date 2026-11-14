/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { PdfMetadataInfo, PdfOutputArtifact } from './pdfSuiteTypes';

let workerConfigured = false;

export function ensurePdfJsWorker(): void {
  if (workerConfigured) return;
  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  }
  workerConfigured = true;
}

export async function openPdfJsDocument(bytes: Uint8Array, password?: string) {
  ensurePdfJsWorker();
  // Always clone bytes (.slice()) because pdf.js worker transfers/detaches the underlying ArrayBuffer
  const loadingTask = pdfjsLib.getDocument({
    data: bytes.slice(),
    password: password || undefined,
  });
  return loadingTask.promise;
}

export async function closePdfJsDocument(doc: pdfjsLib.PDFDocumentProxy | null | undefined): Promise<void> {
  if (!doc) return;
  try {
    await doc.cleanup();
  } catch {
    // Ignore cleanup errors if already destroyed
  }
  try {
    await doc.loadingTask.destroy();
  } catch {
    // Ignore loadingTask destroy errors
  }
}

export function revokeArtifacts(artifacts: PdfOutputArtifact[]): void {
  for (const art of artifacts) {
    if (art.url && art.url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(art.url);
      } catch {}
    }
    if (art.previewUrl && art.previewUrl.startsWith('blob:') && art.previewUrl !== art.url) {
      try {
        URL.revokeObjectURL(art.previewUrl);
      } catch {}
    }
  }
}

export function createOutputArtifact(
  filename: string,
  data: Uint8Array | Blob | string,
  mimeType: string,
  extras?: Partial<Omit<PdfOutputArtifact, 'id' | 'filename' | 'blob' | 'url' | 'mimeType' | 'size'>>
): PdfOutputArtifact {
  let blob: Blob;
  if (data instanceof Blob) {
    blob = data;
  } else if (typeof data === 'string') {
    blob = new Blob([data], { type: mimeType });
  } else {
    const cleanCopy = new Uint8Array(data.byteLength);
    cleanCopy.set(data);
    blob = new Blob([cleanCopy.buffer], { type: mimeType });
  }
  const url = URL.createObjectURL(blob);
  return {
    id: `art_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    filename,
    blob,
    url,
    mimeType,
    size: blob.size,
    ...extras,
  };
}

export function triggerArtifactDownload(artifact: Pick<PdfOutputArtifact, 'filename' | 'url'>): void {
  const link = document.createElement('a');
  link.href = artifact.url;
  link.download = artifact.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function createZipFromArtifacts(
  artifacts: PdfOutputArtifact[],
  zipFilename: string
): Promise<PdfOutputArtifact> {
  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const item of artifacts) {
    let name = item.filename;
    if (usedNames.has(name)) {
      const dot = name.lastIndexOf('.');
      const base = dot > 0 ? name.slice(0, dot) : name;
      const ext = dot > 0 ? name.slice(dot) : '';
      let counter = 2;
      while (usedNames.has(`${base}_${counter}${ext}`)) {
        counter += 1;
      }
      name = `${base}_${counter}${ext}`;
    }
    usedNames.add(name);
    const buffer = await item.blob.arrayBuffer();
    zip.file(name, buffer);
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return createOutputArtifact(zipFilename, zipBlob, 'application/zip', {
    summaryNote: `${artifacts.length} files archived`,
  });
}

/**
 * Parses human-friendly page ranges like "1, 3-5, 8" into sorted or ordered 1-based page numbers.
 */
export function parsePageRanges(
  input: string,
  totalPages: number,
  options?: { preserveOrder?: boolean; allowDuplicates?: boolean }
): number[] {
  const clean = input.trim();
  if (!clean) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const tokens = clean.split(',').map((t) => t.trim()).filter(Boolean);
  const result: number[] = [];
  const seen = new Set<number>();

  const pushPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    if (!options?.allowDuplicates && seen.has(p)) return;
    seen.add(p);
    result.push(p);
  };

  for (const token of tokens) {
    if (token.includes('-')) {
      const [startStr, endStr] = token.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = endStr === '' ? totalPages : parseInt(endStr, 10);
      if (Number.isNaN(start) || Number.isNaN(end)) {
        throw new Error(`Invalid page range "${token}". Use format like "1-3, 5".`);
      }
      if (start < 1 || end < 1 || start > totalPages || end > totalPages) {
        throw new Error(`Page range "${token}" is out of bounds (1–${totalPages}).`);
      }
      if (start <= end) {
        for (let p = start; p <= end; p++) pushPage(p);
      } else {
        for (let p = start; p >= end; p--) pushPage(p);
      }
    } else {
      const p = parseInt(token, 10);
      if (Number.isNaN(p) || p < 1 || p > totalPages) {
        throw new Error(`Page "${token}" is invalid or out of bounds (1–${totalPages}).`);
      }
      pushPage(p);
    }
  }

  if (result.length === 0) {
    throw new Error('No valid pages matched your selection.');
  }

  return options?.preserveOrder ? result : result;
}

export async function inspectPdfQuick(bytes: Uint8Array): Promise<{
  pageCount: number;
  isEncrypted: boolean;
  metadata?: PdfMetadataInfo;
}> {
  // First check with pdf-lib whether encrypted
  let isEncrypted = false;
  let pdfLibPageCount = 0;

  try {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
    pdfLibPageCount = doc.getPageCount();
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : '';
    if (msg.includes('encrypt') || msg.includes('password')) {
      isEncrypted = true;
    }
  }

  if (isEncrypted) {
    // Try opening with pdf.js without password (some PDFs have owner-only permissions restriction)
    try {
      const pdfJsDoc = await openPdfJsDocument(bytes);
      const count = pdfJsDoc.numPages;
      await closePdfJsDocument(pdfJsDoc);
      return { pageCount: count, isEncrypted: true };
    } catch {
      return { pageCount: 0, isEncrypted: true };
    }
  }

  try {
    const pdfJsDoc = await openPdfJsDocument(bytes);
    const pageCount = pdfJsDoc.numPages || pdfLibPageCount;
    const metaResult = await pdfJsDoc.getMetadata().catch(() => null);
    const info = (metaResult?.info || {}) as Record<string, unknown>;

    const pageSizes: PdfMetadataInfo['pageSizes'] = [];
    const inspectLimit = Math.min(pageCount, 100);
    for (let i = 1; i <= inspectLimit; i++) {
      const page = await pdfJsDoc.getPage(i);
      const vp = page.getViewport({ scale: 1 });
      const widthMm = Math.round((vp.width * 25.4) / 72);
      const heightMm = Math.round((vp.height * 25.4) / 72);
      pageSizes.push({
        page: i,
        widthPt: Math.round(vp.width),
        heightPt: Math.round(vp.height),
        widthMm,
        heightMm,
      });
    }

    await closePdfJsDocument(pdfJsDoc);

    const formatPdfDate = (val: unknown): string => {
      if (!val || typeof val !== 'string') return '';
      const m = val.match(/^D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?/);
      if (m) {
        return `${m[1]}-${m[2] || '01'}-${m[3] || '01'}${m[4] ? ` ${m[4]}:${m[5] || '00'}` : ''}`;
      }
      return val;
    };

    const metadata: PdfMetadataInfo = {
      title: String(info.Title || ''),
      author: String(info.Author || ''),
      subject: String(info.Subject || ''),
      keywords: String(info.Keywords || ''),
      creator: String(info.Creator || ''),
      producer: String(info.Producer || ''),
      creationDate: formatPdfDate(info.CreationDate),
      modificationDate: formatPdfDate(info.ModDate),
      pageCount,
      fileSize: bytes.byteLength,
      isEncrypted: false,
      pageSizes,
    };

    return { pageCount, isEncrypted: false, metadata };
  } catch {
    return { pageCount: pdfLibPageCount, isEncrypted };
  }
}

export async function renderPdfPageToDataUrl(
  bytes: Uint8Array,
  pageNumber: number,
  options?: {
    scale?: number;
    format?: 'image/png' | 'image/jpeg';
    quality?: number;
    password?: string;
    extraRotationDeg?: number;
  }
): Promise<{ dataUrl: string; blob: Blob; width: number; height: number }> {
  const doc = await openPdfJsDocument(bytes, options?.password);
  try {
    const page = await doc.getPage(pageNumber);
    const scale = options?.scale ?? 1.5;
    const baseRotation = page.rotate || 0;
    const viewport = page.getViewport({
      scale,
      rotation: (baseRotation + (options?.extraRotationDeg || 0)) % 360,
    });

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context is unavailable.');

    // Fill white background so transparent PDFs render cleanly as JPG/PNG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    }).promise;

    const format = options?.format || 'image/png';
    const quality = options?.quality ?? 0.92;
    const dataUrl = canvas.toDataURL(format, quality);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to encode canvas image'))),
        format,
        quality
      );
    });

    return { dataUrl, blob, width: canvas.width, height: canvas.height };
  } finally {
    await closePdfJsDocument(doc);
  }
}

export interface ExtractedTextLine {
  text: string;
  y: number;
  x: number;
  fontSize: number;
  items: { str: string; x: number; width: number }[];
}

export interface ExtractedPageContent {
  page: number;
  rawText: string;
  lines: ExtractedTextLine[];
}

export async function extractStructuredPdfText(
  bytes: Uint8Array,
  pageNumbers?: number[],
  password?: string
): Promise<{ pages: ExtractedPageContent[]; totalPages: number }> {
  const doc = await openPdfJsDocument(bytes, password);
  try {
    const totalPages = doc.numPages;
    const targetPages = pageNumbers && pageNumbers.length > 0
      ? pageNumbers
      : Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages: ExtractedPageContent[] = [];

    for (const p of targetPages) {
      if (p < 1 || p > totalPages) continue;
      const page = await doc.getPage(p);
      const textContent = await page.getTextContent();

      type RawItem = { str: string; x: number; y: number; width: number; fontSize: number };
      const rawItems: RawItem[] = [];

      for (const item of textContent.items) {
        if ('str' in item && item.str.trim() !== '') {
          const tx = item.transform;
          const x = tx[4] ?? 0;
          const y = tx[5] ?? 0;
          const fontSize = Math.max(6, Math.round(Math.hypot(tx[0] ?? 10, tx[1] ?? 0)));
          rawItems.push({
            str: item.str,
            x,
            y,
            width: item.width || 0,
            fontSize,
          });
        }
      }

      // Group items into horizontal lines (Y tolerance = 4pt)
      rawItems.sort((a, b) => b.y - a.y || a.x - b.x);

      const lines: ExtractedTextLine[] = [];
      for (const item of rawItems) {
        const existingLine = lines.find((line) => Math.abs(line.y - item.y) <= Math.max(4, item.fontSize * 0.45));
        if (existingLine) {
          existingLine.items.push({ str: item.str, x: item.x, width: item.width });
          existingLine.fontSize = Math.max(existingLine.fontSize, item.fontSize);
        } else {
          lines.push({
            text: item.str,
            y: item.y,
            x: item.x,
            fontSize: item.fontSize,
            items: [{ str: item.str, x: item.x, width: item.width }],
          });
        }
      }

      for (const line of lines) {
        line.items.sort((a, b) => a.x - b.x);
        // Join items on same line preserving spaces when gap > 3pt
        let lineStr = '';
        for (let i = 0; i < line.items.length; i++) {
          const curr = line.items[i];
          if (i > 0) {
            const prev = line.items[i - 1];
            const gap = curr.x - (prev.x + prev.width);
            if (gap > 2.5 && !lineStr.endsWith(' ') && !curr.str.startsWith(' ')) {
              lineStr += ' ';
            }
          }
          lineStr += curr.str;
        }
        line.text = lineStr.trim();
        line.x = line.items[0]?.x ?? line.x;
      }

      const cleanLines = lines.filter((l) => l.text.length > 0);
      pages.push({
        page: p,
        rawText: cleanLines.map((l) => l.text).join('\n'),
        lines: cleanLines,
      });
    }

    return { pages, totalPages };
  } finally {
    await closePdfJsDocument(doc);
  }
}

// =========================================================================
// QPDF WebAssembly Helper (Real AES-256 Encrypt, Decrypt, Compress, Repair)
// =========================================================================
interface ExtendedEmscriptenFS {
  writeFile: (path: string, data: Uint8Array) => void;
  readFile: (path: string) => Uint8Array;
  unlink: (path: string) => void;
}

interface QpdfRuntime {
  callMain: (args: string[]) => number;
  FS: ExtendedEmscriptenFS;
}

let qpdfInitPromise: Promise<QpdfRuntime> | null = null;
const qpdfStdoutBuffer: string[] = [];
const qpdfStderrBuffer: string[] = [];

export async function getQpdfInstance(): Promise<QpdfRuntime> {
  if (!qpdfInitPromise) {
    qpdfInitPromise = (async () => {
      const [{ default: createQpdfModule }, { default: qpdfWasmUrl }] = await Promise.all([
        import('@neslinesli93/qpdf-wasm'),
        import('@neslinesli93/qpdf-wasm/dist/qpdf.wasm?url'),
      ]);

      const instance = await (createQpdfModule as unknown as (opts: Record<string, unknown>) => Promise<QpdfRuntime>)({
        locateFile: (file: string) => (file.endsWith('.wasm') ? qpdfWasmUrl : file),
        noInitialRun: true,
        print: (txt: string) => qpdfStdoutBuffer.push(txt),
        printErr: (txt: string) => qpdfStderrBuffer.push(txt),
      });
      return instance;
    })().catch((err) => {
      qpdfInitPromise = null;
      throw err;
    });
  }
  return qpdfInitPromise;
}

export async function runQpdfCommand(
  inputBytes: Uint8Array,
  buildArgs: (inputPath: string, outputPath: string) => string[]
): Promise<{ outputBytes: Uint8Array; exitCode: number; logs: string }> {
  const qpdf = await getQpdfInstance();
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const inPath = `/tmp/in_${stamp}.pdf`;
  const outPath = `/tmp/out_${stamp}.pdf`;

  qpdfStdoutBuffer.length = 0;
  qpdfStderrBuffer.length = 0;

  try {
    qpdf.FS.writeFile(inPath, inputBytes);
    const args = buildArgs(inPath, outPath);
    let exitCode = 0;
    try {
      exitCode = qpdf.callMain(args);
    } catch (e: unknown) {
      if (typeof e === 'object' && e !== null && 'status' in e && typeof (e as { status: number }).status === 'number') {
        exitCode = (e as { status: number }).status;
      } else {
        throw e;
      }
    }

    const logs = [...qpdfStderrBuffer, ...qpdfStdoutBuffer].join('\n').trim();
    let outputBytes: Uint8Array | null = null;
    try {
      outputBytes = qpdf.FS.readFile(outPath);
    } catch {
      outputBytes = null;
    }

    if (!outputBytes || outputBytes.byteLength === 0) {
      throw new Error(logs || `QPDF exited with status ${exitCode} without generating output.`);
    }

    // QPDF exit codes: 0 = ok, 3 = succeeded with warnings (repaired/notes), 2 = fatal error
    if (exitCode === 2) {
      throw new Error(logs || 'QPDF failed to process the document.');
    }

    return { outputBytes: new Uint8Array(outputBytes), exitCode, logs };
  } finally {
    try {
      qpdf.FS.unlink(inPath);
    } catch {}
    try {
      qpdf.FS.unlink(outPath);
    } catch {}
  }
}
