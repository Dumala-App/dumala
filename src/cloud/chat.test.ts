import { describe, expect, it, vi } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import { createCloudDataAccess } from './dataAccess';
import { CloudChatError, unreadCount, type ChatMessage } from './chat';

const createRpcStub = (result: unknown, error: unknown = null) => {
  const rpc = vi.fn().mockResolvedValue({ data: result, error });
  return { client: { rpc } as unknown as DumalaSupabaseClient, rpc };
};

const msg = (over: Partial<ChatMessage>): ChatMessage => ({
  id: 'm', channel_id: 'c', club_id: 'club', author_user_id: 'other', author_name: 'A',
  author_role: 'player', body: 'hi', deleted_at: null, deleted_by: null,
  created_at: '2026-07-10T10:00:00.000Z', ...over
});

describe('unreadCount', () => {
  const lastRead = '2026-07-10T10:00:00.000Z';

  it('counts messages from others after the last-read marker', () => {
    const messages = [
      msg({ id: '1', created_at: '2026-07-10T09:00:00.000Z' }), // before
      msg({ id: '2', created_at: '2026-07-10T11:00:00.000Z' }), // after, other
      msg({ id: '3', created_at: '2026-07-10T12:00:00.000Z', author_user_id: 'me' }) // after, self
    ];
    expect(unreadCount(messages, lastRead, 'me')).toBe(1);
  });

  it('ignores deleted messages', () => {
    expect(unreadCount([msg({ created_at: '2026-07-10T11:00:00.000Z', deleted_at: '2026-07-10T11:30:00.000Z' })], lastRead, 'me')).toBe(0);
  });

  it('counts everything from others when never read', () => {
    expect(unreadCount([msg({ id: '1' }), msg({ id: '2' })], null, 'me')).toBe(2);
  });
});

describe('cloud chat repository', () => {
  it('posts a trimmed message through the RPC', async () => {
    const saved = msg({ id: 'new', body: 'Ready' });
    const { client, rpc } = createRpcStub(saved);
    await expect(createCloudDataAccess(client).chat.postMessage('club-1', '  Ready  ')).resolves.toEqual(saved);
    expect(rpc).toHaveBeenCalledWith('post_team_chat_message', { target_club_id: 'club-1', body: 'Ready' });
  });

  it('ensures a channel and returns its id', async () => {
    const { client, rpc } = createRpcStub('chan-1');
    await expect(createCloudDataAccess(client).chat.ensureChannel('club-1')).resolves.toBe('chan-1');
    expect(rpc).toHaveBeenCalledWith('ensure_team_channel', { target_club_id: 'club-1' });
  });

  it('surfaces errors as CloudChatError', async () => {
    const { client } = createRpcStub(null, { message: 'denied' });
    await expect(createCloudDataAccess(client).chat.postMessage('club-1', 'hi')).rejects.toBeInstanceOf(CloudChatError);
  });
});
