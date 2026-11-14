import express from 'express';
import type { Request, Response } from 'express';
import http from 'node:http';
import dns from 'node:dns/promises';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const MAX_HTML_BYTES = 2 * 1024 * 1024; // 2 MB cap
const MAX_REDIRECTS = 4;
const FETCH_TIMEOUT_MS = 8500;

/**
 * Canonical tool routes and legacy aliases (kept in sync with src/data/toolsRouting.ts)
 */
const CANONICAL_TOOL_SLUGS: Record<string, string[]> = {
  'cv-maker': ['resume-builder', 'cv-builder', 'resume-maker'],
  'uae-gratuity-calculator': ['uae-gratuity', 'gratuity-calculator'],
  'uae-salary-calculator': ['dubai-salary-calculator', 'uae-salary'],
  'ai-photo-prompt-generator': ['gemini-photo-prompt', 'photo-prompt-generator'],
  'ai-video-prompt-generator': ['ai-video-prompt', 'video-prompt-generator'],
  'markdown-editor': ['markdown-live-editor'],
  'seo-page-analyzer': ['seo-analyzer', 'page-analyzer'],
  'seo-meta-generator': ['meta-tag-generator'],
  'word-counter': ['character-counter'],
  'text-case-converter': ['case-converter'],
  'image-compressor': ['compress-image', 'photo-compressor'],
  'qr-code-generator': ['qr-generator', 'qr-maker', 'qrcode-generator'],
  'color-picker': ['color-converter', 'palette-generator'],
  'loan-calculator': ['mortgage-calculator', 'emi-calculator', 'loan-emi-calculator'],
  'currency-converter': ['forex-converter'],
  'crypto-converter': ['bitcoin-converter'],
  'percentage-calculator': [],
  'discount-calculator': ['sale-calculator'],
  'unit-converter': [],
  'password-generator': ['strong-password-generator'],
  'password-strength': ['password-checker'],
  'age-calculator': [],
  'date-difference': ['days-between-dates'],
  'bmi-calculator': [],
  'timezone-converter': ['time-zone-converter', 'world-clock'],
  'json-formatter': ['json-validator', 'json-beautifier'],
  'base64-converter': ['base64-encoder', 'base64-decoder'],
  'pdf-tools-suite': ['pdf-tools', 'pdf-suite', 'pdf-editor', 'pdf-converter'],
};

const CANONICAL_STATIC_PATHS = new Set([
  '/',
  '/tools',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/disclaimer',
]);

const ALIAS_TO_CANONICAL_SLUG = new Map<string, string>();
for (const [primarySlug, aliases] of Object.entries(CANONICAL_TOOL_SLUGS)) {
  for (const alias of aliases) {
    if (alias !== primarySlug) {
      ALIAS_TO_CANONICAL_SLUG.set(alias.toLowerCase(), primarySlug);
    }
  }
}

