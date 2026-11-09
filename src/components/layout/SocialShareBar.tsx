/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  ChevronDown,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { ToolDefinition } from '../../types';
import { ToolRouteConfig } from '../../data/toolsRouting';
import { useLanguage } from '../../context/LanguageContext';

interface SocialShareBarProps {
  tool: ToolDefinition;
  routeConfig?: ToolRouteConfig;
  className?: string;
  variant?: 'inline' | 'dropdown' | 'banner';
  onCopySuccess?: (url: string) => void;
  onOpenFullModal?: () => void;
}

export const SocialShareBar: React.FC<SocialShareBarProps> = ({
  tool,
  routeConfig,
  className = '',
  variant = 'inline',
  onCopySuccess,
  onOpenFullModal,
}) => {
  const { language, dir } = useLanguage();
  const isUrdu = language === 'ur';

  const [copied, setCopied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const toolName = isUrdu ? tool.nameUrdu : tool.name;
  const shareTitle = `${toolName} – FreeTools Hub`;
  const shareText = isUrdu
    ? `مفت آن لائن ٹول: ${toolName}۔ کوئی رجسٹریشن نہیں، 100% مفت اور محفوظ۔`
    : `Try ${toolName} on FreeTools Hub – 100% free, private, client-side online tool.`;

  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedTitle = encodeURIComponent(shareTitle);
  const encodedText = encodeURIComponent(shareText);

  // Social Share direct endpoints
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

  const handleCopy = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
    onCopySuccess?.(currentUrl);
    setTimeout(() => setCopied(false), 3000);
  };

  // WhatsApp Icon SVG
  const WhatsAppIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg className={`${className} fill-current`} viewBox="0 0 24 24">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );

  // X / Twitter Icon SVG
  const TwitterIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
    <svg className={`${className} fill-current`} viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );

  // LinkedIn Icon SVG
  const LinkedInIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
    <svg className={`${className} fill-current`} viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );

  // Dropdown Button Style (fits nicely in toolbars or headers)
  if (variant === 'dropdown') {
    return (
      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
            isDropdownOpen
              ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400'
          }`}
          title={isUrdu ? 'اس ٹول کو شیئر کریں' : 'Share this tool'}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          <Share2 className="w-3.5 h-3.5 text-indigo-500" />
          <span>{isUrdu ? 'شیئر کریں' : 'Share'}</span>
          <ChevronDown
            className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isDropdownOpen && (
          <div
            className={`fixed left-3 right-3 mt-2 sm:absolute sm:top-full sm:w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1 ${
              dir === 'rtl' ? 'sm:left-0 sm:right-auto' : 'sm:right-0 sm:left-auto'
            }`}
            dir={dir}
          >
            {/* Copy Link Option */}
            <button
              type="button"
              onClick={(e) => {
                handleCopy(e);
                setIsDropdownOpen(false);
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </div>
                <span>{isUrdu ? 'لنک کاپی کریں' : 'Copy Page Link'}</span>
              </div>
              {copied && <span className="text-[10px] text-emerald-600 font-bold">{isUrdu ? 'کاپی شدہ' : 'Copied'}</span>}
            </button>

            {/* WhatsApp Option */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsDropdownOpen(false)}
              className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#25D366] text-white flex items-center justify-center shadow-2xs">
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                </div>
                <span>WhatsApp</span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* Twitter / X Option */}
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsDropdownOpen(false)}
              className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center shadow-2xs">
                  <TwitterIcon className="w-3 h-3" />
                </div>
                <span>X (Twitter)</span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* LinkedIn Option */}
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsDropdownOpen(false)}
              className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#0A66C2] text-white flex items-center justify-center shadow-2xs">
                  <LinkedInIcon className="w-3 h-3" />
                </div>
                <span>LinkedIn</span>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* More Options Modal Trigger */}
            {onOpenFullModal && (
              <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenFullModal();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isUrdu ? 'مزید آپشنز (کیو آر کوڈ وغیرہ)' : 'More Share Options (QR, etc.)'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Inline Strip Style: Direct 1-click buttons for Copy, WhatsApp, Twitter
  return (
    <div
      className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}
      dir="ltr"
    >
      {/* 1. Quick Copy URL Button */}
      <button
        type="button"
        onClick={handleCopy}
        title={isUrdu ? 'صفحے کا یو آر ایل کاپی کریں' : 'Copy page URL to clipboard'}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
          copied
            ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 scale-102'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-750'
        }`}
        aria-label="Copy page link"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-in zoom-in-50 duration-150" />
            <span>{isUrdu ? 'کاپی ہوگیا!' : 'Copied!'}</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 text-indigo-500" />
            <span>{isUrdu ? 'لنک کاپی' : 'Copy Link'}</span>
          </>
        )}
      </button>

      {/* 2. Direct WhatsApp Share Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={isUrdu ? 'واٹس ایپ پر شیئر کریں' : 'Share directly to WhatsApp'}
        aria-label="Share on WhatsApp"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-semibold shadow-2xs transition-all hover:scale-102 cursor-pointer"
      >
        <WhatsAppIcon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">WhatsApp</span>
      </a>

      {/* 3. Direct Twitter / X Share Button */}
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={isUrdu ? 'ٹوئٹر (X) پر شیئر کریں' : 'Share directly to Twitter / X'}
        aria-label="Share on Twitter / X"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black hover:bg-slate-900 text-white text-xs font-semibold shadow-2xs transition-all hover:scale-102 cursor-pointer border border-slate-700/60"
      >
        <TwitterIcon className="w-3 h-3" />
        <span className="hidden sm:inline">Post on X</span>
      </a>

      {/* 4. More Options Button (Opens Share Modal) */}
      {onOpenFullModal && (
        <button
          type="button"
          onClick={onOpenFullModal}
          title={isUrdu ? 'مزید شیئرنگ آپشنز (کیو آر کوڈ، ڈیوائس شیئر)' : 'More sharing options (QR code, native share, etc.)'}
          aria-label="More share options"
          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{isUrdu ? 'مزید' : 'More'}</span>
        </button>
      )}
    </div>
  );
};
