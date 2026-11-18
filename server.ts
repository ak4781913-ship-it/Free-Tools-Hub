import express from 'express';
import type { Request, Response } from 'express';
import http from 'node:http';
import dns from 'node:dns/promises';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  DEFAULT_PRODUCTION_URL,
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  classifyPublicRoute,
  getAllCanonicalSitemapEntries,
  getRouteSeoForPath,
  normalizeSeoPathname,
  sanitizePublicOrigin,
} from './src/data/seoRegistry';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parsedPort = Number(process.env.PORT);
const PORT =
  Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65536 ? parsedPort : 3000;
const MAX_HTML_BYTES = 2 * 1024 * 1024; // 2 MB cap
const MAX_REDIRECTS = 4;
const FETCH_TIMEOUT_MS = 8500;

function classifyAppRoute(pathname: string): {
  status: 200 | 301 | 404;
  redirectTo?: string;
} {
  const result = classifyPublicRoute(pathname);
  return {
    status: result.status,
    redirectTo: result.redirectTo,
  };
}

let hasWarnedMissingProductionOrigin = false;

/**
 * Returns explicitly configured trusted production origin (VITE_SITE_URL, SITE_URL, URL, or APP_URL).
 * Never trusts unverified incoming Host or X-Forwarded-Host headers for canonical/sitemap generation.
 * Falls back safely to DEFAULT_PRODUCTION_URL with a one-time warning when unset.
 */
function resolveVerifiedProductionDomain(): string {
  const candidates = [
    process.env.VITE_SITE_URL,
    process.env.SITE_URL,
    process.env.URL,
    process.env.APP_URL,
  ];
  for (const c of candidates) {
    const clean = sanitizePublicOrigin(c);
    if (clean) return clean;
  }
  if (!hasWarnedMissingProductionOrigin) {
    hasWarnedMissingProductionOrigin = true;
    console.warn(
      `[SEO Warning] VITE_SITE_URL / SITE_URL / URL / APP_URL is not configured. Ignoring unverified request Host/X-Forwarded-Host headers and falling back to ${DEFAULT_PRODUCTION_URL}. Set VITE_SITE_URL (and/or APP_URL) for custom production domains.`
    );
  }
  return DEFAULT_PRODUCTION_URL;
}

/**
 * Resolves active public site base URL for robots.txt and sitemap.xml.
 */
function resolveBaseUrl(): string {
  return resolveVerifiedProductionDomain();
}

/**
 * If prerendered HTML used DEFAULT_PRODUCTION_URL at build time but runtime serves a different
 * explicitly configured origin, rewrite canonical/OG/schema origin references cleanly.
 */
function applyRuntimeDomainToHtml(html: string): string {
  const activeDomain = resolveVerifiedProductionDomain();
  if (activeDomain && activeDomain !== DEFAULT_PRODUCTION_URL && html.includes(DEFAULT_PRODUCTION_URL)) {
    return html.split(DEFAULT_PRODUCTION_URL).join(activeDomain);
  }
  return html;
}

/**
 * Injects exact route-level <title>, <meta name="description">, <meta name="robots">,
 * OpenGraph/Twitter tags, canonical URL, optional GSC verification, and JSON-LD into HTML.
 */
