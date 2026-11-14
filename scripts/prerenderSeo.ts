import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');

// Canonical domain configuration
const CANONICAL_DOMAIN = (
  process.env.VITE_SITE_URL ||
  process.env.SITE_URL ||
  'https://freetoolshub1.netlify.app'
).replace(/\/+$/, '');

interface ToolMetadata {
  id: string;
  slug: string;
  name: string;
  nameUrdu: string;
  category: string;
  seoTitle: string;
  seoDescription: string;
  summary: string;
  instructions: string[];
  features: string;
  relatedSlugs: string[];
}

const TOOLS_METADATA: ToolMetadata[] = [
  {
    id: 'resume-builder',
    slug: 'cv-maker',
    name: 'CV & Resume Maker',
    nameUrdu: 'سی وی اور ریزیومے میکر',
    category: 'Career & CV Tools',
    seoTitle: 'CV & Resume Maker – Free ATS Professional CV Generator | FreeTools Hub',
    seoDescription: 'Create professional, ATS-friendly resumes with live multi-template preview, custom typography, profile photo upload, and instant vector PDF download.',
    summary: 'Build structured, Applicant Tracking System (ATS)-readable CVs and resumes directly in your browser with live A4 preview, four layout templates, customizable typography, local auto-save, JSON backup/import, and downloadable vector PDF output.',
    instructions: [
      'Enter your full name, target job title, contact details, profile photo, and professional summary.',
      'Add chronological work experience, education history, skills, languages, certifications, or projects.',
      'Select one of four ATS templates (Modern, Classic, Minimal, Executive) and customize accent color.',
      'Download your resume as an ATS-optimized Vector PDF or export a JSON backup to edit anytime.',
    ],
    features: 'ATS keyword compatibility, vector PDF export, visual snapshot download, browser-only encryption and local auto-save.',
    relatedSlugs: ['word-counter', 'text-case-converter', 'markdown-editor', 'uae-salary-calculator'],
  },
  {
    id: 'uae-gratuity',
    slug: 'uae-gratuity-calculator',
    name: 'UAE Gratuity Calculator',
    nameUrdu: 'یو اے ای گریجویٹی کیلکولیٹر',
    category: 'UAE Financial Calculators',
    seoTitle: 'UAE Gratuity Calculator – End-of-Service Benefit Estimator | FreeTools Hub',
    seoDescription: 'Estimate UAE end-of-service gratuity under Federal Decree-Law No. 33 of 2021 with transparent 21-day and 30-day tier breakdowns and PDF export.',
    summary: 'Accurately estimate statutory UAE end-of-service benefits (EOSB) for private-sector employees under UAE Federal Decree-Law No. 33 of 2021, accounting for limited contracts, resignation, termination, and unpaid leave deductions.',
    instructions: [
      'Select your employment start date and last working date.',
      'Enter your monthly contractual Basic Salary in AED (excluding housing and transport allowances).',
      'Select your contract type, separation reason, and enter any unpaid leave days.',
      'Inspect your exact tenure breakdown, Tier 1 (21 days) and Tier 2 (30 days) entitlements, and statutory 2-year salary cap check.',
    ],
    features: 'Federal Decree-Law No. 33 of 2021 compliance, Tier 1 & Tier 2 calculation, basic wage daily rate formula, PDF & CSV statements.',
    relatedSlugs: ['uae-salary-calculator', 'loan-calculator', 'currency-converter'],
  },
  {
    id: 'uae-salary-calculator',
    slug: 'uae-salary-calculator',
    name: 'UAE Salary Calculator',
    nameUrdu: 'یو اے ای سیلری کیلکولیٹر',
    category: 'UAE Financial Calculators',
    seoTitle: 'UAE Salary Calculator – Monthly & Annual AED Breakdown | FreeTools Hub',
    seoDescription: 'Calculate gross and net monthly salary in AED across basic pay, housing, transport allowances, and contractual deductions with daily and annual breakdowns.',
    summary: 'Calculate gross and net monthly compensation packages in UAE Dirhams (AED), breaking down basic salary, housing allowance, transport allowance, contractual deductions, and Emirati GPSSA pension contributions.',
    instructions: [
      'Enter your monthly Basic Salary along with Housing and Transport allowances in AED.',
      'Add optional fixed deductions or unpaid leave days for the pay cycle.',
      'Toggle Emirati GPSSA 5% employee pension contribution if applicable.',
      'Review net monthly take-home pay, annual gross earnings, and daily basic rates.',
    ],
    features: '0% income tax breakdown, statutory basic-to-gross ratios, 365-day daily wage conversion, CSV compensation export.',
    relatedSlugs: ['uae-gratuity-calculator', 'loan-calculator', 'currency-converter', 'cv-maker'],
  },
  {
    id: 'gemini-photo-prompt',
    slug: 'ai-photo-prompt-generator',
    name: 'Gemini AI Photo Prompt Generator',
    nameUrdu: 'جیمینائی اے آئی فوٹو پرامپٹ جنریٹر',
    category: 'AI & Prompt Architecture',
    seoTitle: 'Gemini AI Photo Prompt Generator – Studio Photography Prompts | FreeTools Hub',
    seoDescription: 'Architect studio-grade photorealistic image prompts for Gemini 2.5, Imagen 3, Midjourney, and Flux with facial identity preservation and lens controls.',
    summary: 'Architect comprehensive natural-language image prompts combining subject description, photographic styles, studio lighting setups, camera lens focal lengths, color grading, aspect ratios, and negative constraints.',
    instructions: [
      'Enter your subject concept or choose a curated studio photography preset.',
      'Specify visual style, lighting setup (e.g. Rembrandt, volumetric, golden hour), and camera lens.',
      'Toggle face identity preservation or negative prompts to prevent unwanted artifacts.',
      'Generate, copy, or export your production-ready prompt as a Creative Brief PDF.',
    ],
    features: 'Camera focal length presets, studio lighting controls, face consistency anchors, negative prompt builder.',
    relatedSlugs: ['ai-video-prompt-generator', 'color-picker', 'image-compressor'],
  },
  {
    id: 'ai-video-prompt',
    slug: 'ai-video-prompt-generator',
    name: 'AI Video Prompt Generator',
    nameUrdu: 'اے آئی ویڈیو پرامپٹ جنریٹر',
    category: 'AI & Prompt Architecture',
    seoTitle: 'AI Video Prompt Generator – Scene-by-Scene Production Scripts | FreeTools Hub',
    seoDescription: 'Generate multi-scene cinematic directorial scripts for Google Flow, Runway Gen-3, Sora, and Kling with camera movements and voiceovers.',
    summary: 'Create structured scene-by-scene directorial scripts for text-to-video models with visual consistency rules, camera movements, character action cues, dialogue lines, and audio effects.',
    instructions: [
      'Define video concept, visual genre, target duration, and aspect ratio.',
      'Describe recurring characters for consistent visual identity across scenes.',
      'Add individual scenes with camera motion (pan, tilt, orbit, tracking) and timing.',
      'Compile and export your multi-scene production script as TXT or PDF.',
    ],
    features: 'Scene-by-scene script builder, camera movement directives, character visual consistency, PDF directorial brief.',
    relatedSlugs: ['ai-photo-prompt-generator', 'markdown-editor', 'word-counter'],
  },
  {
    id: 'markdown-editor',
    slug: 'markdown-editor',
    name: 'Markdown Live Editor',
    nameUrdu: 'مارک ڈاؤن لائیو ایڈیٹر',
    category: 'Developer & Content Utilities',
    seoTitle: 'Markdown Live Editor – Split-Screen Preview & PDF Export | FreeTools Hub',
    seoDescription: 'Write and preview GitHub Flavored Markdown with real-time split view, formatting toolbar, live stats, and Vector PDF / HTML export.',
    summary: 'A fast, split-screen markdown editor supporting GitHub Flavored Markdown (GFM), syntax highlighting, tables, task lists, formatting shortcuts, and instant Vector PDF or HTML export.',
    instructions: [
      'Type or paste Markdown into the left editor pane.',
      'Use the top toolbar to insert headings, bold text, code blocks, tables, or checklists.',
      'Preview rendered HTML in real time on the right pane.',
      'Download your document as HTML, Markdown (.md), or formatted PDF.',
    ],
    features: 'GitHub Flavored Markdown, real-time split view, word and reading time metrics, PDF & HTML export.',
    relatedSlugs: ['word-counter', 'text-case-converter', 'json-formatter', 'seo-meta-generator'],
  },
  {
    id: 'seo-page-analyzer',
    slug: 'seo-page-analyzer',
    name: 'SEO Page Analyzer',
    nameUrdu: 'ایس ای او پیج اینالائزر',
    category: 'Developer & Content Utilities',
    seoTitle: 'SEO Page Analyzer – On-Page Audit & Meta Tags Checker | FreeTools Hub',
    seoDescription: 'Audit any web page for missing critical SEO elements, heading hierarchy, OpenGraph social cards, performance scores, and actionable fixes.',
    summary: 'Inspect web pages for on-page SEO health, meta tags, OpenGraph social previews, Twitter cards, heading outline (H1-H6), internal links, image alt attributes, and Core Web Vitals readiness.',
    instructions: [
      'Enter any public website URL or paste raw HTML into the editor.',
      'Click Analyze to evaluate meta tags, headings, social previews, and performance.',
      'Review critical issues, warnings, and passed checks with copyable fix snippets.',
      'Download an executive Technical SEO Audit Report PDF.',
    ],
    features: 'Meta tag inspection, heading hierarchy validator, OpenGraph live simulator, PDF audit report generator.',
    relatedSlugs: ['seo-meta-generator', 'word-counter', 'markdown-editor'],
  },
  {
    id: 'seo-meta-generator',
    slug: 'seo-meta-generator',
    name: 'SEO Meta Tags Generator',
    nameUrdu: 'ایس ای او میٹا ٹیگز جنریٹر',
    category: 'Developer & Content Utilities',
    seoTitle: 'SEO Meta Tags Generator – Live SERP & Social Previews | FreeTools Hub',
    seoDescription: 'Generate optimized title tags, meta descriptions, OpenGraph tags, and Schema.org structured data with live Google SERP simulation.',
    summary: 'Generate search-engine-optimized HTML meta tags, OpenGraph cards, Twitter cards, and Schema.org JSON-LD structured data with interactive live Google SERP and mobile snippets.',
    instructions: [
      'Enter page title, meta description, and canonical URL.',
      'Configure OpenGraph and Twitter card image URLs and descriptions.',
      'Inspect real-time Google search snippet and social media share cards.',
      'Copy generated HTML tags or JSON-LD structured data block with one click.',
    ],
    features: 'Character length counters, Google desktop/mobile SERP preview, OpenGraph card preview, Schema.org generator.',
    relatedSlugs: ['seo-page-analyzer', 'word-counter', 'json-formatter'],
  },
  {
    id: 'word-counter',
    slug: 'word-counter',
    name: 'Word & Character Counter',
    nameUrdu: 'الفاظ اور حروف کاؤنٹر',
    category: 'Developer & Content Utilities',
    seoTitle: 'Word & Character Counter – Real-Time Text Metrics & PDF Report | FreeTools Hub',
    seoDescription: 'Count words, characters, sentences, paragraphs, reading and speaking time in real-time. Export executive PDF readability reports.',
    summary: 'Count words, characters, spaces, sentences, paragraphs, syllables, reading time, and speaking time in real time with Coleman-Liau and Flesch-Kincaid readability scoring.',
    instructions: [
      'Type or paste text into the live analysis area.',
      'Review real-time counts for words, characters, sentences, and paragraphs.',
      'Inspect estimated reading time, speaking duration, and readability scores.',
      'Export the complete text analysis report as PDF or CSV.',
    ],
    features: 'Live word and character counters, readability index scoring, reading/speaking time estimates, PDF reports.',
    relatedSlugs: ['text-case-converter', 'markdown-editor', 'seo-meta-generator'],
  },
  {
    id: 'text-case-converter',
    slug: 'text-case-converter',
    name: 'Text Case Converter',
    nameUrdu: 'ٹیکسٹ کیس کنورٹر',
    category: 'Developer & Content Utilities',
    seoTitle: 'Text Case Converter – UPPERCASE, lowercase, Title Case, camelCase | FreeTools Hub',
    seoDescription: 'Instantly convert text between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, and remove redundant whitespace.',
    summary: 'Convert text between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, kebab-case, and dot.case with instant one-click copying.',
    instructions: [
      'Paste your source text into the input field.',
      'Click your desired conversion format (Title Case, UPPERCASE, camelCase, etc.).',
      'Preview the converted output and click Copy to Clipboard.',
    ],
    features: '9 case conversion modes, whitespace normalizer, character counter, instant clipboard copy.',
    relatedSlugs: ['word-counter', 'markdown-editor', 'json-formatter', 'base64-converter'],
  },
  {
    id: 'image-compressor',
    slug: 'image-compressor',
    name: 'Image Compressor',
    nameUrdu: 'تصویر کمپریسر',
    category: 'Graphics & Media Tools',
    seoTitle: 'Image Compressor – 100% In-Browser PNG & JPEG Compression | FreeTools Hub',
    seoDescription: 'Compress PNG, JPG, and WebP images directly in your browser with zero server uploads and privacy-first client processing.',
    summary: 'Compress PNG, JPEG, and WebP images directly inside your browser using HTML5 Canvas. Zero images are uploaded to any external server, guaranteeing total privacy.',
    instructions: [
      'Drag and drop an image or click Browse to select a PNG, JPG, or WebP file.',
      'Adjust the compression quality slider and max dimensions.',
      'Compare original vs compressed file size and visual preview.',
      'Download the optimized image directly to your device.',
    ],
    features: 'Client-side processing, PNG/JPEG/WebP support, file size reduction preview, privacy guarantee.',
    relatedSlugs: ['qr-code-generator', 'color-picker', 'base64-converter'],
  },
  {
    id: 'qr-code-generator',
    slug: 'qr-code-generator',
    name: 'QR Code Generator',
    nameUrdu: 'کیو آر کوڈ جنریٹر',
    category: 'Graphics & Media Tools',
    seoTitle: 'QR Code Generator – Custom Colored QR Codes with PNG Download | FreeTools Hub',
    seoDescription: 'Generate custom colored scannable QR codes for websites, WiFi networks, contact vCards, and text directly in your browser.',
    summary: 'Create custom colored, high-resolution scannable QR codes for website URLs, WiFi login credentials, contact vCards, emails, phone numbers, and plain text.',
    instructions: [
      'Select your data type (URL, WiFi, vCard, Text, or Email).',
      'Enter the destination details and customize foreground and background colors.',
      'Choose error correction level (L, M, Q, H) for scannability.',
      'Download high-resolution PNG or SVG vector QR codes.',
    ],
    features: 'Custom color palettes, WiFi & vCard presets, high-res PNG and SVG download, error correction tuning.',
    relatedSlugs: ['image-compressor', 'color-picker', 'base64-converter'],
  },
  {
    id: 'color-picker',
    slug: 'color-picker',
    name: 'Color Picker & Palette Studio',
    nameUrdu: 'کلر پکر اور پیلیٹ اسٹوڈیو',
    category: 'Graphics & Media Tools',
    seoTitle: 'Advanced Color Picker & Palette Studio – HEX, RGB, HSL, CMYK | FreeTools Hub',
    seoDescription: 'Pick colors from images with a live magnifier, convert between HEX, RGB, HSL, and CMYK, generate color harmonies, and check WCAG contrast.',
    summary: 'A complete color workstation featuring image eyedropper with live pixel magnifier, HEX/RGB/HSL/CMYK conversion, complementary/triadic harmony generation, and WCAG contrast ratio validation.',
    instructions: [
      'Use the color spectrum or upload an image to sample colors with the eyedropper.',
      'View converted values across HEX, RGB, HSL, and CMYK formats.',
      'Explore harmonious color schemes (complementary, analogous, triadic).',
      'Verify WCAG AA and AAA accessibility contrast against light and dark backgrounds.',
    ],
    features: 'Eyedropper pixel magnifier, multi-format color conversion, harmony generator, WCAG accessibility check.',
    relatedSlugs: ['image-compressor', 'qr-code-generator', 'ai-photo-prompt-generator'],
  },
  {
    id: 'loan-calculator',
    slug: 'loan-calculator',
    name: 'Loan & Amortization Calculator',
    nameUrdu: 'لون اور قسط کیلکولیٹر',
    category: 'Financial & Math Calculators',
    seoTitle: 'Loan & Amortization Calculator – Monthly Repayment Schedule | FreeTools Hub',
    seoDescription: 'Calculate fixed-rate monthly loan repayments, total interest payable, and complete annual amortization schedules for personal and mortgage loans.',
    summary: 'Calculate fixed-rate monthly loan EMI repayments, total interest charges, principal repayment ratios, and complete annual amortization schedules for personal, auto, and mortgage loans.',
    instructions: [
      'Enter loan principal amount, annual interest rate (%), and tenure in years.',
      'Review monthly EMI payment, total interest payable, and total cost of borrowing.',
      'Inspect annual and monthly amortization breakdown charts.',
      'Export the amortization schedule as CSV or PDF report.',
    ],
    features: 'Fixed-rate amortization, monthly/annual breakdown, interactive interest-to-principal charts, PDF schedule export.',
    relatedSlugs: ['currency-converter', 'crypto-converter', 'uae-salary-calculator', 'percentage-calculator'],
  },
  {
    id: 'currency-converter',
    slug: 'currency-converter',
    name: 'Real-Time Currency Converter',
    nameUrdu: 'کرنسی کنورٹر',
    category: 'Financial & Math Calculators',
    seoTitle: 'Real-Time Currency Converter – Live Exchange Rates | FreeTools Hub',
    seoDescription: 'Convert between 30+ global currencies with real-time exchange rates, inverse currency swapping, and bank transfer fee estimators.',
    summary: 'Convert amounts across 30+ major global currencies with live market exchange rates, historical rate comparisons, inverted currency pairs, and bank transfer margin estimators.',
    instructions: [
      'Enter the monetary amount to convert.',
      'Select source and target currencies (USD, EUR, AED, GBP, PKR, INR, SAR, etc.).',
      'Inspect converted amount, inverse rate, and fee estimates.',
    ],
    features: '30+ fiat currencies, live conversion feeds, inverse rate swapping, bank spread estimator.',
    relatedSlugs: ['crypto-converter', 'loan-calculator', 'uae-salary-calculator'],
  },
  {
    id: 'crypto-converter',
    slug: 'crypto-converter',
    name: 'Cryptocurrency Converter',
    nameUrdu: 'کرپٹو کرنسی کنورٹر',
    category: 'Financial & Math Calculators',
    seoTitle: 'Cryptocurrency Converter – Bitcoin, Ethereum, Solana Rates | FreeTools Hub',
    seoDescription: 'Convert between Bitcoin (BTC), Ethereum (ETH), Solana (SOL), and major global fiat currencies (USD, EUR, AED, GBP) with live market feeds.',
    summary: 'Convert cryptocurrency values between Bitcoin (BTC), Ethereum (ETH), Solana (SOL), Ripple (XRP), Cardano (ADA), and global fiat currencies (USD, EUR, AED, GBP, SAR).',
    instructions: [
      'Enter crypto amount or fiat equivalent.',
      'Select cryptocurrency and fiat currency target.',
      'View live market price, Satoshi breakdown, and recent market movement.',
    ],
    features: 'Major cryptocurrencies (BTC, ETH, SOL), fiat currency pairs, market rate conversion.',
    relatedSlugs: ['currency-converter', 'loan-calculator', 'percentage-calculator'],
  },
  {
    id: 'percentage-calculator',
    slug: 'percentage-calculator',
    name: 'Percentage Calculator',
    nameUrdu: 'فیصد کیلکولیٹر',
    category: 'Financial & Math Calculators',
    seoTitle: 'Percentage Calculator – Increase, Decrease, Percent of Value | FreeTools Hub',
    seoDescription: 'Fast and versatile percentage calculator: compute X% of Y, percentage increase/decrease between numbers, and retail discount savings.',
    summary: 'Compute X% of Y, calculate percentage increase or decrease between two numbers, find what percentage X is of Y, and calculate fractional ratios with high precision.',
    instructions: [
      'Select calculation mode (Percentage of Value, Percentage Change, or Value Fraction).',
      'Input numerical values in the corresponding fields.',
      'Instantly view calculated percentage, step-by-step formula, and difference.',
    ],
    features: '3 calculation modes, step-by-step math explanations, percentage increase/decrease, fraction conversion.',
    relatedSlugs: ['discount-calculator', 'loan-calculator', 'unit-converter'],
  },
  {
    id: 'discount-calculator',
    slug: 'discount-calculator',
    name: 'Discount & Sale Calculator',
    nameUrdu: 'ڈسکاؤنٹ اور سیل کیلکولیٹر',
    category: 'Financial & Math Calculators',
    seoTitle: 'Discount & Sale Price Calculator – Voucher & VAT Savings | FreeTools Hub',
    seoDescription: 'Calculate final prices and total savings from percentage discounts, cash vouchers, quantity bundles, and sales tax/VAT.',
    summary: 'Calculate sale prices, total cash savings, double discount stacking, voucher coupons, and sales tax / VAT additions for smart retail shopping.',
    instructions: [
      'Enter original retail price and primary discount percentage.',
      'Optionally add secondary stacked discount or cash voucher amount.',
      'Optionally include sales tax / VAT rate.',
      'View final payable price, total money saved, and effective discount rate.',
    ],
    features: 'Stacked discount calculation, coupon voucher support, sales tax/VAT inclusion, total savings breakdown.',
    relatedSlugs: ['percentage-calculator', 'currency-converter', 'unit-converter'],
  },
  {
    id: 'unit-converter',
    slug: 'unit-converter',
    name: 'Universal Unit Converter',
    nameUrdu: 'یونٹ کنورٹر',
    category: 'Everyday & Measurement Utilities',
    seoTitle: 'Universal Unit Converter – Metric & Imperial Measurement Conversion | FreeTools Hub',
    seoDescription: 'Convert length, weight, temperature, area, volume, speed, and digital data storage with high mathematical precision.',
    summary: 'Convert measurements across Metric and Imperial systems covering length, weight/mass, temperature, area, volume, speed, time, and digital data storage.',
    instructions: [
      'Select measurement category (Length, Weight, Temperature, Area, Volume, Speed, Data).',
      'Enter value and choose input unit.',
      'View converted values across all related units simultaneously.',
    ],
    features: '7 measurement categories, metric and imperial standards, high mathematical precision.',
    relatedSlugs: ['percentage-calculator', 'bmi-calculator', 'age-calculator'],
  },
  {
    id: 'password-generator',
    slug: 'password-generator',
    name: 'Strong Password Generator',
    nameUrdu: 'مضبوط پاس ورڈ جنریٹر',
    category: 'Security & Developer Utilities',
    seoTitle: 'Strong Password Generator – Cryptographically Secure Passwords | FreeTools Hub',
    seoDescription: 'Create unbreakable passwords using browser Crypto API with configurable character sets, length, and entropy ratings.',
    summary: 'Generate cryptographically random passwords, memorable passphrases, and secure PIN codes using the browser Web Cryptography API with entropy security scoring.',
    instructions: [
      'Select password length (8 to 64 characters).',
      'Toggle uppercase letters, lowercase letters, numbers, and symbols.',
      'Optionally exclude ambiguous characters (like 1, l, I, 0, O).',
      'Click Generate and copy your unbreakable password.',
    ],
    features: 'Web Crypto API randomness, entropy bits calculation, memorable passphrase mode, ambiguous character exclusion.',
    relatedSlugs: ['password-strength', 'base64-converter', 'json-formatter'],
  },
  {
    id: 'password-strength',
    slug: 'password-strength',
    name: 'Password Strength Checker',
    nameUrdu: 'پاس ورڈ طاقت چیکر',
    category: 'Security & Developer Utilities',
    seoTitle: 'Password Strength Checker – Entropy & Brute-Force Crack Time | FreeTools Hub',
    seoDescription: 'Analyze password security in real-time with entropy calculation, brute-force crack time estimates, and dictionary leak checks.',
    summary: 'Evaluate password strength and entropy in real time with estimated brute-force crack times, common pattern warnings, and security recommendations. 100% client-side.',
    instructions: [
      'Type a password into the analysis input.',
      'Review entropy score (bits), strength meter, and estimated crack time.',
      'Read actionable security recommendations to strengthen credentials.',
    ],
    features: 'Real-time entropy analysis, brute-force time estimation, pattern detection, 100% browser-only evaluation.',
    relatedSlugs: ['password-generator', 'base64-converter', 'json-formatter'],
  },
  {
    id: 'age-calculator',
    slug: 'age-calculator',
    name: 'Age Calculator',
    nameUrdu: 'عمر کیلکولیٹر',
    category: 'Everyday & Measurement Utilities',
    seoTitle: 'Age Calculator – Exact Chronological Age & Birthday Countdown | FreeTools Hub',
    seoDescription: 'Calculate exact age in years, months, days, hours, and minutes with life milestones and upcoming birthday countdown.',
    summary: 'Calculate exact chronological age in years, months, weeks, days, hours, and minutes from birth date, with upcoming birthday countdown and life milestone statistics.',
    instructions: [
      'Select your birth date.',
      'Optionally specify age as of a specific past or future date.',
      'View exact age breakdown, days lived, and countdown to next birthday.',
    ],
    features: 'Exact years/months/days calculation, total days and hours lived, birthday countdown timer.',
    relatedSlugs: ['date-difference', 'bmi-calculator', 'timezone-converter'],
  },
  {
    id: 'date-difference',
    slug: 'date-difference',
    name: 'Date Difference Calculator',
    nameUrdu: 'تاریخوں کا فرق کیلکولیٹر',
    category: 'Everyday & Measurement Utilities',
    seoTitle: 'Date Difference Calculator – Working Days & Weeks Between Dates | FreeTools Hub',
    seoDescription: 'Determine total calendar days, working business days (excluding weekends), and weeks between any two calendar dates.',
    summary: 'Calculate total days, weeks, months, and business working days (excluding Saturdays and Sundays) between any two dates on the calendar.',
    instructions: [
      'Select starting date and ending date.',
      'Toggle whether to include or exclude weekends and custom holidays.',
      'View total calendar days, working days, and week counts.',
    ],
    features: 'Calendar days count, working business days calculation, customizable weekend filters.',
    relatedSlugs: ['age-calculator', 'timezone-converter', 'uae-gratuity-calculator'],
  },
  {
    id: 'bmi-calculator',
    slug: 'bmi-calculator',
    name: 'BMI Health Calculator',
    nameUrdu: 'بی ایم آئی کیلکولیٹر',
    category: 'Everyday & Measurement Utilities',
    seoTitle: 'BMI Calculator – Body Mass Index & Ideal Weight Range (WHO) | FreeTools Hub',
    seoDescription: 'Calculate Body Mass Index (BMI) and health category according to WHO guidelines using metric or imperial units.',
    summary: 'Calculate Body Mass Index (BMI), WHO weight category, and healthy target weight range using metric (cm/kg) or imperial (feet/inches/lbs) measurements.',
    instructions: [
      'Select Metric or Imperial measurement system.',
      'Enter your height, current weight, age, and gender.',
      'Inspect your BMI score, WHO category classification, and ideal weight targets.',
    ],
    features: 'WHO classification standards, Metric and Imperial support, healthy weight range target calculation.',
    relatedSlugs: ['unit-converter', 'age-calculator', 'percentage-calculator'],
  },
  {
    id: 'timezone-converter',
    slug: 'timezone-converter',
    name: 'Time Zone Converter & Meeting Planner',
    nameUrdu: 'ٹائم زون کنورٹر',
    category: 'Everyday & Measurement Utilities',
    seoTitle: 'Time Zone Converter – Global Meeting Planner & Live World Clocks | FreeTools Hub',
    seoDescription: 'Convert date and time between global time zones seamlessly with visual day/night indicators and international meeting overlap planner.',
    summary: 'Convert times between worldwide time zones (Dubai GST, London GMT/BST, New York EST/EDT, Tokyo JST, Karachi PKT, etc.) with day/night sliders and international meeting scheduling.',
    instructions: [
      'Choose source city or time zone.',
      'Add target comparison cities.',
      'Drag the interactive 24-hour time slider to find overlapping working hours.',
    ],
    features: 'Global time zones, day/night visual indicators, multi-city overlap planner, DST awareness.',
    relatedSlugs: ['date-difference', 'age-calculator', 'unit-converter'],
  },
  {
    id: 'json-formatter',
    slug: 'json-formatter',
    name: 'JSON Formatter & Validator',
    nameUrdu: 'جیسن فارمیٹر اور ویلیڈیٹر',
    category: 'Security & Developer Utilities',
    seoTitle: 'JSON Formatter & Validator – Prettify, Minify & Tree Viewer | FreeTools Hub',
    seoDescription: 'Prettify, validate, minify, and inspect raw JSON data with adjustable indentation, syntax error highlight, and interactive tree viewer.',
    summary: 'Prettify, format, validate, minify, and inspect JSON payloads with precise syntax error highlighting, collapsible object tree visualization, and instant JSON download.',
    instructions: [
      'Paste raw or minified JSON text into the editor.',
      'Click Beautify to format with 2 or 4 spaces, or Minify to strip whitespace.',
      'Review syntax validation errors with exact line and column numbers.',
      'Copy clean JSON or download as a .json file.',
    ],
    features: 'Syntax error pinpointing, collapsible tree view, 2/4-space indent formatting, minification.',
    relatedSlugs: ['base64-converter', 'markdown-editor', 'text-case-converter'],
  },
  {
    id: 'base64-converter',
    slug: 'base64-converter',
    name: 'Base64 Encoder & Decoder',
    nameUrdu: 'بیس 64 کنورٹر',
    category: 'Security & Developer Utilities',
    seoTitle: 'Base64 Encoder & Decoder – Text and Image Converter | FreeTools Hub',
    seoDescription: 'Convert plain text and images to Base64 strings with UTF-8 compliance, URL-safe toggle, syntax checking, and instant file downloads.',
    summary: 'Encode plain text and binary files (PNG, JPG, PDF) to Base64 data URIs, or decode Base64 strings back to readable UTF-8 text and downloadable binary files.',
    instructions: [
      'Select Encode or Decode mode.',
      'Paste plain text, Base64 string, or drop an image/binary file.',
      'Toggle URL-Safe formatting or Data URI prefix if required.',
      'Copy encoded string or download the decoded file.',
    ],
    features: 'Text and file support, Data URI prefixes, URL-safe Base64 mode, instant binary file download.',
    relatedSlugs: ['json-formatter', 'image-compressor', 'qr-code-generator'],
  },
  {
    id: 'pdf-tools-suite',
    slug: 'pdf-tools-suite',
    name: 'PDF Tools Suite (43 Tools)',
    nameUrdu: 'پی ڈی ایف ٹولز سوٹ (43 ٹولز)',
    category: 'PDF & Document Tools',
    seoTitle: 'PDF Tools Suite – 43 Free Client-Side PDF Converters, Editor & Security | FreeTools Hub',
    seoDescription:
      'All-in-one browser-based PDF Tools Suite featuring 43 real utilities: convert PDF to Word, Excel, JPG, PNG, TXT; merge, split, compress, edit, OCR, watermark, protect, and unlock PDFs locally.',
    summary:
      'A complete 43-tool PDF workstation operating 100% locally inside your browser: bi-directional Office/Image/Text PDF conversions, page merging/splitting/reordering, lossless & rasterized compression, interactive canvas editing, 256-bit AES encryption, OCR text extraction, keyword search, and repair.',
    instructions: [
      'Select any of the 43 tools across Convert, Organize, Compress, Edit, Security, or Advanced PDF categories.',
      'Drag and drop PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), image, or text files directly into the workspace.',
      'Configure conversion quality, page ranges, watermarks, or encryption passwords without uploading files to external servers.',
      'Preview the processed PDF, text, spreadsheet, or image gallery and download individually or as a bundled ZIP archive.',
    ],
    features:
      '43 browser-native PDF tools across 7 categories, real Office/image conversions, interactive overlay editor, AES encryption, Tesseract OCR, and ZIP export.',
    relatedSlugs: ['cv-maker', 'markdown-editor', 'image-compressor'],
  },
];

