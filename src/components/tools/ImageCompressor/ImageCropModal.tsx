import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Crop,
  RotateCcw,
  Check,
  X,
  Maximize2,
  Sliders,
  Move,
  Info,
} from 'lucide-react';
import { CompressedImageItem } from './ImageCompressorTool';

export type AspectRatioOption = 'free' | '1:1' | '16:9' | '4:3' | '3:2' | '9:16';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
  aspect?: AspectRatioOption;
}

interface ImageCropModalProps {
  isOpen: boolean;
  item: CompressedImageItem | null;
  onClose: () => void;
  onApplyCrop: (itemId: string, cropRect: CropRect) => void;
  onResetCrop: (itemId: string) => void;
}

const ASPECT_RATIOS: { id: AspectRatioOption; label: string; ratio: number | null; desc: string }[] = [
  { id: 'free', label: 'Free-hand', ratio: null, desc: 'Custom unconstrained crop' },
  { id: '1:1', label: '1:1 Square', ratio: 1, desc: 'Profile photo, Instagram post' },
  { id: '16:9', label: '16:9 Landscape', ratio: 16 / 9, desc: 'YouTube banner, desktop wallpaper' },
  { id: '4:3', label: '4:3 Standard', ratio: 4 / 3, desc: 'Digital camera classic photo' },
  { id: '3:2', label: '3:2 DSLR', ratio: 3 / 2, desc: '35mm DSLR photography' },
  { id: '9:16', label: '9:16 Vertical', ratio: 9 / 16, desc: 'Stories, Reels, TikTok' },
];

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  item,
  onClose,
  onApplyCrop,
  onResetCrop,
}) => {
  const [aspect, setAspect] = useState<AspectRatioOption>('free');
  const [box, setBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragAction, setDragAction] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startDragPos = useRef<{ mouseX: number; mouseY: number; box: { x: number; y: number; width: number; height: number } }>({
    mouseX: 0,
    mouseY: 0,
    box: { x: 0, y: 0, width: 0, height: 0 },
  });

  // Calculate default centered crop box based on aspect ratio
  const calculateInitialBox = useCallback(
    (cWidth: number, cHeight: number, targetAspect: AspectRatioOption, existingCrop?: CropRect | null, natW?: number, natH?: number) => {
      if (cWidth <= 0 || cHeight <= 0) return { x: 0, y: 0, width: cWidth, height: cHeight };

      // If item already has a crop, convert natural crop to displayed crop box
      if (existingCrop && natW && natH && natW > 0 && natH > 0) {
        const scaleX = cWidth / natW;
        const scaleY = cHeight / natH;
        return {
          x: Math.round(existingCrop.x * scaleX),
          y: Math.round(existingCrop.y * scaleY),
          width: Math.round(existingCrop.width * scaleX),
          height: Math.round(existingCrop.height * scaleY),
        };
      }

      const ratioConfig = ASPECT_RATIOS.find((a) => a.id === targetAspect);
      if (!ratioConfig || ratioConfig.ratio === null) {
        // Free: default to 85% centered box
        const padX = cWidth * 0.075;
        const padY = cHeight * 0.075;
        return {
          x: Math.round(padX),
          y: Math.round(padY),
          width: Math.round(cWidth - padX * 2),
          height: Math.round(cHeight - padY * 2),
        };
      }

      const r = ratioConfig.ratio;
      let w = cWidth * 0.85;
      let h = w / r;

      if (h > cHeight * 0.85) {
        h = cHeight * 0.85;
        w = h * r;
      }

      return {
        x: Math.round((cWidth - w) / 2),
        y: Math.round((cHeight - h) / 2),
        width: Math.round(w),
        height: Math.round(h),
      };
    },
    []
  );

  // Initialize crop coordinates on image load
  const handleImageLoad = () => {
    if (!imgRef.current) return;
    const nw = imgRef.current.naturalWidth;
    const nh = imgRef.current.naturalHeight;
    const cw = imgRef.current.clientWidth;
    const ch = imgRef.current.clientHeight;

    setNaturalSize({ width: nw, height: nh });
    setContainerSize({ width: cw, height: ch });

    const initialAspect = item?.cropRect?.aspect || 'free';
    setAspect(initialAspect);
    const initialBox = calculateInitialBox(cw, ch, initialAspect, item?.cropRect, nw, nh);
    setBox(initialBox);
  };

  // Change aspect ratio
  const handleSelectAspect = (newAspect: AspectRatioOption) => {
    setAspect(newAspect);
    if (containerSize.width > 0 && containerSize.height > 0) {
      const newBox = calculateInitialBox(containerSize.width, containerSize.height, newAspect);
      setBox(newBox);
    }
  };

  // Start dragging handles or center
  const startDrag = (e: React.MouseEvent | React.TouchEvent, action: string) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setIsDragging(true);
    setDragAction(action);
    startDragPos.current = {
      mouseX: clientX,
      mouseY: clientY,
      box: { ...box },
    };
  };

  // Dragging movement logic
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !dragAction) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const dx = clientX - startDragPos.current.mouseX;
      const dy = clientY - startDragPos.current.mouseY;
      const orig = startDragPos.current.box;
      const cw = containerSize.width;
      const ch = containerSize.height;

      const targetRatio = ASPECT_RATIOS.find((a) => a.id === aspect)?.ratio || null;
      let newBox = { ...orig };

      if (dragAction === 'move') {
        const nx = Math.max(0, Math.min(cw - orig.width, orig.x + dx));
        const ny = Math.max(0, Math.min(ch - orig.height, orig.y + dy));
        newBox.x = nx;
        newBox.y = ny;
      } else {
        // Resizing
        let nw = orig.width;
        let nh = orig.height;
        let nx = orig.x;
        let ny = orig.y;

        // Handle edge & corner adjustments
        if (dragAction.includes('e')) {
          nw = Math.max(20, Math.min(cw - orig.x, orig.width + dx));
        }
        if (dragAction.includes('s')) {
          nh = Math.max(20, Math.min(ch - orig.y, orig.height + dy));
        }
        if (dragAction.includes('w')) {
          const maxLeftShift = orig.width - 20;
          const shift = Math.max(-orig.x, Math.min(maxLeftShift, dx));
          nx = orig.x + shift;
          nw = orig.width - shift;
        }
        if (dragAction.includes('n')) {
          const maxTopShift = orig.height - 20;
          const shift = Math.max(-orig.y, Math.min(maxTopShift, dy));
          ny = orig.y + shift;
          nh = orig.height - shift;
        }

        // Lock to aspect ratio if not free
        if (targetRatio !== null) {
          if (dragAction === 'e' || dragAction === 'w' || dragAction === 'se' || dragAction === 'sw') {
            nh = nw / targetRatio;
            if (ny + nh > ch) {
              nh = ch - ny;
              nw = nh * targetRatio;
            }
          } else {
            nw = nh * targetRatio;
            if (nx + nw > cw) {
              nw = cw - nx;
              nh = nw / targetRatio;
            }
          }
        }

        newBox = {
          x: Math.max(0, Math.min(cw - 20, nx)),
          y: Math.max(0, Math.min(ch - 20, ny)),
          width: Math.max(20, Math.min(cw - nx, nw)),
          height: Math.max(20, Math.min(ch - ny, nh)),
        };
      }

      setBox(newBox);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      setDragAction(null);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging, dragAction, aspect, containerSize]);

  if (!isOpen || !item) return null;

  // Compute natural crop pixel values for live feedback
  const scaleX = containerSize.width > 0 ? naturalSize.width / containerSize.width : 1;
  const scaleY = containerSize.height > 0 ? naturalSize.height / containerSize.height : 1;

  const naturalCropX = Math.round(box.x * scaleX);
  const naturalCropY = Math.round(box.y * scaleY);
  const naturalCropWidth = Math.round(box.width * scaleX);
  const naturalCropHeight = Math.round(box.height * scaleY);

  const handleApply = () => {
    onApplyCrop(item.id, {
      x: naturalCropX,
      y: naturalCropY,
      width: naturalCropWidth,
      height: naturalCropHeight,
      aspect,
    });
    onClose();
  };

  const handleResetToFull = () => {
    onResetCrop(item.id);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-3 sm:p-5"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Crop Image</span>
                <span className="font-mono text-xs text-slate-500 font-normal truncate max-w-xs">
                  {item.name}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Choose an aspect ratio or drag the corners freely to define your crop area
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close crop dialog"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Aspect Ratio Presets Bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-medium text-[11px] mr-1">Aspect Ratio:</span>
            {ASPECT_RATIOS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectAspect(opt.id)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                  aspect === opt.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                }`}
                title={opt.desc}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Real-time Dimensions Badge */}
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400">Crop Output:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {naturalCropWidth} × {naturalCropHeight} px
            </span>
          </div>
        </div>

        {/* Cropping Canvas Body */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/90 relative min-h-[340px] max-h-[520px]">
          <div
            ref={containerRef}
            className="relative select-none inline-block shadow-2xl rounded-sm overflow-hidden"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          >
            {/* The Image */}
            <img
              ref={imgRef}
              src={item.originalPreviewUrl}
              alt="Crop Source"
              onLoad={handleImageLoad}
              className="max-h-[460px] max-w-full block object-contain pointer-events-none"
            />

            {/* Dark Mask Overlay Outside Crop Box */}
            {containerSize.width > 0 && containerSize.height > 0 && (
              <>
                {/* Top mask */}
                <div
                  className="absolute top-0 left-0 right-0 bg-black/60 pointer-events-none"
                  style={{ height: `${box.y}px` }}
                />
                {/* Bottom mask */}
                <div
                  className="absolute left-0 right-0 bottom-0 bg-black/60 pointer-events-none"
                  style={{ top: `${box.y + box.height}px` }}
                />
                {/* Left mask */}
                <div
                  className="absolute left-0 bg-black/60 pointer-events-none"
                  style={{
                    top: `${box.y}px`,
                    width: `${box.x}px`,
                    height: `${box.height}px`,
                  }}
                />
                {/* Right mask */}
                <div
                  className="absolute right-0 bg-black/60 pointer-events-none"
                  style={{
                    top: `${box.y}px`,
                    left: `${box.x + box.width}px`,
                    height: `${box.height}px`,
                  }}
                />

                {/* The Interactive Crop Box */}
                <div
                  className="absolute border-2 border-emerald-400 cursor-move shadow-md ring-1 ring-white/50"
                  style={{
                    left: `${box.x}px`,
                    top: `${box.y}px`,
                    width: `${box.width}px`,
                    height: `${box.height}px`,
                  }}
                  onMouseDown={(e) => startDrag(e, 'move')}
                  onTouchStart={(e) => startDrag(e, 'move')}
                >
                  {/* Rule-of-Thirds Grid Lines (3x3) */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-white" />
                    <div className="border-r border-white" />
                    <div />
                  </div>

                  {/* Corner Handles */}
                  <div
                    onMouseDown={(e) => startDrag(e, 'nw')}
                    onTouchStart={(e) => startDrag(e, 'nw')}
                    className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-emerald-400 border border-white rounded-xs cursor-nwse-resize shadow-xs"
                  />
                  <div
                    onMouseDown={(e) => startDrag(e, 'ne')}
                    onTouchStart={(e) => startDrag(e, 'ne')}
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-400 border border-white rounded-xs cursor-nesw-resize shadow-xs"
                  />
                  <div
                    onMouseDown={(e) => startDrag(e, 'sw')}
                    onTouchStart={(e) => startDrag(e, 'sw')}
                    className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-emerald-400 border border-white rounded-xs cursor-nesw-resize shadow-xs"
                  />
                  <div
                    onMouseDown={(e) => startDrag(e, 'se')}
                    onTouchStart={(e) => startDrag(e, 'se')}
                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-400 border border-white rounded-xs cursor-nwse-resize shadow-xs"
                  />

                  {/* Edge Handles */}
                  <div
                    onMouseDown={(e) => startDrag(e, 'n')}
                    onTouchStart={(e) => startDrag(e, 'n')}
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-emerald-400 border border-white rounded-xs cursor-ns-resize shadow-xs"
                  />
                  <div
                    onMouseDown={(e) => startDrag(e, 's')}
                    onTouchStart={(e) => startDrag(e, 's')}
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-emerald-400 border border-white rounded-xs cursor-ns-resize shadow-xs"
                  />
                  <div
                    onMouseDown={(e) => startDrag(e, 'w')}
                    onTouchStart={(e) => startDrag(e, 'w')}
                    className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-6 bg-emerald-400 border border-white rounded-xs cursor-ew-resize shadow-xs"
                  />
                  <div
                    onMouseDown={(e) => startDrag(e, 'e')}
                    onTouchStart={(e) => startDrag(e, 'e')}
                    className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-6 bg-emerald-400 border border-white rounded-xs cursor-ew-resize shadow-xs"
                  />

                  {/* Center Drag Icon Badge */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-900/70 text-white pointer-events-none backdrop-blur-xs">
                    <Move className="w-3.5 h-3.5" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {item.cropRect && (
              <button
                type="button"
                onClick={handleResetToFull}
                className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-900 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Revert to Full Image</span>
              </button>
            )}
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              Drag box or corners to adjust crop boundaries
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply Crop ({naturalCropWidth} × {naturalCropHeight})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
