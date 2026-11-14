/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Droplets,
  Hash,
  ImagePlus,
  Loader2,
  PanelTop,
  Plus,
  Trash2,
  Type,
} from 'lucide-react';
import {
  PdfHeaderFooterConfig,
  PdfImageOverlay,
  PdfOutputArtifact,
  PdfPageNumberConfig,
  PdfSubToolId,
  PdfSuiteFileItem,
  PdfTextOverlay,
  PdfWatermarkConfig,
} from './pdfSuiteTypes';
import { renderPdfPageToDataUrl } from './pdfEngineCore';
import { applyPdfEdits } from './pdfEditSecurityAdvanced';
import { detectImageSignature } from './pdfValidation';

type EditorTab = 'text' | 'image' | 'watermark' | 'numbers' | 'headers';

interface InteractivePdfEditorWorkspaceProps {
  toolId: PdfSubToolId;
  fileItem: PdfSuiteFileItem;
  isUrdu: boolean;
  onResultReady: (artifact: PdfOutputArtifact) => void;
  onError: (message: string) => void;
}

function defaultTabForTool(toolId: PdfSubToolId): EditorTab {
  switch (toolId) {
    case 'add-images-pdf':
      return 'image';
    case 'add-watermark':
      return 'watermark';
    case 'add-page-numbers':
      return 'numbers';
    case 'add-headers-footers':
      return 'headers';
    default:
      return 'text';
  }
}