const STATIC_PAGES = [
  {
    slug: 'tools',
    title: `All ${TOOLS_METADATA.length} Free Online Tools & Calculators | FreeTools Hub`,
    description:
      'Browse the complete FreeTools Hub directory: PDF Tools Suite (43 tools), ATS CV maker, UAE monthly salary & gratuity calculators, AI prompt generators, SEO analyzer, and developer utilities.',
    h1: `Complete Directory of ${TOOLS_METADATA.length} Free Online Tools & Calculators`,
    content: `Explore all ${TOOLS_METADATA.length} browser-based tools built for PDF workflows, career advancement, UAE labor law compliance, AI prompt engineering, media optimization, and developer productivity.`,
  },
  {
    slug: 'about',
    title: 'About FreeTools Hub – Architecture, Mission & Privacy | AbbasPro',
    description: 'Learn how AbbasPro / FreeTools Hub builds fast, browser-based career, UAE financial, AI prompt, and developer tools with client-side privacy.',
    h1: 'About FreeTools Hub & AbbasPro',
    content: 'FreeTools Hub was created by AbbasPro with a fundamental privacy-first commitment: heavy data processing, document generation, and calculations happen 100% inside your browser.',
  },
  {
    slug: 'contact',
    title: 'Contact & Support – Report a Bug or Request a Tool | FreeTools Hub',
    description: 'Contact AbbasPro / FreeTools Hub to report calculation issues, request new online utilities, or ask technical questions.',
    h1: 'Contact & Support',
    content: 'Have feedback, found a bug in a calculation engine, or wish to request a new productivity tool? Reach out to the FreeTools Hub engineering team.',
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy – Client-Side Data & Local Storage | FreeTools Hub',
    description: 'Read the FreeTools Hub Privacy Policy explaining how resume drafts, UAE salary inputs, and files stay locally inside your browser.',
    h1: 'Privacy Policy',
    content: 'Your privacy is guaranteed by architecture. FreeTools Hub does not store resume drafts, financial figures, uploaded photos, or processed files on any remote server.',
  },
  {
    slug: 'terms',
    title: 'Terms of Use – Permitted Usage & Ownership | FreeTools Hub',
    description: 'Review the FreeTools Hub Terms of Use covering free personal and commercial usage, user content ownership, and acceptable conduct.',
    h1: 'Terms of Use',
    content: 'By accessing FreeTools Hub, you agree to fair and lawful usage. All documents, resumes, prompts, and outputs created by you remain 100% your own property.',
  },
  {
    slug: 'disclaimer',
    title: 'Legal & Calculator Disclaimer – UAE Labour Law, Finance & Health | FreeTools Hub',
    description: 'Important disclaimers for UAE Gratuity, UAE Salary, Loan EMI, Currency/Crypto, BMI, and AI Prompt calculators on FreeTools Hub.',
    h1: 'Legal & Calculator Disclaimers',
    content: 'Calculators and estimators provided on FreeTools Hub are for informational and planning purposes only. They do not constitute formal legal, financial, or medical advice.',
  },
];

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generatePrerenderedHomepageHtml(baseTemplate: string): string {
  const title = 'FreeTools Hub – Free Online Tools & UAE Calculators';
  const description =
    `FreeTools Hub offers ${TOOLS_METADATA.length} free privacy-first online tools, including a PDF Tools Suite, ATS CV maker, UAE gratuity & salary calculators, AI prompt generators, and SEO utilities.`;
  const canonicalUrl = `${CANONICAL_DOMAIN}/`;

  let html = baseTemplate;

  // Replace title
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

  // Replace meta description
  html = html.replace(
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(description)}" />`
  );

  // Replace canonical
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${canonicalUrl}" />`
  );

  // Replace og:title & og:description
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtml(title)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtml(description)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );

  // Replace twitter:title & twitter:description
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`
  );

  // Inject ItemList JSON-LD
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'FreeTools Hub Complete Tool Suite',
    description: `Comprehensive directory of ${TOOLS_METADATA.length} free privacy-first web utilities and calculators.`,
    numberOfItems: TOOLS_METADATA.length,
    itemListElement: TOOLS_METADATA.map((tool, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: tool.name,
      url: `${CANONICAL_DOMAIN}/tools/${tool.slug}`,
      description: tool.seoDescription,
    })),
  };

  const schemaTag = `\n    <script type="application/ld+json">${JSON.stringify(itemListSchema)}</script>`;
  html = html.replace('</head>', `${schemaTag}\n  </head>`);

  // Build semantic crawlable HTML inside <div id="root">
  const categories = Array.from(new Set(TOOLS_METADATA.map((t) => t.category)));

  const toolsSectionsHtml = categories
    .map((cat) => {
      const catTools = TOOLS_METADATA.filter((t) => t.category === cat);
      const itemsList = catTools
        .map(
          (t) => `
            <li style="margin-bottom: 0.75rem;">
              <a href="/tools/${t.slug}" style="font-weight: 600; color: #1d4ed8; text-decoration: underline;">${escapeHtml(t.name)}</a>
              <p style="margin: 0.25rem 0 0; color: #475569; font-size: 0.95rem;">${escapeHtml(t.seoDescription)}</p>
            </li>`
        )
        .join('');

      return `
        <section style="margin-bottom: 2rem;">
          <h2 style="font-size: 1.4rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">${escapeHtml(cat)}</h2>
          <ul style="list-style: none; padding-left: 0;">
            ${itemsList}
          </ul>
        </section>`;
    })
    .join('');

  const semanticRootContent = `
    <div id="root">
      <header style="padding: 1.5rem 1rem; border-bottom: 1px solid #e2e8f0; background: #ffffff;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <a href="/" style="font-size: 1.25rem; font-weight: 800; color: #1e3a8a; text-decoration: none;">FreeTools Hub</a>
          <nav aria-label="Main Navigation">
            <a href="/tools" style="margin-right: 1.25rem; color: #334155; text-decoration: none; font-weight: 500;">All Tools</a>
            <a href="/about" style="margin-right: 1.25rem; color: #334155; text-decoration: none; font-weight: 500;">About</a>
            <a href="/contact" style="margin-right: 1.25rem; color: #334155; text-decoration: none; font-weight: 500;">Contact</a>
            <a href="/privacy" style="color: #334155; text-decoration: none; font-weight: 500;">Privacy</a>
          </nav>
        </div>
      </header>

      <main style="max-width: 1200px; margin: 0 auto; padding: 2.5rem 1rem;">
        <article>
          <header style="margin-bottom: 2.5rem;">
            <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a; margin-bottom: 1rem; line-height: 1.2;">Free Online Tools, UAE Calculators &amp; AI Prompt Generators</h1>
            <p style="font-size: 1.125rem; color: #475569; max-width: 800px; line-height: 1.6;">
              FreeTools Hub provides ${TOOLS_METADATA.length} professional, privacy-first web utilities designed for PDF document processing, career development, UAE labor law calculations, creative AI prompt architecture, and everyday productivity. All processing occurs 100% inside your browser.
            </p>
          </header>

          ${toolsSectionsHtml}
        </article>
      </main>

      <footer style="background: #0f172a; color: #94a3b8; padding: 3rem 1rem; margin-top: 3rem;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 2rem;">
          <div>
            <p style="color: #ffffff; font-weight: 700; margin-bottom: 0.5rem;">FreeTools Hub (AbbasPro)</p>
            <p style="font-size: 0.875rem;">Smart Tools. Simple Solutions. Always Within Reach.</p>
          </div>
          <nav aria-label="Footer Navigation">
            <a href="/tools" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">All Tools</a>
            <a href="/about" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">About</a>
            <a href="/contact" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">Contact</a>
            <a href="/privacy" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">Privacy</a>
            <a href="/terms" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">Terms</a>
            <a href="/disclaimer" style="color: #cbd5e1; text-decoration: none;">Disclaimer</a>
          </nav>
        </div>
      </footer>
    </div>`;

  html = html.replace(/<div id="root"><\/div>/i, semanticRootContent.trim());
  return html;
}

function generateToolPrerenderedHtml(baseTemplate: string, tool: ToolMetadata): string {
  const canonicalUrl = `${CANONICAL_DOMAIN}/tools/${tool.slug}`;
  let html = baseTemplate;

  // Title
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(tool.seoTitle)}</title>`);

  // Meta description
  html = html.replace(
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(tool.seoDescription)}" />`
  );

  // Canonical
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${canonicalUrl}" />`
  );

  // OpenGraph
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtml(tool.seoTitle)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtml(tool.seoDescription)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );

  // Twitter
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapeHtml(tool.seoTitle)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapeHtml(tool.seoDescription)}" />`
  );

  // Inject WebApplication JSON-LD
  const appSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    alternateName: tool.nameUrdu,
    url: canonicalUrl,
    description: tool.seoDescription,
    applicationCategory: tool.category,
    operatingSystem: 'Any (Web Browser)',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  const schemaTag = `\n    <script type="application/ld+json">${JSON.stringify(appSchema)}</script>`;
  html = html.replace('</head>', `${schemaTag}\n  </head>`);

  // Build related links
  const relatedTools = TOOLS_METADATA.filter((t) => tool.relatedSlugs.includes(t.slug));
  const relatedLinksHtml = relatedTools
    .map(
      (rt) => `
        <li style="margin-bottom: 0.5rem;">
          <a href="/tools/${rt.slug}" style="color: #1d4ed8; text-decoration: underline; font-weight: 600;">${escapeHtml(rt.name)}</a>
          <span style="color: #64748b; font-size: 0.9rem;"> – ${escapeHtml(rt.seoDescription)}</span>
        </li>`
    )
    .join('');

  const instructionsListHtml = tool.instructions
    .map((inst, i) => `<li style="margin-bottom: 0.5rem;"><strong>Step ${i + 1}:</strong> ${escapeHtml(inst)}</li>`)
    .join('');

  const toolContent = `
    <div id="root">
      <header style="padding: 1.25rem 1rem; border-bottom: 1px solid #e2e8f0; background: #ffffff;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <a href="/" style="font-size: 1.25rem; font-weight: 800; color: #1e3a8a; text-decoration: none;">FreeTools Hub</a>
          <nav aria-label="Main Navigation">
            <a href="/tools" style="margin-right: 1.25rem; color: #334155; text-decoration: none; font-weight: 500;">All Tools</a>
            <a href="/about" style="margin-right: 1.25rem; color: #334155; text-decoration: none; font-weight: 500;">About</a>
            <a href="/contact" style="margin-right: 1.25rem; color: #334155; text-decoration: none; font-weight: 500;">Contact</a>
            <a href="/privacy" style="color: #334155; text-decoration: none; font-weight: 500;">Privacy</a>
          </nav>
        </div>
      </header>

      <main style="max-width: 1200px; margin: 0 auto; padding: 2rem 1rem;">
        <nav aria-label="Breadcrumb" style="font-size: 0.875rem; color: #64748b; margin-bottom: 1.5rem;">
          <a href="/" style="color: #1d4ed8; text-decoration: none;">Home</a> &gt;
          <a href="/tools" style="color: #1d4ed8; text-decoration: none;">Tools</a> &gt;
          <span style="color: #0f172a; font-weight: 600;">${escapeHtml(tool.name)}</span>
        </nav>

        <article>
          <header style="margin-bottom: 2rem;">
            <span style="display: inline-block; padding: 0.25rem 0.75rem; background: #dbeafe; color: #1e40af; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.75rem;">
              ${escapeHtml(tool.category)}
            </span>
            <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.75rem; line-height: 1.2;">
              ${escapeHtml(tool.name)}
            </h1>
            <p style="font-size: 1.125rem; color: #475569; max-width: 800px; line-height: 1.6;">
              ${escapeHtml(tool.summary)}
            </p>
          </header>

          <section style="margin-bottom: 2rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.5rem;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem;">How to Use ${escapeHtml(tool.name)}</h2>
            <ol style="padding-left: 1.25rem; color: #334155; line-height: 1.6;">
              ${instructionsListHtml}
            </ol>
          </section>

          <section style="margin-bottom: 2rem;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">Key Capabilities &amp; Architecture</h2>
            <p style="color: #475569; line-height: 1.6;">
              ${escapeHtml(tool.features)} FreeTools Hub guarantees client-side privacy: all inputs, documents, and calculations are computed locally inside your browser session without being uploaded to remote servers.
            </p>
          </section>

          ${
            relatedTools.length > 0
              ? `
          <section style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e2e8f0;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem;">Related Companion Tools</h2>
            <ul style="list-style: none; padding-left: 0;">
              ${relatedLinksHtml}
            </ul>
          </section>`
              : ''
          }
        </article>
      </main>

      <footer style="background: #0f172a; color: #94a3b8; padding: 3rem 1rem; margin-top: 4rem;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 2rem;">
          <div>
            <p style="color: #ffffff; font-weight: 700; margin-bottom: 0.5rem;">FreeTools Hub</p>
            <p style="font-size: 0.875rem;">Client-side privacy guaranteed. No data leaves your browser.</p>
          </div>
          <nav aria-label="Footer Navigation">
            <a href="/" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">Home</a>
            <a href="/tools" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">All Tools</a>
            <a href="/about" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">About</a>
            <a href="/contact" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">Contact</a>
            <a href="/privacy" style="color: #cbd5e1; text-decoration: none;">Privacy</a>
          </nav>
        </div>
      </footer>
    </div>`;

  html = html.replace(/<div id="root"><\/div>/i, toolContent.trim());
  return html;
}

