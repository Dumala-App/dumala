import type { SupabaseClient } from '@supabase/supabase-js';
import type { DumalaSupabaseClient } from './client';
import { DEFAULT_PLAN_CODE, PLAN_PREMIUM } from '../billing/plans';

export type PromotionDiscountType = 'percent' | 'fixed';
export type AnnouncementKind = 'info' | 'feature' | 'maintenance' | 'promo';

export interface PromotionRecord {
  id: string;
  name: string;
  headline?: string | null;
  description?: string | null;
  plan_code: string;
  discount_type: PromotionDiscountType;
  discount_value: number;
  starts_at: string;
  ends_at?: string | null;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromotionInput {
  name: string;
  headline?: string | null;
  description?: string | null;
  planCode?: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
}

export interface AnnouncementRecord {
  id: string;
  title: string;
  body: string;
  kind: AnnouncementKind;
  is_published: boolean;
  starts_at: string;
  ends_at?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementInput {
  title: string;
  body: string;
  kind?: AnnouncementKind;
  isPublished?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

const asUntypedClient = (client: DumalaSupabaseClient): SupabaseClient => client as unknown as SupabaseClient;

const getErrorMessage = (error: unknown) => {
  if (!error) return 'Unknown Supabase error.';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
  return String(error);
};

export class CloudMarketingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'CloudMarketingError';
  }
}

const expectNoError = <Data>(
  result: { data: Data; error: unknown },
  code: string,
  message: string
): Data => {
  if (result.error) throw new CloudMarketingError(`${message}: ${getErrorMessage(result.error)}`, code, result.error);
  return result.data;
};

const validatePromotionInput = (input: PromotionInput) => {
  if (!input.name?.trim()) {
    throw new CloudMarketingError('A promotion name is required.', 'PROMOTION_NAME_REQUIRED');
  }
  if (!Number.isFinite(input.discountValue) || input.discountValue <= 0) {
    throw new CloudMarketingError('The discount value must be greater than zero.', 'PROMOTION_DISCOUNT_INVALID');
  }
  if (input.discountType === 'percent' && input.discountValue > 100) {
    throw new CloudMarketingError('A percent discount cannot exceed 100.', 'PROMOTION_DISCOUNT_INVALID');
  }
};

const promotionRow = (input: PromotionInput) => ({
  name: input.name.trim(),
  headline: input.headline?.trim() || null,
  description: input.description?.trim() || null,
  plan_code: (input.planCode?.trim().toLowerCase() || PLAN_PREMIUM) || DEFAULT_PLAN_CODE,
  discount_type: input.discountType,
  discount_value: input.discountValue,
  starts_at: input.startsAt ?? new Date().toISOString(),
  ends_at: input.endsAt ?? null,
  is_active: input.isActive ?? true
});

export const listAdminPromotions = async (client: DumalaSupabaseClient): Promise<PromotionRecord[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('promotions').select('*').order('created_at', { ascending: false }).limit(200),
    'PROMOTIONS_READ_FAILED',
    'Failed to load promotions'
  ) as PromotionRecord[] | null) ?? [];
};

export const listActivePromotions = async (client: DumalaSupabaseClient): Promise<PromotionRecord[]> => {
  const now = new Date().toISOString();
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', now)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order('starts_at', { ascending: false })
      .limit(10),
    'ACTIVE_PROMOTIONS_READ_FAILED',
    'Failed to load active promotions'
  ) as PromotionRecord[] | null) ?? [];
};

export const createAdminPromotion = async (
  client: DumalaSupabaseClient,
  input: PromotionInput
): Promise<PromotionRecord> => {
  validatePromotionInput(input);
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.from('promotions').insert(promotionRow(input)).select('*').single(),
    'PROMOTION_CREATE_FAILED',
    'Failed to create promotion'
  ) as PromotionRecord;
};

export const updateAdminPromotion = async (
  client: DumalaSupabaseClient,
  promotionId: string,
  input: PromotionInput
): Promise<PromotionRecord> => {
  validatePromotionInput(input);
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.from('promotions').update(promotionRow(input)).eq('id', promotionId).select('*').single(),
    'PROMOTION_UPDATE_FAILED',
    'Failed to update promotion'
  ) as PromotionRecord;
};

