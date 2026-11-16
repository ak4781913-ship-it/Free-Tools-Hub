/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TOOLS_LIST } from './tools';
import { TOOL_ROUTES, ToolRouteConfig, findToolBySlugOrId } from './toolsRouting';

export const DEFAULT_PRODUCTION_URL = 'https://freetoolshub1.netlify.app';
export const SITE_NAME = 'FreeTools Hub';
export const ORGANIZATION_NAME = 'NEXORA';
export const ORGANIZATION_ALTERNATE_NAMES = [
  'FreeTools Hub',
  'NEXORA FreeTools Hub',
  'Free Tools Hub',
];

export const OG_IMAGE_PATH = '/og-image.png';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_ALT = 'FreeTools Hub – Free Online Tools, PDF Suite & UAE Calculators';

export interface FaqItem {
  q: string;
  a: string;
}

/**
 * Shared visible FAQs for FAQSection.tsx AND Homepage FAQPage JSON-LD schema
 * so structured data matches visible page content 100%.
 */
export const HOMEPAGE_FAQS: FaqItem[] = [
  {
    q: 'Are these tools completely free to use?',
    a: 'Yes, 100% free. FreeTools Hub does not require registration, login, credit cards, or hidden subscription plans. You have unlimited access to all utilities including the PDF Tools Suite, CV Generator, UAE Gratuity Calculator, and AI Prompt Builders.',
  },
  {
    q: 'Is my personal data or CV uploaded to your servers?',
    a: 'No. FreeTools Hub prioritizes privacy. Your resume data, salary inputs, PDF documents, text conversions, and uploaded images are processed entirely on your local machine within your web browser memory. No data is stored or logged on remote servers.',
  },
  {
    q: 'How accurate is the UAE Gratuity Calculator?',
    a: 'The calculation strictly mirrors UAE Federal Decree-Law No. 33 of 2021 (in force from February 2, 2022). It handles the statutory 21-day tier (years 1-5), 30-day tier (years 5+), pro-rata calculation on working days, and the mandatory 24-month basic salary maximum cap. It also supports historical Law No. 8 of 1980 rules for reference. Note that results are estimates and final settlements are governed by MOHRE or applicable Free Zone authorities.',
  },
  {
    q: 'Can I export my resume as a PDF?',
    a: 'Yes. Our CV Generator produces print-ready A4 documents with precise typography and margin containment. You can download directly as an ATS-compatible Vector PDF or export your resume data as JSON backup to reload anytime.',
  },
  {
    q: 'How does the Gemini Photo Prompt Generator preserve face likeness?',
    a: 'When you activate "Reference Image Identity Preservation Mode", the generator formulates strict directive modifiers instructing multimodal AI models (such as Gemini 2.5 / Imagen / Midjourney v6) to maintain the exact facial bone structure, eyes, and likeness of your reference photo while changing only the requested wardrobe, background, or lighting.',
  },
  {
    q: 'Does FreeTools Hub support Urdu and Right-to-Left (RTL) reading?',
    a: 'Yes. You can switch between English and Urdu with a single click at the top bar. The application automatically configures RTL direction, input alignments, and translated labels without clearing any data you have already entered.',
  },
];

export interface StaticPageSeoConfig {
  path: string;
  slug: string;
  title: string;
  description: string;
  h1: string;
  summary: string;
  schemaType: 'WebSite' | 'CollectionPage' | 'AboutPage' | 'ContactPage' | 'WebPage';
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
}

