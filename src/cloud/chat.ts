import type { SupabaseClient } from '@supabase/supabase-js';
import type { DumalaSupabaseClient } from './client';

// Phase 6 - Team Chat. One official team channel per club; members are a club's
// active staff or its linked players (youth-consent gated server-side). Live
// updates are polled by the UI.

export interface ChatMessage {
  id: string;
  channel_id: string;
  club_id: string;
  author_user_id: string | null;
  author_name: string;
  author_role: 'owner' | 'admin' | 'coach' | 'staff' | 'player';
  body: string;
  message_kind: 'message' | 'announcement';
  deleted_at: string | null;
  deleted_by: string | null;
  created_at: string;
}

const asUntypedClient = (client: DumalaSupabaseClient): SupabaseClient => client as unknown as SupabaseClient;

const getErrorMessage = (error: unknown) => {
  if (!error) return 'Unknown Supabase error.';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
  return String(error);
};

export class CloudChatError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'CloudChatError';
  }
}

const expectNoError = <Data>(
  result: { data: Data; error: unknown },
  code: string,
  message: string
): Data => {
  if (result.error) throw new CloudChatError(`${message}: ${getErrorMessage(result.error)}`, code, result.error);
  return result.data;
};

// --- Pure helper (unit-testable) ---------------------------------------------

/** Messages from others, created after the viewer's last-read marker. */
export const unreadCount = (
  messages: ChatMessage[],
  lastReadAt: string | null,
  selfUserId: string | null
): number => {
  const since = lastReadAt ? new Date(lastReadAt).getTime() : 0;
  return messages.filter(message => {
    if (message.deleted_at) return false;
    if (message.author_user_id && message.author_user_id === selfUserId) return false;
    return new Date(message.created_at).getTime() > since;
  }).length;
};

export const visibleChatMessages = (messages: ChatMessage[]): ChatMessage[] => (
  messages.filter(message => !message.deleted_at)
);

export const chatMessageKind = (message: Pick<ChatMessage, 'message_kind'>): ChatMessage['message_kind'] => (
  message.message_kind === 'announcement' ? 'announcement' : 'message'
);

// --- RPC wrappers ------------------------------------------------------------

export const ensureChannel = async (client: DumalaSupabaseClient, clubId: string): Promise<string> => {
  const supabase = asUntypedClient(client);
  const data = expectNoError(
    await supabase.rpc('ensure_team_channel', { target_club_id: clubId }),
    'CHAT_CHANNEL_FAILED',
    'Failed to open the team chat'
  );
  return String(data);
};

export const listMessages = async (
  client: DumalaSupabaseClient,
  clubId: string,
  limit = 200
): Promise<ChatMessage[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase
      .from('team_chat_messages')
      .select('*')
      .eq('club_id', clubId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(limit),
    'CHAT_MESSAGES_READ_FAILED',
    'Failed to load messages'
  ) as ChatMessage[] | null) ?? [];
};

export const postMessage = async (
  client: DumalaSupabaseClient,
  clubId: string,
  body: string
): Promise<ChatMessage> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.rpc('post_team_chat_message', { target_club_id: clubId, body: body.trim() }),
    'CHAT_POST_FAILED',
    'Failed to send your message'
  ) as ChatMessage;
};

export const postAnnouncement = async (
  client: DumalaSupabaseClient,
  clubId: string,
  body: string
): Promise<ChatMessage> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.rpc('post_team_chat_announcement', { target_club_id: clubId, body: body.trim() }),
    'CHAT_ANNOUNCEMENT_FAILED',
    'Failed to post the team announcement'
  ) as ChatMessage;
};

export const deleteMessage = async (client: DumalaSupabaseClient, messageId: string): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.rpc('delete_team_chat_message', { message_id: messageId }),
    'CHAT_DELETE_FAILED',
    'Failed to remove the message'
  );
};

export const reportMessage = async (
  client: DumalaSupabaseClient,
  messageId: string,
  reason?: string | null
): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.rpc('report_team_chat_message', { message_id: messageId, reason: reason?.trim() || null }),
    'CHAT_REPORT_FAILED',
    'Failed to report the message'
  );
};

export const markChatRead = async (client: DumalaSupabaseClient, channelId: string): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.rpc('mark_team_chat_read', { p_channel_id: channelId }),
    'CHAT_READ_FAILED',
    'Failed to update read state'
  );
};

export const getTeamChatCaptainUserId = async (
  client: DumalaSupabaseClient,
  clubId: string
): Promise<string | null> => {
  const supabase = asUntypedClient(client);
  const data = expectNoError(
    await supabase.rpc('get_team_chat_captain_user_id', { target_club_id: clubId }),
    'CHAT_CAPTAIN_READ_FAILED',
    'Failed to load the team captain'
  );
  return typeof data === 'string' && data ? data : null;
};
