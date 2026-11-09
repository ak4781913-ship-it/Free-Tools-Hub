import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import {
  Globe,
  Search,
  Share2,
  Copy,
  CheckCircle,
  RotateCcw,
  Code,
  Download,
  Sparkles,
  AlertTriangle,
  Monitor,
  Smartphone,
  Eye,
  Sliders,
  Check,
  FileCode,
  Layers,
  Info,
} from 'lucide-react';

export type PreviewTab = 'google' | 'facebook' | 'twitter' | 'slack' | 'code';
export type ExportFormat = 'html' | 'nextjs' | 'jsonld';
export type SchemaType = 'WebApplication' | 'WebSite' | 'Article' | 'Product' | 'Organization';

interface SeoFormData {
  title: string;
  description: string;
  siteUrl: string;
  siteName: string;
  keywords: string;
  author: string;
  ogType: string;
  ogImage: string;
  ogImageAlt: string;
  twitterCard: 'summary_large_image' | 'summary';
  twitterHandle: string;
  twitterCreator: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  themeColor: string;
  locale: string;
  schemaType: SchemaType;
  enableSchema: boolean;
}

const DEFAULT_FORM: SeoFormData = {
  title: 'FreeTools Hub – 100% Free Online Web Utilities & Calculators',
  description: 'Boost productivity with fast, secure online tools: CV Builder, UAE Gratuity, SEO Generator, Crypto, Markdown Editor, and Calculators without signup.',
  siteUrl: 'https://example.com',
  siteName: 'FreeTools Hub',
  keywords: 'free online tools, seo meta generator, gratuity calculator, markdown editor, crypto converter, productivity',
  author: 'FreeTools Hub Team',
  ogType: 'website',
  ogImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop&q=80',
  ogImageAlt: 'FreeTools Hub Dashboard Preview',
  twitterCard: 'summary_large_image',
  twitterHandle: '@freetoolshub',
  twitterCreator: '@bulletraja',
  robotsIndex: true,
  robotsFollow: true,
  themeColor: '#4f46e5',
  locale: 'en_US',
  schemaType: 'WebApplication',
  enableSchema: true,
};

const TEMPLATES: Record<string, Partial<SeoFormData>> = {
  saas: {
    title: 'FlowSync – AI Workflow & Project Management Software',
    description: 'Automate team handoffs, track real-time delivery sprints, and cut status meetings by 40% with smart AI workflows.',
    siteUrl: 'https://flowsync.io',
    siteName: 'FlowSync',
    keywords: 'project management, ai workflows, sprint planning, team collaboration',
    author: 'FlowSync Technologies Inc.',
    ogType: 'website',
    ogImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop&q=80',
    ogImageAlt: 'FlowSync Product Analytics Interface',
    twitterCard: 'summary_large_image',
    twitterHandle: '@flowsyncapp',
    twitterCreator: '@flowsyncapp',
    schemaType: 'WebApplication',
  },
  ecommerce: {
    title: 'Nordic Craft – Minimalist Solid Oak Furniture & Decor',
    description: 'Handcrafted Scandinavian furniture sustainably made from certified European oak. Free worldwide shipping on orders over $150.',
    siteUrl: 'https://nordiccraft.shop',
    siteName: 'Nordic Craft',
    keywords: 'minimalist furniture, oak dining table, scandinavian home, sustainable decor',
    author: 'Nordic Craft Studio',
    ogType: 'product',
    ogImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&h=630&fit=crop&q=80',
    ogImageAlt: 'Handcrafted Minimalist Living Room Furniture',
    twitterCard: 'summary_large_image',
    twitterHandle: '@nordiccraft',
    twitterCreator: '@nordiccraft',
    schemaType: 'Product',
  },
  blog: {
    title: 'Modern CSS Architectures in 2026: Container Queries & Beyond',
    description: 'A deep-dive tutorial covering CSS container queries, subgrid layout mastery, and native CSS nesting for scalable component design systems.',
    siteUrl: 'https://frontendweekly.dev/modern-css-2026',
    siteName: 'Frontend Weekly',
    keywords: 'css tutorials, container queries, web design, frontend development, subgrid',
    author: 'Elena Vance',
    ogType: 'article',
    ogImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&h=630&fit=crop&q=80',
    ogImageAlt: 'Modern CSS Code Snippets on Monitor',
    twitterCard: 'summary_large_image',
    twitterHandle: '@frontendweekly',
    twitterCreator: '@elenavance',
    schemaType: 'Article',
  },
  portfolio: {
    title: 'Liam Thorne – Senior Product Designer & Design Engineer',
    description: 'Portfolio of Liam Thorne. Specializing in high-craft interactive digital experiences, design systems, and WebGL web apps for world-class brands.',
    siteUrl: 'https://liamthorne.design',
    siteName: 'Liam Thorne Portfolio',
    keywords: 'product designer, portfolio, design systems, creative developer, ux design',
    author: 'Liam Thorne',
    ogType: 'profile',
    ogImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&h=630&fit=crop&q=80',
    ogImageAlt: 'Liam Thorne Studio Work Showcase',
    twitterCard: 'summary_large_image',
    twitterHandle: '@liamdesign',
    twitterCreator: '@liamdesign',
    schemaType: 'WebSite',
  },
};

