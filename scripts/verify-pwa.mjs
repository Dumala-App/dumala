import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';

const distPath = resolve('dist');
const workerPath = resolve(distPath, 'sw.js');

if (!existsSync(workerPath)) {
  throw new Error('dist/sw.js is missing. Run npm run build before verifying the PWA.');
}

const workerSource = readFileSync(workerPath, 'utf8');
const builtIndex = readFileSync(resolve(distPath, 'index.html'), 'utf8');
const requiredWorkerMarkers = [
  'cleanupOutdatedCaches',
  'SKIP_WAITING',
  'NetworkFirst',
  'PrecacheFallbackPlugin',
  'NetworkOnly',
  'formsubmit',
  'dumala-local-images',
  'dumala-unsplash-images',
  'manifest.webmanifest',
  'fonts/dm-sans/dm-sans-latin-variable.woff2',
  'fonts/manrope/manrope-latin-variable.woff2',
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
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'dumala-google-font',
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

const builtCss = readdirSync(resolve(distPath, 'assets'))
  .filter(fileName => fileName.endsWith('.css'))
  .map(fileName => readFileSync(resolve(distPath, 'assets', fileName), 'utf8'))
  .join('\n');

for (const localFontPath of [
  '/fonts/dm-sans/dm-sans-latin-variable.woff2',
  '/fonts/manrope/manrope-latin-variable.woff2',
]) {
  if (!builtCss.includes(localFontPath)) {
    throw new Error(`The production CSS is missing the local font reference: ${localFontPath}`);
  }
  if (!builtIndex.includes(`rel="preload" href="${localFontPath}"`)) {
    throw new Error(`The production HTML is missing the local font preload: ${localFontPath}`);
  }
}

const entryStylesheetIndex = builtIndex.indexOf('rel="stylesheet"');
const entryScriptIndex = builtIndex.indexOf('<script type="module"');

if (entryStylesheetIndex === -1) {
  throw new Error('The production HTML is missing the entry stylesheet.');
}

if (entryScriptIndex === -1) {
  throw new Error('The production HTML is missing the entry module script.');
}

if (entryStylesheetIndex > entryScriptIndex) {
  throw new Error('The production HTML must discover the entry stylesheet before the entry module script.');
}

if (/fonts\.(?:googleapis|gstatic)\.com/.test(builtCss)) {
  throw new Error('The production CSS still contains an external Google Fonts dependency.');
}

console.log(`PWA verification passed: sw.js and ${workboxRuntime} contain the expected offline policy.`);
