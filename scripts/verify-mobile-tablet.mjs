import {chromium} from '@playwright/test';
import {preview} from 'vite';

const seedWorkspace = {
  // The first-run coach tour renders a full-screen overlay ~800ms after the
  // workspace mounts; pre-seeding its seen flag keeps it from intercepting the
  // taps this script performs.
  dumala_coach_tour_seen_v1: '2026-01-01T00:00:00.000Z',
  stack_team_onboarded: 'true',
  stack_team_info: JSON.stringify({
    name: 'Mobile Tablet Validation FC',
    founded: '2026',
    stadium: 'Validation Ground',
    coach: 'Coach Mobile',
    league: 'Responsive League',
    logoColor: '#123456'
  }),
  stack_team_players: JSON.stringify([
    {
      id: 'mobile-player-1',
      name: 'Mobile Forward',
      number: 9,
      position: 'Forward',
      bio: 'Seeded for mobile and tablet validation.',
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
        shortPassing: 70
      },
      positionAttributes: {Finishing: 70},
      registrationStatus: 'Active'
    },
    {
      id: 'mobile-player-2',
      name: 'Mobile Midfielder',
      number: 8,
      position: 'Midfielder',
      bio: 'Seeded for mobile and tablet validation.',
      photoUrl: '/placeholders/midfielder-placeholder.png',
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
        shortPassing: 70
      },
      positionAttributes: {Vision: 70},
      registrationStatus: 'Active'
    }
  ]),
  stack_team_staff: JSON.stringify([
    {
      id: 'mobile-staff',
      name: 'Coach Mobile',
      role: 'Head Coach',
      bio: 'Seeded for mobile and tablet validation.',
      photoUrl: '/placeholders/staff-placeholder.png',
      status: 'Active'
    }
  ]),
  stack_team_games: '[]',
  stack_team_standings: JSON.stringify([
    {
      rank: 1,
      teamName: 'Mobile Tablet Validation FC',
      played: 2,
      won: 2,
      drawn: 0,
      lost: 0,
      goalsFor: 5,
      goalsAgainst: 1,
      points: 6,
      isUserTeam: true
    },
    {
      rank: 2,
      teamName: 'Long Name Academy United',
      played: 2,
      won: 1,
      drawn: 0,
      lost: 1,
      goalsFor: 3,
      goalsAgainst: 3,
      points: 3,
      isUserTeam: false
    }
  ]),
  stack_team_announcements: '[]',
  stack_team_assessments: '[]'
};

const scenarios = [
  {
    name: 'phone',
    portrait: {width: 390, height: 844},
    landscape: {width: 844, height: 390},
    keyboard: {width: 390, height: 520}
  },
  {
    name: 'tablet',
    portrait: {width: 820, height: 1180},
    landscape: {width: 1180, height: 820},
    keyboard: {width: 820, height: 720}
  }
];

const withSeededStorage = async context => {
  await context.addInitScript(entries => {
    for (const [key, value] of Object.entries(entries)) {
      localStorage.setItem(key, value);
    }
  }, seedWorkspace);
};

const openPrimaryArea = async (page, name) => {
  const desktopButton = page.locator('#desktop-nav').getByRole('button', {name, exact: true});
  if (await desktopButton.isVisible().catch(() => false)) {
    await desktopButton.click();
    return;
  }

  if (!(await page.locator('#mobile-nav-panel').isVisible().catch(() => false))) {
    await page.locator('#mobile-menu-hamburger').click();
  }
  await page.locator('#mobile-nav-panel').getByRole('button', {name, exact: true}).click();
};

const openNestedArea = async (page, name) => {
  const legacyButton = page.getByRole('button', {name: `Open ${name}`, exact: true});
  if (await legacyButton.isVisible().catch(() => false)) {
    await legacyButton.click();
    return;
  }

  await page.getByRole('tab', {name, exact: true}).click();
};

const clickNextAssessmentStep = async page => {
  const nextButton = page.getByRole('button', {name: 'Next step'});
  await nextButton.waitFor({state: 'visible'});
  await page.waitForFunction(() => {
    const button = document.querySelector('button[aria-label="Next step"]');
    return button instanceof HTMLButtonElement && !button.disabled;
  });
  await nextButton.click();
};

const assertNoPageOverflow = async (page, label) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 2) {
    throw new Error(`${label} has ${overflow}px of page-level horizontal overflow.`);
  }
};

