import { SeoAnalysisResult } from './seoAnalysisTypes';

export type ChecklistSeverity = 'critical' | 'warning' | 'passed';
export type ChecklistCategory = 'basics' | 'indexing' | 'content' | 'social' | 'technical';

export interface SeoChecklistItem {
  id: string;
  name: string;
  elementTag: string;
  category: ChecklistCategory;
  categoryLabel: string;
  categoryLabelUrdu: string;
  severity: ChecklistSeverity;
  isMissing: boolean;
  isCritical: boolean;
  currentValue: string | null;
  statusMessage: string;
  statusMessageUrdu: string;
  seoImpact: string;
  seoImpactUrdu: string;
  recommendation: string;
  recommendationUrdu: string;
  fixSnippet?: string;
}

export interface SeoChecklistSummary {
  totalItems: number;
  passedCount: number;
  missingCount: number;
  warningCount: number;
  criticalMissingCount: number;
  healthScore: number; // 0-100 percentage
  items: SeoChecklistItem[];
  missingCriticalList: string[]; // e.g. ["Meta Description", "Primary H1 Tag", "Canonical URL"]
}

/**
 * Computes an exhaustive critical SEO element checklist from analysis result.
 */
export function computeSeoChecklist(result: SeoAnalysisResult): SeoChecklistSummary {
  const items: SeoChecklistItem[] = [];

  const targetUrl = result.finalUrl || result.url || 'https://example.com';
  let targetDomain = 'example.com';
  try {
    targetDomain = new URL(targetUrl).hostname;
  } catch {
    targetDomain = 'example.com';
  }

  // 1. Meta Description
  const metaDesc = result.meta.description;
  const descContent = metaDesc.content?.trim() || '';
  const descLen = descContent.length;
  if (!descContent) {
    items.push({
      id: 'meta-description',
      name: 'Meta Description Tag',
      elementTag: '<meta name="description">',
      category: 'basics',
      categoryLabel: 'Core Meta',
      categoryLabelUrdu: 'بنیادی میٹا ٹیگز',
      severity: 'critical',
      isMissing: true,
      isCritical: true,
      currentValue: null,
      statusMessage: 'Missing <meta name="description"> tag in page <head>',
      statusMessageUrdu: 'صفحے کے <head> میں میٹا ڈسکرپشن غائب ہے',
      seoImpact: 'Search engines will automatically extract arbitrary text snippets from page content, reducing organic click-through rate (CTR).',
      seoImpactUrdu: 'سرچ انجن صفحے سے خودکار عبارت اٹھائیں گے، جس سے کلک ریٹ (CTR) کم ہو جاتا ہے۔',
      recommendation: 'Add a concise, compelling 120–160 character description summarizing the page value and including primary target keywords.',
      recommendationUrdu: '120 سے 160 حروف پر مشتمل ایک جامع اور پرکشش تفصیل شامل کریں جس میں اہم کی ورڈز شامل ہوں۔',
      fixSnippet: `<meta name="description" content="Discover the best services and solutions from ${targetDomain}. Learn more about our comprehensive features and get started today." />`,
    });
  } else if (descLen < 70) {
    items.push({
      id: 'meta-description',
      name: 'Meta Description Tag',
      elementTag: '<meta name="description">',
      category: 'basics',
      categoryLabel: 'Core Meta',
      categoryLabelUrdu: 'بنیادی میٹا ٹیگز',
      severity: 'warning',
      isMissing: false,
      isCritical: true,
      currentValue: descContent,
      statusMessage: `Too short (${descLen} characters). Recommended: 120–160 characters.`,
      statusMessageUrdu: `بہت مختصر ہے (${descLen} حروف)۔ تجویز کردہ: 120 سے 160 حروف۔`,
      seoImpact: 'Short descriptions miss opportunities to incorporate search intent keywords and convey page value to searchers.',
      seoImpactUrdu: 'مختصر تفصیلات میں مطلوبہ کی ورڈز اور مکمل معلومات شامل نہیں ہو پاتی۔',
      recommendation: 'Expand to 120–160 characters to maximize SERP visual snippet real estate.',
      recommendationUrdu: 'تفصیل کو 120 سے 160 حروف تک وسعت دیں تاکہ گوگل کے نتائج میں بہتر نظر آئے۔',
      fixSnippet: `<meta name="description" content="${descContent} Learn more about our detailed features, pricing, and how to get started today." />`,
    });
  } else if (descLen > 165) {
    items.push({
      id: 'meta-description',
      name: 'Meta Description Tag',
      elementTag: '<meta name="description">',
      category: 'basics',
      categoryLabel: 'Core Meta',
      categoryLabelUrdu: 'بنیادی میٹا ٹیگز',
      severity: 'warning',
      isMissing: false,
      isCritical: true,
      currentValue: descContent,
      statusMessage: `Too long (${descLen} characters). Search engines will truncate at ~160 chars.`,
      statusMessageUrdu: `بہت طویل ہے (${descLen} حروف)۔ سرچ انجن اسے 160 حروف کے بعد کاٹ دیں گے۔`,
      seoImpact: 'Truncated descriptions end abruptly with an ellipsis (...), cutting off key calls to action.',
      seoImpactUrdu: 'طویل تفصیل سرچ نتائج میں کٹ جاتی ہے اور آخری اہم بات غائب ہو جاتی ہے۔',
      recommendation: 'Trim to under 160 characters while keeping crucial keywords in the first 120 characters.',
      recommendationUrdu: 'تفصیل کو 160 حروف سے کم رکھیں اور اہم الفاظ شروع میں رکھیں۔',
      fixSnippet: `<meta name="description" content="${descContent.slice(0, 155)}..." />`,
    });
  } else {
    items.push({
      id: 'meta-description',
      name: 'Meta Description Tag',
      elementTag: '<meta name="description">',
      category: 'basics',
      categoryLabel: 'Core Meta',
      categoryLabelUrdu: 'بنیادی میٹا ٹیگز',
      severity: 'passed',
      isMissing: false,
      isCritical: true,
      currentValue: descContent,
      statusMessage: `Optimal length (${descLen} characters)`,
      statusMessageUrdu: `بہترین لمبائی (${descLen} حروف)`,
      seoImpact: 'Well-sized description that provides clear context to both search engines and users.',
      seoImpactUrdu: 'متوازن لمبائی جو سرچ انجن اور صارفین دونوں کے لیے موزوں ہے۔',
      recommendation: 'Maintain relevant keywords and keep fresh as page content updates.',
      recommendationUrdu: 'صفحے کے مواد کے ساتھ ساتھ تفصیل کو بھی اپ ڈیٹ رکھیں۔',
      fixSnippet: `<meta name="description" content="${descContent}" />`,
    });
  }

  // 2. Primary H1 Tag
  const h1Count = result.headings.h1Count;
  const h1List = result.headings.h1List;
  if (h1Count === 0) {
    items.push({
      id: 'h1-heading',
      name: 'Primary H1 Tag',
      elementTag: '<h1>',
      category: 'content',
      categoryLabel: 'Content Structure',
      categoryLabelUrdu: 'مواد کی ساخت',
      severity: result.isClientRenderedSpa ? 'warning' : 'critical',
      isMissing: true,
      isCritical: !result.isClientRenderedSpa,
      currentValue: null,
      statusMessage: result.isClientRenderedSpa
        ? 'No <h1> in initial HTML shell (Client-Side SPA)'
        : 'No <h1> heading tag found in page HTML',
      statusMessageUrdu: result.isClientRenderedSpa
        ? 'ابتدائی ایچ ٹی ایم ایل میں H1 نہیں ملا (کلائنٹ ایس پی اے)'
        : 'صفحے کے کوڈ میں کوئی <h1> ٹیگ نہیں ملا',
      seoImpact: result.isClientRenderedSpa
        ? 'Non-JavaScript crawlers and basic scrapers will not see an H1 heading because it is rendered client-side by JavaScript.'
        : 'Search engine crawlers rely heavily on the primary H1 to establish the core topical relevance of the document.',
      seoImpactUrdu: 'گوگل کرالر صفحے کے بنیادی موضوع کو سمجھنے کے لیے H1 پر بہت زیادہ انحصار کرتے ہیں۔',
      recommendation: result.isClientRenderedSpa
        ? 'Implement Static Prerendering (SSG) or Server-Side Rendering (SSR) so the primary <h1> is present in initial HTML for all crawlers.'
        : 'Add exactly one semantic <h1> element prominently near the top of the main body content.',
      recommendationUrdu: 'صفحے کے شروع میں ایک واضح اور معنی خیز <h1> ٹیگ لازماً شامل کریں۔',
      fixSnippet: `<h1>${result.meta.title.content?.split(/[-|–]/)[0]?.trim() || 'Your Primary Page Title Here'}</h1>`,
    });
  } else if (h1Count > 1) {
    items.push({
      id: 'h1-heading',
      name: 'Primary H1 Tag',
      elementTag: '<h1>',
      category: 'content',
      categoryLabel: 'Content Structure',
      categoryLabelUrdu: 'مواد کی ساخت',
      severity: 'warning',
      isMissing: false,
      isCritical: true,
      currentValue: `${h1Count} tags found: "${h1List.slice(0, 2).join('", "')}"...`,
      statusMessage: `Multiple <h1> tags found (${h1Count} instances)`,
      statusMessageUrdu: `ایک سے زائد <h1> ٹیگز موجود ہیں (${h1Count} ٹیگز)`,
      seoImpact: 'Multiple H1 tags dilute topical focus and confuse search bots as to which statement represents the primary subject.',
      seoImpactUrdu: 'ایک سے زیادہ H1 ٹیگز صفحے کے مرکزی موضوع کی اہمیت کو تقسیم کر دیتے ہیں۔',
      recommendation: 'Keep only one primary <h1> tag for the main title, and convert subsequent section headings into <h2> or <h3> elements.',
      recommendationUrdu: 'صرف ایک مرکزی <h1> رکھیں اور باقی ذیلی عنوانات کو <h2> یا <h3> میں تبدیل کریں۔',
      fixSnippet: `<!-- Keep primary title as <h1> -->\n<h1>${h1List[0] || 'Main Page Title'}</h1>\n\n<!-- Downgrade secondary headings to <h2> -->\n<h2>${h1List[1] || 'Secondary Section Heading'}</h2>`,
    });
  } else {
    items.push({
      id: 'h1-heading',
      name: 'Primary H1 Tag',
      elementTag: '<h1>',
      category: 'content',
      categoryLabel: 'Content Structure',
      categoryLabelUrdu: 'مواد کی ساخت',
      severity: 'passed',
      isMissing: false,
      isCritical: true,
      currentValue: h1List[0] || '',
      statusMessage: `Exactly 1 well-defined <h1> tag present`,
      statusMessageUrdu: `ایک باقاعدہ <h1> ٹیگ موجود ہے`,
      seoImpact: 'Semantic outline is crystal clear for assistive technologies and web crawlers.',
      seoImpactUrdu: 'سرچ بوٹس اور اسکرین ریڈرز کے لیے صفحے کا ڈھانچہ بالکل واضح ہے۔',
      recommendation: 'Ensure your primary target keyword is included naturally near the beginning of the H1.',
      recommendationUrdu: 'یقینی بنائیں کہ بنیادی کی ورڈ H1 کے شروع میں قدرتی انداز میں موجود ہو۔',
      fixSnippet: `<h1>${h1List[0] || ''}</h1>`,
    });
  }

  // 3. Canonical URL
  const canonical = result.meta.canonical;
  const canonicalUrl = canonical.content?.trim() || '';
  if (!canonicalUrl) {
    items.push({
      id: 'canonical-url',
      name: 'Canonical URL Tag',
      elementTag: '<link rel="canonical">',
      category: 'indexing',
      categoryLabel: 'Indexing & URLs',
      categoryLabelUrdu: 'انڈیکسنگ اور لنکس',
      severity: 'critical',
      isMissing: true,
      isCritical: true,
      currentValue: null,
      statusMessage: 'Missing <link rel="canonical"> tag',
      statusMessageUrdu: 'کینونیکل یو آر ایل (<link rel="canonical">) غائب ہے',
      seoImpact: 'Without a canonical link, URL parameter variants (tracking query strings, UTM tags, trailing slashes, HTTP/HTTPS) create duplicate content penalties in Google.',
      seoImpactUrdu: 'کینونیکل ٹیگ نہ ہونے سے یو آر ایل کی تبدیلیاں (ٹریکنگ پیرامیٹرز، سلیش وغیرہ) ڈپلیکیٹ مواد کا مسئلہ پیدا کرتی ہیں۔',
      recommendation: 'Specify the self-referencing absolute authoritative URL using <link rel="canonical"> in <head>.',
      recommendationUrdu: 'صفحے کے <head> میں مستند اور مکمل یو آر ایل کے ساتھ کینونیکل ٹیگ لازماً لگائیں۔',
      fixSnippet: `<link rel="canonical" href="${targetUrl}" />`,
    });
  } else if (!canonicalUrl.startsWith('http://') && !canonicalUrl.startsWith('https://')) {
    items.push({
      id: 'canonical-url',
      name: 'Canonical URL Tag',
      elementTag: '<link rel="canonical">',
      category: 'indexing',
      categoryLabel: 'Indexing & URLs',
      categoryLabelUrdu: 'انڈیکسنگ اور لنکس',
      severity: 'warning',
      isMissing: false,
      isCritical: true,
      currentValue: canonicalUrl,
      statusMessage: 'Canonical URL is relative instead of an absolute URL',
      statusMessageUrdu: 'کینونیکل یو آر ایل مکمل نہیں ہے (ریلیٹیو پاتھ ہے)',
      seoImpact: 'Google strongly recommends absolute URLs for canonical tags to prevent domain resolution ambiguities.',
      seoImpactUrdu: 'گوگل مکمل یو آر ایل کی سختی سے ہدایت کرتا ہے تاکہ کوئی ابہام باقی نہ رہے۔',
      recommendation: 'Convert relative canonical link into a full absolute URL including protocol and domain.',
      recommendationUrdu: 'کینونیکل لنک کو ڈومین اور پروٹوکول کے ساتھ مکمل یو آر ایل بنائیں۔',
      fixSnippet: `<link rel="canonical" href="${targetUrl}" />`,
    });
  } else {
    items.push({
      id: 'canonical-url',
      name: 'Canonical URL Tag',
      elementTag: '<link rel="canonical">',
      category: 'indexing',
      categoryLabel: 'Indexing & URLs',
      categoryLabelUrdu: 'انڈیکسنگ اور لنکس',
      severity: 'passed',
      isMissing: false,
      isCritical: true,
      currentValue: canonicalUrl,
      statusMessage: `Valid absolute canonical declared (${canonicalUrl})`,
      statusMessageUrdu: `درست اور مکمل کینونیکل لنک موجود ہے`,
      seoImpact: 'Protects ranking signals and consolidates link equity to this authoritative URL.',
      seoImpactUrdu: 'ڈپلیکیٹ مواد سے بچاؤ اور لنک کی ساکھ کو محفوظ رکھتا ہے۔',
      recommendation: 'Ensure all internal links point to this canonical URL format.',
      recommendationUrdu: 'یقینی بنائیں کہ تمام اندرونی لنکس اسی فارمیٹ کو استعمال کرتے ہیں۔',
      fixSnippet: `<link rel="canonical" href="${canonicalUrl}" />`,
    });
  }

  // 4. Title Tag
  const pageTitle = result.meta.title.content?.trim() || '';
  const titleLen = pageTitle.length;
  if (!pageTitle) {
    items.push({
      id: 'title-tag',
      name: 'HTML Document Title',
      elementTag: '<title>',
      category: 'basics',
      categoryLabel: 'Core Meta',
      categoryLabelUrdu: 'بنیادی میٹا ٹیگز',
      severity: 'critical',
      isMissing: true,
      isCritical: true,
      currentValue: null,
      statusMessage: 'Missing or empty <title> tag in <head>',
      statusMessageUrdu: 'صفحے کے <head> میں عنوان (<title>) غائب ہے',
      seoImpact: 'The title tag is the single most important on-page HTML ranking factor. Missing title causes severe ranking penalties and blank SERP snippets.',
      seoImpactUrdu: 'ٹائٹل ٹیگ آن پیج ایس ای او کا سب سے اہم عنصر ہے۔ اس کے بغیر گوگل پر رینکنگ ناممکن ہے۔',
      recommendation: 'Add a targeted title between 40–60 characters specifying the page topic and brand name.',
      recommendationUrdu: '40 سے 60 حروف کا ایک خوبصورت عنوان شامل کریں جس میں صفحے کا مقصد اور برانڈ کا نام ہو۔',
      fixSnippet: `<title>${result.headings.h1List[0] || 'Descriptive Page Title'} | ${targetDomain}</title>`,
    });
  } else if (titleLen < 30) {
    items.push({
      id: 'title-tag',
      name: 'HTML Document Title',
      elementTag: '<title>',
      category: 'basics',
      categoryLabel: 'Core Meta',
      categoryLabelUrdu: 'بنیادی میٹا ٹیگز',
      severity: 'warning',
      isMissing: false,
      isCritical: true,
      currentValue: pageTitle,
      statusMessage: `Title too short (${titleLen} chars). Recommended: 40–60 characters.`,
      statusMessageUrdu: `عنوان بہت مختصر ہے (${titleLen} حروف)۔ تجویز کردہ: 40 سے 60 حروف۔`,
      seoImpact: 'Short titles underutilize valuable search keyword real estate.',
      seoImpactUrdu: 'مختصر عنوان میں مطلوبہ کی ورڈز ضائع ہو جاتے ہیں۔',
      recommendation: 'Expand with primary keyword and brand name modifier.',
      recommendationUrdu: 'عنوان میں بنیادی کی ورڈ اور برانڈ کا نام شامل کریں۔',
      fixSnippet: `<title>${pageTitle} - Comprehensive Guide & Tools | ${targetDomain}</title>`,
    });
  } else if (titleLen > 65) {
    items.push({
      id: 'title-tag',
      name: 'HTML Document Title',
      elementTag: '<title>',
      category: 'basics',
      categoryLabel: 'Core Meta',
      categoryLabelUrdu: 'بنیادی میٹا ٹیگز',
      severity: 'warning',
      isMissing: false,
      isCritical: true,
      currentValue: pageTitle,
      statusMessage: `Title too long (${titleLen} chars). Google cuts off titles above ~60 chars.`,
      statusMessageUrdu: `عنوان طویل ہے (${titleLen} حروف)۔ گوگل 60 حروف کے بعد عنوان کاٹ دیتا ہے۔`,
      seoImpact: 'Searchers will see an truncated title with an ellipsis, potentially hiding your brand.',
      seoImpactUrdu: 'سرچ نتائج میں عنوان کا اختتام کٹ جائے گا جس سے برانڈ چھپ سکتا ہے۔',
      recommendation: 'Condense title to under 60 characters with primary keywords first.',
      recommendationUrdu: 'عنوان کو 60 حروف کے اندر رکھیں اور اہم الفاظ شروع میں لائیں۔',
      fixSnippet: `<title>${pageTitle.slice(0, 58)}...</title>`,
    });
  } else {
    items.push({
      id: 'title-tag',
      name: 'HTML Document Title',
      elementTag: '<title>',
      category: 'basics',
      categoryLabel: 'Core Meta',
      categoryLabelUrdu: 'بنیادی میٹا ٹیگز',
      severity: 'passed',
      isMissing: false,
      isCritical: true,
      currentValue: pageTitle,
      statusMessage: `Optimal title length (${titleLen} characters)`,
      statusMessageUrdu: `عنوان کی بہترین لمبائی (${titleLen} حروف)`,
      seoImpact: 'Fits perfectly within desktop and mobile SERP pixel width constraints without truncation.',
      seoImpactUrdu: 'کمپیوٹر اور موبائل دونوں اسکرینوں پر بغیر کٹے پورا نظر آئے گا۔',
      recommendation: 'Maintain primary keyword alignment with search intent.',
      recommendationUrdu: 'عنوان کو سرچ کی ورڈ کے مطابق رکھیں۔',
      fixSnippet: `<title>${pageTitle}</title>`,
    });
  }

  // 5. Mobile Viewport Meta Tag
  const viewport = result.meta.viewport;
  const viewportContent = viewport.content?.trim() || '';
  if (!viewportContent) {
    items.push({
      id: 'viewport-meta',
      name: 'Mobile Viewport Meta Tag',
      elementTag: '<meta name="viewport">',
      category: 'technical',
      categoryLabel: 'Mobile & Technical',
      categoryLabelUrdu: 'موبائل اور تکنیکی',
      severity: 'critical',
      isMissing: true,
      isCritical: true,
      currentValue: null,
      statusMessage: 'Missing <meta name="viewport"> tag',
      statusMessageUrdu: 'موبائل ویو پورٹ ٹیگ غائب ہے',
      seoImpact: 'Fails Google Mobile-Friendly test. Mobile devices will display desktop layout zoomed out, drastically lowering mobile search rankings.',
      seoImpactUrdu: 'موبائل فرینڈلی ٹیسٹ میں ناکامی؛ موبائل سرچ میں رینکنگ گر جاتی ہے۔',
      recommendation: 'Include standard responsive viewport tag in HTML <head>.',
      recommendationUrdu: 'صفحے کے <head> میں معیاری رسپانسیو ویو پورٹ ٹیگ شامل کریں۔',
      fixSnippet: '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    });
  } else {
    items.push({
      id: 'viewport-meta',
      name: 'Mobile Viewport Meta Tag',
      elementTag: '<meta name="viewport">',
      category: 'technical',
      categoryLabel: 'Mobile & Technical',
      categoryLabelUrdu: 'موبائل اور تکنیکی',
      severity: 'passed',
      isMissing: false,
      isCritical: true,
      currentValue: viewportContent,
      statusMessage: `Configured: "${viewportContent}"`,
      statusMessageUrdu: `درست موبائل کنفیگریشن: "${viewportContent}"`,
      seoImpact: 'Enables mobile-first responsiveness and passes Google mobile search validation.',
      seoImpactUrdu: 'موبائل فرینڈلی انڈیکسنگ کے لیے مکمل طور پر تیار ہے۔',
      recommendation: 'Ensure touch targets and font sizes remain legible on small screens.',
      recommendationUrdu: 'چھوٹی اسکرین پر فونٹس اور بٹنز کو واضح رکھیں۔',
      fixSnippet: `<meta name="viewport" content="${viewportContent}" />`,
    });
  }

  // 6. Robots Meta Tag & Indexability
  const robots = result.meta.robots;
  if (robots.isNoIndex) {
    items.push({
      id: 'robots-meta',
      name: 'Search Indexability (Robots)',
      elementTag: '<meta name="robots">',
      category: 'indexing',
      categoryLabel: 'Indexing & URLs',
      categoryLabelUrdu: 'انڈیکسنگ اور لنکس',
      severity: 'critical',
      isMissing: false,
      isCritical: true,
      currentValue: robots.content || 'noindex',
      statusMessage: 'CRITICAL: Page contains "noindex" blocking search engine inclusion!',
      statusMessageUrdu: 'انتہائی اہم: صفحہ "noindex" پر مشتمل ہے جو سرچ انجن میں شمولیت کو روکتا ہے!',
      seoImpact: 'Google, Bing, and other search engines will remove this page from search results completely.',
      seoImpactUrdu: 'گوگل اور دیگر سرچ انجن اس صفحے کو اپنے نتائج سے مکمل طور پر نکال دیں گے۔',
      recommendation: 'Remove "noindex" directive from robots meta tag to restore search engine crawling and indexing.',
      recommendationUrdu: 'اگر یہ عوامی صفحہ ہے تو فوری طور پر noindex کو ہٹا دیں۔',
      fixSnippet: '<meta name="robots" content="index, follow" />',
    });
  } else {
    items.push({
      id: 'robots-meta',
      name: 'Search Indexability (Robots)',
      elementTag: '<meta name="robots">',
      category: 'indexing',
      categoryLabel: 'Indexing & URLs',
      categoryLabelUrdu: 'انڈیکسنگ اور لنکس',
      severity: 'passed',
      isMissing: false,
      isCritical: true,
      currentValue: robots.content || 'index, follow (default)',
      statusMessage: 'Page allows indexing and following (index, follow)',
      statusMessageUrdu: 'صفحہ سرچ انجن میں انڈیکس ہونے کے لیے کھلا ہے',
      seoImpact: 'Search engine bots are permitted to index page content and follow internal hyperlinks.',
      seoImpactUrdu: 'سرچ انجنز کو صفحہ محفوظ کرنے اور لنکس کو فالو کرنے کی مکمل اجازت ہے۔',
      recommendation: 'Verify in Google Search Console that no disallow rules in robots.txt block this path.',
      recommendationUrdu: 'گوگل سرچ کنسول میں تسلی کر لیں کہ robots.txt میں کوئی رکاوٹ تو نہیں۔',
      fixSnippet: '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />',
    });
  }

  // 7. Image Alt Attributes
  const images = result.performance.images;
  if (images.total > 0 && images.missingAltCount > 0) {
    items.push({
      id: 'image-alt-tags',
      name: 'Image Alt Attributes',
      elementTag: '<img alt="...">',
      category: 'content',
      categoryLabel: 'Content Structure',
      categoryLabelUrdu: 'مواد کی ساخت',
      severity: 'warning',
      isMissing: true,
      isCritical: true,
      currentValue: `${images.missingAltCount} of ${images.total} images missing alt text`,
      statusMessage: `${images.missingAltCount} image${images.missingAltCount > 1 ? 's' : ''} missing alt descriptive attributes`,
      statusMessageUrdu: `${images.missingAltCount} تصاویر میں alt کی تفصیل غائب ہے`,
      seoImpact: 'Damages accessibility for visually impaired users and reduces visibility in Google Image Search.',
      seoImpactUrdu: 'بصارت سے محروم افراد کے لیے دشواری اور گوگل امیج سرچ میں رینکنگ میں کمی۔',
      recommendation: 'Add descriptive, concise alt attributes explaining each image context with relevant terms.',
      recommendationUrdu: 'ہر تصویر میں اس کے مواد کے متعلق وضاحتی alt ٹیکسٹ شامل کریں۔',
      fixSnippet: '<!-- Add descriptive alt text to all <img> tags -->\n<img src="/photo.jpg" alt="Descriptive caption describing this image" width="800" height="600" loading="lazy" />',
    });
  } else {
    items.push({
      id: 'image-alt-tags',
      name: 'Image Alt Attributes',
      elementTag: '<img alt="...">',
      category: 'content',
      categoryLabel: 'Content Structure',
      categoryLabelUrdu: 'مواد کی ساخت',
      severity: 'passed',
      isMissing: false,
      isCritical: false,
      currentValue: images.total > 0 ? `All ${images.total} images have alt tags` : 'No images on page',
      statusMessage: images.total > 0 ? `All ${images.total} images have descriptive alt text` : 'Clean image accessibility',
      statusMessageUrdu: images.total > 0 ? `تمام ${images.total} تصاویر میں alt ٹیگز موجود ہیں` : 'امیج ایکسیسبلٹی درست ہے',
      seoImpact: 'Excellent for screen readers and rich Google Image Search indexing.',
      seoImpactUrdu: 'اسکرین ریڈرز اور گوگل امیج سرچ کے لیے بہترین۔',
      recommendation: 'Keep future uploaded image alt attributes descriptive and meaningful.',
      recommendationUrdu: 'مستقبل کی تصاویر میں بھی بامقصد alt شامل رکھیں۔',
      fixSnippet: '<img src="/banner.jpg" alt="Clear descriptive text" />',
    });
  }

  // 8. Open Graph Protocol (og:title, og:image, og:url, og:description)
  const og = result.meta.openGraph;
  if (og.presentCount === 0) {
    items.push({
      id: 'opengraph-tags',
      name: 'Open Graph Social Meta Tags',
      elementTag: '<meta property="og:*">',
      category: 'social',
      categoryLabel: 'Social & Sharing',
      categoryLabelUrdu: 'سوشل میڈیا اور شیئرنگ',
      severity: 'warning',
      isMissing: true,
      isCritical: false,
      currentValue: null,
      statusMessage: 'Missing all Open Graph tags (og:title, og:description, og:image, og:url)',
      statusMessageUrdu: 'اوپن گراف سوشل ٹیگز مکمل طور پر غائب ہیں',
      seoImpact: 'When shared on Facebook, LinkedIn, WhatsApp, or Slack, links will look unappealing without preview banners or headlines.',
      seoImpactUrdu: 'واٹس ایپ، فیس بک اور لنکڈ اِن پر شیئر کرنے پر بغیر تصویر اور بے رونق لنک نظر آئے گا۔',
      recommendation: 'Add the 4 core OpenGraph tags to ensure rich interactive preview cards across social networks.',
      recommendationUrdu: 'چار بنیادی اوپن گراف ٹیگز شامل کریں تاکہ سوشل میڈیا پر خوبصورت کارڈز بنیں۔',
      fixSnippet: `<meta property="og:type" content="website" />\n<meta property="og:url" content="${targetUrl}" />\n<meta property="og:title" content="${pageTitle || 'Page Title'}" />\n<meta property="og:description" content="${descContent || 'Discover more on our website.'}" />\n<meta property="og:image" content="${targetUrl}/og-image.jpg" />`,
    });
  } else if (og.missingTags.length > 0) {
    items.push({
      id: 'opengraph-tags',
      name: 'Open Graph Social Meta Tags',
      elementTag: '<meta property="og:*">',
      category: 'social',
      categoryLabel: 'Social & Sharing',
      categoryLabelUrdu: 'سوشل میڈیا اور شیئرنگ',
      severity: 'warning',
      isMissing: true,
      isCritical: false,
      currentValue: `${og.presentCount} present, missing: ${og.missingTags.join(', ')}`,
      statusMessage: `Incomplete Open Graph: Missing ${og.missingTags.join(', ')}`,
      statusMessageUrdu: `نامکمل اوپن گراف ٹیگز: ${og.missingTags.join(', ')} غائب ہیں`,
      seoImpact: 'Missing og:image or og:title causes inconsistent fallback rendering across different social platforms.',
      seoImpactUrdu: 'تصویر یا عنوان کی کمی سے مختلف ایپس میں لنک نامکمل نظر آتا ہے۔',
      recommendation: `Provide the missing tags (${og.missingTags.join(', ')}) with recommended 1200x630px image.`,
      recommendationUrdu: `غائب شدہ ٹیگز (${og.missingTags.join(', ')}) کو 1200x630 پکسل تصویر کے ساتھ شامل کریں۔`,
      fixSnippet: og.missingTags.map((tag) => `<meta property="${tag}" content="${tag.includes('image') ? `${targetUrl}/og-image.jpg` : tag.includes('title') ? pageTitle : descContent}" />`).join('\n'),
    });
  } else {
    items.push({
      id: 'opengraph-tags',
      name: 'Open Graph Social Meta Tags',
      elementTag: '<meta property="og:*">',
      category: 'social',
      categoryLabel: 'Social & Sharing',
      categoryLabelUrdu: 'سوشل میڈیا اور شیئرنگ',
      severity: 'passed',
      isMissing: false,
      isCritical: false,
      currentValue: `${og.presentCount} tags configured`,
      statusMessage: 'All core Open Graph tags present (og:title, og:description, og:image, og:url)',
      statusMessageUrdu: 'تمام بنیادی اوپن گراف ٹیگز درست موجود ہیں',
      seoImpact: 'Guarantees attractive rich previews when page URL is shared across social messaging platforms.',
      seoImpactUrdu: 'سوشل میڈیا پر شیئر کرنے پر شاندار پریویو کارڈ نظر آئے گا۔',
      recommendation: 'Ensure your og:image dimensions are at least 1200x630px for crisp high-resolution displays.',
      recommendationUrdu: 'یقینی بنائیں کہ اوپن گراف تصویر کم از کم 1200x630 پکسل ہو۔',
      fixSnippet: `<meta property="og:title" content="${og.title || pageTitle}" />\n<meta property="og:image" content="${og.image || ''}" />`,
    });
  }

  // 9. Twitter / X Card Tags
  const tw = result.meta.twitter;
  if (tw.presentCount === 0) {
    items.push({
      id: 'twitter-cards',
      name: 'Twitter / X Card Tags',
      elementTag: '<meta name="twitter:*">',
      category: 'social',
      categoryLabel: 'Social & Sharing',
      categoryLabelUrdu: 'سوشل میڈیا اور شیئرنگ',
      severity: 'warning',
      isMissing: true,
      isCritical: false,
      currentValue: null,
      statusMessage: 'Missing Twitter / X Card meta tags',
      statusMessageUrdu: 'ٹویٹر / ایکس کارڈ ٹیگز غائب ہیں',
      seoImpact: 'Tweets containing your link will show plain URL text without modern large photo card previews.',
      seoImpactUrdu: 'ایکس (ٹویٹر) پر لنک شیئر کرنے پر تصویری کارڈ نہیں بنے گا۔',
      recommendation: 'Add twitter:card (summary_large_image) and title/description tags in <head>.',
      recommendationUrdu: 'ٹویٹر کے لیے summary_large_image کارڈ ٹیگز لگائیں۔',
      fixSnippet: `<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:title" content="${pageTitle || 'Page Title'}" />\n<meta name="twitter:description" content="${descContent || 'Summary of page content'}" />\n<meta name="twitter:image" content="${og.image || `${targetUrl}/og-image.jpg`}" />`,
    });
  } else {
    items.push({
      id: 'twitter-cards',
      name: 'Twitter / X Card Tags',
      elementTag: '<meta name="twitter:*">',
      category: 'social',
      categoryLabel: 'Social & Sharing',
      categoryLabelUrdu: 'سوشل میڈیا اور شیئرنگ',
      severity: 'passed',
      isMissing: false,
      isCritical: false,
      currentValue: `Card type: "${tw.card || 'summary'}"`,
      statusMessage: `Twitter Card configured (${tw.card || 'summary_large_image'})`,
      statusMessageUrdu: `ٹویٹر کارڈ درست کنفیگر ہے (${tw.card || 'summary_large_image'})`,
      seoImpact: 'Displays full visual snippet when shared on X / Twitter platform.',
      seoImpactUrdu: 'ایکس (ٹویٹر) پر مکمل تصویری خلاصہ دکھائے گا۔',
      recommendation: 'Maintain twitter:card="summary_large_image" for maximum visual CTR.',
      recommendationUrdu: 'زیادہ کلکس حاصل کرنے کے لیے بڑے کارڈ فارمیٹ کو برقرار رکھیں۔',
      fixSnippet: `<meta name="twitter:card" content="${tw.card || 'summary_large_image'}" />`,
    });
  }

  // 10. Structured Data (Schema.org JSON-LD)
  const schemas = result.meta.schemas;
  if (schemas.count === 0) {
    items.push({
      id: 'structured-data',
      name: 'Structured Data (Schema.org)',
      elementTag: '<script type="application/ld+json">',
      category: 'technical',
      categoryLabel: 'Mobile & Technical',
      categoryLabelUrdu: 'موبائل اور تکنیکی',
      severity: 'warning',
      isMissing: true,
      isCritical: false,
      currentValue: null,
      statusMessage: 'No Schema.org JSON-LD structured data detected',
      statusMessageUrdu: 'کوئی سٹرکچرڈ ڈیٹا (Schema.org JSON-LD) نہیں ملا',
      seoImpact: 'Disqualifies page from Google rich results such as Star Ratings, FAQ accordions, breadcrumbs, and Knowledge Panels.',
      seoImpactUrdu: 'گوگل کے خصوصی فیچرز (سٹار ریٹنگ، سوال و جواب، بیجز) حاصل کرنے سے محروم۔',
      recommendation: 'Implement WebSite, Organization, Article, or Product JSON-LD schema into your document head.',
      recommendationUrdu: 'صفحے کے مقصد کے مطابق JSON-LD سکیما کوڈ شامل کریں۔',
      fixSnippet: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "WebSite",\n  "name": "${targetDomain}",\n  "url": "${targetUrl}"\n}\n</script>`,
    });
  } else {
    const schemaTypes = schemas.items.map((s) => s.type).join(', ');
    items.push({
      id: 'structured-data',
      name: 'Structured Data (Schema.org)',
      elementTag: '<script type="application/ld+json">',
      category: 'technical',
      categoryLabel: 'Mobile & Technical',
      categoryLabelUrdu: 'موبائل اور تکنیکی',
      severity: 'passed',
      isMissing: false,
      isCritical: false,
      currentValue: `${schemas.count} schema schemas (${schemaTypes})`,
      statusMessage: `${schemas.count} JSON-LD Schema schema${schemas.count > 1 ? 's' : ''} detected`,
      statusMessageUrdu: `${schemas.count} سٹرکچرڈ سکیما ٹیگز موجود ہیں (${schemaTypes})`,
      seoImpact: 'Qualifies page for rich snippet visual enhancements in search engines.',
      seoImpactUrdu: 'گوگل سرچ میں خصوصی کارڈز اور اضافی معلومات کے لیے موزوں۔',
      recommendation: 'Validate with Google Rich Results Test to confirm zero warnings or errors.',
      recommendationUrdu: 'گوگل کے رچ رزلٹس ٹیسٹ ٹول سے تصدیق کر لیں۔',
      fixSnippet: '<!-- Schema.org is successfully active -->',
    });
  }

  // 11. HTML Language Attribute
  const lang = result.meta.lang;
  if (!lang.content) {
    items.push({
      id: 'html-lang',
      name: 'HTML Lang Attribute',
      elementTag: '<html lang="...">',
      category: 'technical',
      categoryLabel: 'Mobile & Technical',
      categoryLabelUrdu: 'موبائل اور تکنیکی',
      severity: 'warning',
      isMissing: true,
      isCritical: false,
      currentValue: null,
      statusMessage: 'Missing lang attribute on root <html> element',
      statusMessageUrdu: 'روٹ <html> ٹیگ میں زبان (lang) کا تعین نہیں ہے',
      seoImpact: 'Search engines and screen readers cannot confidently discern the document natural language.',
      seoImpactUrdu: 'سرچ بوٹس اور اسکرین ریڈرز زبان کے تعین میں مشکل کا شکار ہوتے ہیں۔',
      recommendation: 'Add standard IETF BCP 47 language code (e.g. lang="en" or lang="ur") to the <html> tag.',
      recommendationUrdu: 'روٹ ٹیگ میں اپنی زبان کا کوڈ درج کریں (مثلاً lang="en" یا lang="ur")۔',
      fixSnippet: '<html lang="en">',
    });
  } else {
    items.push({
      id: 'html-lang',
      name: 'HTML Lang Attribute',
      elementTag: '<html lang="...">',
      category: 'technical',
      categoryLabel: 'Mobile & Technical',
      categoryLabelUrdu: 'موبائل اور تکنیکی',
      severity: 'passed',
      isMissing: false,
      isCritical: false,
      currentValue: `lang="${lang.content}"`,
      statusMessage: `Declared as "${lang.content}"`,
      statusMessageUrdu: `زبان کا درست تعین: "${lang.content}"`,
      seoImpact: 'Assists geographic targeting and screen reader pronunciation.',
      seoImpactUrdu: 'بین الاقوامی ایس ای او اور اسکرین ریڈرز کے لیے معاون ہے۔',
      recommendation: 'Ensure hreflang tags match if supporting multiple regional localizations.',
      recommendationUrdu: 'اگر مختلف ممالک کے لیے صفحات ہیں تو hreflang بھی لگائیں۔',
      fixSnippet: `<html lang="${lang.content}">`,
    });
  }

  // 12. Character Encoding (Charset)
  const charset = result.meta.charset;
  if (!charset.content) {
    items.push({
      id: 'charset-meta',
      name: 'Character Encoding Meta',
      elementTag: '<meta charset="utf-8">',
      category: 'technical',
      categoryLabel: 'Mobile & Technical',
      categoryLabelUrdu: 'موبائل اور تکنیکی',
      severity: 'warning',
      isMissing: true,
      isCritical: false,
      currentValue: null,
      statusMessage: 'Missing character encoding declaration in <head>',
      statusMessageUrdu: 'کریکٹر انکوڈنگ (<meta charset>) کی وضاحت غائب ہے',
      seoImpact: 'Browsers may misinterpret special symbols, accented characters, or non-Latin scripts.',
      seoImpactUrdu: 'براؤزر مخصوص حروف اور علامات کو خراب ظاہر کر سکتے ہیں۔',
      recommendation: 'Place <meta charset="UTF-8"> as the very first element in the <head>.',
      recommendationUrdu: '<head> کے بالکل شروع میں <meta charset="UTF-8"> لگائیں۔',
      fixSnippet: '<meta charset="UTF-8" />',
    });
  } else {
    items.push({
      id: 'charset-meta',
      name: 'Character Encoding Meta',
      elementTag: '<meta charset="utf-8">',
      category: 'technical',
      categoryLabel: 'Mobile & Technical',
      categoryLabelUrdu: 'موبائل اور تکنیکی',
      severity: 'passed',
      isMissing: false,
      isCritical: false,
      currentValue: charset.content,
      statusMessage: `Charset defined as "${charset.content}"`,
      statusMessageUrdu: `کریکٹر انکوڈنگ موجود ہے: "${charset.content}"`,
      seoImpact: 'Prevents text garbling and ensures seamless multi-lingual font rendering.',
      seoImpactUrdu: 'تمام زبانوں کے الفاظ کو درست دکھاتا ہے۔',
      recommendation: 'Keep UTF-8 placed in the first 1024 bytes of the HTML document.',
      recommendationUrdu: 'اس ٹیگ کو ہیڈ کے آغاز میں رکھیں۔',
      fixSnippet: '<meta charset="UTF-8" />',
    });
  }

  // 13. Favicon & Web App Icon
  const favicon = result.meta.favicon;
  if (!favicon.present) {
    items.push({
      id: 'favicon-icon',
      name: 'Favicon & Mobile Tab Icon',
      elementTag: '<link rel="icon">',
      category: 'basics',
      categoryLabel: 'Core Meta',
      categoryLabelUrdu: 'بنیادی میٹا ٹیگز',
      severity: 'warning',
      isMissing: true,
      isCritical: false,
      currentValue: null,
      statusMessage: 'Missing favicon declaration (<link rel="icon">)',
      statusMessageUrdu: 'فیو آئیکن (<link rel="icon">) غائب ہے',
      seoImpact: 'Google Mobile Search results prominently display the website favicon next to page titles. A missing icon lowers brand trust and CTR.',
      seoImpactUrdu: 'گوگل موبائل نتائج میں ٹائٹل کے ساتھ فیو آئیکن دکھاتا ہے، اس کی عدم موجودگی سے اعتماد کم ہوتا ہے۔',
      recommendation: 'Provide 32x32 SVG or PNG favicon and 180x180 Apple Touch Icon.',
      recommendationUrdu: 'براؤزر اور موبائل کے لیے 32x32 اور 180x180 سائز کا آئیکن لگائیں۔',
      fixSnippet: '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
    });
  } else {
    items.push({
      id: 'favicon-icon',
      name: 'Favicon & Mobile Tab Icon',
      elementTag: '<link rel="icon">',
      category: 'basics',
      categoryLabel: 'Core Meta',
      categoryLabelUrdu: 'بنیادی میٹا ٹیگز',
      severity: 'passed',
      isMissing: false,
      isCritical: false,
      currentValue: favicon.href || 'Present',
      statusMessage: 'Favicon declared for browser tabs & Google search results',
      statusMessageUrdu: 'فیو آئیکن درست طریقے سے منسلک ہے',
      seoImpact: 'Boosts brand recall in mobile search results and browser bookmark bars.',
      seoImpactUrdu: 'موبائل سرچ اور براؤزر ٹیب میں برانڈ کی پہچان بناتا ہے۔',
      recommendation: 'Ensure your favicon is high resolution and displays clearly on dark backgrounds.',
      recommendationUrdu: 'ڈارک اور لائٹ دونوں بیک گراؤنڈز پر آئیکن کی جانچ کر لیں۔',
      fixSnippet: `<link rel="icon" href="${favicon.href || '/favicon.ico'}" />`,
    });
  }

  // 14. Heading Hierarchy Structure (H1 -> H2 -> H3)
  const headings = result.headings;
  if (headings.hasSkippedLevels) {
    items.push({
      id: 'heading-hierarchy',
      name: 'Heading Tag Order (H1–H6)',
      elementTag: '<h2>, <h3>...',
      category: 'content',
      categoryLabel: 'Content Structure',
      categoryLabelUrdu: 'مواد کی ساخت',
      severity: 'warning',
      isMissing: false,
      isCritical: false,
      currentValue: headings.skippedLevelNotes.join(', ') || 'Levels skipped in document order',
      statusMessage: `Skipped heading levels detected (${headings.skippedLevelNotes[0] || 'Hierarchy jump'})`,
      statusMessageUrdu: `ہیڈنگز کی ترتیب میں خلا موجود ہے (مثلاً H1 کے فوراً بعد H3)`,
      seoImpact: 'Broken semantic heading hierarchy makes it harder for search engines and accessibility tools to follow document logical flow.',
      seoImpactUrdu: 'ہیڈنگز کی غلط ترتیب سے سرچ انجن اور اسکرین ریڈرز کو دستاویز کے حصوں کو سمجھنے میں الجھن ہوتی ہے۔',
      recommendation: 'Nest headings sequentially (e.g. H1 followed by H2, then H3) without skipping intermediate levels.',
      recommendationUrdu: 'ہیڈنگز کو ہمیشہ درجہ بہ درجہ رکھیں (H1 کے بعد H2، پھر H3)۔',
      fixSnippet: '<!-- Logical hierarchy example: -->\n<h1>Main Title</h1>\n  <h2>Primary Section</h2>\n    <h3>Sub-topic Details</h3>',
    });
  } else {
    items.push({
      id: 'heading-hierarchy',
      name: 'Heading Tag Order (H1–H6)',
      elementTag: '<h2>, <h3>...',
      category: 'content',
      categoryLabel: 'Content Structure',
      categoryLabelUrdu: 'مواد کی ساخت',
      severity: 'passed',
      isMissing: false,
      isCritical: false,
      currentValue: `Clean progression (${headings.items.length} total headings)`,
      statusMessage: 'Heading hierarchy follows logical nested order without skipped levels',
      statusMessageUrdu: 'تمام ہیڈنگز درست اور باقاعدہ ترتیب میں ہیں',
      seoImpact: 'Optimized document structure for algorithmic topic extraction.',
      seoImpactUrdu: 'سرچ انجن کے مواد کو سمجھنے کے لیے بہترین ساخت۔',
      recommendation: 'Keep section titles descriptive and relevant to user search intents.',
      recommendationUrdu: 'ذیلی عنوانات کو وضاحتی اور معلوماتی رکھیں۔',
      fixSnippet: '<!-- Heading progression is clean and semantic -->',
    });
  }

  // 15. HTTPS / SSL Security
  if (!result.isHttps) {
    items.push({
      id: 'https-security',
      name: 'HTTPS / SSL Encryption',
      elementTag: 'HTTPS Protocol',
      category: 'technical',
      categoryLabel: 'Mobile & Technical',
      categoryLabelUrdu: 'موبائل اور تکنیکی',
      severity: 'critical',
      isMissing: true,
      isCritical: true,
      currentValue: 'Insecure HTTP',
      statusMessage: 'Page served over unencrypted HTTP protocol',
      statusMessageUrdu: 'صفحہ غیر محفوظ HTTP پروٹوکول پر چل رہا ہے',
      seoImpact: 'Google flags HTTP sites as "Not Secure" in Chrome and applies confirmed ranking penalties to non-HTTPS URLs.',
      seoImpactUrdu: 'گوگل HTTP کو غیر محفوظ قرار دیتا ہے اور رینکنگ میں کمی کرتا ہے۔',
      recommendation: 'Install an SSL certificate and enforce permanent 301 redirects from HTTP to HTTPS.',
      recommendationUrdu: 'فوری طور پر مفت SSL سرٹیفکیٹ لگائیں اور HTTPS پر ری ڈائریکٹ کریں۔',
      fixSnippet: '# Apache .htaccess HTTPS Redirect:\nRewriteEngine On\nRewriteCond %{HTTPS} off\nRewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
    });
  } else {
    items.push({
      id: 'https-security',
      name: 'HTTPS / SSL Encryption',
      elementTag: 'HTTPS Protocol',
      category: 'technical',
      categoryLabel: 'Mobile & Technical',
      categoryLabelUrdu: 'موبائل اور تکنیکی',
      severity: 'passed',
      isMissing: false,
      isCritical: true,
      currentValue: 'Secure HTTPS verified',
      statusMessage: 'Encrypted HTTPS protocol verified',
      statusMessageUrdu: 'محفوظ اور تصدیق شدہ HTTPS پروٹوکول فعال ہے',
      seoImpact: 'Satisfies Google Page Experience security ranking signal and builds user trust.',
      seoImpactUrdu: 'گوگل کے پیج ایکسپیریئنس معیار اور صارف کے اعتماد کے لیے ضروری۔',
      recommendation: 'Ensure all internal assets (images, CSS, scripts) load over HTTPS without mixed content warnings.',
      recommendationUrdu: 'تمام تصاویر اور اسکرپٹس بھی HTTPS پر لوڈ ہونی چاہئیں۔',
      fixSnippet: '<!-- HTTPS verified -->',
    });
  }

  // 16. Internal Link Health & Dead Links
  const linksReport = result.internalLinksReport;
  if (linksReport && linksReport.brokenCount > 0) {
    items.push({
      id: 'internal-links-health',
      name: 'Internal Link Integrity',
      elementTag: '<a href="...">',
      category: 'indexing',
      categoryLabel: 'Indexing & URLs',
      categoryLabelUrdu: 'انڈیکسنگ اور لنکس',
      severity: 'critical',
      isMissing: false,
      isCritical: true,
      currentValue: `${linksReport.brokenCount} broken link${linksReport.brokenCount > 1 ? 's' : ''} detected`,
      statusMessage: `${linksReport.brokenCount} broken link${linksReport.brokenCount > 1 ? 's' : ''} returning 404 or connection failures`,
      statusMessageUrdu: `${linksReport.brokenCount} اندرونی لنکس خراب یا 404 پر ختم ہو رہے ہیں`,
      seoImpact: 'Dead links waste search bot crawl budget, ruin user retention, and leak valuable PageRank.',
      seoImpactUrdu: 'خراب لنکس سے گوگل کرال کا وقت ضائع ہوتا ہے اور صارف فوری صفحہ چھوڑ دیتا ہے۔',
      recommendation: 'Fix or remove broken internal links to preserve link equity and user navigation.',
      recommendationUrdu: 'خراب لنکس کو درست کریں یا مٹا دیں تاکہ رینکنگ برقرار رہے۔',
      fixSnippet: '<!-- Update href targets in Broken Links & Crawl tab -->',
    });
  } else {
    items.push({
      id: 'internal-links-health',
      name: 'Internal Link Integrity',
      elementTag: '<a href="...">',
      category: 'indexing',
      categoryLabel: 'Indexing & URLs',
      categoryLabelUrdu: 'انڈیکسنگ اور لنکس',
      severity: 'passed',
      isMissing: false,
      isCritical: false,
      currentValue: linksReport ? `${linksReport.uniqueUrlsCount} verified links` : 'Links parsed',
      statusMessage: 'All discovered internal hyperlinks resolved cleanly',
      statusMessageUrdu: 'تمام اندرونی لنکس درست اور فعال ہیں',
      seoImpact: 'Search engine spiders can freely traverse and index your site architecture.',
      seoImpactUrdu: 'سرچ انجن آسانی سے آپ کی پوری سائٹ کا جائزہ لے سکتے ہیں۔',
      recommendation: 'Use descriptive keyword-rich anchor text instead of generic "click here" labels.',
      recommendationUrdu: 'اینکر ٹیکسٹ میں عام الفاظ کی بجائے بامقصد کی ورڈز استعمال کریں۔',
      fixSnippet: '<a href="/features">Explore SEO Features</a>',
    });
  }

  // Calculate summary metrics
  const totalItems = items.length;
  const passedCount = items.filter((i) => i.severity === 'passed').length;
  const missingCount = items.filter((i) => i.isMissing).length;
  const warningCount = items.filter((i) => i.severity === 'warning').length;
  const criticalMissing = items.filter((i) => i.isCritical && (i.isMissing || i.severity === 'critical'));

  const healthScore = Math.round((passedCount / totalItems) * 100);

  return {
    totalItems,
    passedCount,
    missingCount,
    warningCount,
    criticalMissingCount: criticalMissing.length,
    healthScore,
    items,
    missingCriticalList: criticalMissing.map((i) => i.name),
  };
}
