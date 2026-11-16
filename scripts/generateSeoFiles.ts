/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_PRODUCTION_URL,
  NOT_FOUND_SEO,
  ORGANIZATION_NAME,
  SITE_NAME,
  STATIC_PAGES_SEO,
  getAllCanonicalSitemapEntries,
  sanitizePublicOrigin,
} from '../src/data/seoRegistry';
import { TOOLS_LIST } from '../src/data/tools';
import { TOOL_ROUTES } from '../src/data/toolsRouting';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public');
const NETLIFY_TOML_PATH = path.resolve(ROOT_DIR, 'netlify.toml');

const NETLIFY_REDIRECTS_BEGIN = '# BEGIN GENERATED REDIRECTS';
const NETLIFY_REDIRECTS_END = '# END GENERATED REDIRECTS';

const TOOL_SOURCE_PATHS: Record<string, string[]> = {
  'resume-builder': ['src/components/tools/ResumeBuilder'],
  'uae-gratuity': ['src/components/tools/UAEGratuity', 'src/utils/gratuityCalculator.ts'],
  'uae-salary-calculator': ['src/components/tools/UAESalary'],
  'gemini-photo-prompt': ['src/components/tools/GeminiPhotoPrompt'],
  'ai-video-prompt': ['src/components/tools/AIVideoPrompt'],
  'markdown-editor': ['src/components/tools/MarkdownEditor'],
  'seo-page-analyzer': ['src/components/tools/SeoPageAnalyzer'],
  'seo-meta-generator': ['src/components/tools/SeoMetaGenerator'],
  'word-counter': ['src/components/tools/WordCounter'],
  'text-case-converter': ['src/components/tools/TextCaseConverter'],
  'image-compressor': ['src/components/tools/ImageCompressor'],
  'qr-generator': ['src/components/tools/QRCodeGenerator'],
  'color-picker': ['src/components/tools/ColorPicker'],
  'loan-calculator': ['src/components/tools/LoanCalculator'],
  'currency-converter': ['src/components/tools/CurrencyConverter'],
  'crypto-converter': ['src/components/tools/CryptoConverter'],
  'percentage-calculator': ['src/components/tools/PercentageCalculator'],
  'discount-calculator': ['src/components/tools/DiscountCalculator'],
  'unit-converter': ['src/components/tools/UnitConverter'],
  'password-generator': ['src/components/tools/PasswordGenerator'],
  'password-strength': ['src/components/tools/PasswordStrength'],
  'age-calculator': ['src/components/tools/AgeCalculator'],
  'date-difference': ['src/components/tools/DateDifference'],
  'bmi-calculator': ['src/components/tools/BMICalculator'],
  'timezone-converter': ['src/components/tools/TimeZoneConverter'],
  'json-formatter': ['src/components/tools/JsonFormatter'],
  'base64-converter': ['src/components/tools/Base64Converter'],
  'pdf-tools-suite': ['src/components/tools/PdfToolsSuite'],
};

const STATIC_PAGE_SOURCE_PATHS: Record<string, string[]> = {
  '/': ['src/App.tsx', 'src/components/home', 'src/data/seoRegistry.ts'],
  '/tools': ['src/components/pages/ToolsDirectoryPage.tsx', 'src/data/tools.ts', 'src/data/toolsRouting.ts'],
  '/about': ['src/components/pages/TrustPages.tsx'],
  '/contact': ['src/components/pages/TrustPages.tsx'],
  '/privacy': ['src/components/pages/TrustPages.tsx'],
  '/terms': ['src/components/pages/TrustPages.tsx'],
  '/disclaimer': ['src/components/pages/TrustPages.tsx'],
};

/**
 * Resolves authentic per-route modification dates (YYYY-MM-DD) from full Git history.
 * Returns an empty map when Git history is unavailable or shallow so build scripts
 * omit <lastmod> rather than falsely stamping the build date across every URL.
 */
