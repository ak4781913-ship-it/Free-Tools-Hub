import React, { useState, useRef, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Minimize2,
  Upload,
  Download,
  RotateCcw,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  FileArchive,
  Trash2,
  Plus,
  Loader2,
  Check,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Eye,
  Grid,
  Columns,
  SlidersHorizontal,
  ZoomIn,
  Files,
  ArrowRightLeft,
  FileType,
  Crop,
  CheckSquare,
  Square,
  CheckCheck,
  Play,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Info,
  Tag,
  PenLine,
} from 'lucide-react';
import { ImageCropModal, CropRect, AspectRatioOption } from './ImageCropModal';
import {
  parseExifFromBlob,
  stripMetadataFromJpeg,
  extractExifSegmentsFromJpeg,
  injectExifSegmentsIntoJpeg,
  ParsedExifData,
} from './exifUtils';
import { ExifModal } from './ExifModal';
import { BulkRenameModal } from './BulkRenameModal';
import { emitCalculationSuccess } from '../../../utils/calculationToastNotifier';

export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp';
export type GlobalFormatChoice = ImageMimeType | 'original';

export interface CompressedImageItem {
  id: string;
  file: File;
  name: string;
  customName?: string;
  originalSize: number;
  originalMimeType: string;
  originalFormatLabel: string;
  originalPreviewUrl: string;
  naturalWidth?: number;
  naturalHeight?: number;
  cropRect?: CropRect | null;
  compressedBlob: Blob | null;
  compressedDataUrl: string | null;
  compressedSize: number;
  compressedWidth?: number;
  compressedHeight?: number;
  targetFormat: ImageMimeType;
  isProcessing: boolean;
  error?: string | null;
  exifData?: ParsedExifData | null;
}

export const getFormatLabel = (mimeOrType: string): string => {
  if (mimeOrType.includes('png')) return 'PNG';
  if (mimeOrType.includes('webp')) return 'WebP';
  if (mimeOrType.includes('avif')) return 'AVIF';
  if (mimeOrType.includes('jpeg') || mimeOrType.includes('jpg')) return 'JPEG';
  return 'JPG';
};

export const getExtensionForMime = (mime: ImageMimeType): string => {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/jpeg':
    default:
      return 'jpg';
  }
};

export const getEffectiveItemBaseName = (
  item: CompressedImageItem,
  prefix: string = '',
  suffix: string = ''
): string => {
  if (item.customName) {
    return item.customName;
  }
  const rawBase = item.name.replace(/\.[^/.]+$/, '');
  const p = prefix || '';
  const s = suffix || '';
  if (!p && !s) {
    return `compressed_${rawBase}`;
  }
  return `${p}${rawBase}${s}`;
};

export const getEffectiveItemFileName = (
  item: CompressedImageItem,
  prefix: string = '',
  suffix: string = ''
): string => {
  const ext = getExtensionForMime(item.targetFormat);
  const base = getEffectiveItemBaseName(item, prefix, suffix);
  return `${base}.${ext}`;
};

export const getQualityDescription = (val: number): string => {
  if (val >= 95) return 'Maximum Clarity · Minimal Compression';
  if (val >= 80) return 'High Clarity · Recommended Web Balance';
  if (val >= 55) return 'Medium Quality · Balanced File Size';
  if (val >= 30) return 'High Compression · Small File Size';
  return 'Extreme Compression · Smallest File Size';
};

export const getQualityBadgeColor = (val: number): string => {
  if (val >= 90) return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  if (val >= 75) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  if (val >= 50) return 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  return 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800';
};