export const STATIC_PAGES_SEO: StaticPageSeoConfig[] = [
  {
    path: '/',
    slug: '',
    title: 'FreeTools Hub – Free Online Tools & UAE Calculators',
    description: `FreeTools Hub offers ${TOOLS_LIST.length} free privacy-first online tools, including a 43-tool PDF Suite, ATS CV maker, UAE gratuity & salary calculators, and AI prompts.`,
    h1: 'Free Online Tools, PDF Suite & UAE Calculators',
    summary: `FreeTools Hub provides ${TOOLS_LIST.length} professional, privacy-first browser utilities for PDF processing, career documents, UAE labor law estimates, AI prompt engineering, and everyday productivity.`,
    schemaType: 'WebSite',
    changefreq: 'weekly',
    priority: '1.0',
  },
  {
    path: '/tools',
    slug: 'tools',
    title: `All ${TOOLS_LIST.length} Free Online Tools & Calculators | FreeTools Hub`,
    description: `Browse all ${TOOLS_LIST.length} FreeTools Hub utilities: PDF Tools Suite (43 tools), ATS CV maker, UAE salary & gratuity calculators, AI prompts, SEO audit, and dev tools.`,
    h1: `All ${TOOLS_LIST.length} Free Online Tools & Calculators`,
    summary: `Explore all ${TOOLS_LIST.length} browser-based utilities built for PDF workflows, career development, UAE payroll compliance, AI prompt engineering, and software productivity.`,
    schemaType: 'CollectionPage',
    changefreq: 'weekly',
    priority: '0.9',
  },
  {
    path: '/about',
    slug: 'about',
    title: 'About FreeTools Hub – Privacy & Architecture | NEXORA',
    description: 'Learn how NEXORA builds FreeTools Hub: fast, browser-based career, PDF, UAE financial, AI prompt, and developer tools with client-side privacy.',
    h1: 'About FreeTools Hub by NEXORA',
    summary: 'FreeTools Hub is engineered and published by NEXORA with a privacy-first client-side architecture so calculations, PDF processing, and document generation run locally in your browser.',
    schemaType: 'AboutPage',
    changefreq: 'monthly',
    priority: '0.7',
  },
  {
    path: '/contact',
    slug: 'contact',
    title: 'Contact & Support – FreeTools Hub | NEXORA',
    description: 'Contact NEXORA / FreeTools Hub to report calculation issues, suggest new browser tools, or share technical feedback.',
    h1: 'Contact FreeTools Hub & Support',
    summary: 'Have feedback, found a bug in a calculation or PDF workflow, or want to request a new productivity utility? Send your feedback directly to our engineering team.',
    schemaType: 'ContactPage',
    changefreq: 'monthly',
    priority: '0.7',
  },
  {
    path: '/privacy',
    slug: 'privacy',
    title: 'Privacy Policy – Client-Side Data | FreeTools Hub',
    description: 'Read the FreeTools Hub Privacy Policy explaining how resume drafts, UAE salary inputs, PDFs, and images stay locally inside your browser.',
    h1: 'Privacy Policy',
    summary: 'Your privacy is guaranteed by architecture. FreeTools Hub does not upload or store resume drafts, financial inputs, photos, or processed PDFs on remote user servers.',
    schemaType: 'WebPage',
    changefreq: 'yearly',
    priority: '0.5',
  },
  {
    path: '/terms',
    slug: 'terms',
    title: 'Terms of Use – FreeTools Hub | NEXORA',
    description: 'Review the FreeTools Hub Terms of Use covering free personal and commercial usage, user output ownership, and acceptable conduct.',
    h1: 'Terms of Use',
    summary: 'By accessing FreeTools Hub, you agree to fair and lawful usage. All CVs, PDFs, prompts, and exported outputs generated on your device remain 100% your own property.',
    schemaType: 'WebPage',
    changefreq: 'yearly',
    priority: '0.5',
  },
  {
    path: '/disclaimer',
    slug: 'disclaimer',
    title: 'Legal & Calculator Disclaimers | FreeTools Hub',
    description: 'Important informational disclaimers for UAE Gratuity, UAE Salary, Loan EMI, Currency/Crypto, BMI, and AI Prompt calculators on FreeTools Hub.',
    h1: 'Legal & Calculator Disclaimers',
    summary: 'All calculators and estimators on FreeTools Hub are provided strictly for informational and planning purposes and do not constitute formal legal, financial, or medical advice.',
    schemaType: 'WebPage',
    changefreq: 'yearly',
    priority: '0.5',
  },
];

export const NOT_FOUND_SEO = {
  title: 'Page Not Found (404) | FreeTools Hub',
  description: 'The requested page or tool could not be found on FreeTools Hub. Browse all 28 free online tools and calculators.',
  robots: 'noindex, follow' as const,
};

const STATIC_PAGE_BY_PATH = new Map<string, StaticPageSeoConfig>(
  STATIC_PAGES_SEO.map((page) => [page.path, page])
);

const HIGH_PRIORITY_TOOL_SLUGS = new Set([
  'pdf-tools-suite',
  'cv-maker',
  'uae-gratuity-calculator',
  'uae-salary-calculator',
  'ai-photo-prompt-generator',
  'ai-video-prompt-generator',
  'seo-page-analyzer',
]);