export function resolveRouteLastmodMap(): Map<string, string> {
  const result = new Map<string, string>();
  try {
    const insideGit = execFileSync('git', ['rev-parse', '--is-inside-work-tree'], {
      cwd: ROOT_DIR,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8',
    }).trim();
    if (insideGit !== 'true') {
      return result;
    }

    const isShallow = execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
      cwd: ROOT_DIR,
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf-8',
    }).trim();
    if (isShallow === 'true') {
      return result;
    }

    const queryLastmodForPaths = (paths: string[]): string | undefined => {
      if (paths.length === 0) return undefined;
      try {
        const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...paths], {
          cwd: ROOT_DIR,
          stdio: ['ignore', 'pipe', 'ignore'],
          encoding: 'utf-8',
        }).trim();
        return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : undefined;
      } catch {
        return undefined;
      }
    };

    for (const page of STATIC_PAGES_SEO) {
      const dateStr = queryLastmodForPaths(STATIC_PAGE_SOURCE_PATHS[page.path] || []);
      if (dateStr) {
        result.set(page.path, dateStr);
      }
    }

    for (const route of Object.values(TOOL_ROUTES)) {
      const dateStr = queryLastmodForPaths(TOOL_SOURCE_PATHS[route.id] || []);
      if (dateStr) {
        result.set(route.primaryPath, dateStr);
      }
    }
  } catch {
    // Git not available in container environment — omit lastmod rather than fabricating build timestamps.
  }
  return result;
}

