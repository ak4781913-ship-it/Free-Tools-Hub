import { TOOLS_LIST } from './tools';
import { ToolDefinition } from '../types';

export type ToolCategoryGroup =
  | 'ai-tools'
  | 'pdf-tools'
  | 'photo-image'
  | 'video-content'
  | 'career-cv'
  | 'uae-calculators'
  | 'other-utilities';

export interface ToolRouteConfig {
  id: string; // Tool ID in TOOLS_LIST
  primarySlug: string; // URL slug e.g. "cv-maker"
  primaryPath: string; // e.g. "/tools/cv-maker"
  aliases: string[]; // alternative slugs e.g. ["resume-builder", "cv-maker"]
  categoryGroup: ToolCategoryGroup;
  categoryGroupLabel: string;
  categoryGroupLabelUrdu: string;
  seoTitle: string;
  seoDescription: string;
  tips: { title: string; desc: string }[];
}

export const CATEGORY_GROUPS: {
  id: ToolCategoryGroup;
  name: string;
  nameUrdu: string;
  description: string;
  descriptionUrdu: string;
  iconName: string;
}[] = [
  {
    id: 'ai-tools',
    name: 'AI Tools',
    nameUrdu: 'اے آئی ٹولز',
    description: 'Generative AI prompts, visual prompt engineering, and SEO metadata tools.',
    descriptionUrdu: 'جیمینائی فوٹو پرامپٹس، ویڈیو اسکرپٹس اور ایس ای او اے آئی اوزار۔',
    iconName: 'Sparkles',
  },
  {
    id: 'career-cv',
    name: 'Career & CV Tools',
    nameUrdu: 'کیریئر اور سی وی ٹولز',
    description: 'Professional ATS-compliant resume builder and career document utilities.',
    descriptionUrdu: 'پیشہ ورانہ سی وی میکر، ٹیمپلیٹس اور پی ڈی ایف ڈاؤن لوڈ۔',
    iconName: 'Briefcase',
  },
  {
    id: 'uae-calculators',
    name: 'UAE Salary & Gratuity Calculators',
    nameUrdu: 'یو اے ای سیلری اور گریجویٹی کیلکولیٹرز',
    description: 'Official calculation engines under UAE Federal Decree-Law No. 33 of 2021.',
    descriptionUrdu: 'متحدہ عرب امارات کے لیبر قانون کے مطابق اختتامِ ملازمت کے فوائد کا درست حساب۔',
    iconName: 'Calculator',
  },
  {
    id: 'photo-image',
    name: 'Photo and Image Tools',
    nameUrdu: 'تصویری اور فوٹو ٹولز',
    description: 'Client-side image compressor, custom QR code generator, and color studio.',
    descriptionUrdu: 'امیج کمپریسر، کیو آر کوڈ جنریٹر اور ایڈوانس کلر پکر۔',
    iconName: 'Image',
  },
  {
    id: 'video-content',
    name: 'Video and Content Creation Tools',
    nameUrdu: 'ویڈیو اور کنٹینٹ کریشن ٹولز',
    description: 'Scene-by-scene directorial video scripts, live markdown writer, and text analyzers.',
    descriptionUrdu: 'ویڈیو پرامپٹس، مارک ڈاؤن ایڈیٹر، الفاظ کاؤنٹر اور ایس ای او تجزیہ۔',
    iconName: 'Video',
  },
  {
    id: 'pdf-tools',
    name: 'PDF Tools Suite',
    nameUrdu: 'پی ڈی ایف ٹولز سوٹ',
    description: '43 client-side PDF tools: convert, merge, split, compress, edit, encrypt, OCR, and repair.',
    descriptionUrdu: '43 براؤزر بیسڈ پی ڈی ایف ٹولز: کنورٹ، مرج، اسپلٹ، کمپریس، ایڈٹ، پاس ورڈ اور او سی آر۔',
    iconName: 'FileText',
  },
  {
    id: 'other-utilities',
    name: 'Other Utilities',
    nameUrdu: 'دیگر مفید اوزار',
    description: 'Financial calculators, password tools, unit converters, and developer utilities.',
    descriptionUrdu: 'لون، کرنسی، پاس ورڈ جنریٹر، یونٹ کنورٹر، اور جیسن فارمیٹر۔',
    iconName: 'Wrench',
  },
];

