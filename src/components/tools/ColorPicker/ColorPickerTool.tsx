import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Pipette,
  Copy,
  CheckCircle,
  Upload,
  Download,
  RotateCcw,
  Sparkles,
  Sliders,
  Palette,
  Image as ImageIcon,
  Check,
  ZoomIn,
  ShieldCheck,
  Layers,
  Sun,
  Moon,
  BookmarkPlus,
  Trash2,
  History,
  Clock,
  Search,
  X,
} from 'lucide-react';

// Math color conversion utilities
interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface HSV {
  h: number;
  s: number;
  v: number;
}

interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

const hexToRgb = (hex: string): RGB | null => {
  let clean = hex.replace(/^#/, '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return null;
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

const rgbToHsl = (r: number, g: number, b: number): HSL => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const hslToRgb = (h: number, s: number, l: number): RGB => {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

const rgbToHsv = (r: number, g: number, b: number): HSV => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
};

const hsvToRgb = (h: number, s: number, v: number): RGB => {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 100) / 100;
  v = clamp(v, 0, 100) / 100;

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

const rgbToCmyk = (r: number, g: number, b: number): CMYK => {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const k = 1 - Math.max(rNorm, gNorm, bNorm);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }
  const c = (1 - rNorm - k) / (1 - k);
  const m = (1 - gNorm - k) / (1 - k);
  const y = (1 - bNorm - k) / (1 - k);
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
};

// WCAG Luminance & Contrast
const getLuminance = (r: number, g: number, b: number) => {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

const getContrastRatio = (lum1: number, lum2: number) => {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
};

const getHexTextColor = (hex: string): string => {
  const rgbObj = hexToRgb(hex) || { r: 0, g: 0, b: 0 };
  return getLuminance(rgbObj.r, rgbObj.g, rgbObj.b) > 0.4 ? '#000000' : '#ffffff';
};

// Default sample palette
const DEFAULT_SAVED_COLORS = [
  '#4F46E5',
  '#06B6D4',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#8B5CF6',
  '#1E293B',
];

export interface RecentColorItem {
  id: string;
  hex: string;
  rgb: string;
  hsl: string;
  timestamp: number;
}

const DEFAULT_RECENT_COLORS: RecentColorItem[] = [
  { id: '1', hex: '#4F46E5', rgb: 'rgb(79, 70, 229)', hsl: 'hsl(243, 75%, 59%)', timestamp: Date.now() - 30000 },
  { id: '2', hex: '#06B6D4', rgb: 'rgb(6, 182, 212)', hsl: 'hsl(189, 94%, 43%)', timestamp: Date.now() - 90000 },
  { id: '3', hex: '#10B981', rgb: 'rgb(16, 185, 129)', hsl: 'hsl(160, 84%, 39%)', timestamp: Date.now() - 150000 },
  { id: '4', hex: '#F59E0B', rgb: 'rgb(245, 158, 11)', hsl: 'hsl(38, 92%, 50%)', timestamp: Date.now() - 210000 },
  { id: '5', hex: '#EC4899', rgb: 'rgb(236, 72, 153)', hsl: 'hsl(330, 81%, 60%)', timestamp: Date.now() - 270000 },
];

const formatTimeAgo = (timestamp: number, isUrdu: boolean): string => {
  const diffSec = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 45) return isUrdu ? 'ابھی' : 'Just now';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return isUrdu ? `${mins} منٹ پہلے` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return isUrdu ? `${hours} گھنٹے پہلے` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return isUrdu ? `${days} دن پہلے` : `${days}d ago`;
};

// Sample images for testing the image picker
const SAMPLE_IMAGE_URL =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300">
    <defs>
      <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#4F46E5" />
        <stop offset="25%" stop-color="#06B6D4" />
        <stop offset="50%" stop-color="#10B981" />
        <stop offset="75%" stop-color="#F59E0B" />
        <stop offset="100%" stop-color="#EF4444" />
      </linearGradient>
      <radialGradient id="r1" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="50%" stop-color="#ec4899" />
        <stop offset="100%" stop-color="#3b82f6" />
      </radialGradient>
    </defs>
    <rect width="600" height="300" fill="url(#g1)" />
    <circle cx="150" cy="150" r="80" fill="url(#r1)" />
    <circle cx="450" cy="150" r="70" fill="#1e1b4b" opacity="0.85" />
    <rect x="360" y="80" width="180" height="140" rx="20" fill="#fbbf24" opacity="0.9" />
    <text x="300" y="155" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle">Pick any color from here!</text>
  </svg>`);

export const ColorPickerTool: React.FC = () => {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  // Core color state in RGB (single source of truth)
  const [rgb, setRgb] = useState<RGB>({ r: 79, g: 70, b: 229 }); // Indigo-600

  // Inputs string representation for manual typing
  const [hexInput, setHexInput] = useState('#4F46E5');
  const [rInput, setRInput] = useState('79');
  const [gInput, setGInput] = useState('70');
  const [bInput, setBInput] = useState('229');
  const [hInput, setHInput] = useState('243');
  const [sInput, setSInput] = useState('75');
  const [lInput, setLInput] = useState('59');

  // Copy feedback tracking
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Palette History / Saved Colors
  const [savedColors, setSavedColors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('freetools_color_palette');
      return saved ? JSON.parse(saved) : DEFAULT_SAVED_COLORS;
    } catch {
      return DEFAULT_SAVED_COLORS;
    }
  });

  // Recent Colors State
  const [recentColors, setRecentColors] = useState<RecentColorItem[]>(() => {
    try {
      const saved = localStorage.getItem('freetools_recent_colors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return DEFAULT_RECENT_COLORS;
    } catch {
      return DEFAULT_RECENT_COLORS;
    }
  });

  const [searchRecentQuery, setSearchRecentQuery] = useState('');

  // Image Eyedropper state
  const [imageSrc, setImageSrc] = useState<string>(SAMPLE_IMAGE_URL);
  const [isEyedropperActive, setIsEyedropperActive] = useState(false);
  const [hoverPixel, setHoverPixel] = useState<{
    x: number;
    y: number;
    hex: string;
    rgb: RGB;
  } | null>(null);
  const [imageFileName, setImageFileName] = useState('sample-spectrum.svg');
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);

  // Synchronize derived values when RGB changes
  const hex = useMemo(() => rgbToHex(rgb.r, rgb.g, rgb.b), [rgb]);
  const hsl = useMemo(() => rgbToHsl(rgb.r, rgb.g, rgb.b), [rgb]);
  const hsv = useMemo(() => rgbToHsv(rgb.r, rgb.g, rgb.b), [rgb]);
  const cmyk = useMemo(() => rgbToCmyk(rgb.r, rgb.g, rgb.b), [rgb]);

  // Keep manual text inputs aligned with current RGB
  useEffect(() => {
    setHexInput(hex);
    setRInput(rgb.r.toString());
    setGInput(rgb.g.toString());
    setBInput(rgb.b.toString());
    setHInput(hsl.h.toString());
    setSInput(hsl.s.toString());
    setLInput(hsl.l.toString());
  }, [hex, rgb, hsl]);

  // Save palette changes
  useEffect(() => {
    try {
      localStorage.setItem('freetools_color_palette', JSON.stringify(savedColors));
    } catch {
      // ignore
    }
  }, [savedColors]);

  // Save recent colors changes
  useEffect(() => {
    try {
      localStorage.setItem('freetools_recent_colors', JSON.stringify(recentColors));
    } catch {
      // ignore
    }
  }, [recentColors]);

  // Copy handler with visual feedback
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Add a color to the recent list with automatic deduplication & limit
  const addToRecentColors = useCallback((hexColor: string) => {
    const cleanHex = hexColor.trim().toUpperCase();
    if (!/^#[0-9A-F]{6}$/i.test(cleanHex)) return;
    const parsedRgb = hexToRgb(cleanHex);
    if (!parsedRgb) return;
    const parsedHsl = rgbToHsl(parsedRgb.r, parsedRgb.g, parsedRgb.b);

    setRecentColors((prev) => {
      // Avoid redundant work if top item is identical
      if (prev.length > 0 && prev[0].hex.toUpperCase() === cleanHex) {
        return prev;
      }
      const filtered = prev.filter((item) => item.hex.toUpperCase() !== cleanHex);
      const newItem: RecentColorItem = {
        id: `${cleanHex}-${Date.now()}`,
        hex: cleanHex,
        rgb: `rgb(${parsedRgb.r}, ${parsedRgb.g}, ${parsedRgb.b})`,
        hsl: `hsl(${parsedHsl.h}, ${parsedHsl.s}%, ${parsedHsl.l}%)`,
        timestamp: Date.now(),
      };
      return [newItem, ...filtered.slice(0, 24)];
    });
  }, []);

  // Debounced effect: capture active color into recents when user rests on a color
  useEffect(() => {
    if (!hex) return;
    const timer = setTimeout(() => {
      addToRecentColors(hex);
    }, 550);
    return () => clearTimeout(timer);
  }, [hex, addToRecentColors]);

  // Re-select a recent color
  const handleSelectRecentColor = (targetHex: string) => {
    const parsed = hexToRgb(targetHex);
    if (parsed) {
      setRgb(parsed);
      addToRecentColors(targetHex);
    }
  };

  // Remove a color from recents
  const handleRemoveRecentColor = (targetHex: string) => {
    setRecentColors((prev) =>
      prev.filter((item) => item.hex.toUpperCase() !== targetHex.toUpperCase())
    );
  };

  // Clear all recents
  const handleClearRecents = () => {
    setRecentColors([]);
  };

  // Copy all recent colors as comma-separated HEX string
  const handleCopyAllRecents = () => {
    if (recentColors.length === 0) return;
    const text = recentColors.map((c) => c.hex).join(', ');
    handleCopy(text, 'recent-copy-all');
  };

  // Save specific color to persistent palette
  const handleSaveSpecificColor = (c: string) => {
    const upper = c.toUpperCase();
    if (!savedColors.map((s) => s.toUpperCase()).includes(upper)) {
      setSavedColors([upper, ...savedColors.slice(0, 19)]);
    }
  };

  // Save all recents to palette
  const handleSaveAllRecentsToPalette = () => {
    const existing = new Set(savedColors.map((s) => s.toUpperCase()));
    const toAdd = recentColors
      .map((r) => r.hex.toUpperCase())
      .filter((h) => !existing.has(h));
    setSavedColors([...toAdd, ...savedColors].slice(0, 24));
  };

  // Filtered recent colors for search input
  const filteredRecentColors = useMemo(() => {
    if (!searchRecentQuery.trim()) return recentColors;
    const q = searchRecentQuery.trim().toLowerCase();
    return recentColors.filter(
      (item) =>
        item.hex.toLowerCase().includes(q) ||
        item.rgb.toLowerCase().includes(q) ||
        item.hsl.toLowerCase().includes(q)
    );
  }, [recentColors, searchRecentQuery]);

  // Change from HEX input
  const handleHexChange = (value: string) => {
    setHexInput(value);
    const parsed = hexToRgb(value);
    if (parsed) {
      setRgb(parsed);
    }
  };

  // Change from RGB inputs
  const handleRgbFieldChange = (channel: 'r' | 'g' | 'b', valStr: string) => {
    if (channel === 'r') setRInput(valStr);
    if (channel === 'g') setGInput(valStr);
    if (channel === 'b') setBInput(valStr);

    const val = parseInt(valStr, 10);
    if (!isNaN(val)) {
      const clamped = clamp(val, 0, 255);
      setRgb((prev) => ({
        ...prev,
        [channel]: clamped,
      }));
    }
  };

  // Change from HSL inputs
  const handleHslFieldChange = (channel: 'h' | 's' | 'l', valStr: string) => {
    if (channel === 'h') setHInput(valStr);
    if (channel === 's') setSInput(valStr);
    if (channel === 'l') setLInput(valStr);

    const hVal = channel === 'h' ? parseInt(valStr, 10) : hsl.h;
    const sVal = channel === 's' ? parseInt(valStr, 10) : hsl.s;
    const lVal = channel === 'l' ? parseInt(valStr, 10) : hsl.l;

    if (!isNaN(hVal) && !isNaN(sVal) && !isNaN(lVal)) {
      const converted = hslToRgb(hVal, sVal, lVal);
      setRgb(converted);
    }
  };

  // Canvas Image rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.naturalWidth || 600;
      canvas.height = img.naturalHeight || 300;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Canvas mouse move / eyedropper hover
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
      try {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const sampledRgb: RGB = { r: pixel[0], g: pixel[1], b: pixel[2] };
        const sampledHex = rgbToHex(sampledRgb.r, sampledRgb.g, sampledRgb.b);
        setHoverPixel({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          hex: sampledHex,
          rgb: sampledRgb,
        });
      } catch {
        // canvas tainted or off-bounds
      }
    }
  };

  // Canvas click to pick color
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const sampledRgb: RGB = { r: pixel[0], g: pixel[1], b: pixel[2] };
      const sampledHex = rgbToHex(sampledRgb.r, sampledRgb.g, sampledRgb.b);
      setRgb(sampledRgb);
      addToRecentColors(sampledHex);
    } catch {
      // ignore
    }
  };

  // Native Browser EyeDropper API (Chromium / Edge / Opera)
  const handleNativeEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          const parsed = hexToRgb(result.sRGBHex);
          if (parsed) {
            setRgb(parsed);
            addToRecentColors(result.sRGBHex);
          }
        }
      } catch {
        // User cancelled or not supported
      }
    } else {
      // Toggle canvas inspector mode
      setIsEyedropperActive((prev) => !prev);
    }
  };

  // Image Upload handler
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageUploadError(
        isUrdu
          ? 'براہ کرم صرف درست تصویری فائل (PNG, JPG, WebP, SVG) منتخب کریں۔'
          : 'Please select a valid image file (PNG, JPG, WebP, GIF, or SVG).'
      );
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setImageUploadError(
        isUrdu
          ? 'تصویر کا سائز 20MB سے کم ہونا چاہیے۔'
          : 'Image exceeds the 20 MB browser canvas limit. Please upload a smaller image.'
      );
      return;
    }
    setImageUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const res = e.target?.result as string;
      setImageSrc(res);
      setImageFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  // Color harmonies & color generation
  const harmonies = useMemo(() => {
    const { h, s, l } = hsl;
    const makeHex = (deg: number) => {
      const normH = ((deg % 360) + 360) % 360;
      const c = hslToRgb(normH, s, l);
      return rgbToHex(c.r, c.g, c.b);
    };

    return {
      complementary: [hex, makeHex(h + 180)],
      analogous: [makeHex(h - 30), hex, makeHex(h + 30)],
      triadic: [hex, makeHex(h + 120), makeHex(h + 240)],
      tetradic: [hex, makeHex(h + 90), makeHex(h + 180), makeHex(h + 270)],
      splitComplementary: [hex, makeHex(h + 150), makeHex(h + 210)],
    };
  }, [hsl, hex]);

  // Shades & Tints
  const shadesAndTints = useMemo(() => {
    const tints: string[] = [];
    const shades: string[] = [];

    // Tints (mixing with white, increasing lightness)
    for (let i = 1; i <= 5; i++) {
      const newL = clamp(hsl.l + (100 - hsl.l) * (i / 6), 0, 100);
      const c = hslToRgb(hsl.h, hsl.s, newL);
      tints.push(rgbToHex(c.r, c.g, c.b));
    }

    // Shades (mixing with black, decreasing lightness)
    for (let i = 1; i <= 5; i++) {
      const newL = clamp(hsl.l * (1 - i / 6), 0, 100);
      const c = hslToRgb(hsl.h, hsl.s, newL);
      shades.push(rgbToHex(c.r, c.g, c.b));
    }

    return { tints, shades };
  }, [hsl]);

  // Contrast calculations
  const contrastStats = useMemo(() => {
    const currentLum = getLuminance(rgb.r, rgb.g, rgb.b);
    const whiteLum = getLuminance(255, 255, 255);
    const blackLum = getLuminance(0, 0, 0);

    const onWhite = getContrastRatio(currentLum, whiteLum);
    const onBlack = getContrastRatio(currentLum, blackLum);

    return {
      onWhite: {
        ratio: Number(onWhite.toFixed(2)),
        aaNormal: onWhite >= 4.5,
        aaLarge: onWhite >= 3.0,
        aaaNormal: onWhite >= 7.0,
      },
      onBlack: {
        ratio: Number(onBlack.toFixed(2)),
        aaNormal: onBlack >= 4.5,
        aaLarge: onBlack >= 3.0,
        aaaNormal: onBlack >= 7.0,
      },
    };
  }, [rgb]);

  // Add current color to saved palette
  const handleSaveColor = () => {
    if (!savedColors.includes(hex)) {
      setSavedColors([hex, ...savedColors.slice(0, 19)]);
    }
  };

  const handleRemoveColor = (c: string) => {
    setSavedColors(savedColors.filter((item) => item !== c));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-colors"
              style={{
                backgroundColor: hex,
                boxShadow: `0 10px 25px -5px ${hex}66`,
              }}
            >
              <Pipette className="w-6 h-6 drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isUrdu ? 'ایڈوانسڈ کلر پکر اور کنورٹر' : 'Advanced Color Picker'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {isUrdu
                  ? 'تصویر سے رنگ منتخب کریں یا HEX، RGB، اور HSL کے درمیان براہ راست تبدیل کریں۔'
                  : 'Pick colors from images, convert HEX / RGB / HSL / CMYK in real-time & check WCAG contrast.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {'EyeDropper' in window && (
              <button
                onClick={handleNativeEyeDropper}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
              >
                <Pipette className="w-3.5 h-3.5" />
                <span>{isUrdu ? 'اسکرین سے رنگ لیں' : 'Eyedropper Screen'}</span>
              </button>
            )}
            <button
              onClick={handleSaveColor}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'محفوظ کریں' : 'Save to Palette'}</span>
            </button>
            <a
              href="#recent-colors-sidebar"
              className="inline-flex xl:hidden items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800/60 transition-colors"
            >
              <History className="w-3.5 h-3.5 text-indigo-500" />
              <span>{isUrdu ? `حالیہ (${recentColors.length})` : `Recents (${recentColors.length})`}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Workspace: Main Studio (8 cols) + Sticky Recent Colors Sidebar (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start mb-8">
        {/* Main Studio Panels (8 cols on xl) */}
        <div className="xl:col-span-8 space-y-8">
          {/* Main Grid: Picker & Sliders (Left 7) + Values & Contrast (Right 5) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Interactive Swatch & Sliders (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
          {/* Hero Color Preview Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isUrdu ? 'فعال رنگ' : 'Active Color Preview'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                {hex}
              </span>
            </div>

            {/* Giant Preview Box */}
            <div
              className="h-32 sm:h-40 rounded-xl shadow-inner relative flex items-center justify-center transition-colors border border-black/5 dark:border-white/10"
              style={{ backgroundColor: hex }}
            >
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-800/50 flex items-center gap-3">
                <span className="font-mono font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  {hex}
                </span>
                <button
                  onClick={() => handleCopy(hex, 'hero-hex')}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                  title="Copy HEX"
                >
                  {copiedKey === 'hero-hex' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Interactive Sliders: Hue, Saturation, Lightness */}
            <div className="space-y-4 pt-2">
              {/* Hue Slider */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  <span>Hue (رنگ کی قسم)</span>
                  <span className="font-mono">{hsl.h}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={hsl.h}
                  onChange={(e) => handleHslFieldChange('h', e.target.value)}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background:
                      'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                  }}
                />
              </div>

              {/* Saturation Slider */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  <span>Saturation (شدت / گہرا پن)</span>
                  <span className="font-mono">{hsl.s}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={hsl.s}
                  onChange={(e) => handleHslFieldChange('s', e.target.value)}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, hsl(${hsl.h}, 0%, ${hsl.l}%), hsl(${hsl.h}, 100%, ${hsl.l}%))`,
                  }}
                />
              </div>

              {/* Lightness Slider */}
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  <span>Lightness (روشنی)</span>
                  <span className="font-mono">{hsl.l}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={hsl.l}
                  onChange={(e) => handleHslFieldChange('l', e.target.value)}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #000000, hsl(${hsl.h}, ${hsl.s}%, 50%), #ffffff)`,
                  }}
                />
              </div>

              {/* Native Color Input helper */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-xs text-slate-500">
                  {isUrdu ? 'سسٹم کلر وہیل:' : 'Native OS Palette Picker:'}
                </span>
                <input
                  type="color"
                  value={hex}
                  onChange={(e) => handleHexChange(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent p-0.5"
                />
              </div>
            </div>
          </div>

          {/* Color Harmonies & Palettes */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-500" />
              <span>{isUrdu ? 'رنگوں کی ہم آہنگی (Color Harmonies)' : 'Color Harmonies'}</span>
            </h3>

            <div className="space-y-4">
              {/* Complementary */}
              <div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex justify-between">
                  <span>Complementary (مخالف / متضاد)</span>
                  <span className="text-[11px] text-slate-400 font-mono">180°</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {harmonies.complementary.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectRecentColor(c)}
                      className="group h-10 rounded-lg flex items-center justify-between px-3 text-xs font-mono font-bold shadow-sm transition-transform active:scale-95"
                      style={{
                        backgroundColor: c,
                        color: getHexTextColor(c),
                      }}
                    >
                      <span>{c}</span>
                      <span className="opacity-0 group-hover:opacity-100 text-[10px]">Use</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Analogous */}
              <div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex justify-between">
                  <span>Analogous (ہم رنگ)</span>
                  <span className="text-[11px] text-slate-400 font-mono">±30°</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {harmonies.analogous.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectRecentColor(c)}
                      className="group h-10 rounded-lg flex items-center justify-between px-2.5 text-xs font-mono font-bold shadow-sm transition-transform active:scale-95"
                      style={{
                        backgroundColor: c,
                        color: getHexTextColor(c),
                      }}
                    >
                      <span className="truncate">{c}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Triadic */}
              <div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex justify-between">
                  <span>Triadic (سہ رخی)</span>
                  <span className="text-[11px] text-slate-400 font-mono">120°</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {harmonies.triadic.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectRecentColor(c)}
                      className="group h-10 rounded-lg flex items-center justify-between px-2.5 text-xs font-mono font-bold shadow-sm transition-transform active:scale-95"
                      style={{
                        backgroundColor: c,
                        color: getHexTextColor(c),
                      }}
                    >
                      <span className="truncate">{c}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tints & Shades Swatches */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  <span>Tints & Shades (ہلکے اور گہرے شیڈز)</span>
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {[...[...shadesAndTints.shades].reverse(), hex, ...shadesAndTints.tints].map(
                    (colorItem, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectRecentColor(colorItem)}
                        className={`flex-1 min-w-[28px] h-9 rounded transition-transform hover:scale-110 relative ${
                          colorItem === hex ? 'ring-2 ring-indigo-500 scale-105 z-10' : ''
                        }`}
                        style={{ backgroundColor: colorItem }}
                        title={colorItem}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Exact Formats Conversion & WCAG Contrast (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Format Converters Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>{isUrdu ? 'تمام فارمیٹس (Real-Time Formats)' : 'Color Code Formats'}</span>
            </h3>

            {/* HEX Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">HEX</label>
                <button
                  onClick={() => handleCopy(hex, 'copy-hex')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
                >
                  {copiedKey === 'copy-hex' ? (
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === 'copy-hex' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#000000"
                className="w-full px-3 py-2 font-mono text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
              />
            </div>

            {/* RGB Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  RGB (Red, Green, Blue)
                </label>
                <button
                  onClick={() => handleCopy(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'copy-rgb')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
                >
                  {copiedKey === 'copy-rgb' ? (
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === 'copy-rgb' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-[10px] font-bold text-rose-500">
                    R
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={rInput}
                    onChange={(e) => handleRgbFieldChange('r', e.target.value)}
                    className="w-full pl-6 pr-2 py-2 font-mono text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-[10px] font-bold text-emerald-500">
                    G
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={gInput}
                    onChange={(e) => handleRgbFieldChange('g', e.target.value)}
                    className="w-full pl-6 pr-2 py-2 font-mono text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-[10px] font-bold text-blue-500">
                    B
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={bInput}
                    onChange={(e) => handleRgbFieldChange('b', e.target.value)}
                    className="w-full pl-6 pr-2 py-2 font-mono text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* HSL Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  HSL (Hue, Saturation, Lightness)
                </label>
                <button
                  onClick={() => handleCopy(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'copy-hsl')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
                >
                  {copiedKey === 'copy-hsl' ? (
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === 'copy-hsl' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-[10px] font-bold text-indigo-500">
                    H°
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="360"
                    value={hInput}
                    onChange={(e) => handleHslFieldChange('h', e.target.value)}
                    className="w-full pl-7 pr-2 py-2 font-mono text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-[10px] font-bold text-indigo-500">
                    S%
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={sInput}
                    onChange={(e) => handleHslFieldChange('s', e.target.value)}
                    className="w-full pl-7 pr-2 py-2 font-mono text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-[10px] font-bold text-indigo-500">
                    L%
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={lInput}
                    onChange={(e) => handleHslFieldChange('l', e.target.value)}
                    className="w-full pl-7 pr-2 py-2 font-mono text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Readonly CMYK and CSS Snippets */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs py-1">
                <span className="font-semibold text-slate-500">CMYK (Print):</span>
                <div className="flex items-center gap-2 font-mono text-slate-700 dark:text-slate-300">
                  <span>
                    cmyk({cmyk.c}%, {cmyk.m}%, {cmyk.y}%, {cmyk.k}%)
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(
                        `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
                        'copy-cmyk'
                      )
                    }
                    className="text-slate-400 hover:text-indigo-600"
                  >
                    {copiedKey === 'copy-cmyk' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs py-1">
                <span className="font-semibold text-slate-500">CSS Variable:</span>
                <div className="flex items-center gap-2 font-mono text-slate-700 dark:text-slate-300">
                  <span>--primary: {hex};</span>
                  <button
                    onClick={() => handleCopy(`--primary: ${hex};`, 'copy-css')}
                    className="text-slate-400 hover:text-indigo-600"
                  >
                    {copiedKey === 'copy-css' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* WCAG Contrast Checker Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>{isUrdu ? 'WCAG کنٹراسٹ ریٹنگ' : 'WCAG Accessibility Contrast'}</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Over White */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>On White</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    {contrastStats.onWhite.ratio}:1
                  </span>
                </div>

                <div
                  className="py-2 px-3 rounded text-center font-bold text-xs"
                  style={{ backgroundColor: '#ffffff', color: hex }}
                >
                  Text Sample
                </div>

                <div className="space-y-1 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">AA Normal:</span>
                    <span
                      className={`font-semibold ${
                        contrastStats.onWhite.aaNormal ? 'text-emerald-600' : 'text-rose-500'
                      }`}
                    >
                      {contrastStats.onWhite.aaNormal ? 'Pass' : 'Fail'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">AAA Normal:</span>
                    <span
                      className={`font-semibold ${
                        contrastStats.onWhite.aaaNormal ? 'text-emerald-600' : 'text-rose-500'
                      }`}
                    >
                      {contrastStats.onWhite.aaaNormal ? 'Pass' : 'Fail'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Over Black */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span>On Black</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white">
                    {contrastStats.onBlack.ratio}:1
                  </span>
                </div>

                <div
                  className="py-2 px-3 rounded text-center font-bold text-xs"
                  style={{ backgroundColor: '#0f172a', color: hex }}
                >
                  Text Sample
                </div>

                <div className="space-y-1 text-[11px] pt-1 border-t border-slate-800 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">AA Normal:</span>
                    <span
                      className={`font-semibold ${
                        contrastStats.onBlack.aaNormal ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {contrastStats.onBlack.aaNormal ? 'Pass' : 'Fail'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">AAA Normal:</span>
                    <span
                      className={`font-semibold ${
                        contrastStats.onBlack.aaaNormal ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {contrastStats.onBlack.aaaNormal ? 'Pass' : 'Fail'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* IMAGE COLOR PICKER SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-500" />
              <span>{isUrdu ? 'تصویر سے رنگ چنیں (Image Eyedropper)' : 'Pick Color from Image'}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {isUrdu
                ? 'اپنی تصویر اپ لوڈ کریں اور کینوس پر کسی بھی پکسل پر کلک کر کے رنگ حاصل کریں۔'
                : 'Upload or drag an image, hover over any pixel to inspect, and click to extract the exact color.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => imageUploadRef.current?.click()}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'نئی تصویر لائیں' : 'Upload Image'}</span>
            </button>
            <input
              type="file"
              ref={imageUploadRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageUpload(e.target.files[0]);
                }
              }}
            />

            <button
              onClick={() => {
                setImageUploadError(null);
                setImageSrc(SAMPLE_IMAGE_URL);
                setImageFileName('sample-spectrum.svg');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {isUrdu ? 'نمونہ تصویر' : 'Reset Sample'}
            </button>
          </div>
        </div>

        {imageUploadError && (
          <div role="alert" className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2">
            <span>{imageUploadError}</span>
            <button
              type="button"
              onClick={() => setImageUploadError(null)}
              className="p-1 text-rose-600 dark:text-rose-400 hover:opacity-80"
              aria-label="Dismiss upload error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Canvas Workspace */}
        <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-2 select-none">
          <canvas
            ref={canvasRef}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setHoverPixel(null)}
            onClick={handleCanvasClick}
            className="max-h-[380px] max-w-full w-auto object-contain cursor-crosshair rounded-lg"
          />

          {/* Interactive Magnifier Floating Badge */}
          {hoverPixel && (
            <div
              className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 z-20"
              style={{
                left: `${hoverPixel.x}px`,
                top: `${hoverPixel.y}px`,
              }}
            >
              <div
                className="w-5 h-5 rounded-full border border-black/20 shadow-sm"
                style={{ backgroundColor: hoverPixel.hex }}
              />
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                {hoverPixel.hex}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>{imageFileName}</span>
          <span>{isUrdu ? 'کلک کرنے پر رنگ خودبخود اوپر لوڈ ہو جائے گا' : 'Click any pixel on the image to set as active color'}</span>
        </div>
      </div>

      {/* SAVED PALETTE SWATCHES */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>{isUrdu ? 'پسندیدہ محفوظ پیلیٹ' : 'Saved Palette (Favorites)'}</span>
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSavedColors(DEFAULT_SAVED_COLORS)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              {isUrdu ? 'پہلے سے طے شدہ بحال کریں' : 'Reset Defaults'}
            </button>
            <button
              onClick={() => setSavedColors([])}
              className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>{isUrdu ? 'صاف کریں' : 'Clear All'}</span>
            </button>
          </div>
        </div>

        {savedColors.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
            {savedColors.map((colorHex, idx) => (
              <div
                key={idx}
                className="group relative flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm transition-transform hover:-translate-y-1"
              >
                <div
                  onClick={() => handleSelectRecentColor(colorHex)}
                  className="h-14 w-full cursor-pointer relative"
                  style={{ backgroundColor: colorHex }}
                />
                <div className="p-2 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-[11px] font-mono">
                  <span
                    onClick={() => handleSelectRecentColor(colorHex)}
                    className="cursor-pointer font-bold text-slate-700 dark:text-slate-300 truncate"
                  >
                    {colorHex}
                  </span>
                  <button
                    onClick={() => handleRemoveColor(colorHex)}
                    className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">
            {isUrdu
              ? 'ابھی تک کوئی رنگ محفوظ نہیں ہوا۔ "محفوظ کریں" پر کلک کر کے اپنے پسندیدہ رنگ شامل کریں۔'
              : 'No colors saved yet. Click "Save to Palette" above to store your favorite color swatches.'}
          </p>
        )}
      </div>
    </div>

    {/* Right / Sticky Recent Colors Sidebar (4 cols on xl) */}
    <div className="xl:col-span-4 xl:sticky xl:top-6 space-y-6" id="recent-colors-sidebar">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isUrdu ? 'حالیہ منتخب رنگ' : 'Recent Colors'}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {recentColors.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isUrdu ? 'دوبارہ منتخب کرنے یا کاپی کرنے کے لیے کلک کریں' : 'Click to re-select or copy'}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1">
            {recentColors.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleCopyAllRecents}
                  aria-label="Copy all recent HEX color codes"
                  className="p-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title={isUrdu ? 'تمام HEX رنگ کاپی کریں' : 'Copy all HEX codes'}
                >
                  {copiedKey === 'recent-copy-all' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClearRecents}
                  aria-label="Clear recent colors history"
                  className="p-1.5 text-xs text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title={isUrdu ? 'تاریخ صاف کریں' : 'Clear recents history'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search Filter if more than 3 recent colors */}
        {recentColors.length > 3 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchRecentQuery}
              onChange={(e) => setSearchRecentQuery(e.target.value)}
              placeholder={isUrdu ? 'فلٹر کریں (#hex یا rgb)...' : 'Filter recent colors...'}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchRecentQuery && (
              <button
                onClick={() => setSearchRecentQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable List of Recent Colors */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredRecentColors.length > 0 ? (
            filteredRecentColors.map((item) => {
              const isActive = hex.toUpperCase() === item.hex.toUpperCase();
              const hexCopyKey = `recent-hex-${item.hex}`;
              const isHexCopied = copiedKey === hexCopyKey;

              return (
                <div
                  key={item.id}
                  className={`group relative flex items-center justify-between p-2 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-xs'
                      : 'bg-slate-50/60 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Left: Swatch + Info (click to re-select) */}
                  <button
                    onClick={() => handleSelectRecentColor(item.hex)}
                    className="flex items-center gap-3 text-left min-w-0 flex-1 mr-2 cursor-pointer focus:outline-none"
                    title={isUrdu ? 'دوبارہ منتخب کریں' : 'Click to re-select this color'}
                  >
                    {/* Swatch */}
                    <div
                      className="w-10 h-10 rounded-xl shadow-inner border border-black/10 dark:border-white/10 shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95"
                      style={{ backgroundColor: item.hex }}
                    >
                      {isActive && (
                        <Check
                          className="w-4 h-4 font-bold drop-shadow-xs"
                          style={{ color: getHexTextColor(item.hex) }}
                        />
                      )}
                    </div>

                    {/* Text values */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                          {item.hex}
                        </span>
                        {isActive && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/80 dark:text-indigo-300">
                            {isUrdu ? 'فعال' : 'Active'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        <span className="truncate">{item.rgb}</span>
                        <span>•</span>
                        <span className="shrink-0">{formatTimeAgo(item.timestamp, isUrdu)}</span>
                      </div>
                    </div>
                  </button>

                  {/* Right: Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Copy HEX */}
                    <button
                      onClick={() => handleCopy(item.hex, hexCopyKey)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title={isUrdu ? 'HEX کاپی کریں' : 'Copy HEX'}
                    >
                      {isHexCopied ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Pin / Save to Palette */}
                    <button
                      onClick={() => handleSaveSpecificColor(item.hex)}
                      className="p-1.5 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title={isUrdu ? 'پیلیٹ میں محفوظ کریں' : 'Save to Palette'}
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                    </button>

                    {/* Remove from recents */}
                    <button
                      onClick={() => handleRemoveRecentColor(item.hex)}
                      className="p-1 text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors opacity-70 group-hover:opacity-100"
                      title={isUrdu ? 'ہٹائیں' : 'Remove'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                {searchRecentQuery
                  ? isUrdu
                    ? 'کوئی مماثل رنگ نہیں ملا'
                    : 'No matching colors found'
                  : isUrdu
                  ? 'کوئی حالیہ رنگ نہیں'
                  : 'No recent colors yet'}
              </p>
              <p className="text-[11px] text-slate-400 mb-3">
                {isUrdu
                  ? 'کینوس، سلائیڈرز یا پیلیٹ سے رنگ منتخب کریں'
                  : 'Colors picked from image or sliders appear here'}
              </p>
              <button
                onClick={() => handleSelectRecentColor(hex)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
              >
                <span>{isUrdu ? `موجودہ رنگ شامل کریں (${hex})` : `Add current color (${hex})`}</span>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Bottom Export Actions */}
        {recentColors.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <button
              onClick={handleSaveAllRecentsToPalette}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'تمام حالیہ رنگ پیلیٹ میں محفوظ کریں' : 'Save all recents to palette'}</span>
            </button>
            <button
              onClick={() => {
                const cssVars = recentColors
                  .map((c, i) => `  --color-${i + 1}: ${c.hex};`)
                  .join('\n');
                handleCopy(`:root {\n${cssVars}\n}`, 'recent-copy-css');
              }}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors flex items-center justify-center gap-1.5"
            >
              {copiedKey === 'recent-copy-css' ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 font-semibold">{isUrdu ? 'کاپی ہو گیا!' : 'Copied CSS Variables!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isUrdu ? 'CSS متغیرات کے طور پر کاپی کریں' : 'Copy as CSS Variables'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
</div>
  );
};
