/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  FileCheck,
  FileText,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  Unlock,
  UploadCloud,
} from 'lucide-react';
import { PdfSuiteFileItem, PdfToolDescriptor } from './pdfSuiteTypes';
import { PDF_SUITE_TEXT } from './pdfSuiteTranslations';
import { formatBytes, validateUploadedFile } from './pdfValidation';
import { inspectPdfQuick } from './pdfEngineCore';

interface PdfFileDropzoneProps {
  tool: PdfToolDescriptor;
  files: PdfSuiteFileItem[];
  onFilesChange: (nextFiles: PdfSuiteFileItem[]) => void;
  isUrdu: boolean;
  allowReorder?: boolean;
  showMergeRangeInput?: boolean;
}

export const PdfFileDropzone: React.FC<PdfFileDropzoneProps> = ({
  tool,
  files,
  onFilesChange,
  isUrdu,
  allowReorder = false,
  showMergeRangeInput = false,
}) => {
  const t = isUrdu ? PDF_SUITE_TEXT.ur : PDF_SUITE_TEXT.en;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const acceptAttr = [
    ...tool.acceptedExtensions.map((ext) => `.${ext}`),
    ...tool.acceptedMimeTypes,
  ].join(',');

  const handleIncomingFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setValidationError(null);
    setIsValidating(true);

    try {
      const incoming = tool.allowMultiple ? Array.from(fileList) : [fileList[0]];
      const existingBytes = tool.allowMultiple
        ? files.reduce((sum, f) => sum + f.size, 0)
        : 0;

      let runningBytes = existingBytes;
      const errors: string[] = [];
      const newItems: PdfSuiteFileItem[] = [];

      for (const file of incoming) {
        const res = await validateUploadedFile(file, tool, isUrdu, runningBytes);
        if (!res.valid || !res.bytes) {
          if (res.error) errors.push(res.error);
          continue;
        }
        runningBytes += file.size;

        let pageCount: number | undefined;
        let isEncrypted = false;
        let metadata: PdfSuiteFileItem['metadata'];

        if (res.extension === 'pdf' && tool.id !== 'pdf-repair') {
          try {
            const inspected = await inspectPdfQuick(res.bytes);
            pageCount = inspected.pageCount;
            isEncrypted = inspected.isEncrypted;
            metadata = inspected.metadata;
          } catch {
            // Handled downstream if file needs repair
          }
        }

        let thumbnailUrl: string | undefined;
        if (['jpg', 'jpeg', 'png', 'webp'].includes(res.extension)) {
          const clean = new Uint8Array(res.bytes.byteLength);
          clean.set(res.bytes);
          thumbnailUrl = URL.createObjectURL(new Blob([clean.buffer], { type: file.type || 'image/png' }));
        }

        newItems.push({
          id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          file,
          name: file.name,
          size: file.size,
          extension: res.extension,
          mimeType: file.type || '',
          bytes: res.bytes,
          pageCount,
          isEncrypted,
          thumbnailUrl,
          metadata,
        });
      }

      if (errors.length > 0) {
        setValidationError(errors.join(' '));
      }

      if (newItems.length > 0) {
        if (tool.allowMultiple) {
          onFilesChange([...files, ...newItems]);
        } else {
          // Revoke old thumbnails before replacing
          files.forEach((f) => {
            if (f.thumbnailUrl) URL.revokeObjectURL(f.thumbnailUrl);
          });
          onFilesChange(newItems);
        }
      }
    } finally {
      setIsValidating(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    const target = files.find((f) => f.id === id);
    if (target?.thumbnailUrl) URL.revokeObjectURL(target.thumbnailUrl);
    onFilesChange(files.filter((f) => f.id !== id));
    setValidationError(null);
  };

  const moveFile = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= files.length) return;
    const copy = [...files];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    onFilesChange(copy);
  };

  const clearAll = () => {
    files.forEach((f) => {
      if (f.thumbnailUrl) URL.revokeObjectURL(f.thumbnailUrl);
    });
    onFilesChange([]);
    setValidationError(null);
  };

  const updateRangeFilter = (id: string, value: string) => {
    onFilesChange(
      files.map((f) => (f.id === id ? { ...f, pageRangeFilter: value } : f))
    );
  };

  const allowedFormatsLabel = tool.acceptedExtensions.map((e) => `.${e.toUpperCase()}`).join(', ');

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        multiple={tool.allowMultiple}
        onChange={(e) => handleIncomingFiles(e.target.files)}
        className="hidden"
        aria-label={t.dropzoneTitle}
      />

      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleIncomingFiles(e.dataTransfer.files);
        }}
        className={`group relative rounded-xl border-2 border-dashed p-6 sm:p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-600 bg-blue-50/70 dark:border-blue-400 dark:bg-blue-950/30'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:border-blue-500 dark:hover:bg-slate-800/60'
        }`}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 group-hover:scale-105 transition-transform">
          <UploadCloud className="w-6 h-6" />
        </div>
        <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
          {files.length > 0 && !tool.allowMultiple
            ? t.dropzoneReplace
            : files.length > 0 && tool.allowMultiple
            ? t.dropzoneAddMore
            : t.dropzoneTitle}
        </p>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {tool.allowMultiple ? t.dropzoneMultiHint : t.dropzoneSingleHint}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 font-medium">
            {isUrdu ? 'مجاز فارمیٹس:' : 'Accepted:'} {allowedFormatsLabel}
          </span>
          <span className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 font-medium tabular-nums">
            {isUrdu ? 'زیادہ سے زیادہ 100 MB' : 'Max 100 MB / file'}
          </span>
        </div>
        {isValidating && (
          <p className="mt-3 text-xs font-medium text-blue-600 dark:text-blue-400">
            {isUrdu ? 'فائل کی جانچ ہو رہی ہے...' : 'Validating file signature & metadata...'}
          </p>
        )}
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-3.5 text-sm text-red-800 dark:text-red-300"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <p className="leading-relaxed">{validationError}</p>
        </div>
      )}

      {/* Queued Files List */}
      {files.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 tabular-nums">
              {isUrdu
                ? `${files.length} فائل منتخب`
                : `${files.length} File${files.length > 1 ? 's' : ''} Ready`}
              {files.length > 1 && ` · ${formatBytes(files.reduce((s, f) => s + f.size, 0))}`}
            </span>
            <div className="flex items-center gap-2">
              {tool.allowMultiple && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors min-h-[36px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t.dropzoneAddMore}
                </button>
              )}
              {!tool.allowMultiple && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors min-h-[36px]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {t.dropzoneReplace}
                </button>
              )}
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors min-h-[36px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t.clearAll}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {files.map((item, idx) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/70 p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {tool.allowMultiple ? `${idx + 1}. ` : ''}
                      {item.name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      <span>{formatBytes(item.size)}</span>
                      {typeof item.pageCount === 'number' && item.pageCount > 0 && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                            <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            {item.pageCount} {t.pagesLabel}
                          </span>
                        </>
                      )}
                      {item.extension === 'pdf' && tool.id !== 'pdf-repair' && (
                        <>
                          <span>·</span>
                          {item.isEncrypted ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 font-medium">
                              <Lock className="w-3 h-3" />
                              {t.encryptedBadge}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                              <Unlock className="w-3 h-3" />
                              {t.decryptedBadge}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {showMergeRangeInput && (
                    <input
                      type="text"
                      value={item.pageRangeFilter || ''}
                      onChange={(e) => updateRangeFilter(item.id, e.target.value)}
                      placeholder={isUrdu ? 'صفحات (مثلاً 1-3)' : 'Pages (e.g. 1-3)'}
                      aria-label={`Page range for ${item.name}`}
                      className="w-32 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                  {allowReorder && files.length > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveFile(idx, -1)}
                        disabled={idx === 0}
                        title={isUrdu ? 'اوپر لے جائیں' : 'Move Up'}
                        aria-label={`Move ${item.name} up`}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 min-w-[36px] min-h-[36px] flex items-center justify-center"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFile(idx, 1)}
                        disabled={idx === files.length - 1}
                        title={isUrdu ? 'نیچے لے جائیں' : 'Move Down'}
                        aria-label={`Move ${item.name} down`}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 min-w-[36px] min-h-[36px] flex items-center justify-center"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(item.id)}
                    title={isUrdu ? 'ہٹائیں' : 'Remove file'}
                    aria-label={`Remove ${item.name}`}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 min-w-[36px] min-h-[36px] flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
