create or replace function public.is_app_admin_role(required_roles public.app_admin_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admins admin
    where admin.user_id = auth.uid()
      and admin.revoked_at is null
      and admin.role = any(required_roles)
  );
$$;

create or replace function public.is_admin_mfa_verified()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

create table public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role public.app_admin_role,
  event_type text not null,
  target_table text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint admin_audit_events_event_type_check check (char_length(event_type) between 3 and 120),
  constraint admin_audit_events_target_table_check check (target_table is null or char_length(target_table) <= 120)
);

create index admin_audit_events_created_idx on public.admin_audit_events(created_at desc);
create index admin_audit_events_actor_created_idx on public.admin_audit_events(actor_user_id, created_at desc);
create index admin_audit_events_type_created_idx on public.admin_audit_events(event_type, created_at desc);

alter table public.admin_audit_events enable row level security;

create policy "owners with mfa can read admin audit events"
on public.admin_audit_events for select to authenticated
using (
  public.is_app_admin_role(array['owner']::public.app_admin_role[])
  and public.is_admin_mfa_verified()
);

create policy "authenticated users can write admin audit events"
on public.admin_audit_events for insert to authenticated
with check (actor_user_id = auth.uid());

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
  current_role public.app_admin_role;
begin
  select admin.role
  into current_role
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
    current_role,
    event_type,
    target_table,
    target_id,
    coalesce(metadata, '{}'::jsonb)
  )
  returning id into audit_id;

  return audit_id;
end;
$$;

drop policy if exists "app admins can read app admins" on public.app_admins;

create policy "admins can read own admin row"
on public.app_admins for select to authenticated
using (
  user_id = auth.uid()
  and revoked_at is null
);

create policy "owners with mfa can manage app admins"
on public.app_admins for all to authenticated
using (
  public.is_app_admin_role(array['owner']::public.app_admin_role[])
  and public.is_admin_mfa_verified()
)
with check (
  public.is_app_admin_role(array['owner']::public.app_admin_role[])
  and public.is_admin_mfa_verified()
);

create policy "owner mfa required for billing customer reads"
on public.billing_customers
as restrictive
for select to authenticated
using (
  public.is_app_admin_role(array['owner', 'billing']::public.app_admin_role[])
  and public.is_admin_mfa_verified()
);

create policy "owner mfa required for subscription reads"
on public.subscriptions
as restrictive
for select to authenticated
using (
  public.is_app_admin_role(array['owner', 'billing']::public.app_admin_role[])
  and public.is_admin_mfa_verified()
);

create policy "owner mfa required for billing event reads"
on public.billing_events
as restrictive
for select to authenticated
using (
  public.is_app_admin_role(array['owner', 'billing']::public.app_admin_role[])
  and public.is_admin_mfa_verified()
);

create policy "feedback role read guard"
on public.feedback_submissions
as restrictive
for select to authenticated
using (
  public.is_app_admin_role(array['support']::public.app_admin_role[])
  or (
    public.is_app_admin_role(array['owner']::public.app_admin_role[])
    and public.is_admin_mfa_verified()
  )
);

create policy "usage role read guard"
on public.app_usage_events
as restrictive
for select to authenticated
using (
  public.is_app_admin_role(array['support']::public.app_admin_role[])
  or (
    public.is_app_admin_role(array['owner']::public.app_admin_role[])
    and public.is_admin_mfa_verified()
  )
);

create policy "session role read guard"
on public.app_sessions
as restrictive
for select to authenticated
using (
  public.is_app_admin_role(array['support']::public.app_admin_role[])
  or (
    public.is_app_admin_role(array['owner']::public.app_admin_role[])
    and public.is_admin_mfa_verified()
  )
);

create policy "fprds role read guard"
on public.fprds_beta_submissions
as restrictive
for select to authenticated
using (
  submitted_by = auth.uid()
  or public.is_app_admin_role(array['fprds_reviewer']::public.app_admin_role[])
  or (
    public.is_app_admin_role(array['owner']::public.app_admin_role[])
    and public.is_admin_mfa_verified()
  )
);

create policy "fprds drill role read guard"
on public.fprds_beta_drill_results
as restrictive
for select to authenticated
using (
  public.is_app_admin_role(array['fprds_reviewer']::public.app_admin_role[])
  or (
    public.is_app_admin_role(array['owner']::public.app_admin_role[])
    and public.is_admin_mfa_verified()
  )
  or exists (
    select 1
    from public.fprds_beta_submissions submission
    where submission.id = fprds_beta_drill_results.submission_id
      and submission.submitted_by = auth.uid()
  )
);

