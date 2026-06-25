create extension if not exists pgcrypto with schema extensions;

create type public.account_state as enum ('active', 'disabled', 'pending_deletion', 'deleted');
create type public.club_state as enum ('active', 'suspended', 'pending_deletion', 'deleted');
create type public.membership_role as enum ('owner', 'admin', 'coach', 'staff', 'viewer');
create type public.membership_state as enum ('active', 'invited', 'suspended', 'removed');
create type public.club_invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');
create type public.workspace_import_status as enum ('started', 'completed', 'failed', 'rolled_back');
create type public.sync_mutation_operation as enum ('insert', 'update', 'delete', 'function');
create type public.sync_mutation_status as enum ('applied', 'rejected', 'conflict', 'duplicate');
create type public.sync_change_operation as enum ('insert', 'update', 'delete');
create type public.audit_event_type as enum (
  'account_created',
  'sign_in',
  'club_created',
  'migration_started',
  'migration_completed',
  'migration_failed',
  'export_requested',
  'export_completed',
  'deletion_requested',
  'deletion_cancelled',
  'deletion_completed',
  'device_revoked',
  'invitation_created',
  'invitation_accepted',
  'invitation_revoked',
  'membership_role_changed',
  'membership_removed',
  'membership_suspended',
  'bulletin_created',
  'bulletin_updated',
  'bulletin_removed',
  'bulletin_edit_conflict',
  'record_updated',
  'record_removed',
  'record_edit_conflict',
  'authorization_denied'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'en-PH',
  timezone text not null default 'Asia/Manila',
  account_state public.account_state not null default 'active',
  accepted_terms_version text,
  accepted_privacy_version text,
  pending_deletion_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_deleted_state_check check (
    (deleted_at is null and account_state <> 'deleted')
    or (deleted_at is not null and account_state = 'deleted')
  ),
  constraint user_profiles_pending_deletion_state_check check (
    pending_deletion_at is null or account_state = 'pending_deletion'
  )
);

create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  founded text,
  stadium text,
  league text,
  logo_color text not null default '#0f172a',
  logo_url text,
  timezone text not null default 'Asia/Manila',
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  club_state public.club_state not null default 'active',
  pending_deletion_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clubs_deleted_state_check check (
    (deleted_at is null and club_state <> 'deleted')
    or (deleted_at is not null and club_state = 'deleted')
  ),
  constraint clubs_pending_deletion_state_check check (
    pending_deletion_at is null or club_state = 'pending_deletion'
  )
);

create trigger clubs_set_updated_at
before update on public.clubs
for each row execute function public.set_updated_at();

create table public.club_memberships (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.membership_role not null default 'owner',
  membership_state public.membership_state not null default 'active',
  invited_at timestamptz,
  accepted_at timestamptz,
  suspended_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint club_memberships_unique_user unique (club_id, user_id),
  constraint club_memberships_state_timestamp_check check (
    (membership_state = 'suspended' and suspended_at is not null)
    or (membership_state = 'removed' and removed_at is not null)
    or membership_state in ('active', 'invited')
  )
);

create trigger club_memberships_set_updated_at
before update on public.club_memberships
for each row execute function public.set_updated_at();

create table public.club_invitations (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  email text not null,
  email_lower text generated always as (lower(email)) stored,
  role public.membership_role not null,
  status public.club_invitation_status not null default 'pending',
  invited_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint club_invitations_email_check check (position('@' in email) > 1),
  constraint club_invitations_role_check check (role <> 'owner'),
  constraint club_invitations_status_timestamp_check check (
    (status = 'accepted' and accepted_by is not null and accepted_at is not null and revoked_at is null)
    or (status = 'revoked' and revoked_at is not null and accepted_at is null)
    or (status in ('pending', 'expired') and accepted_at is null and accepted_by is null and revoked_at is null)
  )
);

create trigger club_invitations_set_updated_at
before update on public.club_invitations
for each row execute function public.set_updated_at();

