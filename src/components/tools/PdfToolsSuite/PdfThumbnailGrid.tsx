/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CopyPlus,
  Loader2,
  RotateCw,
  Trash2,
} from 'lucide-react';
import { PdfSuiteFileItem } from './pdfSuiteTypes';
import { renderPdfPageToDataUrl } from './pdfEngineCore';

export type ThumbnailGridMode =
  | 'select'
  | 'delete'
  | 'rotate'
  | 'reorder'
  | 'duplicate';

interface PdfThumbnailGridProps {
  fileItem: PdfSuiteFileItem;
  mode: ThumbnailGridMode;
  selectedPages: number[];
  onTogglePage?: (pageNum: number) => void;
  rotationsByPage?: Record<number, number>;
  onRotatePage?: (pageNum: number, deltaDeg: number) => void;
  pageOrder?: number[];
  onPageOrderChange?: (nextOrder: number[]) => void;
  isUrdu: boolean;
}

const MAX_THUMBNAIL_RENDER = 48;

export const PdfThumbnailGrid: React.FC<PdfThumbnailGridProps> = ({
  fileItem,
  mode,
  selectedPages,
  onTogglePage,
  rotationsByPage = {},
  onRotatePage,
  pageOrder,
  onPageOrderChange,
  isUrdu,
}) => {
  const totalPages = fileItem.pageCount || 0;
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const [loadingCount, setLoadingCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setThumbs({});

    if (!fileItem || totalPages === 0 || fileItem.isEncrypted) {
      return;
    }

    const renderLimit = Math.min(totalPages, MAX_THUMBNAIL_RENDER);
    const loadThumbnails = async () => {
      setLoadingCount(renderLimit);
      for (let p = 1; p <= renderLimit; p++) {
        if (cancelled) break;
        try {
          const res = await renderPdfPageToDataUrl(fileItem.bytes, p, {
            scale: 0.42,
            format: 'image/jpeg',
            quality: 0.72,
          });
          if (!cancelled) {
            setThumbs((prev) => ({ ...prev, [p]: res.dataUrl }));
          }
        } catch {
          // Ignore single thumbnail error
        } finally {
          if (!cancelled) {
            setLoadingCount((c) => Math.max(0, c - 1));
          }
        }
      }
    };

    void loadThumbnails();

    return () => {
      cancelled = true;
    };
  }, [fileItem, totalPages]);

  if (totalPages === 0) return null;

  const sequence =
    (mode === 'reorder' || mode === 'duplicate') && pageOrder && pageOrder.length > 0
      ? pageOrder
      : Array.from({ length: totalPages }, (_, i) => i + 1);

  const selectedSet = new Set(selectedPages);

  const moveSlot = (slotIdx: number, delta: -1 | 1) => {
    if (!onPageOrderChange) return;
    const target = slotIdx + delta;
    if (target < 0 || target >= sequence.length) return;
    const next = [...sequence];
    const [item] = next.splice(slotIdx, 1);
    next.splice(target, 0, item);
    onPageOrderChange(next);
  };

  const duplicateSlot = (slotIdx: number) => {
    if (!onPageOrderChange) return;
    const next = [...sequence];
    next.splice(slotIdx + 1, 0, sequence[slotIdx]);
    onPageOrderChange(next);
  };

  const removeSlot = (slotIdx: number) => {
    if (!onPageOrderChange || sequence.length <= 1) return;
    const next = [...sequence];
    next.splice(slotIdx, 1);
    onPageOrderChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="tabular-nums font-medium">
          {isUrdu
            ? `صفحات کی کل تعداد: ${totalPages}`
            : `Showing ${Math.min(sequence.length, MAX_THUMBNAIL_RENDER)} of ${sequence.length} page slots`}
        </span>
        {loadingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {isUrdu ? 'صفحات لوڈ ہو رہے ہیں...' : 'Rendering previews...'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[460px] overflow-y-auto p-1">
        {sequence.map((pageNum, slotIdx) => {
          const isSelected = selectedSet.has(pageNum);
          const rot = rotationsByPage[pageNum] || 0;
          const thumbUrl = thumbs[pageNum];

          const borderClass =
            mode === 'delete' && isSelected
              ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/40 dark:bg-red-950/20'
              : mode === 'select' && isSelected
              ? 'border-blue-600 ring-2 ring-blue-600/20 bg-blue-50/40 dark:bg-blue-950/20'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70';

          return (
            <div
              key={`${pageNum}_${slotIdx}`}
              onClick={() => {
                if ((mode === 'select' || mode === 'delete') && onTogglePage) {
                  onTogglePage(pageNum);
                }
              }}
              className={`group rounded-xl border p-2 flex flex-col gap-2 transition-all ${
                mode === 'select' || mode === 'delete' ? 'cursor-pointer hover:border-blue-400' : ''
              } ${borderClass}`}
            >
              <div className="relative aspect-[3/4] rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden flex items-center justify-center">
                {thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt={`Page ${pageNum}`}
                    style={{ transform: `rotate(${rot}deg)` }}
                    className="max-w-full max-h-full object-contain transition-transform duration-200"
                  />
                ) : (
                  <span className="text-xs font-semibold text-slate-400 tabular-nums">P.{pageNum}</span>
                )}

                {(mode === 'select' || mode === 'delete') && (
                  <span
                    className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold shadow ${
                      isSelected
                        ? mode === 'delete'
                          ? 'bg-red-600'
                          : 'bg-blue-600'
                        : 'bg-slate-900/40'
                    }`}
                  >
                    {isSelected ? (mode === 'delete' ? '×' : <Check className="w-3.5 h-3.5" />) : ''}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-1 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                  {mode === 'reorder' || mode === 'duplicate'
                    ? `#${slotIdx + 1} (P.${pageNum})`
                    : `Page ${pageNum}`}
                </span>

                {mode === 'rotate' && onRotatePage && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRotatePage(pageNum, 90);
                    }}
                    title="Rotate +90°"
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50"
                  >
                    <RotateCw className="w-3 h-3" />
                    {rot ? `${rot}°` : '90°'}
                  </button>
                )}
              </div>

              {(mode === 'reorder' || mode === 'duplicate') && (
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => moveSlot(slotIdx, -1)}
                    disabled={slotIdx === 0}
                    title="Move Earlier"
                    className="p-1.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 disabled:opacity-35"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateSlot(slotIdx)}
                    title="Duplicate Page"
                    className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                  >
                    <CopyPlus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSlot(slotIdx)}
                    disabled={sequence.length <= 1}
                    title="Remove Slot"
                    className="p-1.5 rounded bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 disabled:opacity-35"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSlot(slotIdx, 1)}
                    disabled={slotIdx === sequence.length - 1}
                    title="Move Later"
                    className="p-1.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 disabled:opacity-35"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
