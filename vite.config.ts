import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const DEFAULT_FALLBACK_SITE_ORIGIN = 'https://freetools.mawa.blog';

function resolvePublicSiteOrigin(env: Record<string, string>): string {
  const candidates = [
    env.VITE_SITE_URL,
    env.SITE_URL,
    env.APP_URL,
    env.URL,
  ];
  for (const candidate of candidates) {
    const raw = (candidate || '').trim();
    if (!raw) continue;
    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') continue;
      const host = parsed.hostname.toLowerCase();
      if (
        !host ||
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host.endsWith('.localhost') ||
        host.endsWith('.local') ||
        host.endsWith('.internal') ||
        host.endsWith('.run.app') ||
        host.endsWith('.netlify.app') ||
        host.endsWith('.pages.dev') ||
        host.endsWith('.hostingersite.com')
      ) {
        continue;
      }
      return parsed.origin.replace(/\/+$/, '');
    } catch {
      continue;
    }
  }
  return '';
}

function replaceCanonicalSiteUrlPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'replace-canonical-site-url',
    transformIndexHtml(html) {
      const configuredOrigin = resolvePublicSiteOrigin(env);
      if (!configuredOrigin || configuredOrigin === DEFAULT_FALLBACK_SITE_ORIGIN) {
        return html;
      }
      return html.split(DEFAULT_FALLBACK_SITE_ORIGIN).join(configuredOrigin);
    },
  };
}

function injectGoogleVerificationPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'inject-google-site-verification',
    transformIndexHtml(html) {
      const token = (
        env.VITE_GOOGLE_SITE_VERIFICATION ||
        env.GOOGLE_SITE_VERIFICATION ||
        ''
      ).trim();
      if (!token) {
        return html;
      }
      const escaped = token
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const cleaned = html.replace(
        /\s*<meta\s+name="google-site-verification"[^>]*\/?>/gi,
        ''
      );
      return cleaned.replace(
        '</head>',
        `\n    <meta name="google-site-verification" content="${escaped}" />\n  </head>`
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env } as Record<string, string>;
  return {
    plugins: [
      react(),
      tailwindcss(),
      replaceCanonicalSiteUrlPlugin(env),
      injectGoogleVerificationPlugin(env),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'icon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'og-image.png',
        ],
        manifest: {
          id: '/',
          name: 'FreeTools Hub – Free CV Generator, UAE Gratuity, AI Prompts & Utilities',
          short_name: 'FreeTools',
          description: 'Free PDF Tools Suite (43 tools), ATS CV maker, UAE salary & gratuity calculators, AI prompt builders, and privacy-first online tools that work offline.',
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
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024, // 6 MB to precache full client bundle
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,json}'],
          globIgnores: ['**/404.html', '**/sitemap.xml', '**/robots.txt'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [
            /^\/api/,
            /^\/\.netlify/,
            /^\/__\/auth/,
            /^\/sitemap\.xml$/,
            /^\/robots\.txt$/,
            /^\/404\.html$/,
            /^\/site\.webmanifest$/,
            /^\/manifest\.webmanifest$/,
          ],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
          suppressWarnings: true,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) {
              return 'react-vendor';
            }
            if (id.includes('/firebase/') || id.includes('/@firebase/')) {
              return 'firebase-vendor';
            }
            if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-vendor/')) {
              return 'charts-vendor';
            }
            if (id.includes('/pdfjs-dist/')) {
              return 'pdfjs-vendor';
            }
            if (
              id.includes('/pdf-lib/') ||
              id.includes('/jspdf/') ||
              id.includes('/@neslinesli93/qpdf-wasm/') ||
              id.includes('/@pdfsmaller/pdf-encrypt-lite/')
            ) {
              return 'pdf-core';
            }
            if (id.includes('/xlsx/')) {
              return 'office-xlsx';
            }
            if (id.includes('/docx/')) {
              return 'office-docx';
            }
            if (id.includes('/jszip/') || id.includes('/mammoth/')) {
              return 'office-docs';
            }
            if (id.includes('/tesseract.js/')) {
              return 'ocr-vendor';
            }
            return undefined;
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
