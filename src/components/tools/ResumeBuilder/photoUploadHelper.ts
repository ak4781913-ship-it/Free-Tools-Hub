/**
 * Client-Side Resume Profile Photo Optimizer
 * Safely compresses and crops images to square/circle proportions (max 400x400)
 * keeping file sizes ~25-45 KB so localStorage and PDF generation remain fast and quota-safe.
 */

export interface ProcessedPhotoResult {
  dataUrl: string;
  width: number;
  height: number;
  fileSizeBytes: number;
}

const MAX_IMAGE_DIMENSION = 400; // 400x400 max resolution for CV photos (plenty for high-DPI print)
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB max input file limit

export function validatePhotoFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const ext = file.name.split('.').pop()?.toLowerCase();
  const isValidType = validTypes.includes(file.type.toLowerCase()) || ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '');

  if (!isValidType) {
    return {
      valid: false,
      error: 'Unsupported format. Please upload a JPG, JPEG, PNG, or WebP image.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMb} MB). Maximum supported image size is 5 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Loads a File into an HTMLImageElement in memory
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Corrupted or unreadable image file.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file from your device.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Center-crops and resizes an image to square 1:1 aspect ratio at high quality JPEG
 */
export async function processProfilePhoto(file: File): Promise<ProcessedPhotoResult> {
  const validation = validatePhotoFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file');
  }

  const img = await loadImageFromFile(file);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available on this browser.');
  }

  // Calculate center square crop (1:1 aspect ratio)
  const minSide = Math.min(img.width, img.height);
  const cropX = (img.width - minSide) / 2;
  const cropY = (img.height - minSide) / 2;

  // Output target size capped at MAX_IMAGE_DIMENSION
  const targetSize = Math.min(minSide, MAX_IMAGE_DIMENSION);
  canvas.width = targetSize;
  canvas.height = targetSize;

  // Smooth image scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw center square crop
  ctx.drawImage(img, cropX, cropY, minSide, minSide, 0, 0, targetSize, targetSize);

  // Compress to JPEG data URI with 0.88 quality
  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
  const fileSizeBytes = Math.round((dataUrl.length * 3) / 4);

  return {
    dataUrl,
    width: targetSize,
    height: targetSize,
    fileSizeBytes,
  };
}

/**
 * Detects the image MIME type from a data URI or Base64 string
 */
export function detectImageMime(dataUri: string): string {
  if (!dataUri || typeof dataUri !== 'string') return '';
  const match = dataUri.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,/i);
  if (match) {
    return `image/${match[1].toLowerCase()}`;
  }
  if (dataUri.startsWith('/9j/')) return 'image/jpeg';
  if (dataUri.startsWith('iVBORw0KGgo')) return 'image/png';
  if (dataUri.startsWith('UklGR')) return 'image/webp';
  return 'image/jpeg';
}

/**
 * Normalizes and validates a photo data URI for safe PDF embedding.
 * Supports JPEG, PNG, and WebP data URIs safely.
 * Detects actual MIME type, converts unsupported formats to standard JPEG/PNG in browser Canvas,
 * and gracefully handles malformed/corrupted image data without crashing.
 * Preserves the original resume data.
 */
export async function sanitizePhotoForPdf(
  dataUri: string
): Promise<{ dataUrl: string; format: 'JPEG' | 'PNG' | 'WEBP' } | null> {
  if (!dataUri || typeof dataUri !== 'string') return null;

  const cleanUri = dataUri.trim();
  if (
    !cleanUri.startsWith('data:image/') &&
    !cleanUri.startsWith('/9j/') &&
    !cleanUri.startsWith('iVBORw0KGgo') &&
    !cleanUri.startsWith('UklGR')
  ) {
    return null;
  }

  // Normalize prefix if raw base64
  let normalizedUri = cleanUri;
  if (!normalizedUri.startsWith('data:')) {
    if (normalizedUri.startsWith('/9j/')) normalizedUri = `data:image/jpeg;base64,${normalizedUri}`;
    else if (normalizedUri.startsWith('iVBORw0KGgo')) normalizedUri = `data:image/png;base64,${normalizedUri}`;
    else if (normalizedUri.startsWith('UklGR')) normalizedUri = `data:image/webp;base64,${normalizedUri}`;
    else normalizedUri = `data:image/jpeg;base64,${normalizedUri}`;
  }

  const mime = detectImageMime(normalizedUri);
  let format: 'JPEG' | 'PNG' | 'WEBP' = 'JPEG';
  if (mime === 'image/png') format = 'PNG';
  else if (mime === 'image/webp') format = 'WEBP';

  // In browser, verify decodability and convert WebP or incompatible types to safe PNG/JPEG
  if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof Image !== 'undefined') {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          // If format is WebP or an unusual format, rasterize to standard high-res PNG for 100% viewer compatibility
          if (format === 'WEBP' || (format !== 'JPEG' && format !== 'PNG')) {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width || 400;
            canvas.height = img.naturalHeight || img.height || 400;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              resolve({ dataUrl, format: 'PNG' });
              return;
            }
          }
          resolve({ dataUrl: normalizedUri, format });
        } catch {
          resolve({ dataUrl: normalizedUri, format });
        }
      };
      img.onerror = () => {
        console.warn('[ResumePDF] Malformed or corrupted image data provided. Skipping photo embedding.');
        resolve(null);
      };
      img.src = normalizedUri;
    });
  }

  // Node.js or SSR environment fallback
  return { dataUrl: normalizedUri, format };
}
