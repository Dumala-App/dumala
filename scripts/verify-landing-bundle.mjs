import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const indexPath = resolve('dist/index.html');
const html = await readFile(indexPath, 'utf8').catch(() => {
  throw new Error('dist/index.html is missing. Run npm run build before verifying the landing bundle.');
});

const initialResources = [...html.matchAll(/<(?:script|link)\b[^>]+(?:src|href)="([^"]+)"[^>]*>/g)]
  .map(match => match[1]);
const forbiddenInitialChunks = [
  { label: 'Supabase vendor', pattern: /\/vendor-supabase(?:-[^/]*)?\.js$/ },
  { label: 'validation vendor', pattern: /\/vendor-validation(?:-[^/]*)?\.js$/ },
  { label: 'workspace application', pattern: /\/App(?:-[^/]*)?\.js$/ },
  { label: 'cloud runtime', pattern: /\/runtime(?:-[^/]*)?\.js$/ }
];
const violations = initialResources.flatMap(resource =>
  forbiddenInitialChunks
    .filter(({ pattern }) => pattern.test(resource))
    .map(({ label }) => `${label}: ${resource}`)
);

const initialStyles = initialResources.filter(resource => resource.endsWith('.css'));
if (initialStyles.length !== 1) {
  throw new Error(`Expected exactly one landing-critical stylesheet, found: ${initialStyles.join(', ') || 'none'}`);
}

const initialStylePath = resolve('dist', initialStyles[0].replace(/^\//, ''));
const { size: initialStyleBytes } = await stat(initialStylePath);
const initialStyle = await readFile(initialStylePath, 'utf8');
const MAX_LANDING_CSS_BYTES = 50 * 1024;
if (initialStyleBytes > MAX_LANDING_CSS_BYTES) {
  throw new Error(
    `Landing stylesheet is ${(initialStyleBytes / 1024).toFixed(1)} KiB; expected at most ${MAX_LANDING_CSS_BYTES / 1024} KiB.`
  );
}

const requiredDialogSelectors = [
  { label: 'dialog fixed positioning', selector: '.fixed' },
  { label: 'dialog horizontal centering', selector: '.left-1\\/2' },
  { label: 'dialog vertical centering', selector: '.top-1\\/2' },
  { label: 'dialog overlay/content stacking', selector: '.z-50' },
  { label: 'dialog horizontal transform', selector: '.-translate-x-1\\/2' },
  { label: 'dialog vertical transform', selector: '.-translate-y-1\\/2' },
];
const missingDialogSelectors = requiredDialogSelectors.filter(({ selector }) => !initialStyle.includes(selector));

if (missingDialogSelectors.length > 0) {
  throw new Error(
    `Landing stylesheet is missing required dialog CSS:\n${missingDialogSelectors
      .map(({ label, selector }) => `${label}: ${selector}`)
      .join('\n')}`
  );
}

if (violations.length > 0) {
  throw new Error(`Landing page eagerly loads cloud-only chunks:\n${violations.join('\n')}`);
}

console.log(
  `Landing bundle verification passed: workspace, cloud, and validation chunks are deferred; initial CSS is ${(initialStyleBytes / 1024).toFixed(1)} KiB.`
);
