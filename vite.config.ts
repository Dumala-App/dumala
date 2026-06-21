import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
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
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'dumala-google-font-stylesheets',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'dumala-google-font-files',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
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
});
