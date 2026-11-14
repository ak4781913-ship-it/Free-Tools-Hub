/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Printer,
  RotateCw,
  Search,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { PdfSearchMatch, PdfSubToolId, PdfSuiteFileItem } from './pdfSuiteTypes';
import { parsePageRanges, renderPdfPageToDataUrl } from './pdfEngineCore';
import { searchPdfText } from './pdfEditSecurityAdvanced';
import { recordPrintDocument } from '../../../utils/printHistoryTracking';

interface PdfViewerSearchPrintWorkspaceProps {
  mode: Extract<PdfSubToolId, 'pdf-viewer' | 'pdf-search' | 'print-pdf'>;
  fileItem: PdfSuiteFileItem;
  isUrdu: boolean;
  onError: (msg: string) => void;
}

export const PdfViewerSearchPrintWorkspace: React.FC<PdfViewerSearchPrintWorkspaceProps> = ({
  mode,
  fileItem,
  isUrdu,
  onError,
}) => {
  const totalPages = Math.max(1, fileItem.pageCount || 1);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomScale, setZoomScale] = useState(1.25);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [pageUrl, setPageUrl] = useState('');
  const [rendering, setRendering] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<PdfSearchMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Print state
  const [printRange, setPrintRange] = useState('');
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    setMatches([]);
    setHasSearched(false);
  }, [fileItem]);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      setRendering(true);
      try {
        const res = await renderPdfPageToDataUrl(fileItem.bytes, currentPage, {
          scale: zoomScale,
          format: 'image/png',
          extraRotationDeg: rotationDeg,
        });
        if (!cancelled) setPageUrl(res.dataUrl);
      } catch (err) {
        if (!cancelled) {
          onError(err instanceof Error ? err.message : 'Unable to render PDF page.');
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    };
    void render();
    return () => {
      cancelled = true;
    };
  }, [fileItem, currentPage, zoomScale, rotationDeg, onError]);

  const handleRunSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const found = await searchPdfText(fileItem, searchQuery, caseSensitive);
      setMatches(found);
      if (found.length > 0) {
        setCurrentPage(found[0].page);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setSearching(false);
    }
  };

  const handleIsolatedPrint = async () => {
    setPrinting(true);
    try {
      const pages = printRange.trim()
        ? parsePageRanges(printRange, totalPages)
        : Array.from({ length: totalPages }, (_, i) => i + 1);

      const pageImages: string[] = [];
      for (const p of pages) {
        const rendered = await renderPdfPageToDataUrl(fileItem.bytes, p, {
          scale: 1.8,
          format: 'image/jpeg',
          quality: 0.92,
        });
        pageImages.push(rendered.dataUrl);
      }

      // Render into isolated hidden iframe and trigger print (no window.open)
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc || !iframe.contentWindow) {
        document.body.removeChild(iframe);
        throw new Error('Isolated print frame could not be initialized.');
      }

      doc.open();
      doc.write(`<!doctype html><html><head><title>${fileItem.name}</title>
        <style>
          @page { margin: 0; }
          body { margin: 0; padding: 0; background: #fff; }
          .page { page-break-after: always; display: flex; justify-content: center; align-items: center; width: 100vw; height: 100vh; }
          .page:last-child { page-break-after: auto; }
          img { max-width: 100%; max-height: 100%; object-fit: contain; }
        </style>
      </head><body>
        ${pageImages.map((src) => `<div class="page"><img src="${src}" /></div>`).join('')}
      </body></html>`);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          recordPrintDocument('pdf-tools-suite', fileItem.name, {
            toolName: 'PDF Tools Suite (Print PDF)',
            format: 'Isolated Browser Print',
            summary: `Prepared ${pages.length} page(s) for printing.`,
          });
        } finally {
          setTimeout(() => {
            if (iframe.parentNode) document.body.removeChild(iframe);
          }, 1500);
        }
      }, 350);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unable to prepare PDF for printing.');
    } finally {
      setPrinting(false);
    }
  };

  const activePageMatch = mode === 'pdf-search' ? matches.find((m) => m.page === currentPage) : undefined;

  return (
    <div className="space-y-4">
      {/* Search Controls Bar */}
      {mode === 'pdf-search' && (
        <form
          onSubmit={handleRunSearch}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 space-y-3"
        >
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isUrdu ? 'پی ڈی ایف میں لفظ تلاش کریں...' : 'Search words or phrases inside this PDF...'}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 px-2 cursor-pointer">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
              />
              {isUrdu ? 'حروف کی حساسیت' : 'Case sensitive'}
            </label>
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 text-sm font-semibold min-h-[42px] disabled:opacity-60"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isUrdu ? 'تلاش کریں' : 'Search PDF'}
            </button>
          </div>

          {hasSearched && !searching && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                {matches.length > 0
                  ? `${matches.reduce((s, m) => s + m.matchCountOnPage, 0)} match(es) across ${matches.length} page(s)`
                  : isUrdu
                  ? 'اس دستاویز میں کوئی مماثلت نہیں ملی۔'
                  : 'No matches found in selectable text of this PDF.'}
              </p>
              {matches.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {matches.map((m) => (
                    <button
                      key={m.page}
                      type="button"
                      onClick={() => setCurrentPage(m.page)}
                      className={`text-left rounded-lg border p-2.5 text-xs transition-colors ${
                        currentPage === m.page
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                        Page {m.page} ({m.matchCountOnPage} hit{m.matchCountOnPage > 1 ? 's' : ''})
                      </span>
                      <p className="mt-1 text-slate-600 dark:text-slate-400 line-clamp-2">{m.snippet}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>
      )}

      {/* Print Controls Bar */}
      {mode === 'print-pdf' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {isUrdu ? 'پرنٹ کے لیے صفحات (خالی چھوڑیں = تمام صفحات)' : 'Pages to Print (blank = all pages)'}
            </label>
            <input
              type="text"
              value={printRange}
              onChange={(e) => setPrintRange(e.target.value)}
              placeholder={`e.g. 1-${totalPages} or 1, 3`}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleIsolatedPrint}
            disabled={printing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 text-sm font-bold min-h-[42px] disabled:opacity-60"
          >
            {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            {printing ? (isUrdu ? 'پرنٹ تیار ہو رہا ہے...' : 'Preparing Print...') : isUrdu ? 'پی ڈی ایف پرنٹ کریں' : 'Print PDF'}
          </button>
        </div>
      )}

      {/* Viewer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 px-3.5 py-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
            Page {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomScale((z) => Math.max(0.6, Math.round((z - 0.2) * 10) / 10))}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-2 text-xs font-semibold tabular-nums text-slate-600 dark:text-slate-300">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomScale((z) => Math.min(2.4, Math.round((z + 0.2) * 10) / 10))}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setRotationDeg((r) => (r + 90) % 360)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700"
            aria-label="Rotate view"
            title="Rotate view 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          {mode === 'pdf-viewer' && (
            <button
              type="button"
              onClick={handleIsolatedPrint}
              disabled={printing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white px-3 py-2 text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          )}
        </div>
      </div>

      {/* Rendered Page Viewport */}
      <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-200/70 dark:bg-slate-950 p-4 overflow-auto max-h-[680px] flex justify-center">
        <div className="relative inline-block bg-white shadow-lg rounded overflow-hidden">
          {pageUrl && <img src={pageUrl} alt={`Page ${currentPage}`} className="block max-w-full h-auto" />}

          {/* Highlight Search Match Rects */}
          {activePageMatch &&
            rotationDeg === 0 &&
            activePageMatch.rects.map((r, idx) => (
              <div
                key={idx}
                style={{
                  left: `${r.leftPercent}%`,
                  top: `${r.topPercent}%`,
                  width: `${r.widthPercent}%`,
                  height: `${r.heightPercent}%`,
                }}
                className="pointer-events-none absolute bg-amber-300/45 ring-1 ring-amber-500 rounded-xs"
              />
            ))}

          {rendering && (
            <div className="absolute inset-0 bg-white/65 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
