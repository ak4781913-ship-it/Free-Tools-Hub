import React, { useState } from 'react';
import { SeoAnalysisResult } from './seoAnalysisTypes';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Share2,
  Globe,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ImageIcon,
  Sparkles,
  Info,
  Maximize2,
  Layers,
} from 'lucide-react';

interface SocialSharePreviewProps {
  result: SeoAnalysisResult;
}

export const SocialSharePreview: React.FC<SocialSharePreviewProps> = ({ result }) => {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  const [platform, setPlatform] = useState<'twitter' | 'facebook' | 'linkedin' | 'chat'>('twitter');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const { meta, finalUrl, url } = result;
  const og = meta.openGraph;
  const tw = meta.twitter;

  // Resolve domain name for display
  let domain = 'yourdomain.com';
  try {
    domain = new URL(og.url || finalUrl || url).hostname;
  } catch {
    domain = 'yourdomain.com';
  }

  // Active social assets
  const shareTitle = tw.title || og.title || meta.title.content || 'Page Title Not Specified';
  const shareDesc =
    tw.description ||
    og.description ||
    meta.description.content ||
    'No description provided. Social platforms will attempt to extract text from the page.';
  const shareImage = tw.image || og.image;
  const cardType = tw.card || 'summary_large_image';

  const handleCopyMeta = () => {
    const code = `<!-- OpenGraph Social Tags -->
<meta property="og:type" content="${og.type || 'website'}" />
<meta property="og:title" content="${shareTitle}" />
<meta property="og:description" content="${shareDesc}" />
${shareImage ? `<meta property="og:image" content="${shareImage}" />` : '<!-- <meta property="og:image" content="https://yourdomain.com/og-image.jpg" /> -->'}
<meta property="og:url" content="${og.url || finalUrl}" />
${og.siteName ? `<meta property="og:site_name" content="${og.siteName}" />` : ''}

<!-- Twitter / X Card Tags -->
<meta name="twitter:card" content="${cardType}" />
<meta name="twitter:title" content="${shareTitle}" />
<meta name="twitter:description" content="${shareDesc}" />
${shareImage ? `<meta name="twitter:image" content="${shareImage}" />` : ''}`;

    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-400" />
            <h3 className="text-base font-bold text-white">
              {isUrdu ? 'سوشل میڈیا کارڈز اور شیئر پریویو' : 'Social Media Card & Sharing Previews'}
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            {isUrdu
              ? 'دیکھیں کہ ٹویٹر، فیس بک، لنکڈ اِن اور واٹس ایپ پر یہ لنک کیسا نظر آئے گا۔'
              : 'Preview how this URL appears when shared across Twitter/X, Facebook, LinkedIn, and messaging applications.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyMeta}
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
        >
          {copiedSnippet ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'کاپی ہو گیا' : 'Copied!'}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'سوشل میٹا کوڈ کاپی کریں' : 'Copy Social Meta Tags'}</span>
            </>
          )}
        </button>
      </div>

      {/* Platform Tabs & Live Preview Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Card Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Platform selector */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold overflow-x-auto">
            <button
              type="button"
              onClick={() => setPlatform('twitter')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                platform === 'twitter'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Twitter / X
            </button>
            <button
              type="button"
              onClick={() => setPlatform('facebook')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                platform === 'facebook'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Facebook
            </button>
            <button
              type="button"
              onClick={() => setPlatform('linkedin')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                platform === 'linkedin'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              LinkedIn
            </button>
            <button
              type="button"
              onClick={() => setPlatform('chat')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                platform === 'chat'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Slack / Messaging
            </button>
          </div>

          {/* Interactive Card Canvas */}
          <div className="p-6 rounded-2xl bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
            {/* 1. Twitter / X Card */}
            {platform === 'twitter' && (
              <div className="w-full max-w-lg bg-black text-white rounded-2xl border border-slate-800 overflow-hidden shadow-xl font-sans">
                {cardType === 'summary' && shareImage ? (
                  /* Summary Card (Compact side-by-side) */
                  <div className="flex items-center p-3 gap-3">
                    <img
                      src={shareImage}
                      alt={shareTitle}
                      className="w-24 h-24 rounded-xl object-cover shrink-0 bg-slate-800"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="min-w-0 space-y-1">
                      <span className="text-[11px] text-slate-400 truncate block">{domain}</span>
                      <h4 className="text-sm font-bold line-clamp-1 text-white">{shareTitle}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{shareDesc}</p>
                    </div>
                  </div>
                ) : (
                  /* Summary Large Image Card (Full Banner) */
                  <div>
                    {shareImage ? (
                      <div className="relative aspect-[1.91/1] w-full bg-slate-900 overflow-hidden">
                        <img
                          src={shareImage}
                          alt={shareTitle}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute bottom-2 left-2 bg-black/75 px-2 py-0.5 rounded text-[11px] font-mono text-white">
                          {domain}
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[1.91/1] w-full bg-slate-900 flex flex-col items-center justify-center text-slate-500 gap-2 p-4 text-center">
                        <ImageIcon className="w-8 h-8 text-slate-600" />
                        <span className="text-xs font-semibold">
                          {isUrdu ? 'کوئی ٹویٹر یا اوپن گراف امیج نہیں ملا' : 'No Social Image Found (twitter:image or og:image)'}
                        </span>
                        <span className="text-[11px] text-slate-600">
                          Recommended: 1200 x 630 px
                        </span>
                      </div>
                    )}

                    <div className="p-3.5 space-y-1 border-t border-slate-800/80 bg-slate-900/60">
                      <span className="text-[11px] text-slate-400 block">{domain}</span>
                      <h4 className="text-sm font-bold line-clamp-1 text-white">{shareTitle}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {shareDesc}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Facebook Card */}
            {platform === 'facebook' && (
              <div className="w-full max-w-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg font-sans">
                {shareImage ? (
                  <div className="aspect-[1.91/1] w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={shareImage}
                      alt={shareTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[1.91/1] w-full bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center">
                    <ImageIcon className="w-8 h-8 text-slate-400" />
                    <span className="text-xs font-medium">Missing OpenGraph og:image</span>
                  </div>
                )}

                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/90 space-y-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider">
                    {domain}
                  </span>
                  <h4 className="text-sm font-bold line-clamp-2 leading-snug">{shareTitle}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {shareDesc}
                  </p>
                </div>
              </div>
            )}

            {/* 3. LinkedIn Card */}
            {platform === 'linkedin' && (
              <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg font-sans">
                {shareImage ? (
                  <div className="aspect-[1.91/1] w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={shareImage}
                      alt={shareTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[1.91/1] w-full bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400 gap-2 p-4">
                    <ImageIcon className="w-8 h-8 text-slate-400" />
                    <span className="text-xs">No image specified for LinkedIn card</span>
                  </div>
                )}

                <div className="p-3.5 space-y-1 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {shareTitle}
                  </h4>
                  <span className="text-[11px] text-slate-500 block truncate">
                    {domain} • {Math.round(result.performance.htmlSizeBytes / 1024)} KB
                  </span>
                </div>
              </div>
            )}

            {/* 4. Slack / Messaging Rich Preview */}
            {platform === 'chat' && (
              <div className="w-full max-w-lg bg-white dark:bg-slate-900 p-4 rounded-xl border-l-4 border-indigo-500 border border-slate-200 dark:border-slate-800 space-y-2 shadow-md">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Globe className="w-3.5 h-3.5" />
                  <span>{domain}</span>
                </div>
                <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 line-clamp-1">
                  {shareTitle}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {shareDesc}
                </p>
                {shareImage && (
                  <div className="w-64 max-w-full h-36 rounded-lg bg-slate-100 overflow-hidden mt-2">
                    <img
                      src={shareImage}
                      alt={shareTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tags Audit & Diagnostic Checklist (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
              <span>{isUrdu ? 'اوپن گراف ٹیگز کی تفصیل' : 'Open Graph Tags Status'}</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                og.status === 'good'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {og.presentCount} of 4 Present
              </span>
            </h4>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2 flex items-center justify-between gap-2">
                <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">og:title</span>
                {og.title ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[180px]">
                    {og.title}
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Missing
                  </span>
                )}
              </div>

              <div className="py-2 flex items-center justify-between gap-2">
                <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">og:description</span>
                {og.description ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[180px]">
                    {og.description}
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Missing
                  </span>
                )}
              </div>

              <div className="py-2 flex items-center justify-between gap-2">
                <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">og:image</span>
                {og.image ? (
                  <a
                    href={og.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-mono truncate max-w-[180px] flex items-center gap-1"
                  >
                    <span>{og.image}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Missing Image
                  </span>
                )}
              </div>

              <div className="py-2 flex items-center justify-between gap-2">
                <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">og:url</span>
                {og.url ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono truncate max-w-[180px]">
                    {og.url}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Auto-resolved</span>
                )}
              </div>
            </div>
          </div>

          {/* Twitter Tags Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
              <span>Twitter / X Card Tags</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                tw.status === 'good'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {tw.presentCount} Present
              </span>
            </h4>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-2 flex items-center justify-between gap-2">
                <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">twitter:card</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {tw.card || 'summary_large_image (fallback)'}
                </span>
              </div>

              <div className="py-2 flex items-center justify-between gap-2">
                <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">twitter:image</span>
                {tw.image ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono truncate max-w-[180px]">
                    {tw.image}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Inherits from og:image</span>
                )}
              </div>
            </div>
          </div>

          {/* Recommendations Callout */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isUrdu ? 'سوشل میڈیا آپٹمائزیشن کی تجاویز' : 'Social Share Best Practices'}</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 text-[11.5px] leading-relaxed">
              <li>
                <strong>Image Dimensions:</strong> Use 1200 × 630 pixels (1.91:1 aspect ratio) for crisp display on high-DPI retina screens.
              </li>
              <li>
                <strong>Headline:</strong> Keep social titles under 60 characters to prevent mobile truncation.
              </li>
              <li>
                <strong>File Size:</strong> Keep preview images under 5MB to ensure instant rendering when links are shared.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
