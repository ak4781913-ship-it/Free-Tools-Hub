export interface MetaTagItem {
  name: string;
  content: string | null;
  status: 'good' | 'warning' | 'error';
  message: string;
  length?: number;
  recommendedLength?: string;
}

export interface HeadingItem {
  level: number; // 1 for h1, 2 for h2, etc.
  tag: string;
  text: string;
  charLength: number;
  isEmpty: boolean;
  index: number;
  hasSkippedLevel?: boolean;
  skippedLevelNote?: string;
}

export interface OpenGraphData {
  title: string | null;
  description: string | null;
  image: string | null;
  imageAlt?: string | null;
  url: string | null;
  type: string | null;
  siteName: string | null;
  locale?: string | null;
  presentCount: number;
  missingTags: string[];
  status: 'good' | 'warning' | 'error';
}

export interface TwitterCardData {
  card: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  imageAlt?: string | null;
  site: string | null;
  creator: string | null;
  presentCount: number;
  missingTags: string[];
  status: 'good' | 'warning' | 'error';
}

export interface ImageAuditItem {
  src: string;
  alt: string | null;
  hasAlt: boolean;
  hasDimensions: boolean;
  isLazy: boolean;
}

export interface LinkAuditItem {
  href: string;
  text: string;
  isInternal: boolean;
  isEmptyText: boolean;
  isNoFollow: boolean;
}

export type LinkStatusType = 'ok' | 'broken' | 'redirect' | 'timeout' | 'checking' | 'untested';

export interface CrawledInternalLink {
  id: string;
  url: string; // Absolute resolved URL
  originalHref: string; // Raw href attribute on page
  anchorText: string;
  statusCode?: number; // 200, 404, 500, 301, etc.
  status: LinkStatusType;
  statusText?: string; // "200 OK", "404 Not Found", "500 Internal Error", etc.
  responseTimeMs?: number;
  occurrences: number; // how many times this link was found on the page
  error?: string;
  isNofollow: boolean;
  diagnosticTip?: string;
}

export interface InternalLinksReport {
  totalDiscovered: number;
  uniqueUrlsCount: number;
  crawledCount: number;
  okCount: number;
  brokenCount: number;
  redirectCount: number;
  links: CrawledInternalLink[];
  isCrawling: boolean;
  crawlProgress: number; // 0 to 100
  crawlCompleted: boolean;
}

export interface KeywordItem {
  keyword: string;
  count: number;
  density: number; // percentage, e.g. 2.15
  status: 'optimal' | 'low' | 'high';
  inTitle: boolean;
  inMetaDescription: boolean;
  inH1: boolean;
  inHeadings: boolean;
  inFirst100Words: boolean;
  wordCount: number; // 1, 2, or 3
}

export interface ContentBlockItem {
  tag: string; // 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'li'
  text: string;
  index: number;
}

export interface KeywordAnalysisData {
  totalWords: number;
  uniqueWords: number;
  readingTimeMinutes: number;
  topKeywords1: KeywordItem[];
  topKeywords2: KeywordItem[];
  topKeywords3: KeywordItem[];
  contentBlocks: ContentBlockItem[];
  rawVisibleText: string;
  hasKeywordStuffing: boolean;
  stuffingKeywords: string[];
}

export interface SchemaItem {
  type: string;
  rawJson: any;
}

export interface SeoIssue {
  id: string;
  category: 'meta' | 'headings' | 'performance' | 'security' | 'links' | 'keywords';
  severity: 'critical' | 'warning' | 'info' | 'passed';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  fixSnippet?: string;
}

export interface SeoAnalysisResult {
  url: string;
  finalUrl: string;
  isHttps: boolean;
  statusCode?: number;
  analyzedAt: string;
  sourceType: 'url' | 'html-paste' | 'demo';

  // Scores
  scores: {
    overall: number; // 0-100
    meta: number; // 0-100
    headings: number; // 0-100
    performance: number; // 0-100
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    gradeColor: string;
    criticalCount: number;
    warningCount: number;
    passedCount: number;
  };

  // Meta Tags
  meta: {
    title: MetaTagItem;
    description: MetaTagItem;
    viewport: MetaTagItem;
    canonical: MetaTagItem & { isSelfReferencing?: boolean };
    robots: MetaTagItem & { isNoIndex?: boolean; isNoFollow?: boolean };
    charset: MetaTagItem;
    lang: MetaTagItem;
    openGraph: OpenGraphData;
    twitter: TwitterCardData;
    favicon: { present: boolean; href: string | null; hasAppleTouchIcon: boolean };
    schemas: { count: number; items: SchemaItem[] };
  };

  // Headings
  headings: {
    h1Count: number;
    h1List: string[];
    counts: Record<string, number>; // h1: 1, h2: 4, etc.
    items: HeadingItem[];
    hasSkippedLevels: boolean;
    skippedLevelNotes: string[];
    emptyCount: number;
    status: 'good' | 'warning' | 'error';
  };

  // Performance & Technical
  performance: {
    ttfbMs: number;
    htmlSizeBytes: number;
    domNodesCount: number;
    compression: string | null;
    serverSoftware: string | null;
    images: {
      total: number;
      missingAltCount: number;
      withDimensionsCount: number;
      withLazyCount: number;
      sampleMissingAlt: ImageAuditItem[];
    };
    links: {
      total: number;
      internalCount: number;
      externalCount: number;
      emptyAnchorCount: number;
    };
    resources: {
      scriptsCount: number;
      stylesheetsCount: number;
      inlineStylesCount: number;
    };
  };

  // Issues and Actionable Fixes
  issues: SeoIssue[];

  // Internal Links & Broken Link Audit
  internalLinksReport: InternalLinksReport;

  // Keyword Density Analysis & Occurrences
  keywords: KeywordAnalysisData;

  // Audit Scope & Rendering Detection
  auditScope: string;
  isClientRenderedSpa: boolean;
  isRedirectResponse: boolean;
  renderingLimitationNote?: string;

  // Generated Clean Head Fix Code
  generatedFixHeadCode: string;
}
