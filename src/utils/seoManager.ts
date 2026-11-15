/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DEFAULT_PRODUCTION_URL,
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  SITE_NAME,
  sanitizePublicOrigin,
} from '../data/seoRegistry';

/**
 * Resolves the canonical public origin without ever stripping production domains
 * like freetoolshub1.netlify.app when VITE_SITE_URL is unset.
 */
export function getVerifiedProductionBaseUrl(): string {
  const envUrl =
    ((import.meta as { env?: Record<string, string | undefined> }).env?.VITE_SITE_URL)?.trim() || '';
  const sanitizedEnv = sanitizePublicOrigin(envUrl);
  if (sanitizedEnv) {
    return sanitizedEnv;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    const sanitizedOrigin = sanitizePublicOrigin(window.location.origin);
    if (sanitizedOrigin) {
      return sanitizedOrigin;
    }
  }

  return DEFAULT_PRODUCTION_URL;
}

/**
 * Returns the active public site base URL for canonical links, OpenGraph URLs, and JSON-LD.
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
  const staticScripts = document.querySelectorAll(
    'head script[type="application/ld+json"]:not(#dynamic-route-jsonld)'
  );
  // Prevent duplicate static WebSite/ItemList scripts after client hydration takes over
  staticScripts.forEach((node) => node.remove());

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
 * whenever the route changes. Omits canonical & og:url on non-indexable (404 / noindex) pages.
 */
export function applyRouteSeo(meta: RouteSeoMetadata): void {
  if (typeof document === 'undefined') return;

  const isNoIndex = (meta.robots || 'index, follow').toLowerCase().includes('noindex');
  const baseUrl = getVerifiedProductionBaseUrl();
  const ogImageUrl = `${baseUrl}${OG_IMAGE_PATH}`;

  let canonicalUrl = '';
  if (!isNoIndex && baseUrl && meta.canonicalPath) {
    const cleanPath = meta.canonicalPath.startsWith('/')
      ? meta.canonicalPath
      : `/${meta.canonicalPath}`;
    canonicalUrl = cleanPath === '/' ? `${baseUrl}/` : `${baseUrl}${cleanPath}`;
  }

  document.title = meta.title;

  upsertMetaTag('name', 'description', meta.description);
  upsertMetaTag('name', 'robots', meta.robots || 'index, follow');

  const envVerification =
    ((import.meta as { env?: Record<string, string | undefined> }).env?.VITE_GOOGLE_SITE_VERIFICATION)?.trim() || '';
  if (envVerification) {
    upsertMetaTag('name', 'google-site-verification', envVerification);
  }

  upsertCanonicalLink(canonicalUrl);

  // OpenGraph
  upsertMetaTag('property', 'og:type', meta.ogType || 'website');
  upsertMetaTag('property', 'og:site_name', SITE_NAME);
  upsertMetaTag('property', 'og:title', meta.title);
  upsertMetaTag('property', 'og:description', meta.description);
  upsertMetaTag('property', 'og:url', canonicalUrl);
  upsertMetaTag('property', 'og:image', ogImageUrl);
  upsertMetaTag('property', 'og:image:width', String(OG_IMAGE_WIDTH));
  upsertMetaTag('property', 'og:image:height', String(OG_IMAGE_HEIGHT));
  upsertMetaTag('property', 'og:image:alt', OG_IMAGE_ALT);

  // Twitter Card
  upsertMetaTag('name', 'twitter:card', 'summary_large_image');
  upsertMetaTag('name', 'twitter:title', meta.title);
  upsertMetaTag('name', 'twitter:description', meta.description);
  upsertMetaTag('name', 'twitter:image', ogImageUrl);

  // Route-specific JSON-LD structured data
  upsertDynamicJsonLd(meta.jsonLd);
}
