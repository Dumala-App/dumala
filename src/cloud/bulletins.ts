import type { DumalaSupabaseClient } from './client';
import { writeTeamActivityEvent } from './activity';
import { getSignedInUser } from './lifecycle';

export type SharedBulletinCategory = 'urgent' | 'matchday' | 'training' | 'social';

export interface SharedBulletin {
  id: string;
  club_id: string;
  title: string;
  content: string;
  bulletin_date: string;
  category: SharedBulletinCategory;
  author_snapshot: string;
  created_at?: string;
  created_by?: string | null;
  updated_at?: string;
  updated_by?: string | null;
  version: number;
  deleted_at?: string | null;
}

export class CloudBulletinError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'CloudBulletinError';
  }
}

const getErrorMessage = (error: unknown) => {
  if (!error) return 'Unknown Supabase error.';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
  return String(error);
};

const expectNoError = <Data>(
  result: { data: Data; error: unknown },
  code: string,
  message: string
): Data => {
  if (result.error) throw new CloudBulletinError(`${message}: ${getErrorMessage(result.error)}`, code, result.error);
  return result.data;
};

export const normalizeBulletinCategory = (category: string): SharedBulletinCategory => {
  const normalized = category.trim().toLowerCase();
  if (['urgent', 'matchday', 'training', 'social'].includes(normalized)) {
    return normalized as SharedBulletinCategory;
  }

  throw new CloudBulletinError('Unsupported bulletin category.', 'BULLETIN_CATEGORY_INVALID');
};

const assertBulletinText = (value: string, code: string, label: string) => {
  const trimmed = value.trim();
  if (!trimmed) throw new CloudBulletinError(`${label} is required.`, code);
  return trimmed;
};

export const listSharedBulletins = async (
  client: DumalaSupabaseClient,
  clubId: string
): Promise<SharedBulletin[]> =>
  expectNoError(
    await client
      .from('bulletins')
      .select('*')
      .eq('club_id', clubId)
      .is('deleted_at', null)
      .order('bulletin_date', { ascending: false })
      .order('created_at', { ascending: false }),
    'LIST_BULLETINS_FAILED',
    'Failed to list shared bulletins.'
  ) as SharedBulletin[];

export const createSharedBulletin = async (
  client: DumalaSupabaseClient,
  input: {
    id: string;
    clubId: string;
    title: string;
    content: string;
    bulletinDate: string;
    category: string;
    authorSnapshot: string;
  }
): Promise<SharedBulletin> => {
  const user = await getSignedInUser(client);
  const category = normalizeBulletinCategory(input.category);
  const bulletin = expectNoError(
    await client
      .from('bulletins')
      .insert({
        id: input.id,
        club_id: input.clubId,
        title: assertBulletinText(input.title, 'BULLETIN_TITLE_REQUIRED', 'Bulletin title'),
        content: input.content.trim(),
        bulletin_date: assertBulletinText(input.bulletinDate, 'BULLETIN_DATE_REQUIRED', 'Bulletin date'),
        category,
        author_snapshot: assertBulletinText(input.authorSnapshot, 'BULLETIN_AUTHOR_REQUIRED', 'Bulletin author'),
        created_by: user.id,
        updated_by: user.id
      })
      .select('*')
      .single(),
    'CREATE_BULLETIN_FAILED',
    'Failed to create shared bulletin.'
  ) as SharedBulletin;

  await writeTeamActivityEvent(client, 'bulletin_created', {
    clubId: input.clubId,
    metadata: { category, version: bulletin.version }
  });

  return bulletin;
};

export const updateSharedBulletinControlled = async (
  client: DumalaSupabaseClient,
  input: {
    id: string;
    expectedVersion: number;
    title: string;
    content: string;
    bulletinDate: string;
    category: string;
    authorSnapshot: string;
  }
): Promise<SharedBulletin> =>
  expectNoError(
    await client.rpc('update_bulletin_controlled', {
      target_bulletin_id: input.id,
      expected_version: input.expectedVersion,
      new_title: assertBulletinText(input.title, 'BULLETIN_TITLE_REQUIRED', 'Bulletin title'),
      new_content: input.content.trim(),
      new_bulletin_date: assertBulletinText(input.bulletinDate, 'BULLETIN_DATE_REQUIRED', 'Bulletin date'),
      new_category: normalizeBulletinCategory(input.category),
      new_author_snapshot: assertBulletinText(input.authorSnapshot, 'BULLETIN_AUTHOR_REQUIRED', 'Bulletin author')
    }),
    'UPDATE_BULLETIN_FAILED',
    'Failed to update shared bulletin.'
  ) as SharedBulletin;

export const removeSharedBulletinControlled = async (
  client: DumalaSupabaseClient,
  input: {
    id: string;
    expectedVersion: number;
  }
): Promise<SharedBulletin> =>
  expectNoError(
    await client.rpc('remove_bulletin_controlled', {
      target_bulletin_id: input.id,
      expected_version: input.expectedVersion
    }),
    'REMOVE_BULLETIN_FAILED',
    'Failed to remove shared bulletin.'
  ) as SharedBulletin;
