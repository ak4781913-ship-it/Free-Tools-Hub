/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
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
  ORGANIZATION_NAME,
  SITE_NAME,
  STATIC_PAGES_SEO,
  StaticPageSeoConfig,
  buildJsonLdForPath,
} from '../src/data/seoRegistry';
import { TOOLS_LIST } from '../src/data/tools';
import { CATEGORY_GROUPS, TOOL_ROUTES, ToolRouteConfig } from '../src/data/toolsRouting';
import { TOOL_SEO_GUIDES } from '../src/data/toolSeoGuides';
import { TOOL_KEYWORD_STRATEGY } from '../src/data/keywordStrategy';
import { PDF_LANDING_ROUTES, PdfLandingRouteConfig } from '../src/data/pdfLandingRoutes';
import {
  CATEGORY_LANDINGS,
  CategoryLandingConfig,
  getCategoryLandingPath,
} from '../src/data/categorySeoData';
import { EDITORIAL_GUIDES, EditorialGuide, getGuidesBySlugs } from '../src/data/guidesData';
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
  return [...sameCategory, ...crossCategory].slice(0, 6);
}

function applyHeadMeta(
  baseTemplate: string,
  options: {
    title: string;
    description: string;
    canonicalUrl: string;
    ogType?: 'website' | 'article';
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

  // OpenGraph Type & Metadata
  html = html.replace(
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:type" content="${escapeHtml(options.ogType || 'website')}" />`
  );
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

  // Google Search Console Verification Tag
  if (GOOGLE_VERIFICATION_TOKEN) {
    html = html.replace(/\s*<meta\s+name="google-site-verification"[^>]*\/?>/gi, '');
    html = html.replace(
      '</head>',
      `\n    <meta name="google-site-verification" content="${escapeHtml(GOOGLE_VERIFICATION_TOKEN)}" />\n  </head>`
    );
  }

  // Single authoritative JSON-LD block
  html = html.replace(/<script\s+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/gi, '');
  if (options.jsonLd && options.jsonLd.length > 0) {
    const schemaTag = `\n    <script id="dynamic-route-jsonld" type="application/ld+json">${JSON.stringify(options.jsonLd)}</script>`;
    html = html.replace('</head>', `${schemaTag}\n  </head>`);
  }

  return html;
}

function renderHeaderHtml(): string {
  return `
      <header style="padding: 1.25rem 1rem; border-bottom: 1px solid #e2e8f0; background: #ffffff;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <a href="/" style="font-size: 1.25rem; font-weight: 800; color: #1e3a8a; text-decoration: none;">${escapeHtml(SITE_NAME)}</a>
          <nav aria-label="Main Navigation">
            <a href="/tools" style="margin-right: 1.25rem; color: #334155; text-decoration: none; font-weight: 500;">All Tools</a>
            <a href="/tools/pdf-tools-suite" style="margin-right: 1.25rem; color: #334155; text-decoration: none; font-weight: 500;">PDF Tools Suite</a>
            <a href="/guides" style="margin-right: 1.25rem; color: #334155; text-decoration: none; font-weight: 500;">Guides</a>
            <a href="/about" style="margin-right: 1.25rem; color: #334155; text-decoration: none; font-weight: 500;">About</a>
            <a href="/contact" style="color: #334155; text-decoration: none; font-weight: 500;">Contact</a>
          </nav>
        </div>
      </header>`;
}

function renderFooterHtml(): string {
  return `
      <footer style="background: #0f172a; color: #94a3b8; padding: 3rem 1rem; margin-top: 4rem;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 2rem;">
          <div>
            <p style="color: #ffffff; font-weight: 700; margin-bottom: 0.5rem;">${escapeHtml(SITE_NAME)} · Published by ${escapeHtml(ORGANIZATION_NAME)}</p>
            <p style="font-size: 0.875rem;">Smart Tools. Simple Solutions. 100% Client-Side Privacy.</p>
          </div>
          <nav aria-label="Footer Navigation">
            <a href="/" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">Home</a>
            <a href="/tools" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">All Tools</a>
            <a href="/guides" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">Guides</a>
            <a href="/about" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">About</a>
            <a href="/contact" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">Contact</a>
            <a href="/privacy" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">Privacy</a>
            <a href="/terms" style="color: #cbd5e1; text-decoration: none; margin-right: 1rem;">Terms</a>
            <a href="/disclaimer" style="color: #cbd5e1; text-decoration: none;">Disclaimer</a>
          </nav>
        </div>
      </footer>`;
}

function renderFaqSectionHtml(faqs: { q: string; a: string }[]): string {
  if (!faqs || faqs.length === 0) return '';
  return `
    <section style="margin-top: 2.25rem;">
      <h2 style="font-size: 1.3rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem;">Frequently Asked Questions</h2>
      ${faqs
        .map(
          (faq) => `
        <div style="margin-bottom: 1rem; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 0.75rem; background: #ffffff;">
          <h3 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 0.45rem;">${escapeHtml(faq.q)}</h3>
          <p style="margin: 0; color: #475569; font-size: 0.95rem; line-height: 1.6;">${escapeHtml(faq.a)}</p>
        </div>`
        )
        .join('')}
    </section>`;
}

function generatePrerenderedHomepageHtml(baseTemplate: string): string {
  const homepageSeo = STATIC_PAGES_SEO.find((p) => p.path === '/')!;
  const canonicalUrl = `${CANONICAL_DOMAIN}/`;
  const jsonLd = buildJsonLdForPath('/', CANONICAL_DOMAIN);

  const html = applyHeadMeta(baseTemplate, {
    title: homepageSeo.title,
    description: homepageSeo.description,
    canonicalUrl,
    jsonLd,
  });

  const routes = Object.values(TOOL_ROUTES);
  const toolsSectionsHtml = CATEGORY_GROUPS.map((group) => {
    const catRoutes = routes.filter((r) => r.categoryGroup === group.id);
    if (catRoutes.length === 0) return '';
    const catPath = getCategoryLandingPath(group.id);
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
          <h2 style="font-size: 1.4rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">
            <a href="${escapeHtml(catPath)}" style="color: #0f172a; text-decoration: underline;">${escapeHtml(group.name)}</a>
          </h2>
          <p style="color: #475569; font-size: 0.95rem; margin: 0 0 0.9rem;">${escapeHtml(group.description)}</p>
          <ul style="list-style: none; padding-left: 0;">
            ${itemsList}
          </ul>
        </section>`;
  }).join('');

  const pdfShortcutsHtml = PDF_LANDING_ROUTES.map(
    (pdf) =>
      `<li style="margin-bottom: 0.4rem;"><a href="${escapeHtml(pdf.primaryPath)}" style="color: #1d4ed8; font-weight: 600;">${escapeHtml(pdf.h1)}</a></li>`
  ).join('');

  const guidesLinksHtml = EDITORIAL_GUIDES.map(
    (g) =>
      `<li style="margin-bottom: 0.5rem;"><a href="${escapeHtml(g.path)}" style="color: #1d4ed8; font-weight: 600;">${escapeHtml(g.title)}</a></li>`
  ).join('');

  const semanticRootContent = `
    <div id="root">
      ${renderHeaderHtml()}

      <main style="max-width: 1200px; margin: 0 auto; padding: 2.5rem 1rem;">
        <article>
          <header style="margin-bottom: 2.5rem;">
            <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a; margin-bottom: 1rem; line-height: 1.2;">${escapeHtml(homepageSeo.h1)}</h1>
            <p style="font-size: 1.125rem; color: #475569; max-width: 820px; line-height: 1.6;">
              ${escapeHtml(homepageSeo.summary)} All processing executes 100% locally inside your web browser.
            </p>
            <div style="margin-top: 1.25rem; display: flex; flex-wrap: wrap; gap: 0.75rem;">
              <a href="/tools" style="display: inline-block; padding: 0.65rem 1.2rem; background: #1d4ed8; color: #ffffff; border-radius: 0.65rem; font-weight: 700; text-decoration: none;">Explore All ${TOOLS_LIST.length} Tools</a>
              <a href="/tools/cv-maker" style="display: inline-block; padding: 0.65rem 1.2rem; background: #f1f5f9; color: #0f172a; border-radius: 0.65rem; font-weight: 600; text-decoration: none;">Create Resume</a>
              <a href="/tools/pdf-tools-suite" style="display: inline-block; padding: 0.65rem 1.2rem; background: #f1f5f9; color: #0f172a; border-radius: 0.65rem; font-weight: 600; text-decoration: none;">Open PDF Tools Suite</a>
              <a href="/guides" style="display: inline-block; padding: 0.65rem 1.2rem; background: #f1f5f9; color: #0f172a; border-radius: 0.65rem; font-weight: 600; text-decoration: none;">Read Practical Guides</a>
            </div>
          </header>

          ${toolsSectionsHtml}

          <section style="margin-bottom: 2rem;">
            <h2 style="font-size: 1.4rem; font-weight: 700; color: #0f172a; margin-bottom: 0.65rem;">Dedicated Browser PDF Workflows</h2>
            <ul style="padding-left: 1.25rem; columns: 2;">
              ${pdfShortcutsHtml}
            </ul>
          </section>

          <section style="margin-bottom: 2rem;">
            <h2 style="font-size: 1.4rem; font-weight: 700; color: #0f172a; margin-bottom: 0.65rem;">Practical Guides &amp; Tutorials</h2>
            <ul style="padding-left: 1.25rem;">
              ${guidesLinksHtml}
            </ul>
          </section>

          ${renderFaqSectionHtml(HOMEPAGE_FAQS)}
        </article>
      </main>

      ${renderFooterHtml()}
    </div>`;

  return html.replace(/<div id="root"><\/div>/i, semanticRootContent.trim());
}

function generateToolPrerenderedHtml(baseTemplate: string, route: ToolRouteConfig): string {
  const tool = TOOLS_LIST.find((t) => t.id === route.id);
  const guide = TOOL_SEO_GUIDES[route.id];
  const strategy = TOOL_KEYWORD_STRATEGY[route.id];
  const toolName = tool?.name || route.primarySlug;
  const pageH1 = strategy?.h1 || toolName;
  const catLandingPath = getCategoryLandingPath(route.categoryGroup);
  const canonicalUrl = `${CANONICAL_DOMAIN}${route.primaryPath}`;
  const jsonLd = buildJsonLdForPath(route.primaryPath, CANONICAL_DOMAIN);

  const html = applyHeadMeta(baseTemplate, {
    title: strategy?.seoTitle || route.seoTitle,
    description: strategy?.metaDescription || route.seoDescription,
    canonicalUrl,
    jsonLd,
  });

  const relatedTools = getRelatedRoutes(route);
  const relatedLinksHtml = relatedTools
    .map((rt) => {
      const rTool = TOOLS_LIST.find((t) => t.id === rt.id);
      return `
        <li style="margin-bottom: 0.65rem;">
          <a href="${escapeHtml(rt.primaryPath)}" style="color: #1d4ed8; text-decoration: underline; font-weight: 600;">${escapeHtml(rTool?.name || rt.primarySlug)}</a>
          <span style="color: #64748b; font-size: 0.9rem;"> – ${escapeHtml(rTool?.shortDescription || rt.seoDescription)}</span>
        </li>`;
    })
    .join('');

  const howToSteps = guide?.howToUse || route.tips.map((t) => `${t.title}: ${t.desc}`);
  const instructionsListHtml = howToSteps
    .map((inst, i) => `<li style="margin-bottom: 0.5rem;"><strong>Step ${i + 1}:</strong> ${escapeHtml(inst)}</li>`)
    .join('');

  const tipsListHtml = route.tips
    .map((tip) => `<li style="margin-bottom: 0.5rem;"><strong>${escapeHtml(tip.title)}:</strong> ${escapeHtml(tip.desc)}</li>`)
    .join('');

  const relatedGuides = strategy ? getGuidesBySlugs(strategy.relatedGuideSlugs) : [];
  const pdfQuickLinksHtml =
    route.id === 'pdf-tools-suite'
      ? `
      <section style="margin-bottom: 2rem;">
        <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">Direct PDF Tool Landing Pages</h2>
        <ul style="padding-left: 1.25rem; columns: 2;">
          ${PDF_LANDING_ROUTES.map(
            (p) =>
              `<li style="margin-bottom: 0.45rem;"><a href="${escapeHtml(p.primaryPath)}" style="color: #1d4ed8; font-weight: 600;">${escapeHtml(p.h1)}</a></li>`
          ).join('')}
        </ul>
      </section>`
      : '';

  const toolIntro = tool?.fullDescription || tool?.shortDescription || route.seoDescription;

  const toolContent = `
    <div id="root">
      ${renderHeaderHtml()}

      <main style="max-width: 1200px; margin: 0 auto; padding: 2rem 1rem;">
        <nav aria-label="Breadcrumb" style="font-size: 0.875rem; color: #64748b; margin-bottom: 1.5rem;">
          <a href="/" style="color: #1d4ed8; text-decoration: none;">Home</a> &gt;
          <a href="/tools" style="color: #1d4ed8; text-decoration: none;">All Tools</a> &gt;
          <a href="${escapeHtml(catLandingPath)}" style="color: #1d4ed8; text-decoration: none;">${escapeHtml(route.categoryGroupLabel)}</a> &gt;
          <span style="color: #0f172a; font-weight: 600;">${escapeHtml(toolName)}</span>
        </nav>

        <article>
          <header style="margin-bottom: 2rem;">
            <p style="font-size: 0.85rem; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 0.5rem;">
              ${escapeHtml(route.categoryGroupLabel)}
            </p>
            <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.75rem; line-height: 1.2;">
              ${escapeHtml(pageH1)}
            </h1>
            <p style="font-size: 1.125rem; color: #475569; max-width: 860px; line-height: 1.6;">
              ${escapeHtml(toolIntro)}
            </p>
          </header>

          ${pdfQuickLinksHtml}

          ${
            strategy
              ? `
          <section style="margin-bottom: 1.75rem; padding: 1.1rem 1.25rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem;">
            <h2 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin: 0 0 0.45rem;">Supported Formats &amp; Example Scenario</h2>
            <p style="color: #334155; margin: 0 0 0.4rem;"><strong>Formats:</strong> ${escapeHtml(strategy.supportedFormats)}</p>
            <p style="color: #475569; margin: 0;"><strong>Example Use Case:</strong> ${escapeHtml(strategy.exampleScenario)}</p>
          </section>`
              : ''
          }

          ${
            guide
              ? `
          <section style="margin-bottom: 1.75rem;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">What This Tool Does</h2>
            <p style="color: #475569; line-height: 1.6;">${escapeHtml(guide.whatItDoes)}</p>
          </section>

          <section style="margin-bottom: 1.75rem;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">Who Should Use It</h2>
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
              ? `
          <section style="margin-bottom: 1.75rem;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">Required Inputs &amp; Validation</h2>
            <p style="color: #475569; line-height: 1.6;">${escapeHtml(guide.requiredInputs)}</p>
          </section>

          <section style="margin-bottom: 1.75rem;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">Expected Results &amp; Exports</h2>
            <p style="color: #475569; line-height: 1.6;">${escapeHtml(guide.expectedResults)}</p>
          </section>

          <section style="margin-bottom: 2rem; padding: 1.25rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 0.75rem;">
            <h2 style="font-size: 1.15rem; font-weight: 700; color: #78350f; margin-bottom: 0.5rem;">Important Limitations &amp; Assumptions</h2>
            <p style="color: #78350f; line-height: 1.6; margin: 0;">${escapeHtml(guide.limitationsAndAssumptions)}</p>
          </section>`
              : ''
          }

          ${
            route.tips.length > 0
              ? `
          <section style="margin-bottom: 2rem;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">Quick Practical Tips</h2>
            <ul style="padding-left: 1.25rem; color: #334155; line-height: 1.6;">
              ${tipsListHtml}
            </ul>
          </section>`
              : ''
          }

          ${strategy ? renderFaqSectionHtml(strategy.faqs) : ''}

          ${
            relatedGuides.length > 0
              ? `
          <section style="margin-top: 2rem;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">Related Tutorials &amp; Guides</h2>
            <ul style="padding-left: 1.25rem;">
              ${relatedGuides
                .map(
                  (g) =>
                    `<li style="margin-bottom: 0.5rem;"><a href="${escapeHtml(g.path)}" style="color: #1d4ed8; font-weight: 600;">${escapeHtml(g.title)}</a> – ${escapeHtml(g.summary)}</li>`
                )
                .join('')}
            </ul>
          </section>`
              : ''
          }

          <section style="margin-top: 2.5rem; padding-top: 2rem; border-top: 1px solid #e2e8f0;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem;">Related Tools &amp; Category</h2>
            <ul style="list-style: none; padding-left: 0;">
              ${relatedLinksHtml}
            </ul>
            <p style="margin-top: 1rem;">
              <a href="${escapeHtml(catLandingPath)}" style="color: #1d4ed8; font-weight: 700; text-decoration: underline;">Browse ${escapeHtml(route.categoryGroupLabel)}</a> ·
              <a href="/tools" style="color: #1d4ed8; font-weight: 700; text-decoration: underline;">Explore all ${TOOLS_LIST.length} tools</a>
            </p>
          </section>
        </article>
      </main>

      ${renderFooterHtml()}
    </div>`;

  return html.replace(/<div id="root"><\/div>/i, toolContent.trim());
}

function generatePdfLandingPrerenderedHtml(
  baseTemplate: string,
  pdfRoute: PdfLandingRouteConfig
): string {
  const canonicalUrl = `${CANONICAL_DOMAIN}${pdfRoute.primaryPath}`;
  const jsonLd = buildJsonLdForPath(pdfRoute.primaryPath, CANONICAL_DOMAIN);

  const html = applyHeadMeta(baseTemplate, {
    title: pdfRoute.seoTitle,
    description: pdfRoute.seoDescription,
    canonicalUrl,
    jsonLd,
  });

  const relatedPdfRoutes = pdfRoute.relatedLandingSlugs
    .map((slug) => PDF_LANDING_ROUTES.find((r) => r.primarySlug === slug))
    .filter((r): r is PdfLandingRouteConfig => Boolean(r));
  const relatedGuides = getGuidesBySlugs(pdfRoute.relatedGuideSlugs);

  const content = `
    <div id="root">
      ${renderHeaderHtml()}

      <main style="max-width: 1200px; margin: 0 auto; padding: 2rem 1rem;">
        <nav aria-label="Breadcrumb" style="font-size: 0.875rem; color: #64748b; margin-bottom: 1.5rem;">
          <a href="/" style="color: #1d4ed8; text-decoration: none;">Home</a> &gt;
          <a href="/tools/pdf-tools-suite" style="color: #1d4ed8; text-decoration: none;">PDF Tools Suite</a> &gt;
          <span style="color: #0f172a; font-weight: 600;">${escapeHtml(pdfRoute.h1)}</span>
        </nav>

        <article>
          <header style="margin-bottom: 2rem;">
            <p style="font-size: 0.85rem; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 0.5rem;">
              PDF Tools Suite · Local Client-Side Tool
            </p>
            <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.75rem; line-height: 1.2;">
              ${escapeHtml(pdfRoute.h1)}
            </h1>
            <p style="font-size: 1.125rem; color: #475569; max-width: 860px; line-height: 1.6;">
              ${escapeHtml(pdfRoute.introSummary)}
            </p>
          </header>

          <section style="margin-bottom: 1.75rem;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">How It Processes Files Locally</h2>
            <p style="color: #475569; line-height: 1.6;">${escapeHtml(pdfRoute.whatItDoes)}</p>
            <p style="color: #334155; font-size: 0.95rem;"><strong>Supported Formats:</strong> ${escapeHtml(pdfRoute.supportedFormats)}</p>
          </section>

          <section style="margin-bottom: 1.75rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.5rem;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.85rem;">Step-by-Step Instructions</h2>
            <ol style="padding-left: 1.25rem; color: #334155; line-height: 1.6;">
              ${pdfRoute.howToUse.map((step) => `<li style="margin-bottom: 0.45rem;">${escapeHtml(step)}</li>`).join('')}
            </ol>
          </section>

          <section style="margin-bottom: 1.75rem; padding: 1.25rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 0.75rem;">
            <h2 style="font-size: 1.15rem; font-weight: 700; color: #78350f; margin-bottom: 0.45rem;">Practical Limitations</h2>
            <p style="color: #78350f; line-height: 1.6; margin: 0;">${escapeHtml(pdfRoute.limitations)}</p>
          </section>

          ${renderFaqSectionHtml(pdfRoute.faqs)}

          ${
            relatedGuides.length > 0
              ? `
          <section style="margin-top: 2rem;">
            <h2 style="font-size: 1.2rem; font-weight: 700; color: #0f172a; margin-bottom: 0.65rem;">Helpful Guides</h2>
            <ul style="padding-left: 1.25rem;">
              ${relatedGuides
                .map(
                  (g) =>
                    `<li style="margin-bottom: 0.4rem;"><a href="${escapeHtml(g.path)}" style="color: #1d4ed8; font-weight: 600;">${escapeHtml(g.title)}</a></li>`
                )
                .join('')}
            </ul>
          </section>`
              : ''
          }

          <section style="margin-top: 2.25rem; padding-top: 1.75rem; border-top: 1px solid #e2e8f0;">
            <h2 style="font-size: 1.2rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">Related PDF Tools</h2>
            <ul style="padding-left: 1.25rem;">
              ${relatedPdfRoutes
                .map(
                  (r) =>
                    `<li style="margin-bottom: 0.45rem;"><a href="${escapeHtml(r.primaryPath)}" style="color: #1d4ed8; font-weight: 600;">${escapeHtml(r.h1)}</a> – ${escapeHtml(r.seoDescription)}</li>`
                )
                .join('')}
            </ul>
            <p style="margin-top: 1rem;">
              <a href="/tools/pdf-tools-suite" style="color: #1d4ed8; font-weight: 700;">Open All 43 Tools in PDF Tools Suite</a> ·
              <a href="/categories/pdf-tools" style="color: #1d4ed8; font-weight: 700;">PDF Tools Category</a>
            </p>
          </section>
        </article>
      </main>

      ${renderFooterHtml()}
    </div>`;

  return html.replace(/<div id="root"><\/div>/i, content.trim());
}

function generateCategoryPrerenderedHtml(
  baseTemplate: string,
  cat: CategoryLandingConfig
): string {
  const canonicalUrl = `${CANONICAL_DOMAIN}${cat.path}`;
  const jsonLd = buildJsonLdForPath(cat.path, CANONICAL_DOMAIN);

  const html = applyHeadMeta(baseTemplate, {
    title: cat.seoTitle,
    description: cat.seoDescription,
    canonicalUrl,
    jsonLd,
  });

  const catRoutes = Object.values(TOOL_ROUTES).filter((r) => r.categoryGroup === cat.id);
  const relatedGuides = getGuidesBySlugs(cat.relatedGuideSlugs);

  const content = `
    <div id="root">
      ${renderHeaderHtml()}

      <main style="max-width: 1200px; margin: 0 auto; padding: 2rem 1rem;">
        <nav aria-label="Breadcrumb" style="font-size: 0.875rem; color: #64748b; margin-bottom: 1.5rem;">
          <a href="/" style="color: #1d4ed8; text-decoration: none;">Home</a> &gt;
          <a href="/tools" style="color: #1d4ed8; text-decoration: none;">All Tools</a> &gt;
          <span style="color: #0f172a; font-weight: 600;">${escapeHtml(cat.name)}</span>
        </nav>

        <article>
          <header style="margin-bottom: 2rem;">
            <h1 style="font-size: 2.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.75rem; line-height: 1.2;">
              ${escapeHtml(cat.h1)}
            </h1>
            <p style="font-size: 1.125rem; color: #475569; max-width: 840px; line-height: 1.6;">
              ${escapeHtml(cat.overview)}
            </p>
          </header>

          <section style="margin-bottom: 2rem;">
            <h2 style="font-size: 1.3rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">Included Tools</h2>
            <ul style="list-style: none; padding-left: 0;">
              ${catRoutes
                .map((r) => {
                  const t = TOOLS_LIST.find((item) => item.id === r.id);
                  return `<li style="margin-bottom: 0.75rem;"><a href="${escapeHtml(r.primaryPath)}" style="color: #1d4ed8; font-weight: 700; text-decoration: underline;">${escapeHtml(t?.name || r.primarySlug)}</a> – ${escapeHtml(r.seoDescription)}</li>`;
                })
                .join('')}
            </ul>
          </section>

          ${
            cat.id === 'pdf-tools'
              ? `
          <section style="margin-bottom: 2rem;">
            <h2 style="font-size: 1.3rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">Dedicated High-Intent PDF Workflows</h2>
            <ul style="padding-left: 1.25rem; columns: 2;">
              ${PDF_LANDING_ROUTES.map(
                (p) =>
                  `<li style="margin-bottom: 0.45rem;"><a href="${escapeHtml(p.primaryPath)}" style="color: #1d4ed8; font-weight: 600;">${escapeHtml(p.h1)}</a></li>`
              ).join('')}
            </ul>
          </section>`
              : ''
          }

          <section style="margin-bottom: 2rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.25rem;">
            <h2 style="font-size: 1.2rem; font-weight: 700; color: #0f172a; margin-bottom: 0.6rem;">Category Highlights</h2>
            <ul style="padding-left: 1.25rem; color: #334155; line-height: 1.6;">
              ${cat.highlights.map((h) => `<li style="margin-bottom: 0.35rem;">${escapeHtml(h)}</li>`).join('')}
            </ul>
          </section>

          ${renderFaqSectionHtml(cat.faqs)}

          ${
            relatedGuides.length > 0
              ? `
          <section style="margin-top: 2rem;">
            <h2 style="font-size: 1.2rem; font-weight: 700; color: #0f172a; margin-bottom: 0.65rem;">Related Tutorials</h2>
            <ul style="padding-left: 1.25rem;">
              ${relatedGuides
                .map(
                  (g) =>
                    `<li style="margin-bottom: 0.45rem;"><a href="${escapeHtml(g.path)}" style="color: #1d4ed8; font-weight: 600;">${escapeHtml(g.title)}</a></li>`
                )
                .join('')}
            </ul>
          </section>`
              : ''
          }
        </article>
      </main>

      ${renderFooterHtml()}
    </div>`;

  return html.replace(/<div id="root"><\/div>/i, content.trim());
}

function generateGuideArticlePrerenderedHtml(
  baseTemplate: string,
  guide: EditorialGuide
): string {
  const canonicalUrl = `${CANONICAL_DOMAIN}${guide.path}`;
  const jsonLd = buildJsonLdForPath(guide.path, CANONICAL_DOMAIN);

  const html = applyHeadMeta(baseTemplate, {
    title: guide.seoTitle,
    description: guide.seoDescription,
    canonicalUrl,
    ogType: 'article',
    jsonLd,
  });

  const sectionsHtml = guide.sections
    .map(
      (sec) => `
      <section style="margin-bottom: 1.75rem;">
        <h2 style="font-size: 1.3rem; font-weight: 700; color: #0f172a; margin-bottom: 0.6rem;">${escapeHtml(sec.heading)}</h2>
        ${sec.paragraphs.map((p) => `<p style="color: #334155; line-height: 1.7; margin-bottom: 0.75rem;">${escapeHtml(p)}</p>`).join('')}
        ${
          sec.bullets
            ? `<ul style="padding-left: 1.25rem; color: #334155; line-height: 1.7; margin-bottom: 0.75rem;">${sec.bullets
                .map((b) => `<li style="margin-bottom: 0.35rem;">${escapeHtml(b)}</li>`)
                .join('')}</ul>`
            : ''
        }
        ${
          sec.callout
            ? `<div style="padding: 1rem; border-radius: 0.75rem; background: ${sec.callout.tone === 'warning' ? '#fffbeb' : '#eff6ff'}; border: 1px solid ${sec.callout.tone === 'warning' ? '#fde68a' : '#bfdbfe'}; color: ${sec.callout.tone === 'warning' ? '#78350f' : '#1e3a8a'};">
                <strong>${escapeHtml(sec.callout.title)}:</strong> ${escapeHtml(sec.callout.body)}
              </div>`
            : ''
        }
      </section>`
    )
    .join('');

  const content = `
    <div id="root">
      ${renderHeaderHtml()}

      <main style="max-width: 960px; margin: 0 auto; padding: 2rem 1rem;">
        <nav aria-label="Breadcrumb" style="font-size: 0.875rem; color: #64748b; margin-bottom: 1.5rem;">
          <a href="/" style="color: #1d4ed8; text-decoration: none;">Home</a> &gt;
          <a href="/guides" style="color: #1d4ed8; text-decoration: none;">Guides</a> &gt;
          <span style="color: #0f172a; font-weight: 600;">${escapeHtml(guide.title)}</span>
        </nav>

        <article>
          <header style="margin-bottom: 2rem;">
            <p style="font-size: 0.85rem; font-weight: 700; color: #1d4ed8; margin: 0 0 0.5rem;">
              ${escapeHtml(guide.category)} · Published by MAWA · Updated ${escapeHtml(guide.updatedDate)}
            </p>
            <h1 style="font-size: 2.15rem; font-weight: 800; color: #0f172a; margin-bottom: 0.75rem; line-height: 1.25;">
              ${escapeHtml(guide.title)}
            </h1>
            <p style="font-size: 1.1rem; color: #475569; line-height: 1.6;">
              ${escapeHtml(guide.summary)}
            </p>
          </header>

          ${sectionsHtml}

          ${renderFaqSectionHtml(guide.faqs)}

          <section style="margin-top: 2.25rem; padding-top: 1.75rem; border-top: 1px solid #e2e8f0;">
            <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">Try Related Free Tools</h2>
            <ul style="padding-left: 1.25rem;">
              ${guide.relatedToolPaths
                .map(
                  (rt) =>
                    `<li style="margin-bottom: 0.5rem;"><a href="${escapeHtml(rt.path)}" style="color: #1d4ed8; font-weight: 700;">${escapeHtml(rt.label)}</a> – ${escapeHtml(rt.desc)}</li>`
                )
                .join('')}
            </ul>
            <p style="margin-top: 1rem;">
              <a href="/guides" style="color: #1d4ed8; font-weight: 700;">All Guides</a> ·
              ${guide.relatedCategoryPaths
                .map(
                  (c) =>
                    `<a href="${escapeHtml(c.path)}" style="color: #1d4ed8; font-weight: 700;">${escapeHtml(c.label)}</a>`
                )
                .join(' · ')}
            </p>
          </section>
        </article>
      </main>

      ${renderFooterHtml()}
    </div>`;

  return html.replace(/<div id="root"><\/div>/i, content.trim());
}

function renderTrustBodyHtml(page: StaticPageSeoConfig): string {
  switch (page.path) {
    case '/tools': {
      const routes = Object.values(TOOL_ROUTES);
      return `
        ${CATEGORY_GROUPS.map((group) => {
          const groupRoutes = routes.filter((r) => r.categoryGroup === group.id);
          if (groupRoutes.length === 0) return '';
          const catPath = getCategoryLandingPath(group.id);
          return `
            <section style="margin-top: 2rem;">
              <h2 style="font-size: 1.35rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">
                <a href="${escapeHtml(catPath)}" style="color: #0f172a; text-decoration: underline;">${escapeHtml(group.name)}</a>
              </h2>
              <p style="color: #475569; margin: 0 0 0.9rem;">${escapeHtml(group.description)}</p>
              <ul style="list-style: none; padding-left: 0;">
                ${groupRoutes
                  .map((r) => {
                    const t = TOOLS_LIST.find((item) => item.id === r.id);
                    return `<li style="margin-bottom: 0.65rem;"><a href="${escapeHtml(r.primaryPath)}" style="color: #1d4ed8; font-weight: 600;">${escapeHtml(t?.name || r.primarySlug)}</a> – ${escapeHtml(t?.shortDescription || r.seoDescription)}</li>`;
                  })
                  .join('')}
              </ul>
            </section>`;
        }).join('')}
        <section style="margin-top: 2.25rem;">
          <h2 style="font-size: 1.35rem; font-weight: 700; color: #0f172a; margin-bottom: 0.65rem;">Dedicated PDF Action Pages</h2>
          <ul style="padding-left: 1.25rem; columns: 2;">
            ${PDF_LANDING_ROUTES.map(
              (pdf) =>
                `<li style="margin-bottom: 0.45rem;"><a href="${escapeHtml(pdf.primaryPath)}" style="color: #1d4ed8; font-weight: 600;">${escapeHtml(pdf.h1)}</a></li>`
            ).join('')}
          </ul>
        </section>`;
    }
    case '/guides': {
      return `
        <section style="margin-top: 2rem;">
          <h2 style="font-size: 1.35rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem;">All ${EDITORIAL_GUIDES.length} Original Guides &amp; Walkthroughs</h2>
          <ul style="list-style: none; padding-left: 0;">
            ${EDITORIAL_GUIDES.map(
              (g) => `
              <li style="margin-bottom: 1.15rem; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 0.75rem; background: #ffffff;">
                <p style="font-size: 0.8rem; font-weight: 700; color: #1d4ed8; margin: 0 0 0.35rem;">${escapeHtml(g.category)}</p>
                <a href="${escapeHtml(g.path)}" style="font-size: 1.1rem; font-weight: 700; color: #0f172a; text-decoration: underline;">${escapeHtml(g.title)}</a>
                <p style="margin: 0.4rem 0 0; color: #475569; font-size: 0.95rem;">${escapeHtml(g.summary)}</p>
              </li>`
            ).join('')}
          </ul>
        </section>`;
    }
    case '/about':
      return `
        <section style="margin-top: 2rem; display: grid; gap: 1.25rem;">
          <div>
            <h2 style="font-size: 1.2rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">Client-Side Architecture</h2>
            <p style="color: #475569; line-height: 1.6;">Resume drafts, salary figures, compressed images, QR codes, PDF operations, and generated passwords are processed locally in your browser memory and local storage without requiring account registration.</p>
          </div>
          <div>
            <h2 style="font-size: 1.2rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">Transparent Methodologies</h2>
            <p style="color: #475569; line-height: 1.6;">Calculators display explicit step-by-step formulas, statutory tier assumptions, and clear educational disclaimers so you can verify every figure independently.</p>
          </div>
          <div>
            <h2 style="font-size: 1.2rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">Bilingual &amp; Offline-Ready</h2>
            <p style="color: #475569; line-height: 1.6;">Built with English (LTR) and Urdu (RTL) interface support plus Progressive Web App caching so core calculators and editors continue working reliably offline.</p>
          </div>
        </section>
        <section style="margin-top: 2rem;">
          <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">What You Can Do on ${escapeHtml(SITE_NAME)}</h2>
          <ul style="padding-left: 1.25rem; color: #475569; line-height: 1.7;">
            <li><strong>Career &amp; CV Preparation:</strong> Create ATS-readable resumes using structured templates with live A4 preview, JSON draft backup, and direct PDF export via the <a href="/tools/cv-maker" style="color: #1d4ed8;">CV &amp; Resume Generator</a>.</li>
            <li><strong>UAE Employment Estimators:</strong> Estimate monthly gross-to-net compensation in AED and model end-of-service gratuity scenarios under UAE Federal Decree-Law No. 33 of 2021 with the <a href="/tools/uae-gratuity-calculator" style="color: #1d4ed8;">UAE Gratuity Calculator</a> and <a href="/tools/uae-salary-calculator" style="color: #1d4ed8;">UAE Salary Calculator</a>.</li>
            <li><strong>Structured AI Prompt Builders:</strong> Organize camera optics, lighting, aspect ratios, and multi-scene video scripts via the <a href="/tools/ai-photo-prompt-generator" style="color: #1d4ed8;">AI Photo Prompt Generator</a> and <a href="/tools/ai-video-prompt-generator" style="color: #1d4ed8;">AI Video Prompt Generator</a>.</li>
            <li><strong>Everyday Web &amp; PDF Utilities:</strong> Process 43 PDF workflows in the <a href="/tools/pdf-tools-suite" style="color: #1d4ed8;">PDF Tools Suite</a>, compress images, generate QR codes, audit on-page SEO HTML tags, format JSON, and convert units/currencies.</li>
          </ul>
          <p style="margin-top: 1.25rem;"><a href="/tools" style="color: #1d4ed8; font-weight: 700;">Explore All ${TOOLS_LIST.length} Tools</a> · <a href="/guides" style="color: #1d4ed8; font-weight: 700;">Browse Practical Guides</a> · <a href="/contact" style="color: #1d4ed8; font-weight: 700;">Contact or Report an Issue</a></p>
        </section>`;
    case '/contact':
      return `
        <section style="margin-top: 2rem;">
          <h2 style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 0.75rem;">Support, Bug Reports &amp; Tool Suggestions</h2>
          <p style="color: #475569; line-height: 1.6;">Use the interactive contact form on this page to submit general questions, report a calculation or export bug, suggest a tool improvement, or ask privacy and legal questions.</p>
          <p style="color: #475569; line-height: 1.6;">Because ${escapeHtml(SITE_NAME)} operates without a remote user-tracking database, submitted notes are stored locally inside your browser feedback log unless you choose to copy and send them via configured owner contact channels.</p>
          <p style="margin-top: 1.25rem;"><a href="/tools" style="color: #1d4ed8; font-weight: 700;">Browse All ${TOOLS_LIST.length} Tools</a> · <a href="/guides" style="color: #1d4ed8; font-weight: 700;">Guides</a> · <a href="/about" style="color: #1d4ed8; font-weight: 700;">About ${escapeHtml(SITE_NAME)}</a> · <a href="/privacy" style="color: #1d4ed8; font-weight: 700;">Privacy Policy</a></p>
        </section>`;
    case '/privacy':
      return `
        <section style="margin-top: 2rem;">
          <h2 style="font-size: 1.2rem; font-weight: 700; color: #0f172a;">1. Local Client-Side Processing</h2>
          <p style="color: #475569; line-height: 1.6;">FreeTools Hub is engineered so that core document builders, calculators, image compressors, QR generators, and text utilities execute directly inside your web browser. Personal resume entries, salary and gratuity inputs, uploaded images, and generated passwords are not uploaded to or stored on a central user-profile database.</p>
        </section>
        <section style="margin-top: 1.5rem;">
          <h2 style="font-size: 1.2rem; font-weight: 700; color: #0f172a;">2. When Network Requests Occur</h2>
          <ul style="padding-left: 1.25rem; color: #475569; line-height: 1.6;">
            <li><strong>SEO Page Analyzer (URL Mode):</strong> When you explicitly enter a public URL to audit, the application fetches that target webpage&apos;s public HTML headers and markup to analyze its meta tags.</li>
            <li><strong>Web Fonts &amp; Static Assets:</strong> Standard typography stylesheets (such as Google Fonts) are cached locally by your browser and Service Worker for offline reuse.</li>
          </ul>
        </section>
        <section style="margin-top: 1.5rem;">
          <h2 style="font-size: 1.2rem; font-weight: 700; color: #0f172a;">3. Browser Local Storage &amp; Offline Cache</h2>
          <p style="color: #475569; line-height: 1.6;">We use your browser&apos;s built-in <code>localStorage</code> to remember your theme preference (light/dark), interface language (English/Urdu), starred favorite tools, tool ratings, and auto-saved drafts (such as CV Builder and AI Prompt drafts). You can erase tool drafts at any time using the Reset button on any tool page or by clearing site data in your browser settings.</p>
        </section>
        <section style="margin-top: 1.5rem;">
          <h2 style="font-size: 1.2rem; font-weight: 700; color: #0f172a;">4. Third-Party Advertising &amp; Trackers</h2>
          <p style="color: #475569; line-height: 1.6;">FreeTools Hub does not sell personal information and does not embed hidden keystroke loggers or third-party behavioral ad networks.</p>
          <p style="margin-top: 1rem;"><a href="/terms" style="color: #1d4ed8; font-weight: 600;">Terms of Use</a> · <a href="/disclaimer" style="color: #1d4ed8; font-weight: 600;">Legal &amp; Calculator Disclaimer</a> · <a href="/tools" style="color: #1d4ed8; font-weight: 600;">All Tools</a></p>
        </section>`;
    case '/terms':
      return `
        <section style="margin-top: 1.5rem; padding: 1rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 0.75rem;">
          <h2 style="font-size: 1.1rem; font-weight: 700; color: #78350f; margin: 0 0 0.4rem;">Important Financial, Employment &amp; Health Calculator Disclaimer</h2>
          <p style="color: #78350f; line-height: 1.6; margin: 0;">All calculators on FreeTools Hub—including the UAE Salary Calculator, UAE Gratuity Calculator, Loan &amp; EMI Calculator, Currency/Crypto Converters, and BMI Calculator—provide informational and educational estimates only. They do not constitute legal advice, certified accounting advice, official MOHRE determinations, or medical diagnosis.</p>
        </section>
        <section style="margin-top: 1.5rem;">
          <h2 style="font-size: 1.2rem; font-weight: 700; color: #0f172a;">1. Permitted Use &amp; User Ownership</h2>
          <p style="color: #475569; line-height: 1.6;">You may use FreeTools Hub free of charge for personal, academic, and commercial workflows. You retain full ownership and responsibility for any CVs, resumes, prompts, QR codes, or documents you generate and download using these tools.</p>
        </section>
        <section style="margin-top: 1.5rem;">
          <h2 style="font-size: 1.2rem; font-weight: 700; color: #0f172a;">2. UAE Employment &amp; Gratuity Estimations</h2>
          <p style="color: #475569; line-height: 1.6;">UAE Gratuity calculations reference standard private-sector provisions of UAE Federal Decree-Law No. 33 of 2021 (and optional historical comparisons to Federal Law No. 8 of 1980). Actual end-of-service settlements may vary depending on your registered employment contract, free-zone regulations (such as DIFC DEWS or ADGM rules), unpaid absences, workplace savings plans, or official MOHRE guidance.</p>
        </section>
        <section style="margin-top: 1.5rem;">
          <h2 style="font-size: 1.2rem; font-weight: 700; color: #0f172a;">3. No Warranty &amp; Limitation of Liability</h2>
          <p style="color: #475569; line-height: 1.6;">All utilities are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of completeness, uninterrupted availability, or fitness for a specific legal or financial filing.</p>
        </section>
        <section style="margin-top: 1.5rem;">
          <h2 style="font-size: 1.2rem; font-weight: 700; color: #0f172a;">4. Acceptable Conduct</h2>
          <p style="color: #475569; line-height: 1.6;">Users must not use QR generators, URL analyzers, or text utilities to generate deceptive phishing links, unlawful content, or automated denial-of-service traffic.</p>
          <p style="margin-top: 1rem;"><a href="/privacy" style="color: #1d4ed8; font-weight: 600;">Privacy Policy</a> · <a href="/disclaimer" style="color: #1d4ed8; font-weight: 600;">Full Disclaimers</a> · <a href="/tools" style="color: #1d4ed8; font-weight: 600;">All Tools</a></p>
        </section>`;
    case '/disclaimer':
      return `
        <section style="margin-top: 1.75rem;">
          <h2 style="font-size: 1.2rem; font-weight: 700; color: #0f172a;">1. UAE Gratuity &amp; Salary Calculators (Not Legal or MOHRE Advice)</h2>
          <p style="color: #475569; line-height: 1.6;">The UAE End-of-Service Gratuity Calculator and UAE Monthly Salary Calculator model standard private-sector formulas published under UAE Federal Decree-Law No. 33 of 2021 (and optional historical reference tiers from Federal Law No. 8 of 1980). Calculations assume a 365-day year, basic salary excluding allowances, and continuous service after deducting entered unpaid leave days. Always verify final settlements with your employer&apos;s HR department, MOHRE, or licensed UAE legal counsel.</p>
        </section>
        <section style="margin-top: 1.5rem;">
          <h2 style="font-size: 1.2rem; font-weight: 700; color: #0f172a;">2. Loan, Currency, Crypto &amp; Financial Utilities</h2>
          <p style="color: #475569; line-height: 1.6;">Loan EMI schedules, discount/VAT breakdowns, fiat currency conversions, and cryptocurrency estimates are indicative mathematical models. Exchange rates and digital asset prices may use delayed public feeds or reference fallback rates when offline and exclude bank remittance spreads, brokerage fees, or tax obligations.</p>
        </section>
        <section style="margin-top: 1.5rem;">
          <h2 style="font-size: 1.2rem; font-weight: 700; color: #0f172a;">3. Health &amp; BMI Calculator</h2>
          <p style="color: #475569; line-height: 1.6;">Body Mass Index (BMI) classifications use general World Health Organization (WHO) adult reference ranges and do not account for muscle mass, bone density, age, pregnancy, or individual medical history.</p>
        </section>
        <section style="margin-top: 1.5rem;">
          <h2 style="font-size: 1.2rem; font-weight: 700; color: #0f172a;">4. CV Builder, SEO Analyzer &amp; AI Prompt Generators</h2>
          <p style="color: #475569; line-height: 1.6;">Resume templates, SEO audit scores, and structured AI photo/video prompts are productivity aids. FreeTools Hub does not guarantee job placement, ATS ranking outcomes, search engine indexing, or specific third-party AI model outputs.</p>
          <p style="margin-top: 1rem;"><a href="/privacy" style="color: #1d4ed8; font-weight: 600;">Privacy Policy</a> · <a href="/terms" style="color: #1d4ed8; font-weight: 600;">Terms of Use</a> · <a href="/tools" style="color: #1d4ed8; font-weight: 600;">All Tools</a></p>
        </section>`;
    default:
      return '';
  }
}

function generateStaticPageHtml(baseTemplate: string, page: StaticPageSeoConfig): string {
  const canonicalUrl = `${CANONICAL_DOMAIN}${page.path}`;
  const jsonLd = buildJsonLdForPath(page.path, CANONICAL_DOMAIN);

  const html = applyHeadMeta(baseTemplate, {
    title: page.title,
    description: page.description,
    canonicalUrl,
    jsonLd,
  });

  const bodyContentHtml = renderTrustBodyHtml(page);

  const pageContent = `
    <div id="root">
      ${renderHeaderHtml()}

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

          ${bodyContentHtml}
        </article>
      </main>

      ${renderFooterHtml()}
    </div>`;

  return html.replace(/<div id="root"><\/div>/i, pageContent.trim());
}

export function prerenderAllPages() {
  const distIndexPath = path.resolve(DIST_DIR, 'index.html');
  if (!fs.existsSync(distIndexPath)) {
    throw new Error('dist/index.html does not exist. Run "vite build" first before prerendering.');
  }

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

  // 2. Prerender 28 Core Tool Pages + 15 PDF Sub-Tool Landing Pages as flat .html files
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

  for (const pdfRoute of PDF_LANDING_ROUTES) {
    const pdfHtml = generatePdfLandingPrerenderedHtml(baseHtml, pdfRoute);
    fs.writeFileSync(path.resolve(toolsOutDir, `${pdfRoute.primarySlug}.html`), pdfHtml, 'utf-8');
  }

  // 3. Prerender 7 Category Landing Pages
  const catsOutDir = path.resolve(DIST_DIR, 'categories');
  fs.mkdirSync(catsOutDir, { recursive: true });
  for (const cat of CATEGORY_LANDINGS) {
    const catHtml = generateCategoryPrerenderedHtml(baseHtml, cat);
    fs.writeFileSync(path.resolve(catsOutDir, `${cat.slug}.html`), catHtml, 'utf-8');
  }

  // 4. Prerender 10 Editorial Guide Articles
  const guidesOutDir = path.resolve(DIST_DIR, 'guides');
  fs.mkdirSync(guidesOutDir, { recursive: true });
  for (const guide of EDITORIAL_GUIDES) {
    const guideHtml = generateGuideArticlePrerenderedHtml(baseHtml, guide);
    fs.writeFileSync(path.resolve(guidesOutDir, `${guide.slug}.html`), guideHtml, 'utf-8');
  }

  // 5. Prerender Static Pages (/tools, /guides, /about, /contact, /privacy, /terms, /disclaimer)
  const subStaticPages = STATIC_PAGES_SEO.filter((p) => p.slug !== '');
  for (const page of subStaticPages) {
    const legacyPageDir = path.resolve(DIST_DIR, page.slug);
    if (page.slug !== 'tools' && page.slug !== 'guides' && fs.existsSync(legacyPageDir) && fs.statSync(legacyPageDir).isDirectory()) {
      fs.rmSync(legacyPageDir, { recursive: true, force: true });
    } else if (page.slug === 'tools' || page.slug === 'guides') {
      const legacyIndex = path.resolve(legacyPageDir, 'index.html');
      if (fs.existsSync(legacyIndex)) {
        fs.rmSync(legacyIndex, { force: true });
      }
    }
    const pageHtml = generateStaticPageHtml(baseHtml, page);
    fs.writeFileSync(path.resolve(DIST_DIR, `${page.slug}.html`), pageHtml, 'utf-8');
  }

  const totalPages =
    1 +
    toolRoutes.length +
    PDF_LANDING_ROUTES.length +
    CATEGORY_LANDINGS.length +
    EDITORIAL_GUIDES.length +
    subStaticPages.length;
  console.log(
    `[SEO Prerender] ✓ Generated ${totalPages} flat prerendered HTML pages + sitemap.xml (${seoAssetsResult.urlCount} URLs), robots.txt, 404.html, site.webmanifest, and _redirects in dist/.`
  );
}

if (process.argv[1] && process.argv[1].endsWith('prerenderSeo.ts')) {
  prerenderAllPages();
}