export function sanitizePublicOrigin(candidate?: string | null): string {
  const raw = (candidate || '').trim();
  if (
    !raw ||
    !/^https?:\/\//i.test(raw) ||
    raw.includes('MY_APP_URL') ||
    raw.includes('YOUR-DOMAIN')
  ) {
    return '';
  }
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    if (
      !host ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.endsWith('.localhost') ||
      host.endsWith('.local') ||
      host.endsWith('.run.app')
    ) {
      return '';
    }
    return `${parsed.protocol}//${parsed.host}`.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

export function normalizeSeoPathname(rawPath: string): string {
  const withoutQuery = (rawPath || '/').split('?')[0].split('#')[0];
  if (!withoutQuery || withoutQuery === '/') return '/';
  const trimmed = withoutQuery.endsWith('/') && withoutQuery.length > 1
    ? withoutQuery.slice(0, -1)
    : withoutQuery;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export interface SitemapUrlEntry {
  path: string;
  loc: string;
  lastmod?: string;
  changefreq: string;
  priority: string;
}

/**
 * Single authoritative generator of canonical, indexable public URLs for sitemap.xml.
 * Automatically picks up all static routes in STATIC_PAGES_SEO and all canonical tool routes in TOOL_ROUTES.
 * Excludes aliases, /api/*, /.netlify/*, /404, and query-parameter URLs.
 * Emits route-specific lastmod only when verified; omits lastmod when unavailable.
 */
export function getAllCanonicalSitemapEntries(
  baseUrl: string = DEFAULT_PRODUCTION_URL,
  lastmodByPath?: ReadonlyMap<string, string>
): SitemapUrlEntry[] {
  const cleanBase = (sanitizePublicOrigin(baseUrl) || DEFAULT_PRODUCTION_URL).replace(/\/+$/, '');
  const seenPaths = new Set<string>();
  const entries: SitemapUrlEntry[] = [];

  for (const page of STATIC_PAGES_SEO) {
    if (seenPaths.has(page.path)) continue;
    seenPaths.add(page.path);
    const routeLastmod = lastmodByPath?.get(page.path);
    entries.push({
      path: page.path,
      loc: page.path === '/' ? `${cleanBase}/` : `${cleanBase}${page.path}`,
      ...(routeLastmod ? { lastmod: routeLastmod } : {}),
      changefreq: page.changefreq,
      priority: page.priority,
    });
  }

  for (const route of Object.values(TOOL_ROUTES)) {
    const toolPath = route.primaryPath;
    if (!toolPath || !toolPath.startsWith('/tools/') || toolPath.includes('?')) continue;
    if (seenPaths.has(toolPath)) continue;
    seenPaths.add(toolPath);
    const routeLastmod = lastmodByPath?.get(toolPath);
    entries.push({
      path: toolPath,
      loc: `${cleanBase}${toolPath}`,
      ...(routeLastmod ? { lastmod: routeLastmod } : {}),
      changefreq: HIGH_PRIORITY_TOOL_SLUGS.has(route.primarySlug) ? 'weekly' : 'monthly',
      priority: HIGH_PRIORITY_TOOL_SLUGS.has(route.primarySlug) ? '0.9' : '0.8',
    });
  }

  return entries;
}

/**
 * Builds an alias -> canonical path map for server & Netlify redirect validation.
 */
export function getLegacyAliasMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const route of Object.values(TOOL_ROUTES)) {
    for (const alias of route.aliases) {
      const lower = alias.toLowerCase();
      if (lower !== route.primarySlug.toLowerCase()) {
        map.set(lower, route.primaryPath);
      }
    }
  }
  return map;
}

export function classifyPublicRoute(rawPathname: string): {
  status: 200 | 301 | 404;
  cleanPath: string;
  redirectTo?: string;
  toolRoute?: ToolRouteConfig;
  staticPage?: StaticPageSeoConfig;
} {
  const cleanPath = normalizeSeoPathname(rawPathname);

  const staticPage = STATIC_PAGE_BY_PATH.get(cleanPath);
  if (staticPage) {
    return { status: 200, cleanPath, staticPage };
  }

  if (cleanPath.startsWith('/tools/')) {
    const slug = cleanPath.slice('/tools/'.length);
    if (!slug || slug.includes('/')) {
      return { status: 404, cleanPath };
    }
    const matched = findToolBySlugOrId(slug);
    if (matched) {
      if (cleanPath.toLowerCase() !== matched.primaryPath.toLowerCase()) {
        return {
          status: 301,
          cleanPath,
          redirectTo: matched.primaryPath,
          toolRoute: matched,
        };
      }
      return {
        status: 200,
        cleanPath: matched.primaryPath,
        toolRoute: matched,
      };
    }
  }

  return { status: 404, cleanPath };
}

export function getOrganizationSchema(baseUrl: string): Record<string, unknown> {
  const cleanBase = (sanitizePublicOrigin(baseUrl) || DEFAULT_PRODUCTION_URL).replace(/\/+$/, '');
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${cleanBase}/#organization`,
    name: ORGANIZATION_NAME,
    alternateName: ORGANIZATION_ALTERNATE_NAMES,
    url: `${cleanBase}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${cleanBase}/pwa-512x512.png`,
      width: 512,
      height: 512,
    },
  };
}

