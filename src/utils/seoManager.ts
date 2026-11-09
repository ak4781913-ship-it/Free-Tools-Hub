/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Returns the verified production base URL ONLY when explicitly configured via VITE_SITE_URL
 * (and never returns localhost, loopback, placeholder, or ephemeral preview container URLs).
 */
export function getVerifiedProductionBaseUrl(): string {
  const envUrl = ((import.meta as { env?: Record<string, string | undefined> }).env?.VITE_SITE_URL)?.trim() || '';
  if (!envUrl || !/^https?:\/\//i.test(envUrl)) {
    return '';
  }
  try {
    const parsed = new URL(envUrl);
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.run.app') ||
      envUrl.includes('MY_APP_URL')
    ) {
      return '';
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return '';
  }
}

/**
 * Backwards-compatible alias returning the verified production domain when configured,
 * or empty string so canonical URLs never point to unverified preview/localhost origins.
 */
export function getSiteBaseUrl(): string {
  return getVerifiedProductionBaseUrl();
}

export interface RouteSeoMetadata {
  title: string;
  description: string;
  canonicalPath?: string;
  robots?: 'index, follow' | 'noindex, follow';
  ogType?: 'website' | 'article';
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function upsertMetaTag(attrName: 'name' | 'property', attrValue: string, content: string) {
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!content) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonicalLink(href: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!href) {
    if (link) link.remove();
    return;
  }
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function upsertDynamicJsonLd(payload?: Record<string, unknown> | Record<string, unknown>[]) {
  const existing = document.getElementById('dynamic-route-jsonld');
  if (!payload) {
    if (existing) existing.remove();
    return;
  }

  let script = existing as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = 'dynamic-route-jsonld';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(payload);
}

/**
 * Updates document <head> tags (title, meta description, canonical URL, robots, OpenGraph, Twitter, and JSON-LD)
 * whenever the route changes. Emits canonical & og:url strictly when a verified production domain is configured,
 * and omits canonical tags on non-indexable (404 / noindex) pages.
 */
export function applyRouteSeo(meta: RouteSeoMetadata): void {
  if (typeof document === 'undefined') return;

  const isNoIndex = (meta.robots || 'index, follow').toLowerCase().includes('noindex');
  const verifiedBaseUrl = getVerifiedProductionBaseUrl();

  let canonicalUrl = '';
  if (!isNoIndex && verifiedBaseUrl && meta.canonicalPath) {
    const cleanPath = meta.canonicalPath.startsWith('/')
      ? meta.canonicalPath
      : `/${meta.canonicalPath}`;
    canonicalUrl = cleanPath === '/' ? `${verifiedBaseUrl}/` : `${verifiedBaseUrl}${cleanPath}`;
  }

  document.title = meta.title;

  upsertMetaTag('name', 'description', meta.description);
  upsertMetaTag('name', 'robots', meta.robots || 'index, follow');

  upsertCanonicalLink(canonicalUrl);

  // OpenGraph
  upsertMetaTag('property', 'og:type', meta.ogType || 'website');
  upsertMetaTag('property', 'og:site_name', 'FreeTools Hub');
  upsertMetaTag('property', 'og:title', meta.title);
  upsertMetaTag('property', 'og:description', meta.description);
  upsertMetaTag('property', 'og:url', canonicalUrl);

  // Twitter Card
  upsertMetaTag('name', 'twitter:card', 'summary_large_image');
  upsertMetaTag('name', 'twitter:title', meta.title);
  upsertMetaTag('name', 'twitter:description', meta.description);

  // Route-specific JSON-LD structured data
  upsertDynamicJsonLd(meta.jsonLd);
}
