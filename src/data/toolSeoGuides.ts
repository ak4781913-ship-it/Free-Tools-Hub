/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ToolSeoGuide {
  whatItDoes: string;
  whoCanUseIt: string;
  howToUse: string[];
  requiredInputs: string;
  expectedResults: string;
  limitationsAndAssumptions: string;
}

export const TOOL_SEO_GUIDES: Record<string, ToolSeoGuide> = {
  'resume-builder': {
    whatItDoes:
      'Builds structured, Applicant Tracking System (ATS)-readable CVs and resumes directly in your browser with live A4 preview, four layout templates, customizable typography, local auto-save, JSON backup/import, and downloadable PDF output.',
    whoCanUseIt:
      'Job seekers, graduates, career changers, UAE and international professionals, freelancers, and recruiters preparing clean, standardized CVs.',
    howToUse: [
      'Enter your full name, target job title, contact details, and professional summary under Personal Information.',
      'Add chronological work experience, education history, skills, languages, certifications, or projects, and toggle visibility for optional sections.',
      'Choose one of the four templates (Modern, Classic, Minimal, or Executive) and adjust font style or accent color while reviewing the live A4 preview.',
      'Click Download PDF to generate a selectable ATS Vector PDF (or Visual Canvas Snapshot), or export a JSON backup file to continue editing later.',
    ],
    requiredInputs:
      'Full Name is required before exporting or printing. Email address (when provided) must follow a valid email format. Work experience, education, skills, languages, certifications, and project entries are customizable.',
    expectedResults:
      'A formatted A4 PDF resume with selectable text for ATS parsing, a printable document layout, and an optional portable JSON data file.',
    limitationsAndAssumptions:
      'All resume data is stored locally in your browser localStorage and is cleared if browser site data is wiped unless backed up via Export JSON. Vector PDF export uses standard Latin/ASCII-compatible PDF fonts; for RTL scripts or custom glyphs, use Visual Canvas Snapshot or browser Print-to-PDF.',
  },
  'uae-gratuity': {
    whatItDoes:
      'Estimates end-of-service gratuity (EOSB) in UAE Dirhams (AED) for private-sector employees based on UAE Federal Decree-Law No. 33 of 2021, with optional comparison against historical Federal Law No. 8 of 1980 rules.',
    whoCanUseIt:
      'UAE private-sector employees, HR administrators, payroll planners, and professionals reviewing end-of-service settlement estimates.',
    howToUse: [
      'Select your employment start date and last working day (end date).',
      'Enter your contractual monthly Basic Salary in AED (excluding housing, transport, and other allowances).',
      'Choose your employment sector, contract type, separation reason, and enter any unpaid leave days to deduct from qualifying service.',
      'Review the real-time AED breakdown, compare scenarios, and copy or download the summary as PDF or CSV.',
    ],
    requiredInputs:
      'Employment start date, employment end date (after start date), and positive monthly Basic Salary in AED. Unpaid leave days, sector, separation reason, and law regime are configurable.',
    expectedResults:
      'Exact calendar tenure, net qualifying working days, daily basic wage (Basic × 12 ÷ 365), Tier 1 (21 days/year for first 5 years) and Tier 2 (30 days/year beyond 5 years) amounts, statutory cap check, and downloadable PDF/CSV statements.',
    limitationsAndAssumptions:
      'Informational estimate only — not legal or payroll advice. Assumes at least 1 continuous year (365 net working days) for eligibility, calculates daily wage strictly on contractual Basic Salary, and applies a 24-month basic salary cap check. DIFC (DEWS workplace savings), ADGM, domestic workers, UAE nationals enrolled in GPSSA pensions, and Article 44 disciplinary cases follow separate rules; verify final settlement with HR or MOHRE.',
  },
  'uae-salary-calculator': {
    whatItDoes:
      'Calculates monthly and annual gross-to-net compensation in UAE Dirhams (AED), breaking down basic pay, housing, transport, other allowances, unpaid leave deductions, contractual deductions, and optional UAE national pension contributions.',
    whoCanUseIt:
      'Employees evaluating UAE job offers, expatriates comparing basic-to-allowance ratios, Emirati nationals estimating 5% employee pension deductions, and HR teams.',
    howToUse: [
      'Enter your monthly Basic Salary along with Housing, Transport, and Other monthly allowances in AED.',
      'Optionally enter fixed monthly deductions, unpaid leave days in the current month, and weekly contractual working hours.',
      'Toggle the optional UAE National GPSSA 5% pension estimate if applicable to your employment status.',
      'Inspect monthly/annual net take-home pay, basic share percentage, daily/hourly rates, and copy or export the CSV table.',
    ],
    requiredInputs:
      'Non-negative numeric AED values for Basic Salary and allowances, weekly working hours (1–84), and unpaid leave days (0–30).',
    expectedResults:
      'Gross monthly and annual package, itemized deductions, estimated net monthly and annual take-home pay in AED, 30-day gross daily rate, 365-day statutory basic daily wage, and CSV/printable reports.',
    limitationsAndAssumptions:
      'Informational planning estimate assuming 0% UAE personal income tax on employment wages. Actual net payroll may vary based on company-specific attendance rules, loan/advance recoveries, free-zone regulations, or updated GPSSA/Nafis contribution ceilings.',
  },
  'gemini-photo-prompt': {
    whatItDoes:
      'Constructs detailed, structured natural-language image prompts combining subject descriptions, photographic styles, lighting setups, lens focal lengths, color grading, aspect ratios, identity-preservation notes, and negative constraints.',
    whoCanUseIt:
      'Digital artists, photographers, marketing designers, content creators, and prompt engineers working with text-to-image models.',
    howToUse: [
      'Select a quick studio preset or choose a subject category and write a clear subject description.',
      'Specify visual style, environment/setting, wardrobe, lighting direction, camera lens/angle, mood, and aspect ratio.',
      'Optionally enable Face/Identity Preservation or Photo Enhancement phrasing and list negative constraints to avoid.',
      'Click Generate Prompt, fine-tune the editable text box if needed, and copy or download the prompt as TXT or PDF.',
    ],
    requiredInputs:
      'A Subject Description (unless Enhancement-Only mode is active), plus optional style, camera, lighting, aspect ratio, and negative prompt parameters.',
    expectedResults:
      'A cohesive, copy-ready photographic prompt specification formatted for AI image generators, plus downloadable TXT and Creative Brief PDF files.',
    limitationsAndAssumptions:
      'This tool generates structured text prompts locally in your browser; it does not render or host AI images directly. Final visual quality, aspect ratio adherence, and identity preservation depend entirely on the external AI model you paste the prompt into (such as Gemini, Imagen, Midjourney, or Flux).',
  },
  'ai-video-prompt': {
    whatItDoes:
      'Generates multi-scene AI video production scripts with global visual consistency rules, scene-by-scene timing, camera movement directions, character action cues, spoken dialogue, and audio/SFX notes.',
    whoCanUseIt:
      'Video creators, storyboard artists, ad producers, social media editors, and filmmakers prompting AI video generation platforms.',
    howToUse: [
      'Define the video purpose, main subject/concept, total target duration, aspect ratio, visual aesthetic, and lighting environment.',
      'Enable Character Consistency if a recurring protagonist appears across multiple cuts and describe their key visual traits.',
      'Add or edit individual scenes with duration, visual action, camera movement, dialogue, and sound effects, using Auto-Balance if needed.',
      'Click Generate Complete Video Script to compile the master prompt, then copy individual scenes or export as TXT/PDF.',
    ],
    requiredInputs:
      'A Main Subject/Concept and at least one scene containing a non-empty visual description, along with scene durations and aspect ratio.',
    expectedResults:
      'A structured master production prompt and per-scene copyable prompt blocks, plus downloadable TXT and PDF storyboard scripts.',
    limitationsAndAssumptions:
      'This utility formats text-based directorial prompts locally and does not render video files. Clip duration limits, lip-sync support, audio generation, and camera motion fidelity vary across external AI video engines (such as Veo/Flow, Sora, Runway, Kling, or Luma).',
  },
  'markdown-editor': {
    whatItDoes:
      'Provides a split-screen Markdown workspace with formatting toolbar shortcuts, live sanitized HTML preview, document word/reading statistics, and export to Markdown (.md) or standalone HTML.',
    whoCanUseIt:
      'Technical writers, software developers documenting READMEs, bloggers, students, and editors drafting structured articles.',
    howToUse: [
      'Write or paste Markdown syntax in the left editor pane or use toolbar buttons for headings, bold, lists, code blocks, tables, and links.',
      'Switch between split view, editor-only, or live preview tabs on smaller screens to inspect rendered typography.',
      'Copy raw Markdown or rendered HTML to your clipboard, or download the document as a .md or .html file.',
    ],
    requiredInputs:
      'Plain text or CommonMark/GitHub-Flavored Markdown content entered into the editor.',
    expectedResults:
      'Real-time rendered preview, character and word counts, copyable HTML markup, and downloadable .md/.html files.',
    limitationsAndAssumptions:
      'Preview HTML is strictly sanitized client-side via DOMParser to strip executable scripts, iframes, and unsafe inline event handlers. Drafts are saved locally in your browser.',
  },
  'seo-page-analyzer': {
    whatItDoes:
      'Audits any public webpage URL or pasted raw HTML source for technical SEO fundamentals, evaluating title tags, meta descriptions, canonical links, robots directives, OpenGraph/Twitter cards, H1–H6 hierarchy, image alt attributes, keyword density, and internal links.',
    whoCanUseIt:
      'SEO specialists, web developers, content marketers, and site owners diagnosing on-page search visibility issues before publishing.',
    howToUse: [
      'Enter a public HTTPS/HTTP webpage URL and click Analyze URL, or switch to the Raw HTML tab and paste page source code directly.',
      'Review the overall SEO health score and inspect categorized tabs: Checklist, Issues, Meta, Social Preview, Headings, Keyword Density, and Internal Links.',
      'Optionally run the Internal Link status check, copy generated HTML fix snippets, or download a multi-page PDF audit report.',
    ],
    requiredInputs:
      'Either a publicly reachable webpage URL or at least 30 characters of raw HTML markup.',
    expectedResults:
      'Weighted SEO health scores, prioritized critical/warning/passed findings, SERP & social card previews, copy-ready meta tag fixes, CSV link reports, and a PDF audit summary.',
    limitationsAndAssumptions:
      'URL fetching inspects the initial server-returned HTML response (up to 2 MB) through a security-hardened proxy that blocks private/internal IPs. Websites protected by bot firewalls (Cloudflare/WAF) or purely client-rendered SPAs may require copying rendered DOM HTML into the Raw HTML tab.',
  },
  'seo-meta-generator': {
    whatItDoes:
      'Generates standards-compliant HTML `<head>` metadata, OpenGraph tags, Twitter/X card markup, and Next.js Metadata API code with live Google SERP and social card previews.',
    whoCanUseIt:
      'Frontend engineers, bloggers, e-commerce managers, and digital marketers configuring page titles, descriptions, and social share cards.',
    howToUse: [
      'Enter your page title, meta description, canonical page URL, social preview image URL, and robots indexing preferences.',
      'Monitor real-time character counters and pixel/truncation warnings in the Desktop/Mobile Google SERP and Social Card previews.',
      'Select HTML Meta Tags or Next.js App Router format and copy or download the generated code snippet.',
    ],
    requiredInputs:
      'Page title and meta description, plus optional canonical URL, site name, author, OpenGraph image URL, and robots directives.',
    expectedResults:
      'Clean, properly escaped HTML `<meta>` tags or TypeScript Next.js `Metadata` export code ready to paste into your project.',
    limitationsAndAssumptions:
      'Search engines dynamically rewrite titles and snippets in search results depending on user queries and device width; character thresholds (50–60 chars for title, 120–160 chars for description) represent industry best-practice guidelines.',
  },
  'word-counter': {
    whatItDoes:
      'Counts words, characters (with and without spaces), sentences, paragraphs, estimated reading time, speaking time, and top keyword frequency in real time as you type.',
    whoCanUseIt:
      'Copywriters, students, journalists, academic researchers, translators, and social media managers working within strict length limits.',
    howToUse: [
      'Type or paste your text directly into the main editor area.',
      'View instant word, character, sentence, paragraph, and reading/speaking time metrics above the editor.',
      'Check top recurring words or use quick actions to copy text, clear the editor, or export statistics.',
    ],
    requiredInputs:
      'Any plain text passage in English, Urdu, or other Unicode scripts.',
    expectedResults:
      'Live numeric totals for words, characters, non-space characters, sentences, paragraphs, and estimated reading/speaking durations.',
    limitationsAndAssumptions:
      'Reading time assumes an average silent reading speed of ~200 words per minute, and speaking time assumes ~130 words per minute. Sentence boundaries are detected heuristically using standard punctuation.',
  },
  'text-case-converter': {
    whatItDoes:
      'Transforms text instantaneously between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, kebab-case, and cleaned whitespace.',
    whoCanUseIt:
      'Writers fixing accidental Caps Lock text, editors standardizing headlines, and programmers converting variable or slug naming conventions.',
    howToUse: [
      'Paste or type the text you want to convert into the input box.',
      'Click the target case button (such as Title Case, Sentence case, camelCase, snake_case, or kebab-case).',
      'Copy the converted output to your clipboard with one click or clear the field to start over.',
    ],
    requiredInputs:
      'Any text string, headline, list of identifiers, or paragraph.',
    expectedResults:
      'Immediately reformatted text preserving your underlying words while applying the selected capitalization or delimiter convention, along with live character/word counts.',
    limitationsAndAssumptions:
      'Title Case and Sentence case follow general English capitalization rules and may not automatically preserve brand-specific acronyms (such as "iOS" or "SaaS") without manual review.',
  },
  'image-compressor': {
    whatItDoes:
      'Compresses, resizes, crops, strips EXIF metadata from, and converts JPEG, PNG, and WebP images locally in your browser using the HTML5 Canvas API, supporting single or batch ZIP downloads.',
    whoCanUseIt:
      'Web developers optimizing Core Web Vitals, bloggers reducing upload sizes, applicants shrinking ID/CV photos, and privacy-conscious users removing GPS EXIF tags.',
    howToUse: [
      'Drag and drop one or more JPEG, PNG, or WebP images into the upload zone or click to browse files from your device.',
      'Adjust the target quality slider, output format (JPEG, WebP, PNG), optional maximum width/height dimensions, and EXIF stripping setting.',
      'Compare original vs. compressed quality side by side and download compressed files individually or as a batch ZIP archive.',
    ],
    requiredInputs:
      'One or more raster image files (JPEG, PNG, WebP, BMP) from your local device, plus quality and dimension preferences.',
    expectedResults:
      'Optimized image files with exact before/after byte size savings percentages, optional stripped GPS/camera EXIF metadata, and single or ZIP downloads.',
    limitationsAndAssumptions:
      'All compression runs in browser memory without server uploads. Very high-resolution images or large batches depend on available device RAM, and WebP encoding support depends on the host browser Canvas implementation.',
  },
  'qr-generator': {
    whatItDoes:
      'Generates customizable, scannable 2D QR codes for URLs, plain text, Wi-Fi network credentials, vCard contact cards, email drafts, and phone/SMS links with adjustable colors, error correction, and PNG/SVG downloads.',
    whoCanUseIt:
      'Small business owners, event organizers, restaurants, marketers, educators, and professionals sharing links or Wi-Fi access.',
    howToUse: [
      'Choose the QR content type (URL, Text, Wi-Fi, Email, Phone, or Contact) and enter the required destination details.',
      'Customize foreground and background colors, quiet-zone margin, pixel resolution, and Reed-Solomon error correction level (L, M, Q, H).',
      'Verify contrast warnings and download the generated QR code as a crisp PNG image or scalable SVG vector.',
    ],
    requiredInputs:
      'Non-empty target data (such as a valid URL, text string, or Wi-Fi SSID) and foreground/background hex colors.',
    expectedResults:
      'A live scannable QR code preview with instant PNG raster download, SVG vector export, or clipboard copy.',
    limitationsAndAssumptions:
      'Reliable camera scanning requires high contrast (dark foreground on a light background) and sufficient quiet-zone margin. Static QR codes encode data directly into the graphic and cannot be redirected after printing unless pointed to a URL you control.',
  },
  'color-picker': {
    whatItDoes:
      'Converts colors accurately across HEX, RGB, HSL, HSV, and CMYK spaces while generating tints/shades, color harmonies, CSS variables, and WCAG 2.1 AA/AAA text contrast ratios.',
    whoCanUseIt:
      'UI/UX designers, frontend developers, brand stylists, and accessibility auditors verifying readable color combinations.',
    howToUse: [
      'Pick a color visually on the canvas/eyedropper or enter a valid HEX, RGB, or HSL value.',
      'Explore generated tint/shade scales and complementary, analogous, triadic, or split-complementary harmony palettes.',
      'Check WCAG foreground/background contrast ratios for normal and large text, and copy CSS/Tailwind color codes.',
    ],
    requiredInputs:
      'Any color selected via picker or entered in HEX (`#RRGGBB`), RGB, or HSL notation.',
    expectedResults:
      'Synchronized color values in HEX/RGB/HSL/CMYK, 10-step tint and shade swatches, harmony palettes, WCAG contrast pass/fail badges, and copyable CSS snippets.',
    limitationsAndAssumptions:
      'CMYK percentages use a device-independent mathematical conversion from sRGB for design reference rather than ICC print press color profiles. Native browser Eyedropper API availability requires Chromium-based desktop browsers.',
  },
  'loan-calculator': {
    whatItDoes:
      'Computes fixed-rate monthly loan installments (EMI), total interest payable, total repayment cost, and a complete month-by-month or yearly principal-vs-interest amortization schedule.',
    whoCanUseIt:
      'Homebuyers comparing mortgages, auto loan shoppers, personal loan borrowers, and students modeling repayment timelines.',
    howToUse: [
      'Enter the principal loan amount, annual nominal interest rate (%), and loan term in years or months.',
      'Inspect the calculated monthly EMI payment, total interest cost, and principal-to-interest breakdown.',
      'Review or export the amortization table showing each period’s interest portion, principal reduction, and remaining balance.',
    ],
    requiredInputs:
      'Positive Loan Principal amount, Annual Interest Rate (0% or positive), and Loan Tenure (months/years).',
    expectedResults:
      'Exact monthly EMI figure, total interest payable, total principal + interest sum, visual breakdown, and a printable/exportable amortization schedule.',
    limitationsAndAssumptions:
      'Uses the standard fixed-rate reducing-balance compounding monthly formula (`EMI = P × r × (1+r)^n / ((1+r)^n - 1)`). Excludes lender processing fees, insurance premiums, escrow taxes, early-settlement penalties, and variable/floating rate resets.',
  },
  'currency-converter': {
    whatItDoes:
      'Converts amounts across major international fiat currencies (including USD, AED, EUR, GBP, PKR, INR, SAR, CAD, AUD, JPY, and more) with instant bidirectional swapping and cross-rate tables.',
    whoCanUseIt:
      'Travelers, remote workers, e-commerce shoppers, expatriates sending remittances, and finance teams estimating foreign currency equivalents.',
    howToUse: [
      'Enter the numeric amount you want to convert.',
      'Select the source currency (From) and target currency (To), or click the Swap button to reverse the pair.',
      'View the converted total, unit exchange rate, inverse rate, and copy the formatted conversion result.',
    ],
    requiredInputs:
      'A non-negative numeric amount plus selected source and target ISO currency codes.',
    expectedResults:
      'Converted currency value, 1-unit forward and inverse exchange rates, and timestamp/source indicator.',
    limitationsAndAssumptions:
      'Exchange rates are mid-market informational reference rates (fetched from public rate feeds with offline fallback reference rates when offline). Retail banks, credit cards, and money exchange houses apply additional buy/sell spreads and transfer fees.',
  },
  'crypto-converter': {
    whatItDoes:
      'Calculates real-time conversions between major cryptocurrencies (such as BTC, ETH, SOL, BNB, XRP, USDT, USDC) and global fiat currencies (USD, AED, EUR, GBP, PKR, INR).',
    whoCanUseIt:
      'Crypto holders, Web3 developers, analysts, and everyday users checking digital asset values in local fiat currency.',
    howToUse: [
      'Enter the quantity of cryptocurrency or fiat currency to convert.',
      'Select your source asset and target asset, using the Swap button to flip direction instantly.',
      'Check the converted market estimate and unit price, or refresh rates when online.',
    ],
    requiredInputs:
      'A non-negative numeric quantity and selected source/target crypto or fiat symbols.',
    expectedResults:
      'Estimated converted value with high-precision decimal formatting for fractional token units and unit conversion rate.',
    limitationsAndAssumptions:
      'Cryptocurrency prices are highly volatile and vary across exchanges. Displayed values are informational reference estimates (with cached/offline fallback when network APIs are unreachable) and exclude blockchain gas fees, exchange trading fees, and slippage; not financial or investment advice.',
  },
  'percentage-calculator': {
    whatItDoes:
      'Solves three everyday percentage problems in one view: finding X% of Y, determining what percentage X is of Y, and calculating percentage increase or decrease from X to Y.',
    whoCanUseIt:
      'Students, shoppers, business analysts, accountants, freelancers calculating tax/commission, and everyday users.',
    howToUse: [
      'Choose or fill in the relevant calculation card: What is X% of Y, X is what % of Y, or Percentage Change from X to Y.',
      'Enter any positive, negative, or decimal numbers into the two input fields.',
      'Read the instant calculated answer with formula explanation and copy the result if needed.',
    ],
    requiredInputs:
      'Two numeric values corresponding to the percentage problem being solved (denominator cannot be zero when dividing).',
    expectedResults:
      'Exact decimal/percentage results with clear mathematical step-by-step confirmation and zero division-by-zero crashes.',
    limitationsAndAssumptions:
      'Percentage change `(New - Old) / |Old| × 100` requires a non-zero starting baseline value; values are rounded cleanly for display while preserving floating-point accuracy.',
  },
  'discount-calculator': {
    whatItDoes:
      'Calculates final sale price, total money saved, stacked secondary discounts, and optional sales tax/VAT additions on discounted merchandise.',
    whoCanUseIt:
      'Online and retail shoppers, store owners planning promotional markdowns, and procurement teams checking net invoice totals.',
    howToUse: [
      'Enter the original item price and primary discount percentage (0–100%).',
      'Optionally add an extra stacked coupon percentage or sales tax / VAT rate (such as 5% UAE VAT).',
      'Review the final payable price, total savings amount, and effective combined discount rate.',
    ],
    requiredInputs:
      'Non-negative Original Price, Discount Percentage (0–100%), and optional Tax/VAT percentage.',
    expectedResults:
      'Net price after discount, exact currency savings, tax amount (if entered), and final out-of-pocket total.',
    limitationsAndAssumptions:
      'Stacked discounts are applied sequentially to the remaining subtotal (e.g., 20% off followed by an extra 10% off equals 28% total off, not 30%), matching standard retail checkout logic.',
  },
  'unit-converter': {
    whatItDoes:
      'Converts measurements across Length, Weight/Mass, Temperature, Area, Volume, Speed, Digital Storage, and Time units with instant bidirectional swapping.',
    whoCanUseIt:
      'Engineers, students, home cooks, travelers, logistics planners, and construction professionals converting metric and imperial units.',
    howToUse: [
      'Select the measurement category (such as Length, Weight, Temperature, Area, or Volume).',
      'Enter a numeric value and choose both the From unit and To unit, or click Swap to invert.',
      'Copy the converted measurement directly to your clipboard.',
    ],
    requiredInputs:
      'A numeric measurement value and two units within the same physical measurement category.',
    expectedResults:
      'Instantaneous, high-precision unit conversion formatted cleanly for very large or very small magnitudes.',
    limitationsAndAssumptions:
      'Uses standard international SI and NIST conversion factors (e.g., 1 inch = 2.54 cm exact; exact offset formulas for Celsius, Fahrenheit, and Kelvin).',
  },
  'password-generator': {
    whatItDoes:
      'Generates high-entropy random passwords and passphrases locally in your browser using the Web Crypto API (`crypto.getRandomValues`) with configurable length and character sets.',
    whoCanUseIt:
      'Individuals, IT administrators, developers, and security-conscious teams creating unique credentials for online accounts.',
    howToUse: [
      'Choose your desired password length (e.g., 16–64 characters) using the slider.',
      'Select which character classes to include: uppercase letters, lowercase letters, numbers, and symbols, plus optional ambiguous-character exclusion.',
      'Click Generate to create a fresh cryptographic password and Copy to place it on your clipboard.',
    ],
    requiredInputs:
      'Password length and at least one enabled character set (uppercase, lowercase, digits, or symbols).',
    expectedResults:
      'A cryptographically random password string with live entropy/strength indicator and one-click clipboard copy.',
    limitationsAndAssumptions:
      'Generated passwords exist solely in local browser memory and are never transmitted or logged anywhere. Store important passwords in a dedicated encrypted password manager immediately after copying.',
  },
  'password-strength': {
    whatItDoes:
      'Evaluates password security completely offline in your browser by measuring character-pool entropy (in bits), estimated offline brute-force crack times, pattern weaknesses, and actionable hardening tips.',
    whoCanUseIt:
      'End users auditing credential hygiene, developers testing password policies, and security educators.',
    howToUse: [
      'Type or paste a test password into the masked/unmasked input field.',
      'Inspect the strength rating (Weak to Very Strong), bit entropy score, character diversity checks, and estimated crack-time scenarios.',
      'Follow the suggested improvements or clear the input when finished.',
    ],
    requiredInputs:
      'Any candidate password or passphrase string entered for local inspection.',
    expectedResults:
      'Bit-entropy calculation, strength grade, crack-time estimates across online/offline attack speeds, detected pattern warnings (repeats, sequences, common words), and remediation advice.',
    limitationsAndAssumptions:
      '100% client-side evaluation — your input never leaves your device. Crack-time figures are mathematical estimates based on character-space and common pattern heuristics; they do not check external credential-breach databases.',
  },
  'age-calculator': {
    whatItDoes:
      'Calculates exact chronological age in completed years, months, and days between a birth date and any target reference date, alongside total weeks, days, hours, and countdown to the next birthday.',
    whoCanUseIt:
      'Applicants filling official visa/government forms, parents, HR teams verifying age eligibility, and general users.',
    howToUse: [
      'Select your Date of Birth using the calendar picker.',
      'Keep the "Age at the Date of" field set to today or choose any past/future target date.',
      'View your exact age in years, months, and days, total elapsed days/hours, and days remaining until your next birthday.',
    ],
    requiredInputs:
      'A valid Date of Birth and a Reference Date that is on or after the birth date.',
    expectedResults:
      'Calendar-accurate breakdown of years, months, and days, cumulative weeks/days/hours/minutes, and next-birthday weekday countdown.',
    limitationsAndAssumptions:
      'Follows standard Gregorian calendar month lengths and leap-year rules (29 days in February during leap years).',
  },
  'date-difference': {
    whatItDoes:
      'Computes the exact duration between any two calendar dates in years, months, weeks, total calendar days, and estimated Monday–Friday business days.',
    whoCanUseIt:
      'Project managers scheduling milestones, HR teams calculating employment tenure or notice periods, travelers counting visa days, and legal/finance staff.',
    howToUse: [
      'Pick a Start Date and an End Date.',
      'Optionally toggle whether to include the end date (+1 day inclusive counting) for contract or leave calculations.',
      'Read the calendar breakdown, total days, weeks, and weekday vs. weekend counts.',
    ],
    requiredInputs:
      'Two valid Gregorian calendar dates (Start Date and End Date).',
    expectedResults:
      'Exact years/months/days span, total calendar days, business weekdays vs. weekend days, and copyable summary.',
    limitationsAndAssumptions:
      'Weekday calculations treat Saturday and Sunday as weekend days (standard international week; note UAE private sector transitioned to a Saturday–Sunday weekend in 2022) and do not automatically subtract country-specific public holidays.',
  },
  'bmi-calculator': {
    whatItDoes:
      'Calculates adult Body Mass Index (BMI) using either Metric (kg / cm) or Imperial (lbs / ft + in) measurements and displays standard WHO weight-status categories and healthy weight range estimates.',
    whoCanUseIt:
      'Adults tracking general fitness baselines, wellness coaches, and users comparing metric and imperial body mass ratios.',
    howToUse: [
      'Switch between Metric (centimeters & kilograms) and Imperial (feet/inches & pounds) units.',
      'Enter your height and body weight as positive numeric values.',
      'Review your calculated BMI score, WHO category indicator, and estimated normal-BMI weight range for your height.',
    ],
    requiredInputs:
      'Positive numeric Height (cm or ft/in) and Weight (kg or lbs).',
    expectedResults:
      'BMI value (`kg / m²`), WHO adult classification (Underweight, Normal weight, Overweight, Obesity), and corresponding healthy weight range.',
    limitationsAndAssumptions:
      'Educational screening metric only — NOT medical diagnosis or clinical advice. Standard BMI (`weight ÷ height²`) does not distinguish muscle mass from body fat and may not accurately reflect athletes, pregnant individuals, older adults, or children/adolescents; consult a qualified healthcare professional.',
  },
  'timezone-converter': {
    whatItDoes:
      'Converts specific dates and meeting times accurately across global IANA time zones (such as Dubai GST, London, New York, Karachi, Mumbai, Singapore, Sydney, and UTC) with automatic Daylight Saving Time (DST) handling.',
    whoCanUseIt:
      'Remote teams scheduling cross-border calls, webinar hosts, travelers, aviation/logistics coordinators, and international freelancers.',
    howToUse: [
      'Select a date and time (or click Now to load the current moment).',
      'Choose the Source Time Zone (From) and Target Time Zone (To), using Swap to reverse them at any time.',
      'Inspect the converted local date, 12/24-hour time, UTC offset difference, and copyable meeting invite summary.',
    ],
    requiredInputs:
      'A valid calendar date, time (`HH:MM`), and selected source and destination IANA time zones.',
    expectedResults:
      'Exact converted local time and date (including next/previous day rollover alerts) and exact hour/minute offset difference.',
    limitationsAndAssumptions:
      'Relies on your browser’s built-in `Intl.DateTimeFormat` IANA time zone database so historical and upcoming Daylight Saving Time transitions are applied automatically.',
  },
  'json-formatter': {
    whatItDoes:
      'Validates, pretty-prints, minifies, sorts keys, and inspects JSON payloads locally in your browser with line/column syntax error diagnostics and downloadable `.json` output.',
    whoCanUseIt:
      'Backend and frontend developers, QA engineers, API integrators, and data analysts inspecting webhook or REST responses.',
    howToUse: [
      'Paste raw or minified JSON into the input editor or upload a `.json` file.',
      'Choose 2-space indent, 4-space indent, Tab indent, or Minify, and optionally sort object keys alphabetically.',
      'If invalid syntax is detected, check the highlighted error message; otherwise copy or download the formatted JSON.',
    ],
    requiredInputs:
      'Any text string intended to be parsed according to strict RFC 8259 JSON syntax.',
    expectedResults:
      'Validated, cleanly indented or minified JSON output, payload byte size metrics, and exact parser error feedback on malformed input.',
    limitationsAndAssumptions:
      'Strict RFC 8259 JSON requires double-quoted keys/strings and disallows trailing commas, comments, `undefined`, or single-quoted strings. All parsing executes locally in your browser without sending payloads to any server.',
  },
  'base64-converter': {
    whatItDoes:
      'Encodes UTF-8 text or binary files into Base64 (standard or URL-safe) and decodes Base64 strings or Data URIs back into readable UTF-8 text or downloadable files.',
    whoCanUseIt:
      'Software engineers debugging JWT/API payloads, frontend developers generating inline `data:` URIs, and system administrators.',
    howToUse: [
      'Choose Text Mode or File Mode, and select Encode (to Base64) or Decode (from Base64).',
      'Enter UTF-8 text (including emojis, Arabic, or Urdu) or drop a local file, and toggle URL-Safe (`-` and `_`) encoding if needed.',
      'Copy the encoded Base64 string / CSS/HTML Data URI snippet, or download the decoded output file.',
    ],
    requiredInputs:
      'Plain UTF-8 text or a local file when encoding; a valid Base64 or `data:...;base64,...` string when decoding.',
    expectedResults:
      'UTF-8-safe Base64 output (via `TextEncoder`/`TextDecoder`), byte size comparison (~33% Base64 overhead), Data URI snippets, or decoded file download.',
    limitationsAndAssumptions:
      'Base64 is a binary-to-text encoding scheme, NOT encryption — anyone can decode a Base64 string, so never use it alone to protect secrets. Large binary files are processed in local browser memory.',
  },
  'pdf-tools-suite': {
    whatItDoes:
      'Provides 43 privacy-first, client-side PDF tools across 7 categories directly in your browser: PDF conversions (Word .docx, Excel .xlsx, JPG, PNG, TXT), document-to-PDF creation (JPG, PNG, WebP, .docx, .xlsx/.csv, .pptx, TXT), page organization (merge, split, extract, delete, rotate, reorder, duplicate, separate packets), lossless and quality-tuned compression, interactive canvas editing (text, images, page numbers, watermarks, headers/footers), real 256-bit AES password protection & authorized decryption, and advanced utilities (OCR for scanned PDFs, full-text search, viewer, metadata editor, batch page counter, print, and repair).',
    whoCanUseIt:
      'Office professionals, students, HR & finance teams, UAE residents preparing official documents, developers, and anyone handling sensitive PDFs who requires strict zero-upload browser privacy.',
    howToUse: [
      'Choose any of the 43 PDF tools from the category grid or use the quick search bar inside the suite.',
      'Drop or select your PDF, image, Word, Excel, PowerPoint, or text file(s) — files are validated locally via extension and header signatures.',
      'Configure tool options such as page ranges, compression quality, interactive canvas overlays, OCR language, or authorized passwords.',
      'Run the tool locally and preview the result inline or download single files or a combined ZIP archive.',
    ],
    requiredInputs:
      'Valid PDF documents (%PDF- signature), raster images (JPG, PNG, WebP), OpenXML documents (.docx, .xlsx, .pptx), CSV, or UTF-8 text files up to 100 MB per file (250 MB batch limit).',
    expectedResults:
      'Authentic downloadable .pdf, .docx, .xlsx, .png, .jpg, .txt, .csv, or .zip files, plus live compression size savings, OCR confidence metrics, and encryption verification.',
    limitationsAndAssumptions:
      'All processing runs locally inside browser WebAssembly and Canvas without server uploads. Scanned image-only PDFs require OCR before exporting editable text. Authorized PDF decryption strictly requires the valid password and never cracks unknown passwords. Complex PowerPoint SmartArt, Excel VBA macros, or legacy binary .doc/.ppt formats are simplified or excluded.',
  },
};
