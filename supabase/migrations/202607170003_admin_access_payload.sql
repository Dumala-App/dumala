-- Admin Access Center support: expose persona and active entitlements through
-- the owner-only managed-user RPC payload. The RPC remains protected by
-- require_owner_admin_mfa; this only avoids client-side guessing.

create or replace function public.admin_managed_user_payload_v1(target_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'userId', profile.user_id,
    'email', auth_user.email,
    'displayName', profile.display_name,
    'persona', profile.persona,
    'entitlements', coalesce((
      select jsonb_agg(entitlement.entitlement order by entitlement.entitlement)
      from public.user_entitlements entitlement
      where entitlement.user_id = profile.user_id
        and (entitlement.expires_at is null or entitlement.expires_at > now())
    ), '[]'::jsonb),
    'accountState', profile.account_state,
    'createdAt', profile.created_at,
    'lastActiveAt', (select max(e.created_at) from public.app_usage_events e where e.user_id = profile.user_id),
    'workspaceCount', (
      select count(*)::int
      from public.club_memberships m
      where m.user_id = profile.user_id and m.membership_state = 'active'
    ),
    'deviceCount', (
      select count(*)::int
      from public.devices d
      where d.user_id = profile.user_id and d.revoked_at is null
    ),
    'feedbackCount', (
      select count(*)::int
      from public.feedback_submissions f
      where f.user_id = profile.user_id
    ),
    'bannedAt', moderation.banned_at,
    'banReason', moderation.ban_reason,
    'mutedUntil', moderation.muted_until,
    'muteReason', moderation.mute_reason,
    'planCode', coalesce(moderation.plan_code, 'free'),
    'planExpiresAt', moderation.plan_expires_at,
    'planNote', moderation.plan_note,
    'adminNotes', moderation.admin_notes
  )
  from public.user_profiles profile
  left join auth.users auth_user on auth_user.id = profile.user_id
  left join public.user_moderation moderation on moderation.user_id = profile.user_id
  where profile.user_id = target_user_id;
$$;

revoke all on function public.admin_managed_user_payload_v1(uuid) from public, anon, authenticated;