create table public.devices (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  app_version text,
  last_seen_at timestamptz,
  last_sync_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger devices_set_updated_at
before update on public.devices
for each row execute function public.set_updated_at();

create table public.workspace_imports (
  id uuid primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  source_backup_version text not null,
  manifest_hash text not null,
  record_counts jsonb not null default '{}'::jsonb,
  status public.workspace_import_status not null default 'started',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz,
  failure_code text,
  constraint workspace_imports_manifest_unique unique (club_id, manifest_hash)
);

create table public.sync_mutations (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  idempotency_key text not null,
  entity_table text not null,
  entity_id uuid,
  operation public.sync_mutation_operation not null,
  base_version bigint,
  result_version bigint,
  status public.sync_mutation_status not null,
  error_code text,
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  constraint sync_mutations_idempotency_unique unique (club_id, device_id, idempotency_key)
);

create table public.sync_changes (
  sequence_id bigserial primary key,
  club_id uuid not null references public.clubs(id) on delete cascade,
  entity_table text not null,
  entity_id uuid not null,
  operation public.sync_change_operation not null,
  record_version bigint not null,
  changed_by uuid references auth.users(id) on delete set null,
  origin_device_id uuid references public.devices(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,
  event_type public.audit_event_type not null,
  event_time timestamptz not null default now(),
  correlation_id uuid,
  metadata jsonb not null default '{}'::jsonb
);

create index clubs_owner_user_id_idx on public.clubs(owner_user_id);
create index club_memberships_user_state_idx on public.club_memberships(user_id, membership_state);
create index club_memberships_club_user_idx on public.club_memberships(club_id, user_id);
create unique index club_invitations_pending_email_idx
on public.club_invitations(club_id, email_lower)
where status = 'pending';
create index club_invitations_club_status_idx on public.club_invitations(club_id, status);
create index club_invitations_email_status_idx on public.club_invitations(email_lower, status);
create index devices_user_revoked_idx on public.devices(user_id, revoked_at);
create index workspace_imports_club_status_idx on public.workspace_imports(club_id, status);
create index sync_mutations_club_status_idx on public.sync_mutations(club_id, status);
create index sync_changes_club_sequence_idx on public.sync_changes(club_id, sequence_id);
create index audit_events_club_time_idx on public.audit_events(club_id, event_time);
create index audit_events_user_time_idx on public.audit_events(user_id, event_time);

create or replace function public.is_active_club_member(target_club_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.club_memberships m
    where m.club_id = target_club_id
      and m.user_id = target_user_id
      and m.membership_state = 'active'
  );
$$;

create or replace function public.user_owns_club(target_club_id uuid, target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clubs c
    where c.id = target_club_id
      and c.owner_user_id = target_user_id
      and c.club_state = 'active'
  );
$$;

create or replace function public.user_has_club_role(
  target_club_id uuid,
  allowed_roles public.membership_role[],
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.club_memberships m
    join public.clubs c on c.id = m.club_id
    where m.club_id = target_club_id
      and m.user_id = target_user_id
      and m.membership_state = 'active'
      and c.club_state = 'active'
      and m.role = any(allowed_roles)
  );
$$;

create or replace function public.user_can_manage_club_table(
  target_club_id uuid,
  target_table text,
  target_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.user_has_club_role(target_club_id, array['owner', 'admin']::public.membership_role[], target_user_id)
      then true
    when public.user_has_club_role(target_club_id, array['coach']::public.membership_role[], target_user_id)
      then target_table = any(array[
        'players',
        'games',
        'match_results',
        'match_scorer_contributions',
        'mvp_awards',
        'player_offenses',
        'standings_rows',
        'standings_snapshots',
        'bulletins',
        'assessment_sessions',
        'assessment_development_plan_weeks',
        'player_availability',
        'coach_notes',
        'weekly_training_schedules',
        'tactics_workspaces',
        'tactics_lineup_assignments',
        'tactics_draw_paths',
        'tactics_notes',
        'tactics_player_extras'
      ])
    when public.user_has_club_role(target_club_id, array['staff']::public.membership_role[], target_user_id)
      then target_table = any(array[
        'bulletins',
        'player_availability',
        'coach_notes',
        'weekly_training_schedules'
      ])
    else false
  end;
$$;

create or replace function public.auth_email_lower()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', current_setting('request.jwt.claim.email', true), ''));
$$;

create or replace function public.accept_club_invitation(target_invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid := auth.uid();
  accepted_time timestamptz := now();
  invitation public.club_invitations%rowtype;
  membership_id uuid;
begin
  if target_user_id is null then
    raise exception 'A signed-in user is required to accept invitations.' using errcode = '42501';
  end if;

  select *
  into invitation
  from public.club_invitations
  where id = target_invitation_id
  for update;

  if not found
    or invitation.status <> 'pending'
    or invitation.expires_at <= accepted_time
    or invitation.email_lower <> public.auth_email_lower()
  then
    raise exception 'Invitation is not available to this user.' using errcode = '42501';
  end if;

  update public.club_invitations
  set status = 'accepted',
      accepted_by = target_user_id,
      accepted_at = accepted_time
  where id = target_invitation_id;

  insert into public.club_memberships (
    club_id,
    user_id,
    role,
    membership_state,
    invited_at,
    accepted_at
  )
  values (
    invitation.club_id,
    target_user_id,
    invitation.role,
    'active',
    invitation.invited_at,
    accepted_time
  )
  returning id into membership_id;

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (
    invitation.club_id,
    target_user_id,
    'invitation_accepted',
    jsonb_build_object('role', invitation.role)
  );

  return membership_id;
end;
$$;

alter table public.user_profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.club_memberships enable row level security;
alter table public.club_invitations enable row level security;
alter table public.devices enable row level security;
alter table public.workspace_imports enable row level security;
alter table public.sync_mutations enable row level security;
alter table public.sync_changes enable row level security;
alter table public.audit_events enable row level security;

create policy "users can read their profile"
on public.user_profiles for select to authenticated
using (user_id = auth.uid());

create policy "users can create their profile"
on public.user_profiles for insert to authenticated
with check (user_id = auth.uid());

create policy "users can update their profile"
on public.user_profiles for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "members can read active clubs"
on public.clubs for select to authenticated
using (public.is_active_club_member(clubs.id));

create policy "users can create owned clubs"
on public.clubs for insert to authenticated
with check (owner_user_id = auth.uid());

create policy "owners can update their clubs"
on public.clubs for update to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy "users can read their memberships"
on public.club_memberships for select to authenticated
using (user_id = auth.uid());

create policy "members can read club memberships"
on public.club_memberships for select to authenticated
using (public.is_active_club_member(club_memberships.club_id));

create policy "owners can create their initial membership"
on public.club_memberships for insert to authenticated
with check (
  user_id = auth.uid()
  and role = 'owner'
  and membership_state = 'active'
  and public.user_owns_club(club_memberships.club_id)
);

create policy "owners and admins can create non-owner memberships"
on public.club_memberships for insert to authenticated
with check (
  role <> 'owner'
  and public.user_has_club_role(club_memberships.club_id, array['owner', 'admin']::public.membership_role[])
);

create policy "owners and admins can update non-owner memberships"
on public.club_memberships for update to authenticated
using (
  role <> 'owner'
  and public.user_has_club_role(club_memberships.club_id, array['owner', 'admin']::public.membership_role[])
)
with check (
  role <> 'owner'
  and public.user_has_club_role(club_memberships.club_id, array['owner', 'admin']::public.membership_role[])
);

create policy "owners and admins can read club invitations"
on public.club_invitations for select to authenticated
using (public.user_has_club_role(club_invitations.club_id, array['owner', 'admin']::public.membership_role[]));

create policy "invited users can read pending invitations"
on public.club_invitations for select to authenticated
using (
  status = 'pending'
  and expires_at > now()
  and email_lower = public.auth_email_lower()
);

create policy "owners and admins can create invitations"
on public.club_invitations for insert to authenticated
with check (
  role <> 'owner'
  and status = 'pending'
  and invited_by = auth.uid()
  and public.user_has_club_role(club_invitations.club_id, array['owner', 'admin']::public.membership_role[])
);

create policy "owners and admins can update invitations"
on public.club_invitations for update to authenticated
using (
  role <> 'owner'
  and public.user_has_club_role(club_invitations.club_id, array['owner', 'admin']::public.membership_role[])
)
with check (
  role <> 'owner'
  and public.user_has_club_role(club_invitations.club_id, array['owner', 'admin']::public.membership_role[])
);

create policy "users can read their devices"
on public.devices for select to authenticated
using (user_id = auth.uid());

create policy "users can register their devices"
on public.devices for insert to authenticated
with check (user_id = auth.uid());

create policy "users can update their devices"
on public.devices for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "members can read workspace imports"
on public.workspace_imports for select to authenticated
using (public.is_active_club_member(workspace_imports.club_id));

create policy "members can create workspace imports"
on public.workspace_imports for insert to authenticated
with check (
  user_id = auth.uid()
  and public.is_active_club_member(workspace_imports.club_id)
);

create policy "members can update workspace imports"
on public.workspace_imports for update to authenticated
using (
  user_id = auth.uid()
  and public.is_active_club_member(workspace_imports.club_id)
)
with check (
  user_id = auth.uid()
  and public.is_active_club_member(workspace_imports.club_id)
);

create policy "members can read sync mutations"
on public.sync_mutations for select to authenticated
using (
  user_id = auth.uid()
  and public.is_active_club_member(sync_mutations.club_id)
);

create policy "members can create sync mutations"
on public.sync_mutations for insert to authenticated
with check (
  user_id = auth.uid()
  and public.is_active_club_member(sync_mutations.club_id)
);

create policy "members can read sync changes"
on public.sync_changes for select to authenticated
using (public.is_active_club_member(sync_changes.club_id));

create policy "users can read their audit events"
on public.audit_events for select to authenticated
using (
  user_id = auth.uid()
  or public.user_has_club_role(audit_events.club_id, array['owner', 'admin']::public.membership_role[])
);

create policy "users can create their audit events"
on public.audit_events for insert to authenticated
with check (
  user_id = auth.uid()
  and (
    club_id is null
    or public.is_active_club_member(club_id)
  )
);

grant usage on schema public to authenticated;
grant execute on function public.is_active_club_member(uuid, uuid) to authenticated;
grant execute on function public.user_owns_club(uuid, uuid) to authenticated;
grant execute on function public.user_has_club_role(uuid, public.membership_role[], uuid) to authenticated;
grant execute on function public.user_can_manage_club_table(uuid, text, uuid) to authenticated;
grant execute on function public.auth_email_lower() to authenticated;
grant execute on function public.accept_club_invitation(uuid) to authenticated;
grant select, insert, update on public.user_profiles to authenticated;
grant select, insert, update on public.clubs to authenticated;
grant select, insert, update on public.club_memberships to authenticated;
grant select, insert, update on public.club_invitations to authenticated;
grant select, insert, update on public.devices to authenticated;
grant select, insert, update on public.workspace_imports to authenticated;
grant select, insert on public.sync_mutations to authenticated;
grant select on public.sync_changes to authenticated;
grant select, insert on public.audit_events to authenticated;
