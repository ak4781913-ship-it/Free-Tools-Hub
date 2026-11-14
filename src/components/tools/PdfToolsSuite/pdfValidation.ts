/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PdfToolDescriptor } from './pdfSuiteTypes';

// Safe client-side memory guardrail (100 MB per file, 250 MB total queue)
export const MAX_SINGLE_FILE_BYTES = 100 * 1024 * 1024;
export const MAX_BATCH_TOTAL_BYTES = 250 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 100 ? 0 : 2)} MB`;
}

export function getFileExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() || '' : '';
}

export function hasPdfHeaderSignature(bytes: Uint8Array): boolean {
  // Check first 1024 bytes for "%PDF-" (some PDFs have leading whitespace/BOM before %PDF-)
  const scanLimit = Math.min(bytes.length, 1024);
  for (let i = 0; i <= scanLimit - 5; i++) {
    if (
      bytes[i] === 0x25 && // %
      bytes[i + 1] === 0x50 && // P
      bytes[i + 2] === 0x44 && // D
      bytes[i + 3] === 0x46 && // F
      bytes[i + 4] === 0x2d // -
    ) {
      return true;
    }
  }
  return false;
}

export function hasZipSignature(bytes: Uint8Array): boolean {
  // OOXML (.docx, .xlsx, .pptx) start with PK (0x50 0x4B)
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

export function detectImageSignature(bytes: Uint8Array): 'jpg' | 'png' | 'webp' | null {
  if (bytes.length < 12) return null;
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png';
  // WebP: RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'webp';
  }
  return null;
}

export interface ValidatedFileResult {
  valid: boolean;
  bytes?: Uint8Array;
  extension: string;
  error?: string;
}

export async function validateUploadedFile(
  file: File,
  tool: PdfToolDescriptor,
  isUrdu: boolean,
  existingQueueSizeBytes = 0
): Promise<ValidatedFileResult> {
  const ext = getFileExtension(file.name);

  if (file.size === 0) {
    return {
      valid: false,
      extension: ext,
      error: isUrdu ? `فائل "${file.name}" خالی ہے (0 بائٹس)۔` : `File "${file.name}" is empty (0 bytes).`,
    };
  }

  if (file.size > MAX_SINGLE_FILE_BYTES) {
    return {
      valid: false,
      extension: ext,
      error: isUrdu
        ? `فائل "${file.name}" زیادہ سے زیادہ 100 MB کی حد سے بڑی ہے (${formatBytes(file.size)})۔`
        : `File "${file.name}" (${formatBytes(file.size)}) exceeds the 100 MB browser memory limit.`,
    };
  }

  if (existingQueueSizeBytes + file.size > MAX_BATCH_TOTAL_BYTES) {
    return {
      valid: false,
      extension: ext,
      error: isUrdu
        ? `تمام فائلوں کا مجموعی سائز 250 MB کی حد سے تجاوز کر گیا ہے۔`
        : `Total queued file size would exceed the 250 MB browser memory limit.`,
    };
  }

  const extAllowed = tool.acceptedExtensions.includes(ext);
  const mimeAllowed = !file.type || tool.acceptedMimeTypes.includes(file.type) || extAllowed;

  if (!extAllowed && !mimeAllowed) {
    const allowedList = tool.acceptedExtensions.map((e) => `.${e.toUpperCase()}`).join(', ');
    return {
      valid: false,
      extension: ext,
      error: isUrdu
        ? `"${file.name}" کی قسم غیر مجاز ہے۔ مطلوبہ فارمیٹ: ${allowedList}`
        : `Unsupported file format for "${file.name}". Allowed: ${allowedList}.`,
    };
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Content magic-byte validation (skip strict PDF header rejection on pdf-repair!)
  if (tool.acceptedExtensions.includes('pdf') && tool.id !== 'pdf-repair') {
    if (!hasPdfHeaderSignature(bytes)) {
      return {
        valid: false,
        extension: ext,
        error: isUrdu
          ? `"${file.name}" درست پی ڈی ایف فائل نہیں لگتی (%PDF ہیڈر غائب ہے)۔ اگر فائل خراب ہے تو PDF Repair ٹول آزمائیں۔`
          : `"${file.name}" does not appear to have a valid %PDF- signature. If corrupted, try the PDF Repair tool.`,
      };
    }
  }

  if (ext === 'docx' || ext === 'pptx' || ext === 'xlsx') {
    if (!hasZipSignature(bytes)) {
      return {
        valid: false,
        extension: ext,
        error: isUrdu
          ? `"${file.name}" درست .${ext.toUpperCase()} آرکائیو نہیں ہے۔`
          : `"${file.name}" is not a valid .${ext.toUpperCase()} OpenXML document.`,
      };
    }
  }

  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
    const sig = detectImageSignature(bytes);
    if (!sig) {
      return {
        valid: false,
        extension: ext,
        error: isUrdu
          ? `"${file.name}" ایک درست تصویر (JPG/PNG/WebP) نہیں ہے۔`
          : `"${file.name}" is not a valid JPG, PNG, or WebP image file.`,
      };
    }
  }

  return { valid: true, bytes, extension: ext };
}

export function sanitizeOutputBasename(filename: string): string {
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  return (
    withoutExt
      .replace(/[^a-zA-Z0-9._-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'document'
  );
}
