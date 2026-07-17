import type { SupabaseClient } from '@supabase/supabase-js';
import type { DumalaSupabaseClient } from './client';

// Phase 6 - Public team page. A club owner/admin publishes a read-only,
// login-free showcase page for their team at dumala.asia/#/t/<slug>. Coach-side
// settings live in club_public_pages (RLS-guarded); anonymous visitors read a
// curated bundle through the get_public_team security-definer RPC.

const asUntypedClient = (client: DumalaSupabaseClient): SupabaseClient => client as unknown as SupabaseClient;

const getErrorMessage = (error: unknown) => {
  if (!error) return 'Unknown Supabase error.';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
  return String(error);
};

export class CloudTeamPageError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'CloudTeamPageError';
  }
}

const expectNoError = <Data>(
  result: { data: Data; error: unknown },
  code: string,
  message: string
): Data => {
  if (result.error) throw new CloudTeamPageError(`${message}: ${getErrorMessage(result.error)}`, code, result.error);
  return result.data;
};

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === '23505';

// --- Slug helpers (unit-testable) ---------------------------------------------

export const TEAM_SLUG_MIN_LENGTH = 3;
export const TEAM_SLUG_MAX_LENGTH = 32;
const TEAM_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;

/** Lowercase letters, digits, and hyphens; 3-32 chars; no edge hyphens. */
export const isValidTeamSlug = (slug: string): boolean => TEAM_SLUG_PATTERN.test(slug);

/** Best-effort slug from a team name, e.g. "Blue Eagles FC!" -> "blue-eagles-fc". */
export const suggestTeamSlug = (teamName: string): string => {
  const slug = teamName
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, TEAM_SLUG_MAX_LENGTH)
    .replace(/-+$/g, '');
  return slug.length >= TEAM_SLUG_MIN_LENGTH ? slug : '';
};

export const buildPublicTeamUrl = (slug: string, origin?: string): string => {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/#/t/${slug}`;
};

/** Slug from a public page hash: '#/t/blue-eagles' or '#/t?team=blue-eagles'. */
export const parsePublicTeamSlug = (hash: string): string | undefined => {
  const afterRoot = hash.replace(/^#\/?/, '');
  if (afterRoot.startsWith('t/')) {
    const slug = afterRoot.slice(2).split(/[/?#]/)[0].toLowerCase();
    return slug || undefined;
  }
  const q = afterRoot.indexOf('?');
  if (q !== -1) {
    const slug = new URLSearchParams(afterRoot.slice(q + 1)).get('team');
    if (slug) return slug.toLowerCase();
  }
  return undefined;
};

// --- Coach-side settings -------------------------------------------------------

export interface ClubPublicPage {
  club_id: string;
  is_public: boolean;
  slug: string;
  headline: string | null;
  team_photo: string | null;
  show_roster: boolean;
  show_staff: boolean;
  show_lineup: boolean;
  show_results: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClubPublicPageInput {
  isPublic: boolean;
  slug: string;
  headline?: string | null;
  teamPhoto?: string | null;
  showRoster?: boolean;
  showStaff?: boolean;
  showLineup?: boolean;
  showResults?: boolean;
}

export const getClubPublicPage = async (
  client: DumalaSupabaseClient,
  clubId: string
): Promise<ClubPublicPage | null> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('club_public_pages').select('*').eq('club_id', clubId).maybeSingle(),
    'TEAM_PAGE_READ_FAILED',
    'Failed to load the public page settings'
  ) as ClubPublicPage | null) ?? null;
};

export const saveClubPublicPage = async (
  client: DumalaSupabaseClient,
  clubId: string,
  input: ClubPublicPageInput
): Promise<ClubPublicPage> => {
  const slug = input.slug.trim().toLowerCase();
  if (!isValidTeamSlug(slug)) {
    throw new CloudTeamPageError(
      'Links can use 3-32 lowercase letters, numbers, and hyphens (no leading or trailing hyphen).',
      'TEAM_PAGE_SLUG_INVALID'
    );
  }

  const supabase = asUntypedClient(client);
  const result = await supabase
    .from('club_public_pages')
    .upsert({
      club_id: clubId,
      is_public: input.isPublic,
      slug,
      headline: input.headline?.trim() || null,
      team_photo: input.teamPhoto || null,
      show_roster: input.showRoster ?? true,
      show_staff: input.showStaff ?? true,
      show_lineup: input.showLineup ?? true,
      show_results: input.showResults ?? true
    }, { onConflict: 'club_id' })
    .select('*')
    .single();

  if (result.error && isUniqueViolation(result.error)) {
    throw new CloudTeamPageError(
      'That link is already taken by another team. Try a different one.',
      'TEAM_PAGE_SLUG_TAKEN',
      result.error
    );
  }
  return expectNoError(result, 'TEAM_PAGE_SAVE_FAILED', 'Failed to save the public page') as ClubPublicPage;
};

// --- Public team page (no login) ------------------------------------------------

export interface PublicTeamClub {
  name: string;
  shortName: string | null;
  founded: string | null;
  stadium: string | null;
  league: string | null;
  logoColor: string;
  logoUrl: string | null;
}

export interface PublicTeamRosterEntry {
  name: string;
  number: number;
  position: string;
}

export interface PublicTeamStaffEntry {
  name: string;
  role: string;
}

export interface PublicTeamLineupSlot {
  slotId: string;
  name: string;
  position: string;
}

export interface PublicTeamLineup {
  formation: string | null;
  matchFormat: string | null;
  starters: PublicTeamLineupSlot[];
}

export interface PublicTeamResult {
  opponent: string;
  date: string;
  ourScore: number;
  opponentScore: number;
  type: string;
}

export interface PublicTeamBundle {
  found: boolean;
  club?: PublicTeamClub;
  page?: { headline: string | null; teamPhoto: string | null; updatedAt: string };
  roster: PublicTeamRosterEntry[];
  staff: PublicTeamStaffEntry[];
  lineup: PublicTeamLineup;
  results: PublicTeamResult[];
}

export const EMPTY_PUBLIC_TEAM_BUNDLE: PublicTeamBundle = {
  found: false,
  roster: [],
  staff: [],
  lineup: { formation: null, matchFormat: null, starters: [] },
  results: []
};

/** Read a published team page by its slug (anonymous-safe RPC). */
export const getPublicTeam = async (client: DumalaSupabaseClient, slug: string): Promise<PublicTeamBundle> => {
  const supabase = asUntypedClient(client);
  const data = expectNoError(
    await supabase.rpc('get_public_team', { page_slug: slug.trim().toLowerCase() }),
    'PUBLIC_TEAM_READ_FAILED',
    'Failed to load the team page'
  ) as {
    found: boolean;
    club?: PublicTeamClub;
    page?: { headline: string | null; teamPhoto: string | null; updatedAt: string };
    roster?: PublicTeamRosterEntry[];
    staff?: PublicTeamStaffEntry[];
    lineup?: PublicTeamLineup;
    results?: PublicTeamResult[];
  } | null;

  if (!data || !data.found) return EMPTY_PUBLIC_TEAM_BUNDLE;
  return {
    found: true,
    club: data.club,
    page: data.page,
    roster: data.roster ?? [],
    staff: data.staff ?? [],
    lineup: data.lineup ?? { formation: null, matchFormat: null, starters: [] },
    results: data.results ?? []
  };
};