export const SeoMetaGeneratorTool: React.FC = () => {
  const { language } = useLanguage();
  const isUrdu = language === 'ur';

  const [formData, setFormData] = useState<SeoFormData>(DEFAULT_FORM);
  const [activePreview, setActivePreview] = useState<PreviewTab>('google');
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'mobile'>('desktop');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('html');
  const [copied, setCopied] = useState<boolean>(false);

  // Field change handler
  const handleChange = (field: keyof SeoFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Preset loader
  const loadPreset = (key: keyof typeof TEMPLATES) => {
    setFormData((prev) => ({
      ...prev,
      ...TEMPLATES[key],
    }));
  };

  const handleReset = () => {
    setFormData(DEFAULT_FORM);
  };

  // Length calculation & limits
  const titleLen = formData.title.trim().length;
  const descLen = formData.description.trim().length;

  const titleStatus = useMemo(() => {
    if (titleLen === 0) return { label: 'Empty', color: 'text-red-500', barColor: 'bg-red-500', pct: 0 };
    if (titleLen < 30) return { label: 'Too short (30-60 optimal)', color: 'text-amber-500', barColor: 'bg-amber-500', pct: (titleLen / 60) * 100 };
    if (titleLen <= 60) return { label: 'Optimal length', color: 'text-emerald-500', barColor: 'bg-emerald-500', pct: 100 };
    if (titleLen <= 70) return { label: 'Acceptable (may truncate)', color: 'text-amber-500', barColor: 'bg-amber-500', pct: 100 };
    return { label: 'Too long (will truncate)', color: 'text-red-500', barColor: 'bg-red-500', pct: 100 };
  }, [titleLen]);

  const descStatus = useMemo(() => {
    if (descLen === 0) return { label: 'Empty', color: 'text-red-500', barColor: 'bg-red-500', pct: 0 };
    if (descLen < 110) return { label: 'Too short (120-160 optimal)', color: 'text-amber-500', barColor: 'bg-amber-500', pct: (descLen / 160) * 100 };
    if (descLen <= 160) return { label: 'Optimal length', color: 'text-emerald-500', barColor: 'bg-emerald-500', pct: 100 };
    if (descLen <= 175) return { label: 'Acceptable (may truncate on mobile)', color: 'text-amber-500', barColor: 'bg-amber-500', pct: 100 };
    return { label: 'Too long (will truncate)', color: 'text-red-500', barColor: 'bg-red-500', pct: 100 };
  }, [descLen]);

  // Overall SEO Health Audit Score
  const seoAudit = useMemo(() => {
    let score = 0;
    const checks: { title: string; passed: boolean; message: string }[] = [];

    // Title Check (25 pts)
    const isTitleOptimal = titleLen >= 30 && titleLen <= 65;
    if (isTitleOptimal) score += 25;
    checks.push({
      title: 'Title Tag Length',
      passed: isTitleOptimal,
      message: isTitleOptimal
        ? `Great length (${titleLen} chars, within 30-65 target)`
        : `Current length is ${titleLen} chars (aim for 30 to 65 characters)`,
    });

    // Description Check (25 pts)
    const isDescOptimal = descLen >= 110 && descLen <= 165;
    if (isDescOptimal) score += 25;
    checks.push({
      title: 'Meta Description Length',
      passed: isDescOptimal,
      message: isDescOptimal
        ? `Optimal snippet summary (${descLen} chars, 110-165 target)`
        : `Current description is ${descLen} chars (aim for 120-160 chars)`,
    });

    // Canonical URL Check (15 pts)
    const hasValidUrl = formData.siteUrl.startsWith('https://') || formData.siteUrl.startsWith('http://');
    if (hasValidUrl) score += 15;
    checks.push({
      title: 'Canonical & OpenGraph URL',
      passed: hasValidUrl,
      message: hasValidUrl ? 'Valid absolute URL set' : 'Must start with https:// for canonical tags',
    });

    // Social Image Check (15 pts)
    const hasImage = formData.ogImage.trim().length > 0;
    if (hasImage) score += 15;
    checks.push({
      title: 'Social Share Image (OG:Image)',
      passed: hasImage,
      message: hasImage ? 'Image preview provided for rich social cards' : 'Missing social share card image',
    });

    // Brand Name Check (10 pts)
    const hasBrand = formData.siteName.trim().length > 0;
    if (hasBrand) score += 10;
    checks.push({
      title: 'Site Name & Branding',
      passed: hasBrand,
      message: hasBrand ? `Configured as "${formData.siteName}"` : 'Site name missing for og:site_name',
    });

    // Structured Data Check (10 pts)
    if (formData.enableSchema) score += 10;
    checks.push({
      title: 'Schema.org JSON-LD',
      passed: formData.enableSchema,
      message: formData.enableSchema
        ? `Configured with @type: ${formData.schemaType}`
        : 'Structured data disabled (recommended for rich snippets)',
    });

    return { score, checks };
  }, [titleLen, descLen, formData]);

  // Clean URL parsing for Google Preview
  const displayDomain = useMemo(() => {
    try {
      const url = new URL(formData.siteUrl);
      return url.hostname;
    } catch {
      return formData.siteUrl.replace(/^https?:\/\//, '').split('/')[0] || 'example.com';
    }
  }, [formData.siteUrl]);

  const displayPath = useMemo(() => {
    try {
      const url = new URL(formData.siteUrl);
      const pathname = url.pathname === '/' ? '' : url.pathname.replace(/^\//, ' › ');
      return pathname;
    } catch {
      return '';
    }
  }, [formData.siteUrl]);

  // HTML Code Generation
  const generatedHtml = useMemo(() => {
    const esc = (str: string) =>
      String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const robotsContent = `${formData.robotsIndex ? 'index' : 'noindex'}, ${
      formData.robotsFollow ? 'follow' : 'nofollow'
    }`;

    const schemaJson = JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': formData.schemaType,
        name: formData.title,
        url: formData.siteUrl,
        description: formData.description,
        publisher: {
          '@type': 'Organization',
          name: formData.siteName,
        },
      },
      null,
      4
    ).replace(/<\//g, '<\\/');

    const schemaSnippet = formData.enableSchema
      ? `\n<!-- Schema.org JSON-LD Structured Data -->\n<script type="application/ld+json">\n${schemaJson}\n</script>`
      : '';

    const safeTitle = esc(formData.title);
    const safeDesc = esc(formData.description);
    const safeKeywords = esc(formData.keywords);
    const safeAuthor = esc(formData.author);
    const safeTheme = esc(formData.themeColor);
    const safeSiteUrl = esc(formData.siteUrl);
    const safeSiteName = esc(formData.siteName);
    const safeLocale = esc(formData.locale);
    const safeOgImage = esc(formData.ogImage);
    const safeOgAlt = esc(formData.ogImageAlt || formData.title);
    const safeTwHandle = esc(formData.twitterHandle);
    const safeTwCreator = esc(formData.twitterCreator);

    return `<!-- Primary Meta Tags -->
<title>${safeTitle}</title>
<meta name="title" content="${safeTitle}" />
<meta name="description" content="${safeDesc}" />
${formData.keywords ? `<meta name="keywords" content="${safeKeywords}" />\n` : ''}${
      formData.author ? `<meta name="author" content="${safeAuthor}" />\n` : ''
    }<meta name="robots" content="${robotsContent}" />
<meta name="theme-color" content="${safeTheme}" />
<link rel="canonical" href="${safeSiteUrl}" />

<!-- Open Graph / Facebook / LinkedIn / Discord -->
<meta property="og:type" content="${esc(formData.ogType)}" />
<meta property="og:url" content="${safeSiteUrl}" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDesc}" />
<meta property="og:site_name" content="${safeSiteName}" />
<meta property="og:locale" content="${safeLocale}" />
${
  formData.ogImage
    ? `<meta property="og:image" content="${safeOgImage}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${safeOgAlt}" />`
    : ''
}

<!-- Twitter / X Cards -->
<meta name="twitter:card" content="${esc(formData.twitterCard)}" />
<meta name="twitter:url" content="${safeSiteUrl}" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDesc}" />
${formData.twitterHandle ? `<meta name="twitter:site" content="${safeTwHandle}" />\n` : ''}${
      formData.twitterCreator ? `<meta name="twitter:creator" content="${safeTwCreator}" />\n` : ''
    }${
      formData.ogImage
        ? `<meta name="twitter:image" content="${safeOgImage}" />
<meta name="twitter:image:alt" content="${safeOgAlt}" />`
        : ''
    }${schemaSnippet}`;
  }, [formData]);

  // Next.js App Router (metadata) Code Generation
  const generatedNextJs = useMemo(() => {
    const trimmedUrl = formData.siteUrl.trim();
    const metadataBaseUrl = trimmedUrl
      ? /^https?:\/\//i.test(trimmedUrl)
        ? trimmedUrl
        : `https://${trimmedUrl}`
      : 'https://example.com';

    return `import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${formData.title.replace(/'/g, "\\'")}',
  description: '${formData.description.replace(/'/g, "\\'")}',
  metadataBase: new URL('${metadataBaseUrl.replace(/'/g, "\\'")}'),
  alternates: {
    canonical: '/',
  },
  keywords: [${formData.keywords
    .split(',')
    .map((k) => `'${k.trim()}'`)
    .filter(Boolean)
    .join(', ')}],
  authors: [{ name: '${formData.author.replace(/'/g, "\\'")}' }],
  themeColor: '${formData.themeColor}',
  robots: {
    index: ${formData.robotsIndex},
    follow: ${formData.robotsFollow},
  },
  openGraph: {
    title: '${formData.title.replace(/'/g, "\\'")}',
    description: '${formData.description.replace(/'/g, "\\'")}',
    url: '${formData.siteUrl}',
    siteName: '${formData.siteName.replace(/'/g, "\\'")}',
    locale: '${formData.locale}',
    type: '${formData.ogType === 'article' ? 'article' : 'website'}',
    images: [
      {
        url: '${formData.ogImage}',
        width: 1200,
        height: 630,
        alt: '${(formData.ogImageAlt || formData.title).replace(/'/g, "\\'")}',
      },
    ],
  },
  twitter: {
    card: '${formData.twitterCard}',
    title: '${formData.title.replace(/'/g, "\\'")}',
    description: '${formData.description.replace(/'/g, "\\'")}',
    ${formData.twitterHandle ? `site: '${formData.twitterHandle}',` : ''}
    ${formData.twitterCreator ? `creator: '${formData.twitterCreator}',` : ''}
    images: ['${formData.ogImage}'],
  },
};`;
  }, [formData]);

  // JSON-LD Standalone
  const generatedJsonLd = useMemo(() => {
    const json = {
      '@context': 'https://schema.org',
      '@type': formData.schemaType,
      name: formData.title,
      url: formData.siteUrl,
      description: formData.description,
      publisher: {
        '@type': 'Organization',
        name: formData.siteName,
        url: formData.siteUrl,
      },
    };
    return JSON.stringify(json, null, 2);
  }, [formData]);

  const currentCode = useMemo(() => {
    if (exportFormat === 'html') return generatedHtml;
    if (exportFormat === 'nextjs') return generatedNextJs;
    return generatedJsonLd;
  }, [exportFormat, generatedHtml, generatedNextJs, generatedJsonLd]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let filename = 'meta-tags.html';
    let mime = 'text/html';
    if (exportFormat === 'nextjs') {
      filename = 'metadata.ts';
      mime = 'text/typescript';
    } else if (exportFormat === 'jsonld') {
      filename = 'schema.json';
      mime = 'application/json';
    }

    const blob = new Blob([currentCode], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {isUrdu ? 'ویب سائٹ ایس ای او میٹا ٹیگ جنریٹر' : 'SEO Meta Tags & Social Cards Generator'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isUrdu
                    ? 'گوگل سرچ، فیس بک، ایکس، اور ڈسکارڈ کے لیے پرفیکٹ میٹا ٹیگز اور لائیو پری ویوز بنائیں'
                    : 'Craft high-converting search snippet previews, OpenGraph cards, Twitter cards, and valid JSON-LD schemas in real-time'}
                </p>
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
              {isUrdu ? 'نمونہ ٹیمپلیٹس:' : 'Presets:'}
            </span>
            <button
              onClick={() => loadPreset('saas')}
              className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            >
              SaaS App
            </button>
            <button
              onClick={() => loadPreset('ecommerce')}
              className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            >
              E-commerce
            </button>
            <button
              onClick={() => loadPreset('blog')}
              className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            >
              Blog Post
            </button>
            <button
              onClick={() => loadPreset('portfolio')}
              className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            >
              Portfolio
            </button>
            <button
              type="button"
              onClick={handleReset}
              title="Reset fields to default"
              aria-label="Reset fields to default"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Left, Preview & Code Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Core Search Metadata */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  1. Search Engine Basics
                </h2>
              </div>
              <span className="text-[11px] font-medium text-slate-500">Google, Bing, Yahoo</span>
            </div>

            {/* Title Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Page Title Tag <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={`font-mono font-medium ${titleStatus.color}`}>
                    {titleLen}/60 chars
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className={titleStatus.color}>{titleStatus.label}</span>
                </div>
              </div>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g. Acme Studio – Fast Creative Web Design Agency"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white transition-all font-medium"
              />
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${titleStatus.barColor}`}
                  style={{ width: `${Math.min(titleStatus.pct, 100)}%` }}
                />
              </div>
            </div>

            {/* Description Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Meta Description <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={`font-mono font-medium ${descStatus.color}`}>
                    {descLen}/160 chars
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className={descStatus.color}>{descStatus.label}</span>
                </div>
              </div>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Summarize the core purpose and value proposition in 1–2 compelling sentences..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white transition-all resize-y"
              />
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${descStatus.barColor}`}
                  style={{ width: `${Math.min(descStatus.pct, 100)}%` }}
                />
              </div>
            </div>

            {/* Canonical URL & Site Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Canonical URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.siteUrl}
                  onChange={(e) => handleChange('siteUrl', e.target.value)}
                  placeholder="https://example.com/page"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Site Name / Brand
                </label>
                <input
                  type="text"
                  value={formData.siteName}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                  placeholder="e.g. FreeTools Hub"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Keywords & Author */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Keywords <span className="text-slate-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => handleChange('keywords', e.target.value)}
                  placeholder="seo, calculators, web tools"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Author / Publisher
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => handleChange('author', e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Card 2: OpenGraph & Social Sharing */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  2. OpenGraph & Social Cards
                </h2>
              </div>
              <span className="text-[11px] font-medium text-slate-500">Facebook, LinkedIn, Discord</span>
            </div>

            {/* Social Image URL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Featured / Social Share Image URL <span className="text-slate-400 font-normal">(1200 × 630 px)</span>
                </label>
                {formData.ogImage && (
                  <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-medium">
                    <Check className="w-3 h-3" /> Image provided
                  </span>
                )}
              </div>
              <input
                type="url"
                value={formData.ogImage}
                onChange={(e) => handleChange('ogImage', e.target.value)}
                placeholder="https://example.com/og-image.jpg"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Recommendation: 1200×630 pixels, aspect ratio 1.91:1, under 5MB (PNG or JPG).
              </p>
            </div>

            {/* Image Alt & OG Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Image Alt Description
                </label>
                <input
                  type="text"
                  value={formData.ogImageAlt}
                  onChange={(e) => handleChange('ogImageAlt', e.target.value)}
                  placeholder="Describes what appears in the image preview"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Content Type (og:type)
                </label>
                <select
                  value={formData.ogType}
                  onChange={(e) => handleChange('ogType', e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                >
                  <option value="website">Website</option>
                  <option value="article">Article</option>
                  <option value="product">Product</option>
                  <option value="profile">Profile / Person</option>
                  <option value="book">Book</option>
                </select>
              </div>
            </div>

            {/* Locale */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Locale (og:locale)
                </label>
                <input
                  type="text"
                  value={formData.locale}
                  onChange={(e) => handleChange('locale', e.target.value)}
                  placeholder="en_US"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Brand Theme Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.themeColor}
                    onChange={(e) => handleChange('themeColor', e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={formData.themeColor}
                    onChange={(e) => handleChange('themeColor', e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Twitter / X & Technical Directives */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-sky-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  3. Twitter / X & Robots Directives
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Twitter Card Format
                </label>
                <select
                  value={formData.twitterCard}
                  onChange={(e) => handleChange('twitterCard', e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                >
                  <option value="summary_large_image">summary_large_image</option>
                  <option value="summary">summary (square thumbnail)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Twitter Site Handle
                </label>
                <input
                  type="text"
                  value={formData.twitterHandle}
                  onChange={(e) => handleChange('twitterHandle', e.target.value)}
                  placeholder="@brand"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Author Twitter Handle
                </label>
                <input
                  type="text"
                  value={formData.twitterCreator}
                  onChange={(e) => handleChange('twitterCreator', e.target.value)}
                  placeholder="@author"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Robots checkboxes */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.robotsIndex}
                  onChange={(e) => handleChange('robotsIndex', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                Allow Search Indexing <span className="text-slate-400 font-mono">(index)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.robotsFollow}
                  onChange={(e) => handleChange('robotsFollow', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                Follow Page Links <span className="text-slate-400 font-mono">(follow)</span>
              </label>
            </div>
          </div>

          {/* Card 4: Structured Data (Schema.org) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  4. Schema.org Structured Data (JSON-LD)
                </h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableSchema}
                  onChange={(e) => handleChange('enableSchema', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>

            {formData.enableSchema && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Schema.org @type
                  </label>
                  <select
                    value={formData.schemaType}
                    onChange={(e) => handleChange('schemaType', e.target.value as SchemaType)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-white"
                  >
                    <option value="WebApplication">WebApplication (Online Tool / SaaS)</option>
                    <option value="WebSite">WebSite (General Website / Portfolio)</option>
                    <option value="Article">Article (Blog Post / Documentation)</option>
                    <option value="Product">Product (E-commerce / Merchandise)</option>
                    <option value="Organization">Organization (Company / Agency)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <p className="text-[11px] text-slate-500 pb-2">
                    Enables Google rich result snippets, site search boxes, and knowledge graph recognition.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Previews, SEO Score & Code Exporter (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* SEO Score Meter */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800/80 rounded-2xl p-5 border border-indigo-100 dark:border-slate-700/60 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  SEO Health Score
                </h3>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                  {seoAudit.score}
                </span>
                <span className="text-xs font-bold text-slate-500">/100</span>
              </div>
            </div>

            {/* Score Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full transition-all duration-500 ${
                  seoAudit.score >= 85
                    ? 'bg-emerald-500'
                    : seoAudit.score >= 60
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${seoAudit.score}%` }}
              />
            </div>

            {/* Checklist items */}
            <div className="space-y-1.5 pt-1">
              {seoAudit.checks.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    {c.passed ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span>{c.title}</span>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400 truncate max-w-[180px] text-right">
                    {c.message}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Previews Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            {/* Tab navigation */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                <button
                  onClick={() => setActivePreview('google')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    activePreview === 'google'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Google
                </button>
                <button
                  onClick={() => setActivePreview('facebook')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    activePreview === 'facebook'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Facebook / OG
                </button>
                <button
                  onClick={() => setActivePreview('twitter')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    activePreview === 'twitter'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Twitter / X
                </button>
                <button
                  onClick={() => setActivePreview('slack')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    activePreview === 'slack'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Discord / Slack
                </button>
                <button
                  onClick={() => setActivePreview('code')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    activePreview === 'code'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Export Code
                </button>
              </div>

              {activePreview === 'google' && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                  <button
                    onClick={() => setDevicePreview('desktop')}
                    title="Desktop Preview"
                    className={`p-1 rounded ${
                      devicePreview === 'desktop'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDevicePreview('mobile')}
                    title="Mobile Preview"
                    className={`p-1 rounded ${
                      devicePreview === 'mobile'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* PREVIEW: GOOGLE SERP */}
            {activePreview === 'google' && (
              <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="space-y-1.5 font-sans">
                  {/* Google Breadcrumb */}
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-600">
                      🌐
                    </div>
                    <div className="flex items-center gap-1 truncate text-[12px]">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {formData.siteName || displayDomain}
                      </span>
                      <span className="text-slate-400">https://{displayDomain}{displayPath}</span>
                    </div>
                  </div>

                  {/* Title Link */}
                  <h4 className="text-[18px] sm:text-[19px] leading-snug font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer line-clamp-2">
                    {formData.title || 'Untitled Web Page'}
                  </h4>

                  {/* Snippet Description */}
                  <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2 sm:line-clamp-3">
                    {formData.description || 'No meta description provided. Google will extract random text from your page content.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Google Search SERP Simulation</span>
                  <span>{devicePreview === 'desktop' ? 'Desktop View (600px)' : 'Mobile View (360px)'}</span>
                </div>
              </div>
            )}

            {/* PREVIEW: FACEBOOK / OPEN GRAPH */}
            {activePreview === 'facebook' && (
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-sans">
                {/* Image */}
                <div className="aspect-[1.91/1] w-full bg-slate-100 dark:bg-slate-900 relative overflow-hidden flex items-center justify-center">
                  {formData.ogImage ? (
                    <img
                      src={formData.ogImage}
                      alt={formData.ogImageAlt || formData.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-center p-4 text-slate-400">
                      <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No og:image specified</p>
                    </div>
                  )}
                </div>

                {/* Content Box */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium block truncate">
                    {displayDomain.toUpperCase()}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-2">
                    {formData.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                    {formData.description}
                  </p>
                </div>
              </div>
            )}

            {/* PREVIEW: TWITTER / X CARD */}
            {activePreview === 'twitter' && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-sans">
                {formData.twitterCard === 'summary_large_image' ? (
                  <div>
                    <div className="aspect-[1.91/1] w-full bg-slate-100 dark:bg-slate-900 relative overflow-hidden flex items-center justify-center">
                      {formData.ogImage ? (
                        <img
                          src={formData.ogImage}
                          alt={formData.ogImageAlt || formData.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-4 text-slate-400">
                          <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">No image set</p>
                        </div>
                      )}
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 text-white rounded text-[11px] font-medium backdrop-blur-xs">
                        {displayDomain}
                      </span>
                    </div>
                    <div className="p-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {formData.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                        {formData.description}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex p-3 gap-3 items-center">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden shrink-0">
                      {formData.ogImage && (
                        <img
                          src={formData.ogImage}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-400 block truncate">{displayDomain}</span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {formData.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {formData.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PREVIEW: DISCORD / SLACK EMBED */}
            {activePreview === 'slack' && (
              <div className="p-4 bg-slate-900 rounded-xl font-sans border-l-4 border-indigo-500 text-white space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  {formData.siteName || displayDomain}
                </span>
                <h4 className="text-xs font-bold text-sky-400 hover:underline cursor-pointer line-clamp-1">
                  {formData.title}
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                  {formData.description}
                </p>
                {formData.ogImage && (
                  <div className="mt-2 rounded-lg overflow-hidden max-h-48">
                    <img
                      src={formData.ogImage}
                      alt="Embed preview"
                      className="w-full h-auto object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}

            {/* EXPORT CODE SECTION */}
            {activePreview === 'code' && (
              <div className="space-y-3">
                {/* Format selection */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium">
                    <button
                      onClick={() => setExportFormat('html')}
                      className={`px-2.5 py-1 rounded ${
                        exportFormat === 'html'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      HTML &lt;head&gt;
                    </button>
                    <button
                      onClick={() => setExportFormat('nextjs')}
                      className={`px-2.5 py-1 rounded ${
                        exportFormat === 'nextjs'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Next.js Metadata
                    </button>
                    <button
                      onClick={() => setExportFormat('jsonld')}
                      className={`px-2.5 py-1 rounded ${
                        exportFormat === 'jsonld'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      JSON-LD Schema
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownload}
                      title="Download file"
                      aria-label="Download generated metadata file"
                      className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Code display */}
                <div className="relative">
                  <pre className="p-4 bg-slate-950 text-slate-100 text-xs font-mono rounded-xl overflow-x-auto max-h-[380px] border border-slate-800 leading-relaxed">
                    <code>{currentCode}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Quick Copy / Download bar if not in code tab */}
          {activePreview !== 'code' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedHtml);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied HTML Meta Tags!' : 'Copy HTML Meta Tags'}</span>
              </button>
              <button
                onClick={() => setActivePreview('code')}
                className="py-2.5 px-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Code className="w-4 h-4" />
                <span>View All Codes</span>
              </button>
            </div>
          )}

          {/* Best Practices Guide Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <Info className="w-4 h-4 text-indigo-500" />
              <span>SEO Meta Tag Quick Rules</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li>Keep title tags between <strong>30 and 60 characters</strong> (580px limit in Google).</li>
              <li>Keep meta descriptions between <strong>120 and 160 characters</strong>.</li>
              <li>Always provide an <strong>og:image</strong> with minimum dimensions of 1200×630 pixels.</li>
              <li>Ensure the canonical URL uses <strong>https://</strong> and points to the authoritative page.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
