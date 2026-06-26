import type { DumalaSupabaseClient } from './client';
import { getSignedInUser } from './lifecycle';
import { sanitizeOperationalMetadata } from './operations';

export type TeamActivityEventType =
  | 'invitation_created'
  | 'invitation_accepted'
  | 'invitation_revoked'
  | 'membership_role_changed'
  | 'membership_removed'
  | 'membership_suspended'
  | 'bulletin_created'
  | 'bulletin_updated'
  | 'bulletin_removed'
  | 'bulletin_edit_conflict'
  | 'authorization_denied';

export interface TeamActivityEvent {
  id: string;
  club_id?: string | null;
  user_id?: string | null;
  device_id?: string | null;
  event_type: TeamActivityEventType;
  event_time: string;
  correlation_id?: string | null;
  metadata: Record<string, unknown>;
}

export class CloudActivityError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'CloudActivityError';
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
  if (result.error) throw new CloudActivityError(`${message}: ${getErrorMessage(result.error)}`, code, result.error);
  return result.data;
};

export const writeTeamActivityEvent = async (
  client: DumalaSupabaseClient,
  eventType: TeamActivityEventType,
  values: {
    clubId: string;
    deviceId?: string;
    correlationId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> => {
  const user = await getSignedInUser(client);

  expectNoError(
    await client.from('audit_events').insert({
      club_id: values.clubId,
      user_id: user.id,
      device_id: values.deviceId,
      correlation_id: values.correlationId,
      event_type: eventType,
      metadata: sanitizeOperationalMetadata(values.metadata)
    }),
    'TEAM_ACTIVITY_INSERT_FAILED',
    'Failed to write team activity event'
  );
};

export const listTeamActivityHistory = async (
  client: DumalaSupabaseClient,
  clubId: string,
  limit = 100
): Promise<TeamActivityEvent[]> =>
  expectNoError(
    await client
      .from('audit_events')
      .select('*')
      .eq('club_id', clubId)
      .order('event_time', { ascending: false })
      .limit(limit),
    'TEAM_ACTIVITY_READ_FAILED',
    'Failed to read team activity history'
  ) as unknown as TeamActivityEvent[];
