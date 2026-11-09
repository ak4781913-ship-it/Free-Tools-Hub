/**
 * Client-side HTML sanitizer using the browser's native DOMParser.
 * Neutralizes XSS vectors (scripts, inline event handlers, dangerous protocols, active embeds)
 * while preserving safe semantic Markdown formatting (headings, lists, tables, code blocks, links, images).
 */

const FORBIDDEN_TAGS = new Set([
  'script',
  'iframe',
  'frame',
  'frameset',
  'object',
  'embed',
  'applet',
  'base',
  'meta',
  'link',
  'style',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'option',
  'noscript',
  'template',
  'svg',
  'math',
]);

const URL_ATTRIBUTES = new Set(['href', 'src', 'xlink:href', 'action', 'formaction', 'poster']);

function isSafeUrl(rawValue: string, attrName: string): boolean {
  const trimmed = rawValue.replace(/[\u0000-\u001F\u007F-\u009F\s]+/g, '').toLowerCase();
  if (!trimmed) return true;

  // Allow relative paths and fragment anchors
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../')
  ) {
    return true;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return true;
  }

  if (attrName === 'href' && (trimmed.startsWith('mailto:') || trimmed.startsWith('tel:'))) {
    return true;
  }

  // Allow safe raster data URIs on <img> only (never data:image/svg+xml or data:text/html)
  if (
    attrName === 'src' &&
    /^data:image\/(png|jpeg|jpg|gif|webp|bmp|avif);base64,[a-z0-9+/=]+$/i.test(trimmed)
  ) {
    return true;
  }

  return false;
}

export interface SanitizeHtmlOptions {
  /**
   * When true, converts <h1> inside rendered Markdown preview into styled <h2>
   * so the host tool page maintains a single semantic <h1> heading.
   */
  demoteH1ToH2?: boolean;
}

export function sanitizeHtml(dirtyHtml: string, options: SanitizeHtmlOptions = {}): string {
  if (!dirtyHtml) return '';

  if (typeof DOMParser === 'undefined') {
    // Fallback string escape if invoked outside a browser DOM environment
    return dirtyHtml
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(dirtyHtml, 'text/html');

  // Remove all forbidden elements first
  FORBIDDEN_TAGS.forEach((tag) => {
    const nodes = Array.from(doc.body.getElementsByTagName(tag));
    for (const node of nodes) {
      node.remove();
    }
  });

  // Walk remaining elements and scrub unsafe attributes
  const allElements = Array.from(doc.body.querySelectorAll('*'));
  for (const el of allElements) {
    const tagLower = el.tagName.toLowerCase();
    if (FORBIDDEN_TAGS.has(tagLower)) {
      el.remove();
      continue;
    }

    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      const nameLower = attr.name.toLowerCase();

      // Strip all inline event handlers (onerror, onload, onclick, etc.) and raw style attributes
      if (nameLower.startsWith('on') || nameLower === 'style' || nameLower === 'srcdoc') {
        el.removeAttribute(attr.name);
        continue;
      }

      if (URL_ATTRIBUTES.has(nameLower) && !isSafeUrl(attr.value, nameLower)) {
        el.removeAttribute(attr.name);
        continue;
      }
    }

    // Harden external anchor links
    if (tagLower === 'a') {
      const href = el.getAttribute('href') || '';
      if (/^https?:\/\//i.test(href)) {
        el.setAttribute('rel', 'noopener noreferrer');
        el.setAttribute('target', '_blank');
      }
    }

    // Optionally demote <h1> inside embedded preview to preserve single page H1
    if (options.demoteH1ToH2 && tagLower === 'h1') {
      const replacement = doc.createElement('h2');
      replacement.className = 'text-2xl font-bold';
      while (el.firstChild) {
        replacement.appendChild(el.firstChild);
      }
      el.replaceWith(replacement);
    }
  }

  return doc.body.innerHTML;
}
