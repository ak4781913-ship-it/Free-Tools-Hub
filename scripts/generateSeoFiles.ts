/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_PRODUCTION_URL,
  NOT_FOUND_SEO,
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

export function resolveBuildBaseUrl(): string {
  const candidates = [
    process.env.VITE_SITE_URL,
    process.env.SITE_URL,
    process.env.URL, // Automatically set by Netlify during production builds
    process.env.DEPLOY_PRIME_URL,
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

export function buildSitemapXml(baseUrl: string, lastmod: string): string {
  const entries = getAllCanonicalSitemapEntries(baseUrl, lastmod);
  const xmlUrls = entries
    .map((entry) =>
      [
        '  <url>',
        `    <loc>${escapeXml(entry.loc)}</loc>`,
        `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`,
        `    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`,
        `    <priority>${escapeXml(entry.priority)}</priority>`,
        '  </url>',
      ].join('\n')
    )
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
    name: 'FreeTools Hub – Free CV Generator, UAE Gratuity, AI Prompts & Utilities',
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
    '# AbbasPro FreeTools Hub - URL Redirects & Prerendered HTML Routing for Netlify & Cloudflare Pages',
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

export function generateSeoFilesToDirectory(targetDir: string): {
  urlCount: number;
  baseUrl: string;
  lastmod: string;
} {
  fs.mkdirSync(targetDir, { recursive: true });
  const baseUrl = resolveBuildBaseUrl();
  const lastmod = new Date().toISOString().split('T')[0];

  const sitemapXml = buildSitemapXml(baseUrl, lastmod);
  const robotsTxt = buildRobotsTxt(baseUrl);
  const notFoundHtml = build404Html(baseUrl);
  const manifestJson = buildWebManifestJson();
  const redirectsTxt = buildRedirectsTxt();

  fs.writeFileSync(path.resolve(targetDir, 'sitemap.xml'), sitemapXml, 'utf-8');
  fs.writeFileSync(path.resolve(targetDir, 'robots.txt'), robotsTxt, 'utf-8');
  fs.writeFileSync(path.resolve(targetDir, '404.html'), notFoundHtml, 'utf-8');
  fs.writeFileSync(path.resolve(targetDir, 'site.webmanifest'), manifestJson, 'utf-8');
  fs.writeFileSync(path.resolve(targetDir, '_redirects'), redirectsTxt, 'utf-8');

  const urlCount = (sitemapXml.match(/<url>/g) || []).length;
  return { urlCount, baseUrl, lastmod };
}

if (process.argv[1] && process.argv[1].endsWith('generateSeoFiles.ts')) {
  const result = generateSeoFilesToDirectory(PUBLIC_DIR);
  console.log(
    `[SEO Generator] ✓ Generated sitemap.xml (${result.urlCount} URLs, lastmod ${result.lastmod}), robots.txt, 404.html, site.webmanifest, and _redirects in public/ for ${result.baseUrl}`
  );
}
