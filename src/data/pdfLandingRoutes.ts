/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PdfSubToolId } from '../components/tools/PdfToolsSuite/pdfSuiteTypes';
import { ToolFaqItem } from './keywordStrategy';

export interface PdfLandingRouteConfig {
  subToolId: PdfSubToolId;
  primarySlug: string;
  primaryPath: string;
  aliases: string[];
  primaryKeyword: string;
  h1: string;
  seoTitle: string;
  seoDescription: string;
  introSummary: string;
  whatItDoes: string;
  howToUse: string[];
  supportedFormats: string;
  limitations: string;
  faqs: ToolFaqItem[];
  relatedLandingSlugs: string[];
  relatedGuideSlugs: string[];
}

export const PDF_LANDING_ROUTES: PdfLandingRouteConfig[] = [
  {
    subToolId: 'merge-pdf',
    primarySlug: 'merge-pdf',
    primaryPath: '/tools/merge-pdf',
    aliases: ['merge-pdf', 'combine-pdf'],
    primaryKeyword: 'merge pdf files online free',
    h1: 'Merge PDF Files Online Free (100% Local)',
    seoTitle: 'Merge PDF Files Online Free – Private | FreeTools Hub',
    seoDescription:
      'Combine multiple PDF documents into one ordered file directly in your browser. Reorder files cleanly with zero server uploads or watermarks.',
    introSummary:
      'Join multiple PDF contracts, invoices, scans, or application documents into a single clean PDF without uploading sensitive paperwork.',
    whatItDoes:
      'Uses client-side PDF assembly (pdf-lib) to append pages from multiple selected PDFs in your exact chosen sequence inside browser memory.',
    howToUse: [
      'Upload or drag two or more PDF files into the Merge PDF workspace.',
      'Drag or move files up and down to set the exact output page sequence.',
      'Click Run Merge PDF and download the combined PDF immediately.',
    ],
    supportedFormats: 'Input: Multiple .pdf files · Output: Single merged .pdf document',
    limitations:
      'Password-protected source PDFs must be unlocked first before merging pages. Processing speed depends on device RAM for oversized scan batches.',
    faqs: [
      {
        q: 'Is there any limit on file privacy when merging PDFs?',
        a: 'No files are uploaded to external servers. Merging runs strictly on your device using browser JavaScript.',
      },
      {
        q: 'Can I change the file order before combining?',
        a: 'Yes. Arrange uploaded files in your exact desired sequence prior to running the merge.',
      },
      {
        q: 'Does merging add watermarks?',
        a: 'Never. Merged documents preserve clean original pages with zero added watermarks.',
      },
    ],
    relatedLandingSlugs: ['split-pdf', 'compress-pdf', 'pdf-page-numbers'],
    relatedGuideSlugs: ['how-to-merge-split-compress-pdf-privately-in-browser'],
  },

  {
    subToolId: 'compress-pdf',
    primarySlug: 'compress-pdf',
    primaryPath: '/tools/compress-pdf',
    aliases: ['compress-pdf', 'reduce-pdf-size'],
    primaryKeyword: 'compress pdf file size online free',
    h1: 'Compress PDF File Size Online Free',
    seoTitle: 'Compress PDF Online Free – Reduce Size | FreeTools Hub',
    seoDescription:
      'Shrink large PDF file sizes directly in your browser to meet email or portal upload limits while preserving readable text and zero uploads.',
    introSummary:
      'Reduce oversized PDF documents cleanly inside your web browser to meet strict 2 MB or 5 MB job portal, visa, or email attachment limits.',
    whatItDoes:
      'Rebuilds object streams and compresses embedded raster page imagery according to your selected quality preset right inside your browser.',
    howToUse: [
      'Select or drop your PDF document into the Compress PDF workspace.',
      'Choose Standard, Strong, or High-Clarity compression balance.',
      'Run compression, review percentage savings, and save the lighter PDF.',
    ],
    supportedFormats: 'Input: .pdf document · Output: Size-optimized .pdf file',
    limitations:
      'Strong raster compression flattens complex vector pages into compressed images for maximum size reduction, whereas already optimized text-only PDFs shrink modestly.',
    faqs: [
      {
        q: 'How much smaller can a PDF become?',
        a: 'Scanned or photo-heavy PDFs often shrink significantly depending on image resolution and selected preset, while sparse text PDFs already have smaller footprints.',
      },
      {
        q: 'Are confidential PDFs uploaded to compress them?',
        a: 'No. PDF rendering and re-encoding stay locally on your device.',
      },
    ],
    relatedLandingSlugs: ['merge-pdf', 'split-pdf', 'jpg-to-pdf'],
    relatedGuideSlugs: ['how-to-merge-split-compress-pdf-privately-in-browser'],
  },

  {
    subToolId: 'pdf-to-word',
    primarySlug: 'pdf-to-word',
    primaryPath: '/tools/pdf-to-word',
    aliases: ['pdf-to-word', 'convert-pdf-to-docx'],
    primaryKeyword: 'convert pdf to word docx locally',
    h1: 'Convert PDF to Word (DOCX) Online Free',
    seoTitle: 'PDF to Word Converter Free – Browser DOCX | FreeTools Hub',
    seoDescription:
      'Convert selectable text PDFs into editable Word (.docx) documents directly inside your browser without uploading files to external servers.',
    introSummary:
      'Extract paragraphs, headings, and text flow from selectable PDF documents into editable Microsoft Word (.docx) files locally.',
    whatItDoes:
      'Parses text runs, line coordinates, and font sizes via PDF.js and constructs an editable OpenXML Word document (.docx) in browser memory.',
    howToUse: [
      'Upload a selectable-text PDF file in the PDF to Word converter.',
      'Run text extraction and DOCX assembly locally in your browser.',
      'Download the editable .docx file and review formatting in Word or LibreOffice.',
    ],
    supportedFormats: 'Input: Selectable .pdf · Output: Editable Microsoft Word .docx',
    limitations:
      'Best suited for text-based PDFs. Image-only scanned PDFs contain no embedded text layer unless processed through OCR first, and intricate multi-column magazine layouts may require manual layout cleanup.',
    faqs: [
      {
        q: 'Why does a scanned PDF export empty text in DOCX?',
        a: 'Scanned pages are flat pictures without embedded text characters. Run OCR PDF first to extract text from image-based scans.',
      },
      {
        q: 'Does conversion require Microsoft Word installed?',
        a: 'No. The .docx file builds entirely in browser JavaScript and opens in Word, Google Docs, or LibreOffice.',
      },
    ],
    relatedLandingSlugs: ['word-to-pdf', 'ocr-pdf', 'pdf-to-excel'],
    relatedGuideSlugs: ['how-to-convert-pdf-to-word-or-excel-locally', 'how-to-ocr-scanned-pdfs-locally'],
  },

  {
    subToolId: 'pdf-to-excel',
    primarySlug: 'pdf-to-excel',
    primaryPath: '/tools/pdf-to-excel',
    aliases: ['pdf-to-excel', 'convert-pdf-to-xlsx'],
    primaryKeyword: 'convert pdf to excel xlsx locally',
    h1: 'Convert PDF Tables to Excel (XLSX) Free',
    seoTitle: 'PDF to Excel Converter Free – Local XLSX | FreeTools Hub',
    seoDescription:
      'Extract structured rows, financial statements, and tabular columns from PDFs into Microsoft Excel (.xlsx) spreadsheets privately in your browser.',
    introSummary:
      'Convert bank statements, invoices, and structured PDF tables into editable Excel (.xlsx) spreadsheets on your own device.',
    whatItDoes:
      'Reads text token X/Y coordinates via PDF.js, groups rows by baseline alignment, splits columns, and writes an Excel workbook (.xlsx) via SheetJS.',
    howToUse: [
      'Upload a text-based PDF containing financial tables or lists.',
      'Run the local extraction engine to group table rows and columns.',
      'Download the generated .xlsx spreadsheet and inspect column alignment.',
    ],
    supportedFormats: 'Input: Selectable .pdf with tables · Output: Excel workbook .xlsx',
    limitations:
      'Accuracy depends on cleanly aligned tabular text inside digital PDFs. Merged cells, rotated headers, or raster-scanned statements may need quick column cleanup.',
    faqs: [
      {
        q: 'Is it safe to convert confidential bank or payroll PDFs here?',
        a: 'Yes. Financial PDF files never leave your browser memory during parsing or workbook generation.',
      },
      {
        q: 'What if my PDF invoice is a scanned photograph?',
        a: 'Scanned image PDFs lack coordinate text layers; use OCR PDF first to recognize text.',
      },
    ],
    relatedLandingSlugs: ['excel-to-pdf', 'pdf-to-word', 'ocr-pdf'],
    relatedGuideSlugs: ['how-to-convert-pdf-to-word-or-excel-locally'],
  },

  {
    subToolId: 'pdf-to-jpg',
    primarySlug: 'pdf-to-jpg',
    primaryPath: '/tools/pdf-to-jpg',
    aliases: ['pdf-to-jpg', 'convert-pdf-to-jpeg'],
    primaryKeyword: 'convert pdf pages to jpg images',
    h1: 'Convert PDF to JPG Images Free',
    seoTitle: 'PDF to JPG Converter Online Free – Local | FreeTools Hub',
    seoDescription:
      'Render PDF pages as crisp JPG images or download all converted pages in one ZIP archive privately inside your browser.',
    introSummary:
      'Turn every page of a PDF presentation, brochure, or receipt into shareable JPG photos right on your device.',
    whatItDoes:
      'Renders each PDF page onto an HTML5 Canvas at crisp scale via PDF.js and encodes downloadable JPG images (single file or bundled ZIP).',
    howToUse: [
      'Select your PDF file in the PDF to JPG converter.',
      'Adjust quality or scale preferences if needed.',
      'Run conversion and download individual JPGs or a complete ZIP pack.',
    ],
    supportedFormats: 'Input: .pdf document · Output: .jpg image(s) or .zip archive',
    limitations:
      'Large documents with dozens of high-DPI pages generate larger ZIP bundles; consider 1.5x–2x scale for fast downloads.',
    faqs: [
      {
        q: 'Can I extract all PDF pages into JPG at once?',
        a: 'Yes. Multi-page PDFs are converted per page and neatly packaged for quick saving.',
      },
      {
        q: 'When should I pick PNG instead of JPG?',
        a: 'Choose JPG for photographs and smaller web file sizes, or PNG for razor-sharp UI diagrams and small text.',
      },
    ],
    relatedLandingSlugs: ['pdf-to-png', 'jpg-to-pdf', 'compress-pdf'],
    relatedGuideSlugs: ['how-to-merge-split-compress-pdf-privately-in-browser'],
  },

  {
    subToolId: 'jpg-to-pdf',
    primarySlug: 'jpg-to-pdf',
    primaryPath: '/tools/jpg-to-pdf',
    aliases: ['jpg-to-pdf', 'images-to-pdf'],
    primaryKeyword: 'convert jpg images to pdf free',
    h1: 'Convert JPG Images to PDF Online Free',
    seoTitle: 'JPG to PDF Converter Free – Private Tool | FreeTools Hub',
    seoDescription:
      'Combine one or multiple JPG photos, receipts, or document scans into a clean printable PDF document in seconds with zero uploads.',
    introSummary:
      'Bundle camera scans, IDs, bills, or photos into a single ordered A4 or custom-sized PDF right inside your browser.',
    whatItDoes:
      'Embeds selected JPG/JPEG/PNG images into a clean PDF document with automatic orientation and page sizing using pdf-lib.',
    howToUse: [
      'Upload one or more JPG photos into the JPG to PDF workspace.',
      'Adjust page order and orientation or margin preferences.',
      'Generate and download your unified PDF document immediately.',
    ],
    supportedFormats: 'Input: JPG, JPEG, PNG images · Output: Printable .pdf document',
    limitations:
      'Very high-megapixel raw phone photos create larger output PDFs unless resized or compressed.',
    faqs: [
      {
        q: 'Can I combine multiple JPG scans into one PDF?',
        a: 'Yes. Select as many images as needed and place each on its own clean PDF page in sequence.',
      },
      {
        q: 'Does converting keep photos private?',
        a: 'Yes. Personal IDs, receipts, and photos stay locally in browser memory.',
      },
    ],
    relatedLandingSlugs: ['pdf-to-jpg', 'compress-pdf', 'merge-pdf'],
    relatedGuideSlugs: ['how-to-merge-split-compress-pdf-privately-in-browser'],
  },

  {
    subToolId: 'split-pdf',
    primarySlug: 'split-pdf',
    primaryPath: '/tools/split-pdf',
    aliases: ['split-pdf', 'extract-pdf-pages'],
    primaryKeyword: 'split pdf into separate pages free',
    h1: 'Split PDF & Extract Specific Pages Free',
    seoTitle: 'Split PDF Pages Online Free – No Upload | FreeTools Hub',
    seoDescription:
      'Split a multi-page PDF into single files or extract exact page ranges cleanly inside your browser without uploading private files.',
    introSummary:
      'Separate long PDF reports, invoices, or textbook chapters into individual PDF pages or targeted page ranges locally.',
    whatItDoes:
      'Extracts chosen page indices or splits every page into standalone PDF files packaged into an easy ZIP download.',
    howToUse: [
      'Drop your multi-page PDF file into Split PDF.',
      'Choose split mode or enter page ranges (e.g., 1-3, 5).',
      'Download extracted PDF pages or the full ZIP archive.',
    ],
    supportedFormats: 'Input: Multi-page .pdf · Output: Single extracted .pdf or .zip archive',
    limitations:
      'Encrypted source PDFs require unlocking with their valid password prior to splitting.',
    faqs: [
      {
        q: 'Can I extract only specific pages instead of splitting every page?',
        a: 'Yes. Specify page ranges or pick individual pages so you download strictly what you need.',
      },
      {
        q: 'Does splitting degrade text quality or vector fonts?',
        a: 'No. Pages are copied directly at vector fidelity without rasterization.',
      },
    ],
    relatedLandingSlugs: ['merge-pdf', 'compress-pdf', 'pdf-page-numbers'],
    relatedGuideSlugs: ['how-to-merge-split-compress-pdf-privately-in-browser'],
  },

  {
    subToolId: 'pdf-to-png',
    primarySlug: 'pdf-to-png',
    primaryPath: '/tools/pdf-to-png',
    aliases: ['pdf-to-png', 'convert-pdf-to-png'],
    primaryKeyword: 'convert pdf to png lossless images',
    h1: 'Convert PDF to PNG Images Online Free',
    seoTitle: 'PDF to PNG Converter Free – Lossless Local | FreeTools Hub',
    seoDescription:
      'Export PDF pages to lossless high-resolution PNG images directly in your browser with sharp text clarity and complete document privacy.',
    introSummary:
      'Render crisp, lossless PNG snapshots of PDF forms, UI mockups, certificates, and diagrams without JPEG compression artifacts.',
    whatItDoes:
      'Rasterizes selected PDF pages via PDF.js onto an HTML5 Canvas and outputs lossless PNG files locally.',
    howToUse: [
      'Upload your PDF document to the PDF to PNG tool.',
      'Select render resolution / scale preset.',
      'Run conversion and download crisp PNG files or a ZIP archive.',
    ],
    supportedFormats: 'Input: .pdf document · Output: Lossless .png images / .zip',
    limitations:
      'Lossless PNG images are larger than JPGs for full-color photographs; use PDF to JPG when file size matters most.',
    faqs: [
      {
        q: 'Why choose PNG over JPG for PDF conversion?',
        a: 'PNG preserves sharp edges around small text, CAD line art, tables, and charts without fuzzy compression rings.',
      },
      {
        q: 'Does conversion work offline?',
        a: 'Yes, once the web app is cached, conversion runs inside your local browser.',
      },
    ],
    relatedLandingSlugs: ['pdf-to-jpg', 'jpg-to-pdf', 'edit-pdf'],
    relatedGuideSlugs: ['how-to-merge-split-compress-pdf-privately-in-browser'],
  },

  {
    subToolId: 'protect-pdf',
    primarySlug: 'protect-pdf',
    primaryPath: '/tools/protect-pdf',
    aliases: ['protect-pdf', 'encrypt-pdf-password'],
    primaryKeyword: 'password protect pdf encryption free',
    h1: 'Password Protect & Encrypt PDF (AES-256) Free',
    seoTitle: 'Protect PDF with Password – Local Encrypt | FreeTools Hub',
    seoDescription:
      'Lock confidential PDF files with real password encryption directly inside your browser using QPDF WebAssembly—zero server file uploads.',
    introSummary:
      'Encrypt HR contracts, financial statements, or identity copies with an opening password inside your local browser before emailing.',
    whatItDoes:
      'Runs real client-side QPDF WebAssembly encryption to protect your PDF document with user/owner passwords without sending documents or passwords across any network.',
    howToUse: [
      'Select your PDF document in the Protect PDF tool.',
      'Enter a strong opening password (and optional owner restrictions password).',
      'Encrypt locally and save your protected PDF.',
    ],
    supportedFormats: 'Input: Unencrypted .pdf + password · Output: Encrypted .pdf',
    limitations:
      'Always store your chosen password safely—client-side encryption cannot be recovered or bypassed if forgotten.',
    faqs: [
      {
        q: 'Does this apply real PDF password encryption or just fake UI tricks?',
        a: 'It uses real WebAssembly PDF encryption (QPDF) right in your browser so standard viewers like Adobe Acrobat, Chrome, and Preview require the password to open.',
      },
      {
        q: 'Are my PDF or password ever transmitted to a server?',
        a: 'Never. Both the PDF bytes and your password stay exclusively in browser memory.',
      },
    ],
    relatedLandingSlugs: ['pdf-watermark', 'merge-pdf', 'compress-pdf'],
    relatedGuideSlugs: ['how-to-protect-and-unlock-pdfs-safely'],
  },

  {
    subToolId: 'pdf-ocr',
    primarySlug: 'ocr-pdf',
    primaryPath: '/tools/ocr-pdf',
    aliases: ['ocr-pdf', 'pdf-ocr', 'scanned-pdf-ocr'],
    primaryKeyword: 'ocr scanned pdf to text browser',
    h1: 'OCR Scanned PDF to Searchable Text Free',
    seoTitle: 'PDF OCR Online Free – Extract Scanned Text | FreeTools Hub',
    seoDescription:
      'Recognize text inside scanned PDF pages and camera documents directly in your browser via Tesseract OCR with complete privacy.',
    introSummary:
      'Extract selectable, searchable text from scanned contracts, paper forms, and photo PDFs using local Tesseract OCR inside your browser.',
    whatItDoes:
      'Renders scanned PDF pages via PDF.js and runs Tesseract.js WebAssembly optical character recognition on your device to produce copyable text.',
    howToUse: [
      'Upload a scanned or image-based PDF file.',
      'Choose language model and start local OCR recognition.',
      'Copy recognized text or export clean TXT / searchable content.',
    ],
    supportedFormats: 'Input: Scanned / image-based .pdf · Output: Extracted editable text & searchable output',
    limitations:
      'Low-contrast, blurry, skewed, or handwritten scans lower character recognition accuracy compared to clean 300-DPI printed scans.',
    faqs: [
      {
        q: 'Why does OCR take a few seconds on first load?',
        a: 'Tesseract loads language training data into browser cache on initial run so character recognition runs locally without sending private scans to cloud APIs.',
      },
      {
        q: 'Can OCR recognize rotated or faint handwriting?',
        a: 'Tesseract is optimized for clean printed type; faint handwriting or distorted skew may produce incomplete words.',
      },
    ],
    relatedLandingSlugs: ['pdf-to-word', 'pdf-to-excel', 'compress-pdf'],
    relatedGuideSlugs: ['how-to-ocr-scanned-pdfs-locally', 'how-to-convert-pdf-to-word-or-excel-locally'],
  },

  {
    subToolId: 'interactive-pdf-editor',
    primarySlug: 'edit-pdf',
    primaryPath: '/tools/edit-pdf',
    aliases: ['edit-pdf', 'pdf-editor', 'interactive-pdf-editor'],
    primaryKeyword: 'interactive pdf editor online free',
    h1: 'Interactive Visual PDF Editor Online Free',
    seoTitle: 'Edit PDF Online Free – Interactive Editor | FreeTools Hub',
    seoDescription:
      'Add text boxes, visual stamps, images, watermarks, headers, and annotations directly onto PDF pages on an interactive canvas in your browser.',
    introSummary:
      'Annotate, fill forms, place signature stamps, and adjust text overlays visually on PDF pages with instant local export.',
    whatItDoes:
      'Displays live PDF pages rendered via PDF.js beneath a drag-and-drop annotation canvas and commits positioned overlays cleanly back into a downloadable PDF.',
    howToUse: [
      'Open any PDF document inside the Interactive PDF Editor.',
      'Add text blocks, stamps, images, shapes, or watermarks and drag them onto target spots.',
      'Export the finished annotated PDF straight to your device.',
    ],
    supportedFormats: 'Input: .pdf document · Output: Annotated/stamped .pdf',
    limitations:
      'Works as an additive visual overlay editor; deeply rewriting embedded original font glyphs requires source documents or Word conversion.',
    faqs: [
      {
        q: 'Can I drag text annotations and signatures accurately on multi-page PDFs?',
        a: 'Yes. Navigate between pages, position elements visually on canvas, resize fonts or boxes, and export directly.',
      },
      {
        q: 'Do edits leave FreeTools Hub watermarks?',
        a: 'No. Clean exported PDFs include only the annotations you placed.',
      },
    ],
    relatedLandingSlugs: ['pdf-watermark', 'pdf-page-numbers', 'protect-pdf'],
    relatedGuideSlugs: ['how-to-merge-split-compress-pdf-privately-in-browser'],
  },

  {
    subToolId: 'word-to-pdf',
    primarySlug: 'word-to-pdf',
    primaryPath: '/tools/word-to-pdf',
    aliases: ['word-to-pdf', 'docx-to-pdf'],
    primaryKeyword: 'convert word docx to pdf free',
    h1: 'Convert Word (DOCX) to PDF Online Free',
    seoTitle: 'Word to PDF Converter Free – Local DOCX | FreeTools Hub',
    seoDescription:
      'Convert Microsoft Word (.docx) documents into clean, share-ready PDFs directly inside your browser with zero file uploads.',
    introSummary:
      'Transform DOCX reports, letters, and proposals into universally readable PDF documents right in your web browser.',
    whatItDoes:
      'Parses DOCX structure via Mammoth in browser memory and renders formatted sections cleanly into a printable PDF document.',
    howToUse: [
      'Select or drop your .docx file into the Word to PDF tool.',
      'Review document conversion settings and start local processing.',
      'Download your generated .pdf file instantly.',
    ],
    supportedFormats: 'Input: Microsoft Word .docx · Output: Clean .pdf document',
    limitations:
      'Legacy binary .doc (Word 97–2003) files should be saved as .docx first; complex Word macros or exotic custom fonts render using standard web/PDF fonts.',
    faqs: [
      {
        q: 'Are Word documents uploaded to convert them to PDF?',
        a: 'No. Mammoth parsing and PDF creation stay completely on your local device.',
      },
      {
        q: 'Are .doc files supported or only .docx?',
        a: 'Modern OpenXML .docx files are supported natively; save older .doc files as .docx in Word or LibreOffice before converting.',
      },
    ],
    relatedLandingSlugs: ['pdf-to-word', 'excel-to-pdf', 'compress-pdf'],
    relatedGuideSlugs: ['how-to-convert-pdf-to-word-or-excel-locally'],
  },

  {
    subToolId: 'excel-to-pdf',
    primarySlug: 'excel-to-pdf',
    primaryPath: '/tools/excel-to-pdf',
    aliases: ['excel-to-pdf', 'xlsx-to-pdf'],
    primaryKeyword: 'convert excel xlsx csv to pdf free',
    h1: 'Convert Excel (XLSX / CSV) to PDF Free',
    seoTitle: 'Excel to PDF Converter Free – Local XLSX | FreeTools Hub',
    seoDescription:
      'Convert Excel (.xlsx, .xls) and CSV spreadsheets into clean tabular PDF reports locally inside your browser without uploading sensitive sheets.',
    introSummary:
      'Turn budget spreadsheets, price lists, and CSV exports into clean formatted PDF tables right on your device.',
    whatItDoes:
      'Parses worksheet rows and columns via SheetJS and formats tidy PDF tables with readable headers in browser memory.',
    howToUse: [
      'Upload an .xlsx, .xls, or .csv spreadsheet.',
      'Configure output options if desired and click Convert.',
      'Download your formatted tabular PDF document.',
    ],
    supportedFormats: 'Input: .xlsx, .xls, .csv spreadsheets · Output: Tabular .pdf report',
    limitations:
      'Very wide spreadsheets with 15+ columns may wrap or scale tighter on portrait pages; simplify columns before exporting for crispest readability.',
    faqs: [
      {
        q: 'Can I convert sensitive company financials safely?',
        a: 'Yes. Spreadsheets never leave your browser session.',
      },
      {
        q: 'Does it work with CSV exports too?',
        a: 'Yes, both Excel workbooks (.xlsx) and comma-separated (.csv) files convert cleanly.',
      },
    ],
    relatedLandingSlugs: ['pdf-to-excel', 'word-to-pdf', 'merge-pdf'],
    relatedGuideSlugs: ['how-to-convert-pdf-to-word-or-excel-locally'],
  },

  {
    subToolId: 'add-watermark',
    primarySlug: 'pdf-watermark',
    primaryPath: '/tools/pdf-watermark',
    aliases: ['pdf-watermark', 'add-watermark'],
    primaryKeyword: 'add watermark to pdf free browser',
    h1: 'Add Custom Text Watermark to PDF Free',
    seoTitle: 'Add Watermark to PDF Free – Browser Tool | FreeTools Hub',
    seoDescription:
      'Stamp DRAFT, CONFIDENTIAL, or custom diagonal text watermarks across PDF pages cleanly with adjustable opacity and zero file uploads.',
    introSummary:
      'Protect drafts and shared proposals by stamping customizable diagonal or centered text watermarks across every page locally.',
    whatItDoes:
      'Draws semi-transparent vector text overlays across PDF pages with configurable wording, font size, angle, and opacity using pdf-lib.',
    howToUse: [
      'Upload the PDF file you want to brand or mark.',
      'Enter custom watermark wording (e.g., CONFIDENTIAL) and pick opacity/angle.',
      'Apply watermark and download the updated PDF immediately.',
    ],
    supportedFormats: 'Input: .pdf document · Output: Watermarked .pdf',
    limitations:
      'Watermarks overlay page content cleanly; for permanent read-only tamper resistance, combine watermarking with PDF password protection.',
    faqs: [
      {
        q: 'Can I adjust diagonal angle and opacity?',
        a: 'Yes. Set custom text, transparency, and placement so underlying text stays legible.',
      },
      {
        q: 'Does this remove original document formatting?',
        a: 'No. Original text and pages remain intact beneath your watermark layer.',
      },
    ],
    relatedLandingSlugs: ['pdf-page-numbers', 'protect-pdf', 'edit-pdf'],
    relatedGuideSlugs: ['how-to-protect-and-unlock-pdfs-safely'],
  },

  {
    subToolId: 'add-page-numbers',
    primarySlug: 'pdf-page-numbers',
    primaryPath: '/tools/pdf-page-numbers',
    aliases: ['pdf-page-numbers', 'add-page-numbers'],
    primaryKeyword: 'add page numbers to pdf online free',
    h1: 'Add Page Numbers to PDF Online Free',
    seoTitle: 'Add Page Numbers to PDF Free – Browser | FreeTools Hub',
    seoDescription:
      'Insert clean header or footer page numbers across merged PDFs, reports, and court submissions locally with custom position and format.',
    introSummary:
      'Number every page of merged dossiers, manuals, or legal exhibits ("Page 1 of N") cleanly inside your browser.',
    whatItDoes:
      'Stamps crisp vector pagination labels across all or selected pages using pdf-lib in browser memory.',
    howToUse: [
      'Upload your PDF document into Add Page Numbers.',
      'Pick footer/header placement, starting number, and numbering style.',
      'Download the paginated PDF instantly.',
    ],
    supportedFormats: 'Input: .pdf document · Output: Paginated .pdf',
    limitations:
      'Existing decorative borders close to page edges may overlap if margin offsets are tight.',
    faqs: [
      {
        q: 'Useful after merging multiple PDFs together?',
        a: 'Yes—adding uniform sequential page numbers right after Merge PDF makes multi-source binders easy to navigate.',
      },
      {
        q: 'Can I choose "Page X of Y" or numeric-only labels?',
        a: 'Yes. Customize number formatting and margin placement cleanly before saving.',
      },
    ],
    relatedLandingSlugs: ['merge-pdf', 'pdf-watermark', 'edit-pdf'],
    relatedGuideSlugs: ['how-to-merge-split-compress-pdf-privately-in-browser'],
  },
];

export const PDF_LANDING_BY_SLUG = new Map<string, PdfLandingRouteConfig>(
  PDF_LANDING_ROUTES.flatMap((route) =>
    route.aliases.map((alias) => [alias.toLowerCase(), route] as const)
  )
);

export const PDF_LANDING_BY_PRIMARY_SLUG = new Map<string, PdfLandingRouteConfig>(
  PDF_LANDING_ROUTES.map((route) => [route.primarySlug.toLowerCase(), route] as const)
);

export function findPdfLandingRoute(slugOrPath: string): PdfLandingRouteConfig | null {
  const clean = slugOrPath.toLowerCase().replace(/^\/?tools\/?/, '').replace(/^\//, '').replace(/\/+$/, '');
  return PDF_LANDING_BY_SLUG.get(clean) || null;
}