export const InteractivePdfEditorWorkspace: React.FC<InteractivePdfEditorWorkspaceProps> = ({
  toolId,
  fileItem,
  isUrdu,
  onResultReady,
  onError,
}) => {
  const totalPages = Math.max(1, fileItem.pageCount || 1);
  const [activeTab, setActiveTab] = useState<EditorTab>(() => defaultTabForTool(toolId));
  const [currentPage, setCurrentPage] = useState(1);
  const [pagePreviewUrl, setPagePreviewUrl] = useState<string>('');
  const [pageAspectRatio, setPageAspectRatio] = useState<number>(595 / 842);
  const [renderingPage, setRenderingPage] = useState(false);
  const [saving, setSaving] = useState(false);

  // Overlays & Edit Configs
  const [textOverlays, setTextOverlays] = useState<PdfTextOverlay[]>(() =>
    toolId === 'add-text-pdf' || toolId === 'interactive-pdf-editor'
      ? [
          {
            id: `txt_${Date.now()}`,
            page: 1,
            text: 'Sample Annotation Text',
            xPercent: 12,
            yPercent: 16,
            widthPercent: 45,
            fontSize: 16,
            color: '#1e3a8a',
            opacity: 1,
            bold: true,
          },
        ]
      : []
  );
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [imageOverlays, setImageOverlays] = useState<PdfImageOverlay[]>([]);

  const [watermark, setWatermark] = useState<PdfWatermarkConfig>({
    enabled: toolId === 'add-watermark',
    type: 'text',
    text: 'CONFIDENTIAL',
    fontSize: 48,
    color: '#dc2626',
    opacity: 0.25,
    rotation: -45,
    pageScope: 'all',
    customRange: '1',
    imageScalePercent: 40,
  });

  const [pageNumbers, setPageNumbers] = useState<PdfPageNumberConfig>({
    enabled: toolId === 'add-page-numbers',
    format: 'page-x-of-n',
    position: 'bottom-center',
    startFrom: 1,
    fontSize: 11,
    color: '#334155',
    marginPt: 24,
  });

  const [headerFooter, setHeaderFooter] = useState<PdfHeaderFooterConfig>({
    enabled: toolId === 'add-headers-footers',
    headerLeft: '',
    headerCenter: 'Document Title',
    headerRight: '{date}',
    footerLeft: 'Confidential',
    footerCenter: '',
    footerRight: 'Page {page} of {total}',
    fontSize: 10,
    color: '#475569',
    showDividerLine: true,
    skipFirstPage: false,
  });

  const canvasStageRef = useRef<HTMLDivElement | null>(null);
  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const wmImgInputRef = useRef<HTMLInputElement | null>(null);
  const imageOverlaysRef = useRef<PdfImageOverlay[]>(imageOverlays);
  imageOverlaysRef.current = imageOverlays;

  useEffect(() => {
    setActiveTab(defaultTabForTool(toolId));
    if (toolId === 'add-watermark') setWatermark((w) => ({ ...w, enabled: true }));
    if (toolId === 'add-page-numbers') setPageNumbers((p) => ({ ...p, enabled: true }));
    if (toolId === 'add-headers-footers') setHeaderFooter((h) => ({ ...h, enabled: true }));
  }, [toolId]);

  useEffect(() => {
    return () => {
      imageOverlaysRef.current.forEach((ov) => {
        if (ov.previewUrl.startsWith('blob:')) URL.revokeObjectURL(ov.previewUrl);
      });
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      setRenderingPage(true);
      try {
        const res = await renderPdfPageToDataUrl(fileItem.bytes, currentPage, {
          scale: 1.35,
          format: 'image/jpeg',
          quality: 0.88,
        });
        if (!cancelled) {
          setPagePreviewUrl(res.dataUrl);
          if (res.width > 0 && res.height > 0) {
            setPageAspectRatio(res.width / res.height);
          }
        }
      } catch (err) {
        if (!cancelled) {
          onError(err instanceof Error ? err.message : 'Unable to preview PDF page.');
        }
      } finally {
        if (!cancelled) setRenderingPage(false);
      }
    };
    void render();
    return () => {
      cancelled = true;
    };
  }, [fileItem, currentPage, onError]);

  const addNewTextOverlay = () => {
    const newItem: PdfTextOverlay = {
      id: `txt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      page: currentPage,
      text: 'New Text Block',
      xPercent: 18,
      yPercent: 25,
      widthPercent: 40,
      fontSize: 15,
      color: '#0f172a',
      opacity: 1,
      bold: false,
    };
    setTextOverlays((prev) => [...prev, newItem]);
    setSelectedOverlayId(newItem.id);
    setActiveTab('text');
  };

  const decodeImageToEmbeddable = async (
    file: File
  ): Promise<{ bytes: Uint8Array; mimeType: 'image/png' | 'image/jpeg'; previewUrl: string; aspect: number }> => {
    const raw = new Uint8Array(await file.arrayBuffer());
    const sig = detectImageSignature(raw);
    if (!sig) {
      throw new Error('Please choose a valid JPG, PNG, or WebP image.');
    }

    const blob = new Blob([raw], { type: file.type || 'image/png' });
    const url = URL.createObjectURL(blob);

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to load image file.'));
      el.src = url;
    });

    const aspect = (img.naturalWidth || 100) / Math.max(1, img.naturalHeight || 100);

    if (sig === 'jpg' || sig === 'png') {
      return {
        bytes: raw,
        mimeType: sig === 'jpg' ? 'image/jpeg' : 'image/png',
        previewUrl: url,
        aspect,
      };
    }

    // Normalize WebP -> PNG
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 300;
    canvas.height = img.naturalHeight || 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable.');
    ctx.drawImage(img, 0, 0);
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encode failed'))), 'image/png');
    });
    URL.revokeObjectURL(url);
    const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
    return {
      bytes: pngBytes,
      mimeType: 'image/png',
      previewUrl: URL.createObjectURL(pngBlob),
      aspect,
    };
  };

  const handleUploadImageOverlay = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const decoded = await decodeImageToEmbeddable(file);
      const widthPct = 28;
      const heightPct = Math.min(50, Math.max(8, (widthPct * pageAspectRatio) / decoded.aspect));
      const newImg: PdfImageOverlay = {
        id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        page: currentPage,
        name: file.name,
        bytes: decoded.bytes,
        mimeType: decoded.mimeType,
        previewUrl: decoded.previewUrl,
        xPercent: 20,
        yPercent: 20,
        widthPercent: widthPct,
        heightPercent: heightPct,
        opacity: 1,
      };
      setImageOverlays((prev) => [...prev, newImg]);
      setSelectedOverlayId(newImg.id);
      setActiveTab('image');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to load image.');
    } finally {
      e.target.value = '';
    }
  };

  const handleUploadWatermarkImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const decoded = await decodeImageToEmbeddable(file);
      URL.revokeObjectURL(decoded.previewUrl);
      setWatermark((prev) => ({
        ...prev,
        enabled: true,
        type: 'image',
        imageBytes: decoded.bytes,
        imageMime: decoded.mimeType,
      }));
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to load watermark image.');
    } finally {
      e.target.value = '';
    }
  };

  // Drag / Resize handlers on stage using % coordinates
  const startPointerDrag = (
    e: React.PointerEvent,
    kind: 'text' | 'image',
    id: string,
    mode: 'move' | 'resize'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedOverlayId(id);

    const stage = canvasStageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;

    const initialText = kind === 'text' ? textOverlays.find((t) => t.id === id) : undefined;
    const initialImg = kind === 'image' ? imageOverlays.find((im) => im.id === id) : undefined;

    const onMove = (ev: PointerEvent) => {
      const dxPct = ((ev.clientX - startX) / rect.width) * 100;
      const dyPct = ((ev.clientY - startY) / rect.height) * 100;

      if (kind === 'text' && initialText) {
        setTextOverlays((prev) =>
          prev.map((item) => {
            if (item.id !== id) return item;
            if (mode === 'move') {
              return {
                ...item,
                xPercent: Math.max(0, Math.min(92, initialText.xPercent + dxPct)),
                yPercent: Math.max(0, Math.min(92, initialText.yPercent + dyPct)),
              };
            }
            return {
              ...item,
              widthPercent: Math.max(12, Math.min(90, initialText.widthPercent + dxPct)),
            };
          })
        );
      } else if (kind === 'image' && initialImg) {
        setImageOverlays((prev) =>
          prev.map((item) => {
            if (item.id !== id) return item;
            if (mode === 'move') {
              return {
                ...item,
                xPercent: Math.max(0, Math.min(95 - item.widthPercent, initialImg.xPercent + dxPct)),
                yPercent: Math.max(0, Math.min(95 - item.heightPercent, initialImg.yPercent + dyPct)),
              };
            }
            return {
              ...item,
              widthPercent: Math.max(6, Math.min(90, initialImg.widthPercent + dxPct)),
              heightPercent: Math.max(5, Math.min(90, initialImg.heightPercent + dyPct)),
            };
          })
        );
      }
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleSavePdf = async () => {
    setSaving(true);
    try {
      const artifact = await applyPdfEdits(fileItem, {
        textOverlays,
        imageOverlays,
        watermark,
        pageNumbers,
        headerFooter,
      });
      onResultReady(artifact);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to apply edits to PDF.');
    } finally {
      setSaving(false);
    }
  };

  const selectedText = textOverlays.find((t) => t.id === selectedOverlayId);
  const selectedImg = imageOverlays.find((i) => i.id === selectedOverlayId);

  const pageNumberPreviewLabel =
    pageNumbers.format === 'page-x-of-n'
      ? `Page ${pageNumbers.startFrom + currentPage - 1} of ${pageNumbers.startFrom + totalPages - 1}`
      : pageNumbers.format === 'x-slash-n'
      ? `${pageNumbers.startFrom + currentPage - 1} / ${pageNumbers.startFrom + totalPages - 1}`
      : `${pageNumbers.startFrom + currentPage - 1}`;

  const replacePreviewTokens = (tpl: string) =>
    tpl
      .replace(/\{page\}/gi, String(currentPage))
      .replace(/\{total\}/gi, String(totalPages))
      .replace(/\{date\}/gi, new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));

  const tabItems: { id: EditorTab; label: string; icon: React.ReactNode }[] = [
    { id: 'text', label: isUrdu ? 'ٹیکسٹ' : 'Text', icon: <Type className="w-4 h-4" /> },
    { id: 'image', label: isUrdu ? 'تصاویر' : 'Images', icon: <ImagePlus className="w-4 h-4" /> },
    { id: 'watermark', label: isUrdu ? 'واٹر مارک' : 'Watermark', icon: <Droplets className="w-4 h-4" /> },
    { id: 'numbers', label: isUrdu ? 'صفحہ نمبر' : 'Page #', icon: <Hash className="w-4 h-4" /> },
    { id: 'headers', label: isUrdu ? 'ہیڈر/فوٹر' : 'Header/Footer', icon: <PanelTop className="w-4 h-4" /> },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left Controls Column */}
      <div className="lg:col-span-5 space-y-4">
        {/* Editor Mode Tabs */}
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-1.5">
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[84px] inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors min-h-[38px] ${
                activeTab === tab.id
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Text Annotations */}
        {activeTab === 'text' && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {isUrdu ? 'ٹیکسٹ باکسز (صفحہ ' + currentPage + ')' : `Text Overlays (Page ${currentPage})`}
              </h4>
              <button
                type="button"
                onClick={addNewTextOverlay}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 text-xs font-semibold min-h-[36px]"
              >
                <Plus className="w-3.5 h-3.5" />
                {isUrdu ? 'ٹیکسٹ شامل کریں' : 'Add Text'}
              </button>
            </div>

            {selectedText ? (
              <div className="space-y-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                    {isUrdu ? 'منتخب ٹیکسٹ ایڈٹ کریں' : 'Edit Selected Text'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTextOverlays((prev) => prev.filter((t) => t.id !== selectedText.id));
                      setSelectedOverlayId(null);
                    }}
                    className="text-xs text-red-600 hover:underline inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={selectedText.text}
                  onChange={(e) =>
                    setTextOverlays((prev) =>
                      prev.map((t) => (t.id === selectedText.id ? { ...t, text: e.target.value } : t))
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Size (pt)</label>
                    <input
                      type="number"
                      min={8}
                      max={72}
                      value={selectedText.fontSize}
                      onChange={(e) =>
                        setTextOverlays((prev) =>
                          prev.map((t) =>
                            t.id === selectedText.id ? { ...t, fontSize: Number(e.target.value) || 14 } : t
                          )
                        )
                      }
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">Color</label>
                    <input
                      type="color"
                      value={selectedText.color}
                      onChange={(e) =>
                        setTextOverlays((prev) =>
                          prev.map((t) => (t.id === selectedText.id ? { ...t, color: e.target.value } : t))
                        )
                      }
                      className="w-full h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 pb-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedText.bold}
                        onChange={(e) =>
                          setTextOverlays((prev) =>
                            prev.map((t) => (t.id === selectedText.id ? { ...t, bold: e.target.checked } : t))
                          )
                        }
                      />
                      Bold
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isUrdu
                  ? 'دائیں جانب کینوس پر کسی ٹیکسٹ باکس پر کلک کر کے اسے ڈریگ یا ایڈٹ کریں۔'
                  : 'Click a text box on the preview canvas to drag, resize, or customize its text and styling.'}
              </p>
            )}
          </div>
        )}

        {/* Tab 2: Images & Stamps */}
        {activeTab === 'image' && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 space-y-4">
            <input
              ref={imgInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
              onChange={handleUploadImageOverlay}
              className="hidden"
            />
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {isUrdu ? 'تصاویر، لوگو یا دستخط' : 'Images, Logos & Stamps'}
              </h4>
              <button
                type="button"
                onClick={() => imgInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 text-xs font-semibold min-h-[36px]"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                {isUrdu ? 'تصویر شامل کریں' : 'Upload Image'}
              </button>
            </div>
            {selectedImg && (
              <div className="space-y-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold truncate">{selectedImg.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedImg.previewUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(selectedImg.previewUrl);
                      }
                      setImageOverlays((prev) => prev.filter((im) => im.id !== selectedImg.id));
                      setSelectedOverlayId(null);
                    }}
                    className="text-xs text-red-600 hover:underline inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Opacity: {Math.round(selectedImg.opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={selectedImg.opacity}
                    onChange={(e) =>
                      setImageOverlays((prev) =>
                        prev.map((im) =>
                          im.id === selectedImg.id ? { ...im, opacity: Number(e.target.value) } : im
                        )
                      )
                    }
                    className="w-full"
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isUrdu
                ? 'شامل کردہ تصویر کو پی ڈی ایف صفحے پر ڈریگ کر کے کہیں بھی رکھیں اور کونے سے سائز تبدیل کریں۔'
                : 'Drag uploaded images anywhere on the preview canvas and pull the bottom-right corner handle to resize.'}
            </p>
          </div>
        )}

        {/* Tab 3: Watermark */}
        {activeTab === 'watermark' && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {isUrdu ? 'واٹر مارک فعال کریں' : 'Enable Watermark'}
              </span>
              <input
                type="checkbox"
                checked={watermark.enabled}
                onChange={(e) => setWatermark({ ...watermark, enabled: e.target.checked })}
                className="w-4 h-4"
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWatermark({ ...watermark, type: 'text', enabled: true })}
                className={`py-2 rounded-lg text-xs font-semibold border ${
                  watermark.type === 'text'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Text Watermark
              </button>
              <button
                type="button"
                onClick={() => setWatermark({ ...watermark, type: 'image', enabled: true })}
                className={`py-2 rounded-lg text-xs font-semibold border ${
                  watermark.type === 'image'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Image Watermark
              </button>
            </div>

            {watermark.type === 'text' ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={watermark.text}
                  onChange={(e) => setWatermark({ ...watermark, text: e.target.value })}
                  placeholder="CONFIDENTIAL"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Size</label>
                    <input
                      type="number"
                      min={12}
                      max={120}
                      value={watermark.fontSize}
                      onChange={(e) => setWatermark({ ...watermark, fontSize: Number(e.target.value) || 40 })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Angle (°)</label>
                    <input
                      type="number"
                      min={-90}
                      max={90}
                      value={watermark.rotation}
                      onChange={(e) => setWatermark({ ...watermark, rotation: Number(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Color</label>
                    <input
                      type="color"
                      value={watermark.color}
                      onChange={(e) => setWatermark({ ...watermark, color: e.target.value })}
                      className="w-full h-8 rounded-lg border border-slate-300 dark:border-slate-700 p-0.5"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <input
                  ref={wmImgInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={handleUploadWatermarkImage}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => wmImgInputRef.current?.click()}
                  className="w-full py-2.5 rounded-lg border border-dashed border-blue-400 text-xs font-semibold text-blue-700 dark:text-blue-300"
                >
                  {watermark.imageBytes ? 'Replace Watermark Logo' : 'Select Watermark Image'}
                </button>
              </div>
            )}

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Opacity: {Math.round(watermark.opacity * 100)}%
              </label>
              <input
                type="range"
                min={0.05}
                max={0.9}
                step={0.05}
                value={watermark.opacity}
                onChange={(e) => setWatermark({ ...watermark, opacity: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Tab 4: Page Numbers */}
        {activeTab === 'numbers' && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {isUrdu ? 'صفحہ نمبر فعال کریں' : 'Enable Page Numbering'}
              </span>
              <input
                type="checkbox"
                checked={pageNumbers.enabled}
                onChange={(e) => setPageNumbers({ ...pageNumbers, enabled: e.target.checked })}
                className="w-4 h-4"
              />
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Format</label>
                <select
                  value={pageNumbers.format}
                  onChange={(e) =>
                    setPageNumbers({
                      ...pageNumbers,
                      format: e.target.value as PdfPageNumberConfig['format'],
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs"
                >
                  <option value="number-only">1, 2, 3...</option>
                  <option value="page-x-of-n">Page 1 of N</option>
                  <option value="x-slash-n">1 / N</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Position</label>
                <select
                  value={pageNumbers.position}
                  onChange={(e) =>
                    setPageNumbers({
                      ...pageNumbers,
                      position: e.target.value as PdfPageNumberConfig['position'],
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs"
                >
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="top-center">Top Center</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Start From</label>
                <input
                  type="number"
                  min={1}
                  value={pageNumbers.startFrom}
                  onChange={(e) =>
                    setPageNumbers({ ...pageNumbers, startFrom: Math.max(1, Number(e.target.value) || 1) })
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Font Size</label>
                <input
                  type="number"
                  min={8}
                  max={24}
                  value={pageNumbers.fontSize}
                  onChange={(e) =>
                    setPageNumbers({ ...pageNumbers, fontSize: Math.max(8, Number(e.target.value) || 11) })
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Headers & Footers */}
        {activeTab === 'headers' && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-4 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {isUrdu ? 'ہیڈر اور فوٹر فعال کریں' : 'Enable Headers & Footers'}
              </span>
              <input
                type="checkbox"
                checked={headerFooter.enabled}
                onChange={(e) => setHeaderFooter({ ...headerFooter, enabled: e.target.checked })}
                className="w-4 h-4"
              />
            </label>
            <p className="text-[11px] text-slate-500">
              Tokens supported: <code className="font-mono">{'{page}'}</code>,{' '}
              <code className="font-mono">{'{total}'}</code>, <code className="font-mono">{'{date}'}</code>
            </p>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Header Left"
                value={headerFooter.headerLeft}
                onChange={(e) => setHeaderFooter({ ...headerFooter, headerLeft: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
              />
              <input
                type="text"
                placeholder="Header Center"
                value={headerFooter.headerCenter}
                onChange={(e) => setHeaderFooter({ ...headerFooter, headerCenter: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
              />
              <input
                type="text"
                placeholder="Header Right"
                value={headerFooter.headerRight}
                onChange={(e) => setHeaderFooter({ ...headerFooter, headerRight: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
              />
              <input
                type="text"
                placeholder="Footer Left"
                value={headerFooter.footerLeft}
                onChange={(e) => setHeaderFooter({ ...headerFooter, footerLeft: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
              />
              <input
                type="text"
                placeholder="Footer Center"
                value={headerFooter.footerCenter}
                onChange={(e) => setHeaderFooter({ ...headerFooter, footerCenter: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
              />
              <input
                type="text"
                placeholder="Footer Right"
                value={headerFooter.footerRight}
                onChange={(e) => setHeaderFooter({ ...headerFooter, footerRight: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={headerFooter.showDividerLine}
                  onChange={(e) => setHeaderFooter({ ...headerFooter, showDividerLine: e.target.checked })}
                />
                Divider lines
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={headerFooter.skipFirstPage}
                  onChange={(e) => setHeaderFooter({ ...headerFooter, skipFirstPage: e.target.checked })}
                />
                Skip page 1
              </label>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSavePdf}
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 text-sm font-bold shadow-sm transition-colors min-h-[46px] disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {saving
            ? isUrdu
              ? 'پی ڈی ایف محفوظ ہو رہی ہے...'
              : 'Applying Edits & Building PDF...'
            : isUrdu
            ? 'تبدیلیاں محفوظ کریں اور پی ڈی ایف بنائیں'
            : 'Apply Edits & Generate PDF'}
        </button>
      </div>

      {/* Right Live Canvas Preview Column */}
      <div className="lg:col-span-7 space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 px-3.5 py-2.5">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
            {isUrdu
              ? `لائیو پیش نظارہ — صفحہ ${currentPage} از ${totalPages}`
              : `Live Interactive Canvas — Page ${currentPage} of ${totalPages}`}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Stage */}
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-200/70 dark:bg-slate-950 p-3 sm:p-5 flex items-center justify-center overflow-hidden">
          <div
            ref={canvasStageRef}
            onClick={() => setSelectedOverlayId(null)}
            style={{ aspectRatio: String(pageAspectRatio) }}
            className="relative w-full max-w-[560px] bg-white shadow-lg rounded overflow-hidden select-none"
          >
            {pagePreviewUrl && (
              <img
                src={pagePreviewUrl}
                alt={`PDF page ${currentPage}`}
                className="w-full h-full object-contain pointer-events-none"
              />
            )}

            {renderingPage && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            )}

            {/* Live Header/Footer Overlay Preview */}
            {headerFooter.enabled && !(headerFooter.skipFirstPage && currentPage === 1) && (
              <>
                <div
                  style={{ color: headerFooter.color }}
                  className="pointer-events-none absolute top-2 inset-x-4 flex items-center justify-between text-[10px] font-medium"
                >
                  <span>{replacePreviewTokens(headerFooter.headerLeft)}</span>
                  <span>{replacePreviewTokens(headerFooter.headerCenter)}</span>
                  <span>{replacePreviewTokens(headerFooter.headerRight)}</span>
                </div>
                <div
                  style={{ color: headerFooter.color }}
                  className="pointer-events-none absolute bottom-2 inset-x-4 flex items-center justify-between text-[10px] font-medium"
                >
                  <span>{replacePreviewTokens(headerFooter.footerLeft)}</span>
                  <span>{replacePreviewTokens(headerFooter.footerCenter)}</span>
                  <span>{replacePreviewTokens(headerFooter.footerRight)}</span>
                </div>
              </>
            )}

            {/* Live Page Number Preview */}
            {pageNumbers.enabled && (
              <div
                style={{ color: pageNumbers.color }}
                className={`pointer-events-none absolute px-4 text-[11px] font-semibold ${
                  pageNumbers.position.startsWith('top') ? 'top-2.5' : 'bottom-2.5'
                } ${
                  pageNumbers.position.endsWith('left')
                    ? 'left-0'
                    : pageNumbers.position.endsWith('right')
                    ? 'right-0'
                    : 'inset-x-0 text-center'
                }`}
              >
                {pageNumberPreviewLabel}
              </div>
            )}

            {/* Live Watermark Preview */}
            {watermark.enabled && watermark.type === 'text' && watermark.text.trim() && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                <span
                  style={{
                    color: watermark.color,
                    opacity: watermark.opacity,
                    transform: `rotate(${watermark.rotation}deg)`,
                    fontSize: `${Math.max(14, watermark.fontSize * 0.65)}px`,
                  }}
                  className="font-extrabold tracking-wider whitespace-nowrap"
                >
                  {watermark.text}
                </span>
              </div>
            )}

            {/* Draggable Image Overlays */}
            {imageOverlays
              .filter((ov) => ov.page === currentPage)
              .map((ov) => {
                const isSelected = selectedOverlayId === ov.id;
                return (
                  <div
                    key={ov.id}
                    onPointerDown={(e) => startPointerDrag(e, 'image', ov.id, 'move')}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOverlayId(ov.id);
                    }}
                    style={{
                      left: `${ov.xPercent}%`,
                      top: `${ov.yPercent}%`,
                      width: `${ov.widthPercent}%`,
                      height: `${ov.heightPercent}%`,
                      opacity: ov.opacity,
                    }}
                    className={`absolute cursor-move ${
                      isSelected ? 'ring-2 ring-blue-600' : 'hover:ring-1 hover:ring-blue-400'
                    }`}
                  >
                    <img
                      src={ov.previewUrl}
                      alt={ov.name}
                      className="w-full h-full object-fill pointer-events-none"
                    />
                    {isSelected && (
                      <div
                        onPointerDown={(e) => startPointerDrag(e, 'image', ov.id, 'resize')}
                        title="Drag to resize"
                        className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white cursor-nwse-resize"
                      />
                    )}
                  </div>
                );
              })}

            {/* Draggable Text Overlays */}
            {textOverlays
              .filter((ov) => ov.page === currentPage)
              .map((ov) => {
                const isSelected = selectedOverlayId === ov.id;
                return (
                  <div
                    key={ov.id}
                    onPointerDown={(e) => startPointerDrag(e, 'text', ov.id, 'move')}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOverlayId(ov.id);
                    }}
                    style={{
                      left: `${ov.xPercent}%`,
                      top: `${ov.yPercent}%`,
                      width: `${ov.widthPercent}%`,
                      color: ov.color,
                      fontSize: `${Math.max(9, ov.fontSize * 0.72)}px`,
                      fontWeight: ov.bold ? 700 : 400,
                      opacity: ov.opacity,
                    }}
                    className={`absolute cursor-move px-1.5 py-0.5 rounded whitespace-pre-wrap leading-snug ${
                      isSelected
                        ? 'ring-2 ring-blue-600 bg-blue-50/40'
                        : 'ring-1 ring-dashed ring-slate-300 hover:ring-blue-400'
                    }`}
                  >
                    {ov.text || ' '}
                    {isSelected && (
                      <div
                        onPointerDown={(e) => startPointerDrag(e, 'text', ov.id, 'resize')}
                        title="Drag to resize width"
                        className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white cursor-ew-resize"
                      />
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
