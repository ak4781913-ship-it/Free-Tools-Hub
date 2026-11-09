/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Smartphone,
  Mail,
  Send,
  ExternalLink,
  QrCode,
  Sparkles,
  FileDown,
} from 'lucide-react';
import QRCode from 'qrcode';
import { ToolDefinition } from '../../../types';
import { ToolRouteConfig } from '../../../data/toolsRouting';
import { useLanguage } from '../../../context/LanguageContext';

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  tool: ToolDefinition;
  routeConfig: ToolRouteConfig;
  onLinkCopied?: () => void;
  onDownloadPdf?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  tool,
  routeConfig,
  onLinkCopied,
  onDownloadPdf,
}) => {
  const { language, dir } = useLanguage();
  const isUrdu = language === 'ur';

  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [canNativeShare, setCanNativeShare] = useState(false);

  // Check Web Share API support
  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanNativeShare(true);
    } else {
      setCanNativeShare(false);
    }
  }, []);

  // Reset copy state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setShowQR(false);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Generate local offline-safe QR code when QR panel is toggled open
  useEffect(() => {
    if (!isOpen || !showQR || typeof window === 'undefined') return;
    let active = true;
    QRCode.toDataURL(window.location.href, {
      width: 220,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((dataUrl) => {
        if (active) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [isOpen, showQR]);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const toolName = isUrdu ? tool.nameUrdu : tool.name;
  const shareTitle = `${toolName} – FreeTools Hub`;
  const shareText = isUrdu
    ? `مفت آن لائن ٹول: ${toolName}۔ کوئی رجسٹریشن نہیں، 100% مفت اور محفوظ۔`
    : `Try ${toolName} on FreeTools Hub – 100% free, private, client-side online tool.`;

  // Encoded parameters for social share links
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(shareTitle);
  const encodedText = encodeURIComponent(shareText);

  // Social share URLs
  const socialPlatforms = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      nameUrdu: 'واٹس ایپ',
      href: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      color: 'bg-[#25D366] hover:bg-[#20ba5a] text-white',
      textColor: 'text-[#25D366]',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      ),
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      nameUrdu: 'ایکس (ٹوئٹر)',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: 'bg-black hover:bg-slate-900 text-white',
      textColor: 'text-slate-900 dark:text-white',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      nameUrdu: 'لنکڈ ان',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: 'bg-[#0A66C2] hover:bg-[#084e96] text-white',
      textColor: 'text-[#0A66C2]',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      ),
    },
    {
      id: 'telegram',
      name: 'Telegram',
      nameUrdu: 'ٹیلیگرام',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'bg-[#229ED9] hover:bg-[#1d87ba] text-white',
      textColor: 'text-[#229ED9]',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      ),
    },
    {
      id: 'email',
      name: 'Email',
      nameUrdu: 'ای میل',
      href: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
      color: 'bg-slate-700 hover:bg-slate-800 text-white',
      textColor: 'text-slate-700 dark:text-slate-300',
      icon: <Mail className="w-4 h-4" />,
    },
  ];

  // Clipboard copy handler
  const handleCopyLink = async () => {
    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(currentUrl);
        success = true;
      }
    } catch {
      // fallback below
    }

    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = currentUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        textArea.remove();
      } catch (err) {
        console.warn('Fallback copy failed', err);
      }
    }

    setCopied(true);
    if (onLinkCopied) {
      onLinkCopied();
    }
    setTimeout(() => setCopied(false), 3000);
  };

  // Web Share API handler
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: currentUrl,
        });
      } catch (err) {
        // User cancelled or share failed silently
      }
    }
  };

  // Local client-side QR code data URL (privacy-first & offline-capable)
  const qrCodeUrl = qrDataUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shadow-2xs shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="share-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
              >
                {isUrdu ? 'ٹول شیئر کریں' : 'Share this Tool'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                {toolName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={isUrdu ? 'بند کریں' : 'Close modal'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Direct Copy Link Input Row */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>{isUrdu ? 'ٹول کا براہ راست لنک' : 'Direct Page URL'}</span>
            {copied && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold animate-in fade-in flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>{isUrdu ? 'کلپ بورڈ پر کاپی ہو گیا!' : 'Copied to clipboard!'}</span>
              </span>
            )}
          </label>

          <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 shadow-inner">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="w-full bg-transparent px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-mono truncate focus:outline-none"
              dir="ltr"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isUrdu ? 'کاپی شدہ' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isUrdu ? 'کاپی کریں' : 'Copy'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. Native Web Share Button (if supported on mobile/tablet) */}
        {canNativeShare && (
          <div>
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>{isUrdu ? 'ڈیوائس شیئر کے ذریعے بھیجیں' : 'Share via Device (Apps, AirDrop, Messages)'}</span>
            </button>
          </div>
        )}

        {/* 3. Major Social Platforms */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            {isUrdu ? 'سوشل میڈیا اور میسجنگ پر شیئر کریں' : 'Share to Social Platforms'}
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {socialPlatforms.map((platform) => (
              <a
                key={platform.id}
                href={platform.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer"
                title={`Share to ${platform.name}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${platform.color} shadow-xs group-hover:scale-105 transition-transform shrink-0`}
                >
                  {platform.icon}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {isUrdu ? platform.nameUrdu : platform.name}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                    <span>{isUrdu ? 'کھولیں' : 'Post'}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </span>
                </div>
              </a>
            ))}

            {/* Download PDF Option */}
            {onDownloadPdf && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDownloadPdf();
                }}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-indigo-200/90 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer group text-left rtl:text-right"
                title="Download A4 PDF Document"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <FileDown className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 truncate">
                    {isUrdu ? 'پی ڈی ایف' : 'Save PDF'}
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                    {isUrdu ? 'A4 دستاویز' : 'Export A4'}
                  </span>
                </div>
              </button>
            )}

            {/* QR Code Toggle Button */}
            <button
              type="button"
              onClick={() => setShowQR(!showQR)}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors cursor-pointer group ${
                showQR
                  ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40'
                  : 'border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0 text-left rtl:text-right">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isUrdu ? 'کیو آر کوڈ' : 'QR Code'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {isUrdu ? (showQR ? 'چھپائیں' : 'سکین کریں') : showQR ? 'Hide' : 'Scan'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* 4. Optional QR Code Display for Mobile Scan */}
        {showQR && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-200">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt={`QR code for ${toolName}`}
                  className="w-36 h-36 rounded-md"
                />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400">
                  Generating...
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              {isUrdu
                ? 'اپنے فون کے کیمرے سے سکین کر کے فوراً یہ ٹول کھولیں۔'
                : 'Scan with your smartphone camera to open this tool on mobile.'}
            </p>
          </div>
        )}

        {/* Footer info banner */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>100% Free & No Sign-up</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
          >
            {isUrdu ? 'بند کریں' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
