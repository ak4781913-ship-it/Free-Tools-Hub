/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PdfCategoryId =
  | 'convert-pdf'
  | 'convert-to-pdf'
  | 'organize'
  | 'compress'
  | 'edit'
  | 'security'
  | 'advanced';

export type PdfSubToolId =
  // A. Convert PDF
  | 'pdf-to-word'
  | 'pdf-to-excel'
  | 'pdf-to-jpg'
  | 'pdf-to-png'
  | 'pdf-to-txt'
  | 'pdf-pages-to-images'
  // B. Convert to PDF
  | 'jpg-to-pdf'
  | 'png-to-pdf'
  | 'images-to-pdf'
  | 'word-to-pdf'
  | 'excel-to-pdf'
  | 'ppt-to-pdf'
  | 'txt-to-pdf'
  // C. Organize PDF
  | 'merge-pdf'
  | 'split-pdf'
  | 'extract-pages'
  | 'delete-pages'
  | 'rotate-pages'
  | 'reorder-pages'
  | 'duplicate-pages'
  | 'separate-pdfs'
  // D. Compress & Optimize
  | 'compress-pdf'
  | 'reduce-pdf-size'
  | 'optimize-pdf-images'
  | 'compression-quality'
  // E. Edit PDF
  | 'add-text-pdf'
  | 'add-images-pdf'
  | 'add-page-numbers'
  | 'add-watermark'
  | 'add-headers-footers'
  | 'interactive-pdf-editor'
  // F. PDF Security
  | 'protect-pdf'
  | 'unlock-pdf'
  | 'pdf-security-status'
  // G. Advanced PDF Tools
  | 'extract-text-pdf'
  | 'extract-images-pdf'
  | 'pdf-metadata-viewer'
  | 'pdf-page-counter'
  | 'pdf-viewer'
  | 'pdf-ocr'
  | 'pdf-search'
  | 'print-pdf'
  | 'pdf-repair';

export interface PdfToolDescriptor {
  id: PdfSubToolId;
  category: PdfCategoryId;
  name: string;
  nameUrdu: string;
  description: string;
  descriptionUrdu: string;
  acceptedExtensions: string[];
  acceptedMimeTypes: string[];
  allowMultiple: boolean;
  minFiles?: number;
  maxFiles?: number;
  iconName: string;
  isPopular?: boolean;
  outputFormatLabel: string;
  keywords: string[];
  limitationNote?: string;
  limitationNoteUrdu?: string;
}

export interface PdfCategoryDescriptor {
  id: PdfCategoryId;
  code: string;
  name: string;
  nameUrdu: string;
  description: string;
  descriptionUrdu: string;
  iconName: string;
}

export interface PdfSuiteFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  extension: string;
  mimeType: string;
  bytes: Uint8Array;
  pageCount?: number;
  isEncrypted?: boolean;
  pageRangeFilter?: string;
  thumbnailUrl?: string;
  previewText?: string;
  metadata?: PdfMetadataInfo;
}

export interface PdfOutputArtifact {
  id: string;
  filename: string;
  blob: Blob;
  url: string;
  mimeType: string;
  size: number;
  pageCount?: number;
  previewUrl?: string;
  textPreview?: string;
  tablePreview?: {
    sheetName: string;
    rows: string[][];
  }[];
  summaryNote?: string;
}

export interface PdfMetadataInfo {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate: string;
  modificationDate: string;
  pageCount: number;
  fileSize: number;
  isEncrypted: boolean;
  pageSizes: { page: number; widthPt: number; heightPt: number; widthMm: number; heightMm: number }[];
}

export type CompressionQualityPreset = 'low' | 'medium' | 'high';
export type CompressionEngineMode = 'lossless-stream' | 'balanced-raster' | 'aggressive-raster';

export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  reductionPercent: number;
  modeUsed: string;
  note?: string;
}

export interface PdfTextOverlay {
  id: string;
  page: number; // 1-based
  text: string;
  xPercent: number; // 0..100 from left
  yPercent: number; // 0..100 from top
  widthPercent: number; // 10..90
  fontSize: number; // in PDF pt
  color: string; // hex #RRGGBB
  opacity: number; // 0.1..1
  bold: boolean;
}

export interface PdfImageOverlay {
  id: string;
  page: number; // 1-based
  name: string;
  bytes: Uint8Array;
  mimeType: 'image/png' | 'image/jpeg';
  previewUrl: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  opacity: number;
}

export interface PdfWatermarkConfig {
  enabled: boolean;
  type: 'text' | 'image';
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
  rotation: number; // degrees, e.g. -45
  pageScope: 'all' | 'custom';
  customRange: string;
  imageBytes?: Uint8Array;
  imageMime?: 'image/png' | 'image/jpeg';
  imageScalePercent: number;
}

export interface PdfPageNumberConfig {
  enabled: boolean;
  format: 'number-only' | 'page-x-of-n' | 'x-slash-n';
  position:
    | 'bottom-center'
    | 'bottom-left'
    | 'bottom-right'
    | 'top-center'
    | 'top-left'
    | 'top-right';
  startFrom: number;
  fontSize: number;
  color: string;
  marginPt: number;
}

export interface PdfHeaderFooterConfig {
  enabled: boolean;
  headerLeft: string;
  headerCenter: string;
  headerRight: string;
  footerLeft: string;
  footerCenter: string;
  footerRight: string;
  fontSize: number;
  color: string;
  showDividerLine: boolean;
  skipFirstPage: boolean;
}

export interface PdfSearchMatch {
  page: number;
  snippet: string;
  matchCountOnPage: number;
  rects: {
    leftPercent: number;
    topPercent: number;
    widthPercent: number;
    heightPercent: number;
  }[];
}

export interface PdfProcessingProgress {
  percent: number;
  stage: string;
}
