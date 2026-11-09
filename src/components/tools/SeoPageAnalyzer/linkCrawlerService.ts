import { CrawledInternalLink, InternalLinksReport, LinkStatusType } from './seoAnalysisTypes';

/**
 * Checks a single URL status with timeout and CORS fallback
 */
export async function testLinkStatus(
  url: string,
  timeoutMs = 6000
): Promise<{
  statusCode: number;
  status: LinkStatusType;
  statusText: string;
  responseTimeMs: number;
  diagnosticTip?: string;
  error?: string;
}> {
  const startTime = performance.now();

  // Try direct fetch first
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // Try HEAD request first for efficiency, fallback to GET
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors',
      });
    } catch {
      // HEAD may be rejected by some servers; try lightweight GET
      res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors',
      });
    }

    clearTimeout(timer);
    const duration = Math.round(performance.now() - startTime);

    if (res.ok) {
      return {
        statusCode: res.status || 200,
        status: 'ok',
        statusText: `${res.status} OK`,
        responseTimeMs: duration,
        diagnosticTip: 'Link destination responded successfully with healthy 200 OK.',
      };
    }

    if (res.status === 404 || res.status === 410) {
      return {
        statusCode: res.status,
        status: 'broken',
        statusText: `${res.status} Not Found`,
        responseTimeMs: duration,
        diagnosticTip: 'Dead link (404/410). The destination page does not exist. Update the href attribute or set up a 301 redirect.',
      };
    }

    if (res.status >= 500) {
      return {
        statusCode: res.status,
        status: 'broken',
        statusText: `${res.status} Server Error`,
        responseTimeMs: duration,
        diagnosticTip: `Server error (${res.status}). The destination server encountered an internal failure.`,
      };
    }

    if (res.status >= 300 && res.status < 400) {
      return {
        statusCode: res.status,
        status: 'redirect',
        statusText: `${res.status} Redirect`,
        responseTimeMs: duration,
        diagnosticTip: `Redirects via HTTP ${res.status}. Best practice is to link directly to the final destination URL.`,
      };
    }

    return {
      statusCode: res.status,
      status: res.status >= 400 ? 'broken' : 'ok',
      statusText: `${res.status} ${res.statusText || 'Response'}`,
      responseTimeMs: duration,
      diagnosticTip: res.status >= 400 ? 'Destination returned an HTTP client or server error.' : undefined,
    };
  } catch (directErr: any) {
    // If direct CORS fetch fails, verify via first-party SSRF-protected checkOnly endpoint
    try {
      const proxyController = new AbortController();
      const proxyTimer = setTimeout(() => proxyController.abort(), timeoutMs);
      const proxyUrl = `/api/analyze-seo?url=${encodeURIComponent(url)}&checkOnly=1`;

      const proxyRes = await fetch(proxyUrl, {
        signal: proxyController.signal,
      });
      clearTimeout(proxyTimer);
      const duration = Math.round(performance.now() - startTime);
      const data = await proxyRes.json().catch(() => null);

      if (proxyRes.ok && data && typeof data.status === 'number') {
        const code = data.status;
        const responseMs = typeof data.ttfbMs === 'number' ? data.ttfbMs : duration;
        if (code >= 200 && code < 300) {
          return {
            statusCode: code,
            status: 'ok',
            statusText: `${code} OK`,
            responseTimeMs: responseMs,
            diagnosticTip: 'Target page exists and responded with HTTP 200 OK.',
          };
        }
        if (code >= 300 && code < 400) {
          return {
            statusCode: code,
            status: 'redirect',
            statusText: `${code} Redirect`,
            responseTimeMs: responseMs,
            diagnosticTip: `Redirects via HTTP ${code}. Link directly to the canonical destination URL where possible.`,
          };
        }
        if (code === 404 || code === 410) {
          return {
            statusCode: code,
            status: 'broken',
            statusText: `${code} Not Found`,
            responseTimeMs: responseMs,
            diagnosticTip: 'Target URL returned 404/410 Not Found. Dead internal link.',
          };
        }
        return {
          statusCode: code,
          status: code >= 400 ? 'broken' : 'ok',
          statusText: `${code} ${data.statusText || 'Response'}`,
          responseTimeMs: responseMs,
          diagnosticTip: code >= 400 ? 'Destination returned an HTTP client or server error.' : undefined,
        };
      }

      if (proxyRes.status === 400 && data?.error) {
        return {
          statusCode: 400,
          status: 'broken',
          statusText: 'Blocked / Restricted URL',
          responseTimeMs: duration,
          error: data.error,
          diagnosticTip: data.error,
        };
      }
    } catch {
      // Backend check failed or timed out
    }

    const duration = Math.round(performance.now() - startTime);
    const isTimeout = directErr.name === 'AbortError' || duration >= timeoutMs - 500;

    return {
      statusCode: isTimeout ? 504 : 0,
      status: isTimeout ? 'timeout' : 'broken',
      statusText: isTimeout ? 'Timeout (504)' : 'Unreachable / Failed',
      responseTimeMs: duration,
      error: directErr.message || 'Network request failed',
      diagnosticTip: isTimeout
        ? 'Request timed out waiting for server response. Check server uptime.'
        : 'Destination server refused connection or network failed to resolve host.',
    };
  }
}

