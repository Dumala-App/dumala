-- Activation funnel for commercial validation.
--
-- The app emits one app_usage_event per first-week milestone the first time a
-- coach reaches it: event_type = 'activation_milestone', feature_name = the
-- milestone id (roster, schedule, result, assessment, report). This RPC turns
-- those events into an ordered funnel of distinct users and workspaces per step
-- so we can see where coaches drop off before getting value.

create or replace function public.get_activation_funnel_v1(days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  window_days integer := greatest(1, least(coalesce(days, 30), 365));
  admin_role_value public.app_admin_role;
  steps text[] := array['roster', 'schedule', 'result', 'assessment', 'report'];
  result jsonb;
begin
  select admin.role
  into admin_role_value
  from public.app_admins admin
  where admin.user_id = auth.uid()
    and admin.revoked_at is null
  limit 1;

  if admin_role_value is null then
    raise exception 'APP_ADMIN_ACCESS_DENIED' using errcode = '42501';
  end if;

  if admin_role_value <> 'owner' then
    raise exception 'APP_ADMIN_OWNER_REQUIRED' using errcode = '42501';
  end if;

  if not public.is_admin_mfa_verified() then
    raise exception 'ADMIN_MFA_REQUIRED' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'step', s.step,
      'users', (
        select count(distinct event.user_id)::int
        from public.app_usage_events event
        where event.event_type = 'activation_milestone'
          and event.feature_name = s.step
          and event.created_at >= now() - make_interval(days => window_days)
      ),
      'workspaces', (
        select count(distinct event.club_id)::int
        from public.app_usage_events event
        where event.event_type = 'activation_milestone'
          and event.feature_name = s.step
          and event.created_at >= now() - make_interval(days => window_days)
      )
    ) order by s.ord
  ), '[]'::jsonb)
  into result
  from unnest(steps) with ordinality as s(step, ord);

  return result;
end;
$$;

grant execute on function public.get_activation_funnel_v1(integer) to authenticated;