function normalizePathname(rawPath: string): string {
  const withoutQuery = rawPath.split('?')[0].split('#')[0];
  if (!withoutQuery || withoutQuery === '/') return '/';
  const trimmed = withoutQuery.endsWith('/') ? withoutQuery.slice(0, -1) : withoutQuery;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function classifyAppRoute(pathname: string): {
  status: 200 | 301 | 404;
  redirectTo?: string;
} {
  const clean = normalizePathname(pathname);
  if (CANONICAL_STATIC_PATHS.has(clean)) {
    return { status: 200 };
  }

  if (clean.startsWith('/tools/')) {
    const slug = clean.slice('/tools/'.length).toLowerCase();
    if (!slug || slug.includes('/')) {
      return { status: 404 };
    }
    if (Object.prototype.hasOwnProperty.call(CANONICAL_TOOL_SLUGS, slug)) {
      return { status: 200 };
    }
    const mappedCanonical = ALIAS_TO_CANONICAL_SLUG.get(slug);
    if (mappedCanonical) {
      return { status: 301, redirectTo: `/tools/${mappedCanonical}` };
    }
  }

  return { status: 404 };
}

const ROUTE_SEO_MAP: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'FreeTools Hub – Free Online Tools & UAE Calculators',
    description:
      'FreeTools Hub offers 28 free privacy-first online tools, including a PDF Tools Suite, ATS CV maker, UAE gratuity & salary calculators, AI prompt generators, and SEO utilities.',
  },
  '/tools': {
    title: 'All 28 Free Online Tools & Calculators | FreeTools Hub',
    description:
      'Browse the complete FreeTools Hub directory: PDF Tools Suite (43 tools), ATS CV builder, UAE monthly salary & gratuity calculators, AI prompt generators, SEO analyzer, and developer utilities.',
  },
  '/about': {
    title: 'About FreeTools Hub – Architecture, Mission & Privacy | AbbasPro',
    description:
      'Learn how AbbasPro / FreeTools Hub builds fast, browser-based career, UAE financial, AI prompt, and developer tools with client-side privacy.',
  },
  '/contact': {
    title: 'Contact & Support – Report a Bug or Request a Tool | FreeTools Hub',
    description:
      'Contact AbbasPro / FreeTools Hub to report calculation issues, request new online utilities, or ask technical questions.',
  },
  '/privacy': {
    title: 'Privacy Policy – Client-Side Data & Local Storage | FreeTools Hub',
    description:
      'Read the FreeTools Hub Privacy Policy explaining how resume drafts, UAE salary inputs, and files stay locally inside your browser.',
  },
  '/terms': {
    title: 'Terms of Use – Permitted Usage & Ownership | FreeTools Hub',
    description:
      'Review the FreeTools Hub Terms of Use covering free personal and commercial usage, user content ownership, and acceptable conduct.',
  },
  '/disclaimer': {
    title: 'Legal & Calculator Disclaimer – UAE Labour Law, Finance & Health | FreeTools Hub',
    description:
      'Important disclaimers for UAE Gratuity, UAE Salary, Loan EMI, Currency/Crypto, BMI, and AI Prompt calculators on FreeTools Hub.',
  },
  '/tools/cv-maker': {
    title: 'CV & Resume Maker – Free ATS Professional CV Generator | FreeTools Hub',
    description:
      'Create professional, ATS-friendly resumes with live multi-template preview, custom typography, and instant PDF download without login.',
  },
  '/tools/uae-gratuity-calculator': {
    title: 'UAE Gratuity Calculator – End-of-Service Benefit Estimator | FreeTools Hub',
    description:
      'Estimate UAE end-of-service gratuity under Federal Decree-Law No. 33 of 2021 with transparent 21-day and 30-day tier breakdowns and PDF export.',
  },
  '/tools/uae-salary-calculator': {
    title: 'UAE Salary Calculator – Monthly & Annual AED Breakdown | FreeTools Hub',
    description:
      'Calculate gross and net monthly salary in AED across basic pay, housing, transport allowances, and contractual deductions with daily and annual breakdowns.',
  },
  '/tools/ai-photo-prompt-generator': {
    title: 'Gemini AI Photo Prompt Generator – Studio Photography Prompts | FreeTools Hub',
    description:
      'Architect studio-grade photorealistic image prompts for Gemini 2.5, Imagen 3, Midjourney, and Flux with facial identity preservation.',
  },
  '/tools/ai-video-prompt-generator': {
    title: 'AI Video Prompt Generator – Scene-by-Scene Production Scripts | FreeTools Hub',
    description:
      'Generate multi-scene cinematic directorial scripts for Google Flow, Runway Gen-3, Sora, and Kling with camera movements and voiceovers.',
  },
  '/tools/markdown-editor': {
    title: 'Markdown Live Editor – Split-Screen Preview & PDF Export | FreeTools Hub',
    description:
      'Write and preview GitHub Flavored Markdown with real-time split view, formatting toolbar, live stats, and Vector PDF / HTML export.',
  },
  '/tools/seo-page-analyzer': {
    title: 'SEO Page Analyzer – On-Page Audit & Meta Tags Checker | FreeTools Hub',
    description:
      'Audit any web page for missing critical SEO elements, heading hierarchy, OpenGraph social cards, performance scores, and actionable fixes.',
  },
  '/tools/seo-meta-generator': {
    title: 'SEO Meta Tags Generator – Live SERP & Social Previews | FreeTools Hub',
    description:
      'Generate optimized title tags, meta descriptions, OpenGraph tags, and Schema.org structured data with live Google SERP simulation.',
  },
  '/tools/word-counter': {
    title: 'Word & Character Counter – Real-Time Text Metrics & PDF Report | FreeTools Hub',
    description:
      'Count words, characters, sentences, paragraphs, reading and speaking time in real-time. Export executive PDF readability reports.',
  },
  '/tools/text-case-converter': {
    title: 'Text Case Converter – UPPERCASE, lowercase, Title Case, camelCase | FreeTools Hub',
    description:
      'Instantly convert text between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, and remove redundant whitespace.',
  },
  '/tools/image-compressor': {
    title: 'Image Compressor – 100% In-Browser PNG & JPEG Compression | FreeTools Hub',
    description:
      'Compress PNG, JPG, and WebP images directly in your browser with zero server uploads and privacy-first client processing.',
  },
  '/tools/qr-code-generator': {
    title: 'QR Code Generator – Custom Colored QR Codes with PNG Download | FreeTools Hub',
    description:
      'Generate custom colored scannable QR codes for websites, WiFi networks, contact vCards, and text directly in your browser.',
  },
  '/tools/color-picker': {
    title: 'Advanced Color Picker & Palette Studio – HEX, RGB, HSL, CMYK | FreeTools Hub',
    description:
      'Pick colors from images with a live magnifier, convert between HEX, RGB, HSL, and CMYK, generate color harmonies, and check WCAG contrast.',
  },
  '/tools/loan-calculator': {
    title: 'Loan & Amortization Calculator – Monthly Repayment Schedule | FreeTools Hub',
    description:
      'Calculate fixed-rate monthly loan repayments, total interest payable, and complete annual amortization schedules for personal and mortgage loans.',
  },
  '/tools/currency-converter': {
    title: 'Real-Time Currency Converter – Live Exchange Rates | FreeTools Hub',
    description:
      'Convert between 30+ global currencies with real-time exchange rates, inverse currency swapping, and bank transfer fee estimators.',
  },
  '/tools/crypto-converter': {
    title: 'Cryptocurrency Converter – Bitcoin, Ethereum, Solana Rates | FreeTools Hub',
    description:
      'Convert between Bitcoin (BTC), Ethereum (ETH), Solana (SOL), and major global fiat currencies (USD, EUR, AED, GBP) with live market feeds.',
  },
  '/tools/percentage-calculator': {
    title: 'Percentage Calculator – Increase, Decrease, Percent of Value | FreeTools Hub',
    description:
      'Fast and versatile percentage calculator: compute X% of Y, percentage increase/decrease between numbers, and retail discount savings.',
  },
  '/tools/discount-calculator': {
    title: 'Discount & Sale Price Calculator – Voucher & VAT Savings | FreeTools Hub',
    description:
      'Calculate final prices and total savings from percentage discounts, cash vouchers, quantity bundles, and sales tax/VAT.',
  },
  '/tools/unit-converter': {
    title: 'Universal Unit Converter – Metric & Imperial Measurement Conversion | FreeTools Hub',
    description:
      'Convert length, weight, temperature, area, volume, speed, and digital data storage with high mathematical precision.',
  },
  '/tools/password-generator': {
    title: 'Strong Password Generator – Cryptographically Secure Passwords | FreeTools Hub',
    description:
      'Create unbreakable passwords using browser Crypto API with configurable character sets, length, and entropy ratings.',
  },
  '/tools/password-strength': {
    title: 'Password Strength Checker – Entropy & Brute-Force Crack Time | FreeTools Hub',
    description:
      'Analyze password security in real-time with entropy calculation, brute-force crack time estimates, and dictionary leak checks.',
  },
  '/tools/age-calculator': {
    title: 'Age Calculator – Exact Chronological Age & Birthday Countdown | FreeTools Hub',
    description:
      'Calculate exact age in years, months, days, hours, and minutes with life milestones and upcoming birthday countdown.',
  },
  '/tools/date-difference': {
    title: 'Date Difference Calculator – Working Days & Weeks Between Dates | FreeTools Hub',
    description:
      'Determine total calendar days, working business days (excluding weekends), and weeks between any two calendar dates.',
  },
  '/tools/bmi-calculator': {
    title: 'BMI Calculator – Body Mass Index & Ideal Weight Range (WHO) | FreeTools Hub',
    description:
      'Calculate Body Mass Index (BMI) and health category according to WHO guidelines using metric or imperial units.',
  },
  '/tools/timezone-converter': {
    title: 'Time Zone Converter – Global Meeting Planner & Live World Clocks | FreeTools Hub',
    description:
      'Convert date and time between global time zones seamlessly with visual day/night indicators and international meeting overlap planner.',
  },
  '/tools/json-formatter': {
    title: 'JSON Formatter & Validator – Prettify, Minify & Tree Viewer | FreeTools Hub',
    description:
      'Prettify, validate, minify, and inspect raw JSON data with adjustable indentation, syntax error highlight, and interactive tree viewer.',
  },
  '/tools/base64-converter': {
    title: 'Base64 Encoder & Decoder – Text and Image Converter | FreeTools Hub',
    description:
      'Convert plain text and images to Base64 strings with UTF-8 compliance, URL-safe toggle, syntax checking, and instant file downloads.',
  },
  '/tools/pdf-tools-suite': {
    title: 'PDF Tools Suite – 43 Free Client-Side PDF Converters, Organizers, Editor & Security | FreeTools Hub',
    description:
      'Complete browser-based PDF Tools Suite with 43 utilities: convert PDF to Word/Excel/JPG/PNG/TXT, merge, split, compress, edit, OCR, watermark, encrypt, and unlock PDFs locally.',
  },
};