/**
 * Crawls a batch of internal links with controlled concurrency
 */
export async function crawlInternalLinks(
  links: CrawledInternalLink[],
  onProgress?: (progress: {
    crawledCount: number;
    total: number;
    updatedLink: CrawledInternalLink;
  }) => void
): Promise<CrawledInternalLink[]> {
  const results: CrawledInternalLink[] = [...links];
  const concurrency = 3;
  let currentIndex = 0;
  let crawledCount = 0;

  async function worker() {
    while (currentIndex < results.length) {
      const idx = currentIndex++;
      const item = results[idx];

      // Mark link as checking
      item.status = 'checking';
      if (onProgress) {
        onProgress({
          crawledCount,
          total: results.length,
          updatedLink: { ...item },
        });
      }

      try {
        const check = await testLinkStatus(item.url);
        item.statusCode = check.statusCode;
        item.status = check.status;
        item.statusText = check.statusText;
        item.responseTimeMs = check.responseTimeMs;
        item.diagnosticTip = check.diagnosticTip;
        item.error = check.error;
      } catch (err: any) {
        item.statusCode = 0;
        item.status = 'broken';
        item.statusText = 'Crawl Error';
        item.error = err.message || 'Crawl error';
      }

      crawledCount++;
      if (onProgress) {
        onProgress({
          crawledCount,
          total: results.length,
          updatedLink: { ...item },
        });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, links.length) }, () => worker());
  await Promise.all(workers);

  return results;
}

/**
 * Recomputes summary metrics for an InternalLinksReport
 */
export function computeInternalLinksReport(
  links: CrawledInternalLink[],
  isCrawling = false
): InternalLinksReport {
  let okCount = 0;
  let brokenCount = 0;
  let redirectCount = 0;
  let crawledCount = 0;

  links.forEach((l) => {
    if (l.status === 'ok') {
      okCount++;
      crawledCount++;
    } else if (l.status === 'broken' || l.status === 'timeout') {
      brokenCount++;
      crawledCount++;
    } else if (l.status === 'redirect') {
      redirectCount++;
      crawledCount++;
    }
  });

  const total = links.length;
  const progress = total > 0 ? Math.round((crawledCount / total) * 100) : 100;

  return {
    totalDiscovered: links.reduce((sum, l) => sum + l.occurrences, 0),
    uniqueUrlsCount: total,
    crawledCount,
    okCount,
    brokenCount,
    redirectCount,
    links,
    isCrawling,
    crawlProgress: progress,
    crawlCompleted: crawledCount === total,
  };
}