export function buildJsonLdForPath(
  rawPathname: string,
  baseUrl: string = DEFAULT_PRODUCTION_URL
): Record<string, unknown>[] | undefined {
  const cleanBase = (sanitizePublicOrigin(baseUrl) || DEFAULT_PRODUCTION_URL).replace(/\/+$/, '');
  const classified = classifyPublicRoute(rawPathname);
  if (classified.status === 404) {
    return undefined;
  }

  const targetPath = classified.redirectTo || classified.cleanPath;

  if (targetPath === '/') {
    const homepage = STATIC_PAGE_BY_PATH.get('/')!;
    return [
      getOrganizationSchema(cleanBase),
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${cleanBase}/#website`,
        name: SITE_NAME,
        alternateName: ORGANIZATION_ALTERNATE_NAMES,
        url: `${cleanBase}/`,
        description: homepage.description,
        publisher: {
          '@id': `${cleanBase}/#organization`,
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${cleanBase}/tools?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: homepage.title,
        url: `${cleanBase}/`,
        description: homepage.description,
        isPartOf: {
          '@id': `${cleanBase}/#website`,
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'FreeTools Hub Complete Tool Suite',
        description: `Directory of ${TOOLS_LIST.length} free browser-based utilities and calculators.`,
        numberOfItems: TOOLS_LIST.length,
        itemListElement: Object.values(TOOL_ROUTES).map((route, idx) => {
          const tool = TOOLS_LIST.find((t) => t.id === route.id);
          return {
            '@type': 'ListItem',
            position: idx + 1,
            name: tool?.name || route.primarySlug,
            url: `${cleanBase}${route.primaryPath}`,
          };
        }),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: HOMEPAGE_FAQS.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a,
          },
        })),
      },
    ];
  }

  if (classified.toolRoute) {
    const route = classified.toolRoute;
    const tool = TOOLS_LIST.find((t) => t.id === route.id);
    const toolName = tool?.name || route.primarySlug;
    const toolUrl = `${cleanBase}${route.primaryPath}`;

    return [
      getOrganizationSchema(cleanBase),
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: toolName,
        ...(tool?.nameUrdu ? { alternateName: tool.nameUrdu } : {}),
        url: toolUrl,
        description: route.seoDescription,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any (Web Browser)',
        browserRequirements: 'Requires JavaScript and modern HTML5 support.',
        isAccessibleForFree: true,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        publisher: {
          '@id': `${cleanBase}/#organization`,
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${cleanBase}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'All Tools',
            item: `${cleanBase}/tools`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: toolName,
            item: toolUrl,
          },
        ],
      },
    ];
  }

  if (classified.staticPage) {
    const page = classified.staticPage;
    const pageUrl = `${cleanBase}${page.path}`;
    const schemas: Record<string, unknown>[] = [
      getOrganizationSchema(cleanBase),
      {
        '@context': 'https://schema.org',
        '@type': page.schemaType,
        name: page.h1,
        url: pageUrl,
        description: page.description,
        isPartOf: {
          '@id': `${cleanBase}/#website`,
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${cleanBase}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: page.h1,
            item: pageUrl,
          },
        ],
      },
    ];

    if (page.path === '/tools') {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'All FreeTools Hub Utilities',
        numberOfItems: TOOLS_LIST.length,
        itemListElement: Object.values(TOOL_ROUTES).map((route, idx) => {
          const tool = TOOLS_LIST.find((t) => t.id === route.id);
          return {
            '@type': 'ListItem',
            position: idx + 1,
            name: tool?.name || route.primarySlug,
            url: `${cleanBase}${route.primaryPath}`,
          };
        }),
      });
    }

    return schemas;
  }

  return undefined;
}

export function getRouteSeoForPath(
  rawPathname: string,
  baseUrl: string = DEFAULT_PRODUCTION_URL
): {
  title: string;
  description: string;
  canonicalPath?: string;
  robots: 'index, follow' | 'noindex, follow';
  ogType: 'website';
  jsonLd?: Record<string, unknown>[];
  status: 200 | 301 | 404;
} {
  const classified = classifyPublicRoute(rawPathname);

  if (classified.status === 404) {
    return {
      title: NOT_FOUND_SEO.title,
      description: NOT_FOUND_SEO.description,
      robots: 'noindex, follow',
      ogType: 'website',
      status: 404,
    };
  }

  if (classified.toolRoute) {
    return {
      title: classified.toolRoute.seoTitle,
      description: classified.toolRoute.seoDescription,
      canonicalPath: classified.toolRoute.primaryPath,
      robots: 'index, follow',
      ogType: 'website',
      jsonLd: buildJsonLdForPath(classified.toolRoute.primaryPath, baseUrl),
      status: classified.status,
    };
  }

  if (classified.staticPage) {
    return {
      title: classified.staticPage.title,
      description: classified.staticPage.description,
      canonicalPath: classified.staticPage.path,
      robots: 'index, follow',
      ogType: 'website',
      jsonLd: buildJsonLdForPath(classified.staticPage.path, baseUrl),
      status: 200,
    };
  }

  return {
    title: NOT_FOUND_SEO.title,
    description: NOT_FOUND_SEO.description,
    robots: 'noindex, follow',
    ogType: 'website',
    status: 404,
  };
}