/**
 * Returns a verified production base URL ONLY when VITE_SITE_URL or SITE_URL
 * is explicitly configured to a real custom domain (never localhost or .run.app preview URLs).
 */
function resolveVerifiedProductionDomain(): string {
  const configured = (process.env.VITE_SITE_URL || process.env.SITE_URL || '').trim();
  if (!configured || !/^https?:\/\//i.test(configured) || configured.includes('MY_APP_URL')) {
    return '';
  }
  try {
    const parsed = new URL(configured);
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.endsWith('.run.app') ||
      host.endsWith('.localhost')
    ) {
      return '';
    }
    return `${parsed.protocol}//${parsed.host}`.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

/**
 * Resolves configurable public site base URL for robots.txt and sitemap.xml
 * without hardcoding a guessed production domain.
 */
function resolveBaseUrl(req: Request): string {
  const verified = resolveVerifiedProductionDomain();
  if (verified) {
    return verified;
  }

  const configured = (process.env.APP_URL || '').trim();
  if (configured && /^https?:\/\//i.test(configured) && !configured.includes('MY_APP_URL')) {
    return configured.replace(/\/+$/, '');
  }

  const forwardedProto = (req.headers['x-forwarded-proto'] as string | undefined)
    ?.split(',')[0]
    ?.trim();
  const forwardedHost = (req.headers['x-forwarded-host'] as string | undefined)
    ?.split(',')[0]
    ?.trim();
  const host = forwardedHost || req.headers.host || `localhost:${PORT}`;
  const proto = forwardedProto || (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https');
  return `${proto}://${host}`.replace(/\/+$/, '');
}

/**
 * Injects exact route-level <title>, <meta name="description">, <meta name="robots">,
 * OpenGraph/Twitter tags, and conditional verified-domain <link rel="canonical"> into HTML.
 */
function injectRouteSeoIntoHtml(rawHtml: string, rawUrl: string, status: 200 | 301 | 404): string {
  const cleanPath = normalizePathname(rawUrl);
  const isNotFound = status === 404;

  const meta = isNotFound
    ? {
        title: 'Page Not Found (404) | FreeTools Hub',
        description: 'The requested page or utility could not be found on FreeTools Hub.',
      }
    : ROUTE_SEO_MAP[cleanPath] || ROUTE_SEO_MAP['/'];

  const robotsContent = isNotFound ? 'noindex, follow' : 'index, follow';
  const safeTitle = escapeXml(meta.title);
  const safeDesc = escapeXml(meta.description);

  let html = rawHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);
  html = html.replace(
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="robots" content="${robotsContent}" />`
  );
  html = html.replace(
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta property="og:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta property="og:description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="twitter:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="twitter:description" content="${safeDesc}" />`
  );

  // Strip any pre-existing canonical or og:url before conditionally injecting verified production URL
  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>\s*/gi, '');
  html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>\s*/gi, '');

  const verifiedDomain = resolveVerifiedProductionDomain();
  if (!isNotFound && verifiedDomain) {
    const canonicalHref = escapeXml(
      cleanPath === '/' ? `${verifiedDomain}/` : `${verifiedDomain}${cleanPath}`
    );
    const canonicalTags = `\n    <link rel="canonical" href="${canonicalHref}" />\n    <meta property="og:url" content="${canonicalHref}" />`;
    html = html.replace('</title>', `</title>${canonicalTags}`);
  }

  return html;
}

