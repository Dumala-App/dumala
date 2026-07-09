import { describe, expect, it, vi } from 'vitest';
import type { DumalaSupabaseClient } from './client';
import { createCloudDataAccess } from './dataAccess';
import { CloudMarketingError } from './marketing';

interface QueryStub {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  then: (resolve: (value: { data: unknown; error: null }) => void) => void;
}

const createClientStub = (result: unknown) => {
  const query = {} as QueryStub;
  const chain = () => query;
  query.select = vi.fn(chain);
  query.insert = vi.fn(chain);
  query.update = vi.fn(chain);
  query.delete = vi.fn(chain);
  query.eq = vi.fn(chain);
  query.lte = vi.fn(chain);
  query.or = vi.fn(chain);
  query.order = vi.fn(chain);
  query.limit = vi.fn(chain);
  query.single = vi.fn().mockResolvedValue({ data: result, error: null });
  query.then = resolve => resolve({ data: result, error: null });
  const from = vi.fn(() => query);
  return { client: { from } as unknown as DumalaSupabaseClient, from, query };
};

describe('cloud marketing repository', () => {
  it('creates a promotion with normalized values', async () => {
    const saved = { id: 'promo-1', name: 'Season kickoff sale' };
    const { client, from, query } = createClientStub(saved);

    await expect(
      createCloudDataAccess(client).marketing.createPromotion({
        name: '  Season kickoff sale  ',
        headline: ' 20% off Premium ',
        description: null,
        discountType: 'percent',
        discountValue: 20,
        startsAt: '2026-07-09T00:00:00.000Z',
        endsAt: null,
        isActive: true
      })
    ).resolves.toEqual(saved);

    expect(from).toHaveBeenCalledWith('promotions');
    expect(query.insert).toHaveBeenCalledWith({
      name: 'Season kickoff sale',
      headline: '20% off Premium',
      description: null,
      plan_code: 'premium',
      discount_type: 'percent',
      discount_value: 20,
      starts_at: '2026-07-09T00:00:00.000Z',
      ends_at: null,
      is_active: true
    });
  });

  it('rejects a percent discount above 100', async () => {
    const { client } = createClientStub(null);

    await expect(
      createCloudDataAccess(client).marketing.createPromotion({
        name: 'Broken sale',
        discountType: 'percent',
        discountValue: 120
      })
    ).rejects.toBeInstanceOf(CloudMarketingError);
  });

  it('reads only live promotions for public surfaces', async () => {
    const { client, from, query } = createClientStub([]);

    await expect(createCloudDataAccess(client).marketing.listActivePromotions()).resolves.toEqual([]);

    expect(from).toHaveBeenCalledWith('promotions');
    expect(query.eq).toHaveBeenCalledWith('is_active', true);
    expect(query.lte).toHaveBeenCalledWith('starts_at', expect.any(String));
    expect(query.or).toHaveBeenCalledWith(expect.stringContaining('ends_at.is.null'));
  });

  it('creates an announcement as draft by default', async () => {
    const saved = { id: 'notice-1', title: 'Maintenance window' };
    const { client, from, query } = createClientStub(saved);

    await expect(
      createCloudDataAccess(client).marketing.createAnnouncement({
        title: ' Maintenance window ',
        body: ' Dumala will be briefly unavailable on Sunday. ',
        startsAt: '2026-07-12T00:00:00.000Z'
      })
    ).resolves.toEqual(saved);

    expect(from).toHaveBeenCalledWith('announcements');
    expect(query.insert).toHaveBeenCalledWith({
      title: 'Maintenance window',
      body: 'Dumala will be briefly unavailable on Sunday.',
      kind: 'info',
      is_published: false,
      starts_at: '2026-07-12T00:00:00.000Z',
      ends_at: null
    });
  });

  it('requires a title and body for announcements', async () => {
    const { client } = createClientStub(null);

    await expect(
      createCloudDataAccess(client).marketing.createAnnouncement({ title: '   ', body: 'Body' })
    ).rejects.toBeInstanceOf(CloudMarketingError);
    await expect(
      createCloudDataAccess(client).marketing.createAnnouncement({ title: 'Title', body: '  ' })
    ).rejects.toBeInstanceOf(CloudMarketingError);
  });

  it('toggles announcement publishing by id', async () => {
    const saved = { id: 'notice-1', is_published: true };
    const { client, query } = createClientStub(saved);

    await expect(
      createCloudDataAccess(client).marketing.setAnnouncementPublished('notice-1', true)
    ).resolves.toEqual(saved);

    expect(query.update).toHaveBeenCalledWith({ is_published: true });
    expect(query.eq).toHaveBeenCalledWith('id', 'notice-1');
  });

  it('deletes promotions by id', async () => {
    const { client, from, query } = createClientStub(null);

    await expect(createCloudDataAccess(client).marketing.deletePromotion('promo-1')).resolves.toBeUndefined();

    expect(from).toHaveBeenCalledWith('promotions');
    expect(query.delete).toHaveBeenCalled();
    expect(query.eq).toHaveBeenCalledWith('id', 'promo-1');
  });
});
