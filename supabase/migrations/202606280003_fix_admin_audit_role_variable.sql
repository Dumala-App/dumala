create or replace function public.record_admin_audit(
  event_type text,
  target_table text default null,
  target_id text default null,
  metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  audit_id uuid;
  admin_role_value public.app_admin_role;
begin
  select admin.role
  into admin_role_value
  from public.app_admins admin
  where admin.user_id = auth.uid()
    and admin.revoked_at is null
  limit 1;

  insert into public.admin_audit_events (
    actor_user_id,
    actor_role,
    event_type,
    target_table,
    target_id,
    metadata
  ) values (
    auth.uid(),
    admin_role_value,
    event_type,
    target_table,
    target_id,
    coalesce(metadata, '{}'::jsonb)
  )
  returning id into audit_id;

  return audit_id;
end;
$$;

create or replace function public.get_admin_product_metrics_v1(days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  window_days integer := greatest(1, least(coalesce(days, 30), 365));
  admin_role_value public.app_admin_role;
begin
  select admin.role
  into admin_role_value
  from public.app_admins admin
  where admin.user_id = auth.uid()
    and admin.revoked_at is null
  limit 1;

  if admin_role_value is null then
    perform public.record_admin_audit('admin_access_denied', 'app_admins', auth.uid()::text, jsonb_build_object('rpc', 'get_admin_product_metrics_v1'));
    raise exception 'APP_ADMIN_ACCESS_DENIED' using errcode = '42501';
  end if;

  if admin_role_value <> 'owner' then
    perform public.record_admin_audit('admin_access_denied', 'app_usage_events', auth.uid()::text, jsonb_build_object('rpc', 'get_admin_product_metrics_v1', 'role', admin_role_value));
    raise exception 'APP_ADMIN_OWNER_REQUIRED' using errcode = '42501';
  end if;

  if not public.is_admin_mfa_verified() then
    perform public.record_admin_audit('admin_mfa_required', 'app_usage_events', auth.uid()::text, jsonb_build_object('rpc', 'get_admin_product_metrics_v1'));
    raise exception 'ADMIN_MFA_REQUIRED' using errcode = '42501';
  end if;

  perform public.record_admin_audit('product_metrics_read', 'app_usage_events', null, jsonb_build_object('days', window_days));

  return jsonb_build_object(
    'activeUsersNow', (
      select count(distinct user_id)::int
      from public.app_sessions
      where last_seen_at >= now() - interval '5 minutes'
        and user_id is not null
    ),
    'eventsLast24h', (
      select count(*)::int
      from public.app_usage_events
      where created_at >= now() - interval '24 hours'
    ),
    'topTabs', coalesce((
      select jsonb_agg(jsonb_build_object('key', view_name, 'count', count) order by count desc)
      from (
        select coalesce(view_name, 'Unknown') as view_name, count(*)::int
        from public.app_usage_events
        where created_at >= now() - make_interval(days => window_days)
        group by coalesce(view_name, 'Unknown')
        order by count(*) desc
        limit 12
      ) views
    ), '[]'::jsonb),
    'leastUsedTabs', coalesce((
      select jsonb_agg(jsonb_build_object('key', view_name, 'count', count) order by count asc)
      from (
        select coalesce(view_name, 'Unknown') as view_name, count(*)::int
        from public.app_usage_events
        where created_at >= now() - make_interval(days => window_days)
        group by coalesce(view_name, 'Unknown')
        order by count(*) asc
        limit 12
      ) views
    ), '[]'::jsonb),
    'deviceBreakdown', coalesce((
      select jsonb_agg(jsonb_build_object('key', device_type, 'count', count) order by count desc)
      from (
        select coalesce(device_type, 'Unknown') as device_type, count(*)::int
        from public.app_usage_events
        where created_at >= now() - make_interval(days => window_days)
        group by coalesce(device_type, 'Unknown')
        order by count(*) desc
      ) devices
    ), '[]'::jsonb),
    'browserBreakdown', coalesce((
      select jsonb_agg(jsonb_build_object('key', browser_family, 'count', count) order by count desc)
      from (
        select coalesce(browser_family, 'Unknown') as browser_family, count(*)::int
        from public.app_usage_events
        where created_at >= now() - make_interval(days => window_days)
        group by coalesce(browser_family, 'Unknown')
        order by count(*) desc
      ) browsers
    ), '[]'::jsonb),
    'feedback', jsonb_build_object(
      'total', (select count(*)::int from public.feedback_submissions where created_at >= now() - make_interval(days => window_days)),
      'open', (select count(*)::int from public.feedback_submissions where status in ('new', 'triaged', 'planned', 'in_progress')),
      'highPriority', (select count(*)::int from public.feedback_submissions where urgency in ('high', 'blocking')),
      'byArea', coalesce((
        select jsonb_agg(jsonb_build_object('key', affected_area, 'count', count) order by count desc)
        from (
          select affected_area, count(*)::int
          from public.feedback_submissions
          group by affected_area
          order by count(*) desc
          limit 12
        ) areas
      ), '[]'::jsonb)
    ),
    'fprds', jsonb_build_object(
      'pending', (select count(*)::int from public.fprds_beta_submissions where review_status = 'pending'),
      'accepted', (select count(*)::int from public.fprds_beta_submissions where review_status = 'accepted'),
      'excluded', (select count(*)::int from public.fprds_beta_submissions where review_status = 'excluded'),
      'byAgeGroup', coalesce((
        select jsonb_agg(jsonb_build_object('key', key, 'count', count) order by key)
        from (
          select age_group::text as key, count(*)::int
          from public.fprds_beta_submissions
          group by age_group
        ) age_groups
      ), '[]'::jsonb)
    ),
    'billing', jsonb_build_object(
      'customers', (select count(*)::int from public.billing_customers),
      'subscriptions', (select count(*)::int from public.subscriptions),
      'activeOrTrial', (select count(*)::int from public.subscriptions where status in ('active', 'trialing')),
      'failedWebhookEvents', (select count(*)::int from public.billing_events where processing_error is not null)
    )
  );
end;
$$;
