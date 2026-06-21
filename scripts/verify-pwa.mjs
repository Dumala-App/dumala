import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';

const distPath = resolve('dist');
const workerPath = resolve(distPath, 'sw.js');

if (!existsSync(workerPath)) {
  throw new Error('dist/sw.js is missing. Run npm run build before verifying the PWA.');
}

const workerSource = readFileSync(workerPath, 'utf8');
const requiredWorkerMarkers = [
  'cleanupOutdatedCaches',
  'SKIP_WAITING',
  'NetworkFirst',
  'PrecacheFallbackPlugin',
  'NetworkOnly',
  'formsubmit',
  'dumala-local-images',
  'dumala-google-font-stylesheets',
  'dumala-unsplash-images',
  'manifest.webmanifest',
  'placeholders/goalkeeper-placeholder.png',
  'placeholders/staff-placeholder.png',
];

for (const marker of requiredWorkerMarkers) {
  if (!workerSource.includes(marker)) {
    throw new Error(`The generated service worker is missing the expected marker: ${marker}`);
  }
}

const forbiddenWorkerMarkers = [
  'localStorage',
  'dumala-workspace',
  'dumala_pre_restore_backup',
];

for (const marker of forbiddenWorkerMarkers) {
  if (workerSource.includes(marker)) {
    throw new Error(`Private workspace data marker found in the service worker: ${marker}`);
  }
}

const workboxRuntime = readdirSync(distPath).find(fileName => /^workbox-.*\.js$/.test(fileName));
if (!workboxRuntime) {
  throw new Error('The generated Workbox runtime file is missing.');
}

console.log(`PWA verification passed: sw.js and ${workboxRuntime} contain the expected offline policy.`);