create or replace function public.get_admin_security_metrics_v1(days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  window_days integer := greatest(1, least(coalesce(days, 30), 365));
  current_admin public.app_admins%rowtype;
  warnings jsonb := '[]'::jsonb;
begin
  select *
  into current_admin
  from public.app_admins admin
  where admin.user_id = auth.uid()
    and admin.revoked_at is null
  limit 1;

  if current_admin.user_id is null then
    perform public.record_admin_audit('admin_access_denied', 'app_admins', auth.uid()::text, jsonb_build_object('rpc', 'get_admin_security_metrics_v1'));
    raise exception 'APP_ADMIN_ACCESS_DENIED' using errcode = '42501';
  end if;

  if current_admin.role <> 'owner' then
    perform public.record_admin_audit('admin_access_denied', 'admin_audit_events', auth.uid()::text, jsonb_build_object('rpc', 'get_admin_security_metrics_v1', 'role', current_admin.role));
    raise exception 'APP_ADMIN_OWNER_REQUIRED' using errcode = '42501';
  end if;

  if not public.is_admin_mfa_verified() then
    perform public.record_admin_audit('admin_mfa_required', 'admin_audit_events', auth.uid()::text, jsonb_build_object('rpc', 'get_admin_security_metrics_v1'));
    raise exception 'ADMIN_MFA_REQUIRED' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.app_admins admin
    where admin.role = 'owner'
      and admin.revoked_at is null
  ) and not public.is_admin_mfa_verified() then
    warnings := warnings || jsonb_build_array('Owner MFA is not verified for this session.');
  end if;

  perform public.record_admin_audit('security_metrics_read', 'admin_audit_events', null, jsonb_build_object('days', window_days));

  return jsonb_build_object(
    'currentAdmin', jsonb_build_object(
      'userId', current_admin.user_id,
      'role', current_admin.role,
      'assuranceLevel', auth.jwt() ->> 'aal',
      'mfaVerified', public.is_admin_mfa_verified(),
      'grantedAt', current_admin.granted_at
    ),
    'adminCountsByRole', coalesce((
      select jsonb_agg(jsonb_build_object('role', role, 'count', count))
      from (
        select admin.role, count(*)::int
        from public.app_admins admin
        where admin.revoked_at is null
        group by admin.role
        order by admin.role
      ) role_counts
    ), '[]'::jsonb),
    'admins', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', admin.user_id,
        'role', admin.role,
        'grantedAt', admin.granted_at,
        'revokedAt', admin.revoked_at,
        'notes', admin.notes
      ) order by admin.granted_at desc)
      from public.app_admins admin
    ), '[]'::jsonb),
    'deniedAccessCount', (
      select count(*)::int
      from public.admin_audit_events event
      where event.created_at >= now() - make_interval(days => window_days)
        and event.event_type in ('admin_access_denied', 'admin_mfa_required')
    ),
    'recentAuditEvents', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', event.id,
        'actorUserId', event.actor_user_id,
        'actorRole', event.actor_role,
        'eventType', event.event_type,
        'targetTable', event.target_table,
        'targetId', event.target_id,
        'metadata', event.metadata,
        'createdAt', event.created_at
      ) order by event.created_at desc)
      from (
        select *
        from public.admin_audit_events
        order by created_at desc
        limit 50
      ) event
    ), '[]'::jsonb),
    'activeSessionsNow', (
      select count(*)::int
      from public.app_sessions session
      where session.last_seen_at >= now() - interval '5 minutes'
    ),
    'lastOwnerLoginAt', (
      select max(event.created_at)
      from public.admin_audit_events event
      where event.actor_role = 'owner'
        and event.event_type in ('admin_login', 'security_metrics_read', 'admin_console_opened')
    ),
    'warnings', warnings
  );
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
  current_role public.app_admin_role;
begin
  select admin.role
  into current_role
  from public.app_admins admin
  where admin.user_id = auth.uid()
    and admin.revoked_at is null
  limit 1;

  if current_role is null then
    perform public.record_admin_audit('admin_access_denied', 'app_admins', auth.uid()::text, jsonb_build_object('rpc', 'get_admin_product_metrics_v1'));
    raise exception 'APP_ADMIN_ACCESS_DENIED' using errcode = '42501';
  end if;

  if current_role <> 'owner' then
    perform public.record_admin_audit('admin_access_denied', 'app_usage_events', auth.uid()::text, jsonb_build_object('rpc', 'get_admin_product_metrics_v1', 'role', current_role));
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
        select jsonb_agg(jsonb_build_object('key', age_group, 'count', count) order by key)
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

create or replace function public.get_admin_console_snapshot_v2(days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_app_admin() then
    perform public.record_admin_audit('admin_access_denied', 'app_admins', auth.uid()::text, jsonb_build_object('rpc', 'get_admin_console_snapshot_v2'));
    raise exception 'APP_ADMIN_ACCESS_DENIED' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'productMetrics', case
      when public.is_app_admin_role(array['owner']::public.app_admin_role[]) and public.is_admin_mfa_verified()
        then public.get_admin_product_metrics_v1(days)
      else null
    end,
    'securityMetrics', case
      when public.is_app_admin_role(array['owner']::public.app_admin_role[]) and public.is_admin_mfa_verified()
        then public.get_admin_security_metrics_v1(days)
      else null
    end
  );
end;
$$;

grant execute on function public.is_app_admin_role(public.app_admin_role[]) to anon, authenticated;
grant execute on function public.is_admin_mfa_verified() to anon, authenticated;
grant execute on function public.record_admin_audit(text, text, text, jsonb) to authenticated;
grant execute on function public.get_admin_security_metrics_v1(integer) to authenticated;
grant execute on function public.get_admin_product_metrics_v1(integer) to authenticated;
grant execute on function public.get_admin_console_snapshot_v2(integer) to authenticated;
grant select, insert on public.admin_audit_events to authenticated;
