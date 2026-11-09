import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Columns,
  Layers,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Download,
  Trash2,
  Plus,
  CheckCircle,
  AlertCircle,
  Archive,
  ChevronLeft,
  ChevronRight,
  MoveHorizontal,
  Info,
  Sparkles,
  Sliders,
  FileCheck
} from 'lucide-react';

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  originalDimensions: { width: number; height: number };
  originalUrl: string;
  compressedBlob: Blob | null;
  compressedUrl: string | null;
  compressedSize: number;
  compressedDimensions: { width: number; height: number };
  quality: number;
  maxDimension: number;
  outputFormat: 'image/jpeg' | 'image/webp';
  status: 'idle' | 'processing' | 'done' | 'error';
  error?: string;
}

interface ComparisonGalleryProps {
  images: ImageItem[];
  activeId: string;
  onSelectImage: (id: string) => void;
  onRemoveImage: (id: string) => void;
  onAddMoreFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadSingle: (item: ImageItem) => void;
  onDownloadAllZip: () => void;
  isZipping?: boolean;
  formatFileSize: (bytes: number) => string;
}

type ComparisonMode = 'side-by-side' | 'split-slider' | 'toggle';

export const ComparisonGallery: React.FC<ComparisonGalleryProps> = ({
  images,
  activeId,
  onSelectImage,
  onRemoveImage,
  onAddMoreFiles,
  onDownloadSingle,
  onDownloadAllZip,
  isZipping = false,
  formatFileSize,
}) => {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('split-slider');
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 to 100%
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const [isHoldingOriginal, setIsHoldingOriginal] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = fit, 1.5, 2, 3
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const addFilesInputRef = useRef<HTMLInputElement>(null);

  const currentItem = images.find((img) => img.id === activeId) || images[0];

  // Calculate reduction metrics
  const reductionPercentage =
    currentItem && currentItem.compressedSize > 0 && currentItem.originalSize > 0
      ? Math.max(0, Math.round(((currentItem.originalSize - currentItem.compressedSize) / currentItem.originalSize) * 100))
      : 0;

  const totalOriginalSize = images.reduce((acc, curr) => acc + curr.originalSize, 0);
  const totalCompressedSize = images.reduce(
    (acc, curr) => acc + (curr.compressedSize > 0 ? curr.compressedSize : curr.originalSize),
    0
  );
  const totalReductionPct =
    totalOriginalSize > 0
      ? Math.max(0, Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100))
      : 0;

  // Handle slider drag calculation
  const handleSliderMove = useCallback(
    (clientX: number) => {
      if (!sliderContainerRef.current) return;
      const rect = sliderContainerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(pct);
    },
    []
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSlider) return;
      handleSliderMove(e.clientX);
    };

    const handleMouseUp = () => {
      if (isDraggingSlider) {
        setIsDraggingSlider(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingSlider || !e.touches[0]) return;
      handleSliderMove(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
      if (isDraggingSlider) {
        setIsDraggingSlider(false);
      }
    };

    if (isDraggingSlider) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingSlider, handleSliderMove]);

  // Keyboard shortcut listener (Space to toggle compare, Escape to exit fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
      if (e.code === 'Space' && comparisonMode === 'toggle' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setIsHoldingOriginal(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && comparisonMode === 'toggle') {
        setIsHoldingOriginal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isFullscreen, comparisonMode]);

  // Navigate gallery previous / next
  const currentIndex = images.findIndex((img) => img.id === activeId);
  const handlePrevImage = () => {
    if (currentIndex > 0) {
      onSelectImage(images[currentIndex - 1].id);
    } else if (images.length > 1) {
      onSelectImage(images[images.length - 1].id);
    }
  };

  const handleNextImage = () => {
    if (currentIndex < images.length - 1) {
      onSelectImage(images[currentIndex + 1].id);
    } else if (images.length > 1) {
      onSelectImage(images[0].id);
    }
  };

  if (!currentItem) return null;

  const comparisonViewerContent = (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
        {/* Comparison Mode Tabs */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setComparisonMode('split-slider')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              comparisonMode === 'split-slider'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Draggable Before/After divider line"
          >
            <MoveHorizontal className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'اسپلٹ سلائیڈر' : 'Split Slider'}</span>
          </button>

          <button
            type="button"
            onClick={() => setComparisonMode('side-by-side')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              comparisonMode === 'side-by-side'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="View original and compressed side by side"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'سائیڈ بائی سائیڈ' : 'Side-by-Side'}</span>
          </button>

          <button
            type="button"
            onClick={() => setComparisonMode('toggle')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              comparisonMode === 'toggle'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Click or hold to view original vs compressed"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'ٹوگل / ہولڈ' : 'Hold to Compare'}</span>
          </button>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Level Indicator & Controls */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(1, Number((z - 0.5).toFixed(1))))}
              disabled={zoomLevel <= 1}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-40"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] font-bold px-1 min-w-[42px] text-center text-slate-700 dark:text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(3, Number((z + 0.5).toFixed(1))))}
              disabled={zoomLevel >= 3}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-40"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoomLevel > 1 && (
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline ml-1 font-medium"
              >
                Fit
              </button>
            )}
          </div>

          {/* Fullscreen Modal Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Inspection Gallery'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Comparison Viewport */}
      <div className="relative w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900/90 overflow-hidden flex items-center justify-center min-h-[380px] sm:min-h-[440px] max-h-[640px]">
        {/* Processing Indicator */}
        {currentItem.status === 'processing' && (
          <div className="absolute inset-0 z-40 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3">
            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold tracking-wide">
              {isUrdu ? 'براؤزر میں کمپریس ہو رہا ہے...' : 'Compressing locally in-browser...'}
            </p>
          </div>
        )}

        {/* MODE 1: SPLIT SLIDER VIEW */}
        {comparisonMode === 'split-slider' && (
          <div
            ref={sliderContainerRef}
            className="relative w-full h-full flex items-center justify-center select-none overflow-hidden cursor-ew-resize py-4 px-2"
            onMouseDown={(e) => {
              setIsDraggingSlider(true);
              handleSliderMove(e.clientX);
            }}
            onTouchStart={(e) => {
              if (e.touches[0]) {
                setIsDraggingSlider(true);
                handleSliderMove(e.touches[0].clientX);
              }
            }}
          >
            {/* Inner scaled container */}
            <div
              className="relative max-w-full max-h-[580px] flex items-center justify-center transition-transform duration-100"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Bottom Layer: Compressed Image */}
              {currentItem.compressedUrl ? (
                <img
                  src={currentItem.compressedUrl}
                  alt="Compressed version"
                  className="max-h-[540px] w-auto max-w-full object-contain pointer-events-none rounded shadow-md"
                />
              ) : (
                <img
                  src={currentItem.originalUrl}
                  alt="Original placeholder"
                  className="max-h-[540px] w-auto max-w-full object-contain pointer-events-none rounded shadow-md"
                />
              )}

              {/* Top Layer: Original Image clipped to sliderPosition */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-start"
                style={{
                  clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                }}
              >
                <img
                  src={currentItem.originalUrl}
                  alt="Original version"
                  className="max-h-[540px] w-auto max-w-full object-contain rounded"
                />
              </div>

              {/* Draggable Divider Line & Handle */}
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="w-0.5 h-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] -ml-[1px]" />
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-emerald-600 text-white shadow-lg border-2 border-white flex items-center justify-center cursor-ew-resize">
                  <MoveHorizontal className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Overlaid Badges */}
            <div className="absolute top-3 left-3 z-30 pointer-events-none">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-900/80 text-white backdrop-blur-md border border-slate-700/60 shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>{isUrdu ? 'اصل (بائیں)' : 'Original (Left)'}</span>
                <span className="font-mono text-slate-300 font-normal">
                  ({formatFileSize(currentItem.originalSize)})
                </span>
              </span>
            </div>

            <div className="absolute top-3 right-3 z-30 pointer-events-none">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-950/80 text-emerald-300 backdrop-blur-md border border-emerald-700/60 shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{isUrdu ? 'کمپریسڈ (دائیں)' : 'Compressed (Right)'}</span>
                <span className="font-mono text-emerald-200 font-normal">
                  ({formatFileSize(currentItem.compressedSize)})
                </span>
                {reductionPercentage > 0 && (
                  <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                    -{reductionPercentage}%
                  </span>
                )}
              </span>
            </div>

            {/* Hint bar at bottom */}
            <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none z-30">
              <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-slate-950/70 text-slate-300 backdrop-blur-md border border-slate-800 shadow-xs">
                {isUrdu ? '👈 بار کو دائیں بائیں گھما کر موازنہ کریں 👉' : '👈 Drag divider line left & right to compare details 👉'}
              </span>
            </div>
          </div>
        )}

        {/* MODE 2: SIDE-BY-SIDE DUAL VIEW */}
        {comparisonMode === 'side-by-side' && (
          <div className="w-full h-full p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Original Box */}
            <div className="flex flex-col h-full bg-slate-950/50 rounded-xl border border-slate-800 p-3 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-xs font-bold text-white tracking-wide uppercase">
                    {isUrdu ? 'اصل تصویر' : 'Original Image'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                  <span>{currentItem.originalDimensions.width}×{currentItem.originalDimensions.height}</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-bold text-amber-300">{formatFileSize(currentItem.originalSize)}</span>
                </div>
              </div>
              <div className="relative flex-1 min-h-[260px] max-h-[460px] flex items-center justify-center overflow-hidden bg-slate-950 rounded-lg p-2">
                <div
                  className="flex items-center justify-center transition-transform duration-100"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <img
                    src={currentItem.originalUrl}
                    alt="Original Preview"
                    className="max-h-[420px] w-auto max-w-full object-contain rounded"
                  />
                </div>
              </div>
            </div>

            {/* Compressed Box */}
            <div className="flex flex-col h-full bg-slate-950/50 rounded-xl border border-emerald-900/60 p-3 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400 tracking-wide uppercase">
                    {isUrdu ? 'کمپریسڈ آؤٹ پٹ' : 'Compressed Output'}
                  </span>
                  {reductionPercentage > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      -{reductionPercentage}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                  <span>{currentItem.compressedDimensions.width}×{currentItem.compressedDimensions.height}</span>
                  <span className="text-slate-600">•</span>
                  <span className="font-bold text-emerald-400">{formatFileSize(currentItem.compressedSize)}</span>
                </div>
              </div>
              <div className="relative flex-1 min-h-[260px] max-h-[460px] flex items-center justify-center overflow-hidden bg-slate-950 rounded-lg p-2">
                <div
                  className="flex items-center justify-center transition-transform duration-100"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  {currentItem.compressedUrl ? (
                    <img
                      src={currentItem.compressedUrl}
                      alt="Compressed Preview"
                      className="max-h-[420px] w-auto max-w-full object-contain rounded"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: HOLD TO COMPARE / FLICKER VIEW */}
        {comparisonMode === 'toggle' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
            <div className="relative max-w-full max-h-[500px] flex items-center justify-center">
              <div
                className="flex items-center justify-center transition-transform duration-100"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <img
                  src={isHoldingOriginal ? currentItem.originalUrl : currentItem.compressedUrl || currentItem.originalUrl}
                  alt={isHoldingOriginal ? 'Original' : 'Compressed'}
                  className="max-h-[480px] w-auto max-w-full object-contain rounded shadow-lg"
                />
              </div>
            </div>

            {/* Active view badge */}
            <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-md transition-all ${
                  isHoldingOriginal
                    ? 'bg-amber-500/90 text-white border border-amber-300/40'
                    : 'bg-emerald-600/90 text-white border border-emerald-300/40'
                }`}
              >
                {isHoldingOriginal
                  ? `${isUrdu ? 'دیکھ رہے ہیں: اصل تصویر' : 'VIEWING: ORIGINAL'} (${formatFileSize(currentItem.originalSize)})`
                  : `${isUrdu ? 'دیکھ رہے ہیں: کمپریسڈ آؤٹ پٹ' : 'VIEWING: COMPRESSED'} (${formatFileSize(currentItem.compressedSize)})`}
              </span>
            </div>

            {/* Interactive Press and Hold Bar */}
            <div className="absolute bottom-4 inset-x-0 flex flex-col items-center gap-2">
              <button
                type="button"
                onMouseDown={() => setIsHoldingOriginal(true)}
                onMouseUp={() => setIsHoldingOriginal(false)}
                onTouchStart={() => setIsHoldingOriginal(true)}
                onTouchEnd={() => setIsHoldingOriginal(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-slate-800 hover:bg-slate-700 active:bg-amber-600 border border-slate-700 shadow-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>{isUrdu ? 'دبا کر رکھیں: اصل تصویر دیکھیں' : 'Click & Hold to View Original (Or hold Space)'}</span>
              </button>
              <span className="text-[11px] text-slate-400">
                {isUrdu ? 'چھوڑنے پر واپس کمپریسڈ رزلٹ نظر آئے گا' : 'Release mouse or key to return to compressed preview'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {isUrdu ? 'اصل سائز' : 'Original Size'}
          </span>
          <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-200">
            {formatFileSize(currentItem.originalSize)}
          </span>
          <span className="text-[11px] text-slate-400 block font-mono">
            {currentItem.originalDimensions.width} × {currentItem.originalDimensions.height} px
          </span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            {isUrdu ? 'کمپریسڈ سائز' : 'Compressed Size'}
          </span>
          <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatFileSize(currentItem.compressedSize)}
          </span>
          <span className="text-[11px] text-slate-400 block font-mono">
            {currentItem.compressedDimensions.width} × {currentItem.compressedDimensions.height} px
          </span>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            {isUrdu ? 'بچت کی شرح' : 'Reduction'}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
              -{reductionPercentage}%
            </span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              ({formatFileSize(Math.max(0, currentItem.originalSize - currentItem.compressedSize))} {isUrdu ? 'بچت' : 'saved'})
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            Format: {currentItem.outputFormat === 'image/webp' ? 'WebP' : 'JPEG'}
          </span>
        </div>

        <div className="flex items-center justify-end sm:justify-end gap-2">
          <button
            type="button"
            onClick={() => onDownloadSingle(currentItem)}
            disabled={!currentItem.compressedUrl || currentItem.status === 'processing'}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isUrdu ? 'ڈاؤن لوڈ کریں' : 'Download Image'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* GALLERY THUMBNAIL STRIP */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        {/* Strip Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {isUrdu ? 'امیج گیلری اور بیچ فہرست' : 'Image Preview Gallery'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                {images.length} {images.length === 1 ? 'image' : 'images'}
              </span>
            </div>

            {images.length > 1 && totalReductionPct > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-mono">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>
                  {isUrdu ? 'کل بچت:' : 'Total saved:'} -{totalReductionPct}% ({formatFileSize(Math.max(0, totalOriginalSize - totalCompressedSize))})
                </span>
              </span>
            )}
          </div>

          {/* Action buttons on the right */}
          <div className="flex items-center gap-2">
            {/* Add More Images Button */}
            <input
              ref={addFilesInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              onChange={onAddMoreFiles}
              className="hidden"
              id="gallery-add-more-input"
            />
            <button
              type="button"
              onClick={() => addFilesInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'مزید تصاویر شامل کریں' : 'Add Images'}</span>
            </button>

            {/* Batch Download ZIP Button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={onDownloadAllZip}
                disabled={isZipping}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs disabled:opacity-50"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>
                  {isZipping
                    ? (isUrdu ? 'زپ تیار ہو رہی ہے...' : 'Creating ZIP...')
                    : (isUrdu ? 'تمام ڈاؤن لوڈ زپ' : 'Download All (.ZIP)')}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Thumbnails Carousel */}
        <div className="relative">
          {images.length > 3 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900"
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 px-1 scrollbar-thin">
            {images.map((item, idx) => {
              const isActive = item.id === activeId;
              const itemReduction =
                item.compressedSize > 0 && item.originalSize > 0
                  ? Math.max(0, Math.round(((item.originalSize - item.compressedSize) / item.originalSize) * 100))
                  : 0;

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectImage(item.id)}
                  className={`group relative flex-shrink-0 w-44 rounded-xl border p-2 cursor-pointer transition-all ${
                    isActive
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Thumbnail Frame */}
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center border border-slate-200/60 dark:border-slate-800/60">
                    <img
                      src={item.compressedUrl || item.originalUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Savings pill badge */}
                    {itemReduction > 0 && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-600 text-white shadow-xs">
                        -{itemReduction}%
                      </span>
                    )}

                    {/* Delete button */}
                    {images.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveImage(item.id);
                        }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-slate-900/70 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image from gallery"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Thumbnail Info */}
                  <div className="mt-2 space-y-0.5">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate" title={item.name}>
                      {item.name}
                    </p>
                    <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-500 dark:text-slate-400">
                      <span>{formatFileSize(item.originalSize)}</span>
                      <span>→</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {item.compressedSize > 0 ? formatFileSize(item.compressedSize) : '...'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ACTIVE COMPARISON GALLERY VIEW */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        {/* Header of viewer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
              {currentItem.name}
            </span>
            <span className="text-xs text-slate-400">
              ({currentIndex + 1} of {images.length})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevImage}
              disabled={images.length <= 1}
              aria-label="Previous image"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
              title="Previous Image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              disabled={images.length <= 1}
              aria-label="Next image"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
              title="Next Image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Comparison Viewer */}
        {comparisonViewerContent}
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4 sm:p-6 text-white overflow-hidden animate-in fade-in duration-200">
          {/* Fullscreen header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-base font-bold truncate max-w-md">
                {currentItem.name}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                -{reductionPercentage}% Reduced
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onDownloadSingle(currentItem)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close Fullscreen (Esc)"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen comparison body */}
          <div className="flex-1 overflow-hidden">
            {comparisonViewerContent}
          </div>
        </div>
      )}
    </div>
  );
};