function generateStaticPageHtml(baseTemplate: string, page: typeof STATIC_PAGES[0]): string {
  const canonicalUrl = `${CANONICAL_DOMAIN}/${page.slug}`;
  let html = baseTemplate;

  // Title
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(page.title)}</title>`);

  // Meta description
  html = html.replace(
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(page.description)}" />`
  );

  // Canonical
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${canonicalUrl}" />`
  );

  // OpenGraph
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );

  // Twitter
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`
  );

  const pageContent = `
    <div id="root">
      <header style="padding: 1.25rem 1rem; border-bottom: 1px solid #e2e8f0; background: #ffffff;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <a href="/" style="font-size: 1.25rem; font-weight: 800; color: #1e3a8a; text-decoration: none;">FreeTools Hub</a>
          <nav aria-label="Main Navigation">
            <a href="/tools" style="margin-right: 1.25rem; color: #334155; text-decoration: none; font-weight: 500;">All Tools</a>
            <a href="/about" style="margin-right: 1.25rem; color: #334155; text-decoration: none; font-weight: 500;">About</a>
            <a href="/contact" style="margin-right: 1.25rem; color: #334155; text-decoration: none; font-weight: 500;">Contact</a>
            <a href="/privacy" style="color: #334155; text-decoration: none; font-weight: 500;">Privacy</a>
          </nav>
        </div>
      </header>

      <main style="max-width: 1200px; margin: 0 auto; padding: 2rem 1rem;">
        <nav aria-label="Breadcrumb" style="font-size: 0.875rem; color: #64748b; margin-bottom: 1.5rem;">
          <a href="/" style="color: #1d4ed8; text-decoration: none;">Home</a> &gt;
          <span style="color: #0f172a; font-weight: 600;">${escapeHtml(page.h1)}</span>
        </nav>

        <article>
          <header style="margin-bottom: 2rem;">
            <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.75rem; line-height: 1.2;">
              ${escapeHtml(page.h1)}
            </h1>
            <p style="font-size: 1.125rem; color: #475569; max-width: 800px; line-height: 1.6;">
              ${escapeHtml(page.content)}
            </p>
          </header>

          <section style="margin-top: 2rem;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem;">Browse Popular Free Tools</h2>
            <ul style="list-style: none; padding-left: 0;">
              <li style="margin-bottom: 0.5rem;"><a href="/tools/cv-maker" style="color: #1d4ed8; font-weight: 600;">CV &amp; Resume Maker</a> – ATS-ready professional resume builder</li>
              <li style="margin-bottom: 0.5rem;"><a href="/tools/uae-gratuity-calculator" style="color: #1d4ed8; font-weight: 600;">UAE Gratuity Calculator</a> – End-of-service benefit estimation</li>
              <li style="margin-bottom: 0.5rem;"><a href="/tools/uae-salary-calculator" style="color: #1d4ed8; font-weight: 600;">UAE Salary Calculator</a> – Monthly gross and net salary breakdown</li>
              <li style="margin-bottom: 0.5rem;"><a href="/tools/ai-photo-prompt-generator" style="color: #1d4ed8; font-weight: 600;">AI Photo Prompt Generator</a> – Studio photographic prompts</li>
              <li style="margin-bottom: 0.5rem;"><a href="/tools/seo-page-analyzer" style="color: #1d4ed8; font-weight: 600;">SEO Page Analyzer</a> – Technical on-page SEO audit tool</li>
            </ul>
          </section>
        </article>
      </main>

      <footer style="background: #0f172a; color: #94a3b8; padding: 3rem 1rem; margin-top: 4rem;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 2rem;">
          <div>
            <p style="color: #ffffff; font-weight: 700; margin-bottom: 0.5rem;">FreeTools Hub</p>
            <p style="font-size: 0.875rem;">Fast, private, and always free.</p>
          </div>
          <nav aria-label="Footer Navigation">
            <a href="/" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">Home</a>
            <a href="/tools" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">All Tools</a>
            <a href="/about" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">About</a>
            <a href="/contact" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">Contact</a>
            <a href="/privacy" style="color: #cbd5e1; text-decoration: none;">Privacy</a>
          </nav>
        </div>
      </footer>
    </div>`;

  html = html.replace(/<div id="root"><\/div>/i, pageContent.trim());
  return html;
}

export function prerenderAllPages() {
  const distIndexPath = path.resolve(DIST_DIR, 'index.html');
  if (!fs.existsSync(distIndexPath)) {
    throw new Error('dist/index.html does not exist. Run "vite build" first before prerendering.');
  }

  const baseHtml = fs.readFileSync(distIndexPath, 'utf-8');
  console.log(`[SEO Prerender] Starting static HTML generation using canonical base: ${CANONICAL_DOMAIN}`);

  // 1. Prerender Homepage
  const homepageHtml = generatePrerenderedHomepageHtml(baseHtml);
  fs.writeFileSync(distIndexPath, homepageHtml, 'utf-8');
  console.log('[SEO Prerender] ✓ Prerendered dist/index.html (Homepage)');

  // 2. Prerender All Tool Pages
  for (const tool of TOOLS_METADATA) {
    const toolDir = path.resolve(DIST_DIR, 'tools', tool.slug);
    fs.mkdirSync(toolDir, { recursive: true });
    const toolHtml = generateToolPrerenderedHtml(baseHtml, tool);
    fs.writeFileSync(path.resolve(toolDir, 'index.html'), toolHtml, 'utf-8');
    console.log(`[SEO Prerender] ✓ Prerendered dist/tools/${tool.slug}/index.html`);
  }

  // 3. Prerender Static Pages
  for (const page of STATIC_PAGES) {
    const pageDir = path.resolve(DIST_DIR, page.slug);
    fs.mkdirSync(pageDir, { recursive: true });
    const pageHtml = generateStaticPageHtml(baseHtml, page);
    fs.writeFileSync(path.resolve(pageDir, 'index.html'), pageHtml, 'utf-8');
    console.log(`[SEO Prerender] ✓ Prerendered dist/${page.slug}/index.html`);
  }

  console.log(`[SEO Prerender] Successfully generated ${1 + TOOLS_METADATA.length + STATIC_PAGES.length} static prerendered HTML entrypoints.`);
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('prerenderSeo.ts')) {
  prerenderAllPages();
}
