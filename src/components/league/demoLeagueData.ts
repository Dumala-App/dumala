import type { CloudDataAccess, CloudLeagueRepository } from '../../cloud/dataAccess';
import type { CloudRuntime, Phase6Config } from '../../cloud/runtime';
import type { CloudAuthController } from '../../hooks/useCloudAuth';
import { nextSeasonStatuses, type League, type LeagueSeason, type LeagueVenue } from '../../cloud/league';

// In-memory sample data for the League Owner app "preview" mode: no login, no
// entitlement, in-memory state that resets on reload. Mirrors the Player preview
// pattern (see components/player/demoPlayerData.ts).

const newId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const now = () => new Date().toISOString();
const LEAGUE_ID = 'demo-league';

export const createDemoLeagueRepository = (): CloudLeagueRepository => {
  let leagues: League[] = [
    {
      id: LEAGUE_ID,
      owner_user_id: 'preview-owner',
      name: 'Metro Youth League',
      short_name: 'MYL',
      logo_color: '#f97316',
      contact_email: 'ops@metroyouth.example',
      location: 'Metro Manila, PH',
      description: 'Grassroots youth football across the metro.',
      timezone: 'Asia/Manila',
      state: 'active',
      created_at: now(),
      updated_at: now()
    }
  ];

  let seasons: LeagueSeason[] = [
    {
      id: 'demo-season-1',
      league_id: LEAGUE_ID,
      name: 'Season 2026',
      year: 2026,
      status: 'active',
      starts_on: '2026-06-01',
      ends_on: '2026-11-30',
      registration_opens_on: '2026-04-01',
      registration_closes_on: '2026-05-15',
      roster_deadline: '2026-05-25',
      transfer_window_opens_on: null,
      transfer_window_closes_on: null,
      notes: null,
      created_at: now(),
      updated_at: now()
    },
    {
      id: 'demo-season-2',
      league_id: LEAGUE_ID,
      name: 'Metro Cup 2026',
      year: 2026,
      status: 'draft',
      starts_on: null,
      ends_on: null,
      registration_opens_on: null,
      registration_closes_on: null,
      roster_deadline: null,
      transfer_window_opens_on: null,
      transfer_window_closes_on: null,
      notes: 'Knockout cup — dates to be confirmed.',
      created_at: now(),
      updated_at: now()
    }
  ];

  let venues: LeagueVenue[] = [
    { id: 'demo-venue-1', league_id: LEAGUE_ID, name: 'Rizal Memorial Pitch A', address: 'Malate, Manila', capacity: 4000, notes: null, created_at: now(), updated_at: now() },
    { id: 'demo-venue-2', league_id: LEAGUE_ID, name: 'McKinley Field 2', address: 'Taguig', capacity: 800, notes: 'Artificial turf', created_at: now(), updated_at: now() }
  ];

  return {
    listLeagues: async () => leagues,
    createLeague: async (ownerUserId, input) => {
      const row: League = {
        id: newId(), owner_user_id: ownerUserId, name: input.name.trim(),
        short_name: input.shortName?.trim() || null, logo_color: input.logoColor?.trim() || '#f97316',
        contact_email: input.contactEmail?.trim() || null, location: input.location?.trim() || null,
        description: input.description?.trim() || null, timezone: 'Asia/Manila', state: 'active',
        created_at: now(), updated_at: now()
      };
      leagues = [...leagues, row];
      return row;
    },
    updateLeague: async (leagueId, input) => {
      leagues = leagues.map(l => l.id === leagueId ? {
        ...l, name: input.name.trim(), short_name: input.shortName?.trim() || null,
        logo_color: input.logoColor?.trim() || l.logo_color, contact_email: input.contactEmail?.trim() || null,
        location: input.location?.trim() || null, description: input.description?.trim() || null, updated_at: now()
      } : l);
      return leagues.find(l => l.id === leagueId)!;
    },
    listSeasons: async leagueId => seasons.filter(s => s.league_id === leagueId),
    createSeason: async (leagueId, input) => {
      const row: LeagueSeason = {
        id: newId(), league_id: leagueId, name: input.name.trim(), year: input.year ?? null, status: 'draft',
        starts_on: input.startsOn || null, ends_on: input.endsOn || null,
        registration_opens_on: input.registrationOpensOn || null, registration_closes_on: input.registrationClosesOn || null,
        roster_deadline: input.rosterDeadline || null, transfer_window_opens_on: input.transferWindowOpensOn || null,
        transfer_window_closes_on: input.transferWindowClosesOn || null, notes: input.notes?.trim() || null,
        created_at: now(), updated_at: now()
      };
      seasons = [row, ...seasons];
      return row;
    },
    updateSeason: async (seasonId, input) => {
      seasons = seasons.map(s => s.id === seasonId ? {
        ...s, name: input.name.trim(), year: input.year ?? s.year, starts_on: input.startsOn || null,
        ends_on: input.endsOn || null, registration_opens_on: input.registrationOpensOn || null,
        registration_closes_on: input.registrationClosesOn || null, roster_deadline: input.rosterDeadline || null,
        transfer_window_opens_on: input.transferWindowOpensOn || null, transfer_window_closes_on: input.transferWindowClosesOn || null,
        notes: input.notes?.trim() || null, updated_at: now()
      } : s);
      return seasons.find(s => s.id === seasonId)!;
    },
    advanceSeasonStatus: async (seasonId, nextStatus) => {
      const season = seasons.find(s => s.id === seasonId);
      if (!season || !nextSeasonStatuses(season.status).includes(nextStatus)) {
        throw new Error('INVALID_SEASON_TRANSITION');
      }
      seasons = seasons.map(s => s.id === seasonId ? { ...s, status: nextStatus, updated_at: now() } : s);
      return nextStatus;
    },
    listVenues: async leagueId => venues.filter(v => v.league_id === leagueId),
    createVenue: async (leagueId, input) => {
      const row: LeagueVenue = {
        id: newId(), league_id: leagueId, name: input.name.trim(), address: input.address?.trim() || null,
        capacity: input.capacity ?? null, notes: input.notes?.trim() || null, created_at: now(), updated_at: now()
      };
      venues = [...venues, row];
      return row;
    },
    updateVenue: async (venueId, input) => {
      venues = venues.map(v => v.id === venueId ? {
        ...v, name: input.name.trim(), address: input.address?.trim() || null,
        capacity: input.capacity ?? null, notes: input.notes?.trim() || null, updated_at: now()
      } : v);
      return venues.find(v => v.id === venueId)!;
    },
    deleteVenue: async venueId => {
      venues = venues.filter(v => v.id !== venueId);
    }
  };
};

export const createPreviewLeagueAuthController = (): CloudAuthController => ({
  state: { status: 'disabled' },
  requestOtp: async () => undefined,
  signUpWithPassword: async () => undefined,
  signInWithPassword: async () => undefined,
  signInWithGoogle: async () => undefined,
  signOut: async () => undefined
});

export const createPreviewLeagueRuntime = (
  phase6: Phase6Config
): Extract<CloudRuntime, { enabled: true }> => ({
  enabled: true,
  phase6,
  dataAccess: { league: createDemoLeagueRepository() } as unknown as CloudDataAccess
});