export const TOOL_ROUTES: Record<string, ToolRouteConfig> = {
  'resume-builder': {
    id: 'resume-builder',
    primarySlug: 'cv-maker',
    primaryPath: '/tools/cv-maker',
    aliases: ['cv-maker', 'resume-builder', 'cv-builder', 'resume-maker'],
    categoryGroup: 'career-cv',
    categoryGroupLabel: 'Career & CV Tools',
    categoryGroupLabelUrdu: 'کیریئر اور سی وی ٹولز',
    seoTitle: 'CV & Resume Maker – Free ATS Professional CV Generator | FreeTools Hub',
    seoDescription: 'Create professional, ATS-friendly resumes with live multi-template preview, custom typography, and instant PDF download without login.',
    tips: [
      { title: 'ATS Compliance', desc: 'Use standard section headings and clear chronological employment dates for maximum ATS parse rate.' },
      { title: 'Vector PDF Download', desc: 'Download as Vector PDF for crisp selectable text on desktop applicant tracking systems.' },
      { title: 'Local Auto-Save', desc: 'Your progress is stored securely in your browser so you never lose draft changes.' },
    ],
  },
  'uae-gratuity': {
    id: 'uae-gratuity',
    primarySlug: 'uae-gratuity-calculator',
    primaryPath: '/tools/uae-gratuity-calculator',
    aliases: ['uae-gratuity-calculator', 'uae-gratuity', 'gratuity-calculator'],
    categoryGroup: 'uae-calculators',
    categoryGroupLabel: 'UAE Salary & Gratuity Calculators',
    categoryGroupLabelUrdu: 'یو اے ای کیلکولیٹرز',
    seoTitle: 'UAE Gratuity Calculator – End-of-Service Benefit Estimator | FreeTools Hub',
    seoDescription: 'Estimate UAE end-of-service gratuity under Federal Decree-Law No. 33 of 2021 with transparent 21-day and 30-day tier breakdowns and PDF export.',
    tips: [
      { title: 'Basic Wage Basis', desc: 'Under Article 51, gratuity is estimated strictly on contractual basic salary, excluding housing and transport allowances.' },
      { title: 'Statutory 2-Year Cap', desc: 'Total end-of-service gratuity is capped at two years (24 months) of basic monthly salary.' },
      { title: 'Verify Final Settlement', desc: 'Results are informational estimates; always confirm final figures against your employment contract and MOHRE.' },
    ],
  },
  'uae-salary-calculator': {
    id: 'uae-salary-calculator',
    primarySlug: 'uae-salary-calculator',
    primaryPath: '/tools/uae-salary-calculator',
    aliases: ['uae-salary-calculator', 'dubai-salary-calculator', 'uae-salary'],
    categoryGroup: 'uae-calculators',
    categoryGroupLabel: 'UAE Salary & Gratuity Calculators',
    categoryGroupLabelUrdu: 'یو اے ای کیلکولیٹرز',
    seoTitle: 'UAE Salary Calculator – Monthly & Annual AED Breakdown | FreeTools Hub',
    seoDescription: 'Calculate gross and net monthly salary in AED across basic pay, housing, transport allowances, and contractual deductions with daily and annual breakdowns.',
    tips: [
      { title: 'Basic vs Gross Split', desc: 'Track what percentage of your total package is allocated to Basic Salary, as EOSB gratuity uses basic pay.' },
      { title: 'Zero Personal Income Tax', desc: 'UAE employment salaries carry 0% personal income tax; review contractual deductions and unpaid leave days.' },
      { title: 'CSV & Print Export', desc: 'Export your itemized monthly and annual AED compensation table to CSV or print cleanly.' },
    ],
  },
  'gemini-photo-prompt': {
    id: 'gemini-photo-prompt',
    primarySlug: 'ai-photo-prompt-generator',
    primaryPath: '/tools/ai-photo-prompt-generator',
    aliases: ['ai-photo-prompt-generator', 'gemini-photo-prompt', 'photo-prompt-generator'],
    categoryGroup: 'ai-tools',
    categoryGroupLabel: 'AI Tools',
    categoryGroupLabelUrdu: 'اے آئی ٹولز',
    seoTitle: 'Gemini AI Photo Prompt Generator – Studio Photography Prompts | FreeTools Hub',
    seoDescription: 'Architect studio-grade photorealistic image prompts for Gemini 2.5, Imagen 3, Midjourney, and Flux with facial identity preservation.',
    tips: [
      { title: 'Camera & Optics', desc: 'Specify camera body, sensor size, and prime lens mm for authentic photographic depth of field.' },
      { title: 'Lighting Conditions', desc: 'Use volumetric lighting, golden hour, or high-key studio softbox descriptions for mood.' },
      { title: 'Negative Prompts', desc: 'Include negative constraints to avoid oversaturation, plastic skin, or distorted anatomy.' },
    ],
  },
  'ai-video-prompt': {
    id: 'ai-video-prompt',
    primarySlug: 'ai-video-prompt-generator',
    primaryPath: '/tools/ai-video-prompt-generator',
    aliases: ['ai-video-prompt-generator', 'ai-video-prompt', 'video-prompt-generator'],
    categoryGroup: 'video-content',
    categoryGroupLabel: 'Video and Content Creation Tools',
    categoryGroupLabelUrdu: 'ویڈیو اور کنٹینٹ ٹولز',
    seoTitle: 'AI Video Prompt Generator – Scene-by-Scene Production Scripts | FreeTools Hub',
    seoDescription: 'Generate multi-scene cinematic directorial scripts for Google Flow, Runway Gen-3, Sora, and Kling with camera movements and voiceovers.',
    tips: [
      { title: 'Camera Motions', desc: 'Specify camera paths like slow forward dolly, crane reveal, or orbital pan for fluid motion.' },
      { title: 'Character Consistency', desc: 'Define consistent wardrobe, hairstyle, and facial features across all sequential scenes.' },
      { title: 'Production Script PDF', desc: 'Download formatted multi-scene shooting scripts ready for production teams.' },
    ],
  },
  'markdown-editor': {
    id: 'markdown-editor',
    primarySlug: 'markdown-editor',
    primaryPath: '/tools/markdown-editor',
    aliases: ['markdown-editor', 'markdown-live-editor'],
    categoryGroup: 'video-content',
    categoryGroupLabel: 'Video and Content Creation Tools',
    categoryGroupLabelUrdu: 'ویڈیو اور کنٹینٹ ٹولز',
    seoTitle: 'Markdown Live Editor – Split-Screen Preview & PDF Export | FreeTools Hub',
    seoDescription: 'Write and preview GitHub Flavored Markdown with real-time split view, formatting toolbar, live stats, and Vector PDF / HTML export.',
    tips: [
      { title: 'Keyboard Shortcuts', desc: 'Use Cmd/Ctrl+B for bold, Cmd/Ctrl+I for italic, and toolbar buttons for tables and task lists.' },
      { title: 'Vector PDF Export', desc: 'Export formatted documents directly to PDF with clean typography and page numbering.' },
    ],
  },
  'seo-page-analyzer': {
    id: 'seo-page-analyzer',
    primarySlug: 'seo-page-analyzer',
    primaryPath: '/tools/seo-page-analyzer',
    aliases: ['seo-page-analyzer', 'seo-analyzer', 'page-analyzer'],
    categoryGroup: 'video-content',
    categoryGroupLabel: 'Video and Content Creation Tools',
    categoryGroupLabelUrdu: 'ویڈیو اور کنٹینٹ ٹولز',
    seoTitle: 'SEO Page Analyzer – On-Page Audit & Meta Tags Checker | FreeTools Hub',
    seoDescription: 'Audit any web page for missing critical SEO elements, heading hierarchy, OpenGraph social cards, performance scores, and actionable fixes.',
    tips: [
      { title: 'Critical Checklist', desc: 'Check the Critical Checklist tab to find missing title, meta description, H1, and canonical tags.' },
      { title: 'Social Share Preview', desc: 'Verify how your webpage looks on Twitter, Facebook, and LinkedIn before publishing.' },
    ],
  },
  'seo-meta-generator': {
    id: 'seo-meta-generator',
    primarySlug: 'seo-meta-generator',
    primaryPath: '/tools/seo-meta-generator',
    aliases: ['seo-meta-generator', 'meta-tag-generator'],
    categoryGroup: 'ai-tools',
    categoryGroupLabel: 'AI Tools',
    categoryGroupLabelUrdu: 'اے آئی ٹولز',
    seoTitle: 'SEO Meta Tags Generator – Live SERP & Social Previews | FreeTools Hub',
    seoDescription: 'Generate optimized title tags, meta descriptions, OpenGraph tags, and Schema.org structured data with live Google SERP simulation.',
    tips: [
      { title: 'Character Limits', desc: 'Keep titles under 60 characters and meta descriptions under 160 characters to avoid truncation.' },
    ],
  },
  'word-counter': {
    id: 'word-counter',
    primarySlug: 'word-counter',
    primaryPath: '/tools/word-counter',
    aliases: ['word-counter', 'character-counter'],
    categoryGroup: 'video-content',
    categoryGroupLabel: 'Video and Content Creation Tools',
    categoryGroupLabelUrdu: 'ویڈیو اور کنٹینٹ ٹولز',
    seoTitle: 'Word & Character Counter – Real-Time Text Metrics & PDF Report | FreeTools Hub',
    seoDescription: 'Count words, characters, sentences, paragraphs, reading and speaking time in real-time. Export executive PDF readability reports.',
    tips: [
      { title: 'Pacing Estimates', desc: 'Standard reading pacing is computed at 200 wpm; speaking pace at 130 wpm for presentations.' },
    ],
  },
  'text-case-converter': {
    id: 'text-case-converter',
    primarySlug: 'text-case-converter',
    primaryPath: '/tools/text-case-converter',
    aliases: ['text-case-converter', 'case-converter'],
    categoryGroup: 'video-content',
    categoryGroupLabel: 'Video and Content Creation Tools',
    categoryGroupLabelUrdu: 'ویڈیو اور کنٹینٹ ٹولز',
    seoTitle: 'Text Case Converter – UPPERCASE, lowercase, Title Case, camelCase | FreeTools Hub',
    seoDescription: 'Instantly convert text between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, and remove redundant whitespace.',
    tips: [
      { title: 'Clean Spaces', desc: 'Click "Clean Spaces" to automatically eliminate double spaces and irregular indentation.' },
    ],
  },
  'image-compressor': {
    id: 'image-compressor',
    primarySlug: 'image-compressor',
    primaryPath: '/tools/image-compressor',
    aliases: ['image-compressor', 'compress-image', 'photo-compressor'],
    categoryGroup: 'photo-image',
    categoryGroupLabel: 'Photo and Image Tools',
    categoryGroupLabelUrdu: 'تصویری ٹولز',
    seoTitle: 'Image Compressor – 100% In-Browser PNG & JPEG Compression | FreeTools Hub',
    seoDescription: 'Compress PNG, JPG, and WebP images directly in your browser with zero server uploads and privacy-first client processing.',
    tips: [
      { title: 'Privacy Guaranteed', desc: 'Your photos never leave your device. Compression runs completely inside browser WebAssembly/Canvas.' },
    ],
  },
  'qr-generator': {
    id: 'qr-generator',
    primarySlug: 'qr-code-generator',
    primaryPath: '/tools/qr-code-generator',
    aliases: ['qr-code-generator', 'qr-generator', 'qr-maker', 'qrcode-generator'],
    categoryGroup: 'photo-image',
    categoryGroupLabel: 'Photo and Image Tools',
    categoryGroupLabelUrdu: 'تصویری ٹولز',
    seoTitle: 'QR Code Generator – Custom Colored QR Codes with PNG Download | FreeTools Hub',
    seoDescription: 'Generate custom colored scannable QR codes for websites, WiFi networks, contact vCards, and text directly in your browser.',
    tips: [
      { title: 'Contrast Ratio', desc: 'Always maintain high contrast between the dark foreground and light background for reliable scanning.' },
    ],
  },
  'color-picker': {
    id: 'color-picker',
    primarySlug: 'color-picker',
    primaryPath: '/tools/color-picker',
    aliases: ['color-picker', 'color-converter', 'palette-generator'],
    categoryGroup: 'photo-image',
    categoryGroupLabel: 'Photo and Image Tools',
    categoryGroupLabelUrdu: 'تصویری ٹولز',
    seoTitle: 'Advanced Color Picker & Palette Studio – HEX, RGB, HSL, CMYK | FreeTools Hub',
    seoDescription: 'Pick colors from images with a live magnifier, convert between HEX, RGB, HSL, and CMYK, generate color harmonies, and check WCAG contrast.',
    tips: [
      { title: 'Image Sampling', desc: 'Upload any image or use the magnifier loupe to extract exact brand hex codes.' },
    ],
  },
  'loan-calculator': {
    id: 'loan-calculator',
    primarySlug: 'loan-calculator',
    primaryPath: '/tools/loan-calculator',
    aliases: ['loan-calculator', 'mortgage-calculator', 'emi-calculator', 'loan-emi-calculator'],
    categoryGroup: 'other-utilities',
    categoryGroupLabel: 'Other Utilities',
    categoryGroupLabelUrdu: 'دیگر مفید اوزار',
    seoTitle: 'Loan & Amortization Calculator – Monthly Repayment Schedule | FreeTools Hub',
    seoDescription: 'Calculate fixed-rate monthly loan repayments, total interest payable, and complete annual amortization schedules for personal and mortgage loans.',
    tips: [
      { title: 'Prepayment Savings', desc: 'Analyze how extra monthly principal payments reduce total loan duration and interest.' },
    ],
  },
  'currency-converter': {
    id: 'currency-converter',
    primarySlug: 'currency-converter',
    primaryPath: '/tools/currency-converter',
    aliases: ['currency-converter', 'forex-converter'],
    categoryGroup: 'other-utilities',
    categoryGroupLabel: 'Other Utilities',
    categoryGroupLabelUrdu: 'دیگر مفید اوزار',
    seoTitle: 'Real-Time Currency Converter – Live Exchange Rates | FreeTools Hub',
    seoDescription: 'Convert between 30+ global currencies with real-time exchange rates, inverse currency swapping, and bank transfer fee estimators.',
    tips: [
      { title: 'Spread Estimator', desc: 'Account for 1% - 3% typical credit card or remittance bank spreads before transferring money.' },
    ],
  },
  'crypto-converter': {
    id: 'crypto-converter',
    primarySlug: 'crypto-converter',
    primaryPath: '/tools/crypto-converter',
    aliases: ['crypto-converter', 'bitcoin-converter'],
    categoryGroup: 'other-utilities',
    categoryGroupLabel: 'Other Utilities',
    categoryGroupLabelUrdu: 'دیگر مفید اوزار',
    seoTitle: 'Cryptocurrency Converter – Bitcoin, Ethereum, Solana Rates | FreeTools Hub',
    seoDescription: 'Convert between Bitcoin (BTC), Ethereum (ETH), Solana (SOL), and major global fiat currencies (USD, EUR, AED, GBP) with live market feeds.',
    tips: [
      { title: 'Real-Time Feed', desc: 'Prices are synchronized with market aggregator APIs for up-to-date valuations.' },
    ],
  },
  'percentage-calculator': {
    id: 'percentage-calculator',
    primarySlug: 'percentage-calculator',
    primaryPath: '/tools/percentage-calculator',
    aliases: ['percentage-calculator'],
    categoryGroup: 'other-utilities',
    categoryGroupLabel: 'Other Utilities',
    categoryGroupLabelUrdu: 'دیگر مفید اوزار',
    seoTitle: 'Percentage Calculator – Increase, Decrease, Percent of Value | FreeTools Hub',
    seoDescription: 'Fast and versatile percentage calculator: compute X% of Y, percentage increase/decrease between numbers, and retail discount savings.',
    tips: [
      { title: 'Growth Rate', desc: 'Calculate exact month-over-month or year-over-year revenue growth in percentage terms.' },
    ],
  },
  'discount-calculator': {
    id: 'discount-calculator',
    primarySlug: 'discount-calculator',
    primaryPath: '/tools/discount-calculator',
    aliases: ['discount-calculator', 'sale-calculator'],
    categoryGroup: 'other-utilities',
    categoryGroupLabel: 'Other Utilities',
    categoryGroupLabelUrdu: 'دیگر مفید اوزار',
    seoTitle: 'Discount & Sale Price Calculator – Voucher & VAT Savings | FreeTools Hub',
    seoDescription: 'Calculate final prices and total savings from percentage discounts, cash vouchers, quantity bundles, and sales tax/VAT.',
    tips: [
      { title: 'Stacked Coupons', desc: 'Combine percentage markdowns with fixed coupon vouchers to see true out-of-pocket totals.' },
    ],
  },
  'unit-converter': {
    id: 'unit-converter',
    primarySlug: 'unit-converter',
    primaryPath: '/tools/unit-converter',
    aliases: ['unit-converter'],
    categoryGroup: 'other-utilities',
    categoryGroupLabel: 'Other Utilities',
    categoryGroupLabelUrdu: 'دیگر مفید اوزار',
    seoTitle: 'Universal Unit Converter – Metric & Imperial Measurement Conversion | FreeTools Hub',
    seoDescription: 'Convert length, weight, temperature, area, volume, speed, and digital data storage with high mathematical precision.',
    tips: [
      { title: 'High Precision', desc: 'Results calculate to 6 significant digits for scientific, engineering, and culinary accuracy.' },
    ],
  },
  'password-generator': {
    id: 'password-generator',
    primarySlug: 'password-generator',
    primaryPath: '/tools/password-generator',
    aliases: ['password-generator', 'strong-password-generator'],
    categoryGroup: 'other-utilities',
    categoryGroupLabel: 'Other Utilities',
    categoryGroupLabelUrdu: 'دیگر مفید اوزار',
    seoTitle: 'Strong Password Generator – Cryptographically Secure Passwords | FreeTools Hub',
    seoDescription: 'Create unbreakable passwords using browser Crypto API with configurable character sets, length, and entropy ratings.',
    tips: [
      { title: 'Length Over Complexity', desc: 'A 16-character passphrase is exponentially more resilient against brute-force attacks.' },
    ],
  },
  'password-strength': {
    id: 'password-strength',
    primarySlug: 'password-strength',
    primaryPath: '/tools/password-strength',
    aliases: ['password-strength', 'password-checker'],
    categoryGroup: 'other-utilities',
    categoryGroupLabel: 'Other Utilities',
    categoryGroupLabelUrdu: 'دیگر مفید اوزار',
    seoTitle: 'Password Strength Checker – Entropy & Brute-Force Crack Time | FreeTools Hub',
    seoDescription: 'Analyze password security in real-time with entropy calculation, brute-force crack time estimates, and dictionary leak checks.',
    tips: [
      { title: 'Zero Network Transfer', desc: 'Your password is never sent over any network; analysis executes 100% locally in your browser.' },
    ],
  },
  'age-calculator': {
    id: 'age-calculator',
    primarySlug: 'age-calculator',
    primaryPath: '/tools/age-calculator',
    aliases: ['age-calculator'],
    categoryGroup: 'other-utilities',
    categoryGroupLabel: 'Other Utilities',
    categoryGroupLabelUrdu: 'دیگر مفید اوزار',
    seoTitle: 'Age Calculator – Exact Chronological Age & Birthday Countdown | FreeTools Hub',
    seoDescription: 'Calculate exact age in years, months, days, hours, and minutes with life milestones and upcoming birthday countdown.',
    tips: [
      { title: 'Leap Years Handled', desc: 'Calculates February 29th and daylight variations with astronomical calendar precision.' },
    ],
  },
  'date-difference': {
    id: 'date-difference',
    primarySlug: 'date-difference',
    primaryPath: '/tools/date-difference',
    aliases: ['date-difference', 'days-between-dates'],
    categoryGroup: 'other-utilities',
    categoryGroupLabel: 'Other Utilities',
    categoryGroupLabelUrdu: 'دیگر مفید اوزار',
    seoTitle: 'Date Difference Calculator – Working Days & Weeks Between Dates | FreeTools Hub',
    seoDescription: 'Determine total calendar days, working business days (excluding weekends), and weeks between any two calendar dates.',
    tips: [
      { title: 'Business Days', desc: 'Filter out Saturdays and Sundays to plan project sprints, delivery deadlines, and notice periods.' },
    ],
  },
  'bmi-calculator': {
    id: 'bmi-calculator',
    primarySlug: 'bmi-calculator',
    primaryPath: '/tools/bmi-calculator',
    aliases: ['bmi-calculator'],
    categoryGroup: 'other-utilities',
    categoryGroupLabel: 'Other Utilities',
    categoryGroupLabelUrdu: 'دیگر مفید اوزار',
    seoTitle: 'BMI Calculator – Body Mass Index & Ideal Weight Range (WHO) | FreeTools Hub',
    seoDescription: 'Calculate Body Mass Index (BMI) and health category according to WHO guidelines using metric or imperial units.',
    tips: [
      { title: 'Ideal Weight', desc: 'View healthy target weight ranges tailored to your exact height in centimeters or feet/inches.' },
    ],
  },
  'timezone-converter': {
    id: 'timezone-converter',
    primarySlug: 'timezone-converter',
    primaryPath: '/tools/timezone-converter',
    aliases: ['timezone-converter', 'time-zone-converter', 'world-clock'],
    categoryGroup: 'other-utilities',
    categoryGroupLabel: 'Other Utilities',
    categoryGroupLabelUrdu: 'دیگر مفید اوزار',
    seoTitle: 'Time Zone Converter – Global Meeting Planner & Live World Clocks | FreeTools Hub',
    seoDescription: 'Convert date and time between global time zones seamlessly with visual day/night indicators and international meeting overlap planner.',
    tips: [
      { title: 'Daylight Saving', desc: 'Automatically accounts for regional DST transitions in North America, Europe, and Asia.' },
    ],
  },
  'json-formatter': {
    id: 'json-formatter',
    primarySlug: 'json-formatter',
    primaryPath: '/tools/json-formatter',
    aliases: ['json-formatter', 'json-validator', 'json-beautifier'],
    categoryGroup: 'other-utilities',
    categoryGroupLabel: 'Other Utilities',
    categoryGroupLabelUrdu: 'دیگر مفید اوزار',
    seoTitle: 'JSON Formatter & Validator – Prettify, Minify & Tree Viewer | FreeTools Hub',
    seoDescription: 'Prettify, validate, minify, and inspect raw JSON data with adjustable indentation, syntax error highlight, and interactive tree viewer.',
    tips: [
      { title: 'Collapsible Tree', desc: 'Switch to the Tree Viewer to visually explore massive nested JSON structures.' },
    ],
  },
  'base64-converter': {
    id: 'base64-converter',
    primarySlug: 'base64-converter',
    primaryPath: '/tools/base64-converter',
    aliases: ['base64-converter', 'base64-encoder', 'base64-decoder'],
    categoryGroup: 'other-utilities',
    categoryGroupLabel: 'Other Utilities',
    categoryGroupLabelUrdu: 'دیگر مفید اوزار',
    seoTitle: 'Base64 Encoder & Decoder – Text and Image Converter | FreeTools Hub',
    seoDescription: 'Convert plain text and images to Base64 strings with UTF-8 compliance, URL-safe toggle, syntax checking, and instant file downloads.',
    tips: [
      { title: 'Data URI', desc: 'Generate ready-to-paste CSS background-image and HTML img src data URIs for web assets.' },
    ],
  },
  'pdf-tools-suite': {
    id: 'pdf-tools-suite',
    primarySlug: 'pdf-tools-suite',
    primaryPath: '/tools/pdf-tools-suite',
    aliases: ['pdf-tools-suite', 'pdf-tools', 'pdf-suite', 'pdf-editor', 'pdf-converter'],
    categoryGroup: 'pdf-tools',
    categoryGroupLabel: 'PDF Tools Suite',
    categoryGroupLabelUrdu: 'پی ڈی ایف ٹولز سوٹ',
    seoTitle: 'PDF Tools Suite – 43 Free Privacy-First Browser PDF Tools | FreeTools Hub',
    seoDescription: 'Convert PDF to Word/Excel/Images, merge, split, compress, edit, password-protect, unlock, OCR, search, and repair PDFs 100% locally inside your browser.',
    tips: [
      { title: '100% Local Privacy', desc: 'All PDF conversions, compression, encryption, and OCR run inside your browser without uploading files to external servers.' },
      { title: 'Interactive Editor', desc: 'Drag and resize text boxes, stamps, watermarks, headers, and page numbers visually before exporting.' },
      { title: 'Real Encryption & Unlock', desc: 'Protect PDFs with 256-bit AES encryption or unlock authorized files cleanly using your valid password.' },
    ],
  },
};

/**
 * Resolves any URL path or slug to a specific tool configuration
 */
export function findToolBySlugOrId(slugOrId: string): ToolRouteConfig | null {
  const clean = slugOrId.toLowerCase().replace(/^\/?tools\/?/, '').replace(/^\//, '');

  // 1. Direct match by ID
  if (TOOL_ROUTES[clean]) {
    return TOOL_ROUTES[clean];
  }

  // 2. Match by primarySlug or aliases
  for (const config of Object.values(TOOL_ROUTES)) {
    if (config.primarySlug === clean || config.aliases.includes(clean)) {
      return config;
    }
  }

  return null;
}

/**
 * Returns canonical primary path for a tool ID
 */
export function getToolPrimaryPath(toolId: string): string {
  const route = TOOL_ROUTES[toolId];
  return route ? route.primaryPath : `/tools/${toolId}`;
}

/**
 * Returns all tools belonging to a category group
 */
export function getToolsByCategoryGroup(group: ToolCategoryGroup): ToolDefinition[] {
  const toolIds = Object.values(TOOL_ROUTES)
    .filter((r) => r.categoryGroup === group)
    .map((r) => r.id);

  return TOOLS_LIST.filter((t) => toolIds.includes(t.id));
}
