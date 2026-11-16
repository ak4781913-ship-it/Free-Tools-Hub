/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_PRODUCTION_URL,
  HOMEPAGE_FAQS,
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  STATIC_PAGES_SEO,
  StaticPageSeoConfig,
  buildJsonLdForPath,
  sanitizePublicOrigin,
} from '../src/data/seoRegistry';
import { TOOLS_LIST } from '../src/data/tools';
import { TOOL_ROUTES, ToolRouteConfig } from '../src/data/toolsRouting';
import { TOOL_SEO_GUIDES } from '../src/data/toolSeoGuides';
import { generateSeoFilesToDirectory, resolveBuildBaseUrl } from './generateSeoFiles';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT_DIR, 'dist');

const CANONICAL_DOMAIN = resolveBuildBaseUrl();
const GOOGLE_VERIFICATION_TOKEN = (
  process.env.VITE_GOOGLE_SITE_VERIFICATION ||
  process.env.GOOGLE_SITE_VERIFICATION ||
  ''
).trim();

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getRelatedRoutes(current: ToolRouteConfig): ToolRouteConfig[] {
  const all = Object.values(TOOL_ROUTES);
  const sameCategory = all.filter(
    (r) => r.id !== current.id && r.categoryGroup === current.categoryGroup
  );
  const crossCategory = all.filter(
    (r) => r.id !== current.id && r.categoryGroup !== current.categoryGroup
  );
  return [...sameCategory, ...crossCategory].slice(0, 4);
}

