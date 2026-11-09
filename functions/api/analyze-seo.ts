const MAX_HTML_BYTES = 2 * 1024 * 1024; // 2 MB cap
const MAX_REDIRECTS = 4;
const FETCH_TIMEOUT_MS = 8500;

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
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a === 192 && b === 0 && (parts[2] === 0 || parts[2] === 2)) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a === 198 && b === 51 && parts[2] === 100) return true;
  if (a === 203 && b === 0 && parts[2] === 113) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateOrReservedIP(rawIp: string): boolean {
  const ip = rawIp.trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return isPrivateOrReservedIPv4(ip);
  }
  // IPv6 checks
  if (ip === '::' || ip === '::1' || ip === '0:0:0:0:0:0:0:1' || ip === '0:0:0:0:0:0:0:0') {
    return true;
  }
  if (ip.startsWith('::ffff:')) {
    const tail = ip.slice('::ffff:'.length);
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(tail)) {
      return isPrivateOrReservedIPv4(tail);
    }
  }
  if (ip.startsWith('fc') || ip.startsWith('fd')) return true;
  if (/^fe[89ab]/.test(ip)) return true;
  if (ip.startsWith('ff')) return true;
  if (ip.startsWith('2001:db8:') || ip.startsWith('2001:0db8:')) return true;
  return false;
}

function assertSafePublicUrl(rawUrl: string): URL {
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

  if (isPrivateOrReservedIP(hostname)) {
    throw new Error('Requests to private, loopback, or reserved IP addresses are blocked.');
  }

  return parsed;
}

async function readStreamWithLimit(response: Response, maxBytes: number): Promise<string> {
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

export const onRequestGet = async (context: { request: Request }): Promise<Response> => {
  const url = new URL(context.request.url);
  const rawTarget = url.searchParams.get('url')?.trim() || '';
  const checkOnly = url.searchParams.get('checkOnly') === '1';

  if (!rawTarget || rawTarget.length > 2048) {
    return new Response(
      JSON.stringify({ error: 'Please provide a valid public http:// or https:// URL.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const startTime = performance.now();

  try {
    let currentUrl = assertSafePublicUrl(rawTarget);
    let finalResponse: Response | null = null;
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
            'User-Agent': 'Mozilla/5.0 (compatible; FreeToolsHub-SEOAnalyzer/1.0)',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
      } finally {
        clearTimeout(timer);
      }

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
          break;
        }
        redirectCount += 1;
        if (redirectCount > MAX_REDIRECTS) {
          return new Response(
            JSON.stringify({ error: 'Too many redirects while fetching target URL.' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
        const nextLocation = new URL(finalResponse.headers.get('location')!, currentUrl).toString();
        currentUrl = assertSafePublicUrl(nextLocation);
        continue;
      }

      break;
    }

    if (!finalResponse) {
      return new Response(
        JSON.stringify({ error: 'No response received from target server.' }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const ttfbMs = Math.round(performance.now() - startTime);

    if (checkOnly) {
      if (finalResponse.body) {
        try {
          await finalResponse.body.cancel();
        } catch {}
      }
      return new Response(
        JSON.stringify({
          url: rawTarget,
          finalUrl: currentUrl.toString(),
          status: finalResponse.status,
          statusText: finalResponse.statusText || 'OK',
          ttfbMs,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
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
      return new Response(
        JSON.stringify({
          error: 'Target URL did not return an HTML document. Only public web pages can be audited.',
        }),
        {
          status: 415,
          headers: { 'Content-Type': 'application/json' },
        }
      );
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

    return new Response(
      JSON.stringify({
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
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : 'Unable to fetch target URL.';
    const isAbort = err instanceof Error && err.name === 'AbortError';
    const isPolicyError =
      rawMessage.includes('blocked') ||
      rawMessage.includes('restricted') ||
      rawMessage.includes('credentials') ||
      rawMessage.includes('ports');

    const statusCode = isAbort ? 504 : isPolicyError ? 403 : 502;
    const clientMessage = isAbort
      ? 'Request timed out waiting for the target page to respond.'
      : isPolicyError
        ? rawMessage
        : 'Unable to reach the target URL. Verify that the server is online and accessible.';

    return new Response(JSON.stringify({ error: clientMessage }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
