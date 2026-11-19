/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolCategoryGroup, CATEGORY_GROUPS } from './toolsRouting';
import { ToolFaqItem } from './keywordStrategy';

export interface CategoryLandingConfig {
  id: ToolCategoryGroup;
  slug: string;
  path: string;
  name: string;
  nameUrdu: string;
  h1: string;
  seoTitle: string;
  seoDescription: string;
  overview: string;
  highlights: string[];
  faqs: ToolFaqItem[];
  relatedGuideSlugs: string[];
}

export const CATEGORY_LANDINGS: CategoryLandingConfig[] = [
  {
    id: 'ai-tools',
    slug: 'ai-tools',
    path: '/categories/ai-tools',
    name: 'AI Tools & Prompt Engineering',
    nameUrdu: 'اے آئی اور پرامپٹ ٹولز',
    h1: 'Free AI Prompt Builders & SEO Metadata Tools',
    seoTitle: 'AI Tools & Prompt Generators – Free | FreeTools Hub',
    seoDescription:
      'Architect photorealistic Gemini & Flux image prompts, multi-scene AI video scripts, and search-ready metadata tags free in your browser.',
    overview:
      'Consistent outputs from modern image and video generators rely on structured scene geometry, lighting clarity, and explicit negative constraints rather than guesswork. Explore privacy-first builders that compose reusable prompt frameworks locally without API keys.',
    highlights: [
      'Photorealistic image prompt builder with camera lens, lighting, and likeness preservation directives.',
      'Meta tag & SERP snippet generator outputting OpenGraph, Twitter Card, and HTML head code.',
      'Zero sign-up required; drafts remain saved locally in your browser.',
    ],
    faqs: [
      {
        q: 'Do these AI prompt tools require an API key?',
        a: 'No. They run client-side to engineer structured text prompts and metadata HTML you can paste into any workflow or AI studio.',
      },
      {
        q: 'Can I preserve facial identity when using reference photos?',
        a: 'Yes. Toggle Reference Image Identity Preservation Mode inside the AI Photo Prompt Generator to append strict facial-consistency instructions.',
      },
    ],
    relatedGuideSlugs: [
      'how-to-write-consistent-ai-image-and-video-prompts',
      'how-to-audit-webpage-on-page-seo',
    ],
  },

  {
    id: 'career-cv',
    slug: 'career-cv',
    path: '/categories/career-cv',
    name: 'Career & ATS Resume Tools',
    nameUrdu: 'کیریئر اور سی وی ٹولز',
    h1: 'Free ATS CV & Resume Builder Tools',
    seoTitle: 'Career & ATS CV Maker Tools – Free | FreeTools Hub',
    seoDescription:
      'Build clean, recruiter-readable, ATS-friendly resumes with live A4 preview, multiple layouts, JSON backup, and crisp vector PDF export.',
    overview:
      'Applicant Tracking Systems strip decorative clutter and evaluate chronological roles, clear skills keywords, and readable headings. Prepare application-ready CVs for UAE, GCC, and international job markets with complete data ownership.',
    highlights: [
      'Print-ready A4 Vector PDF generation with selectable text for ATS parsing.',
      'Portable JSON backup import/export so your career record belongs strictly to you.',
      'Bilingual-ready interface supporting English (LTR) and Urdu (RTL) navigation.',
    ],
    faqs: [
      {
        q: 'Is my resume stored on third-party recruiter databases?',
        a: 'No. CV drafts remain strictly inside your browser storage unless you sign in to sync personal settings.',
      },
      {
        q: 'What makes a CV format ATS-compliant?',
        a: 'Standard section labels, clean linear reading order, standard fonts, and selectable Vector PDF text without rasterized text images.',
      },
    ],
    relatedGuideSlugs: [
      'how-to-build-ats-friendly-cv-uae-global',
      'uae-salary-breakdown-basic-vs-allowances',
    ],
  },

  {
    id: 'uae-calculators',
    slug: 'uae-calculators',
    path: '/categories/uae-calculators',
    name: 'UAE Salary & Gratuity Calculators',
    nameUrdu: 'یو اے ای سیلری اور گریجویٹی کیلکولیٹرز',
    h1: 'UAE Salary & Gratuity Calculators (AED)',
    seoTitle: 'UAE Gratuity & Salary Calculators – AED | FreeTools Hub',
    seoDescription:
      'Estimate UAE end-of-service gratuity under Federal Decree-Law No. 33 of 2021 and analyze monthly AED gross vs. basic pay locally.',
    overview:
      'Navigate UAE private-sector compensation offers and end-of-service settlements with transparent formulas grounded in Federal Decree-Law No. 33 of 2021. Understand how basic salary proportions directly impact statutory gratuity accrual.',
    highlights: [
      '21-day tier (years 1–5) and 30-day tier (years 5+) pro-rata calculation.',
      'Unpaid leave deductions and mandatory 24-month basic wage ceiling validation.',
      'Basic salary vs. housing/transport allowance gross-to-net AED breakdown with CSV/PDF export.',
    ],
    faqs: [
      {
        q: 'Are UAE gratuity results binding official MOHRE decisions?',
        a: 'No. Calculations are educational and informational estimates based on standard statutory formulas; always confirm final figures with HR, MOHRE, or applicable Free Zone rules.',
      },
      {
        q: 'Why separate basic salary from allowances?',
        a: 'Under standard mainland labor rules, statutory gratuity accrues solely on contractual basic salary.',
      },
    ],
    relatedGuideSlugs: [
      'uae-gratuity-calculation-guide-2026',
      'uae-salary-breakdown-basic-vs-allowances',
    ],
  },

  {
    id: 'photo-image',
    slug: 'photo-image',
    path: '/categories/photo-image',
    name: 'Photo, QR & Color Utilities',
    nameUrdu: 'تصویری، کیو آر اور کلر ٹولز',
    h1: 'Free Browser Photo Compressor, QR & Color Tools',
    seoTitle: 'Photo Compressor, QR Maker & Color Tools | FreeTools Hub',
    seoDescription:
      'Compress JPG, PNG, and WebP photos offline, create static SVG/PNG QR codes, and sample HEX/RGB/WCAG colors privately in your browser.',
    overview:
      'Prepare lean visual assets, high-contrast color palettes, and permanent scannable QR codes right inside HTML5 Canvas without sending client files or photographs across external servers.',
    highlights: [
      'Lossy and WebP browser image optimization to keep web pages fast.',
      'Static QR codes for links, WiFi logins, and vCards with zero expiry or redirect tracking.',
      'Image pixel eyedropper with HEX, RGB, HSL, CMYK, and WCAG AA/AAA contrast verification.',
    ],
    faqs: [
      {
        q: 'Do uploaded images stay on my computer or phone?',
        a: 'Yes. All pixel resampling, compression, and color sampling run locally in browser memory.',
      },
      {
        q: 'Can I download print-ready vector QR codes?',
        a: 'Yes. Export either high-resolution PNG or infinitely scalable SVG files.',
      },
    ],
    relatedGuideSlugs: ['how-to-audit-webpage-on-page-seo'],
  },

  {
    id: 'video-content',
    slug: 'video-content',
    path: '/categories/video-content',
    name: 'Video, Writing & On-Page SEO Tools',
    nameUrdu: 'ویڈیو، تحریر اور ایس ای او ٹولز',
    h1: 'Free Video Prompt, Writing & On-Page SEO Tools',
    seoTitle: 'Video Script, Writing & SEO Audit Tools | FreeTools Hub',
    seoDescription:
      'Audit public HTML pages for technical SEO, write live GitHub Markdown, count words/reading time, clean text cases, and script AI video scenes.',
    overview:
      'Streamline publishing workflows from initial script and Markdown drafting through readability verification and technical on-page HTML SEO auditing in one workspace.',
    highlights: [
      'Inspect live public web pages or pasted HTML for title tags, H1s, canonicals, and social cards.',
      'Real-time Markdown split preview with sanitized HTML and Vector PDF export.',
      'Instant word count, reading time pacing, and one-click text case formatting.',
    ],
    faqs: [
      {
        q: 'Can the SEO Page Analyzer check staging pages that are not live yet?',
        a: 'Yes. Paste your rendered HTML into Raw HTML mode to run full checks completely inside your browser.',
      },
      {
        q: 'What Markdown extensions are supported?',
        a: 'Tables, task lists, strikethrough, headings, lists, and fenced code blocks under GitHub Flavored Markdown.',
      },
    ],
    relatedGuideSlugs: [
      'how-to-audit-webpage-on-page-seo',
      'how-to-write-consistent-ai-image-and-video-prompts',
    ],
  },

  {
    id: 'pdf-tools',
    slug: 'pdf-tools',
    path: '/categories/pdf-tools',
    name: 'PDF Tools Suite (43 Browser Utilities)',
    nameUrdu: 'پی ڈی ایف ٹولز سوٹ (43 اوزار)',
    h1: '43 Free Browser PDF Tools – Convert, Edit & Secure',
    seoTitle: '43 Browser PDF Tools – Convert, Merge & OCR | FreeTools Hub',
    seoDescription:
      'Access 43 local browser PDF tools plus direct workflows for Merge, Split, Compress, PDF to Word/Excel/Images, Visual Edit, OCR, Watermark, and Encryption.',
    overview:
      'Handle everyday and sensitive document workflows locally via WebAssembly and JavaScript without uploading contracts, tax returns, or scanned IDs to third-party servers.',
    highlights: [
      'Direct landing pages for 15 top workflows including Merge, Split, Compress, Protect, OCR, and Edit PDF.',
      'Real QPDF WebAssembly AES encryption and Tesseract optical character recognition in browser.',
      'Interactive canvas editor for text boxes, signatures, watermarks, headers, and page numbers.',
    ],
    faqs: [
      {
        q: 'How are 43 PDF tools able to run without server uploads?',
        a: 'Modern WebAssembly libraries (pdf-lib, PDF.js, QPDF WASM, Tesseract.js, SheetJS, Mammoth) execute PDF assembly, rendering, encryption, and OCR directly inside your browser.',
      },
      {
        q: 'Are there file caps or watermarks?',
        a: 'FreeTools Hub never adds promotional watermarks or paywalls; practical speed depends only on your device memory.',
      },
    ],
    relatedGuideSlugs: [
      'how-to-merge-split-compress-pdf-privately-in-browser',
      'how-to-convert-pdf-to-word-or-excel-locally',
      'how-to-ocr-scanned-pdfs-locally',
      'how-to-protect-and-unlock-pdfs-safely',
    ],
  },

  {
    id: 'other-utilities',
    slug: 'other-utilities',
    path: '/categories/other-utilities',
    name: 'Finance, Security & Developer Utilities',
    nameUrdu: 'مالیاتی، سیکیورٹی اور ڈویلپر اوزار',
    h1: 'Finance, Security & Developer Web Utilities',
    seoTitle: 'Finance, Security & Developer Tools – Free | FreeTools Hub',
    seoDescription:
      'Calculate loans, FX & crypto rates, discounts/VAT, dates, BMI, time zones, strong Web Crypto passwords, JSON formatting, and UTF-8 Base64 locally.',
    overview:
      'Solve everyday numeric calculations, developer encoding tasks, international meeting coordination, and password hygiene directly in your browser without ads or data harvesting.',
    highlights: [
      'Cryptographic password generator using browser Web Crypto API plus offline entropy checker.',
      'Developer JSON formatter/validator with collapsible tree viewer and UTF-8 Base64 encoder.',
      'Amortization loan schedules, global time zone planner, BMI, percentage, discount/VAT, and unit converters.',
    ],
    faqs: [
      {
        q: 'Are API payloads or passwords sent to any backend when formatting or testing?',
        a: 'No. JSON validation, Base64 conversion, password generation, and entropy checking execute exclusively in local client memory.',
      },
      {
        q: 'Do currency and time zone tools work across Daylight Saving changes?',
        a: 'Yes. The time zone planner resolves standard IANA rules cleanly for future or past dates.',
      },
    ],
    relatedGuideSlugs: ['how-to-generate-strong-passwords-and-check-entropy'],
  },
];

export const CATEGORY_LANDING_BY_ID = new Map<ToolCategoryGroup, CategoryLandingConfig>(
  CATEGORY_LANDINGS.map((cat) => [cat.id, cat])
);

export const CATEGORY_LANDING_BY_SLUG = new Map<string, CategoryLandingConfig>(
  CATEGORY_LANDINGS.map((cat) => [cat.slug.toLowerCase(), cat])
);

export function getCategoryLandingPath(group: ToolCategoryGroup): string {
  return CATEGORY_LANDING_BY_ID.get(group)?.path || `/categories/${group}`;
}

export function findCategoryLandingBySlug(slugOrPath: string): CategoryLandingConfig | null {
  const clean = slugOrPath
    .toLowerCase()
    .replace(/^\/?categories\/?/, '')
    .replace(/^\//, '')
    .replace(/\/+$/, '');
  return CATEGORY_LANDING_BY_SLUG.get(clean) || null;
}

// Keep unused CATEGORY_GROUPS sync guarantee clean
export const VERIFIED_CATEGORY_COUNT = CATEGORY_GROUPS.length;