export const setAdminPromotionActive = async (
  client: DumalaSupabaseClient,
  promotionId: string,
  isActive: boolean
): Promise<PromotionRecord> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.from('promotions').update({ is_active: isActive }).eq('id', promotionId).select('*').single(),
    'PROMOTION_TOGGLE_FAILED',
    isActive ? 'Failed to activate promotion' : 'Failed to deactivate promotion'
  ) as PromotionRecord;
};

export const deleteAdminPromotion = async (
  client: DumalaSupabaseClient,
  promotionId: string
): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.from('promotions').delete().eq('id', promotionId),
    'PROMOTION_DELETE_FAILED',
    'Failed to delete promotion'
  );
};

const validateAnnouncementInput = (input: AnnouncementInput) => {
  if (!input.title?.trim()) {
    throw new CloudMarketingError('An announcement title is required.', 'ANNOUNCEMENT_TITLE_REQUIRED');
  }
  if (!input.body?.trim()) {
    throw new CloudMarketingError('An announcement body is required.', 'ANNOUNCEMENT_BODY_REQUIRED');
  }
};

const announcementRow = (input: AnnouncementInput) => ({
  title: input.title.trim(),
  body: input.body.trim(),
  kind: input.kind ?? 'info',
  is_published: input.isPublished ?? false,
  starts_at: input.startsAt ?? new Date().toISOString(),
  ends_at: input.endsAt ?? null
});

export const listAdminAnnouncements = async (client: DumalaSupabaseClient): Promise<AnnouncementRecord[]> => {
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(200),
    'ANNOUNCEMENTS_READ_FAILED',
    'Failed to load announcements'
  ) as AnnouncementRecord[] | null) ?? [];
};

export const listActiveAnnouncements = async (client: DumalaSupabaseClient): Promise<AnnouncementRecord[]> => {
  const now = new Date().toISOString();
  const supabase = asUntypedClient(client);
  return (expectNoError(
    await supabase
      .from('announcements')
      .select('*')
      .eq('is_published', true)
      .lte('starts_at', now)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order('starts_at', { ascending: false })
      .limit(10),
    'ACTIVE_ANNOUNCEMENTS_READ_FAILED',
    'Failed to load active announcements'
  ) as AnnouncementRecord[] | null) ?? [];
};

export const createAdminAnnouncement = async (
  client: DumalaSupabaseClient,
  input: AnnouncementInput
): Promise<AnnouncementRecord> => {
  validateAnnouncementInput(input);
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.from('announcements').insert(announcementRow(input)).select('*').single(),
    'ANNOUNCEMENT_CREATE_FAILED',
    'Failed to create announcement'
  ) as AnnouncementRecord;
};

export const updateAdminAnnouncement = async (
  client: DumalaSupabaseClient,
  announcementId: string,
  input: AnnouncementInput
): Promise<AnnouncementRecord> => {
  validateAnnouncementInput(input);
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.from('announcements').update(announcementRow(input)).eq('id', announcementId).select('*').single(),
    'ANNOUNCEMENT_UPDATE_FAILED',
    'Failed to update announcement'
  ) as AnnouncementRecord;
};

export const setAdminAnnouncementPublished = async (
  client: DumalaSupabaseClient,
  announcementId: string,
  isPublished: boolean
): Promise<AnnouncementRecord> => {
  const supabase = asUntypedClient(client);
  return expectNoError(
    await supabase.from('announcements').update({ is_published: isPublished }).eq('id', announcementId).select('*').single(),
    'ANNOUNCEMENT_TOGGLE_FAILED',
    isPublished ? 'Failed to publish announcement' : 'Failed to unpublish announcement'
  ) as AnnouncementRecord;
};

export const deleteAdminAnnouncement = async (
  client: DumalaSupabaseClient,
  announcementId: string
): Promise<void> => {
  const supabase = asUntypedClient(client);
  expectNoError(
    await supabase.from('announcements').delete().eq('id', announcementId),
    'ANNOUNCEMENT_DELETE_FAILED',
    'Failed to delete announcement'
  );
};
