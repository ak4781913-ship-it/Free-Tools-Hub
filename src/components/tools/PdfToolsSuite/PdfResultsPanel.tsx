/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Archive,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { CompressionStats, PdfOutputArtifact } from './pdfSuiteTypes';
import { PDF_SUITE_TEXT } from './pdfSuiteTranslations';
import { formatBytes } from './pdfValidation';
import { createZipFromArtifacts, triggerArtifactDownload } from './pdfEngineCore';

interface PdfResultsPanelProps {
  artifacts: PdfOutputArtifact[];
  compressionStats?: CompressionStats | null;
  statusBanner?: { title: string; detail: string; tone?: 'success' | 'info' | 'warning' } | null;
  isUrdu: boolean;
  zipBasename?: string;
}

export const PdfResultsPanel: React.FC<PdfResultsPanelProps> = ({
  artifacts,
  compressionStats,
  statusBanner,
  isUrdu,
  zipBasename = 'pdf_suite_outputs',
}) => {
  const t = isUrdu ? PDF_SUITE_TEXT.ur : PDF_SUITE_TEXT.en;
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [zipBusy, setZipBusy] = useState(false);
  const [expandedPdfUrl, setExpandedPdfUrl] = useState<string | null>(
    artifacts.length === 1 && artifacts[0].mimeType === 'application/pdf' ? artifacts[0].url : null
  );

  if (artifacts.length === 0 && !statusBanner && !compressionStats) {
    return null;
  }

  const handleDownloadAllZip = async () => {
    if (artifacts.length <= 1) return;
    setZipBusy(true);
    try {
      const zipArt = await createZipFromArtifacts(artifacts, `${zipBasename}.zip`);
      triggerArtifactDownload(zipArt);
      setTimeout(() => {
        if (zipArt.url.startsWith('blob:')) URL.revokeObjectURL(zipArt.url);
      }, 4000);
    } finally {
      setZipBusy(false);
    }
  };

  const handleCopyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  return (
    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-900/80 p-5 sm:p-6 space-y-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.resultsReady}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {artifacts.length > 0
                ? isUrdu
                  ? `${artifacts.length} آؤٹ پٹ فائل تیار ہے`
                  : `${artifacts.length} output file${artifacts.length > 1 ? 's' : ''} generated locally`
                : isUrdu
                ? 'پروسیسنگ مکمل ہو گئی'
                : 'Completed locally in browser'}
            </p>
          </div>
        </div>

        {artifacts.length > 1 && (
          <button
            type="button"
            onClick={handleDownloadAllZip}
            disabled={zipBusy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 text-sm font-semibold transition-colors min-h-[42px] disabled:opacity-60"
          >
            <Archive className="w-4 h-4" />
            {zipBusy
              ? isUrdu
                ? 'ZIP بن رہی ہے...'
                : 'Creating ZIP...'
              : t.downloadAllZip}
          </button>
        )}
      </div>

      {/* Optional Status / Security Banner */}
      {statusBanner && (
        <div
          className={`rounded-xl border p-4 flex items-start gap-3 ${
            statusBanner.tone === 'warning'
              ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
              : 'border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200'
          }`}
        >
          <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-bold">{statusBanner.title}</p>
            <p className="opacity-90 leading-relaxed">{statusBanner.detail}</p>
          </div>
        </div>
      )}

      {/* Optional Compression Size Comparison */}
      {compressionStats && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.originalSize}</span>
              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                {formatBytes(compressionStats.originalSize)}
              </p>
            </div>
            <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 p-3.5">
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{t.outputSize}</span>
              <p className="mt-1 text-lg font-bold text-blue-900 dark:text-white tabular-nums">
                {formatBytes(compressionStats.compressedSize)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5">
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{t.savedLabel}</span>
              <p className="mt-1 text-lg font-bold text-emerald-800 dark:text-emerald-300 tabular-nums">
                {compressionStats.savedBytes > 0
                  ? `${compressionStats.reductionPercent}% (−${formatBytes(compressionStats.savedBytes)})`
                  : '0% (Already optimal)'}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            <strong className="text-slate-800 dark:text-slate-200">{compressionStats.modeUsed}</strong>
            {compressionStats.note ? ` — ${compressionStats.note}` : ''}
          </p>
        </div>
      )}

      {/* Image Gallery Preview when multiple image outputs */}
      {artifacts.some((a) => a.previewUrl) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {artifacts
            .filter((a) => a.previewUrl)
            .map((art) => (
              <div
                key={art.id}
                className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 overflow-hidden flex flex-col"
              >
                <div className="aspect-[3/4] bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center p-1">
                  <img
                    src={art.previewUrl}
                    alt={art.filename}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="p-2.5 flex items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {art.filename}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {formatBytes(art.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerArtifactDownload(art)}
                    title={`${t.downloadFile} ${art.filename}`}
                    className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shrink-0 min-w-[34px] min-h-[34px] flex items-center justify-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Output Files Action List */}
      <div className="space-y-2.5">
        {artifacts.map((art) => {
          const isPdf = art.mimeType === 'application/pdf';
          const isActivePdfPreview = expandedPdfUrl === art.url;

          return (
            <div
              key={art.id}
              className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 p-3.5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-600/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {art.filename}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {formatBytes(art.size)}
                      {art.pageCount ? ` · ${art.pageCount} ${t.pagesLabel}` : ''}
                      {art.summaryNote ? ` · ${art.summaryNote}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {art.textPreview && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(art.id, art.textPreview || '')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 min-h-[38px]"
                    >
                      {copiedId === art.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          {isUrdu ? 'کاپی ہو گیا' : 'Copied'}
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          {isUrdu ? 'ٹیکسٹ کاپی' : 'Copy Text'}
                        </>
                      )}
                    </button>
                  )}

                  {isPdf && (
                    <button
                      type="button"
                      onClick={() => setExpandedPdfUrl(isActivePdfPreview ? null : art.url)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 min-h-[38px]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {isActivePdfPreview
                        ? isUrdu
                          ? 'پری ویو چھپائیں'
                          : 'Hide Preview'
                        : isUrdu
                        ? 'PDF پری ویو'
                        : 'Preview PDF'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => triggerArtifactDownload(art)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 text-xs sm:text-sm font-semibold transition-colors min-h-[38px]"
                  >
                    <Download className="w-4 h-4" />
                    {t.downloadFile}
                  </button>
                </div>
              </div>

              {/* Embedded PDF Preview */}
              {isPdf && isActivePdfPreview && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-950">
                  <iframe
                    src={art.url}
                    title={`Preview ${art.filename}`}
                    className="w-full h-[460px]"
                  />
                </div>
              )}

              {/* Text / OCR Preview */}
              {art.textPreview && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed">
                    {art.textPreview}
                  </pre>
                </div>
              )}

              {/* Excel Table Preview */}
              {art.tablePreview && art.tablePreview.length > 0 && (
                <div className="space-y-3">
                  {art.tablePreview.slice(0, 2).map((sheet) => (
                    <div
                      key={sheet.sheetName}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden"
                    >
                      <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        {sheet.sheetName}
                      </div>
                      <div className="overflow-x-auto max-h-60">
                        <table className="min-w-full text-xs text-left border-collapse">
                          <tbody>
                            {sheet.rows.slice(0, 15).map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                className={
                                  rIdx === 0
                                    ? 'bg-slate-50 dark:bg-slate-900 font-semibold'
                                    : 'border-t border-slate-100 dark:border-slate-800'
                                }
                              >
                                {row.map((cell, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className="px-2.5 py-1.5 text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 last:border-r-0 max-w-[220px] truncate"
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
