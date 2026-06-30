import { describe, expect, it, vi } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import { ensureAccountBootstrap } from './account';

class QueryStep {
  constructor(
    private readonly table: string,
    private readonly calls: Array<{ table: string; method: string; value?: unknown }>,
    private readonly response: unknown
  ) {}

  upsert(value: unknown, options?: unknown) {
    this.calls.push({ table: this.table, method: 'upsert', value: { value, options } });
    return this;
  }

  insert(value: unknown) {
    this.calls.push({ table: this.table, method: 'insert', value });
    return this;
  }

  select(value: string) {
    this.calls.push({ table: this.table, method: 'select', value });
    return this;
  }

  eq(column: string, value: unknown) {
    this.calls.push({ table: this.table, method: 'eq', value: { column, value } });
    return this;
  }

  order(column: string, value: unknown) {
    this.calls.push({ table: this.table, method: 'order', value: { column, value } });
    return this;
  }

  limit(value: number) {
    this.calls.push({ table: this.table, method: 'limit', value });
    return this;
  }

  single() {
    this.calls.push({ table: this.table, method: 'single' });
    return this;
  }

  maybeSingle() {
    this.calls.push({ table: this.table, method: 'maybeSingle' });
    return this;
  }

  then(resolve: (value: unknown) => void) {
    resolve(this.response);
  }
}

describe('account bootstrap repository', () => {
  it('ensures profile, owner club, owner membership, and device records', async () => {
    const calls: Array<{ table: string; method: string; value?: unknown }> = [];
    const responses = new Map<string, unknown[]>([
      ['user_profiles', [
        { data: null, error: null },
        { data: { user_id: 'user-1', display_name: 'Coach' }, error: null }
      ]],
      ['clubs', [
        { data: null, error: null },
        { data: { id: 'club-1', name: 'Dumala FC', owner_user_id: 'user-1' }, error: null }
      ]],
      ['club_memberships', [
        { data: null, error: null },
        { data: { id: 'membership-1', club_id: 'club-1', user_id: 'user-1', role: 'owner' }, error: null }
      ]],
      ['devices', [{ data: { id: 'device-1', user_id: 'user-1', app_version: '0.0.0' }, error: null }]]
    ]);
    const from = vi.fn((table: string) => {
      const response = responses.get(table)?.shift();
      if (!response) throw new Error(`Missing mock response for ${table}.`);
      return new QueryStep(table, calls, response);
    });
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'coach@example.com' } },
          error: null
        })
      },
      from
    } as unknown as DumalaSupabaseClient;

    const result = await ensureAccountBootstrap(client, {
      clubName: 'Dumala FC',
      deviceId: 'device-1',
      deviceLabel: 'Training laptop',
      appVersion: '0.0.0',
      displayName: 'Coach',
      now: new Date('2026-06-26T02:00:00.000Z')
    });

    expect(result.club.id).toBe('club-1');
    expect(from).toHaveBeenCalledWith('user_profiles');
    expect(from).toHaveBeenCalledWith('clubs');
    expect(from).toHaveBeenCalledWith('club_memberships');
    expect(from).toHaveBeenCalledWith('devices');
    expect(calls).toContainEqual({
      table: 'club_memberships',
      method: 'insert',
      value: {
        club_id: 'club-1',
        user_id: 'user-1',
        role: 'owner',
        membership_state: 'active',
        accepted_at: '2026-06-26T02:00:00.000Z'
      }
    });
    expect(calls).not.toContainEqual(expect.objectContaining({
      table: 'club_memberships',
      method: 'upsert'
    }));
  });

  it('reuses an existing owner membership without updating the protected owner row', async () => {
    const calls: Array<{ table: string; method: string; value?: unknown }> = [];
    const responses = new Map<string, unknown[]>([
      ['user_profiles', [{ data: { user_id: 'user-1', display_name: 'Coach' }, error: null }]],
      ['clubs', [{ data: { id: 'club-1', name: 'Dumala FC', owner_user_id: 'user-1' }, error: null }]],
      ['club_memberships', [{ data: { id: 'membership-1', club_id: 'club-1', user_id: 'user-1', role: 'owner', membership_state: 'active' }, error: null }]],
      ['devices', [{ data: { id: 'device-1', user_id: 'user-1', app_version: '0.0.0' }, error: null }]]
    ]);
    const from = vi.fn((table: string) => {
      const response = responses.get(table)?.shift();
      if (!response) throw new Error(`Missing mock response for ${table}.`);
      return new QueryStep(table, calls, response);
    });
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'coach@example.com' } },
          error: null
        })
      },
      from
    } as unknown as DumalaSupabaseClient;

    const result = await ensureAccountBootstrap(client, {
      clubName: 'Dumala FC',
      deviceId: 'device-1',
      appVersion: '0.0.0',
      now: new Date('2026-06-26T02:00:00.000Z')
    });

    expect(result.membership.id).toBe('membership-1');
    expect(calls).not.toContainEqual(expect.objectContaining({
      table: 'club_memberships',
      method: 'insert'
    }));
    expect(calls).not.toContainEqual(expect.objectContaining({
      table: 'club_memberships',
      method: 'upsert'
    }));
  });
});