function injectRouteSeoIntoHtml(
  rawHtml: string,
  rawUrl: string,
  status: 200 | 301 | 404
): string {
  const cleanPath = normalizeSeoPathname(rawUrl);
  const isNotFound = status === 404;
  const canonicalBase = resolveVerifiedProductionDomain();
  const seo = getRouteSeoForPath(isNotFound ? '/404' : cleanPath, canonicalBase);

  const safeTitle = escapeXml(seo.title);
  const safeDesc = escapeXml(seo.description);
  const ogImageUrl = escapeXml(`${canonicalBase}${OG_IMAGE_PATH}`);

  let html = rawHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);
  html = html.replace(
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="robots" content="${seo.robots}" />`
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
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${ogImageUrl}" />`
  );
  html = html.replace(
    /<meta\s+property="og:image:alt"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta property="og:image:alt" content="${escapeXml(OG_IMAGE_ALT)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="twitter:title" content="${safeTitle}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/?>/i,
    `<meta name="twitter:description" content="${safeDesc}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${ogImageUrl}" />`
  );

  // Strip any pre-existing canonical or og:url before conditionally injecting
  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>\s*/gi, '');
  html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>\s*/gi, '');

  if (!isNotFound && seo.canonicalPath) {
    const canonicalHref = escapeXml(
      seo.canonicalPath === '/' ? `${canonicalBase}/` : `${canonicalBase}${seo.canonicalPath}`
    );
    const canonicalTags = `\n    <link rel="canonical" href="${canonicalHref}" />\n    <meta property="og:url" content="${canonicalHref}" />`;
    html = html.replace('</title>', `</title>${canonicalTags}`);
  }

  // Google Site Verification tag from env (updates existing tag cleanly; preserves base tag when unset)
  const verificationToken = (
    process.env.VITE_GOOGLE_SITE_VERIFICATION ||
    process.env.GOOGLE_SITE_VERIFICATION ||
    ''
  ).trim();
  if (verificationToken) {
    html = html.replace(/\s*<meta\s+name="google-site-verification"[^>]*\/?>/gi, '');
    html = html.replace(
      '</head>',
      `\n    <meta name="google-site-verification" content="${escapeXml(verificationToken)}" />\n  </head>`
    );
  }

  // Route-specific JSON-LD
  html = html.replace(/<script\s+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/gi, '');
  if (!isNotFound && seo.jsonLd && seo.jsonLd.length > 0) {
    const schemaTag = `\n    <script id="dynamic-route-jsonld" type="application/ld+json">${JSON.stringify(seo.jsonLd)}</script>`;
    html = html.replace('</head>', `${schemaTag}\n  </head>`);
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
  app.set('trust proxy', 1);
  const httpServer = http.createServer(app);

  const isCompiledServerJs = path.basename(__filename) === 'server.js';
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.npm_lifecycle_event === 'start' ||
    (isCompiledServerJs && process.env.NODE_ENV !== 'development');

  // Common iframe- & popup-safe security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
  });

  const seoRateWindow = new Map<string, { count: number; resetAt: number }>();

  // 1. SSRF-Hardened SEO Page Analyzer Proxy
  app.all('/api/analyze-seo', (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.status(405).set('Cache-Control', 'no-store').json({ error: 'Method not allowed.' });
      return;
    }
    next();
  });

  app.get('/api/analyze-seo', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const clientIp = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || req.ip || 'unknown';
    const now = Date.now();
    if (seoRateWindow.size > 250) {
      for (const [key, entry] of seoRateWindow.entries()) {
        if (now > entry.resetAt) {
          seoRateWindow.delete(key);
        }
      }
    }
    const bucket = seoRateWindow.get(clientIp);
    if (!bucket || now > bucket.resetAt) {
      seoRateWindow.set(clientIp, { count: 1, resetAt: now + 60_000 });
    } else {
      bucket.count += 1;
      if (bucket.count > 45) {
        res.status(429).json({ error: 'Too many requests. Please wait a minute before auditing more URLs.' });
        return;
      }
    }

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

  // 2. Dynamic Robots.txt
  app.get('/robots.txt', (_req: Request, res: Response) => {
    const baseUrl = resolveBaseUrl();
    const body = [
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      'Disallow: /.netlify/',
      '',
      `Sitemap: ${baseUrl}/sitemap.xml`,
      '',
    ].join('\n');
    res.status(200).type('text/plain; charset=utf-8').send(body);
  });

  // 3. Dynamic XML Sitemap (strictly canonical, indexable 200 OK public routes only)
  app.get('/sitemap.xml', (_req: Request, res: Response) => {
    const baseUrl = resolveBaseUrl();
    const entries = getAllCanonicalSitemapEntries(baseUrl);

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

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlUrls}\n</urlset>\n`;
    res.status(200).type('application/xml; charset=utf-8').send(xml);
  });

  // 4. Canonical 301 Redirects (Trailing Slashes + Legacy Alias Slugs)
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }
    const searchSuffix = req.originalUrl.includes('?')
      ? req.originalUrl.slice(req.originalUrl.indexOf('?'))
      : '';
    if (req.path.length > 1 && req.path.endsWith('/') && !req.path.startsWith('/api')) {
      const stripped = req.path.replace(/\/+$/, '') || '/';
      const routeInfo = classifyAppRoute(stripped);
      const target = routeInfo.status === 301 && routeInfo.redirectTo ? routeInfo.redirectTo : stripped;
      res.redirect(301, `${target}${searchSuffix}`);
      return;
    }
    const clean = normalizeSeoPathname(req.path);
    if (clean.startsWith('/tools/')) {
      const routeInfo = classifyAppRoute(clean);
      if (routeInfo.status === 301 && routeInfo.redirectTo) {
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
          .set({
            'Content-Type': 'text/html; charset=utf-8',
            ...(routeInfo.status === 404 ? { 'X-Robots-Tag': 'noindex, follow' } : {}),
          })
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
        redirect: false,
        setHeaders: (res, filePath) => {
          const normalized = filePath.replace(/\\/g, '/');
          if (normalized.endsWith('.webmanifest')) {
            res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
          } else if (
            normalized.endsWith('/sw.js') ||
            normalized.endsWith('/404.html') ||
            normalized.endsWith('/sitemap.xml') ||
            normalized.endsWith('/robots.txt')
          ) {
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
            if (normalized.endsWith('/404.html')) {
              res.setHeader('X-Robots-Tag', 'noindex, follow');
            }
          } else if (normalized.includes('/assets/')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else {
            res.setHeader('Cache-Control', 'public, max-age=604800');
          }
        },
      })
    );

    // Prevent missing fingerprinted assets from returning HTML fallback with wrong MIME type
    app.use('/assets', (_req, res) => {
      res.status(404).set('Cache-Control', 'no-store').type('text/plain').send('Asset not found.');
    });

    app.get('*', (req: Request, res: Response) => {
      const indexHtmlPath = path.join(distDir, 'index.html');
      if (!fs.existsSync(indexHtmlPath)) {
        res.status(503).send('Application build not found. Run npm run build first.');
        return;
      }
      const routeInfo = classifyAppRoute(req.originalUrl);
      if (routeInfo.status === 301 && routeInfo.redirectTo) {
        const searchSuffix = req.originalUrl.includes('?')
          ? req.originalUrl.slice(req.originalUrl.indexOf('?'))
          : '';
        res.redirect(301, `${routeInfo.redirectTo}${searchSuffix}`);
        return;
      }

      const cleanPath = normalizeSeoPathname(req.originalUrl);
      const htmlHeaders = {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      };

      if (routeInfo.status === 404) {
        const notFoundHtmlPath = path.join(distDir, '404.html');
        if (fs.existsSync(notFoundHtmlPath)) {
          const notFoundHtml = applyRuntimeDomainToHtml(
            fs.readFileSync(notFoundHtmlPath, 'utf-8')
          );
          res
            .status(404)
            .set({ ...htmlHeaders, 'X-Robots-Tag': 'noindex, follow' })
            .send(notFoundHtml);
          return;
        }
      }

      const cleanRel = cleanPath.replace(/^\//, '');
      const prerenderedFlatPath = path.join(distDir, `${cleanRel}.html`);
      const prerenderedDirPath = path.join(distDir, cleanRel, 'index.html');
      if (cleanPath !== '/') {
        const matchedPath = fs.existsSync(prerenderedFlatPath)
          ? prerenderedFlatPath
          : fs.existsSync(prerenderedDirPath)
          ? prerenderedDirPath
          : null;
        if (matchedPath) {
          const prerenderedHtml = applyRuntimeDomainToHtml(
            fs.readFileSync(matchedPath, 'utf-8')
          );
          res.status(200).set(htmlHeaders).send(prerenderedHtml);
          return;
        }
      }

      const rawHtml = fs.readFileSync(indexHtmlPath, 'utf-8');
      const seoHtml = injectRouteSeoIntoHtml(rawHtml, req.originalUrl, routeInfo.status);
      res
        .status(routeInfo.status === 404 ? 404 : 200)
        .set({
          ...htmlHeaders,
          ...(routeInfo.status === 404 ? { 'X-Robots-Tag': 'noindex, follow' } : {}),
        })
        .send(seoHtml);
    });
  }

  // Generic Express error handler (prevents leaking stack traces in production)
  app.use((err: unknown, req: Request, res: Response, _next: express.NextFunction) => {
    console.error('[Server Error]', err instanceof Error ? err.message : String(err));
    if (res.headersSent) return;
    if (req.path.startsWith('/api')) {
      res.status(500).set('Cache-Control', 'no-store').json({ error: 'Internal server error.' });
      return;
    }
    res.status(500).type('text/plain').send('Internal server error.');
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(
      `FreeTools Hub server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`
    );
    if (isProduction) {
      resolveVerifiedProductionDomain();
    }
  });

  const gracefulShutdown = (signal: string) => {
    console.log(`[Server] Received ${signal}, shutting down gracefully...`);
    httpServer.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer();