function applyHeadMeta(
  baseTemplate: string,
  options: {
    title: string;
    description: string;
    canonicalUrl: string;
    robots?: string;
    jsonLd?: Record<string, unknown>[];
  }
): string {
  let html = baseTemplate;
  const ogImageUrl = `${CANONICAL_DOMAIN}${OG_IMAGE_PATH}`;

  // Title
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(options.title)}</title>`);

  // Robots
  html = html.replace(
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="robots" content="${escapeHtml(options.robots || 'index, follow')}" />`
  );

  // Meta description
  html = html.replace(
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(options.description)}" />`
  );

  // Canonical
  if (/<link\s+rel="canonical"/i.test(html)) {
    html = html.replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${escapeHtml(options.canonicalUrl)}" />`
    );
  } else {
    html = html.replace(
      '</title>',
      `</title>\n    <link rel="canonical" href="${escapeHtml(options.canonicalUrl)}" />`
    );
  }

  // OpenGraph
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtml(options.title)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta property="og:description" content="${escapeHtml(options.description)}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${escapeHtml(options.canonicalUrl)}" />`
  );
  if (/<meta\s+property="og:image"/i.test(html)) {
    html = html.replace(
      /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:image" content="${escapeHtml(ogImageUrl)}" />`
    );
  } else {
    html = html.replace(
      '</head>',
      `    <meta property="og:image" content="${escapeHtml(ogImageUrl)}" />\n    <meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />\n    <meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" />\n    <meta property="og:image:alt" content="${escapeHtml(OG_IMAGE_ALT)}" />\n  </head>`
    );
  }

  // Twitter
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapeHtml(options.title)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapeHtml(options.description)}" />`
  );
  if (/<meta\s+name="twitter:image"/i.test(html)) {
    html = html.replace(
      /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />`
    );
  } else {
    html = html.replace(
      '</head>',
      `    <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />\n  </head>`
    );
  }

  // Optional Google Search Console Verification Tag (never invented; only emitted from env)
  if (GOOGLE_VERIFICATION_TOKEN && !/name="google-site-verification"/i.test(html)) {
    html = html.replace(
      '</head>',
      `    <meta name="google-site-verification" content="${escapeHtml(GOOGLE_VERIFICATION_TOKEN)}" />\n  </head>`
    );
  }

  // Strip base template JSON-LD so each route emits one authoritative, non-duplicated JSON-LD block
  html = html.replace(/<script\s+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/gi, '');
  if (options.jsonLd && options.jsonLd.length > 0) {
    const schemaTag = `\n    <script id="dynamic-route-jsonld" type="application/ld+json">${JSON.stringify(options.jsonLd)}</script>`;
    html = html.replace('</head>', `${schemaTag}\n  </head>`);
  }

  return html;
}

function generatePrerenderedHomepageHtml(baseTemplate: string): string {
  const homepageSeo = STATIC_PAGES_SEO.find((p) => p.path === '/')!;
  const canonicalUrl = `${CANONICAL_DOMAIN}/`;
  const jsonLd = buildJsonLdForPath('/', CANONICAL_DOMAIN);

  let html = applyHeadMeta(baseTemplate, {
    title: homepageSeo.title,
    description: homepageSeo.description,
    canonicalUrl,
    jsonLd,
  });

  const routes = Object.values(TOOL_ROUTES);
  const categories = Array.from(new Set(routes.map((r) => r.categoryGroupLabel)));

  const toolsSectionsHtml = categories
    .map((catLabel) => {
      const catRoutes = routes.filter((r) => r.categoryGroupLabel === catLabel);
      const itemsList = catRoutes
        .map((r) => {
          const tool = TOOLS_LIST.find((t) => t.id === r.id);
          return `
            <li style="margin-bottom: 0.75rem;">
              <a href="${escapeHtml(r.primaryPath)}" style="font-weight: 600; color: #1d4ed8; text-decoration: underline;">${escapeHtml(tool?.name || r.primarySlug)}</a>
              <p style="margin: 0.25rem 0 0; color: #475569; font-size: 0.95rem;">${escapeHtml(r.seoDescription)}</p>
            </li>`;
        })
        .join('');

      return `
        <section style="margin-bottom: 2rem;">
          <h2 style="font-size: 1.4rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">${escapeHtml(catLabel)}</h2>
          <ul style="list-style: none; padding-left: 0;">
            ${itemsList}
          </ul>
        </section>`;
    })
    .join('');

  const faqHtml = HOMEPAGE_FAQS.map(
    (faq) => `
      <div style="margin-bottom: 1.25rem; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 0.75rem; background: #ffffff;">
        <h3 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 0.5rem;">${escapeHtml(faq.q)}</h3>
        <p style="margin: 0; color: #475569; font-size: 0.95rem; line-height: 1.6;">${escapeHtml(faq.a)}</p>
      </div>`
  ).join('');

  const semanticRootContent = `
    <div id="root">
      <header style="padding: 1.5rem 1rem; border-bottom: 1px solid #e2e8f0; background: #ffffff;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <a href="/" style="font-size: 1.25rem; font-weight: 800; color: #1e3a8a; text-decoration: none;">FreeTools Hub</a>
          <nav aria-label="Main Navigation">
            <a href="/tools" style="margin-right: 1.25rem; color: #334155; text-decoration: none; font-weight: 500;">All Tools</a>
            <a href="/tools/pdf-tools-suite" style="margin-right: 1.25rem; color: #334155; text-decoration: none; font-weight: 500;">PDF Tools Suite</a>
            <a href="/about" style="margin-right: 1.25rem; color: #334155; text-decoration: none; font-weight: 500;">About</a>
            <a href="/contact" style="margin-right: 1.25rem; color: #334155; text-decoration: none; font-weight: 500;">Contact</a>
            <a href="/privacy" style="color: #334155; text-decoration: none; font-weight: 500;">Privacy</a>
          </nav>
        </div>
      </header>

      <main style="max-width: 1200px; margin: 0 auto; padding: 2.5rem 1rem;">
        <article>
          <header style="margin-bottom: 2.5rem;">
            <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a; margin-bottom: 1rem; line-height: 1.2;">${escapeHtml(homepageSeo.h1)}</h1>
            <p style="font-size: 1.125rem; color: #475569; max-width: 820px; line-height: 1.6;">
              ${escapeHtml(homepageSeo.summary)} All processing executes 100% locally inside your web browser.
            </p>
          </header>

          ${toolsSectionsHtml}

          <section style="margin-top: 3rem;">
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem;">Frequently Asked Questions</h2>
            ${faqHtml}
          </section>
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

  return html.replace(/<div id="root"><\/div>/i, semanticRootContent.trim());
}

function generateToolPrerenderedHtml(baseTemplate: string, route: ToolRouteConfig): string {
  const tool = TOOLS_LIST.find((t) => t.id === route.id);
  const guide = TOOL_SEO_GUIDES[route.id];
  const toolName = tool?.name || route.primarySlug;
  const canonicalUrl = `${CANONICAL_DOMAIN}${route.primaryPath}`;
  const jsonLd = buildJsonLdForPath(route.primaryPath, CANONICAL_DOMAIN);

  let html = applyHeadMeta(baseTemplate, {
    title: route.seoTitle,
    description: route.seoDescription,
    canonicalUrl,
    jsonLd,
  });

  const relatedTools = getRelatedRoutes(route);
  const relatedLinksHtml = relatedTools
    .map((rt) => {
      const rTool = TOOLS_LIST.find((t) => t.id === rt.id);
      return `
        <li style="margin-bottom: 0.5rem;">
          <a href="${escapeHtml(rt.primaryPath)}" style="color: #1d4ed8; text-decoration: underline; font-weight: 600;">${escapeHtml(rTool?.name || rt.primarySlug)}</a>
          <span style="color: #64748b; font-size: 0.9rem;"> – ${escapeHtml(rt.seoDescription)}</span>
        </li>`;
    })
    .join('');

  const howToSteps = guide?.howToUse || route.tips.map((t) => `${t.title}: ${t.desc}`);
  const instructionsListHtml = howToSteps
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
          <a href="/tools" style="color: #1d4ed8; text-decoration: none;">All Tools</a> &gt;
          <span style="color: #0f172a; font-weight: 600;">${escapeHtml(toolName)}</span>
        </nav>

        <article>
          <header style="margin-bottom: 2rem;">
            <span style="display: inline-block; padding: 0.25rem 0.75rem; background: #dbeafe; color: #1e40af; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.75rem;">
              ${escapeHtml(route.categoryGroupLabel)}
            </span>
            <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.75rem; line-height: 1.2;">
              ${escapeHtml(toolName)}
            </h1>
            <p style="font-size: 1.125rem; color: #475569; max-width: 820px; line-height: 1.6;">
              ${escapeHtml(guide?.whatItDoes || tool?.fullDescription || route.seoDescription)}
            </p>
          </header>

          ${
            guide?.whoCanUseIt
              ? `<section style="margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">Who Can Use It</h2>
            <p style="color: #475569; line-height: 1.6;">${escapeHtml(guide.whoCanUseIt)}</p>
          </section>`
              : ''
          }

          <section style="margin-bottom: 2rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.5rem;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem;">How to Use ${escapeHtml(toolName)}</h2>
            <ol style="padding-left: 1.25rem; color: #334155; line-height: 1.6;">
              ${instructionsListHtml}
            </ol>
          </section>

          ${
            guide
              ? `<section style="margin-bottom: 2rem;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">Required Inputs &amp; Expected Output</h2>
            <p style="color: #475569; line-height: 1.6;"><strong>Inputs:</strong> ${escapeHtml(guide.requiredInputs)}</p>
            <p style="color: #475569; line-height: 1.6;"><strong>Output:</strong> ${escapeHtml(guide.expectedResults)}</p>
            <p style="color: #64748b; line-height: 1.6; font-size: 0.9rem;"><strong>Notes &amp; Limitations:</strong> ${escapeHtml(guide.limitationsAndAssumptions)}</p>
          </section>`
              : ''
          }

          <section style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e2e8f0;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem;">Related Companion Tools</h2>
            <ul style="list-style: none; padding-left: 0;">
              ${relatedLinksHtml}
            </ul>
          </section>
        </article>
      </main>

      <footer style="background: #0f172a; color: #94a3b8; padding: 3rem 1rem; margin-top: 4rem;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 2rem;">
          <div>
            <p style="color: #ffffff; font-weight: 700; margin-bottom: 0.5rem;">FreeTools Hub (AbbasPro)</p>
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

  return html.replace(/<div id="root"><\/div>/i, toolContent.trim());
}

function generateStaticPageHtml(baseTemplate: string, page: StaticPageSeoConfig): string {
  const canonicalUrl = `${CANONICAL_DOMAIN}${page.path}`;
  const jsonLd = buildJsonLdForPath(page.path, CANONICAL_DOMAIN);

  let html = applyHeadMeta(baseTemplate, {
    title: page.title,
    description: page.description,
    canonicalUrl,
    jsonLd,
  });

  const directorySectionHtml =
    page.path === '/tools'
      ? `
          <section style="margin-top: 2rem;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem;">All ${TOOLS_LIST.length} Tools &amp; Calculators</h2>
            <ul style="list-style: none; padding-left: 0;">
              ${Object.values(TOOL_ROUTES)
                .map((r) => {
                  const t = TOOLS_LIST.find((item) => item.id === r.id);
                  return `<li style="margin-bottom: 0.65rem;"><a href="${escapeHtml(r.primaryPath)}" style="color: #1d4ed8; font-weight: 600;">${escapeHtml(t?.name || r.primarySlug)}</a> – ${escapeHtml(r.seoDescription)}</li>`;
                })
                .join('')}
            </ul>
          </section>`
      : `
          <section style="margin-top: 2rem;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem;">Browse Popular Free Tools</h2>
            <ul style="list-style: none; padding-left: 0;">
              <li style="margin-bottom: 0.5rem;"><a href="/tools/pdf-tools-suite" style="color: #1d4ed8; font-weight: 600;">PDF Tools Suite (43 Tools)</a> – Convert, merge, split, compress, edit, encrypt &amp; OCR PDFs</li>
              <li style="margin-bottom: 0.5rem;"><a href="/tools/cv-maker" style="color: #1d4ed8; font-weight: 600;">CV &amp; Resume Maker</a> – ATS-ready professional resume builder</li>
              <li style="margin-bottom: 0.5rem;"><a href="/tools/uae-gratuity-calculator" style="color: #1d4ed8; font-weight: 600;">UAE Gratuity Calculator</a> – End-of-service benefit estimation</li>
              <li style="margin-bottom: 0.5rem;"><a href="/tools/uae-salary-calculator" style="color: #1d4ed8; font-weight: 600;">UAE Salary Calculator</a> – Monthly gross and net salary breakdown</li>
              <li style="margin-bottom: 0.5rem;"><a href="/tools/seo-page-analyzer" style="color: #1d4ed8; font-weight: 600;">SEO Page Analyzer</a> – Technical on-page SEO audit tool</li>
            </ul>
          </section>`;

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
            <p style="font-size: 1.125rem; color: #475569; max-width: 820px; line-height: 1.6;">
              ${escapeHtml(page.summary)}
            </p>
          </header>

          ${directorySectionHtml}
        </article>
      </main>

      <footer style="background: #0f172a; color: #94a3b8; padding: 3rem 1rem; margin-top: 4rem;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 2rem;">
          <div>
            <p style="color: #ffffff; font-weight: 700; margin-bottom: 0.5rem;">FreeTools Hub (AbbasPro)</p>
            <p style="font-size: 0.875rem;">Fast, private, and always free.</p>
          </div>
          <nav aria-label="Footer Navigation">
            <a href="/" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">Home</a>
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

  return html.replace(/<div id="root"><\/div>/i, pageContent.trim());
}

export function prerenderAllPages() {
  const distIndexPath = path.resolve(DIST_DIR, 'index.html');
  if (!fs.existsSync(distIndexPath)) {
    throw new Error('dist/index.html does not exist. Run "vite build" first before prerendering.');
  }

  // Ensure dist/ also has synchronized generated sitemap.xml, robots.txt, 404.html, site.webmanifest, and _redirects
  const seoAssetsResult = generateSeoFilesToDirectory(DIST_DIR);

  const baseHtml = fs.readFileSync(distIndexPath, 'utf-8');
  console.log(
    `[SEO Prerender] Starting static HTML generation using canonical base: ${CANONICAL_DOMAIN || DEFAULT_PRODUCTION_URL}`
  );

  // 1. Prerender Homepage
  const homepageHtml = generatePrerenderedHomepageHtml(baseHtml);
  fs.writeFileSync(distIndexPath, homepageHtml, 'utf-8');

  // Keep Workbox SW precache revision for index.html synchronized with the prerendered file
  const swPath = path.resolve(DIST_DIR, 'sw.js');
  if (fs.existsSync(swPath)) {
    const newIndexHash = crypto.createHash('md5').update(homepageHtml, 'utf8').digest('hex');
    const swRaw = fs.readFileSync(swPath, 'utf-8');
    const swUpdated = swRaw.replace(
      /(\{\s*"?url"?:\s*"index\.html"\s*,\s*"?revision"?:\s*")[a-f0-9]+("\s*\})/g,
      `$1${newIndexHash}$2`
    );
    if (swUpdated !== swRaw) {
      fs.writeFileSync(swPath, swUpdated, 'utf-8');
    } else if (swRaw.includes('"index.html"')) {
      throw new Error('Failed to synchronize index.html precache revision in dist/sw.js');
    }
  }

  // 2. Prerender All Tool Pages as flat .html files (prevents Netlify directory trailing-slash 301 redirects)
  const toolsOutDir = path.resolve(DIST_DIR, 'tools');
  fs.mkdirSync(toolsOutDir, { recursive: true });
  const toolRoutes = Object.values(TOOL_ROUTES);
  for (const route of toolRoutes) {
    const legacyDir = path.resolve(toolsOutDir, route.primarySlug);
    if (fs.existsSync(legacyDir) && fs.statSync(legacyDir).isDirectory()) {
      fs.rmSync(legacyDir, { recursive: true, force: true });
    }
    const toolHtml = generateToolPrerenderedHtml(baseHtml, route);
    fs.writeFileSync(path.resolve(toolsOutDir, `${route.primarySlug}.html`), toolHtml, 'utf-8');
  }

  // 3. Prerender Static Pages as flat .html files (all non-root routes in STATIC_PAGES_SEO)
  const subStaticPages = STATIC_PAGES_SEO.filter((p) => p.slug !== '');
  for (const page of subStaticPages) {
    const legacyPageDir = path.resolve(DIST_DIR, page.slug);
    if (page.slug !== 'tools' && fs.existsSync(legacyPageDir) && fs.statSync(legacyPageDir).isDirectory()) {
      fs.rmSync(legacyPageDir, { recursive: true, force: true });
    } else if (page.slug === 'tools') {
      const legacyToolsIndex = path.resolve(legacyPageDir, 'index.html');
      if (fs.existsSync(legacyToolsIndex)) {
        fs.rmSync(legacyToolsIndex, { force: true });
      }
    }
    const pageHtml = generateStaticPageHtml(baseHtml, page);
    fs.writeFileSync(path.resolve(DIST_DIR, `${page.slug}.html`), pageHtml, 'utf-8');
  }

  const totalPages = 1 + toolRoutes.length + subStaticPages.length;
  console.log(
    `[SEO Prerender] ✓ Generated ${totalPages} flat prerendered HTML pages + sitemap.xml (${seoAssetsResult.urlCount} URLs), robots.txt, 404.html, site.webmanifest, and _redirects in dist/.`
  );
}

if (process.argv[1] && process.argv[1].endsWith('prerenderSeo.ts')) {
  prerenderAllPages();
}
