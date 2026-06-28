create or replace function public.get_admin_growth_metrics_v1(days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  window_days integer := greatest(1, least(coalesce(days, 30), 365));
  admin_role_value public.app_admin_role;
  warnings jsonb := '[]'::jsonb;
begin
  select admin.role
  into admin_role_value
  from public.app_admins admin
  where admin.user_id = auth.uid()
    and admin.revoked_at is null
  limit 1;

  if admin_role_value is null then
    perform public.record_admin_audit('admin_access_denied', 'user_profiles', auth.uid()::text, jsonb_build_object('rpc', 'get_admin_growth_metrics_v1'));
    raise exception 'APP_ADMIN_ACCESS_DENIED' using errcode = '42501';
  end if;

  if admin_role_value <> 'owner' then
    perform public.record_admin_audit('admin_access_denied', 'user_profiles', auth.uid()::text, jsonb_build_object('rpc', 'get_admin_growth_metrics_v1', 'role', admin_role_value));
    raise exception 'APP_ADMIN_OWNER_REQUIRED' using errcode = '42501';
  end if;

  if not public.is_admin_mfa_verified() then
    perform public.record_admin_audit('admin_mfa_required', 'user_profiles', auth.uid()::text, jsonb_build_object('rpc', 'get_admin_growth_metrics_v1'));
    raise exception 'ADMIN_MFA_REQUIRED' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.feedback_submissions feedback
    where feedback.status in ('new', 'triaged', 'planned', 'in_progress')
      and feedback.urgency in ('high', 'blocking')
  ) then
    warnings := warnings || jsonb_build_array('High-priority feedback is open.');
  end if;

  if exists (
    select 1
    from public.fprds_beta_submissions submission
    where submission.review_status = 'pending'
      and submission.submitted_at < now() - interval '7 days'
  ) then
    warnings := warnings || jsonb_build_array('FPRDS submissions are pending longer than seven days.');
  end if;

  if exists (
    select 1
    from public.billing_events event
    where event.processing_error is not null
      and event.received_at >= now() - make_interval(days => window_days)
  ) then
    warnings := warnings || jsonb_build_array('Billing webhook errors exist in the selected window.');
  end if;

  perform public.record_admin_audit('growth_metrics_read', 'user_profiles', null, jsonb_build_object('days', window_days));

  return jsonb_build_object(
    'windowDays', window_days,
    'users', jsonb_build_object(
      'total', (select count(*)::int from public.user_profiles),
      'newToday', (select count(*)::int from public.user_profiles where created_at >= date_trunc('day', now())),
      'new7d', (select count(*)::int from public.user_profiles where created_at >= now() - interval '7 days'),
      'new30d', (select count(*)::int from public.user_profiles where created_at >= now() - interval '30 days'),
      'active7d', (select count(distinct user_id)::int from public.app_usage_events where created_at >= now() - interval '7 days' and user_id is not null),
      'active30d', (select count(distinct user_id)::int from public.app_usage_events where created_at >= now() - interval '30 days' and user_id is not null),
      'pendingDeletion', (select count(*)::int from public.user_profiles where account_state = 'pending_deletion'),
      'deleted', (select count(*)::int from public.user_profiles where account_state = 'deleted')
    ),
    'workspaces', jsonb_build_object(
      'total', (select count(*)::int from public.clubs),
      'active', (select count(*)::int from public.clubs where club_state = 'active'),
      'pendingDeletion', (select count(*)::int from public.clubs where club_state = 'pending_deletion'),
      'deleted', (select count(*)::int from public.clubs where club_state = 'deleted'),
      'new30d', (select count(*)::int from public.clubs where created_at >= now() - interval '30 days')
    ),
    'engagement', jsonb_build_object(
      'dau', (select count(distinct user_id)::int from public.app_usage_events where created_at >= now() - interval '1 day' and user_id is not null),
      'wau', (select count(distinct user_id)::int from public.app_usage_events where created_at >= now() - interval '7 days' and user_id is not null),
      'mau', (select count(distinct user_id)::int from public.app_usage_events where created_at >= now() - interval '30 days' and user_id is not null),
      'avgSessionMinutes', coalesce((
        select round(avg(greatest(0, extract(epoch from (session.last_seen_at - session.started_at))) / 60.0), 1)
        from public.app_sessions session
        where session.started_at >= now() - make_interval(days => window_days)
      ), 0),
      'activeSessionsNow', (
        select count(*)::int
        from public.app_sessions session
        where session.last_seen_at >= now() - interval '5 minutes'
      )
    ),
    'topWorkspaces', coalesce((
      select jsonb_agg(jsonb_build_object(
        'clubId', workspace.club_id,
        'name', workspace.name,
        'ownerUserId', workspace.owner_user_id,
        'memberCount', workspace.member_count,
        'eventCount', workspace.event_count,
        'feedbackCount', workspace.feedback_count,
        'fprdsCount', workspace.fprds_count,
        'lastActiveAt', workspace.last_active_at
      ) order by workspace.event_count desc, workspace.last_active_at desc nulls last)
      from (
        select
          club.id as club_id,
          club.name,
          club.owner_user_id,
          count(distinct membership.user_id)::int as member_count,
          count(distinct usage_event.id)::int as event_count,
          count(distinct feedback.id)::int as feedback_count,
          count(distinct fprds.id)::int as fprds_count,
          max(usage_event.created_at) as last_active_at
        from public.clubs club
        left join public.club_memberships membership on membership.club_id = club.id and membership.membership_state = 'active'
        left join public.app_usage_events usage_event on usage_event.club_id = club.id and usage_event.created_at >= now() - make_interval(days => window_days)
        left join public.feedback_submissions feedback on feedback.club_id = club.id
        left join public.fprds_beta_submissions fprds on fprds.club_id = club.id
        group by club.id, club.name, club.owner_user_id
        order by count(distinct usage_event.id) desc, max(usage_event.created_at) desc nulls last
        limit 20
      ) workspace
    ), '[]'::jsonb),
    'recentUsers', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', user_row.user_id,
        'displayName', user_row.display_name,
        'email', user_row.email,
        'accountState', user_row.account_state,
        'createdAt', user_row.created_at,
        'lastActiveAt', user_row.last_active_at,
        'workspaceCount', user_row.workspace_count,
        'deviceCount', user_row.device_count,
        'feedbackCount', user_row.feedback_count,
        'fprdsCount', user_row.fprds_count
      ) order by user_row.last_active_at desc nulls last, user_row.created_at desc)
      from (
        select
          profile.user_id,
          profile.display_name,
          auth_user.email,
          profile.account_state::text as account_state,
          profile.created_at,
          max(usage_event.created_at) as last_active_at,
          count(distinct membership.club_id)::int as workspace_count,
          count(distinct device.id)::int as device_count,
          count(distinct feedback.id)::int as feedback_count,
          count(distinct fprds.id)::int as fprds_count
        from public.user_profiles profile
        left join auth.users auth_user on auth_user.id = profile.user_id
        left join public.club_memberships membership on membership.user_id = profile.user_id and membership.membership_state = 'active'
        left join public.devices device on device.user_id = profile.user_id and device.revoked_at is null
        left join public.app_usage_events usage_event on usage_event.user_id = profile.user_id and usage_event.created_at >= now() - make_interval(days => window_days)
        left join public.feedback_submissions feedback on feedback.user_id = profile.user_id
        left join public.fprds_beta_submissions fprds on fprds.submitted_by = profile.user_id
        group by profile.user_id, profile.display_name, auth_user.email, profile.account_state, profile.created_at
        order by max(usage_event.created_at) desc nulls last, profile.created_at desc
        limit 50
      ) user_row
    ), '[]'::jsonb),
    'feedbackIntelligence', jsonb_build_object(
      'duplicateGroups', coalesce((
        select jsonb_agg(jsonb_build_object(
          'fingerprint', duplicate.fingerprint,
          'count', duplicate.count,
          'latestAt', duplicate.latest_at,
          'sampleSubject', duplicate.sample_subject
        ) order by duplicate.count desc, duplicate.latest_at desc)
        from (
          select
            lower(regexp_replace(subject, '[^a-zA-Z0-9]+', ' ', 'g')) as fingerprint,
            count(*)::int,
            max(created_at) as latest_at,
            min(subject) as sample_subject
          from public.feedback_submissions
          where created_at >= now() - make_interval(days => window_days)
          group by lower(regexp_replace(subject, '[^a-zA-Z0-9]+', ' ', 'g'))
          having count(*) > 1
          order by count(*) desc, max(created_at) desc
          limit 12
        ) duplicate
      ), '[]'::jsonb),
      'roadmapCandidates', coalesce((
        select jsonb_agg(jsonb_build_object(
          'area', candidate.affected_area,
          'category', candidate.category,
          'count', candidate.count,
          'highPriorityCount', candidate.high_priority_count,
          'latestAt', candidate.latest_at
        ) order by candidate.high_priority_count desc, candidate.count desc, candidate.latest_at desc)
        from (
          select
            affected_area,
            category::text,
            count(*)::int,
            count(*) filter (where urgency in ('high', 'blocking'))::int as high_priority_count,
            max(created_at) as latest_at
          from public.feedback_submissions
          where status in ('new', 'triaged', 'planned')
          group by affected_area, category
          order by count(*) filter (where urgency in ('high', 'blocking')) desc, count(*) desc
          limit 12
        ) candidate
      ), '[]'::jsonb)
    ),
    'fprdsAnalytics', jsonb_build_object(
      'averageOvr', (select round(avg(ovr), 1) from public.fprds_beta_submissions where ovr is not null),
      'averageCoachConfidence', (select round(avg(coach_confidence), 1) from public.fprds_beta_submissions where coach_confidence is not null),
      'pendingOlderThan7d', (
        select count(*)::int
        from public.fprds_beta_submissions
        where review_status = 'pending'
          and submitted_at < now() - interval '7 days'
      ),
      'byRole', coalesce((
        select jsonb_agg(jsonb_build_object('key', role_key, 'count', count, 'avgOvr', avg_ovr) order by count desc)
        from (
          select role::text as role_key, count(*)::int, round(avg(ovr), 1) as avg_ovr
          from public.fprds_beta_submissions
          group by role
        ) roles
      ), '[]'::jsonb),
      'byAssessmentType', coalesce((
        select jsonb_agg(jsonb_build_object('key', assessment_type_key, 'count', count) order by count desc)
        from (
          select assessment_type::text as assessment_type_key, count(*)::int
          from public.fprds_beta_submissions
          group by assessment_type
        ) assessment_types
      ), '[]'::jsonb)
    ),
    'billingReadiness', jsonb_build_object(
      'customers', (select count(*)::int from public.billing_customers),
      'subscriptions', (select count(*)::int from public.subscriptions),
      'activeOrTrial', (select count(*)::int from public.subscriptions where status in ('active', 'trialing')),
      'pastDue', (select count(*)::int from public.subscriptions where status = 'past_due'),
      'failedWebhookEvents', (select count(*)::int from public.billing_events where processing_error is not null),
      'ledgerEntries', (select count(*)::int from public.payment_ledger_entries),
      'ledgerAmountDue', coalesce((
        select sum(case
          when entry_type in ('charge', 'refund') then amount
          when entry_type in ('payment', 'waiver') then -amount
          else 0
        end)
        from public.payment_ledger_entries
        where voided_at is null
          and deleted_at is null
      ), 0),
      'ledgerAmountPaid', coalesce((
        select sum(amount)
        from public.payment_ledger_entries
        where entry_type = 'payment'
          and voided_at is null
          and deleted_at is null
      ), 0)
    ),
    'exports', jsonb_build_object(
      'recentExportCount', (
        select count(*)::int
        from public.admin_audit_events event
        where event.event_type = 'admin_export'
          and event.created_at >= now() - make_interval(days => window_days)
      ),
      'recentExports', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', export_event.id,
          'actorUserId', export_event.actor_user_id,
          'actorRole', export_event.actor_role,
          'metadata', export_event.metadata,
          'createdAt', export_event.created_at
        ) order by export_event.created_at desc)
        from (
          select *
          from public.admin_audit_events
          where event_type = 'admin_export'
          order by created_at desc
          limit 20
        ) export_event
      ), '[]'::jsonb)
    ),
    'alerts', warnings
  );
end;
$$;

grant execute on function public.get_admin_growth_metrics_v1(integer) to authenticated;