// Scrolls the element into view and waits for its position to settle. The
// inline add-player/add-game forms open with a framer-motion height animation,
// so scrolling once can land on a still-growing layout and leave the element
// below the fold. Re-scroll until two consecutive measurements agree.
const scrollIntoStableView = async locator => {
  let previous = null;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    if (box && previous && Math.abs(box.y - previous.y) < 1 && Math.abs(box.height - previous.height) < 1) {
      return box;
    }
    previous = box;
    await locator.page().waitForTimeout(100);
  }
  return previous;
};

const assertElementReachable = async (locator, label) => {
  const box = await scrollIntoStableView(locator);
  if (!box) throw new Error(`${label} is not visible.`);
  const viewport = locator.page().viewportSize();
  if (!viewport) throw new Error(`No viewport available while checking ${label}.`);

  if (box.y < 0 || box.y + Math.min(box.height, 44) > viewport.height) {
    throw new Error(`${label} is hidden outside the reduced keyboard viewport.`);
  }
};

const verifyOrientation = async (page, scenario) => {
  await page.setViewportSize(scenario.portrait);
  await page.reload({waitUntil: 'networkidle'});
  await page.locator('#app-topbar').waitFor({state: 'visible'});
  await openPrimaryArea(page, 'Tactics');
  await page.locator('#tactical-field-card').waitFor({state: 'visible'});
  await assertNoPageOverflow(page, `${scenario.name} portrait tactics`);

  await page.setViewportSize(scenario.landscape);
  await page.locator('#tactical-field-card').waitFor({state: 'visible'});
  await assertNoPageOverflow(page, `${scenario.name} landscape tactics`);
  await assertElementReachable(page.locator('#tactical-field-card'), `${scenario.name} landscape tactics board`);
};

const verifyKeyboardFlow = async (page, scenario) => {
  await page.setViewportSize(scenario.portrait);
  await page.reload({waitUntil: 'networkidle'});
  await page.locator('#app-topbar').waitFor({state: 'visible'});

  await openPrimaryArea(page, 'Squad');
  await page.locator('#toggle-add-player-form-btn').click();
  await page.locator('#add-player-fom-container').waitFor({state: 'visible'});
  await page.locator('#new-player-name-input').focus();
  await page.setViewportSize(scenario.keyboard);
  await assertElementReachable(page.locator('#new-player-name-input'), `${scenario.name} roster focused name field`);
  await assertElementReachable(page.locator('#submit-add-player-btn'), `${scenario.name} roster submit action`);
  await assertNoPageOverflow(page, `${scenario.name} roster keyboard viewport`);

  await openPrimaryArea(page, 'Home');
  await openNestedArea(page, 'Game Week');
  await page.locator('#toggle-schedule-form-btn').click();
  await page.locator('#add-game-form-container').waitFor({state: 'visible'});
  await page.locator('#new-game-location').focus();
  await page.setViewportSize(scenario.keyboard);
  await assertElementReachable(page.locator('#new-game-location'), `${scenario.name} schedule focused location field`);
  await assertElementReachable(page.locator('#submit-add-game-btn'), `${scenario.name} schedule submit action`);
  await assertNoPageOverflow(page, `${scenario.name} schedule keyboard viewport`);

  await openPrimaryArea(page, 'Development');
  await openNestedArea(page, 'Assessments');
  await page.locator('#assessments-view-container').waitFor({state: 'visible'});
  await page.getByLabel('Search players').focus();
  await page.setViewportSize(scenario.keyboard);
  await assertElementReachable(page.getByLabel('Search players'), `${scenario.name} assessment focused search field`);
  await assertNoPageOverflow(page, `${scenario.name} assessment keyboard viewport`);
};

const server = await preview({
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true
  }
});

try {
  const browser = await chromium.launch();
  const results = [];

  for (const scenario of scenarios) {
    const context = await browser.newContext({
      viewport: scenario.portrait,
      hasTouch: true,
      isMobile: scenario.name === 'phone'
    });
    await withSeededStorage(context);
    const page = await context.newPage();
    // The root URL now serves the marketing landing page; the workspace shell
    // only mounts on a non-landing hash route (see shouldLoadWorkspace).
    await page.goto('http://127.0.0.1:4173/#/app', {waitUntil: 'networkidle'});

    await verifyOrientation(page, scenario);
    await verifyKeyboardFlow(page, scenario);
    results.push(`${scenario.name}: passed`);

    await context.close();
  }

  await browser.close();
  console.log(`Mobile/tablet verification passed:\n${results.join('\n')}`);
} finally {
  await new Promise(resolve => server.httpServer?.close(resolve));
}
