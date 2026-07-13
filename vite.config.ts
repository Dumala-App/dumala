import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

const prioritizeEntryStylesheet = (): Plugin => ({
  name: 'dumala-prioritize-entry-stylesheet',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      const entryStylesheetPattern = /\n?\s*<link rel="stylesheet"[^>]*href="\/assets\/[^"]+\.css"[^>]*>/g;
      const entryStylesheets = html.match(entryStylesheetPattern);

      if (!entryStylesheets?.length) return html;

      const htmlWithoutEntryStylesheets = html.replace(entryStylesheetPattern, '');
      const stylesheetBlock = entryStylesheets
        .map(stylesheet => stylesheet.trim())
        .join('\n    ');

      if (htmlWithoutEntryStylesheets.includes('<script type="module"')) {
        return htmlWithoutEntryStylesheets.replace(
          /\n\s*<script type="module"/,
          `\n    ${stylesheetBlock}\n    <script type="module"`
        );
      }

      return htmlWithoutEntryStylesheets.replace(
        /\n\s*<\/head>/,
        `\n    ${stylesheetBlock}\n  </head>`
      );
    },
  },
});

export default defineConfig({
  cacheDir: 'node_modules/.vite-app',
  plugins: [
    react(),
    tailwindcss(),
    prioritizeEntryStylesheet(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: false,
      devOptions: {
        enabled: false,
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
        navigateFallback: null,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2,json,webmanifest}'],
        globIgnores: ['**/dumala-free-kick.html', '**/dumala-free-kick.css', '**/dumala-free-kick.js', '**/free-kick-wall-*.webp'],
        runtimeCaching: [
          {
            urlPattern: ({url}) =>
              url.origin === globalThis.location.origin
              && (
                url.pathname.startsWith('/api/')
                || url.pathname === '/api'
                || url.pathname.startsWith('/auth/')
                || url.pathname === '/auth'
                || url.pathname.startsWith('/oauth/')
                || url.pathname === '/oauth'
                || url.pathname.startsWith('/_vercel/')
                || url.pathname === '/_vercel'
              ),
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/formsubmit\.co\//,
            handler: 'NetworkOnly',
            method: 'POST',
          },
          {
            urlPattern: /^https:\/\/(?:va|vitals)\.vercel-scripts\.com\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'dumala-unsplash-images',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 12,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
          {
            urlPattern: ({request, url}) =>
              url.origin === globalThis.location.origin && request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'dumala-local-images',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({request, url}) =>
              url.origin === globalThis.location.origin && request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dumala-pages',
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200],
              },
              precacheFallback: {
                fallbackURL: 'index.html',
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (id.includes('@radix-ui')) return 'vendor-radix';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) return 'vendor-charts';
          if (id.includes('motion') || id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('zod')) return 'vendor-validation';
          if (id.includes('vite-plugin-pwa') || id.includes('workbox')) return 'vendor-pwa';
          if (id.includes('@vercel/speed-insights')) return 'vendor-analytics';

          return 'vendor';
        },
      },
    },
  },
});
