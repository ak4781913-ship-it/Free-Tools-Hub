import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function injectGoogleVerificationPlugin(): Plugin {
  return {
    name: 'inject-google-site-verification',
    transformIndexHtml(html) {
      const token = (
        process.env.VITE_GOOGLE_SITE_VERIFICATION ||
        process.env.GOOGLE_SITE_VERIFICATION ||
        ''
      ).trim();
      if (!token || /name="google-site-verification"/i.test(html)) {
        return html;
      }
      const escaped = token
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return html.replace(
        '</head>',
        `    <meta name="google-site-verification" content="${escaped}" />\n  </head>`
      );
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      injectGoogleVerificationPlugin(),
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
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