export const ImageCompressorTool: React.FC = () => {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  // State
  const [items, setItems] = useState<CompressedImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [galleryViewMode, setGalleryViewMode] = useState<
    'originals' | 'slider' | 'side-by-side' | 'compressed-only' | 'grid'
  >('originals');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [quality, setQuality] = useState<number>(80);
  const [maxDimension, setMaxDimension] = useState<number>(1920);
  const [globalFormatChoice, setGlobalFormatChoice] = useState<GlobalFormatChoice>('image/webp');
  const [stripExif, setStripExif] = useState<boolean>(true); // Strip EXIF metadata for enhanced privacy
  const [isGeneratingZip, setIsGeneratingZip] = useState<boolean>(false);
  const [zipDownloaded, setZipDownloaded] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Multi-image selection & batch state
  const [selectedBatchIds, setSelectedBatchIds] = useState<Set<string>>(new Set());
  const wasProcessingRef = useRef<boolean>(false);

  // Confirm compression result via toast when active processing finishes
  useEffect(() => {
    if (items.length === 0) {
      wasProcessingRef.current = false;
      return;
    }

    const anyProcessing = items.some((it) => it.isProcessing);
    if (anyProcessing) {
      wasProcessingRef.current = true;
      return;
    }

    if (wasProcessingRef.current) {
      wasProcessingRef.current = false;
      const completed = items.filter((it) => it.compressedBlob !== null && !it.error);
      if (completed.length > 0) {
        const totalOrig = completed.reduce((acc, it) => acc + it.originalSize, 0);
        const totalComp = completed.reduce((acc, it) => acc + it.compressedSize, 0);
        const savedPct =
          totalOrig > 0 ? Math.max(0, Math.round(((totalOrig - totalComp) / totalOrig) * 100)) : 0;

        emitCalculationSuccess({
          toolId: 'image-compressor',
          title: 'Compression Complete',
          titleUrdu: 'تصویر کمپریشن مکمل ہو گئی',
          message:
            completed.length === 1
              ? `1 image processed · ${savedPct}% size reduction`
              : `${completed.length} images processed · ${savedPct}% total reduction`,
          messageUrdu: `${completed.length} تصاویر تیار · ${savedPct}% سائز میں کمی`,
        });
      }
    }
  }, [items]);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  // Modals & Renaming state
  const [previewModalItem, setPreviewModalItem] = useState<CompressedImageItem | null>(null);
  const [cropModalItem, setCropModalItem] = useState<CompressedImageItem | null>(null);
  const [exifModalItem, setExifModalItem] = useState<CompressedImageItem | null>(null);
  const [renamePrefix, setRenamePrefix] = useState<string>('');
  const [renameSuffix, setRenameSuffix] = useState<string>('');
  const [isBulkRenameOpen, setIsBulkRenameOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const secondaryDropInputRef = useRef<HTMLInputElement>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef<number>(0);

  // Helper formatting
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Helper to resolve effective target format for an item
  const resolveTargetFormat = useCallback(
    (originalMime: string, choice: GlobalFormatChoice): ImageMimeType => {
      if (choice === 'original') {
        if (originalMime.includes('png')) return 'image/png';
        if (originalMime.includes('webp')) return 'image/webp';
        return 'image/jpeg';
      }
      return choice;
    },
    []
  );

  // Keep selectedId valid
  useEffect(() => {
    if (items.length > 0) {
      if (!selectedId || !items.some((it) => it.id === selectedId)) {
        setSelectedId(items[0].id);
      }
    } else {
      setSelectedId(null);
    }
  }, [items, selectedId]);

  // Keep batch selection synced with items
  useEffect(() => {
    setSelectedBatchIds((prev) => {
      const validIds = new Set(items.map((it) => it.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [items]);

  const activeIndex = items.findIndex((it) => it.id === selectedId);
  const activeItem = activeIndex >= 0 ? items[activeIndex] : items[0] || null;

  // Scroll active thumbnail into view
  useEffect(() => {
    if (selectedId && filmstripRef.current) {
      const activeEl = filmstripRef.current.querySelector(`[data-id="${selectedId}"]`) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedId]);

  // Compress & convert a single image helper (with optional cropping & EXIF handling)
  const compressImageFile = useCallback(
    (
      file: File,
      previewUrl: string,
      targetQuality: number,
      targetMaxDim: number,
      targetFormat: ImageMimeType,
      cropRect?: CropRect | null,
      stripExifParam?: boolean
    ): Promise<{
      blob: Blob;
      dataUrl: string;
      compressedWidth: number;
      compressedHeight: number;
      naturalWidth: number;
      naturalHeight: number;
    }> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = previewUrl;

        img.onload = () => {
          const fullNaturalWidth = img.naturalWidth;
          const fullNaturalHeight = img.naturalHeight;

          // Compute source crop region
          let sx = 0;
          let sy = 0;
          let sWidth = fullNaturalWidth;
          let sHeight = fullNaturalHeight;

          if (cropRect) {
            sx = Math.max(0, Math.min(cropRect.x, fullNaturalWidth - 1));
            sy = Math.max(0, Math.min(cropRect.y, fullNaturalHeight - 1));
            sWidth = Math.max(1, Math.min(cropRect.width, fullNaturalWidth - sx));
            sHeight = Math.max(1, Math.min(cropRect.height, fullNaturalHeight - sy));
          }

          let width = sWidth;
          let height = sHeight;

          // Scale down if larger than maxDimension
          if (targetMaxDim > 0 && (width > targetMaxDim || height > targetMaxDim)) {
            if (width > height) {
              height = Math.round((height * targetMaxDim) / width);
              width = targetMaxDim;
            } else {
              width = Math.round((width * targetMaxDim) / height);
              height = targetMaxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas 2D context not available'));
            return;
          }

          // When converting to JPEG, render crisp white background so transparent areas don't render black
          if (targetFormat === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
          }

          // Draw source image (or cropped region) onto canvas
          ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);

          // For PNG, canvas.toBlob ignores quality (PNG is lossless in canvas). For JPEG/WebP, quality works natively from 0.0 to 1.0.
          const qualityFactor =
            targetFormat === 'image/png'
              ? undefined
              : Math.min(Math.max(targetQuality / 100, 0), 1);

          canvas.toBlob(
            async (blob) => {
              if (!blob) {
                reject(new Error('Format conversion / compression failed'));
                return;
              }

              let finalBlob = blob;
              const shouldStrip = stripExifParam !== undefined ? stripExifParam : stripExif;

              try {
                if (shouldStrip) {
                  // Stripping EXIF: ensure clean stream with no APP1/IPTC/XMP
                  if (targetFormat === 'image/jpeg') {
                    const buf = await blob.arrayBuffer();
                    const cleanBytes = stripMetadataFromJpeg(buf);
                    finalBlob = new Blob([cleanBytes.buffer as ArrayBuffer], { type: 'image/jpeg' });
                  }
                } else {
                  // Preserving EXIF: if original was JPEG and output is JPEG, inject original APP1 segments
                  if (targetFormat === 'image/jpeg' && file.type === 'image/jpeg') {
                    const origBuf = await file.arrayBuffer();
                    const exifSegments = extractExifSegmentsFromJpeg(origBuf);
                    if (exifSegments.length > 0) {
                      const blobBuf = await blob.arrayBuffer();
                      const injected = injectExifSegmentsIntoJpeg(blobBuf, exifSegments);
                      finalBlob = new Blob([injected.buffer as ArrayBuffer], { type: 'image/jpeg' });
                    }
                  }
                }
              } catch (e) {
                console.warn('EXIF processing fallback:', e);
              }

              const reader = new FileReader();
              reader.onloadend = () => {
                resolve({
                  blob: finalBlob,
                  dataUrl: reader.result as string,
                  compressedWidth: width,
                  compressedHeight: height,
                  naturalWidth: sWidth,
                  naturalHeight: sHeight,
                });
              };
              reader.onerror = () => reject(new Error('Failed to read processed image'));
              reader.readAsDataURL(finalBlob);
            },
            targetFormat,
            qualityFactor
          );
        };

        img.onerror = () => {
          reject(new Error('Failed to load image for conversion'));
        };
      });
    },
    [stripExif]
  );

  // Recompress specific item
  const recompressItem = useCallback(
    async (item: CompressedImageItem, newTargetFormat?: ImageMimeType, newCropRect?: CropRect | null) => {
      const formatToUse = newTargetFormat || item.targetFormat;
      const cropToUse = newCropRect !== undefined ? newCropRect : item.cropRect;

      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? { ...it, isProcessing: true, targetFormat: formatToUse, cropRect: cropToUse, error: null }
            : it
        )
      );

      try {
        const res = await compressImageFile(
          item.file,
          item.originalPreviewUrl,
          quality,
          maxDimension,
          formatToUse,
          cropToUse,
          stripExif
        );

        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  compressedBlob: res.blob,
                  compressedDataUrl: res.dataUrl,
                  compressedSize: res.blob.size,
                  compressedWidth: res.compressedWidth,
                  compressedHeight: res.compressedHeight,
                  naturalWidth: res.naturalWidth,
                  naturalHeight: res.naturalHeight,
                  targetFormat: formatToUse,
                  cropRect: cropToUse,
                  isProcessing: false,
                  error: null,
                }
              : it
          )
        );
      } catch (err: any) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  isProcessing: false,
                  error: err?.message || 'Conversion error',
                }
              : it
          )
        );
      }
    },
    [compressImageFile, quality, maxDimension, stripExif]
  );

  // Apply Crop to an item
  const handleApplyCrop = (itemId: string, cropRect: CropRect) => {
    const item = items.find((it) => it.id === itemId);
    if (item) {
      recompressItem(item, item.targetFormat, cropRect);
    }
  };

  // Reset Crop on an item
  const handleResetCrop = (itemId: string) => {
    const item = items.find((it) => it.id === itemId);
    if (item) {
      recompressItem(item, item.targetFormat, null);
    }
  };

  // Recompress all items when global settings change
  const recompressAllItems = useCallback(
    async (itemsToProcess: CompressedImageItem[], choice: GlobalFormatChoice) => {
      if (itemsToProcess.length === 0) return;

      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          isProcessing: true,
          error: null,
          targetFormat: resolveTargetFormat(it.originalMimeType, choice),
        }))
      );

      for (const item of itemsToProcess) {
        const formatToUse = resolveTargetFormat(item.originalMimeType, choice);
        try {
          const res = await compressImageFile(
            item.file,
            item.originalPreviewUrl,
            quality,
            maxDimension,
            formatToUse,
            item.cropRect,
            stripExif
          );

          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    compressedBlob: res.blob,
                    compressedDataUrl: res.dataUrl,
                    compressedSize: res.blob.size,
                    compressedWidth: res.compressedWidth,
                    compressedHeight: res.compressedHeight,
                    naturalWidth: res.naturalWidth,
                    naturalHeight: res.naturalHeight,
                    targetFormat: formatToUse,
                    isProcessing: false,
                    error: null,
                  }
                : it
            )
          );
        } catch (err: any) {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    isProcessing: false,
                    error: err?.message || 'Conversion error',
                  }
                : it
            )
          );
        }
      }
    },
    [compressImageFile, quality, maxDimension, resolveTargetFormat, stripExif]
  );

  // Trigger recompression on settings change
  useEffect(() => {
    if (items.length > 0) {
      recompressAllItems(items, globalFormatChoice);
    }
  }, [quality, maxDimension, globalFormatChoice, stripExif]);

  // Handle addition of new files
  const handleAddFiles = useCallback(
    (files: FileList | File[] | null) => {
      if (!files || files.length === 0) return;

      setErrorMsg(null);
      const MAX_IMAGE_BYTES = 50 * 1024 * 1024; // 50 MB per image
      const validFiles: File[] = [];
      let rejectedOversize = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        if (file.size > MAX_IMAGE_BYTES) {
          rejectedOversize++;
          continue;
        }
        validFiles.push(file);
      }

      if (rejectedOversize > 0 && validFiles.length === 0) {
        setErrorMsg('Selected image exceeds the 50 MB per-file browser limit. Please choose a smaller image.');
        return;
      }

      if (validFiles.length === 0) {
        setErrorMsg('Please select or drop valid image files (PNG, JPG, WebP, AVIF — up to 50 MB each).');
        return;
      }

      if (rejectedOversize > 0) {
        setErrorMsg(`${rejectedOversize} file(s) over 50 MB were skipped to protect browser memory.`);
      }

      const newItems: CompressedImageItem[] = validFiles.map((file) => {
        const originalMime = file.type || 'image/jpeg';
        const targetFormat = resolveTargetFormat(originalMime, globalFormatChoice);

        return {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          originalSize: file.size,
          originalMimeType: originalMime,
          originalFormatLabel: getFormatLabel(originalMime || file.name),
          originalPreviewUrl: URL.createObjectURL(file),
          cropRect: null,
          compressedBlob: null,
          compressedDataUrl: null,
          compressedSize: 0,
          targetFormat,
          isProcessing: true,
          error: null,
          exifData: null,
        };
      });

      setItems((prev) => {
        const updated = [...prev, ...newItems];
        if (!selectedId && updated.length > 0) {
          setSelectedId(updated[0].id);
        }
        return updated;
      });

      // Default to originals grid view so users can review dimensions & file sizes
      setGalleryViewMode('originals');

      // Pre-load natural dimensions immediately so they display before compression completes
      newItems.forEach((item) => {
        const img = new Image();
        img.onload = () => {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                  }
                : it
            )
          );
        };
        img.src = item.originalPreviewUrl;
      });

      // Parse EXIF metadata from each file
      newItems.forEach(async (item) => {
        try {
          const exif = await parseExifFromBlob(item.file);
          setItems((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, exifData: exif } : it))
          );
        } catch (e) {
          console.warn('Error parsing EXIF for file:', item.name, e);
        }
      });

      // Select newly added items for batch operations
      setSelectedBatchIds((prev) => {
        const next = new Set(prev);
        newItems.forEach((it) => next.add(it.id));
        return next;
      });

      // Process newly added batch items simultaneously
      (async () => {
        for (const item of newItems) {
          try {
            const res = await compressImageFile(
              item.file,
              item.originalPreviewUrl,
              quality,
              maxDimension,
              item.targetFormat,
              null,
              stripExif
            );

            setItems((prev) =>
              prev.map((it) =>
                it.id === item.id
                  ? {
                      ...it,
                      compressedBlob: res.blob,
                      compressedDataUrl: res.dataUrl,
                      compressedSize: res.blob.size,
                      compressedWidth: res.compressedWidth,
                      compressedHeight: res.compressedHeight,
                      naturalWidth: res.naturalWidth,
                      naturalHeight: res.naturalHeight,
                      isProcessing: false,
                      error: null,
                    }
                  : it
              )
            );
          } catch (err: any) {
            setItems((prev) =>
              prev.map((it) =>
                it.id === item.id
                  ? {
                      ...it,
                      isProcessing: false,
                      error: err?.message || 'Conversion error',
                    }
                  : it
              )
            );
          }
        }
      })();

      if (fileInputRef.current) fileInputRef.current.value = '';
      if (addMoreInputRef.current) addMoreInputRef.current.value = '';
      if (secondaryDropInputRef.current) secondaryDropInputRef.current.value = '';
    },
    [compressImageFile, globalFormatChoice, maxDimension, quality, resolveTargetFormat, selectedId, stripExif]
  );

  // Multi-item selection handlers
  const toggleSelectBatchItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedBatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllBatch = () => {
    setSelectedBatchIds(new Set(items.map((it) => it.id)));
  };

  const handleDeselectAllBatch = () => {
    setSelectedBatchIds(new Set());
  };

  // BATCH OPERATION 1: Process / Recompress Selected simultaneously
  const handleBatchProcessSelected = async () => {
    const selectedItems = items.filter((it) => selectedBatchIds.has(it.id));
    if (selectedItems.length === 0 || isBatchProcessing) return;

    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: selectedItems.length });

    // Mark selected as processing
    setItems((prev) =>
      prev.map((it) =>
        selectedBatchIds.has(it.id) ? { ...it, isProcessing: true, error: null } : it
      )
    );

    let completed = 0;
    for (const item of selectedItems) {
      try {
        const res = await compressImageFile(
          item.file,
          item.originalPreviewUrl,
          quality,
          maxDimension,
          item.targetFormat,
          item.cropRect,
          stripExif
        );

        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  compressedBlob: res.blob,
                  compressedDataUrl: res.dataUrl,
                  compressedSize: res.blob.size,
                  compressedWidth: res.compressedWidth,
                  compressedHeight: res.compressedHeight,
                  naturalWidth: res.naturalWidth,
                  naturalHeight: res.naturalHeight,
                  isProcessing: false,
                  error: null,
                }
              : it
          )
        );
      } catch (err: any) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  isProcessing: false,
                  error: err?.message || 'Processing error',
                }
              : it
          )
        );
      }
      completed++;
      setBatchProgress({ current: completed, total: selectedItems.length });
    }

    setIsBatchProcessing(false);
  };

  // BATCH OPERATION 2: Convert Selected to target format in single operation
  const handleBatchConvertSelected = async (targetFormat: ImageMimeType) => {
    const selectedItems = items.filter((it) => selectedBatchIds.has(it.id));
    if (selectedItems.length === 0 || isBatchProcessing) return;

    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: selectedItems.length });

    setItems((prev) =>
      prev.map((it) =>
        selectedBatchIds.has(it.id)
          ? { ...it, isProcessing: true, targetFormat, error: null }
          : it
      )
    );

    let completed = 0;
    for (const item of selectedItems) {
      try {
        const res = await compressImageFile(
          item.file,
          item.originalPreviewUrl,
          quality,
          maxDimension,
          targetFormat,
          item.cropRect,
          stripExif
        );

        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  compressedBlob: res.blob,
                  compressedDataUrl: res.dataUrl,
                  compressedSize: res.blob.size,
                  compressedWidth: res.compressedWidth,
                  compressedHeight: res.compressedHeight,
                  naturalWidth: res.naturalWidth,
                  naturalHeight: res.naturalHeight,
                  targetFormat,
                  isProcessing: false,
                  error: null,
                }
              : it
          )
        );
      } catch (err: any) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, isProcessing: false, error: err?.message } : it
          )
        );
      }
      completed++;
      setBatchProgress({ current: completed, total: selectedItems.length });
    }

    setIsBatchProcessing(false);
  };

  // BATCH OPERATION 3: Batch Auto-Center Crop Selected to an aspect ratio
  const handleBatchCropSelected = async (targetAspect: AspectRatioOption) => {
    const selectedItems = items.filter((it) => selectedBatchIds.has(it.id));
    if (selectedItems.length === 0 || isBatchProcessing) return;

    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: selectedItems.length });

    const ratioMap: Record<string, number | null> = {
      free: null,
      '1:1': 1,
      '16:9': 16 / 9,
      '4:3': 4 / 3,
      '3:2': 3 / 2,
      '9:16': 9 / 16,
    };
    const r = ratioMap[targetAspect];

    let completed = 0;
    for (const item of selectedItems) {
      // Calculate centered crop box
      const nw = item.naturalWidth || 1000;
      const nh = item.naturalHeight || 1000;

      let cropRect: CropRect | null = null;
      if (r !== null) {
        let cw = nw;
        let ch = cw / r;
        if (ch > nh) {
          ch = nh;
          cw = ch * r;
        }
        cropRect = {
          x: Math.round((nw - cw) / 2),
          y: Math.round((nh - ch) / 2),
          width: Math.round(cw),
          height: Math.round(ch),
          aspect: targetAspect,
        };
      }

      try {
        const res = await compressImageFile(
          item.file,
          item.originalPreviewUrl,
          quality,
          maxDimension,
          item.targetFormat,
          cropRect,
          stripExif
        );

        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  cropRect,
                  compressedBlob: res.blob,
                  compressedDataUrl: res.dataUrl,
                  compressedSize: res.blob.size,
                  compressedWidth: res.compressedWidth,
                  compressedHeight: res.compressedHeight,
                  naturalWidth: res.naturalWidth,
                  naturalHeight: res.naturalHeight,
                  isProcessing: false,
                  error: null,
                }
              : it
          )
        );
      } catch (err: any) {
        // ignore individual error
      }
      completed++;
      setBatchProgress({ current: completed, total: selectedItems.length });
    }

    setIsBatchProcessing(false);
  };

  // BATCH OPERATION 4: Delete Selected items
  const handleBatchDeleteSelected = () => {
    setItems((prev) => {
      prev.forEach((it) => {
        if (selectedBatchIds.has(it.id)) {
          try {
            URL.revokeObjectURL(it.originalPreviewUrl);
          } catch {
            // ignore
          }
        }
      });
      return prev.filter((it) => !selectedBatchIds.has(it.id));
    });
    setSelectedBatchIds(new Set());
  };

  // Clipboard paste support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const files = e.clipboardData.files;
      if (files && files.length > 0) {
        handleAddFiles(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleAddFiles]);

  // Drag and drop handlers
  const handleContainerDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleContainerDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  // Bulk rename handlers
  const handleApplyBulkRename = useCallback(
    (renamedMap: Record<string, string>, appliedPrefix: string, appliedSuffix: string) => {
      setRenamePrefix(appliedPrefix);
      setRenameSuffix(appliedSuffix);
      setItems((prev) =>
        prev.map((it) => {
          if (renamedMap[it.id] !== undefined) {
            return { ...it, customName: renamedMap[it.id] };
          }
          return it;
        })
      );
    },
    []
  );

  const handleResetAllNames = useCallback(() => {
    setRenamePrefix('');
    setRenameSuffix('');
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        customName: undefined,
      }))
    );
  }, []);

  // Individual file download with converted format extension and bulk renaming
  const handleDownloadSingle = (item: CompressedImageItem) => {
    if (!item.compressedDataUrl) return;
    const finalFileName = getEffectiveItemFileName(item, renamePrefix, renameSuffix);
    const a = document.createElement('a');
    a.href = item.compressedDataUrl;
    a.download = finalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Bulk download as ZIP (can filter by selected items if desired)
  const handleDownloadZip = async (onlySelected: boolean = false) => {
    const targetItems = onlySelected
      ? items.filter((it) => selectedBatchIds.has(it.id) && it.compressedBlob && !it.isProcessing)
      : items.filter((it) => it.compressedBlob && !it.isProcessing);

    if (targetItems.length === 0 || isGeneratingZip) return;

    setIsGeneratingZip(true);
    setErrorMsg(null);

    try {
      const zip = new JSZip();
      const usedNames = new Set<string>();

      for (const item of targetItems) {
        if (!item.compressedBlob) continue;

        const ext = getExtensionForMime(item.targetFormat);
        const baseName = getEffectiveItemBaseName(item, renamePrefix, renameSuffix);
        let finalName = `${baseName}.${ext}`;
        let counter = 1;

        while (usedNames.has(finalName.toLowerCase())) {
          finalName = `${baseName}_${counter}.${ext}`;
          counter++;
        }
        usedNames.add(finalName.toLowerCase());

        zip.file(finalName, item.compressedBlob);
      }

      // Add privacy & processing manifest
      const privacySection = stripExif
        ? `EXIF Metadata Stripping: ENABLED\nAll embedded EXIF metadata (GPS coordinates, camera model, date taken, and device details)\nhave been stripped from all compressed files in this archive for privacy protection.\n`
        : `EXIF Metadata Stripping: DISABLED (Original camera metadata retained)\n`;

      const renameSection =
        renamePrefix || renameSuffix || items.some((it) => it.customName)
          ? `Bulk File Renaming: APPLIED\nPrefix: "${renamePrefix || '(none)'}"\nSuffix: "${renameSuffix || '(none)'}"\n`
          : `Bulk File Renaming: Default naming (compressed_[name].ext)\n`;

      zip.file(
        'PRIVACY_MANIFEST.txt',
        `Image Compression & Export Privacy Manifest\n============================================\nGenerated: ${new Date().toLocaleString()}\n\n${privacySection}\n${renameSection}\nTotal images processed: ${targetItems.length}\n`
      );

      // Generate the ZIP blob
      const content = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const dateStr = new Date().toISOString().slice(0, 10);
      const downloadUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = onlySelected
        ? `selected_compressed_images_${dateStr}.zip`
        : `compressed_images_${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setZipDownloaded(true);
      setTimeout(() => setZipDownloaded(false), 3000);
    } catch (err: any) {
      console.error('Error generating ZIP:', err);
      setErrorMsg('Failed to generate ZIP archive. Please try again.');
    } finally {
      setIsGeneratingZip(false);
    }
  };

  // Remove single item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((it) => it.id === id);
      if (item) {
        try {
          URL.revokeObjectURL(item.originalPreviewUrl);
        } catch {
          // ignore
        }
      }
      return prev.filter((it) => it.id !== id);
    });
  };

  // Reset all
  const handleReset = () => {
    items.forEach((it) => {
      try {
        URL.revokeObjectURL(it.originalPreviewUrl);
      } catch {
        // ignore
      }
    });
    setItems([]);
    setSelectedId(null);
    setSelectedBatchIds(new Set());
    setQuality(80);
    setErrorMsg(null);
    setZipDownloaded(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (addMoreInputRef.current) addMoreInputRef.current.value = '';
    if (secondaryDropInputRef.current) secondaryDropInputRef.current.value = '';
  };

  // Navigation handlers for gallery
  const handlePrev = () => {
    if (items.length <= 1) return;
    const prevIdx = (activeIndex - 1 + items.length) % items.length;
    setSelectedId(items[prevIdx].id);
  };

  const handleNext = () => {
    if (items.length <= 1) return;
    const nextIdx = (activeIndex + 1) % items.length;
    setSelectedId(items[nextIdx].id);
  };

  // Totals & Aggregations
  const totalOriginalSize = items.reduce((acc, it) => acc + it.originalSize, 0);
  const totalCompressedSize = items.reduce(
    (acc, it) => acc + (it.compressedSize || it.originalSize),
    0
  );
  const totalSavedBytes = Math.max(0, totalOriginalSize - totalCompressedSize);
  const overallReductionPercentage =
    totalOriginalSize > 0
      ? Math.max(0, Math.round((totalSavedBytes / totalOriginalSize) * 100))
      : 0;

  const totalReadyCount = items.filter((it) => it.compressedBlob && !it.isProcessing).length;
  const isAnyProcessing = items.some((it) => it.isProcessing) || isBatchProcessing;

  const activeReduction =
    activeItem && activeItem.compressedSize > 0
      ? Math.max(
          0,
          Math.round(
            ((activeItem.originalSize - activeItem.compressedSize) / activeItem.originalSize) * 100
          )
        )
      : 0;

  // Format breakdown count
  const formatCounts = items.reduce((acc, it) => {
    const lbl = getFormatLabel(it.targetFormat);
    acc[lbl] = (acc[lbl] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const isAllBatchSelected = items.length > 0 && selectedBatchIds.size === items.length;
  const hasSelectedBatch = selectedBatchIds.size > 0;

  return (
    <div
      onDragEnter={handleContainerDragEnter}
      onDragOver={handleContainerDragOver}
      onDragLeave={handleContainerDragLeave}
      onDrop={handleContainerDrop}
      className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 min-h-[70vh]"
    >
      {/* TOOL-WIDE DRAG & DROP ACTIVE OVERLAY */}
      {isDragging && (
        <div className="absolute inset-0 z-50 rounded-2xl bg-slate-900/85 backdrop-blur-md flex flex-col items-center justify-center p-8 text-white border-3 border-dashed border-emerald-400 animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 ring-8 ring-emerald-500/10 animate-bounce">
            <Upload className="w-10 h-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2 text-center">
            Drop Images Anywhere to Convert, Crop & Compress
          </h2>
          <p className="text-sm text-emerald-200 max-w-md text-center leading-relaxed mb-4">
            Select or drop multiple images at once to batch process simultaneously, apply aspect ratio crops, and download as a single ZIP.
          </p>
          <div className="flex items-center gap-2 text-xs font-mono bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-300">
            <Files className="w-3.5 h-3.5" />
            <span>Converts PNG, JPG, JPEG, WebP, AVIF · Multi-Image Batch Processing</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
            <Minimize2 className="w-4 h-4" />
            <span>100% Client-Side Image Compressor · EXIF Privacy Stripper · Multi-Image Batch Operations</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            <span>Image Compressor & Batch Converter</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              EXIF Privacy Stripper
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 flex items-center gap-1">
              <Crop className="w-3 h-3" />
              Aspect Crop & Batch
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select and batch process multiple images simultaneously. Strip sensitive EXIF metadata (GPS location, date, and camera details) for privacy protection, crop with aspect ratio presets, convert formats, and download individually or in a bulk ZIP.
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2">
            {/* Add More Images Button */}
            <input
              ref={addMoreInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/avif"
              onChange={(e) => handleAddFiles(e.target.files)}
              className="hidden"
              id="add-more-input"
            />
            <button
              type="button"
              onClick={() => addMoreInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Images</span>
            </button>

            {/* Clear All */}
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Container */}
      {items.length === 0 ? (
        /* INITIAL HERO DRAG & DROP ZONE */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-400 p-12 text-center transition-all cursor-pointer shadow-xs hover:shadow-md"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={(e) => handleAddFiles(e.target.files)}
            className="hidden"
            id="compress-file-input"
          />
          <div className="space-y-4 max-w-xl mx-auto">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Upload className="w-9 h-9" />
            </div>

            <div>
              <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white block">
                Drag & drop multiple images here
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                Select and process multiple photos simultaneously in a single batch operation, with free-hand & aspect ratio cropping
              </span>
            </div>

            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 group-hover:bg-emerald-700 rounded-xl transition-all shadow-sm">
                <Upload className="w-4 h-4" />
                <span>Select Multiple Images from Computer</span>
              </span>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono flex items-center gap-1.5">
                <Crop className="w-3 h-3 text-emerald-500" />
                Aspect Cropping (1:1, 16:9, Free)
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                Multi-image batch processing
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                JPEG · PNG · WebP Conversion
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                EXIF Metadata Privacy Stripper
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                100% Client-Side Privacy
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Global Compression & Format Conversion Settings Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Format Converter Selection */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <label className="flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
                  Convert Format (Output)
                </label>
                <span className="text-[10.5px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold">
                  {globalFormatChoice === 'original' ? 'Auto / Match Source' : getFormatLabel(globalFormatChoice)}
                </span>
              </div>
              <select
                value={globalFormatChoice}
                onChange={(e) => setGlobalFormatChoice(e.target.value as GlobalFormatChoice)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="image/webp">WebP (.webp · Modern high-efficiency, supports transparency)</option>
                <option value="image/jpeg">JPEG (.jpg · Smallest file size, universal compatibility)</option>
                <option value="image/png">PNG (.png · Lossless, preserves full transparency)</option>
                <option value="original">Match Original Format (Preserve input extensions)</option>
              </select>

              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span>
                  {globalFormatChoice === 'image/png'
                    ? 'Lossless compression & transparent background'
                    : globalFormatChoice === 'image/jpeg'
                    ? 'Crisp white backing for transparent inputs'
                    : globalFormatChoice === 'image/webp'
                    ? 'Superior ratio + transparency support'
                    : 'Keeps each image\'s native type'}
                </span>
              </div>
            </div>

            {/* 2. Compression Quality */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                    Image Quality (0 - 100%)
                  </span>

                  {/* Direct input and percentage display */}
                  <div className="flex items-center gap-1">
                    {globalFormatChoice === 'image/png' ? (
                      <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                        Lossless (100%)
                      </span>
                    ) : (
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={quality}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              setQuality(Math.min(100, Math.max(0, val)));
                            }
                          }}
                          className="w-12 px-1.5 py-0.5 text-xs text-right font-mono font-bold rounded-l-md border border-r-0 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                          aria-label="Quality percentage"
                        />
                        <span className="px-1.5 py-0.5 text-xs font-bold font-mono rounded-r-md border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500">
                          %
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Range Slider 0-100% */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={quality}
                  disabled={globalFormatChoice === 'image/png'}
                  onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600 cursor-pointer disabled:opacity-40"
                  aria-label="Image quality range slider (0-100%)"
                />

                {/* Sub-label indicators */}
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>0% (Smallest Size)</span>
                  <span>50% (Balanced)</span>
                  <span>100% (Max Clarity)</span>
                </div>
              </div>

              {/* Dynamic balance descriptor & Quick Presets */}
              <div className="mt-2 space-y-1.5">
                <div
                  className={`text-[10px] px-2 py-0.5 rounded border font-medium flex items-center justify-between ${
                    globalFormatChoice === 'image/png'
                      ? 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      : getQualityBadgeColor(quality)
                  }`}
                >
                  <span>
                    {globalFormatChoice === 'image/png'
                      ? 'PNG: Lossless pixel clarity'
                      : getQualityDescription(quality)}
                  </span>
                  <span className="font-mono font-bold">
                    {globalFormatChoice === 'image/png' ? 'Lossless' : `${quality}%`}
                  </span>
                </div>

                {/* Quick Presets */}
                {globalFormatChoice !== 'image/png' && (
                  <div className="flex items-center gap-1 justify-between pt-0.5">
                    <span className="text-[9.5px] text-slate-400 font-medium">Presets:</span>
                    <div className="flex items-center gap-1">
                      {[
                        { label: '25% Low', val: 25 },
                        { label: '50% Med', val: 50 },
                        { label: '80% High', val: 80 },
                        { label: '100% Max', val: 100 },
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => setQuality(preset.val)}
                          className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono cursor-pointer transition-colors ${
                            quality === preset.val
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Dimension Rescaling */}
            <div className="flex flex-col justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Max Dimension (Resize)
                </label>
                <select
                  value={maxDimension}
                  onChange={(e) => setMaxDimension(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value={1280}>1280px (HD - Fast Web)</option>
                  <option value={1920}>1920px (Full HD - Recommended)</option>
                  <option value={2560}>2560px (2K QHD)</option>
                  <option value={3840}>3840px (4K UHD)</option>
                  <option value={0}>Original Dimensions (No Rescaling)</option>
                </select>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Preserves aspect ratio; downscales only if original is larger
                </span>
              </div>

              <div className="mt-2 text-[10px] text-slate-400 font-mono">
                <span>Output constraint: {maxDimension === 0 ? 'None' : `Max ${maxDimension}px`}</span>
              </div>
            </div>

            {/* 4. Privacy & EXIF Metadata Stripping Toggle */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    {stripExif ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    )}
                    Strip EXIF Metadata
                  </span>

                  <span
                    className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      stripExif
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}
                  >
                    {stripExif ? 'STRIPPED' : 'RETAINED'}
                  </span>
                </div>

                {/* Toggle Switch */}
                <div
                  onClick={() => setStripExif((prev) => !prev)}
                  role="switch"
                  aria-checked={stripExif}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setStripExif((prev) => !prev);
                    }
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    stripExif
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700'
                  }`}
                  title="Toggle stripping EXIF metadata (location, date, camera details)"
                >
                  <div className="space-y-0.5 pr-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Privacy Protection
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
                      Remove location (GPS), date, and camera details
                    </span>
                  </div>

                  {/* Accessible switch track & thumb */}
                  <div
                    className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
                      stripExif ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                        stripExif ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Status footer with Exif detected info */}
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                <span className="truncate">
                  {items.some((it) => it.exifData?.hasExif)
                    ? `${items.filter((it) => it.exifData?.hasExif).length} with EXIF data`
                    : 'Clean / No EXIF detected'}
                </span>
                {activeItem?.exifData?.hasExif && (
                  <button
                    type="button"
                    onClick={() => setExifModalItem(activeItem)}
                    className="text-emerald-600 dark:text-emerald-400 font-semibold underline hover:no-underline shrink-0 cursor-pointer ml-1"
                  >
                    Inspect EXIF
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* BULK FILE RENAMING TOOLBAR (Prefix & Suffix before downloading) */}
          {/* ======================================================== */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Bulk Rename Images Before Downloading</span>
                    {(renamePrefix || renameSuffix || items.some((it) => it.customName)) && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        Pattern Active
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Apply a consistent prefix and/or suffix across all batch images before exporting ZIP or single files
                  </p>
                </div>
              </div>

              {/* Advanced modal trigger & reset */}
              <div className="flex items-center gap-2">
                {(renamePrefix || renameSuffix || items.some((it) => it.customName)) && (
                  <button
                    type="button"
                    onClick={handleResetAllNames}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Reset all file names to original filenames"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Names</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsBulkRenameOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                  title="Open advanced bulk rename modal with live preview and sequence numbering"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Advanced Rename & Live Preview</span>
                </button>
              </div>
            </div>

            {/* Quick Prefix & Suffix Inputs and Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-center">
              {/* Prefix field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">File Prefix:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9.5px] text-slate-400">Presets:</span>
                    {['compressed_', 'web_', 'opt_'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setRenamePrefix(p)}
                        className="px-1 py-0.2 rounded text-[9.5px] font-mono bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950 text-slate-600 dark:text-slate-400 cursor-pointer transition-colors"
                      >
                        +{p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={renamePrefix}
                    onChange={(e) => setRenamePrefix(e.target.value)}
                    placeholder="e.g. compressed_ or web_"
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                  {renamePrefix && (
                    <button
                      type="button"
                      onClick={() => setRenamePrefix('')}
                      className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Suffix field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">File Suffix:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9.5px] text-slate-400">Presets:</span>
                    {['_min', '_optimized', '_small'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRenameSuffix(s)}
                        className="px-1 py-0.2 rounded text-[9.5px] font-mono bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950 text-slate-600 dark:text-slate-400 cursor-pointer transition-colors"
                      >
                        +{s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={renameSuffix}
                    onChange={(e) => setRenameSuffix(e.target.value)}
                    placeholder="e.g. _min or _optimized"
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                  {renameSuffix && (
                    <button
                      type="button"
                      onClick={() => setRenameSuffix('')}
                      className="absolute right-2 top-2 text-[10px] text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Live Filename Example */}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs sm:col-span-2 lg:col-span-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Download Filename Example:
                </span>
                <div className="font-mono text-[11.5px] text-teal-600 dark:text-teal-400 font-bold truncate mt-0.5">
                  {items.length > 0
                    ? getEffectiveItemFileName(items[0], renamePrefix, renameSuffix)
                    : `${renamePrefix || 'compressed_'}photo${renameSuffix || ''}.webp`}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  Applies to all {items.length} images on single download and ZIP bundle
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* MULTI-IMAGE BATCH OPERATIONS TOOLBAR */}
          {/* ======================================================== */}
          <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md border border-slate-800 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Batch selection status */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={isAllBatchSelected ? handleDeselectAllBatch : handleSelectAllBatch}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isAllBatchSelected ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>{isAllBatchSelected ? 'Deselect All' : 'Select All'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {selectedBatchIds.size} of {items.length} selected
                  </span>
                  {selectedBatchIds.size === 0 && (
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      Select images using checkboxes to perform batch operations
                    </span>
                  )}
                </div>
              </div>

              {/* Batch Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Batch Process Selected */}
                <button
                  type="button"
                  onClick={handleBatchProcessSelected}
                  disabled={!hasSelectedBatch || isBatchProcessing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
                  title="Re-compress and process all selected images simultaneously"
                >
                  {isBatchProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>Process Selected ({selectedBatchIds.size})</span>
                </button>

                {/* 2. Batch Convert Format */}
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 px-1 font-mono">Convert:</span>
                  {(['image/webp', 'image/jpeg', 'image/png'] as ImageMimeType[]).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      disabled={!hasSelectedBatch || isBatchProcessing}
                      onClick={() => handleBatchConvertSelected(fmt)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-700 hover:bg-emerald-600 hover:text-white disabled:opacity-40 cursor-pointer transition-colors"
                      title={`Batch convert selected images to ${getFormatLabel(fmt)}`}
                    >
                      {getFormatLabel(fmt)}
                    </button>
                  ))}
                </div>

                {/* 3. Batch Auto-Center Crop */}
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 px-1 font-mono flex items-center gap-1">
                    <Crop className="w-3 h-3 text-emerald-400" />
                    Crop:
                  </span>
                  {(['1:1', '16:9', '4:3'] as AspectRatioOption[]).map((asp) => (
                    <button
                      key={asp}
                      type="button"
                      disabled={!hasSelectedBatch || isBatchProcessing}
                      onClick={() => handleBatchCropSelected(asp)}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-700 hover:bg-emerald-600 hover:text-white disabled:opacity-40 cursor-pointer transition-colors"
                      title={`Batch center crop selected to ${asp}`}
                    >
                      {asp}
                    </button>
                  ))}
                </div>

                {/* 4. Batch Bulk Rename */}
                <button
                  type="button"
                  onClick={() => setIsBulkRenameOpen(true)}
                  disabled={items.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white border border-slate-700 disabled:opacity-40 cursor-pointer transition-colors"
                  title="Bulk rename images in batch before downloading (prefix, suffix, or sequential numbers)"
                >
                  <Tag className="w-3.5 h-3.5 text-teal-400" />
                  <span>Rename Batch</span>
                  {(renamePrefix || renameSuffix || items.some((it) => it.customName)) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  )}
                </button>

                {/* 5. Batch Download Selected as ZIP */}
                <button
                  type="button"
                  onClick={() => handleDownloadZip(true)}
                  disabled={!hasSelectedBatch || isBatchProcessing || isGeneratingZip}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 disabled:opacity-40 cursor-pointer transition-colors"
                  title="Download a ZIP archive of only the selected images"
                >
                  <FileArchive className="w-3.5 h-3.5" />
                  <span>ZIP Selected</span>
                </button>

                {/* 5. Batch Delete Selected */}
                <button
                  type="button"
                  onClick={handleBatchDeleteSelected}
                  disabled={!hasSelectedBatch || isBatchProcessing}
                  aria-label="Delete selected images from batch"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 disabled:opacity-40 cursor-pointer transition-colors"
                  title="Delete selected images from batch"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Batch Processing Animated Progress Bar */}
            {isBatchProcessing && (
              <div className="space-y-1 pt-1 border-t border-slate-800 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-[11px] text-emerald-300 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    Simultaneous Batch Operation in progress...
                  </span>
                  <span>
                    {batchProgress.current} of {batchProgress.total} completed (
                    {batchProgress.total > 0
                      ? Math.round((batchProgress.current / batchProgress.total) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                    style={{
                      width: `${
                        batchProgress.total > 0
                          ? (batchProgress.current / batchProgress.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Batch Summary & Bulk Download Action Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-950 dark:to-slate-900 rounded-xl p-5 text-white shadow-md border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="space-y-1 text-center md:text-left w-full md:w-auto">
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
                  Batch Status
                </span>
                <span className="text-xs text-emerald-100 font-medium">
                  {totalReadyCount} of {items.length} image{items.length === 1 ? '' : 's'} ready
                </span>
                {isAnyProcessing && (
                  <span className="inline-flex items-center gap-1 text-[11px] bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Processing Batch...
                  </span>
                )}
                {/* Format breakdown pill */}
                <div className="flex items-center gap-1 text-[10.5px] font-mono text-emerald-200 bg-emerald-900/60 px-2 py-0.5 rounded">
                  <FileType className="w-3 h-3" />
                  <span>
                    {Object.entries(formatCounts)
                      .map(([fmt, count]) => `${count} ${fmt}`)
                      .join(' · ')}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-baseline justify-center md:justify-start gap-x-4 gap-y-1 pt-1">
                <div className="text-xs">
                  <span className="text-emerald-200">Original Total: </span>
                  <span className="font-mono font-bold">{formatFileSize(totalOriginalSize)}</span>
                </div>
                <div className="text-xs">
                  <span className="text-emerald-200">Processed: </span>
                  <span className="font-mono font-bold text-emerald-300">
                    {formatFileSize(totalCompressedSize)}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-emerald-200">Total Saved: </span>
                  <span className="font-mono font-bold text-amber-300">
                    {formatFileSize(totalSavedBytes)} (-{overallReductionPercentage}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Action: Download All as ZIP & Bulk Rename */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-center md:justify-end">
              <button
                type="button"
                onClick={() => setIsBulkRenameOpen(true)}
                disabled={items.length === 0}
                className="px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Bulk rename images before downloading: apply prefix, suffix, or sequential numbers"
              >
                <Tag className="w-3.5 h-3.5 text-emerald-200" />
                <span>Rename Files</span>
                {renamePrefix || renameSuffix ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-400 text-slate-900 font-bold">
                    {renamePrefix || ''}[name]{renameSuffix || ''}
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-200 opacity-80">(Prefix / Suffix)</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDownloadZip(false)}
                disabled={totalReadyCount === 0 || isGeneratingZip}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  zipDownloaded
                    ? 'bg-emerald-400 text-emerald-950 shadow-emerald-400/20'
                    : 'bg-white text-emerald-900 hover:bg-emerald-50 active:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
                title="Download all converted & compressed images bundled in a single ZIP file"
              >
                {isGeneratingZip ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                    <span>Archiving ZIP file...</span>
                  </>
                ) : zipDownloaded ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-900" />
                    <span>ZIP Downloaded!</span>
                  </>
                ) : (
                  <>
                    <FileArchive className="w-4 h-4 text-emerald-700" />
                    <span>Download All as ZIP</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-900 font-bold">
                      {totalReadyCount} files · {formatFileSize(totalCompressedSize)}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SECONDARY DRAG & DROP TARGET STRIP */}
          <div
            onClick={() => secondaryDropInputRef.current?.click()}
            className="border-2 border-dashed border-emerald-300 dark:border-emerald-800/80 hover:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl p-3 text-center cursor-pointer transition-colors flex items-center justify-center gap-2 text-xs text-emerald-700 dark:text-emerald-300"
          >
            <input
              ref={secondaryDropInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/avif"
              onChange={(e) => handleAddFiles(e.target.files)}
              className="hidden"
            />
            <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">Drag & drop more images anywhere to convert, crop & compress</span>
            <span className="text-slate-400 dark:text-slate-500">or click to browse</span>
          </div>

          {/* ======================================================== */}
          {/* THUMBNAIL PREVIEW GALLERY SECTION */}
          {/* ======================================================== */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden space-y-4 p-5">
            {/* Gallery Section Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Thumbnail Preview Gallery</span>
                    <span className="text-[11px] font-normal px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {items.length} {items.length === 1 ? 'image' : 'images'}
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Click any thumbnail below to inspect quality, crop, convert formats, and verify before downloading ZIP
                  </p>
                </div>
              </div>

              {/* Gallery View Switcher */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto text-xs">
                <button
                  type="button"
                  onClick={() => setGalleryViewMode('originals')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    galleryViewMode === 'originals'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Grid view of uploaded images with original dimensions & file sizes before compression"
                >
                  <Files className="w-3.5 h-3.5" />
                  <span>Originals Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGalleryViewMode('slider')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    galleryViewMode === 'slider'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Interactive Before / After Split Slider"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Split Slider</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGalleryViewMode('side-by-side')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    galleryViewMode === 'side-by-side'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Side-by-side original vs converted"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Side-by-Side</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGalleryViewMode('compressed-only')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    galleryViewMode === 'compressed-only'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Processed output view"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Processed</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGalleryViewMode('grid')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    galleryViewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Mosaic Thumbnail Grid"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
              </div>
            </div>

            {/* HORIZONTAL THUMBNAIL FILMSTRIP */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
                <span>
                  Select photo ({activeIndex + 1} of {items.length}):
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-xs sm:max-w-md">
                  {activeItem ? activeItem.name : ''}
                </span>
              </div>

              <div
                ref={filmstripRef}
                className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 px-1 scroll-smooth focus:outline-hidden"
                style={{ scrollbarWidth: 'thin' }}
              >
                {items.map((item, idx) => {
                  const isSelected = item.id === selectedId;
                  const isBatchChecked = selectedBatchIds.has(item.id);
                  const itemSavings =
                    item.compressedSize > 0
                      ? Math.max(
                          0,
                          Math.round(((item.originalSize - item.compressedSize) / item.originalSize) * 100)
                        )
                      : 0;

                  return (
                    <div
                      key={item.id}
                      data-id={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`group relative shrink-0 w-24 sm:w-28 rounded-xl p-1.5 border transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-xs ring-2 ring-emerald-500/30'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-950 flex items-center justify-center border border-slate-200/60 dark:border-slate-800">
                        {item.isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                        ) : item.error ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : item.compressedDataUrl ? (
                          <img
                            src={item.compressedDataUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <img
                            src={item.originalPreviewUrl}
                            alt={item.name}
                            className="w-full h-full object-cover opacity-60"
                          />
                        )}

                        {/* Batch checkbox */}
                        <button
                          type="button"
                          onClick={(e) => toggleSelectBatchItem(item.id, e)}
                          className="absolute top-1 left-1 p-0.5 rounded bg-slate-900/80 text-white hover:text-emerald-400 z-10 cursor-pointer"
                          title="Select for batch operations"
                        >
                          {isBatchChecked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-300" />
                          )}
                        </button>

                        {/* Format conversion transition badge */}
                        <div className="absolute top-1 right-1 flex items-center gap-0.5 px-1 py-0.2 rounded text-[8.5px] font-mono font-bold bg-slate-950/80 text-white shadow-xs">
                          <span>{item.originalFormatLabel}</span>
                          <span className="text-emerald-400">➔</span>
                          <span className="text-emerald-300">{getFormatLabel(item.targetFormat)}</span>
                        </div>

                        {/* Crop indicator badge */}
                        {item.cropRect && (
                          <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded text-[8.5px] font-bold font-mono bg-purple-600 text-white shadow-2xs flex items-center gap-0.5">
                            <Crop className="w-2.5 h-2.5" />
                            <span>{item.cropRect.aspect || 'crop'}</span>
                          </span>
                        )}

                        {/* Savings Badge */}
                        {!item.isProcessing && !item.error && itemSavings > 0 && (
                          <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded text-[9px] font-bold font-mono bg-emerald-600 text-white shadow-2xs">
                            -{itemSavings}%
                          </span>
                        )}
                      </div>

                      {/* Name & Size Info */}
                      <div className="mt-1 space-y-0.5">
                        <p className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200 truncate" title={item.name}>
                          {item.name}
                        </p>
                        <p className="text-[9.5px] font-mono text-slate-400 truncate">
                          {item.compressedSize > 0 ? formatFileSize(item.compressedSize) : 'Processing...'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* HERO PREVIEW CANVAS: INSPECT ACTIVE ITEM */}
            {activeItem && galleryViewMode !== 'grid' && galleryViewMode !== 'originals' && (
              <div className="space-y-3 pt-2">
                {/* Active Showcase Header & Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={items.length <= 1}
                      aria-label="Previous image"
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      title="Previous image"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={items.length <= 1}
                      aria-label="Next image"
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                      title="Next image"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white truncate block max-w-xs sm:max-w-md">
                          {activeItem.name}
                        </span>
                        {(renamePrefix || renameSuffix || activeItem.customName) && (
                          <span
                            className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 shrink-0 flex items-center gap-1"
                            title={`Download Name: ${getEffectiveItemFileName(activeItem, renamePrefix, renameSuffix)}`}
                          >
                            <Tag className="w-2.5 h-2.5" />
                            <span>➔ {getEffectiveItemFileName(activeItem, renamePrefix, renameSuffix)}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10.5px] text-slate-500 flex items-center gap-1.5">
                        {activeItem.naturalWidth && activeItem.naturalHeight
                          ? `${activeItem.naturalWidth}×${activeItem.naturalHeight}px ➔ ${activeItem.compressedWidth}×${activeItem.compressedHeight}px`
                          : ''}
                        {activeItem.cropRect && (
                          <span className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-0.5">
                            <Crop className="w-3 h-3" />
                            <span>Cropped ({activeItem.cropRect.aspect || 'custom'})</span>
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-2">
                    {/* CROP BUTTON */}
                    <button
                      type="button"
                      onClick={() => setCropModalItem(activeItem)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 cursor-pointer shadow-2xs"
                      title="Crop this image with aspect ratio or free-hand"
                    >
                      <Crop className="w-3.5 h-3.5" />
                      <span>{activeItem.cropRect ? 'Re-Crop' : 'Crop'}</span>
                    </button>

                    {/* Reset crop button if cropped */}
                    {activeItem.cropRect && (
                      <button
                        type="button"
                        onClick={() => handleResetCrop(activeItem.id)}
                        className="p-1 text-xs text-slate-400 hover:text-red-500 rounded cursor-pointer"
                        title="Revert crop to original"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Per-Item Quick Format Converter */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[10.5px] text-slate-400 font-semibold flex items-center gap-1">
                        <ArrowRightLeft className="w-3 h-3 text-emerald-500" />
                        Format:
                      </span>
                      {(['image/jpeg', 'image/png', 'image/webp'] as ImageMimeType[]).map((fmt) => {
                        const isCurrentFmt = activeItem.targetFormat === fmt;
                        const label = getFormatLabel(fmt);
                        return (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => recompressItem(activeItem, fmt)}
                            disabled={activeItem.isProcessing}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                              isCurrentFmt
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                            title={`Convert this photo to ${label}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Size comparison pill */}
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                      <span className="text-slate-400">Orig: {formatFileSize(activeItem.originalSize)}</span>
                      <span className="text-slate-300">➔</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        Comp: {formatFileSize(activeItem.compressedSize)}
                      </span>
                      {activeReduction > 0 && (
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1 py-0.2 rounded text-[10px]">
                          -{activeReduction}%
                        </span>
                      )}
                    </div>

                    {/* EXIF Privacy Status Button */}
                    <button
                      type="button"
                      onClick={() => setExifModalItem(activeItem)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer shadow-2xs ${
                        stripExif
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                      }`}
                      title={
                        stripExif
                          ? 'EXIF metadata stripped for privacy (Click to inspect original tags)'
                          : 'EXIF metadata retained (Click to inspect)'
                      }
                    >
                      {stripExif ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      )}
                      <span>{stripExif ? 'EXIF Stripped' : 'EXIF Retained'}</span>
                      {activeItem.exifData?.hasExif && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </button>

                    {/* Download this active image */}
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(activeItem)}
                      disabled={!activeItem.compressedDataUrl || activeItem.isProcessing}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download {getExtensionForMime(activeItem.targetFormat).toUpperCase()}</span>
                    </button>

                    {/* Inspect Fullscreen Modal button */}
                    <button
                      type="button"
                      onClick={() => setPreviewModalItem(activeItem)}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                      title="Enlarge inspection modal"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* SHOWCASE DISPLAY BASED ON VIEW MODE */}

                {/* 1. SLIDER MODE (Before/After Split) */}
                {galleryViewMode === 'slider' && (
                  <div className="relative aspect-video max-h-[460px] w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 select-none shadow-inner">
                    {activeItem.isProcessing ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        <span className="text-xs">
                          Processing & compressing {activeItem.name}...
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Converted/Compressed Image (Full Background) */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <img
                            src={activeItem.compressedDataUrl || activeItem.originalPreviewUrl}
                            alt="Converted preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        {/* Original Image (Clipped overlay on left) */}
                        <div
                          className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none"
                          style={{
                            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                          }}
                        >
                          <img
                            src={activeItem.originalPreviewUrl}
                            alt="Original preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        {/* Vertical Divider Line with Drag Knob */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none z-10"
                          style={{ left: `${sliderPosition}%` }}
                        >
                          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center border border-slate-300 text-[10px] font-bold">
                            ⇆
                          </div>
                        </div>

                        {/* Invisible Range Input for Smooth Dragging */}
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={sliderPosition}
                          onChange={(e) => setSliderPosition(parseFloat(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                          title="Drag left/right to compare Original vs Converted"
                        />

                        {/* Floating Labels */}
                        <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-bold tracking-wide uppercase pointer-events-none z-10 backdrop-blur-xs flex items-center gap-1.5">
                          <span className="text-slate-300">{activeItem.originalFormatLabel}</span>
                          <span>· Original ({formatFileSize(activeItem.originalSize)})</span>
                        </div>
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-bold tracking-wide uppercase pointer-events-none z-10 backdrop-blur-xs flex items-center gap-1.5">
                          <span className="text-emerald-200">{getFormatLabel(activeItem.targetFormat)}</span>
                          <span>· Converted ({formatFileSize(activeItem.compressedSize)}) · -{activeReduction}%</span>
                        </div>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/80 text-slate-200 text-[10px] pointer-events-none z-10 backdrop-blur-xs flex items-center gap-2">
                          <span>Drag slider to compare</span>
                          {activeItem.cropRect && (
                            <span className="text-purple-300 font-semibold">· Cropped ({activeItem.cropRect.aspect || 'custom'})</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 2. SIDE-BY-SIDE MODE */}
                {galleryViewMode === 'side-by-side' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                            Original Image
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                            {activeItem.originalFormatLabel}
                          </span>
                        </div>
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                          {formatFileSize(activeItem.originalSize)}
                        </span>
                      </div>
                      <div className="relative aspect-video max-h-72 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                        <img
                          src={activeItem.originalPreviewUrl}
                          alt="Original"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      {/* Original EXIF Info Footer */}
                      <div className="flex items-center justify-between text-[10.5px] pt-1 text-slate-500 border-t border-slate-200/60 dark:border-slate-800">
                        <span className="truncate">
                          {activeItem.exifData?.hasExif
                            ? `EXIF: ${activeItem.exifData.make || 'Camera'} ${activeItem.exifData.model || ''}${
                                activeItem.exifData.hasGps ? ' · 📍 GPS' : ''
                              }`
                            : 'No EXIF metadata detected'}
                        </span>
                        {activeItem.exifData?.hasExif && (
                          <button
                            type="button"
                            onClick={() => setExifModalItem(activeItem)}
                            className="text-emerald-600 dark:text-emerald-400 font-semibold underline hover:no-underline shrink-0 ml-1 cursor-pointer"
                          >
                            Details
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[10px]">
                            Processed Result
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                            {getFormatLabel(activeItem.targetFormat)}
                          </span>
                          {activeReduction > 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              -{activeReduction}%
                            </span>
                          )}
                          {activeItem.cropRect && (
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                              Cropped
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatFileSize(activeItem.compressedSize)}
                        </span>
                      </div>
                      <div className="relative aspect-video max-h-72 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                        {activeItem.isProcessing ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                            <span>Processing...</span>
                          </div>
                        ) : activeItem.compressedDataUrl ? (
                          <img
                            src={activeItem.compressedDataUrl}
                            alt="Converted"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : null}
                      </div>

                      {/* Processed EXIF Privacy Footer */}
                      <div className="flex items-center justify-between text-[10.5px] pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <span className="flex items-center gap-1 font-medium">
                          {stripExif ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>EXIF Stripped (Privacy Guard Active)</span>
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>EXIF Retained (Metadata Kept)</span>
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-[9.5px] text-slate-400">
                          {stripExif ? 'Clean' : 'Preserved'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. PROCESSED ONLY MODE */}
                {galleryViewMode === 'compressed-only' && (
                  <div className="relative aspect-video max-h-[460px] w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-inner">
                    {activeItem.isProcessing ? (
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                        <span>Rendering image...</span>
                      </div>
                    ) : activeItem.compressedDataUrl ? (
                      <>
                        <img
                          src={activeItem.compressedDataUrl}
                          alt="Processed"
                          className="max-h-full max-w-full object-contain"
                        />
                        <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-slate-900/80 backdrop-blur-xs text-white text-[10.5px] font-mono flex items-center gap-2">
                          <span>
                            Format: {getFormatLabel(activeItem.targetFormat)} (.{getExtensionForMime(activeItem.targetFormat)})
                          </span>
                          <span>·</span>
                          <span>
                            Quality: {activeItem.targetFormat === 'image/png' ? 'Lossless' : `${quality}%`}
                          </span>
                          <span>·</span>
                          <span>Size: {formatFileSize(activeItem.compressedSize)}</span>
                          {activeItem.cropRect && (
                            <>
                              <span>·</span>
                              <span className="text-purple-300">Cropped ({activeItem.cropRect.aspect || 'custom'})</span>
                            </>
                          )}
                        </div>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {/* 4. MOSAIC GRID VIEW */}
            {galleryViewMode === 'grid' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-2">
                {items.map((item, idx) => {
                  const isBatchChecked = selectedBatchIds.has(item.id);
                  const itemSavings =
                    item.compressedSize > 0
                      ? Math.max(
                          0,
                          Math.round(((item.originalSize - item.compressedSize) / item.originalSize) * 100)
                        )
                      : 0;

                  return (
                    <div
                      key={item.id}
                      className={`bg-slate-50 dark:bg-slate-950/60 rounded-xl border p-2.5 space-y-2 flex flex-col justify-between group transition-colors ${
                        isBatchChecked
                          ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          {/* Selection Checkbox & Index */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => toggleSelectBatchItem(item.id, e)}
                              className="text-slate-400 hover:text-emerald-500 cursor-pointer"
                              title="Toggle batch selection"
                            >
                              {isBatchChecked ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                            <span className="font-mono font-bold">#{idx + 1}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Format badge */}
                            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              ➔ {getFormatLabel(item.targetFormat)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-slate-400 hover:text-red-500 p-0.5 rounded cursor-pointer"
                              title="Remove"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div
                          onClick={() => {
                            setSelectedId(item.id);
                            setGalleryViewMode('slider');
                          }}
                          className="relative aspect-square w-full rounded-lg overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200/80 dark:border-slate-800 cursor-pointer"
                        >
                          {item.isProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                          ) : item.compressedDataUrl ? (
                            <img
                              src={item.compressedDataUrl}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <img
                              src={item.originalPreviewUrl}
                              alt={item.name}
                              className="w-full h-full object-cover opacity-60"
                            />
                          )}

                          {/* Crop badge */}
                          {item.cropRect && (
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-purple-600 text-white shadow-2xs flex items-center gap-0.5">
                              <Crop className="w-2.5 h-2.5" />
                              <span>{item.cropRect.aspect || 'crop'}</span>
                            </span>
                          )}

                          {!item.isProcessing && itemSavings > 0 && (
                            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold font-mono bg-emerald-600 text-white shadow-2xs">
                              -{itemSavings}%
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={item.name}>
                            {item.name}
                          </p>
                          {(renamePrefix || renameSuffix || item.customName) && (
                            <div className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-semibold truncate flex items-center gap-1 mt-0.5" title={getEffectiveItemFileName(item, renamePrefix, renameSuffix)}>
                              <Tag className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">➔ {getEffectiveItemFileName(item, renamePrefix, renameSuffix)}</span>
                            </div>
                          )}
                          <div className="text-[10px] font-mono space-y-0.5 pt-0.5">
                            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                              <span>Original:</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {item.naturalWidth && item.naturalHeight
                                  ? `${item.naturalWidth}×${item.naturalHeight}px · ${formatFileSize(item.originalSize)}`
                                  : formatFileSize(item.originalSize)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                              <span>Output:</span>
                              <span>
                                {item.compressedSize > 0
                                  ? `${item.compressedWidth}×${item.compressedHeight}px · ${formatFileSize(item.compressedSize)}`
                                  : 'Processing...'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Format Switcher Pills inside Card */}
                        <div className="flex items-center justify-between gap-1 pt-1">
                          <span className="text-[9.5px] text-slate-400">Format:</span>
                          <div className="flex items-center gap-1">
                            {(['image/jpeg', 'image/png', 'image/webp'] as ImageMimeType[]).map((fmt) => (
                              <button
                                key={fmt}
                                type="button"
                                onClick={() => recompressItem(item, fmt)}
                                className={`px-1 py-0.2 rounded text-[9px] font-mono font-bold cursor-pointer transition-colors ${
                                  item.targetFormat === fmt
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300'
                                }`}
                              >
                                {getFormatLabel(fmt)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-800 flex gap-1">
                        <button
                          type="button"
                          onClick={() => setCropModalItem(item)}
                          className="px-2 py-1 text-[11px] font-semibold rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 flex items-center justify-center gap-1 cursor-pointer"
                          title="Crop image"
                        >
                          <Crop className="w-3 h-3" />
                          <span>Crop</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(item.id);
                            setGalleryViewMode('slider');
                          }}
                          className="flex-1 py-1 text-[11px] font-medium rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-emerald-600" />
                          <span>Preview</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadSingle(item)}
                          disabled={!item.compressedDataUrl || item.isProcessing}
                          className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
                          title="Download single file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 5. UPLOADED ORIGINALS GRID VIEW (BEFORE COMPRESSION) */}
            {galleryViewMode === 'originals' && (
              <div className="space-y-4 pt-2">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Uploaded Images Queue (Pre-compression Specifications)
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                      {items.length} {items.length === 1 ? 'file' : 'files'} · Total: {formatFileSize(totalOriginalSize)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Review original dimensions & file sizes. Click "Remove" on any photo to exclude it from the batch.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map((item, idx) => {
                    const isBatchChecked = selectedBatchIds.has(item.id);
                    const ratio =
                      item.naturalWidth && item.naturalHeight
                        ? (item.naturalWidth / item.naturalHeight).toFixed(2)
                        : null;

                    return (
                      <div
                        key={item.id}
                        className={`bg-white dark:bg-slate-900 rounded-xl border p-3.5 space-y-3 flex flex-col justify-between shadow-xs transition-all hover:shadow-md ${
                          isBatchChecked
                            ? 'border-emerald-500 ring-1 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {/* Top row: Checkbox, Index & REMOVE BUTTON */}
                        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => toggleSelectBatchItem(item.id, e)}
                              className="text-slate-400 hover:text-emerald-500 cursor-pointer"
                              title="Toggle batch selection"
                            >
                              {isBatchChecked ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                            <span className="text-xs font-mono font-bold text-slate-500">#{idx + 1}</span>
                          </div>

                          {/* PROMINENT REMOVE FROM BATCH BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors cursor-pointer border border-red-200 dark:border-red-900/50"
                            title={`Remove ${item.name} from batch`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>

                        {/* Original Image Preview */}
                        <div
                          onClick={() => {
                            setSelectedId(item.id);
                            setGalleryViewMode('slider');
                          }}
                          className="relative aspect-video max-h-48 w-full rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-800 cursor-pointer group"
                        >
                          <img
                            src={item.originalPreviewUrl}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                          />

                          {/* Original Format Badge */}
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-900/80 text-white backdrop-blur-xs border border-white/20">
                            {item.originalFormatLabel}
                          </span>

                          {/* Crop indicator if cropped */}
                          {item.cropRect && (
                            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-purple-600 text-white shadow-xs flex items-center gap-1">
                              <Crop className="w-3 h-3" />
                              <span>Cropped ({item.cropRect.aspect || 'custom'})</span>
                            </span>
                          )}
                        </div>

                        {/* Original Specifications Box */}
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={item.name}>
                              {item.name}
                            </p>
                            {(renamePrefix || renameSuffix || item.customName) && (
                              <div className="text-[10.5px] font-mono text-teal-600 dark:text-teal-400 font-semibold truncate flex items-center gap-1 mt-0.5" title={getEffectiveItemFileName(item, renamePrefix, renameSuffix)}>
                                <Tag className="w-3 h-3 shrink-0" />
                                <span className="truncate">➔ {getEffectiveItemFileName(item, renamePrefix, renameSuffix)}</span>
                              </div>
                            )}
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2.5 space-y-1.5 text-xs border border-slate-200/80 dark:border-slate-700/80">
                            {/* Original File Size */}
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Original Size:</span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                                {formatFileSize(item.originalSize)}
                              </span>
                            </div>

                            {/* Original Dimensions */}
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">Original Dimensions:</span>
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                {item.naturalWidth && item.naturalHeight
                                  ? `${item.naturalWidth} × ${item.naturalHeight} px`
                                  : 'Reading dimensions...'}
                              </span>
                            </div>

                            {/* Aspect Ratio */}
                            {ratio && (
                              <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-0.5 border-t border-slate-200/50 dark:border-slate-700/50">
                                <span>Aspect Ratio:</span>
                                <span className="font-mono font-medium">{ratio}:1</span>
                              </div>
                            )}
                          </div>

                          {/* Compression Status / Result */}
                          <div className="flex items-center justify-between text-[11px] pt-1">
                            <span className="text-slate-400">Compression:</span>
                            {item.isProcessing ? (
                              <span className="inline-flex items-center gap-1 text-amber-500 font-medium">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Compressing...
                              </span>
                            ) : item.error ? (
                              <span className="text-red-500 font-medium">Failed</span>
                            ) : item.compressedSize > 0 ? (
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {formatFileSize(item.compressedSize)} (-
                                {Math.round(((item.originalSize - item.compressedSize) / item.originalSize) * 100)}%)
                              </span>
                            ) : (
                              <span className="text-slate-400">Ready</span>
                            )}
                          </div>

                          {/* EXIF Metadata Privacy Status */}
                          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                            {item.exifData?.hasExif ? (
                              <button
                                type="button"
                                onClick={() => setExifModalItem(item)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10.5px] border transition-colors cursor-pointer ${
                                  stripExif
                                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                                    : 'bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                                }`}
                                title="Click to view full EXIF metadata (GPS, Camera, Date)"
                              >
                                <span className="flex items-center gap-1.5 font-semibold truncate">
                                  {stripExif ? (
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  ) : (
                                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                  )}
                                  <span className="truncate">
                                    {stripExif ? 'EXIF Stripped' : 'EXIF Retained'}
                                  </span>
                                </span>
                                <span className="text-[9.5px] font-bold underline shrink-0 ml-1">
                                  Inspect ({item.exifData.rawTagsCount} tags)
                                </span>
                              </button>
                            ) : (
                              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 py-0.5">
                                <span className="flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-emerald-500/70" />
                                  <span>No EXIF tags detected</span>
                                </span>
                                <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-semibold">Clean</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCropModalItem(item)}
                            className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Crop className="w-3.5 h-3.5" />
                            <span>Crop</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(item.id);
                              setGalleryViewMode('slider');
                            }}
                            className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Inspect</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Crop Modal */}
      <ImageCropModal
        isOpen={!!cropModalItem}
        item={cropModalItem}
        onClose={() => setCropModalItem(null)}
        onApplyCrop={handleApplyCrop}
        onResetCrop={handleResetCrop}
      />

      {/* Fullscreen Comparison & Conversion Lightbox Modal */}
      {previewModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-md">
                  {previewModalItem.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Original: {formatFileSize(previewModalItem.originalSize)} ({previewModalItem.originalFormatLabel}) ➔ Converted:{' '}
                  {formatFileSize(previewModalItem.compressedSize)} ({getFormatLabel(previewModalItem.targetFormat)})
                  {previewModalItem.compressedSize > 0 &&
                    ` (${Math.round(
                      ((previewModalItem.originalSize - previewModalItem.compressedSize) /
                        previewModalItem.originalSize) *
                        100
                    )}% smaller)`}
                  {previewModalItem.cropRect && ` · Cropped (${previewModalItem.cropRect.aspect || 'custom'})`}
                </p>
              </div>

              {/* Actions in Modal */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCropModalItem(previewModalItem);
                    setPreviewModalItem(null);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1 cursor-pointer"
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span>Crop</span>
                </button>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
                  {(['image/jpeg', 'image/png', 'image/webp'] as ImageMimeType[]).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => {
                        recompressItem(previewModalItem, fmt);
                        setPreviewModalItem((prev) => (prev ? { ...prev, targetFormat: fmt } : null));
                      }}
                      className={`px-2 py-0.5 rounded font-mono font-bold cursor-pointer transition-colors ${
                        previewModalItem.targetFormat === fmt
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {getFormatLabel(fmt)}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setExifModalItem(previewModalItem)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1.5 cursor-pointer transition-colors ${
                    stripExif
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                  }`}
                  title="Inspect EXIF metadata and privacy status"
                >
                  {stripExif ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  )}
                  <span>EXIF Privacy</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewModalItem(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950/50">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Original Image ({previewModalItem.originalFormatLabel} · {formatFileSize(previewModalItem.originalSize)})
                </span>
                <div className="aspect-video bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-800">
                  <img
                    src={previewModalItem.originalPreviewUrl}
                    alt="Original"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Processed Result ({getFormatLabel(previewModalItem.targetFormat)} · {formatFileSize(previewModalItem.compressedSize)})
                  </span>
                  <div className="flex items-center gap-1.5">
                    {previewModalItem.cropRect && (
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                        Cropped ({previewModalItem.cropRect.aspect || 'custom'})
                      </span>
                    )}
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      .{getExtensionForMime(previewModalItem.targetFormat)}
                    </span>
                  </div>
                </div>
                <div className="aspect-video bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-800">
                  {previewModalItem.compressedDataUrl && (
                    <img
                      src={previewModalItem.compressedDataUrl}
                      alt="Converted"
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setPreviewModalItem(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDownloadSingle(previewModalItem);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download ({getEffectiveItemFileName(previewModalItem, renamePrefix, renameSuffix)})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXIF Metadata & Privacy Inspection Modal */}
      <ExifModal
        item={exifModalItem}
        stripExifEnabled={stripExif}
        onClose={() => setExifModalItem(null)}
        onToggleStripExif={() => setStripExif((prev) => !prev)}
      />

      {/* Bulk Rename Modal */}
      <BulkRenameModal
        isOpen={isBulkRenameOpen}
        items={items}
        selectedBatchIds={selectedBatchIds}
        initialPrefix={renamePrefix}
        initialSuffix={renameSuffix}
        onClose={() => setIsBulkRenameOpen(false)}
        onApplyRename={handleApplyBulkRename}
        onResetAllNames={handleResetAllNames}
      />
    </div>
  );
};
