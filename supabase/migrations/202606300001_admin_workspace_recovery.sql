create or replace function public.require_owner_admin_mfa(target_rpc text, target_table text)
returns public.app_admin_role
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_role_value public.app_admin_role;
begin
  select admin.role
  into admin_role_value
  from public.app_admins admin
  where admin.user_id = auth.uid()
    and admin.revoked_at is null
  limit 1;

  if admin_role_value is null then
    perform public.record_admin_audit('admin_access_denied', target_table, auth.uid()::text, jsonb_build_object('rpc', target_rpc));
    raise exception 'APP_ADMIN_ACCESS_DENIED' using errcode = '42501';
  end if;

  if admin_role_value <> 'owner' then
    perform public.record_admin_audit('admin_access_denied', target_table, auth.uid()::text, jsonb_build_object('rpc', target_rpc, 'role', admin_role_value));
    raise exception 'APP_ADMIN_OWNER_REQUIRED' using errcode = '42501';
  end if;

  if not public.is_admin_mfa_verified() then
    perform public.record_admin_audit('admin_mfa_required', target_table, auth.uid()::text, jsonb_build_object('rpc', target_rpc));
    raise exception 'ADMIN_MFA_REQUIRED' using errcode = '42501';
  end if;

  return admin_role_value;
end;
$$;

create or replace function public.list_admin_recoverable_workspaces_v1(days integer default 365)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  window_days integer := greatest(1, least(coalesce(days, 365), 3650));
  payload jsonb;
begin
  perform public.require_owner_admin_mfa('list_admin_recoverable_workspaces_v1', 'clubs');
  perform public.record_admin_audit('recoverable_workspaces_read', 'clubs', null, jsonb_build_object('days', window_days));

  select coalesce(jsonb_agg(jsonb_build_object(
    'clubId', workspace.club_id,
    'name', workspace.name,
    'ownerUserId', workspace.owner_user_id,
    'ownerEmail', workspace.owner_email,
    'state', workspace.club_state,
    'memberCount', workspace.member_count,
    'lastActiveAt', workspace.last_active_at,
    'pendingDeletionAt', workspace.pending_deletion_at,
    'deletedAt', workspace.deleted_at,
    'createdAt', workspace.created_at,
    'updatedAt', workspace.updated_at
  ) order by workspace.updated_at desc), '[]'::jsonb)
  into payload
  from (
    select
      club.id as club_id,
      club.name,
      club.owner_user_id,
      auth_user.email as owner_email,
      club.club_state::text as club_state,
      club.pending_deletion_at,
      club.deleted_at,
      club.created_at,
      club.updated_at,
      count(distinct membership.user_id)::int as member_count,
      max(usage_event.created_at) as last_active_at
    from public.clubs club
    left join auth.users auth_user on auth_user.id = club.owner_user_id
    left join public.club_memberships membership on membership.club_id = club.id
    left join public.app_usage_events usage_event on usage_event.club_id = club.id
    where club.club_state in ('pending_deletion', 'deleted')
      and coalesce(club.deleted_at, club.pending_deletion_at, club.updated_at) >= now() - make_interval(days => window_days)
    group by club.id, club.name, club.owner_user_id, auth_user.email, club.club_state, club.pending_deletion_at, club.deleted_at, club.created_at, club.updated_at
    order by club.updated_at desc
    limit 100
  ) workspace;

  return payload;
end;
$$;

create or replace function public.restore_admin_workspace_v1(target_club_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  restored public.clubs%rowtype;
  owner_email text;
  member_count integer;
  last_active_at timestamptz;
begin
  perform public.require_owner_admin_mfa('restore_admin_workspace_v1', 'clubs');

  update public.clubs
  set
    club_state = 'active',
    pending_deletion_at = null,
    deleted_at = null
  where id = target_club_id
    and club_state in ('pending_deletion', 'deleted')
  returning * into restored;

  if restored.id is null then
    perform public.record_admin_audit('workspace_restore_failed', 'clubs', target_club_id::text, jsonb_build_object('reason', 'not_recoverable'));
    raise exception 'WORKSPACE_NOT_RECOVERABLE' using errcode = 'P0002';
  end if;

  select email into owner_email from auth.users where id = restored.owner_user_id;
  select count(distinct user_id)::int into member_count from public.club_memberships where club_id = restored.id;
  select max(created_at) into last_active_at from public.app_usage_events where club_id = restored.id;

  perform public.record_admin_audit('workspace_restored', 'clubs', restored.id::text, jsonb_build_object('workspaceName', restored.name));

  return jsonb_build_object(
    'clubId', restored.id,
    'name', restored.name,
    'ownerUserId', restored.owner_user_id,
    'ownerEmail', owner_email,
    'state', restored.club_state,
    'memberCount', coalesce(member_count, 0),
    'lastActiveAt', last_active_at,
    'pendingDeletionAt', restored.pending_deletion_at,
    'deletedAt', restored.deleted_at,
    'createdAt', restored.created_at,
    'updatedAt', restored.updated_at
  );
end;
$$;

grant execute on function public.require_owner_admin_mfa(text, text) to authenticated;
grant execute on function public.list_admin_recoverable_workspaces_v1(integer) to authenticated;
grant execute on function public.restore_admin_workspace_v1(uuid) to authenticated;
