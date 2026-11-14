/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Download,
  Info,
  Loader2,
  Play,
  Plus,
  RotateCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  CompressionEngineMode,
  CompressionQualityPreset,
  CompressionStats,
  PdfOutputArtifact,
  PdfProcessingProgress,
  PdfSuiteFileItem,
  PdfToolDescriptor,
} from './pdfSuiteTypes';
import { PDF_SUITE_TEXT } from './pdfSuiteTranslations';
import { formatBytes, sanitizeOutputBasename } from './pdfValidation';
import { createOutputArtifact, parsePageRanges, revokeArtifacts } from './pdfEngineCore';
import {
  convertExcelToPdf,
  convertImagesToPdf,
  convertPdfToExcel,
  convertPdfToImages,
  convertPdfToTxt,
  convertPdfToWord,
  convertPptToPdf,
  convertTxtToPdf,
  convertWordToPdf,
} from './pdfConverters';
import {
  compressPdfDocument,
  createSeparatePdfsFromGroups,
  deleteSelectedPages,
  extractSelectedPages,
  mergePdfs,
  reorderAndDuplicatePages,
  rotatePdfPages,
  splitPdf,
} from './pdfOrganizersAndOptimizers';
import {
  extractImagesFromPdf,
  protectPdfWithPassword,
  repairPdfDocument,
  runPdfOcr,
  unlockPdfWithAuthorizedPassword,
  updatePdfMetadataFields,
} from './pdfEditSecurityAdvanced';
import { PdfFileDropzone } from './PdfFileDropzone';
import { PdfResultsPanel } from './PdfResultsPanel';
import { PdfThumbnailGrid } from './PdfThumbnailGrid';
import { InteractivePdfEditorWorkspace } from './InteractivePdfEditorWorkspace';
import { PdfViewerSearchPrintWorkspace } from './PdfViewerSearchPrintWorkspace';
import { emitCalculationSuccess } from '../../../utils/calculationToastNotifier';

interface PdfToolWorkspaceProps {
  tool: PdfToolDescriptor;
  isUrdu: boolean;
}

