-- Link an approved public event registration to the applicant's Coach workspace.
-- Public applications remain no-account; this claim runs later after sign-in.

alter table public.event_teams
  add column if not exists club_id uuid references public.clubs(id) on delete set null;

create index if not exists event_teams_club_idx
on public.event_teams(club_id)
where club_id is not null;

create policy "linked coaches read claimed event teams"
on public.event_teams for select to authenticated
using (
  club_id is not null
  and public.user_has_club_role(club_id, array['owner', 'admin', 'coach']::public.membership_role[])
);

create or replace function public.claim_approved_event_team(registration_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  reg public.event_registrations%rowtype;
  team public.event_teams%rowtype;
  coach_club public.clubs%rowtype;
  current_email text;
  team_name text;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select lower(email) into current_email from auth.users where id = auth.uid();
  if current_email is null then
    raise exception 'AUTH_EMAIL_REQUIRED' using errcode = '42501';
  end if;

  select * into reg from public.event_registrations where id = $1;
  if not found then
    raise exception 'REGISTRATION_NOT_FOUND' using errcode = 'P0002';
  end if;

  if lower(reg.contact_email) <> current_email then
    raise exception 'CONTACT_EMAIL_MISMATCH' using errcode = '42501';
  end if;

  if reg.status <> 'approved' then
    return jsonb_build_object('status', 'pending', 'registrationId', reg.id);
  end if;

  select c.* into coach_club
  from public.club_memberships m
  join public.clubs c on c.id = m.club_id
  where m.user_id = auth.uid()
    and m.membership_state = 'active'
    and c.club_state = 'active'
  order by case when m.role = 'owner' then 0 else 1 end, m.created_at
  limit 1;

  if coach_club.id is null then
    raise exception 'COACH_WORKSPACE_REQUIRED' using errcode = '42501';
  end if;

  team_name := coalesce(nullif(btrim(reg.team_name), ''), btrim(reg.club_name));

  select * into team
  from public.event_teams t
  where t.event_id = reg.event_id and t.registration_id = reg.id;

  if team.id is null then
    insert into public.event_teams (event_id, league_id, registration_id, club_id, name)
    values (reg.event_id, reg.league_id, reg.id, coach_club.id, team_name)
    returning * into team;
  elsif team.club_id is not null and team.club_id <> coach_club.id then
    raise exception 'TEAM_ALREADY_LINKED' using errcode = '23505';
  else
    update public.event_teams
    set club_id = coach_club.id,
        name = team_name
    where id = team.id
    returning * into team;
  end if;

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (coach_club.id, auth.uid(), 'record_updated',
    jsonb_build_object('action', 'approved_event_team_claimed', 'registrationId', reg.id, 'teamId', team.id, 'leagueId', reg.league_id, 'eventId', reg.event_id));

  return jsonb_build_object(
    'status', 'linked',
    'registrationId', reg.id,
    'teamId', team.id,
    'clubId', coach_club.id,
    'teamName', team.name,
    'eventId', team.event_id,
    'leagueId', team.league_id
  );
end;
$$;

grant execute on function public.claim_approved_event_team(uuid) to authenticated;
