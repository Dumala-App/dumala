import {existsSync} from 'node:fs';
import {createServer} from 'node:net';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {chromium} from '@playwright/test';

const distPath = resolve('dist');
const viteBinPath = resolve('node_modules', 'vite', 'bin', 'vite.js');

if (!existsSync(resolve(distPath, 'sw.js'))) {
  throw new Error('dist/sw.js is missing. Run npm run build before verifying offline launch.');
}

if (!existsSync(viteBinPath)) {
  throw new Error('Vite is missing from node_modules. Run npm ci before verifying offline launch.');
}

const getAvailablePort = () =>
  new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => {
        if (!address || typeof address === 'string') {
          reject(new Error('Could not find an available local preview port.'));
          return;
        }
        resolvePort(address.port);
      });
    });
  });

const waitForPreview = async (baseUrl, timeoutMs = 15000) => {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(baseUrl, {cache: 'no-store'});
      if (response.ok) return;
      lastError = new Error(`Preview responded with HTTP ${response.status}.`);
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolveRetry => setTimeout(resolveRetry, 250));
  }

  throw new Error(`Vite preview did not become available: ${lastError?.message ?? 'timed out'}`);
};

const waitForActiveServiceWorker = async page => {
  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const registration = await navigator.serviceWorker.ready;
    return registration.active?.state === 'activated';
  });
};

const expectAppShell = async (page, label) => {
  await page.locator('#root').waitFor({state: 'visible'});
  await page.waitForFunction(() => (document.querySelector('#root')?.textContent ?? '').includes('Dumala'));

  const rootText = await page.locator('#root').textContent();
  if (!rootText?.includes('Dumala')) {
    throw new Error(`Dumala app shell did not render during ${label}.`);
  }
};

const port = await getAvailablePort();
const baseUrl = `http://127.0.0.1:${port}/`;
const preview = spawn(
  process.execPath,
  [viteBinPath, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

let previewOutput = '';
preview.stdout.on('data', chunk => {
  previewOutput += chunk.toString();
});
preview.stderr.on('data', chunk => {
  previewOutput += chunk.toString();
});

try {
  await waitForPreview(baseUrl);

  let browser;
  let context;

  try {
    browser = await chromium.launch();
    context = await browser.newContext({
      serviceWorkers: 'allow',
    });

    const onlinePage = await context.newPage();
    await onlinePage.goto(baseUrl, {waitUntil: 'domcontentloaded'});
    await expectAppShell(onlinePage, 'initial online load');
    await waitForActiveServiceWorker(onlinePage);
    await onlinePage.close();

    await context.setOffline(true);

    const coldLaunchPage = await context.newPage();
    await coldLaunchPage.goto(baseUrl, {waitUntil: 'domcontentloaded'});
    await expectAppShell(coldLaunchPage, 'offline cold launch');

    await coldLaunchPage.reload({waitUntil: 'domcontentloaded'});
    await expectAppShell(coldLaunchPage, 'offline refresh');
    await coldLaunchPage.close();
  } finally {
    await context?.close();
    await browser?.close();
  }
} catch (error) {
  const output = previewOutput.trim();
  throw new Error(
    `Offline PWA launch verification failed: ${error.message}${output ? `\n\nVite preview output:\n${output}` : ''}`,
  );
} finally {
  preview.kill();
}

console.log('Offline PWA verification passed: Dumala reopened and refreshed from the production cache.');