export function resolveBuildBaseUrl(): string {
  const candidates = [
    process.env.VITE_SITE_URL,
    process.env.SITE_URL,
    process.env.URL, // Automatically set by Netlify during production builds
    process.env.DEPLOY_PRIME_URL,
    process.env.APP_URL,
  ];
  for (const candidate of candidates) {
    const sanitized = sanitizePublicOrigin(candidate);
    if (sanitized) return sanitized;
  }
  return DEFAULT_PRODUCTION_URL;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildSitemapXml(
  baseUrl: string,
  lastmodByPath?: ReadonlyMap<string, string>
): string {
  const entries = getAllCanonicalSitemapEntries(baseUrl, lastmodByPath);
  const xmlUrls = entries
    .map((entry) => {
      const lines = ['  <url>', `    <loc>${escapeXml(entry.loc)}</loc>`];
      if (entry.lastmod) {
        lines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
      }
      lines.push(
        `    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`,
        `    <priority>${escapeXml(entry.priority)}</priority>`,
        '  </url>'
      );
      return lines.join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlUrls}\n</urlset>\n`;
}

export function buildRobotsTxt(baseUrl: string): string {
  const cleanBase = (sanitizePublicOrigin(baseUrl) || DEFAULT_PRODUCTION_URL).replace(/\/+$/, '');
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /.netlify/',
    '',
    `Sitemap: ${cleanBase}/sitemap.xml`,
    '',
  ].join('\n');
}

export function build404Html(baseUrl: string): string {
  const cleanBase = (sanitizePublicOrigin(baseUrl) || DEFAULT_PRODUCTION_URL).replace(/\/+$/, '');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(NOT_FOUND_SEO.title)}</title>
    <meta name="description" content="${escapeHtml(NOT_FOUND_SEO.description)}" />
    <meta name="robots" content="noindex, follow" />
    <meta name="theme-color" content="#1d4ed8" />
    <link rel="icon" type="image/svg+xml" href="/icon.svg" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />
    <meta property="og:title" content="${escapeHtml(NOT_FOUND_SEO.title)}" />
    <meta property="og:description" content="${escapeHtml(NOT_FOUND_SEO.description)}" />
    <meta property="og:image" content="${escapeHtml(cleanBase)}/og-image.png" />
    <style>
      :root { color-scheme: light dark; }
      body {
        margin: 0;
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #f8fafc;
        color: #0f172a;
        display: flex;
        min-height: 100vh;
        flex-direction: column;
      }
      @media (prefers-color-scheme: dark) {
        body { background: #020617; color: #f8fafc; }
        .card { background: #0f172a !important; border-color: #1e293b !important; }
        .muted { color: #94a3b8 !important; }
        .btn-sec { background: #1e293b !important; color: #e2e8f0 !important; border-color: #334155 !important; }
      }
      main {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem 1rem;
      }
      .card {
        max-width: 560px;
        width: 100%;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 1.25rem;
        padding: 2.5rem 2rem;
        text-align: center;
        box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08);
      }
      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 4rem;
        height: 4rem;
        border-radius: 1rem;
        background: #eff6ff;
        color: #1d4ed8;
        font-weight: 800;
        font-size: 1.5rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        margin-bottom: 1.25rem;
      }
      h1 { margin: 0 0 0.75rem; font-size: 1.75rem; font-weight: 800; line-height: 1.25; }
      .muted { color: #475569; font-size: 0.95rem; line-height: 1.6; margin: 0 0 1.75rem; }
      .actions { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; }
      .btn {
        display: inline-block;
        padding: 0.7rem 1.25rem;
        border-radius: 0.75rem;
        font-size: 0.875rem;
        font-weight: 700;
        text-decoration: none;
      }
      .btn-pri { background: #1d4ed8; color: #ffffff; }
      .btn-sec { background: #f1f5f9; color: #1e293b; border: 1px solid #cbd5e1; }
      .links {
        margin-top: 2rem;
        padding-top: 1.25rem;
        border-top: 1px solid #e2e8f0;
        font-size: 0.85rem;
      }
      .links a { color: #1d4ed8; text-decoration: none; font-weight: 600; margin: 0 0.5rem; }
    </style>
  </head>
  <body>
    <main>
      <div class="card">
        <div class="badge" aria-hidden="true">404</div>
        <h1>Page or Tool Not Found</h1>
        <p class="muted">
          The page you requested may have moved or does not exist at this URL. Explore all ${TOOLS_LIST.length} free browser-based tools and calculators below.
        </p>
        <div class="actions">
          <a class="btn btn-pri" href="/tools">Browse All ${TOOLS_LIST.length} Tools</a>
          <a class="btn btn-sec" href="/">Back to Homepage</a>
        </div>
        <nav class="links" aria-label="Popular Tools">
          <a href="/tools/pdf-tools-suite">PDF Tools Suite</a>
          <a href="/tools/cv-maker">CV Maker</a>
          <a href="/tools/uae-gratuity-calculator">UAE Gratuity</a>
          <a href="/tools/uae-salary-calculator">UAE Salary</a>
        </nav>
      </div>
    </main>
  </body>
</html>
`;
}

export function buildWebManifestJson(): string {
  const manifest = {
    id: '/',
    name: `${SITE_NAME} – Free CV Generator, UAE Gratuity, AI Prompts & Utilities`,
    short_name: 'FreeTools',
    description:
      'Free PDF Tools Suite (43 tools), ATS CV maker, UAE salary & gratuity calculators, AI prompt builders, and privacy-first online tools that work offline.',
    theme_color: '#1d4ed8',
    background_color: '#0f172a',
    display: 'standalone',
    start_url: '/',
    scope: '/',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function buildRedirectsTxt(): string {
  const aliasLines: string[] = [
    `# ${ORGANIZATION_NAME} · ${SITE_NAME} - Generated Single-Source-of-Truth Routing Rules`,
    '',
    '# 1. 301 Permanent Redirects for Legacy Tool Aliases',
  ];

  for (const route of Object.values(TOOL_ROUTES)) {
    for (const alias of route.aliases) {
      if (alias === route.primarySlug) continue;
      aliasLines.push(`/tools/${alias}  ${route.primaryPath}  301!`);
    }
  }

  aliasLines.push('', '# 2. 301 Trailing-Slash Canonicalization for Public Subpages');
  const subStaticPages = STATIC_PAGES_SEO.filter((p) => p.slug !== '');
  for (const page of subStaticPages) {
    aliasLines.push(`${page.path}/  ${page.path}  301!`);
  }
  for (const route of Object.values(TOOL_ROUTES)) {
    aliasLines.push(`${route.primaryPath}/  ${route.primaryPath}  301!`);
  }

  aliasLines.push('', '# 3. 200 OK Direct Serves for Prerendered Flat HTML Subpages');
  for (const page of subStaticPages) {
    aliasLines.push(`${page.path}  /${page.slug}.html  200!`);
  }
  for (const route of Object.values(TOOL_ROUTES)) {
    aliasLines.push(`${route.primaryPath}  /tools/${route.primarySlug}.html  200!`);
  }

  aliasLines.push(
    '',
    '# 4. Custom 404 for Non-Existent Routes (prevents Soft 404 indexing)',
    '/*  /404.html  404',
    ''
  );

  return aliasLines.join('\n');
}

export function buildNetlifyRedirectsSection(): string {
  const blocks: string[] = [
    NETLIFY_REDIRECTS_BEGIN,
    '# Auto-generated from src/data/toolsRouting.ts & src/data/seoRegistry.ts by scripts/generateSeoFiles.ts',
    '',
    '# 1. 301 Permanent Redirects for legacy tool aliases',
  ];

  for (const route of Object.values(TOOL_ROUTES)) {
    for (const alias of route.aliases) {
      if (alias === route.primarySlug) continue;
      blocks.push(
        `[[redirects]]`,
        `  from = "/tools/${alias}"`,
        `  to = "${route.primaryPath}"`,
        `  status = 301`,
        `  force = true`,
        ''
      );
    }
  }

  blocks.push('# 2. 301 Trailing-Slash Canonicalization for Public Subpages');
  const subStaticPages = STATIC_PAGES_SEO.filter((p) => p.slug !== '');
  for (const page of subStaticPages) {
    blocks.push(
      `[[redirects]]`,
      `  from = "${page.path}/"`,
      `  to = "${page.path}"`,
      `  status = 301`,
      `  force = true`,
      ''
    );
  }
  for (const route of Object.values(TOOL_ROUTES)) {
    blocks.push(
      `[[redirects]]`,
      `  from = "${route.primaryPath}/"`,
      `  to = "${route.primaryPath}"`,
      `  status = 301`,
      `  force = true`,
      ''
    );
  }

  blocks.push(
    '# 3. Route API endpoints to Netlify Functions (strictly evaluated before catch-all 404)',
    `[[redirects]]`,
    `  from = "/api/analyze-seo"`,
    `  to = "/.netlify/functions/analyze-seo"`,
    `  status = 200`,
    `  force = true`,
    ''
  );

  blocks.push('# 4. Direct 200 OK serves for prerendered flat HTML subpages (eliminates folder 301 redirects)');
  for (const page of subStaticPages) {
    blocks.push(
      `[[redirects]]`,
      `  from = "${page.path}"`,
      `  to = "/${page.slug}.html"`,
      `  status = 200`,
      `  force = true`,
      ''
    );
  }
  for (const route of Object.values(TOOL_ROUTES)) {
    blocks.push(
      `[[redirects]]`,
      `  from = "${route.primaryPath}"`,
      `  to = "/tools/${route.primarySlug}.html"`,
      `  status = 200`,
      `  force = true`,
      ''
    );
  }

  blocks.push(
    '# 5. Custom 404 fallback for unknown routes (prevents Soft 404 indexing)',
    `[[redirects]]`,
    `  from = "/*"`,
    `  to = "/404.html"`,
    `  status = 404`,
    NETLIFY_REDIRECTS_END
  );

  return blocks.join('\n');
}

export function syncNetlifyTomlRedirects(): boolean {
  if (!fs.existsSync(NETLIFY_TOML_PATH)) return false;
  const current = fs.readFileSync(NETLIFY_TOML_PATH, 'utf-8');
  const startIdx = current.indexOf(NETLIFY_REDIRECTS_BEGIN);
  const endIdx = current.indexOf(NETLIFY_REDIRECTS_END);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    return false;
  }
  const generatedBlock = buildNetlifyRedirectsSection();
  const updated =
    current.slice(0, startIdx) +
    generatedBlock +
    current.slice(endIdx + NETLIFY_REDIRECTS_END.length);
  if (updated !== current) {
    fs.writeFileSync(NETLIFY_TOML_PATH, updated, 'utf-8');
    return true;
  }
  return false;
}

export function generateSeoFilesToDirectory(targetDir: string): {
  urlCount: number;
  baseUrl: string;
  lastmodCount: number;
} {
  fs.mkdirSync(targetDir, { recursive: true });
  const baseUrl = resolveBuildBaseUrl();
  const lastmodMap = resolveRouteLastmodMap();

  const sitemapXml = buildSitemapXml(baseUrl, lastmodMap);
  const robotsTxt = buildRobotsTxt(baseUrl);
  const notFoundHtml = build404Html(baseUrl);
  const manifestJson = buildWebManifestJson();
  const redirectsTxt = buildRedirectsTxt();

  fs.writeFileSync(path.resolve(targetDir, 'sitemap.xml'), sitemapXml, 'utf-8');
  fs.writeFileSync(path.resolve(targetDir, 'robots.txt'), robotsTxt, 'utf-8');
  fs.writeFileSync(path.resolve(targetDir, '404.html'), notFoundHtml, 'utf-8');
  fs.writeFileSync(path.resolve(targetDir, 'site.webmanifest'), manifestJson, 'utf-8');
  fs.writeFileSync(path.resolve(targetDir, '_redirects'), redirectsTxt, 'utf-8');

  syncNetlifyTomlRedirects();

  const urlCount = (sitemapXml.match(/<url>/g) || []).length;
  return { urlCount, baseUrl, lastmodCount: lastmodMap.size };
}

if (process.argv[1] && process.argv[1].endsWith('generateSeoFiles.ts')) {
  const result = generateSeoFilesToDirectory(PUBLIC_DIR);
  const lastmodLabel =
    result.lastmodCount > 0
      ? `${result.lastmodCount} route-specific git dates`
      : 'lastmod omitted (no git history in build env)';
  console.log(
    `[SEO Generator] ✓ Generated sitemap.xml (${result.urlCount} URLs, ${lastmodLabel}), robots.txt, 404.html, site.webmanifest, _redirects, and synced netlify.toml for ${result.baseUrl}`
  );
}