export const PdfToolWorkspace: React.FC<PdfToolWorkspaceProps> = ({ tool, isUrdu }) => {
  const t = isUrdu ? PDF_SUITE_TEXT.ur : PDF_SUITE_TEXT.en;

  const [files, setFiles] = useState<PdfSuiteFileItem[]>([]);
  const [artifacts, setArtifacts] = useState<PdfOutputArtifact[]>([]);
  const [compressionStats, setCompressionStats] = useState<CompressionStats | null>(null);
  const [statusBanner, setStatusBanner] = useState<{
    title: string;
    detail: string;
    tone?: 'success' | 'info' | 'warning';
  } | null>(null);
  const [progress, setProgress] = useState<PdfProcessingProgress | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Category A/B options
  const [imageDpiScale, setImageDpiScale] = useState(2.0);
  const [imageQuality, setImageQuality] = useState(0.92);
  const [pageRangeInput, setPageRangeInput] = useState('');
  const [singleSheetExcel, setSingleSheetExcel] = useState(false);
  const [includePageHeadersTxt, setIncludePageHeadersTxt] = useState(true);
  const [imgPageSize, setImgPageSize] = useState<'fit' | 'a4' | 'letter'>('a4');
  const [imgOrientation, setImgOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [imgMarginPt, setImgMarginPt] = useState(18);
  const [excelOrientation, setExcelOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [pastedText, setPastedText] = useState('');
  const [txtFontSize, setTxtFontSize] = useState(11);
  const [txtFontFamily, setTxtFontFamily] = useState<'helvetica' | 'times' | 'courier'>('helvetica');

  // Category C options
  const [splitMode, setSplitMode] = useState<'every-n' | 'custom-ranges' | 'single-pages'>('every-n');
  const [splitEveryN, setSplitEveryN] = useState(1);
  const [splitRanges, setSplitRanges] = useState('1-2; 3-4');
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [rotationsByPage, setRotationsByPage] = useState<Record<number, number>>({});
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [separateGroups, setSeparateGroups] = useState<{ name: string; range: string }[]>([
    { name: 'Part_1', range: '1' },
    { name: 'Part_2', range: '2' },
  ]);

  // Category D options
  const [compressionMode, setCompressionMode] = useState<CompressionEngineMode>(() =>
    tool.id === 'optimize-pdf-images' ? 'balanced-raster' : 'lossless-stream'
  );
  const [compressionPreset, setCompressionPreset] = useState<CompressionQualityPreset>('medium');
  const [customRasterScale, setCustomRasterScale] = useState(1.25);
  const [customRasterJpgQ, setCustomRasterJpgQ] = useState(0.7);

  // Category F options
  const [userPassword, setUserPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowModifying, setAllowModifying] = useState(false);
  const [allowCopying, setAllowCopying] = useState(true);
  const [unlockPassword, setUnlockPassword] = useState('');

  // Category G options
  const [ocrLang, setOcrLang] = useState('eng');
  const [ocrOutputFmt, setOcrOutputFmt] = useState<'txt' | 'docx'>('txt');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaAuthor, setMetaAuthor] = useState('');
  const [metaSubject, setMetaSubject] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [metaCreator, setMetaCreator] = useState('');

  const artifactsRef = useRef<PdfOutputArtifact[]>(artifacts);
  artifactsRef.current = artifacts;
  const filesRef = useRef<PdfSuiteFileItem[]>(files);
  filesRef.current = files;

  const clearOutputs = () => {
    revokeArtifacts(artifactsRef.current);
    setArtifacts([]);
    setCompressionStats(null);
    setStatusBanner(null);
    setErrorMsg(null);
  };

  // Reset tool-specific state whenever sub-tool changes
  useEffect(() => {
    clearOutputs();
    filesRef.current.forEach((f) => {
      if (f.thumbnailUrl) URL.revokeObjectURL(f.thumbnailUrl);
    });
    setFiles([]);
    setSelectedPages([]);
    setRotationsByPage({});
    setPageOrder([]);
    setPageRangeInput('');
    setUserPassword('');
    setConfirmPassword('');
    setUnlockPassword('');
    setCompressionMode(tool.id === 'optimize-pdf-images' ? 'balanced-raster' : 'lossless-stream');
  }, [tool.id]);

  // Listen to global ToolPageLayout Reset button
  useEffect(() => {
    const onGlobalReset = () => {
      clearOutputs();
      filesRef.current.forEach((f) => {
        if (f.thumbnailUrl) URL.revokeObjectURL(f.thumbnailUrl);
      });
      setFiles([]);
      setSelectedPages([]);
      setRotationsByPage({});
      setPageOrder([]);
      setPastedText('');
    };
    window.addEventListener('freetools-reset-active-tool', onGlobalReset);
    return () => {
      window.removeEventListener('freetools-reset-active-tool', onGlobalReset);
    };
  }, []);

  useEffect(() => {
    return () => {
      revokeArtifacts(artifactsRef.current);
      filesRef.current.forEach((f) => {
        if (f.thumbnailUrl) URL.revokeObjectURL(f.thumbnailUrl);
      });
    };
  }, []);

  // Populate default page selections/metadata when primary file loads
  const handleFilesChange = (nextFiles: PdfSuiteFileItem[]) => {
    clearOutputs();
    setFiles(nextFiles);

    const primary = nextFiles[0];
    if (primary) {
      const count = primary.pageCount || 0;
      if (count > 0) {
        setPageOrder(Array.from({ length: count }, (_, i) => i + 1));
        setSelectedPages(tool.id === 'extract-pages' ? [1] : []);
        setRotationsByPage({});
        if (count >= 2) {
          setSeparateGroups([
            { name: 'Part_1', range: `1-${Math.ceil(count / 2)}` },
            { name: 'Part_2', range: `${Math.ceil(count / 2) + 1}-${count}` },
          ]);
        } else {
          setSeparateGroups([{ name: 'Part_1', range: '1' }]);
        }
      }
      if (primary.metadata) {
        setMetaTitle(primary.metadata.title);
        setMetaAuthor(primary.metadata.author);
        setMetaSubject(primary.metadata.subject);
        setMetaKeywords(primary.metadata.keywords);
        setMetaCreator(primary.metadata.creator);
      }
      if (tool.id === 'txt-to-pdf' && nextFiles.length === 1) {
        primary.file.text().then((txt) => setPastedText(txt)).catch(() => {});
      }
    }
  };

  const togglePageSelection = (pageNum: number) => {
    setSelectedPages((prev) =>
      prev.includes(pageNum) ? prev.filter((p) => p !== pageNum) : [...prev, pageNum].sort((a, b) => a - b)
    );
  };

  const handleRotateSinglePage = (pageNum: number, delta: number) => {
    setRotationsByPage((prev) => ({
      ...prev,
      [pageNum]: ((prev[pageNum] || 0) + delta) % 360,
    }));
  };

  const rotateAllPages = (delta: number) => {
    const count = files[0]?.pageCount || 0;
    const next: Record<number, number> = { ...rotationsByPage };
    for (let p = 1; p <= count; p++) {
      next[p] = ((next[p] || 0) + delta) % 360;
    }
    setRotationsByPage(next);
  };

  const isEditorTool = [
    'add-text-pdf',
    'add-images-pdf',
    'add-page-numbers',
    'add-watermark',
    'add-headers-footers',
    'interactive-pdf-editor',
  ].includes(tool.id);

  const isViewerSearchPrintTool = ['pdf-viewer', 'pdf-search', 'print-pdf'].includes(tool.id);

  const primaryFile = files[0];

  const handleExecute = async () => {
    clearOutputs();
    setIsRunning(true);
    const onProgress = (percent: number, stage: string) => setProgress({ percent, stage });

    try {
      // Encrypted PDF check for non-security/repair tools
      if (
        primaryFile?.isEncrypted &&
        !['unlock-pdf', 'pdf-security-status', 'pdf-repair'].includes(tool.id)
      ) {
        throw new Error(
          isUrdu
            ? 'یہ پی ڈی ایف فائل پاس ورڈ سے محفوظ ہے۔ پہلے "Unlock PDF" ٹول کے ذریعے درست پاس ورڈ درج کر کے اسے ان لاک کریں۔'
            : 'This PDF is password-protected. Please use the "Unlock PDF (Authorized Password)" tool first with your valid password.'
        );
      }

      switch (tool.id) {
        // ---------- Category A ----------
        case 'pdf-to-word': {
          if (!primaryFile) throw new Error('Please upload a PDF file.');
          const res = await convertPdfToWord(primaryFile, onProgress);
          setArtifacts([res.artifact]);
          if (res.isLikelyScanned) {
            setStatusBanner({
              title: isUrdu ? 'اسکین شدہ پی ڈی ایف کا امکان' : 'Low Selectable Text Detected',
              detail: isUrdu
                ? 'اس پی ڈی ایف میں ٹیکسٹ کم ہے۔ اگر یہ اسکین شدہ دستاویز ہے تو بہتر نتائج کے لیے "OCR for Scanned PDFs" استعمال کریں۔'
                : 'Very little selectable text was found. If this is a scanned image PDF, run "OCR for Scanned PDFs" to recognize text.',
              tone: 'warning',
            });
          }
          break;
        }
        case 'pdf-to-excel': {
          if (!primaryFile) throw new Error('Please upload a PDF file.');
          const art = await convertPdfToExcel(primaryFile, singleSheetExcel, onProgress);
          setArtifacts([art]);
          break;
        }
        case 'pdf-to-jpg': {
          if (!primaryFile) throw new Error('Please upload a PDF file.');
          const list = await convertPdfToImages(
            primaryFile,
            { format: 'jpg', scale: imageDpiScale, quality: imageQuality },
            onProgress
          );
          setArtifacts(list);
          break;
        }
        case 'pdf-to-png': {
          if (!primaryFile) throw new Error('Please upload a PDF file.');
          const list = await convertPdfToImages(
            primaryFile,
            { format: 'png', scale: imageDpiScale },
            onProgress
          );
          setArtifacts(list);
          break;
        }
        case 'pdf-to-txt':
        case 'extract-text-pdf': {
          if (!primaryFile) throw new Error('Please upload a PDF file.');
          const res = await convertPdfToTxt(
            primaryFile,
            { includePageHeaders: includePageHeadersTxt, pageRange: pageRangeInput },
            onProgress
          );
          setArtifacts([res.artifact]);
          break;
        }
        case 'pdf-pages-to-images': {
          if (!primaryFile) throw new Error('Please upload a PDF file.');
          const list = await convertPdfToImages(
            primaryFile,
            { format: 'png', scale: imageDpiScale, pageRange: pageRangeInput },
            onProgress
          );
          setArtifacts(list);
          break;
        }

        // ---------- Category B ----------
        case 'jpg-to-pdf':
        case 'png-to-pdf':
        case 'images-to-pdf': {
          if (files.length === 0) throw new Error('Please upload at least one image.');
          const art = await convertImagesToPdf(
            files,
            { pageSize: imgPageSize, orientation: imgOrientation, marginPt: imgMarginPt },
            onProgress
          );
          setArtifacts([art]);
          break;
        }
        case 'word-to-pdf': {
          if (!primaryFile) throw new Error('Please upload a .docx Word document.');
          const res = await convertWordToPdf(primaryFile, onProgress);
          setArtifacts([res.artifact]);
          break;
        }
        case 'excel-to-pdf': {
          if (!primaryFile) throw new Error('Please upload an .xlsx, .xls, or .csv file.');
          const res = await convertExcelToPdf(primaryFile, { orientation: excelOrientation }, onProgress);
          setArtifacts([res.artifact]);
          break;
        }
        case 'ppt-to-pdf': {
          if (!primaryFile) throw new Error('Please upload a .pptx PowerPoint file.');
          const res = await convertPptToPdf(primaryFile, onProgress);
          setArtifacts([res.artifact]);
          break;
        }
        case 'txt-to-pdf': {
          const textSource = pastedText.trim();
          if (!textSource && !primaryFile) {
            throw new Error('Upload a .txt file or enter text in the box below.');
          }
          const finalTxt = textSource || (await primaryFile.file.text());
          const art = await convertTxtToPdf(
            finalTxt,
            primaryFile ? primaryFile.name : 'text_document',
            {
              fontSize: txtFontSize,
              fontFamily: txtFontFamily,
              pageSize: imgPageSize === 'letter' ? 'letter' : 'a4',
              marginPt: 48,
            },
            onProgress
          );
          setArtifacts([art]);
          break;
        }

        // ---------- Category C ----------
        case 'merge-pdf': {
          const art = await mergePdfs(files, onProgress);
          setArtifacts([art]);
          break;
        }
        case 'split-pdf': {
          if (!primaryFile) throw new Error('Please upload a PDF file.');
          const list = await splitPdf(
            primaryFile,
            { mode: splitMode, everyN: splitEveryN, customRanges: splitRanges },
            onProgress
          );
          setArtifacts(list);
          break;
        }
        case 'extract-pages': {
          if (!primaryFile) throw new Error('Please upload a PDF file.');
          const pages = pageRangeInput.trim()
            ? parsePageRanges(pageRangeInput, primaryFile.pageCount || 1)
            : selectedPages;
          const art = await extractSelectedPages(primaryFile, pages, onProgress);
          setArtifacts([art]);
          break;
        }
        case 'delete-pages': {
          if (!primaryFile) throw new Error('Please upload a PDF file.');
          const pages = pageRangeInput.trim()
            ? parsePageRanges(pageRangeInput, primaryFile.pageCount || 1)
            : selectedPages;
          const art = await deleteSelectedPages(primaryFile, pages, onProgress);
          setArtifacts([art]);
          break;
        }
        case 'rotate-pages': {
          if (!primaryFile) throw new Error('Please upload a PDF file.');
          const art = await rotatePdfPages(primaryFile, rotationsByPage, onProgress);
          setArtifacts([art]);
          break;
        }
        case 'reorder-pages':
        case 'duplicate-pages': {
          if (!primaryFile) throw new Error('Please upload a PDF file.');
          const art = await reorderAndDuplicatePages(
            primaryFile,
            pageOrder,
            tool.id === 'duplicate-pages' ? 'duplicated' : 'reordered',
            onProgress
          );
          setArtifacts([art]);
          break;
        }
        case 'separate-pdfs': {
          if (!primaryFile) throw new Error('Please upload a PDF file.');
          const list = await createSeparatePdfsFromGroups(primaryFile, separateGroups, onProgress);
          setArtifacts(list);
          break;
        }

        // ---------- Category D ----------
        case 'compress-pdf':
        case 'reduce-pdf-size':
        case 'optimize-pdf-images':
        case 'compression-quality': {
          if (!primaryFile) throw new Error('Please upload a PDF file.');
          const res = await compressPdfDocument(
            primaryFile,
            {
              mode: compressionMode,
              qualityPreset: compressionPreset,
              customScale: tool.id === 'compression-quality' ? customRasterScale : undefined,
              customJpegQuality: tool.id === 'compression-quality' ? customRasterJpgQ : undefined,
            },
            onProgress
          );
          setArtifacts([res.artifact]);
          setCompressionStats(res.stats);
          break;
        }

        // ---------- Category F ----------
        case 'protect-pdf': {
          if (!primaryFile) throw new Error('Please upload a PDF file.');
          if (!userPassword) throw new Error('Enter a password to protect the PDF.');
          if (userPassword !== confirmPassword) {
            throw new Error('Passwords do not match. Please confirm the exact password.');
          }
          const res = await protectPdfWithPassword(
            primaryFile,
            { userPassword, allowPrinting, allowModifying, allowCopying },
            onProgress
          );
          setArtifacts([res.artifact]);
          setStatusBanner({
            title: res.verifiedEncrypted
              ? isUrdu
                ? 'حقیقی پاس ورڈ انکرپشن کامیابی سے لاگو ہو گئی'
                : 'Encryption Applied & Verified'
              : 'Encryption Applied',
            detail: `${res.encryptionMethod} applied. Opening this output file requires the password you set.`,
            tone: 'success',
          });
          break;
        }
        case 'unlock-pdf': {
          if (!primaryFile) throw new Error('Please upload a protected PDF file.');
          const res = await unlockPdfWithAuthorizedPassword(primaryFile, unlockPassword, onProgress);
          setArtifacts([res.artifact]);
          setStatusBanner({
            title: isUrdu ? 'پی ڈی ایف کامیابی سے ان لاک ہو گئی' : 'PDF Unlocked Cleanly',
            detail: 'Authorized password verified locally and encryption flags removed.',
            tone: 'success',
          });
          break;
        }
        case 'pdf-security-status': {
          if (!primaryFile) throw new Error('Please upload a PDF file to inspect.');
          setStatusBanner({
            title: primaryFile.isEncrypted
              ? isUrdu
                ? 'فائل پاس ورڈ سے محفوظ (Encrypted) ہے'
                : 'Document is Password Protected (Encrypted)'
              : isUrdu
              ? 'فائل بغیر پاس ورڈ (Unencrypted) ہے'
              : 'Document is Unencrypted / Open',
            detail: primaryFile.isEncrypted
              ? 'Encryption dictionary detected inside PDF header. Valid authorization credentials are required to open or edit this file.'
              : `No password encryption restrictions detected. Readable ${primaryFile.pageCount || 0} page(s), file size ${formatBytes(primaryFile.size)}.`,
            tone: primaryFile.isEncrypted ? 'warning' : 'success',
          });
          break;
        }

        // ---------- Category G ----------
        case 'extract-images-pdf': {
          if (!primaryFile) throw new Error('Please upload a PDF file.');
          const imgs = await extractImagesFromPdf(primaryFile, onProgress);
          if (imgs.length === 0) {
            setStatusBanner({
              title: isUrdu ? 'کوئی ایمبیڈڈ تصویر نہیں ملی' : 'No Embedded Raster Images Found',
              detail:
                'This PDF contains no embedded raster Image XObjects. If the file uses vector graphics or drawn shapes, use "PDF to PNG" to snapshot full pages.',
              tone: 'info',
            });
          } else {
            setArtifacts(imgs.map((im) => im.artifact));
          }
          break;
        }
        case 'pdf-metadata-viewer': {
          if (!primaryFile) throw new Error('Please upload a PDF file.');
          const art = await updatePdfMetadataFields(
            primaryFile,
            {
              title: metaTitle,
              author: metaAuthor,
              subject: metaSubject,
              keywords: metaKeywords,
              creator: metaCreator,
            },
            onProgress
          );
          setArtifacts([art]);
          break;
        }
        case 'pdf-page-counter': {
          if (files.length === 0) throw new Error('Please upload at least one PDF file.');
          const csvRows = [
            ['Filename', 'Pages', 'Size', 'Page 1 Dimensions (mm)', 'Encrypted'],
            ...files.map((f) => {
              const p1 = f.metadata?.pageSizes?.[0];
              const dims = p1 ? `${p1.widthMm}x${p1.heightMm} mm` : 'Unknown';
              return [
                `"${f.name.replace(/"/g, '""')}"`,
                String(f.pageCount || 0),
                formatBytes(f.size),
                dims,
                f.isEncrypted ? 'Yes' : 'No',
              ];
            }),
          ];
          const csvArt = createOutputArtifact(
            'pdf_page_count_report.csv',
            '\uFEFF' + csvRows.map((r) => r.join(',')).join('\r\n'),
            'text/csv;charset=utf-8',
            {
              summaryNote: `${files.length} file(s) · ${files.reduce((s, f) => s + (f.pageCount || 0), 0)} total pages`,
            }
          );
          setArtifacts([csvArt]);
          break;
        }
        case 'pdf-ocr': {
          if (!primaryFile) throw new Error('Please upload a PDF file.');
          const res = await runPdfOcr(
            primaryFile,
            { lang: ocrLang, pageRange: pageRangeInput, outputFormat: ocrOutputFmt },
            onProgress
          );
          setArtifacts([res.artifact]);
          setStatusBanner({
            title: isUrdu ? 'OCR پروسیسنگ مکمل' : 'OCR Recognition Complete',
            detail: `Recognized text across ${res.pagesProcessed} page(s) with average OCR confidence of ${res.avgConfidence}%.`,
            tone: 'success',
          });
          break;
        }
        case 'pdf-repair': {
          if (!primaryFile) throw new Error('Please upload a PDF file to repair.');
          const res = await repairPdfDocument(primaryFile, onProgress);
          setArtifacts([res.artifact]);
          setStatusBanner({
            title: isUrdu ? `مرمت مکمل — ${res.recoveredPages} صفحات بحال` : `Recovery Complete — ${res.recoveredPages} Page(s) Recovered`,
            detail: res.repairActions.join(' · '),
            tone: 'success',
          });
          break;
        }
        default:
          break;
      }

      emitCalculationSuccess({
        toolId: 'pdf-tools-suite',
        title: tool.name,
        titleUrdu: tool.nameUrdu,
        message: 'Local browser processing finished cleanly.',
        messageUrdu: 'براؤزر میں مقامی پروسیسنگ کامیابی سے مکمل ہو گئی۔',
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Processing failed.');
    } finally {
      setIsRunning(false);
      setProgress(null);
    }
  };

  const canRunPrimaryButton =
    tool.id === 'txt-to-pdf'
      ? files.length > 0 || pastedText.trim().length > 0
      : tool.id === 'merge-pdf'
      ? files.length >= 2
      : files.length > 0;

  return (
    <div className="space-y-6">
      {/* Universal File Dropzone */}
      <PdfFileDropzone
        tool={tool}
        files={files}
        onFilesChange={handleFilesChange}
        isUrdu={isUrdu}
        allowReorder={tool.id === 'merge-pdf' || tool.allowMultiple}
        showMergeRangeInput={tool.id === 'merge-pdf'}
      />

      {/* Interactive Editor Workspace (Category E) */}
      {isEditorTool && primaryFile && !primaryFile.isEncrypted && (
        <InteractivePdfEditorWorkspace
          toolId={tool.id}
          fileItem={primaryFile}
          isUrdu={isUrdu}
          onResultReady={(art) => {
            clearOutputs();
            setArtifacts([art]);
            emitCalculationSuccess({
              toolId: 'pdf-tools-suite',
              title: tool.name,
              titleUrdu: tool.nameUrdu,
              message: 'Edited PDF ready to download.',
              messageUrdu: 'ایڈٹ شدہ پی ڈی ایف ڈاؤن لوڈ کے لیے تیار ہے۔',
            });
          }}
          onError={(msg) => setErrorMsg(msg)}
        />
      )}

      {/* Interactive Viewer / Search / Print Workspace */}
      {isViewerSearchPrintTool && primaryFile && !primaryFile.isEncrypted && (
        <PdfViewerSearchPrintWorkspace
          mode={tool.id as 'pdf-viewer' | 'pdf-search' | 'print-pdf'}
          fileItem={primaryFile}
          isUrdu={isUrdu}
          onError={(msg) => setErrorMsg(msg)}
        />
      )}

      {/* Standard Tool-Specific Controls */}
      {!isEditorTool && !isViewerSearchPrintTool && (
        <div className="space-y-4">
          {/* Category A Controls */}
          {(tool.id === 'pdf-to-jpg' || tool.id === 'pdf-to-png' || tool.id === 'pdf-pages-to-images') && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution / Scale
                </label>
                <select
                  value={imageDpiScale}
                  onChange={(e) => setImageDpiScale(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                >
                  <option value={1}>Standard (72 DPI)</option>
                  <option value={1.5}>Crisp (108 DPI)</option>
                  <option value={2}>High Definition (144 DPI)</option>
                  <option value={3}>Ultra Sharp (216 DPI)</option>
                </select>
              </div>
              {tool.id === 'pdf-to-jpg' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    JPG Quality ({Math.round(imageQuality * 100)}%)
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={1}
                    step={0.05}
                    value={imageQuality}
                    onChange={(e) => setImageQuality(Number(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>
              )}
              {tool.id === 'pdf-pages-to-images' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pages to Export (e.g. 1, 3-5 — leave blank for all)
                  </label>
                  <input
                    type="text"
                    value={pageRangeInput}
                    onChange={(e) => setPageRangeInput(e.target.value)}
                    placeholder="1, 2-4"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
          )}

          {tool.id === 'pdf-to-excel' && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4">
              <label className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={singleSheetExcel}
                  onChange={(e) => setSingleSheetExcel(e.target.checked)}
                />
                {isUrdu
                  ? 'تمام صفحات کو ایک ہی ورک شیٹ میں یکجا کریں'
                  : 'Combine all PDF pages into a single Excel worksheet'}
              </label>
            </div>
          )}

          {(tool.id === 'pdf-to-txt' || tool.id === 'extract-text-pdf') && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Page Filter (blank = all pages)
                </label>
                <input
                  type="text"
                  value={pageRangeInput}
                  onChange={(e) => setPageRangeInput(e.target.value)}
                  placeholder="e.g. 1-3, 5"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 pt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePageHeadersTxt}
                  onChange={(e) => setIncludePageHeadersTxt(e.target.checked)}
                />
                Include <code className="font-mono text-xs">=== Page N ===</code> separators
              </label>
            </div>
          )}

          {/* Category B Controls */}
          {(tool.id === 'jpg-to-pdf' || tool.id === 'png-to-pdf' || tool.id === 'images-to-pdf') && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Page Size</label>
                <select
                  value={imgPageSize}
                  onChange={(e) => setImgPageSize(e.target.value as 'fit' | 'a4' | 'letter')}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                >
                  <option value="a4">A4 Standard</option>
                  <option value="letter">US Letter</option>
                  <option value="fit">Fit to Exact Image Size</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Orientation</label>
                <select
                  value={imgOrientation}
                  onChange={(e) => setImgOrientation(e.target.value as 'auto' | 'portrait' | 'landscape')}
                  disabled={imgPageSize === 'fit'}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm disabled:opacity-50"
                >
                  <option value="auto">Auto (Match Photo)</option>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Margin</label>
                <select
                  value={imgMarginPt}
                  onChange={(e) => setImgMarginPt(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                >
                  <option value={0}>No Margin (Full Bleed)</option>
                  <option value={18}>Small Margin (18 pt)</option>
                  <option value={36}>Standard Margin (36 pt)</option>
                </select>
              </div>
            </div>
          )}

          {tool.id === 'excel-to-pdf' && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                PDF Page Orientation
              </label>
              <select
                value={excelOrientation}
                onChange={(e) => setExcelOrientation(e.target.value as 'portrait' | 'landscape')}
                className="w-full sm:w-64 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
              >
                <option value="landscape">Landscape (Recommended for Wide Tables)</option>
                <option value="portrait">Portrait</option>
              </select>
            </div>
          )}

          {tool.id === 'txt-to-pdf' && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Font Family</label>
                  <select
                    value={txtFontFamily}
                    onChange={(e) => setTxtFontFamily(e.target.value as 'helvetica' | 'times' | 'courier')}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                  >
                    <option value="helvetica">Helvetica (Sans-Serif)</option>
                    <option value="times">Times Roman (Serif)</option>
                    <option value="courier">Courier (Monospace)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Font Size</label>
                  <input
                    type="number"
                    min={8}
                    max={24}
                    value={txtFontSize}
                    onChange={(e) => setTxtFontSize(Math.max(8, Number(e.target.value) || 11))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Paper Size</label>
                  <select
                    value={imgPageSize === 'letter' ? 'letter' : 'a4'}
                    onChange={(e) => setImgPageSize(e.target.value as 'a4' | 'letter')}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                  >
                    <option value="a4">A4</option>
                    <option value="letter">US Letter</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isUrdu ? 'یا براہِ راست ٹیکسٹ یہاں لکھیں/پیسٹ کریں:' : 'Or type / paste text directly:'}
                </label>
                <textarea
                  rows={5}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste plain text notes, logs, or markdown here to paginate cleanly into PDF..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm"
                />
              </div>
            </div>
          )}

          {/* Category C Controls */}
          {tool.id === 'split-pdf' && primaryFile && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(
                  [
                    { id: 'every-n', label: 'Split Every N Pages' },
                    { id: 'custom-ranges', label: 'Custom Page Ranges' },
                    { id: 'single-pages', label: 'All Single Pages (Burst)' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSplitMode(m.id)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
                      splitMode === m.id
                        ? 'border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {splitMode === 'every-n' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pages per split PDF (1–{primaryFile.pageCount || 1})
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, primaryFile.pageCount || 1)}
                    value={splitEveryN}
                    onChange={(e) => setSplitEveryN(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full sm:w-48 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
              )}
              {splitMode === 'custom-ranges' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Separate output ranges with semicolons (e.g. 1-2; 3-5; 6)
                  </label>
                  <input
                    type="text"
                    value={splitRanges}
                    onChange={(e) => setSplitRanges(e.target.value)}
                    placeholder="1-2; 3-5"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
          )}

          {tool.id === 'separate-pdfs' && primaryFile && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Output PDF Packets (Total Pages: {primaryFile.pageCount || 0})
                </h4>
                <button
                  type="button"
                  onClick={() =>
                    setSeparateGroups((prev) => [
                      ...prev,
                      { name: `Part_${prev.length + 1}`, range: '1' },
                    ])
                  }
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-3 py-1.5 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Output PDF
                </button>
              </div>
              <div className="space-y-2">
                {separateGroups.map((grp, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 items-center">
                    <input
                      type="text"
                      value={grp.name}
                      onChange={(e) =>
                        setSeparateGroups((prev) =>
                          prev.map((g, i) => (i === idx ? { ...g, name: e.target.value } : g))
                        )
                      }
                      placeholder="Output Filename"
                      className="flex-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={grp.range}
                      onChange={(e) =>
                        setSeparateGroups((prev) =>
                          prev.map((g, i) => (i === idx ? { ...g, range: e.target.value } : g))
                        )
                      }
                      placeholder="Pages (e.g. 1-3, 5)"
                      className="sm:w-48 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                    />
                    {separateGroups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setSeparateGroups((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        aria-label="Remove group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visual Thumbnail Grids for C tools */}
          {primaryFile && !primaryFile.isEncrypted && ['extract-pages', 'delete-pages', 'rotate-pages', 'reorder-pages', 'duplicate-pages'].includes(tool.id) && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 space-y-4">
              {(tool.id === 'extract-pages' || tool.id === 'delete-pages') && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {tool.id === 'extract-pages'
                      ? 'Click pages below to select OR enter custom range (e.g. 1, 3-5):'
                      : 'Click pages below to mark for deletion OR enter range (e.g. 2, 4):'}
                  </p>
                  <input
                    type="text"
                    value={pageRangeInput}
                    onChange={(e) => setPageRangeInput(e.target.value)}
                    placeholder="Optional range override..."
                    className="sm:w-56 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs"
                  />
                </div>
              )}

              {tool.id === 'rotate-pages' && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => rotateAllPages(90)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Rotate All +90°
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateAllPages(180)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold"
                  >
                    Rotate All 180°
                  </button>
                  <button
                    type="button"
                    onClick={() => setRotationsByPage({})}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2"
                  >
                    Reset Rotations
                  </button>
                </div>
              )}

              <PdfThumbnailGrid
                fileItem={primaryFile}
                mode={
                  tool.id === 'extract-pages'
                    ? 'select'
                    : tool.id === 'delete-pages'
                    ? 'delete'
                    : tool.id === 'rotate-pages'
                    ? 'rotate'
                    : tool.id === 'duplicate-pages'
                    ? 'duplicate'
                    : 'reorder'
                }
                selectedPages={selectedPages}
                onTogglePage={togglePageSelection}
                rotationsByPage={rotationsByPage}
                onRotatePage={handleRotateSinglePage}
                pageOrder={pageOrder}
                onPageOrderChange={setPageOrder}
                isUrdu={isUrdu}
              />
            </div>
          )}

          {/* Category D Controls */}
          {['compress-pdf', 'reduce-pdf-size', 'optimize-pdf-images', 'compression-quality'].includes(tool.id) && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(
                  [
                    {
                      id: 'lossless-stream',
                      title: 'Lossless Stream Compression',
                      desc: 'Keeps crisp vector text & fonts intact (QPDF).',
                    },
                    {
                      id: 'balanced-raster',
                      title: 'Balanced Image Optimization',
                      desc: 'Re-encodes heavy pages with tunable quality.',
                    },
                    {
                      id: 'aggressive-raster',
                      title: 'Maximum Size Reduction',
                      desc: 'Aggressive DPI/JPEG optimization for tiny files.',
                    },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCompressionMode(m.id)}
                    className={`text-left rounded-xl border p-3 transition-colors ${
                      compressionMode === m.id
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{m.title}</p>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{m.desc}</p>
                  </button>
                ))}
              </div>

              {compressionMode !== 'lossless-stream' && (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700/70">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Compression Level:</span>
                    {(['low', 'medium', 'high'] as const).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCompressionPreset(preset)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize ${
                          compressionPreset === preset
                            ? 'border-blue-600 bg-blue-700 text-white'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {preset === 'low' ? 'Low (Best Clarity)' : preset === 'medium' ? 'Medium (Recommended)' : 'High (Smallest)'}
                      </button>
                    ))}
                  </div>

                  {tool.id === 'compression-quality' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                          Render Resolution: {Math.round(customRasterScale * 72)} DPI
                        </label>
                        <input
                          type="range"
                          min={0.75}
                          max={2.0}
                          step={0.15}
                          value={customRasterScale}
                          onChange={(e) => setCustomRasterScale(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                          JPEG Quality: {Math.round(customRasterJpgQ * 100)}%
                        </label>
                        <input
                          type="range"
                          min={0.35}
                          max={0.95}
                          step={0.05}
                          value={customRasterJpgQ}
                          onChange={(e) => setCustomRasterJpgQ(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Category F Controls */}
          {tool.id === 'protect-pdf' && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Open Password
                  </label>
                  <input
                    type="password"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="Enter strong password"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-slate-700 dark:text-slate-300">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowPrinting}
                    onChange={(e) => setAllowPrinting(e.target.checked)}
                  />
                  Allow Printing
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowCopying}
                    onChange={(e) => setAllowCopying(e.target.checked)}
                  />
                  Allow Text Copying
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowModifying}
                    onChange={(e) => setAllowModifying(e.target.checked)}
                  />
                  Allow Document Modification
                </label>
              </div>
            </div>
          )}

          {tool.id === 'unlock-pdf' && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Authorized User or Owner Password
              </label>
              <input
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder="Enter the valid password for this protected PDF"
                className="w-full sm:max-w-md rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </div>
          )}

          {/* Category G: Metadata Viewer/Editor */}
          {tool.id === 'pdf-metadata-viewer' && primaryFile && !primaryFile.isEncrypted && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Inspect & Edit Document Metadata
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Author</label>
                  <input
                    type="text"
                    value={metaAuthor}
                    onChange={(e) => setMetaAuthor(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Subject</label>
                  <input
                    type="text"
                    value={metaSubject}
                    onChange={(e) => setMetaSubject(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Creator Application</label>
                  <input
                    type="text"
                    value={metaCreator}
                    onChange={(e) => setMetaCreator(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              {primaryFile.metadata && (
                <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Producer: {primaryFile.metadata.producer || 'N/A'}</span>
                  <span>Created: {primaryFile.metadata.creationDate || 'N/A'}</span>
                  <span>
                    Page 1:{' '}
                    {primaryFile.metadata.pageSizes[0]
                      ? `${primaryFile.metadata.pageSizes[0].widthMm} × ${primaryFile.metadata.pageSizes[0].heightMm} mm`
                      : 'N/A'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Category G: Live Batch Page Counter Table */}
          {tool.id === 'pdf-page-counter' && files.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Live Page Count Summary
                </span>
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                  Total: {files.reduce((s, f) => s + (f.pageCount || 0), 0)} pages
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="px-4 py-2.5">File</th>
                      <th className="px-4 py-2.5">Pages</th>
                      <th className="px-4 py-2.5">Size</th>
                      <th className="px-4 py-2.5">Page 1 Dimensions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {files.map((f) => {
                      const p1 = f.metadata?.pageSizes[0];
                      return (
                        <tr key={f.id}>
                          <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{f.name}</td>
                          <td className="px-4 py-2.5 font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                            {f.pageCount || 0}
                          </td>
                          <td className="px-4 py-2.5 tabular-nums">{formatBytes(f.size)}</td>
                          <td className="px-4 py-2.5 tabular-nums">
                            {p1 ? `${p1.widthMm} × ${p1.heightMm} mm (${p1.widthPt}×${p1.heightPt} pt)` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Category G: OCR Settings */}
          {tool.id === 'pdf-ocr' && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">OCR Language</label>
                <select
                  value={ocrLang}
                  onChange={(e) => setOcrLang(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                >
                  <option value="eng">English (eng)</option>
                  <option value="urd">Urdu (urd)</option>
                  <option value="ara">Arabic (ara)</option>
                  <option value="eng+urd">English + Urdu</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Output Format</label>
                <select
                  value={ocrOutputFmt}
                  onChange={(e) => setOcrOutputFmt(e.target.value as 'txt' | 'docx')}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                >
                  <option value="txt">Plain Text (.txt)</option>
                  <option value="docx">Editable Word (.docx)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Page Range (blank = all)
                </label>
                <input
                  type="text"
                  value={pageRangeInput}
                  onChange={(e) => setPageRangeInput(e.target.value)}
                  placeholder="e.g. 1-3"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          {/* Primary Execute Action Button */}
          <button
            type="button"
            onClick={handleExecute}
            disabled={isRunning || !canRunPrimaryButton}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 text-sm font-bold shadow-sm transition-colors min-h-[46px] disabled:opacity-50"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : tool.id === 'pdf-page-counter' ? (
              <Download className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>
              {isRunning
                ? t.processing
                : tool.id === 'pdf-metadata-viewer'
                ? 'Save Updated Metadata PDF'
                : tool.id === 'pdf-page-counter'
                ? 'Export Page Count CSV'
                : tool.id === 'pdf-security-status'
                ? 'Inspect PDF Security Status'
                : `${t.processBtn}: ${isUrdu ? tool.nameUrdu : tool.name}`}
            </span>
          </button>
        </div>
      )}

      {/* Progress Bar */}
      {progress && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-200">
            <span>{progress.stage}</span>
            <span className="tabular-nums">{progress.percent}%</span>
          </div>
          <div className="h-2 rounded-full bg-blue-200/70 dark:bg-blue-900 overflow-hidden">
            <div
              style={{ width: `${Math.min(100, Math.max(5, progress.percent))}%` }}
              className="h-full bg-blue-600 transition-all duration-200"
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-4 flex items-start gap-3 text-sm text-red-800 dark:text-red-300"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <p className="leading-relaxed">{errorMsg}</p>
        </div>
      )}

      {/* Results & Preview Panel */}
      <PdfResultsPanel
        artifacts={artifacts}
        compressionStats={compressionStats}
        statusBanner={statusBanner}
        isUrdu={isUrdu}
        zipBasename={primaryFile ? sanitizeOutputBasename(primaryFile.name) : tool.id}
      />

      {/* Honest Scope & Limitation Disclosure */}
      {tool.limitationNote && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/40 p-4 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <p className="font-bold text-slate-800 dark:text-slate-200">{t.honestNoteTitle}</p>
            <p>{isUrdu && tool.limitationNoteUrdu ? tool.limitationNoteUrdu : tool.limitationNote}</p>
          </div>
        </div>
      )}

      {/* Privacy Guarantee Footer */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>
          {isUrdu
            ? 'آپ کی تمام فائلیں 100٪ آپ کے براؤزر میں ہی پروسیس ہوتی ہیں اور کسی بیرونی سرور پر اپ لوڈ نہیں کی جاتیں۔'
            : '100% browser-side execution: your documents remain strictly on your device with zero server uploads.'}
        </span>
      </div>
    </div>
  );
};
