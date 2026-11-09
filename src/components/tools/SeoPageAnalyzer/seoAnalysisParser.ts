import {
  SeoAnalysisResult,
  MetaTagItem,
  HeadingItem,
  OpenGraphData,
  TwitterCardData,
  ImageAuditItem,
  LinkAuditItem,
  SchemaItem,
  SeoIssue,
  CrawledInternalLink,
  InternalLinksReport,
} from './seoAnalysisTypes';
import { analyzeKeywordDensity } from './keywordDensityService';

export interface ParseOptions {
  url: string;
  finalUrl?: string;
  html: string;
  ttfbMs?: number;
  sourceType?: 'url' | 'html-paste' | 'demo';
}

export function parseAndAnalyzeSeo({
  url,
  finalUrl,
  html,
  ttfbMs = 120,
  sourceType = 'url',
}: ParseOptions): SeoAnalysisResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const issues: SeoIssue[] = [];
  const normalizedUrl = url.trim();
  const resolvedFinalUrl = finalUrl || normalizedUrl;
  const isHttps = normalizedUrl.startsWith('https://');

  // ==========================================
  // 1. META TAGS AUDIT
  // ==========================================

  // Title
  const titleEl = doc.querySelector('title');
  const titleContent = titleEl ? titleEl.textContent?.trim() || '' : null;
  const titleLen = titleContent ? titleContent.length : 0;
  let titleStatus: 'good' | 'warning' | 'error' = 'good';
  let titleMessage = 'Optimal title tag length (30-60 characters).';

  if (!titleContent) {
    titleStatus = 'error';
    titleMessage = 'Missing <title> tag. Search engines cannot display a proper headline in SERPs.';
    issues.push({
      id: 'missing-title',
      category: 'meta',
      severity: 'critical',
      title: 'Missing <title> Tag',
      description: 'The page does not have a <title> element inside the <head>.',
      impact: 'Critical SEO impact. Search engines will generate an arbitrary title, hurting rankings and click-through rates.',
      recommendation: 'Add a concise, compelling <title> between 30 and 60 characters containing your primary keyword.',
      fixSnippet: `<title>Primary Keyword – Brand Name or Descriptive Value Proposition</title>`,
    });
  } else if (titleLen < 30) {
    titleStatus = 'warning';
    titleMessage = `Title tag is too short (${titleLen} chars). Recommended is 30–60 characters.`;
    issues.push({
      id: 'short-title',
      category: 'meta',
      severity: 'warning',
      title: 'Title Tag Too Short',
      description: `Current title has only ${titleLen} characters: "${titleContent}".`,
      impact: 'You may be missing keyword opportunities or failing to convey clear search intent.',
      recommendation: 'Expand title to 30–60 characters with branding and secondary target keywords.',
      fixSnippet: `<title>${titleContent} – Fast, Free & Accurate Solutions</title>`,
    });
  } else if (titleLen > 60) {
    titleStatus = 'warning';
    titleMessage = `Title tag is too long (${titleLen} chars). It will likely be truncated on Google desktop/mobile SERPs.`;
    issues.push({
      id: 'long-title',
      category: 'meta',
      severity: 'warning',
      title: 'Title Tag Truncation Warning',
      description: `Title tag has ${titleLen} characters. Google typically truncates titles over 60 characters or ~580px width.`,
      impact: 'Searchers will see an ellipsis ("..."), potentially cutting off brand name or critical selling points.',
      recommendation: 'Trim title tag to under 60 characters while keeping the most critical keyword upfront.',
      fixSnippet: `<title>${titleContent.slice(0, 57)}...</title>`,
    });
  } else {
    issues.push({
      id: 'title-passed',
      category: 'meta',
      severity: 'passed',
      title: 'Title Tag Is Well Optimized',
      description: `Title length is ${titleLen} characters: "${titleContent}".`,
      impact: 'Ideal display in search engine result snippets.',
      recommendation: 'Keep title focused on user intent and click appeal.',
    });
  }

  const titleItem: MetaTagItem = {
    name: 'Title Tag',
    content: titleContent,
    status: titleStatus,
    message: titleMessage,
    length: titleLen,
    recommendedLength: '30 - 60 characters',
  };

  // Meta Description
  const descEl = doc.querySelector('meta[name="description" i]') || doc.querySelector('meta[property="description" i]');
  const descContent = descEl ? descEl.getAttribute('content')?.trim() || '' : null;
  const descLen = descContent ? descContent.length : 0;
  let descStatus: 'good' | 'warning' | 'error' = 'good';
  let descMessage = 'Optimal meta description length (120-160 characters).';

  if (!descContent) {
    descStatus = 'error';
    descMessage = 'Missing meta description. Google will extract random text snippets from the body.';
    issues.push({
      id: 'missing-description',
      category: 'meta',
      severity: 'critical',
      title: 'Missing Meta Description',
      description: 'The page has no <meta name="description"> tag.',
      impact: 'High impact on click-through rate (CTR). Google will auto-generate snippets which often look disjointed.',
      recommendation: 'Add a 120–160 character meta description summarizing the page content with a call to action.',
      fixSnippet: `<meta name="description" content="Discover smart tools, fast utilities, and instant productivity solutions built for seamless everyday performance." />`,
    });
  } else if (descLen < 120) {
    descStatus = 'warning';
    descMessage = `Meta description is short (${descLen} chars). Optimal range is 120–160 characters.`;
    issues.push({
      id: 'short-description',
      category: 'meta',
      severity: 'warning',
      title: 'Meta Description Could Be More Descriptive',
      description: `Current description is ${descLen} characters: "${descContent}".`,
      impact: 'Leaves valuable snippet real estate empty on Google search results.',
      recommendation: 'Expand description to 120–160 characters with clear benefits and a call-to-action.',
      fixSnippet: `<meta name="description" content="${descContent} Learn more and explore free instant tools online today." />`,
    });
  } else if (descLen > 160) {
    descStatus = 'warning';
    descMessage = `Meta description is too long (${descLen} chars). Search snippets will be truncated with an ellipsis.`;
    issues.push({
      id: 'long-description',
      category: 'meta',
      severity: 'warning',
      title: 'Meta Description Likely To Be Truncated',
      description: `Meta description is ${descLen} characters long. Standard mobile/desktop snippets cut off around 160 characters.`,
      impact: 'Ending sentences or call-to-action may be cut off.',
      recommendation: 'Shorten description to under 160 characters.',
      fixSnippet: `<meta name="description" content="${descContent.slice(0, 155)}..." />`,
    });
  } else {
    issues.push({
      id: 'description-passed',
      category: 'meta',
      severity: 'passed',
      title: 'Meta Description Is Well Optimized',
      description: `Length is ${descLen} characters: "${descContent}".`,
      impact: 'High CTR potential on search engines.',
      recommendation: 'Ensure your description accurately matches user expectation on page arrival.',
    });
  }

  const descItem: MetaTagItem = {
    name: 'Meta Description',
    content: descContent,
    status: descStatus,
    message: descMessage,
    length: descLen,
    recommendedLength: '120 - 160 characters',
  };

  // Viewport
  const viewportEl = doc.querySelector('meta[name="viewport" i]');
  const viewportContent = viewportEl ? viewportEl.getAttribute('content')?.trim() || '' : null;
  const hasResponsiveViewport = viewportContent && viewportContent.includes('width=device-width');
  const viewportItem: MetaTagItem = {
    name: 'Viewport Tag',
    content: viewportContent,
    status: hasResponsiveViewport ? 'good' : 'error',
    message: hasResponsiveViewport
      ? 'Mobile responsive viewport tag is correctly configured.'
      : 'Missing or improperly configured viewport tag for mobile devices.',
  };
  if (!hasResponsiveViewport) {
    issues.push({
      id: 'missing-viewport',
      category: 'meta',
      severity: 'critical',
      title: 'Missing Mobile Viewport Tag',
      description: 'The page lacks a responsive <meta name="viewport" content="width=device-width, initial-scale=1.0"> tag.',
      impact: 'Google prioritizes mobile-first indexing. Pages without a viewport tag render zoomed-out and fail mobile-friendly tests.',
      recommendation: 'Add the standard responsive viewport meta tag to the <head>.',
      fixSnippet: `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
    });
  } else {
    issues.push({
      id: 'viewport-passed',
      category: 'meta',
      severity: 'passed',
      title: 'Mobile Viewport Tag Present',
      description: `Configured with: "${viewportContent}".`,
      impact: 'Mobile browsers will scale content appropriately to the screen width.',
      recommendation: 'Maintain standard width=device-width, initial-scale=1.0 settings.',
    });
  }

  // Canonical Tag
  const canonicalEl = doc.querySelector('link[rel="canonical" i]');
  const canonicalHref = canonicalEl ? canonicalEl.getAttribute('href')?.trim() || '' : null;
  const isSelfReferencing = canonicalHref ? (canonicalHref === resolvedFinalUrl || canonicalHref === normalizedUrl) : false;
  const canonicalItem: MetaTagItem & { isSelfReferencing?: boolean } = {
    name: 'Canonical Tag',
    content: canonicalHref,
    status: canonicalHref ? 'good' : 'warning',
    message: canonicalHref
      ? `Canonical URL specified: ${canonicalHref}`
      : 'No canonical URL tag found. May cause duplicate content issues if URL has query parameters or alternate protocols.',
    isSelfReferencing,
  };
  if (!canonicalHref) {
    issues.push({
      id: 'missing-canonical',
      category: 'meta',
      severity: 'warning',
      title: 'Missing Canonical Tag',
      description: 'The page does not specify a canonical link (<link rel="canonical" href="...">).',
      impact: 'Search engines might index duplicate versions of this page (e.g., http vs https, www vs non-www, UTM tracking links).',
      recommendation: 'Add a self-referencing canonical tag pointing to the authoritative version of this URL.',
      fixSnippet: `<link rel="canonical" href="${resolvedFinalUrl}" />`,
    });
  } else {
    issues.push({
      id: 'canonical-passed',
      category: 'meta',
      severity: 'passed',
      title: 'Canonical Tag Configured',
      description: `Points to: "${canonicalHref}".`,
      impact: 'Consolidates search ranking signals and prevents duplicate content penalties.',
      recommendation: 'Keep canonical URL synchronized with the final HTTPS destination.',
    });
  }

  // Robots Tag
  const robotsEl = doc.querySelector('meta[name="robots" i]');
  const robotsContent = robotsEl ? robotsEl.getAttribute('content')?.trim().toLowerCase() || '' : null;
  const isNoIndex = robotsContent ? robotsContent.includes('noindex') || robotsContent.includes('none') : false;
  const isNoFollow = robotsContent ? robotsContent.includes('nofollow') || robotsContent.includes('none') : false;
  const robotsItem: MetaTagItem & { isNoIndex?: boolean; isNoFollow?: boolean } = {
    name: 'Robots Tag',
    content: robotsContent,
    status: isNoIndex ? 'error' : isNoFollow ? 'warning' : 'good',
    message: isNoIndex
      ? 'WARNING: "noindex" detected! Search engines are blocked from indexing this page in search results.'
      : isNoFollow
      ? '"nofollow" detected. Search engine crawlers will not follow links on this page.'
      : robotsContent
      ? `Indexable robots directive: ${robotsContent}`
      : 'Default (Index, Follow). Page is openly crawlable by search engines.',
    isNoIndex,
    isNoFollow,
  };
  if (isNoIndex) {
    issues.push({
      id: 'robots-noindex',
      category: 'meta',
      severity: 'critical',
      title: 'Page Has "noindex" Directive',
      description: 'Found <meta name="robots" content="noindex">. This actively prevents Google from showing your page in search results.',
      impact: 'Catastrophic if unintended: The page will be de-indexed or will never appear in Google rankings.',
      recommendation: 'Remove "noindex" if you want this page to rank on search engines.',
      fixSnippet: `<meta name="robots" content="index, follow" />`,
    });
  }

  // Charset
  const charsetEl = doc.querySelector('meta[charset]') || doc.querySelector('meta[http-equiv="Content-Type" i]');
  const charsetContent = charsetEl
    ? charsetEl.getAttribute('charset') || charsetEl.getAttribute('content') || null
    : null;
  const hasUtf8 = charsetContent ? charsetContent.toLowerCase().includes('utf-8') : false;
  const charsetItem: MetaTagItem = {
    name: 'Character Encoding',
    content: charsetContent,
    status: hasUtf8 ? 'good' : charsetContent ? 'warning' : 'error',
    message: hasUtf8 ? 'UTF-8 character encoding is properly declared.' : 'Character encoding should explicitly declare UTF-8.',
  };
  if (!hasUtf8) {
    issues.push({
      id: 'missing-charset',
      category: 'meta',
      severity: 'warning',
      title: 'Missing or Non-UTF8 Charset Declaration',
      description: 'The HTML document does not declare <meta charset="UTF-8">.',
      impact: 'Browsers may misinterpret special characters, foreign alphabet letters, or emojis.',
      recommendation: 'Add <meta charset="UTF-8" /> as the very first element in the <head>.',
      fixSnippet: `<meta charset="UTF-8" />`,
    });
  }

  // Language attribute on <html>
  const htmlEl = doc.querySelector('html');
  const langAttr = htmlEl ? htmlEl.getAttribute('lang')?.trim() || null : null;
  const langItem: MetaTagItem = {
    name: 'HTML Language Tag',
    content: langAttr,
    status: langAttr ? 'good' : 'warning',
    message: langAttr ? `Language attribute declared as "${langAttr}".` : 'Missing lang attribute on <html> tag.',
  };
  if (!langAttr) {
    issues.push({
      id: 'missing-lang',
      category: 'meta',
      severity: 'warning',
      title: 'Missing Language (lang) Attribute',
      description: 'The root <html> element does not have a lang attribute (e.g., <html lang="en">).',
      impact: 'Screen readers and international search engine crawlers struggle to determine the language of the page.',
      recommendation: 'Add the ISO language code to the <html> opening tag.',
      fixSnippet: `<html lang="en">`,
    });
  }

  // Helper to resolve relative image/canonical URLs against the document's base URL
  const resolveAbsoluteUrl = (path: string | null): string | null => {
    if (!path) return null;
    try {
      return new URL(path, resolvedFinalUrl).href;
    } catch {
      return path;
    }
  };

  // Open Graph Social Tags
  const getOg = (property: string) => {
    const el = doc.querySelector(`meta[property="${property}" i]`) || doc.querySelector(`meta[name="${property}" i]`);
    return el ? el.getAttribute('content')?.trim() || null : null;
  };
  const ogTitle = getOg('og:title') || titleContent;
  const ogDesc = getOg('og:description') || descContent;
  const rawOgImage = getOg('og:image');
  const ogImage = resolveAbsoluteUrl(rawOgImage);
  const ogImageAlt = getOg('og:image:alt');
  const ogUrl = resolveAbsoluteUrl(getOg('og:url')) || resolvedFinalUrl;
  const ogType = getOg('og:type') || 'website';
  const ogSiteName = getOg('og:site_name');
  const ogLocale = getOg('og:locale');

  const missingOg: string[] = [];
  if (!getOg('og:title')) missingOg.push('og:title');
  if (!getOg('og:description')) missingOg.push('og:description');
  if (!rawOgImage) missingOg.push('og:image');
  if (!getOg('og:url')) missingOg.push('og:url');

  const ogData: OpenGraphData = {
    title: ogTitle,
    description: ogDesc,
    image: ogImage,
    imageAlt: ogImageAlt,
    url: ogUrl,
    type: ogType,
    siteName: ogSiteName,
    locale: ogLocale,
    presentCount: 4 - missingOg.length,
    missingTags: missingOg,
    status: missingOg.length === 0 ? 'good' : missingOg.length <= 2 ? 'warning' : 'error',
  };
  if (missingOg.length > 0) {
    issues.push({
      id: 'missing-opengraph',
      category: 'meta',
      severity: missingOg.includes('og:image') ? 'warning' : 'info',
      title: `Missing OpenGraph Social Tags (${missingOg.join(', ')})`,
      description: `The page is missing ${missingOg.length} standard OpenGraph tags: ${missingOg.join(', ')}.`,
      impact: 'When shared on Facebook, WhatsApp, LinkedIn, or iMessage, the link may show no image or a generic placeholder.',
      recommendation: 'Add standard OpenGraph tags to control how your page renders across social platforms.',
      fixSnippet: `<meta property="og:type" content="website" />\n<meta property="og:title" content="${titleContent || 'Your Page Title'}" />\n<meta property="og:description" content="${descContent || 'Your page description.'}" />\n<meta property="og:image" content="https://yourdomain.com/og-image.jpg" />\n<meta property="og:url" content="${resolvedFinalUrl}" />`,
    });
  }

  // Twitter Card Tags
  const getTw = (name: string) => {
    const el = doc.querySelector(`meta[name="${name}" i]`) || doc.querySelector(`meta[property="${name}" i]`);
    return el ? el.getAttribute('content')?.trim() || null : null;
  };
  const twCard = getTw('twitter:card') || 'summary_large_image';
  const twTitle = getTw('twitter:title') || ogTitle;
  const twDesc = getTw('twitter:description') || ogDesc;
  const rawTwImage = getTw('twitter:image') || rawOgImage;
  const twImage = resolveAbsoluteUrl(rawTwImage);
  const twImageAlt = getTw('twitter:image:alt') || ogImageAlt;
  const twSite = getTw('twitter:site');
  const twCreator = getTw('twitter:creator');

  const missingTw: string[] = [];
  if (!getTw('twitter:card')) missingTw.push('twitter:card');
  if (!getTw('twitter:title') && !getOg('og:title')) missingTw.push('twitter:title');
  if (!getTw('twitter:description') && !getOg('og:description')) missingTw.push('twitter:description');
  if (!rawTwImage) missingTw.push('twitter:image');

  const twitterData: TwitterCardData = {
    card: twCard,
    title: twTitle,
    description: twDesc,
    image: twImage,
    imageAlt: twImageAlt,
    site: twSite,
    creator: twCreator,
    presentCount: 4 - missingTw.length,
    missingTags: missingTw,
    status: missingTw.length === 0 ? 'good' : 'warning',
  };

  // Favicon
  const faviconEl = doc.querySelector('link[rel~="icon" i]');
  const appleTouchEl = doc.querySelector('link[rel="apple-touch-icon" i]');
  const faviconHref = faviconEl ? faviconEl.getAttribute('href') : null;
  const faviconData = {
    present: Boolean(faviconHref),
    href: faviconHref,
    hasAppleTouchIcon: Boolean(appleTouchEl),
  };
  if (!faviconHref) {
    issues.push({
      id: 'missing-favicon',
      category: 'meta',
      severity: 'warning',
      title: 'Missing Favicon Tag',
      description: 'No <link rel="icon"> found in HTML head.',
      impact: 'Google Search mobile and desktop snippets now feature site favicons prominently beside search results.',
      recommendation: 'Add a clean SVG/PNG favicon icon link.',
      fixSnippet: `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`,
    });
  }

  // Structured Data / Schema.org (JSON-LD)
  const schemaScripts = Array.from(doc.querySelectorAll('script[type="application/ld+json" i]'));
  const schemaItems: SchemaItem[] = [];
  schemaScripts.forEach((s) => {
    try {
      const parsed = JSON.parse(s.textContent || '{}');
      const type = parsed['@type'] || (Array.isArray(parsed['@graph']) ? 'Graph' : 'Schema');
      schemaItems.push({ type: String(type), rawJson: parsed });
    } catch {
      // Ignored malformed schema
    }
  });

  if (schemaItems.length === 0) {
    issues.push({
      id: 'missing-schema',
      category: 'meta',
      severity: 'info',
      title: 'No Structured Data (Schema.org / JSON-LD) Detected',
      description: 'The page does not implement JSON-LD structured data markups.',
      impact: 'Missing out on rich Google SERP features such as star ratings, breadcrumb trails, FAQs, and organization cards.',
      recommendation: 'Add Schema.org JSON-LD to help search engines understand the entity and content of your page.',
      fixSnippet: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "${titleContent || 'Page Title'}",\n  "description": "${descContent || 'Page Description'}"\n}\n</script>`,
    });
  } else {
    issues.push({
      id: 'schema-passed',
      category: 'meta',
      severity: 'passed',
      title: `Structured Data Found (${schemaItems.length} schema${schemaItems.length === 1 ? '' : 's'})`,
      description: `Detected types: ${schemaItems.map((si) => si.type).join(', ')}.`,
      impact: 'Enables rich search snippets on Google.',
      recommendation: 'Validate schema syntax regularly with Google Rich Results Test.',
    });
  }

  // ==========================================
  // 2. HEADING STRUCTURE AUDIT (H1-H6)
  // ==========================================
  const headingElements = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const headingCounts: Record<string, number> = {
    h1: 0,
    h2: 0,
    h3: 0,
    h4: 0,
    h5: 0,
    h6: 0,
  };
  const h1List: string[] = [];
  const headingItems: HeadingItem[] = [];
  const skippedLevelNotes: string[] = [];
  let emptyHeadingsCount = 0;

  let lastLevel = 0;

  headingElements.forEach((el, index) => {
    const tagName = el.tagName.toLowerCase();
    const level = parseInt(tagName.replace('h', ''), 10);
    const text = el.textContent?.trim() || '';
    const isEmpty = text.length === 0;

    if (isEmpty) {
      emptyHeadingsCount++;
    }

    headingCounts[tagName] = (headingCounts[tagName] || 0) + 1;
    if (level === 1 && !isEmpty) {
      h1List.push(text);
    }

    // Check for skipped hierarchy levels (e.g. H1 followed directly by H3 without H2)
    let hasSkippedLevel = false;
    let skippedLevelNote: string | undefined;

    if (lastLevel > 0 && level > lastLevel + 1) {
      hasSkippedLevel = true;
      skippedLevelNote = `Skipped <h${lastLevel + 1}>! Jumped from <h${lastLevel}> directly to <h${level}>.`;
      skippedLevelNotes.push(
        `Heading #${index + 1} (<h${level}> "${text.slice(0, 30)}..."): Jumped from <h${lastLevel}> to <h${level}>, skipping <h${lastLevel + 1}>.`
      );
    }

    headingItems.push({
      level,
      tag: tagName.toUpperCase(),
      text: isEmpty ? '(Empty heading text)' : text,
      charLength: text.length,
      isEmpty,
      index: index + 1,
      hasSkippedLevel,
      skippedLevelNote,
    });

    lastLevel = level;
  });

  const h1Count = headingCounts.h1;
  let headingStatus: 'good' | 'warning' | 'error' = 'good';

  // Evaluate H1 issues
  if (h1Count === 0) {
    headingStatus = 'error';
    issues.push({
      id: 'missing-h1',
      category: 'headings',
      severity: 'critical',
      title: 'Missing <h1> Heading',
      description: 'The page has no <h1> heading tag.',
      impact: 'The <h1> is the single most important on-page heading indicating the core topic of the document to search engines.',
      recommendation: 'Add exactly one descriptive <h1> heading near the top of the main content.',
      fixSnippet: `<h1>${titleContent || 'Your Primary Page Subject Headline'}</h1>`,
    });
  } else if (h1Count > 1) {
    headingStatus = 'warning';
    issues.push({
      id: 'multiple-h1',
      category: 'headings',
      severity: 'warning',
      title: `Multiple <h1> Headings Found (${h1Count} instances)`,
      description: `Found ${h1Count} separate <h1> tags on this single page: ${h1List.map((h) => `"${h}"`).join(', ')}.`,
      impact: 'While HTML5 permits multiple H1s in sectioning elements, SEO best practice recommends a single authoritative H1 per page to maintain clear topical focus.',
      recommendation: 'Keep one primary <h1> representing the main page topic, and convert other H1s to <h2> or <h3> tags.',
    });
  } else {
    issues.push({
      id: 'h1-passed',
      category: 'headings',
      severity: 'passed',
      title: 'Single <h1> Tag Configured',
      description: `H1 text: "${h1List[0]}".`,
      impact: 'Establishes clear topical hierarchy for search bots and screen readers.',
      recommendation: 'Ensure your H1 aligns closely with user search intent and primary keyword.',
    });
  }

  // Evaluate skipped levels
  if (skippedLevelNotes.length > 0) {
    if (headingStatus !== 'error') headingStatus = 'warning';
    issues.push({
      id: 'skipped-headings',
      category: 'headings',
      severity: 'warning',
      title: `Heading Hierarchy Skips Detected (${skippedLevelNotes.length} instance${skippedLevelNotes.length === 1 ? '' : 's'})`,
      description: `The document outline skips heading levels without proper parent tags: ${skippedLevelNotes[0]}`,
      impact: 'Confuses document structure for accessibility screen readers and structural search engine scrapers.',
      recommendation: 'Nest headings sequentially (H1 ➔ H2 ➔ H3 ➔ H4) without skipping levels.',
    });
  }

  // Evaluate empty headings
  if (emptyHeadingsCount > 0) {
    if (headingStatus !== 'error') headingStatus = 'warning';
    issues.push({
      id: 'empty-headings',
      category: 'headings',
      severity: 'warning',
      title: `Empty Headings Found (${emptyHeadingsCount})`,
      description: `Found ${emptyHeadingsCount} heading tags that contain no visible text content.`,
      impact: 'Creates phantom landmarks in accessibility trees and clutters document structure.',
      recommendation: 'Remove empty heading tags or provide meaningful descriptive text.',
    });
  }

  // ==========================================
  // 3. PERFORMANCE & TECHNICAL AUDIT
  // ==========================================
  const rawHtmlSize = new Blob([html]).size;
  const domNodes = doc.querySelectorAll('*').length;

  // Images audit
  const imgElements = Array.from(doc.querySelectorAll('img'));
  const missingAltImages: ImageAuditItem[] = [];
  let withDimensionsCount = 0;
  let withLazyCount = 0;

  imgElements.forEach((img) => {
    const src = img.getAttribute('src') || '';
    const alt = img.getAttribute('alt');
    const hasAlt = alt !== null && alt.trim().length > 0;
    const hasDimensions = Boolean(img.getAttribute('width') && img.getAttribute('height'));
    const isLazy = img.getAttribute('loading')?.toLowerCase() === 'lazy';

    if (hasDimensions) withDimensionsCount++;
    if (isLazy) withLazyCount++;

    if (!hasAlt) {
      missingAltImages.push({
        src,
        alt,
        hasAlt: false,
        hasDimensions,
        isLazy,
      });
    }
  });

  if (missingAltImages.length > 0) {
    issues.push({
      id: 'missing-image-alt',
      category: 'performance',
      severity: missingAltImages.length > 3 ? 'warning' : 'info',
      title: `Images Missing Alt Text (${missingAltImages.length} of ${imgElements.length})`,
      description: `${missingAltImages.length} images on this page lack descriptive alt attributes.`,
      impact: 'Hampers image SEO on Google Images and impairs screen readers for visually impaired visitors.',
      recommendation: 'Add concise, descriptive alt text to all informational images (use alt="" for purely decorative graphics).',
      fixSnippet: `<img src="image.jpg" alt="Descriptive caption describing content" width="800" height="600" loading="lazy" />`,
    });
  } else if (imgElements.length > 0) {
    issues.push({
      id: 'image-alt-passed',
      category: 'performance',
      severity: 'passed',
      title: 'All Images Have Alt Attributes',
      description: `All ${imgElements.length} images on page have alt tags present.`,
      impact: 'Strong accessibility compliance and Google Image Search eligibility.',
      recommendation: 'Ensure alt descriptions remain contextually relevant to surrounding text.',
    });
  }

  // Links audit & Internal Link Discovery
  const linkElements = Array.from(doc.querySelectorAll('a[href]'));
  let internalLinksCount = 0;
  let externalLinksCount = 0;
  let emptyAnchorCount = 0;

  const internalLinksMap = new Map<string, {
    originalHref: string;
    anchorText: string;
    occurrences: number;
    isNoFollow: boolean;
  }>();

  linkElements.forEach((a) => {
    const rawHref = (a.getAttribute('href') || '').trim();
    const text = a.textContent?.trim() || a.getAttribute('title')?.trim() || a.getAttribute('aria-label')?.trim() || (a.querySelector('img') ? '(Image Link)' : '');
    const isNoFollow = (a.getAttribute('rel') || '').toLowerCase().includes('nofollow');

    if (!text && !a.querySelector('img')) {
      emptyAnchorCount++;
    }

    // Skip non-http schemes and pure in-page hash anchors
    if (
      !rawHref ||
      rawHref.startsWith('javascript:') ||
      rawHref.startsWith('mailto:') ||
      rawHref.startsWith('tel:') ||
      rawHref.startsWith('sms:') ||
      rawHref.startsWith('data:') ||
      rawHref === '#' ||
      rawHref.startsWith('#')
    ) {
      return;
    }

    try {
      const resolved = new URL(rawHref, resolvedFinalUrl);
      const pageHost = new URL(resolvedFinalUrl).hostname;
      if (resolved.hostname === pageHost) {
        internalLinksCount++;
        // Normalize: strip hash fragment for crawling
        const cleanUrl = `${resolved.origin}${resolved.pathname}${resolved.search}`;
        const existing = internalLinksMap.get(cleanUrl);
        if (existing) {
          existing.occurrences++;
          if (!existing.anchorText && text) existing.anchorText = text;
        } else {
          internalLinksMap.set(cleanUrl, {
            originalHref: rawHref,
            anchorText: text || '(No anchor text)',
            occurrences: 1,
            isNoFollow,
          });
        }
      } else {
        externalLinksCount++;
      }
    } catch {
      // Relative path fallback
      if (rawHref.startsWith('/') || rawHref.startsWith('.')) {
        internalLinksCount++;
        try {
          const fakeResolved = new URL(rawHref, resolvedFinalUrl).href;
          const existing = internalLinksMap.get(fakeResolved);
          if (existing) {
            existing.occurrences++;
          } else {
            internalLinksMap.set(fakeResolved, {
              originalHref: rawHref,
              anchorText: text || '(No anchor text)',
              occurrences: 1,
              isNoFollow,
            });
          }
        } catch {
          // Ignore unparseable
        }
      } else {
        externalLinksCount++;
      }
    }
  });

  if (emptyAnchorCount > 0) {
    issues.push({
      id: 'empty-anchors',
      category: 'performance',
      severity: 'warning',
      title: `Links With Empty Anchor Text (${emptyAnchorCount})`,
      description: `${emptyAnchorCount} links do not contain readable anchor text or image alt tags.`,
      impact: 'Search engines rely heavily on anchor text to understand what linked destination pages are about.',
      recommendation: 'Provide clear, descriptive anchor text describing where the link navigates to.',
    });
  }

  // Build CrawledInternalLink items
  const crawledLinks: CrawledInternalLink[] = [];
  let linkIdx = 0;

  internalLinksMap.forEach((meta, linkUrl) => {
    linkIdx++;
    const lowerHref = meta.originalHref.toLowerCase();

    let status: 'ok' | 'broken' | 'redirect' | 'timeout' | 'checking' | 'untested' = 'untested';
    let statusCode = 200;
    let statusText = '200 OK';
    let diagnosticTip: string | undefined = undefined;
    let responseTimeMs = Math.floor(40 + Math.random() * 90);

    // If demo page, generate realistic link crawl findings
    if (sourceType === 'demo') {
      if (
        lowerHref.includes('discontinued') ||
        lowerHref.includes('broken') ||
        lowerHref.includes('404') ||
        lowerHref.includes('q3-whitepaper-old') ||
        lowerHref.includes('missing')
      ) {
        status = 'broken';
        statusCode = 404;
        statusText = '404 Not Found';
        diagnosticTip = 'Dead internal link. Page not found on host. Causes 404 crawl errors for search engines.';
        responseTimeMs = 120;
      } else if (lowerHref.includes('internal-staging') || lowerHref.includes('staging')) {
        status = 'broken';
        statusCode = 500;
        statusText = '500 Server Error';
        diagnosticTip = 'Internal server crash or restricted staging environment exposed to visitors.';
        responseTimeMs = 210;
      } else if (lowerHref.includes('former-partner') || lowerHref.includes('legacy')) {
        status = 'redirect';
        statusCode = 301;
        statusText = '301 Moved Permanently';
        diagnosticTip = 'Link redirects to an updated URL. Point directly to final destination.';
        responseTimeMs = 85;
      } else {
        status = 'ok';
        statusCode = 200;
        statusText = '200 OK';
        diagnosticTip = 'Link destination responds with healthy HTTP 200.';
      }
    }

    crawledLinks.push({
      id: `link-${linkIdx}`,
      url: linkUrl,
      originalHref: meta.originalHref,
      anchorText: meta.anchorText,
      statusCode,
      status,
      statusText,
      responseTimeMs,
      occurrences: meta.occurrences,
      isNofollow: meta.isNoFollow,
      diagnosticTip,
    });
  });

  const brokenLinks = crawledLinks.filter((l) => l.status === 'broken' || l.status === 'timeout');
  const redirectLinks = crawledLinks.filter((l) => l.status === 'redirect');
  const okLinks = crawledLinks.filter((l) => l.status === 'ok');

  if (brokenLinks.length > 0) {
    const sampleDead = brokenLinks.slice(0, 3).map((l) => `"${l.originalHref}" (${l.statusText})`).join(', ');
    issues.push({
      id: 'broken-internal-links',
      category: 'links',
      severity: 'critical',
      title: `Broken Internal Links Detected (${brokenLinks.length} dead link${brokenLinks.length === 1 ? '' : 's'})`,
      description: `Discovered ${brokenLinks.length} internal links on this page returning 404 or 5xx server errors: ${sampleDead}.`,
      impact: 'Broken internal links degrade user experience, waste search engine crawl budget, and stop PageRank from flowing smoothly.',
      recommendation: 'Update or remove broken href targets, or configure 301 server redirects for moved pages.',
    });
  } else if (crawledLinks.length > 0 && sourceType === 'demo') {
    issues.push({
      id: 'internal-links-passed',
      category: 'links',
      severity: 'passed',
      title: 'Zero Broken Internal Links',
      description: `All ${crawledLinks.length} internal page links resolved successfully with 200 OK.`,
      impact: 'Healthy internal site architecture facilitates deep indexing and smooth user experience.',
      recommendation: 'Periodically monitor internal links across releases.',
    });
  }

  const internalLinksReport: InternalLinksReport = {
    totalDiscovered: internalLinksCount,
    uniqueUrlsCount: crawledLinks.length,
    crawledCount: sourceType === 'demo' ? crawledLinks.length : 0,
    okCount: okLinks.length,
    brokenCount: brokenLinks.length,
    redirectCount: redirectLinks.length,
    links: crawledLinks,
    isCrawling: false,
    crawlProgress: sourceType === 'demo' ? 100 : 0,
    crawlCompleted: sourceType === 'demo',
  };

  // Resources
  const scriptsCount = doc.querySelectorAll('script').length;
  const stylesheetsCount = doc.querySelectorAll('link[rel="stylesheet" i]').length;
  const inlineStylesCount = doc.querySelectorAll('style').length;

  // TTFB & Performance evaluation
  if (ttfbMs > 800) {
    issues.push({
      id: 'slow-ttfb',
      category: 'performance',
      severity: 'warning',
      title: `Slow Time-to-First-Byte (${ttfbMs}ms)`,
      description: `Server took ${ttfbMs}ms to begin transmitting the document.`,
      impact: 'High TTFB directly harms Core Web Vitals (Largest Contentful Paint - LCP) and conversion rates.',
      recommendation: 'Implement server-side caching, edge CDN caching (Cloudflare, Fastly), or optimize database queries.',
    });
  } else {
    issues.push({
      id: 'fast-ttfb',
      category: 'performance',
      severity: 'passed',
      title: `Fast Server Response (${ttfbMs}ms)`,
      description: `Document response time was ${ttfbMs}ms.`,
      impact: 'Fast TTFB provides a solid foundation for top Core Web Vitals scores.',
      recommendation: 'Maintain server caching and HTTP/2 or HTTP/3 server configuration.',
    });
  }

  // HTML page size check
  if (rawHtmlSize > 150 * 1024) {
    issues.push({
      id: 'heavy-html',
      category: 'performance',
      severity: 'warning',
      title: `Heavy HTML Document Size (${Math.round(rawHtmlSize / 1024)} KB)`,
      description: `Document size is ${Math.round(rawHtmlSize / 1024)} KB. Recommended is under 100 KB for initial HTML.`,
      impact: 'Consumes more cellular bandwidth and delays DOM parsing on low-end devices.',
      recommendation: 'Extract large inline SVG paths or base64 images to external assets, and enable Gzip/Brotli compression.',
    });
  } else {
    issues.push({
      id: 'html-size-passed',
      category: 'performance',
      severity: 'passed',
      title: `Lean HTML Payload (${Math.round(rawHtmlSize / 1024)} KB)`,
      description: `Initial HTML size is ${Math.round(rawHtmlSize / 1024)} KB.`,
      impact: 'Enables quick parsing and rendering by client browsers.',
      recommendation: 'Continue keeping HTML lean and decoupled from heavy inline data.',
    });
  }

  // HTTPS check
  if (!isHttps) {
    issues.push({
      id: 'insecure-http',
      category: 'security',
      severity: 'critical',
      title: 'Insecure Protocol (HTTP instead of HTTPS)',
      description: 'The URL uses unencrypted "http://" instead of secure "https://".',
      impact: 'Google marks HTTP sites as "Not Secure" and uses HTTPS as a confirmed ranking signal.',
      recommendation: 'Deploy a free SSL/TLS certificate (e.g. Let\'s Encrypt) and force 301 redirects to HTTPS.',
    });
  } else {
    issues.push({
      id: 'https-passed',
      category: 'security',
      severity: 'passed',
      title: 'Secure HTTPS Protocol Active',
      description: 'The page is served securely over HTTPS.',
      impact: 'Satisfies Google\'s security requirement and protects visitor session privacy.',
      recommendation: 'Ensure all sub-resources (images, scripts) are loaded over HTTPS to avoid mixed content warnings.',
    });
  }

  // ==========================================
  // 4. SCORE CALCULATION
  // ==========================================

  // Meta Score (out of 100)
  let metaScore = 100;
  if (!titleContent) metaScore -= 30;
  else if (titleStatus === 'warning') metaScore -= 10;

  if (!descContent) metaScore -= 25;
  else if (descStatus === 'warning') metaScore -= 8;

  if (!hasResponsiveViewport) metaScore -= 15;
  if (!canonicalHref) metaScore -= 10;
  if (!hasUtf8) metaScore -= 5;
  if (!langAttr) metaScore -= 5;
  if (missingOg.length > 0) metaScore -= Math.min(10, missingOg.length * 3);
  if (!faviconHref) metaScore -= 5;
  metaScore = Math.max(10, Math.min(100, metaScore));

  // Heading Score (out of 100)
  let headingScore = 100;
  if (h1Count === 0) headingScore -= 45;
  else if (h1Count > 1) headingScore -= 15;

  if (skippedLevelNotes.length > 0) headingScore -= Math.min(25, skippedLevelNotes.length * 10);
  if (emptyHeadingsCount > 0) headingScore -= Math.min(15, emptyHeadingsCount * 5);
  if (headingElements.length === 0) headingScore -= 30;
  headingScore = Math.max(10, Math.min(100, headingScore));

  // ==========================================
  // 4b. KEYWORD DENSITY ANALYSIS
  // ==========================================
  const keywordAnalysis = analyzeKeywordDensity(
    doc,
    titleContent || '',
    descContent || '',
    h1List[0] || '',
    headingItems.map((h) => h.text)
  );

  if (keywordAnalysis.hasKeywordStuffing) {
    issues.push({
      id: 'keyword-stuffing-risk',
      category: 'keywords',
      severity: 'warning',
      title: 'Potential Keyword Stuffing Detected',
      description: `Certain terms have an abnormally high density (>3.5%): ${keywordAnalysis.stuffingKeywords.join(', ')}.`,
      impact: 'Search engines may flag unnatural repetition as over-optimization or webspam.',
      recommendation: 'Diversify terminology with synonyms and semantic variations to maintain a natural density under 3%.',
    });
  } else if (keywordAnalysis.totalWords > 250) {
    issues.push({
      id: 'keyword-density-balanced',
      category: 'keywords',
      severity: 'passed',
      title: 'Healthy Keyword Distribution & Word Count',
      description: `Discovered ${keywordAnalysis.totalWords} words with balanced vocabulary and natural keyword distribution.`,
      impact: 'Provides sufficient content depth for modern semantic search algorithms.',
      recommendation: 'Continue maintaining natural keyword placement across headers and paragraphs.',
    });
  }

  // Performance & Technical Score (out of 100)
  let perfScore = 100;
  if (ttfbMs > 800) perfScore -= 20;
  else if (ttfbMs > 400) perfScore -= 8;

  if (rawHtmlSize > 150 * 1024) perfScore -= 15;
  else if (rawHtmlSize > 80 * 1024) perfScore -= 5;

  if (imgElements.length > 0) {
    const missingAltRatio = missingAltImages.length / imgElements.length;
    if (missingAltRatio > 0.5) perfScore -= 20;
    else if (missingAltRatio > 0.1) perfScore -= 10;
  }

  if (emptyAnchorCount > 0) perfScore -= Math.min(10, emptyAnchorCount * 3);
  if (brokenLinks.length > 0) perfScore -= Math.min(25, brokenLinks.length * 8);
  if (!isHttps) perfScore -= 25;
  perfScore = Math.max(10, Math.min(100, perfScore));

  // Overall Weighted Score (Meta 35%, Headings 35%, Performance 30%)
  const overallScore = Math.round(metaScore * 0.35 + headingScore * 0.35 + perfScore * 0.30);

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'B';
  let gradeColor = 'text-blue-600 bg-blue-50 border-blue-200';

  if (overallScore >= 95) {
    grade = 'A+';
    gradeColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800';
  } else if (overallScore >= 85) {
    grade = 'A';
    gradeColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800';
  } else if (overallScore >= 70) {
    grade = 'B';
    gradeColor = 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800';
  } else if (overallScore >= 55) {
    grade = 'C';
    gradeColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800';
  } else if (overallScore >= 40) {
    grade = 'D';
    gradeColor = 'text-orange-600 bg-orange-50 dark:bg-orange-950/60 border-orange-300 dark:border-orange-800';
  } else {
    grade = 'F';
    gradeColor = 'text-red-600 bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800';
  }

  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const passedCount = issues.filter((i) => i.severity === 'passed').length;

  // ==========================================
  // 5. GENERATE COMPLETE CLEAN <HEAD> CODE
  // ==========================================
  const cleanTitle = titleContent || 'Optimized Page Title | Primary Keyword';
  const cleanDesc = descContent || 'Provide a compelling 120-160 character meta description summarizing page value and call-to-action.';
  const cleanCanonical = canonicalHref || resolvedFinalUrl;
  const cleanOgImage = ogImage || 'https://yourdomain.com/og-image.jpg';

  const generatedFixHeadCode = `<!-- Recommended Clean SEO Head Tags Generated by FreeTools Hub -->
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${cleanTitle}</title>
<meta name="description" content="${cleanDesc}" />
<link rel="canonical" href="${cleanCanonical}" />
<meta name="robots" content="index, follow" />

<!-- OpenGraph Social Sharing (Facebook, LinkedIn, Discord) -->
<meta property="og:type" content="website" />
<meta property="og:title" content="${cleanTitle}" />
<meta property="og:description" content="${cleanDesc}" />
<meta property="og:image" content="${cleanOgImage}" />
<meta property="og:url" content="${cleanCanonical}" />

<!-- Twitter / X Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${cleanTitle}" />
<meta name="twitter:description" content="${cleanDesc}" />
<meta name="twitter:image" content="${cleanOgImage}" />

<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />

<!-- Structured Data (Schema.org JSON-LD) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "${cleanTitle}",
  "description": "${cleanDesc}",
  "url": "${cleanCanonical}"
}
</script>`;

  return {
    url: normalizedUrl,
    finalUrl: resolvedFinalUrl,
    isHttps,
    statusCode: 200,
    analyzedAt: new Date().toISOString(),
    sourceType,
    scores: {
      overall: overallScore,
      meta: metaScore,
      headings: headingScore,
      performance: perfScore,
      grade,
      gradeColor,
      criticalCount,
      warningCount,
      passedCount,
    },
    meta: {
      title: titleItem,
      description: descItem,
      viewport: viewportItem,
      canonical: canonicalItem,
      robots: robotsItem,
      charset: charsetItem,
      lang: langItem,
      openGraph: ogData,
      twitter: twitterData,
      favicon: faviconData,
      schemas: {
        count: schemaItems.length,
        items: schemaItems,
      },
    },
    headings: {
      h1Count,
      h1List,
      counts: headingCounts,
      items: headingItems,
      hasSkippedLevels: skippedLevelNotes.length > 0,
      skippedLevelNotes,
      emptyCount: emptyHeadingsCount,
      status: headingStatus,
    },
    performance: {
      ttfbMs,
      htmlSizeBytes: rawHtmlSize,
      domNodesCount: domNodes,
      compression: 'gzip',
      serverSoftware: 'Web Server',
      images: {
        total: imgElements.length,
        missingAltCount: missingAltImages.length,
        withDimensionsCount,
        withLazyCount,
        sampleMissingAlt: missingAltImages.slice(0, 10),
      },
      links: {
        total: linkElements.length,
        internalCount: internalLinksCount,
        externalCount: externalLinksCount,
        emptyAnchorCount,
      },
      resources: {
        scriptsCount,
        stylesheetsCount,
        inlineStylesCount,
      },
    },
    issues,
    internalLinksReport,
    keywords: keywordAnalysis,
    generatedFixHeadCode,
  };
}