/**
 * SSRF IP validation: blocks loopback, RFC1918 private, link-local / cloud metadata, CGNAT, multicast, and ULA ranges.
 */
function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local & cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT / Alibaba metadata
  if (a === 192 && b === 0 && (parts[2] === 0 || parts[2] === 2)) return true; // IETF / TEST-NET-1
  if (a === 198 && (b === 18 || b === 19)) return true; // Benchmarking
  if (a === 198 && b === 51 && parts[2] === 100) return true; // TEST-NET-2
  if (a === 203 && b === 0 && parts[2] === 113) return true; // TEST-NET-3
  if (a >= 224) return true; // Multicast & reserved (224.0.0.0/4, 240.0.0.0/4)
  return false;
}

function isPrivateOrReservedIP(ipRaw: string): boolean {
  const ip = ipRaw.trim().toLowerCase().replace(/^\[|\]$/g, '');
  const version = net.isIP(ip);
  if (version === 4) {
    return isPrivateOrReservedIPv4(ip);
  }
  if (version === 6) {
    if (ip === '::' || ip === '::1' || ip === '0:0:0:0:0:0:0:1' || ip === '0:0:0:0:0:0:0:0') {
      return true;
    }
    // IPv4-mapped IPv6 e.g. ::ffff:127.0.0.1 or ::ffff:7f00:1
    if (ip.startsWith('::ffff:')) {
      const tail = ip.slice('::ffff:'.length);
      if (net.isIP(tail) === 4) {
        return isPrivateOrReservedIPv4(tail);
      }
      // Hex form ::ffff:7f00:0001
      const hexGroups = tail.split(':');
      if (hexGroups.length === 2) {
        const hi = parseInt(hexGroups[0], 16);
        const lo = parseInt(hexGroups[1], 16);
        if (!Number.isNaN(hi) && !Number.isNaN(lo)) {
          const v4 = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
          return isPrivateOrReservedIPv4(v4);
        }
      }
      return true;
    }
    // Unique local fc00::/7 (fc.. or fd..)
    if (ip.startsWith('fc') || ip.startsWith('fd')) return true;
    // Link-local fe80::/10 (fe8, fe9, fea, feb)
    if (/^fe[89ab]/.test(ip)) return true;
    // Multicast ff00::/8
    if (ip.startsWith('ff')) return true;
    // Documentation 2001:db8::/32
    if (ip.startsWith('2001:db8:') || ip.startsWith('2001:0db8:')) return true;
    return false;
  }
  return true;
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata',
  'metadata.google.internal',
  'metadata.goog',
  'instance-data',
  'kubernetes.default',
  'kubernetes.default.svc',
]);

