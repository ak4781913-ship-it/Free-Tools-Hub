/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolFaqItem } from './keywordStrategy';

export interface GuideSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  callout?: {
    title: string;
    body: string;
    tone?: 'info' | 'warning';
  };
}

export interface EditorialGuide {
  slug: string;
  path: string;
  category: 'UAE Payroll & Compliance' | 'Career & Resumes' | 'PDF Workflows & Privacy' | 'SEO & Security';
  title: string;
  seoTitle: string;
  seoDescription: string;
  readTimeMinutes: number;
  publishedDate: string;
  updatedDate: string;
  summary: string;
  sections: GuideSection[];
  faqs: ToolFaqItem[];
  relatedToolPaths: { path: string; label: string; desc: string }[];
  relatedCategoryPaths: { path: string; label: string }[];
}

export const EDITORIAL_GUIDES: EditorialGuide[] = [
  {
    slug: 'uae-gratuity-calculation-guide-2026',
    path: '/guides/uae-gratuity-calculation-guide-2026',
    category: 'UAE Payroll & Compliance',
    title: 'UAE End-of-Service Gratuity Calculation Guide (Decree-Law No. 33 of 2021)',
    seoTitle: 'UAE Gratuity Calculation Guide 2026 – Law 33/2021 | MAWA',
    seoDescription:
      'Step-by-step guide to calculating UAE end-of-service gratuity under Federal Decree-Law No. 33 of 2021, 21/30-day tiers, unpaid leave, and the 2-year cap.',
    readTimeMinutes: 6,
    publishedDate: '2026-04-01',
    updatedDate: '2026-04-01',
    summary:
      'A practical reference breaking down how mainland UAE private-sector end-of-service benefits are calculated on basic salary using the statutory 21-day and 30-day service tiers.',
    sections: [
      {
        heading: 'Statutory Basis: UAE Federal Decree-Law No. 33 of 2021',
        paragraphs: [
          'For full-time employees working in mainland UAE private-sector establishments governed by Federal Decree-Law No. 33 of 2021 (which took effect on 2 February 2022), Article 51 defines the standard end-of-service gratuity entitlement upon completing at least one continuous year of service.',
          'Unlike total monthly take-home pay, end-of-service gratuity is computed exclusively against contractual basic wage—housing, transportation, utilities, telephone, and discretionary bonuses are excluded unless expressly stipulated in your registered contract.',
        ],
        callout: {
          title: 'Informational Reference Notice',
          body: 'This guide summarizes standard private-sector mainland provisions for planning and verification. Employees in DIFC (DEWS savings scheme), ADGM, or specialized arrangements should consult HR, MOHRE, or licensed counsel for binding settlements.',
          tone: 'warning',
        },
      },
      {
        heading: 'The Two Statutory Service Tiers (21 Days vs. 30 Days)',
        paragraphs: [
          'Calculating eligible gratuity splits total continuous service (after subtracting any unpaid leave days) into two progressive daily-rate tiers:',
        ],
        bullets: [
          'Under 1 Year of Continuous Service: No statutory end-of-service gratuity accrues.',
          'Years 1 through 5: 21 calendar days of basic wage for each year of service (accrued pro-rata for completed months/days once the first year is passed).',
          'After 5 Years: 30 calendar days of basic wage for every additional year served beyond the first five years.',
          'Two-Year Cap: Aggregate statutory gratuity cannot exceed the total equivalent of two years (24 months) of basic salary.',
        ],
      },
      {
        heading: 'Worked Example (Basic Salary AED 10,000 over 6 Years)',
        paragraphs: [
          'Suppose a mainland employee earns AED 10,000 monthly basic salary (AED 16,000 gross including housing and transport allowances) and completes exactly 6 continuous years with zero unpaid leave days.',
          'Daily basic wage = (10,000 × 12) / 365 ≈ AED 328.77 per day. Years 1–5 earn 5 × 21 = 105 days (≈ AED 34,520.55). Year 6 earns 1 × 30 = 30 days (≈ AED 9,863.01), giving an estimated combined gratuity of AED 44,383.56—well within the AED 240,000 (24-month basic salary) ceiling.',
        ],
      },
      {
        heading: 'Common Settlement Deductions & Unpaid Leave Impact',
        paragraphs: [
          'Days of unpaid absence recorded during employment do not count toward eligible continuous service tenure and proportionally lower eligible days. Employer-authorized contractual deductions or notice-period shortfalls may also be netted out during final clearance.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Does resignation reduce UAE gratuity under Federal Decree-Law No. 33 of 2021?',
        a: 'Under Decree-Law No. 33 of 2021, the former limited/unlimited contract resignation reductions from Federal Law No. 8 of 1980 were replaced for standard private-sector contracts once one continuous year of service is completed.',
      },
      {
        q: 'How is daily basic salary derived in standard calculators?',
        a: 'Annualized daily basic pay commonly multiplies monthly basic pay by 12 and divides by 365 days (or monthly basic ÷ 30 in some payroll templates—check company policy).',
      },
    ],
    relatedToolPaths: [
      {
        path: '/tools/uae-gratuity-calculator',
        label: 'UAE Gratuity Calculator',
        desc: 'Model exact dates, basic salary, unpaid leave, and 21/30-day tiers immediately.',
      },
      {
        path: '/tools/uae-salary-calculator',
        label: 'UAE Salary Calculator',
        desc: 'Compare Basic vs. Housing and Transport percentages across job offers.',
      },
      {
        path: '/tools/date-difference',
        label: 'Date Difference Calculator',
        desc: 'Check exact service days or 30/60/90-day notice period dates.',
      },
    ],
    relatedCategoryPaths: [{ path: '/categories/uae-calculators', label: 'UAE Payroll & Gratuity Calculators' }],
  },

  {
    slug: 'uae-salary-breakdown-basic-vs-allowances',
    path: '/guides/uae-salary-breakdown-basic-vs-allowances',
    category: 'UAE Payroll & Compliance',
    title: 'UAE Salary Breakdown: Why Basic Salary vs. Allowances Matters',
    seoTitle: 'UAE Salary Breakdown: Basic vs. Allowances | MAWA',
    seoDescription:
      'Learn how UAE employment contracts structure basic pay versus housing and transport allowances and how that split alters gratuity and leave pay.',
    readTimeMinutes: 5,
    publishedDate: '2026-04-01',
    updatedDate: '2026-04-01',
    summary:
      'Two job offers with identical total AED compensation can lead to vastly different end-of-service settlements depending on how much is classified as basic wage.',
    sections: [
      {
        heading: 'How Typical UAE Packages Are Structured',
        paragraphs: [
          'Private-sector offers across Dubai, Abu Dhabi, and Sharjah frequently itemize monthly pay into Basic Salary plus dedicated Allowances such as Housing Allowance, Transport Allowance, or Utility Stipends.',
          'While every AED of fixed allowances contributes equally to your monthly bank deposit (and UAE employment salaries carry 0% personal income tax), basic salary carries distinct legal weight.',
        ],
      },
      {
        heading: 'What Changes When Basic Salary Is Higher vs. Lower?',
        paragraphs: [
          'Consider two offers totaling AED 20,000/month over five years:',
        ],
        bullets: [
          'Offer A (60% Basic = AED 12,000 + AED 8,000 allowances): After 5 years, 105 gratuity days accrue on AED 12,000/month ≈ AED 41,425.',
          'Offer B (40% Basic = AED 8,000 + AED 12,000 allowances): Monthly take-home is identical, yet 105 gratuity days accrue on AED 8,000/month ≈ AED 27,616—nearly AED 13,809 lower at exit.',
          'Overtime Calculations: Statutory overtime uplifts and unused annual leave encashments at termination typically anchor heavily on basic pay definitions.',
        ],
      },
      {
        heading: 'Checklist Before Signing a UAE Job Offer',
        paragraphs: [
          'Verify whether your MOHRE contract matches your offer letter breakdown percentage, inspect probation notice requirements, and model both gross pay and potential multi-year gratuity prior to accepting.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is there a fixed legal minimum percentage for basic salary in the UAE?',
        a: 'Private companies have flexibility in setting pay splits unless governed by sector schedules, though standard contracts commonly allocate roughly 50%–65% to basic salary.',
      },
      {
        q: 'Are commission or overtime earnings usually included in gratuity?',
        a: 'Discretionary bonuses and ad-hoc allowances are typically excluded, whereas contractual basic wage forms the core statutory baseline.',
      },
    ],
    relatedToolPaths: [
      {
        path: '/tools/uae-salary-calculator',
        label: 'UAE Salary Calculator',
        desc: 'Itemize AED basic salary, housing, transport, deductions, and daily pay.',
      },
      {
        path: '/tools/uae-gratuity-calculator',
        label: 'UAE Gratuity Calculator',
        desc: 'Test how basic wage shifts change your multi-year end-of-service benefit.',
      },
    ],
    relatedCategoryPaths: [{ path: '/categories/uae-calculators', label: 'UAE Payroll & Gratuity Calculators' }],
  },

  {
    slug: 'how-to-build-ats-friendly-cv-uae-global',
    path: '/guides/how-to-build-ats-friendly-cv-uae-global',
    category: 'Career & Resumes',
    title: 'How to Build an ATS-Friendly CV for UAE & Global Applications',
    seoTitle: 'How to Build an ATS-Friendly CV (UAE & Global) | MAWA',
    seoDescription:
      'Practical formatting rules for Applicant Tracking Systems: clean headings, selectable Vector PDF text, keyword alignment, and regional clarity.',
    readTimeMinutes: 6,
    publishedDate: '2026-04-01',
    updatedDate: '2026-04-01',
    summary:
      'Avoid the hidden layout mistakes that cause corporate hiring software to misread your experience, and structure measurable achievements clearly.',
    sections: [
      {
        heading: 'How Applicant Tracking Systems (ATS) Actually Read Your CV',
        paragraphs: [
          'Before a hiring manager reads your resume, parsing engines extract raw plain-text tokens from top to bottom and map sections like Work Experience, Education, and Skills into structured database fields.',
          'When candidates embed text inside flat Canva PNG graphics, multi-layer text boxes, or progress-bar skill icons, parsers frequently drop job titles or garble chronological dates.',
        ],
      },
      {
        heading: 'Essential Rules for Clean ATS Parsing',
        paragraphs: ['Follow these reliable document engineering habits:'],
        bullets: [
          'Export Selectable Vector PDF: Verify that you can highlight and copy every word of your PDF manually.',
          'Use Standard Section Headings: Label sections clearly as "Work Experience", "Education", and "Skills" rather than creative metaphors.',
          'Mirror Job Description Terminology: If a posting specifies "Financial Modeling" and "IFRS", write those exact clean terms truthfully inside your bullet points.',
          'Clear Date Ranges: Write consistent "Month Year – Month Year" ranges (e.g., Mar 2022 – Present).',
        ],
      },
      {
        heading: 'UAE & GCC vs. Western CV Expectations',
        paragraphs: [
          'While North American and UK corporate teams omit photos, birthdates, and marital status to reduce hiring bias, employers across the UAE and GCC sometimes prefer knowing visa status or notice period availability concisely near the header.',
          'Keep your CV focused at 1–2 pages with concrete operational outcomes rather than generic duties.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Should I export my resume as Word DOCX or Vector PDF?',
        a: 'Modern enterprise ATS platforms parse selectable Vector PDF reliably while preserving exact margins and typography; keep a JSON backup or editable draft so updates take minutes.',
      },
      {
        q: 'Do fancy icons or star rating bars hurt ATS scores?',
        a: 'Progress bars (e.g., "4/5 stars in Excel") convey no searchable text value to software parsers. List concrete skills and proficiency levels in clear text.',
      },
    ],
    relatedToolPaths: [
      {
        path: '/tools/cv-maker',
        label: 'Free ATS CV & Resume Maker',
        desc: 'Build a clean A4 resume with live templates, JSON backup, and Vector PDF export.',
      },
      {
        path: '/tools/word-counter',
        label: 'Word & Reading Time Counter',
        desc: 'Check cover letter length and concise phrasing.',
      },
      {
        path: '/tools/compress-pdf',
        label: 'Compress PDF',
        desc: 'Shrink exported portfolio PDFs under strict 2 MB job portal limits.',
      },
    ],
    relatedCategoryPaths: [{ path: '/categories/career-cv', label: 'Career & ATS Resume Tools' }],
  },

  {
    slug: 'how-to-merge-split-compress-pdf-privately-in-browser',
    path: '/guides/how-to-merge-split-compress-pdf-privately-in-browser',
    category: 'PDF Workflows & Privacy',
    title: 'How to Merge, Split & Compress PDFs Privately Inside Your Browser',
    seoTitle: 'Merge, Split & Compress PDFs Privately in Browser | MAWA',
    seoDescription:
      'Learn how client-side WebAssembly processes sensitive contracts, passports, and invoices locally without uploading documents to remote servers.',
    readTimeMinutes: 5,
    publishedDate: '2026-04-01',
    updatedDate: '2026-04-01',
    summary:
      'Traditional web PDF tools upload sensitive contracts and IDs to remote cloud servers. Modern browser runtimes let you combine, extract, and shrink PDFs right on your machine.',
    sections: [
      {
        heading: 'Why Local Client-Side PDF Processing Matters',
        paragraphs: [
          'Uploading passport scans, Emirates IDs, employment contracts, tax returns, or board decks to unknown third-party cloud converters creates unnecessary retention and interception risks.',
          'With WebAssembly and modern browser memory streams, your browser already has the compute needed to parse pages, strip unused objects, re-order sequences, and write downloadable blobs locally.',
        ],
      },
      {
        heading: 'Recommended Order of Operations for Clean Document Packets',
        paragraphs: [
          'When assembling multi-document visa, banking, or vendor onboarding submissions, follow a predictable sequence for smallest file size and cleanest pagination:',
        ],
        bullets: [
          '1. Convert photos or receipts cleanly using JPG to PDF or Word to PDF.',
          '2. Split out unnecessary cover letters or blank pages with Split PDF.',
          '3. Combine ordered sections in Merge PDF.',
          '4. Apply sequential headers/footers via Add Page Numbers.',
          '5. Shrink oversized image-heavy bundles at the end using Compress PDF.',
        ],
      },
    ],
    faqs: [
      {
        q: 'How can I verify that files stay on my device?',
        a: 'Open your browser Developer Tools Network tab while running Merge PDF, Split PDF, or Compress PDF—you will observe zero file-upload POST requests leaving your device.',
      },
      {
        q: 'Why shrink size last rather than first?',
        a: 'Combining pages first lets compression optimize embedded imagery uniformly across the finished packet in a single pass.',
      },
    ],
    relatedToolPaths: [
      { path: '/tools/merge-pdf', label: 'Merge PDF', desc: 'Combine ordered PDF files locally.' },
      { path: '/tools/split-pdf', label: 'Split PDF', desc: 'Extract specific pages or ranges.' },
      { path: '/tools/compress-pdf', label: 'Compress PDF', desc: 'Reduce PDF size for portals and email.' },
      { path: '/tools/pdf-tools-suite', label: 'Full 43-Tool PDF Suite', desc: 'Open all PDF utilities.' },
    ],
    relatedCategoryPaths: [{ path: '/categories/pdf-tools', label: 'PDF Tools Suite' }],
  },

  {
    slug: 'how-to-convert-pdf-to-word-or-excel-locally',
    path: '/guides/how-to-convert-pdf-to-word-or-excel-locally',
    category: 'PDF Workflows & Privacy',
    title: 'How to Convert PDF to Word or Excel Locally (What Works & Limits)',
    seoTitle: 'Convert PDF to Word & Excel Locally – Honest Guide | MAWA',
    seoDescription:
      'Understand when browser PDF-to-DOCX and PDF-to-XLSX extract text and tables cleanly, and how to handle scanned documents using OCR.',
    readTimeMinutes: 5,
    publishedDate: '2026-04-01',
    updatedDate: '2026-04-01',
    summary:
      'Know the critical difference between digital selectable-text PDFs and image-based scans so you pick the cleanest local conversion path every time.',
    sections: [
      {
        heading: 'Digital PDF vs. Scanned Image PDF (The 5-Second Test)',
        paragraphs: [
          'Before converting any PDF to Word or Excel, open it in your browser and try highlighting a single sentence with your cursor. If individual words select cleanly, the PDF contains real text glyphs and coordinate metadata.',
          'If clicking anywhere highlights the entire page as one big picture rectangle, the PDF is a flat raster scan—it contains pixels, not text.',
        ],
      },
      {
        heading: 'Converting Text-Based PDFs to Word (.docx) & Excel (.xlsx)',
        paragraphs: [
          'For selectable PDFs, browser converters read each text token alongside its X/Y coordinates. PDF to Word rebuilds sequential paragraphs into an OpenXML .docx file, while PDF to Excel aligns same-row baselines into spreadsheet columns inside an .xlsx workbook.',
        ],
        bullets: [
          'Digital invoices, system reports, and academic papers convert into editable DOCX cleanly.',
          'Bank statements and tabular fee schedules map cleanly to XLSX rows when columns stay visually aligned.',
          'Multi-column magazine layouts, decorative callout boxes, and merged cells may require manual layout tweaks after export.',
        ],
      },
      {
        heading: 'What to Do When Your PDF Is Scanned',
        paragraphs: [
          'Run OCR PDF first so optical character recognition decodes printed letters into selectable text before moving content into Word or spreadsheets.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Why can two PDFs look identical on screen yet extract differently?',
        a: 'One may embed digital TrueType fonts while another is a flattened screenshot or scanner JPEG wrapped in a PDF container.',
      },
      {
        q: 'Can I convert spreadsheets back into PDF as well?',
        a: 'Yes—use Word to PDF or Excel to PDF cleanly in the same local browser suite.',
      },
    ],
    relatedToolPaths: [
      { path: '/tools/pdf-to-word', label: 'PDF to Word (DOCX)', desc: 'Extract paragraphs locally to DOCX.' },
      { path: '/tools/pdf-to-excel', label: 'PDF to Excel (XLSX)', desc: 'Convert tabular PDFs to Excel workbooks.' },
      { path: '/tools/ocr-pdf', label: 'OCR Scanned PDF', desc: 'Recognize text from flat scanned PDFs.' },
    ],
    relatedCategoryPaths: [{ path: '/categories/pdf-tools', label: 'PDF Tools Suite' }],
  },

  {
    slug: 'how-to-ocr-scanned-pdfs-locally',
    path: '/guides/how-to-ocr-scanned-pdfs-locally',
    category: 'PDF Workflows & Privacy',
    title: 'How to Run OCR on Scanned PDFs Locally Without Cloud Uploads',
    seoTitle: 'OCR Scanned PDFs Locally in Your Browser | MAWA',
    seoDescription:
      'Extract searchable text from photographed receipts, contracts, and scanned papers via Tesseract WebAssembly OCR directly on your device.',
    readTimeMinutes: 4,
    publishedDate: '2026-04-01',
    updatedDate: '2026-04-01',
    summary:
      'Use local optical character recognition to pull editable text out of paper scans while keeping private legal or identity records offline.',
    sections: [
      {
        heading: 'How Browser OCR Works Under the Hood',
        paragraphs: [
          'Optical Character Recognition analyzes monochrome pixel shapes inside each rendered PDF page and maps glyph patterns against language dictionaries using Tesseract compiled to WebAssembly.',
          'On the initial run, the browser downloads compact language training weights into cache so subsequent scans execute offline.',
        ],
      },
      {
        heading: 'Getting Higher Recognition Accuracy from Phone Scans',
        paragraphs: ['Scan quality dictates OCR accuracy more than any software setting:'],
        bullets: [
          'Flatten the page and avoid angled perspective distortion.',
          'Ensure crisp, even lighting without harsh camera shadows cutting across paragraphs.',
          'Prefer printed typefaces at clear 200–300 DPI equivalent sharpness; cursive handwriting remains hard for generic printed OCR models.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Are scanned ID cards or confidential bills uploaded during OCR?',
        a: 'No. Tesseract WebAssembly executes strictly inside browser worker threads on your machine.',
      },
      {
        q: 'Why does multi-page OCR take noticeable CPU time?',
        a: 'Evaluating high-resolution page canvases locally uses your own device CPU rather than remote GPU servers—processing a few targeted pages at a time keeps runs snappy.',
      },
    ],
    relatedToolPaths: [
      { path: '/tools/ocr-pdf', label: 'OCR Scanned PDF Tool', desc: 'Recognize text inside image PDFs locally.' },
      { path: '/tools/pdf-to-png', label: 'PDF to PNG', desc: 'Inspect lossless page renders cleanly.' },
      { path: '/tools/pdf-to-word', label: 'PDF to Word', desc: 'Convert digital selectable PDFs to DOCX.' },
    ],
    relatedCategoryPaths: [{ path: '/categories/pdf-tools', label: 'PDF Tools Suite' }],
  },

  {
    slug: 'how-to-protect-and-unlock-pdfs-safely',
    path: '/guides/how-to-protect-and-unlock-pdfs-safely',
    category: 'PDF Workflows & Privacy',
    title: 'How to Password Protect, Watermark & Safely Share PDFs',
    seoTitle: 'Password Protect & Watermark PDFs Safely | MAWA',
    seoDescription:
      'Compare client-side AES PDF encryption versus visual watermarks, avoid common password pitfalls, and share sensitive PDFs responsibly.',
    readTimeMinutes: 4,
    publishedDate: '2026-04-01',
    updatedDate: '2026-04-01',
    summary:
      'Encrypting confidential HR offers, bank statements, and client deliverables locally ensures passwords and files never touch third-party servers.',
    sections: [
      {
        heading: 'Encryption vs. Visual Watermarks: When to Use Each',
        paragraphs: [
          'Applying a diagonal DRAFT or CONFIDENTIAL watermark discourages casual redistribution once opened, yet anyone possessing the unencrypted file still views its content. Opening passwords using real AES encryption prevent unauthorized parties from opening the PDF stream at all.',
          'Combining both—stamping recipient context as a subtle watermark and encrypting with a strong random password shared over a separate channel—provides practical defense in depth.',
        ],
      },
      {
        heading: 'Safe Password Habits for Protected Documents',
        paragraphs: ['Protect encrypted files reliably without locking yourself out:'],
        bullets: [
          'Generate an unpredictable 14+ character passphrase rather than birthdays or company names.',
          'Share the encrypted PDF by email, and send its decryption password separately via WhatsApp, SMS, or Signal.',
          'Never lose the master copy—local encryption cannot be bypassed by FreeTools Hub if misplaced.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Does Protect PDF use real cryptographic encryption?',
        a: 'Yes. It runs QPDF WebAssembly inside your browser to write standard AES-encrypted PDF streams respected across Adobe Acrobat, Chrome, Safari, and macOS Preview.',
      },
      {
        q: 'Can I remove a password from a PDF I legitimately own?',
        a: 'Yes—inside the full PDF Tools Suite, authorized Unlock PDF decrypts files cleanly when you supply the valid opening password.',
      },
    ],
    relatedToolPaths: [
      { path: '/tools/protect-pdf', label: 'Protect PDF (AES-256)', desc: 'Encrypt PDFs locally with QPDF WASM.' },
      { path: '/tools/pdf-watermark', label: 'Add Watermark to PDF', desc: 'Stamp custom diagonal marks across pages.' },
      { path: '/tools/password-generator', label: 'Password Generator', desc: 'Create strong random encryption passphrases.' },
    ],
    relatedCategoryPaths: [{ path: '/categories/pdf-tools', label: 'PDF Tools Suite' }],
  },

  {
    slug: 'how-to-audit-webpage-on-page-seo',
    path: '/guides/how-to-audit-webpage-on-page-seo',
    category: 'SEO & Security',
    title: 'How to Audit Any Webpage for On-Page & Technical SEO Issues',
    seoTitle: 'On-Page & Technical SEO Audit Checklist | MAWA',
    seoDescription:
      'Run a practical SEO audit inspecting canonical URLs, title tags, single H1 hierarchy, OpenGraph previews, JSON-LD, and crawlable links.',
    readTimeMinutes: 6,
    publishedDate: '2026-04-01',
    updatedDate: '2026-04-01',
    summary:
      'Even well-written websites struggle to rank when trailing-slash duplicates, missing canonicals, duplicate H1 tags, or broken metadata confuse crawlers.',
    sections: [
      {
        heading: '1. Indexability, Canonicals & Status Codes First',
        paragraphs: [
          'Verify that live indexable URLs return a clean HTTP 200 without accidental noindex tags or redirect chains, while unknown URLs return genuine HTTP 404 status with noindex—avoiding "Soft 404" homepage fallbacks.',
          'Ensure each page declares a single self-referencing absolute <link rel="canonical"> using the exact production origin.',
        ],
      },
      {
        heading: '2. Titles, Meta Descriptions & Heading Hierarchy',
        paragraphs: ['Audit visible headings and head metadata together:'],
        bullets: [
          'Unique <title> (~50–60 chars) targeting a clear topic without duplicating neighboring pages.',
          'Compelling <meta name="description"> (~135–160 chars) summarizing page value accurately.',
          'Exactly one descriptive <h1> tag near the top of main content followed sequentially by <h2> and <h3> subsections.',
        ],
      },
      {
        heading: '3. Structured Data (JSON-LD) & Image Optimization',
        paragraphs: [
          'Validate embedded application/ld+json blocks so every Schema property (such as FAQPage questions) reflects real visible text on the page. Compress oversized hero images to WebP and verify descriptive alt attributes for accessibility and Google Images.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Can Google crawl Single-Page Applications properly?',
        a: 'Shipping prerendered static HTML snapshots with complete head tags, canonicals, JSON-LD, and semantic body links alongside React hydration eliminates indexing delays.',
      },
      {
        q: 'Does <meta name="keywords"> help rankings?',
        a: 'No—modern search engines ignore meta keywords entirely. Focus on clear user-centric copy, semantic headings, and clean internal linking.',
      },
    ],
    relatedToolPaths: [
      { path: '/tools/seo-page-analyzer', label: 'SEO Page Analyzer', desc: 'Inspect live public URLs or pasted HTML immediately.' },
      { path: '/tools/seo-meta-generator', label: 'SEO Meta Tags Generator', desc: 'Preview SERP snippet lengths and OpenGraph tags.' },
      { path: '/tools/image-compressor', label: 'Image Compressor', desc: 'Shrink heavy JPG/PNG assets into fast WebP files.' },
    ],
    relatedCategoryPaths: [{ path: '/categories/video-content', label: 'Video, Writing & SEO Tools' }],
  },

  {
    slug: 'how-to-generate-strong-passwords-and-check-entropy',
    path: '/guides/how-to-generate-strong-passwords-and-check-entropy',
    category: 'SEO & Security',
    title: 'How to Generate Strong Passwords & Check Entropy Safely Offline',
    seoTitle: 'Password Security & Entropy Guide (Offline) | MAWA',
    seoDescription:
      'Why length beats predictable symbol swaps, how Web Crypto CSPRNG generates unpredictable secrets, and why entropy checks must stay client-side.',
    readTimeMinutes: 5,
    publishedDate: '2026-04-01',
    updatedDate: '2026-04-01',
    summary:
      'Learn how attackers crack leaked password hashes and why generating long, unique credentials inside browser memory protects every account.',
    sections: [
      {
        heading: 'Why Reusing "Clever" Passwords Fails Immediately',
        paragraphs: [
          'Substitutions like turning "Password2025!" into "P@ssw0rd2025!" add minimal real security—cracking wordlists test common leetspeak transformations billions of times per second on consumer GPUs.',
          'More importantly, credential-stuffing bots automatically replay passwords leaked from one minor forum against high-value email, cloud, and banking accounts.',
        ],
      },
      {
        heading: 'Understanding Password Entropy & Web Crypto CSPRNG',
        paragraphs: [
          'True randomness expands the search space exponentially with every extra character. Generating credentials through window.crypto.getRandomValues pulls hardware entropy from the operating system rather than predictable pseudo-random math seeds.',
          'Aim for at least 16 random characters—or 20+ for critical cloud, email, and financial logins—stored uniquely per service inside an encrypted password manager.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Why should password checkers never run server-side?',
        a: 'Sending candidate passwords across an external network unnecessarily exposes secrets in logs or transport. Local JavaScript entropy checks run cleanly with zero network requests.',
      },
      {
        q: 'Is two-factor authentication (2FA) still necessary?',
        a: 'Yes—enable phishing-resistant 2FA / authenticator apps alongside unique high-entropy passwords whenever available.',
      },
    ],
    relatedToolPaths: [
      { path: '/tools/password-generator', label: 'Strong Password Generator', desc: 'Create random credentials via Web Crypto API.' },
      { path: '/tools/password-strength', label: 'Password Strength Checker', desc: 'Test bit entropy offline with zero requests.' },
    ],
    relatedCategoryPaths: [{ path: '/categories/other-utilities', label: 'Finance, Security & Dev Utilities' }],
  },

  {
    slug: 'how-to-write-consistent-ai-image-and-video-prompts',
    path: '/guides/how-to-write-consistent-ai-image-and-video-prompts',
    category: 'SEO & Security',
    title: 'How to Write Consistent AI Image & Video Prompts With Reusable Anchors',
    seoTitle: 'Write Consistent AI Image & Video Prompts | MAWA',
    seoDescription:
      'Learn repeatable prompting structure—subject anchors, lens/lighting physics, camera arcs, and negative rules—for Gemini, Flux, Runway, and Sora.',
    readTimeMinutes: 5,
    publishedDate: '2026-04-01',
    updatedDate: '2026-04-01',
    summary:
      'Replace trial-and-error prompting with structured photographic descriptors and locked multi-scene character directives.',
    sections: [
      {
        heading: 'Anatomy of a Reliable AI Image Prompt',
        paragraphs: [
          'Instead of piling subjective buzzwords ("hyper-detailed 16k masterpiece"), describe concrete photographic elements in natural sequence:',
        ],
        bullets: [
          'Subject & Action: Specific age, expression, posture, fabric texture, and interaction with surroundings.',
          'Environment & Depth: Architectural setting, foreground elements, and atmospheric depth.',
          'Lighting & Color Palette: Direction and warmth (e.g., soft overcast window light, late afternoon rim light).',
          'Optics & Framing: Focal length and shot framing (e.g., 85mm medium close-up, 24mm architectural wide).',
        ],
      },
      {
        heading: 'Keeping Characters Consistent Across Multi-Scene Video Shots',
        paragraphs: [
          'Generative video tools treat each shot clip semi-independently unless visual anchors stay identical across prompts. Define exact clothing colors, hairstyle, facial traits, and lighting time-of-day once, then vary only camera motion (e.g., slow forward dolly vs. side tracking) and action beats.',
        ],
      },
    ],
    faqs: [
      {
        q: 'What does Reference Image Identity Preservation Mode add?',
        a: 'When editing or styling around an uploaded person photo, explicit likeness preservation clauses tell multimodal models not to alter facial structure, eyes, or nose geometry.',
      },
      {
        q: 'Why include negative prompt guidance?',
        a: 'Short clear exclusions help reduce frequent diffusion artifacts such as extra fingers, distorted text signs, or over-sharpened HDR halos.',
      },
    ],
    relatedToolPaths: [
      { path: '/tools/ai-photo-prompt-generator', label: 'AI Photo Prompt Generator', desc: 'Build structured optics, lighting & likeness prompts.' },
      { path: '/tools/ai-video-prompt-generator', label: 'AI Video Prompt Generator', desc: 'Compose multi-scene camera & voiceover scripts.' },
    ],
    relatedCategoryPaths: [{ path: '/categories/ai-tools', label: 'AI Tools & Prompt Engineering' }],
  },
];

export const GUIDE_BY_SLUG = new Map<string, EditorialGuide>(
  EDITORIAL_GUIDES.map((guide) => [guide.slug.toLowerCase(), guide])
);

export function findGuideBySlug(slugOrPath: string): EditorialGuide | null {
  const clean = slugOrPath
    .toLowerCase()
    .replace(/^\/?guides\/?/, '')
    .replace(/^\//, '')
    .replace(/\/+$/, '');
  return GUIDE_BY_SLUG.get(clean) || null;
}

export function getGuidesBySlugs(slugs: string[]): EditorialGuide[] {
  return slugs
    .map((s) => GUIDE_BY_SLUG.get(s.toLowerCase()))
    .filter((g): g is EditorialGuide => Boolean(g));
}
