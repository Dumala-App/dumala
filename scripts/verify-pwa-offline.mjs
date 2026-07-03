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

const workspaceEntries = {
  stack_team_onboarded: 'true',
  stack_team_info: JSON.stringify({
    name: 'Offline Validation FC',
    founded: '2026',
    stadium: 'Validation Ground',
    coach: 'Coach Offline',
    league: 'Offline League',
    logoColor: '#123456',
  }),
  stack_team_players: JSON.stringify([{
    id: 'offline-player',
    name: 'Offline Player',
    number: 9,
    position: 'Forward',
    bio: 'Seeded for offline validation.',
    photoUrl: '/placeholders/forward-placeholder.png',
    gamesPlayed: 0,
    points: 0,
    assists: 0,
    cleanSheetsOrRebounds: 0,
    minutesPlayed: 0,
    mvpAwards: 0,
    yellowCards: 0,
    redCards: 0,
    offenses: [],
    baseAttributes: {
      pace: 70,
      stamina: 70,
      agility: 70,
      strength: 70,
      firstTouch: 70,
      shortPassing: 70,
    },
    positionAttributes: {Finishing: 70},
    registrationStatus: 'Active',
  }]),
  stack_team_staff: JSON.stringify([{
    id: 'offline-staff',
    name: 'Coach Offline',
    role: 'Head Coach',
    bio: 'Seeded for offline validation.',
    photoUrl: '/placeholders/staff-placeholder.png',
    status: 'Active',
  }]),
  stack_team_games: '[]',
  stack_team_standings: '[]',
  stack_team_announcements: '[]',
  stack_team_assessments: '[]',
};

const expectVisibleText = async (page, text, label) => {
  const expected = text.toLowerCase().replace(/\s+/g, ' ');
  const startedAt = Date.now();
  let renderedText = '';

  while (Date.now() - startedAt < 10000) {
    renderedText = await page.locator('body').innerText();
    if (renderedText.toLowerCase().replace(/\s+/g, ' ').includes(expected)) return;
    await page.waitForTimeout(100);
  }

  throw new Error(
    `${label} did not render expected text: ${text}. Rendered page: ${renderedText.replace(/\s+/g, ' ').slice(0, 2000)}`,
  );
};

const openPrimaryArea = async (page, name) => {
  await page.getByRole('button', {name, exact: true}).click();
};

const openNestedArea = async (page, name) => {
  try {
    await page.getByRole('tab', {name, exact: true}).click({timeout: 10000});
    return;
  } catch {
    await page.getByRole('button', {name: `Open ${name}`, exact: true}).click();
  }
};

const verifyOfflineWorkflows = async page => {
  await expectVisibleText(page, 'Offline Validation FC', 'Overview');

  await openNestedArea(page, 'Bulletins');
  await expectVisibleText(page, 'Team Bulletin Board', 'Bulletins');
  await page.getByRole('button', {name: 'Post Announcement', exact: true}).click();
  await page.locator('#ann-title-input').fill('Offline persistence check');
  await page.locator('#ann-content-input').fill('Created while the validation browser was offline.');
  await page.getByRole('button', {name: 'Publish Notice', exact: true}).click();
  await expectVisibleText(page, 'Offline persistence check', 'Offline bulletin edit');

  await openNestedArea(page, 'Game Week');
  await expectVisibleText(page, 'Upcoming Matches', 'Game Week');

  await openPrimaryArea(page, 'Squad');
  await expectVisibleText(page, 'Team Roster & Player Directory', 'Squad');
  await expectVisibleText(page, 'Offline Player', 'Squad player');
  await page.getByRole('button', {name: 'Staff', exact: true}).click();
  await expectVisibleText(page, 'Coach Offline', 'Staff directory');

  await openPrimaryArea(page, 'Tactics');
  await expectVisibleText(page, 'Match Layout', 'Tactics');

  await openPrimaryArea(page, 'Development');
  await expectVisibleText(page, 'Interactive Training Grounds', 'Training');
  await openNestedArea(page, 'Assessments');
  await expectVisibleText(page, 'Assessment Center', 'Assessments');

  await openPrimaryArea(page, 'League & Updates');
  await expectVisibleText(page, 'Manual Tools', 'League');
  await openNestedArea(page, 'Updates');
  await expectVisibleText(page, 'Developer Updates & Product Roadmap', 'Updates');

  await expectVisibleText(page, 'You are offline', 'Offline status');
};

const port = await getAvailablePort();
const baseUrl = `http://127.0.0.1:${port}/`;
const appLaunchUrl = `${baseUrl}#/app`;
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
    await context.addInitScript(entries => {
      for (const [key, value] of Object.entries(entries)) {
        if (localStorage.getItem(key) === null) {
          localStorage.setItem(key, value);
        }
      }
    }, workspaceEntries);

    const onlinePage = await context.newPage();
    await onlinePage.goto(appLaunchUrl, {waitUntil: 'domcontentloaded'});
    await expectAppShell(onlinePage, 'initial online load');
    await waitForActiveServiceWorker(onlinePage);
    await onlinePage.close();

    await context.setOffline(true);

    const coldLaunchPage = await context.newPage();
    await coldLaunchPage.goto(appLaunchUrl, {waitUntil: 'domcontentloaded'});
    await expectAppShell(coldLaunchPage, 'offline cold launch');
    await verifyOfflineWorkflows(coldLaunchPage);

    await coldLaunchPage.reload({waitUntil: 'domcontentloaded'});
    await expectAppShell(coldLaunchPage, 'offline refresh');
    await expectVisibleText(coldLaunchPage, 'Offline Validation FC', 'offline refresh persistence');
    await openPrimaryArea(coldLaunchPage, 'Home');
    await openNestedArea(coldLaunchPage, 'Bulletins');
    await expectVisibleText(coldLaunchPage, 'Offline persistence check', 'offline edit persistence');
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

console.log('Offline PWA verification passed: Dumala reopened, traversed core workflows, and refreshed from the production cache.');