async function assertSafePublicUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL format. Include http:// or https://');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http:// and https:// URLs are permitted.');
  }

  if (parsed.username || parsed.password) {
    throw new Error('URLs containing embedded credentials are not permitted.');
  }

  if (parsed.port && !['80', '443', '8080', '8443'].includes(parsed.port)) {
    throw new Error('Non-standard destination ports are restricted.');
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (
    !hostname ||
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error('Private, local, and internal hostnames are blocked for security.');
  }

  // Direct IP literal check
  if (net.isIP(hostname.replace(/^\[|\]$/g, ''))) {
    if (isPrivateOrReservedIP(hostname)) {
      throw new Error('Requests to private, loopback, or reserved IP addresses are blocked.');
    }
    return parsed;
  }

  // DNS resolution check (all records must be public)
  let records: { address: string; family: number }[];
  try {
    records = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error('Unable to resolve destination domain name.');
  }

  if (!records || records.length === 0) {
    throw new Error('Destination domain has no valid DNS records.');
  }

  for (const rec of records) {
    if (isPrivateOrReservedIP(rec.address)) {
      throw new Error('Destination resolves to a restricted internal or loopback IP address.');
    }
  }

  return parsed;
}

async function readStreamWithLimit(response: globalThis.Response, maxBytes: number): Promise<string> {
  if (!response.body) {
    const text = await response.text();
    return text.slice(0, maxBytes);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        if (received + value.byteLength > maxBytes) {
          const allowed = maxBytes - received;
          if (allowed > 0) {
            chunks.push(value.subarray(0, allowed));
          }
          await reader.cancel();
          break;
        }
        chunks.push(value);
        received += value.byteLength;
      }
    }
  } finally {
    reader.releaseLock();
  }

  const merged = new Uint8Array(chunks.reduce((acc, c) => acc + c.byteLength, 0));
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder('utf-8', { fatal: false }).decode(merged);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  const httpServer = http.createServer(app);

  const isProduction =
    process.env.NODE_ENV === 'production' || process.env.npm_lifecycle_event === 'start';

  // Common iframe-safe security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // 1. SSRF-Hardened SEO Page Analyzer Proxy
  app.get('/api/analyze-seo', async (req: Request, res: Response) => {
    const rawTarget = typeof req.query.url === 'string' ? req.query.url.trim() : '';
    const checkOnly = req.query.checkOnly === '1';

    if (!rawTarget || rawTarget.length > 2048) {
      res.status(400).json({ error: 'Please provide a valid public http:// or https:// URL.' });
      return;
    }

    const startTime = performance.now();

    try {
      let currentUrl = await assertSafePublicUrl(rawTarget);
      let finalResponse: globalThis.Response | null = null;
      let redirectCount = 0;

      while (redirectCount <= MAX_REDIRECTS) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        try {
          finalResponse = await fetch(currentUrl.toString(), {
            method: checkOnly ? 'HEAD' : 'GET',
            signal: controller.signal,
            redirect: 'manual',
            headers: {
              'User-Agent':
                'Mozilla/5.0 (compatible; FreeToolsHub-SEOAnalyzer/1.0)',
              Accept:
                'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            },
          });
        } finally {
          clearTimeout(timer);
        }

        // If HEAD was rejected with 405/403 in checkOnly mode, retry once with GET
        if (checkOnly && (finalResponse.status === 405 || finalResponse.status === 501)) {
          const controllerGet = new AbortController();
          const timerGet = setTimeout(() => controllerGet.abort(), FETCH_TIMEOUT_MS);
          try {
            finalResponse = await fetch(currentUrl.toString(), {
              method: 'GET',
              signal: controllerGet.signal,
              redirect: 'manual',
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; FreeToolsHub-SEOAnalyzer/1.0)',
                Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
              },
            });
          } finally {
            clearTimeout(timerGet);
          }
        }

        if (
          finalResponse.status >= 300 &&
          finalResponse.status < 400 &&
          finalResponse.headers.get('location')
        ) {
          if (checkOnly) {
            // Report redirect status directly for link crawler
            break;
          }
          redirectCount += 1;
          if (redirectCount > MAX_REDIRECTS) {
            res.status(400).json({ error: 'Too many redirects while fetching target URL.' });
            return;
          }
          const nextLocation = new URL(finalResponse.headers.get('location')!, currentUrl).toString();
          currentUrl = await assertSafePublicUrl(nextLocation);
          continue;
        }

        break;
      }

      if (!finalResponse) {
        res.status(502).json({ error: 'No response received from target server.' });
        return;
      }

      const ttfbMs = Math.round(performance.now() - startTime);

      if (checkOnly) {
        if (finalResponse.body) {
          try {
            await finalResponse.body.cancel();
          } catch {}
        }
        res.status(200).json({
          url: rawTarget,
          finalUrl: currentUrl.toString(),
          status: finalResponse.status,
          statusText: finalResponse.statusText || 'OK',
          ttfbMs,
        });
        return;
      }

      const contentType = (finalResponse.headers.get('content-type') || '').toLowerCase();
      if (
        contentType &&
        !contentType.includes('text/html') &&
        !contentType.includes('application/xhtml+xml') &&
        !contentType.includes('text/plain') &&
        !contentType.includes('application/xml') &&
        !contentType.includes('text/xml')
      ) {
        if (finalResponse.body) {
          try {
            await finalResponse.body.cancel();
          } catch {}
        }
        res.status(415).json({
          error: 'Target URL did not return an HTML document. Only public web pages can be audited.',
        });
        return;
      }

      const safeHeaders: Record<string, string> = {};
      const allowedResponseHeaders = [
        'content-type',
        'cache-control',
        'x-robots-tag',
        'strict-transport-security',
        'content-encoding',
        'server',
      ];
      for (const h of allowedResponseHeaders) {
        const val = finalResponse.headers.get(h);
        if (val) safeHeaders[h] = val;
      }

      const html = await readStreamWithLimit(finalResponse, MAX_HTML_BYTES);
      const totalMs = Math.round(performance.now() - startTime);

      res.status(200).json({
        url: rawTarget,
        finalUrl: currentUrl.toString(),
        status: finalResponse.status,
        statusText: finalResponse.statusText,
        ttfbMs,
        totalMs,
        contentLength: html.length,
        isHttps: currentUrl.protocol === 'https:',
        headers: safeHeaders,
        html,
      });
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : 'Unable to fetch target URL.';
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const isPolicyError =
        rawMessage.includes('blocked') ||
        rawMessage.includes('restricted') ||
        rawMessage.includes('permitted') ||
        rawMessage.includes('Invalid URL') ||
        rawMessage.includes('resolve');

      res.status(isPolicyError ? 400 : isAbort ? 504 : 502).json({
        error: isAbort
          ? 'The target website timed out while responding. You can also use the Raw HTML tab to audit its source.'
          : isPolicyError
          ? rawMessage
          : 'Could not retrieve HTML from the target website (it may block automated requests). Try pasting its source into the Raw HTML tab.',
      });
    }
  });

  // Return 404 JSON for any unknown /api/* route
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // 2. Dynamic Robots.txt (uses configured VITE_SITE_URL / APP_URL or active request host)
  app.get('/robots.txt', (req: Request, res: Response) => {
    const baseUrl = resolveBaseUrl(req);
    const body = [
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      '',
      `Sitemap: ${baseUrl}/sitemap.xml`,
      '',
    ].join('\n');
    res.status(200).type('text/plain; charset=utf-8').send(body);
  });

  // 3. Dynamic XML Sitemap (strictly canonical, indexable 200 OK public routes only)
  app.get('/sitemap.xml', (req: Request, res: Response) => {
    const baseUrl = resolveBaseUrl(req);
    const entries: { path: string; changefreq: string; priority: string }[] = [
      { path: '/', changefreq: 'weekly', priority: '1.0' },
      { path: '/tools', changefreq: 'weekly', priority: '0.9' },
      ...Object.keys(CANONICAL_TOOL_SLUGS).map((slug, idx) => ({
        path: `/tools/${slug}`,
        changefreq: 'monthly',
        priority: idx < 5 ? '0.9' : '0.8',
      })),
      { path: '/about', changefreq: 'monthly', priority: '0.5' },
      { path: '/contact', changefreq: 'monthly', priority: '0.5' },
      { path: '/privacy', changefreq: 'yearly', priority: '0.4' },
      { path: '/terms', changefreq: 'yearly', priority: '0.4' },
      { path: '/disclaimer', changefreq: 'yearly', priority: '0.4' },
    ];

    const xmlUrls = entries
      .map((entry) => {
        const loc = entry.path === '/' ? `${baseUrl}/` : `${baseUrl}${entry.path}`;
        return [
          '  <url>',
          `    <loc>${escapeXml(loc)}</loc>`,
          `    <changefreq>${entry.changefreq}</changefreq>`,
          `    <priority>${entry.priority}</priority>`,
          '  </url>',
        ].join('\n');
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlUrls}\n</urlset>\n`;
    res.status(200).type('application/xml; charset=utf-8').send(xml);
  });

  // 4. Canonical 301 Redirects for Legacy Alias Slugs (preserves existing links while preventing duplicate URLs)
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }
    const clean = normalizePathname(req.path);
    if (clean.startsWith('/tools/')) {
      const routeInfo = classifyAppRoute(clean);
      if (routeInfo.status === 301 && routeInfo.redirectTo) {
        const searchSuffix = req.originalUrl.includes('?')
          ? req.originalUrl.slice(req.originalUrl.indexOf('?'))
          : '';
        res.redirect(301, `${routeInfo.redirectTo}${searchSuffix}`);
        return;
      }
    }
    next();
  });

  if (!isProduction) {
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: hmrDisabled ? false : { server: httpServer },
        ws: hmrDisabled ? false : undefined,
      },
      appType: 'custom',
    });

    if (hmrDisabled) {
      // Vite 8 still initializes a WebSocket transport inside /@vite/client even when hmr:false & ws:false.
      // Stubbing createWebSocketModuleRunnerTransport to a connected no-op prevents both WebSocket connection
      // failures (@vite/client:225:39) and SendBeforeConnectError (@vite/client:188:42) when plugins call import.meta.hot.send().
      app.get('/@vite/client', async (req: Request, res: Response, next) => {
        try {
          const transformed = await vite.transformRequest(req.originalUrl);
          if (transformed?.code) {
            const patchedCode = transformed.code.replace(
              /const createWebSocketModuleRunnerTransport = \(options\) => \{/,
              'const createWebSocketModuleRunnerTransport = (_options) => { if (true) return { async connect() {}, async disconnect() {}, send() {} };'
            );
            res
              .status(200)
              .set({
                'Content-Type': 'application/javascript; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
              })
              .end(patchedCode);
            return;
          }
          next();
        } catch (err) {
          next(err);
        }
      });
    }

    app.use(vite.middlewares);

    app.get('*', async (req: Request, res: Response, next) => {
      try {
        const url = req.originalUrl;
        const routeInfo = classifyAppRoute(url);
        const rawTemplate = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        const seoTemplate = injectRouteSeoIntoHtml(rawTemplate, url, routeInfo.status);
        let html = await vite.transformIndexHtml(url, seoTemplate);
        if (hmrDisabled) {
          html = html.replace(
            /<script id="vite-plugin-pwa:register-dev-sw"[^>]*>[\s\S]*?<\/script>/g,
            ''
          );
        }
        res
          .status(routeInfo.status === 404 ? 404 : 200)
          .set({ 'Content-Type': 'text/html; charset=utf-8' })
          .end(html);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(
      express.static(distDir, {
        index: false,
        maxAge: '7d',
      })
    );

    app.get('*', (req: Request, res: Response) => {
      const indexHtmlPath = path.join(distDir, 'index.html');
      if (!fs.existsSync(indexHtmlPath)) {
        res.status(503).send('Application build not found. Run npm run build first.');
        return;
      }
      const routeInfo = classifyAppRoute(req.originalUrl);
      if (routeInfo.status === 301 && routeInfo.redirectTo) {
        res.redirect(301, routeInfo.redirectTo);
        return;
      }

      const cleanPath = normalizePathname(req.originalUrl);
      const prerenderedSubPath = path.join(distDir, cleanPath.replace(/^\//, ''), 'index.html');
      if (cleanPath !== '/' && fs.existsSync(prerenderedSubPath)) {
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).sendFile(prerenderedSubPath);
        return;
      }

      const rawHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
      const seoHtml = injectRouteSeoIntoHtml(rawHtml, req.originalUrl, routeInfo.status);
      res
        .status(routeInfo.status === 404 ? 404 : 200)
        .set({ 'Content-Type': 'text/html; charset=utf-8' })
        .send(seoHtml);
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`FreeTools Hub server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
