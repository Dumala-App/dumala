begin;

create extension if not exists pgtap with schema extensions;

select plan(24);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('de000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'roster-owner-a@example.test', now(), now(), now()),
  ('de000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'roster-owner-b@example.test', now(), now(), now()),
  ('de000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'coach1@example.test', now(), now(), now()),
  ('de000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'other-coach@example.test', now(), now(), now()),
  ('de000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'submitcoach@example.test', now(), now(), now());

insert into public.user_profiles (user_id) values
  ('de000000-0000-4000-8000-000000000001'),
  ('de000000-0000-4000-8000-000000000002'),
  ('de000000-0000-4000-8000-000000000003'),
  ('de000000-0000-4000-8000-000000000004'),
  ('de000000-0000-4000-8000-000000000005');

select set_config('dumala.persona_change_authorized', 'on', false);
update public.user_profiles set persona = 'league'
where user_id in ('de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000002');
select set_config('dumala.persona_change_authorized', 'off', false);

insert into public.user_entitlements (user_id, entitlement) values
  ('de000000-0000-4000-8000-000000000001', 'league_pilot'),
  ('de000000-0000-4000-8000-000000000002', 'league_pilot');

insert into public.leagues (id, owner_user_id, name)
values
  ('de000000-0000-4000-8000-00000000000a', 'de000000-0000-4000-8000-000000000001', 'Roster League A'),
  ('de000000-0000-4000-8000-00000000000b', 'de000000-0000-4000-8000-000000000002', 'Roster League B');

insert into public.clubs (id, owner_user_id, name)
values
  ('de000000-0000-4000-8000-00000000000c', 'de000000-0000-4000-8000-000000000003', 'Rovers Coach Workspace'),
  ('de000000-0000-4000-8000-00000000000d', 'de000000-0000-4000-8000-000000000004', 'Other Coach Workspace'),
  ('de000000-0000-4000-8000-00000000000e', 'de000000-0000-4000-8000-000000000005', 'Submitted Coach Workspace');

insert into public.club_memberships (club_id, user_id, role, membership_state, accepted_at)
values
  ('de000000-0000-4000-8000-00000000000c', 'de000000-0000-4000-8000-000000000003', 'owner', 'active', now()),
  ('de000000-0000-4000-8000-00000000000d', 'de000000-0000-4000-8000-000000000004', 'owner', 'active', now()),
  ('de000000-0000-4000-8000-00000000000e', 'de000000-0000-4000-8000-000000000005', 'owner', 'active', now());

insert into public.league_seasons (
  id, league_id, name, status, roster_deadline, transfer_window_opens_on, transfer_window_closes_on
) values
  ('de000000-0000-4000-8000-000000000101', 'de000000-0000-4000-8000-00000000000a', 'Open Season', 'active', current_date + 10, current_date - 1, current_date + 10),
  ('de000000-0000-4000-8000-000000000102', 'de000000-0000-4000-8000-00000000000a', 'Closed Season', 'active', current_date - 1, current_date - 20, current_date - 10),
  ('de000000-0000-4000-8000-000000000103', 'de000000-0000-4000-8000-00000000000b', 'Other Season', 'active', current_date + 10, current_date - 1, current_date + 10);

insert into public.league_events (id, league_id, season_id, name, format, team_cap, registration_code, status)
values
  ('de000000-0000-4000-8000-000000000201', 'de000000-0000-4000-8000-00000000000a', 'de000000-0000-4000-8000-000000000101', 'Open Cup', 'round_robin', 4, 'OPENROSTER', 'registration_open'),
  ('de000000-0000-4000-8000-000000000202', 'de000000-0000-4000-8000-00000000000a', 'de000000-0000-4000-8000-000000000102', 'Closed Cup', 'round_robin', 4, 'CLOSEDROS', 'registration_open'),
  ('de000000-0000-4000-8000-000000000203', 'de000000-0000-4000-8000-00000000000b', 'de000000-0000-4000-8000-000000000103', 'Other Cup', 'round_robin', 4, 'OTHERROS', 'registration_open');

insert into public.event_registrations (
  id, event_id, league_id, club_name, team_name, contact_name, contact_email, status
) values
  ('de000000-0000-4000-8000-000000000301', 'de000000-0000-4000-8000-000000000201', 'de000000-0000-4000-8000-00000000000a', 'Rovers FC', 'Rovers U14', 'Coach One', 'coach1@example.test', 'submitted'),
  ('de000000-0000-4000-8000-000000000302', 'de000000-0000-4000-8000-000000000203', 'de000000-0000-4000-8000-00000000000b', 'Other FC', 'Other U14', 'Coach Two', 'coach2@example.test', 'submitted');

select lives_ok(
  $$ select public.submit_event_registration('OPENROSTER', 'Submit FC', 'Submit U14', 'U14', 'Submit Coach', 'submitcoach@example.test', 18, 'Ready after approval') $$,
  'a coach can submit the public event registration without an account'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'de000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"de000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

select lives_ok(
  $$ select public.review_event_registration('de000000-0000-4000-8000-000000000301', 'approved') $$,
  'approval succeeds'
);
select is(
  (select count(*)::int from public.event_teams where registration_id = 'de000000-0000-4000-8000-000000000301'),
  1,
  'approval creates one event team tied to the registration'
);
select is(
  (select name from public.event_teams where registration_id = 'de000000-0000-4000-8000-000000000301'),
  'Rovers U14',
  'the auto-created team uses the requested team name'
);
select lives_ok(
  $$ select public.review_event_registration('de000000-0000-4000-8000-000000000301', 'approved') $$,
  'approving the same registration again is idempotent for the team'
);
select is(
  (select count(*)::int from public.event_teams where registration_id = 'de000000-0000-4000-8000-000000000301'),
  1,
  'repeat approval does not duplicate the team'
);
select lives_ok(
  $$ select public.review_event_registration((select id from public.event_registrations where contact_email = 'submitcoach@example.test'), 'approved') $$,
  'the owner can approve a registration created through the public RPC'
);

select lives_ok(
  $$ select public.add_event_roster_player((select id from public.event_teams where registration_id = 'de000000-0000-4000-8000-000000000301'), 'Player One', (current_date - interval '12 years')::date, 9) $$,
  'an owner can add a roster player before the deadline'
);
select throws_ok(
  $$ select public.add_event_roster_player((select id from public.event_teams where registration_id = 'de000000-0000-4000-8000-000000000301'), 'Player One', null::date, null::integer) $$,
  '23505',
  null,
  'duplicate active player names on one team are blocked'
);

insert into public.event_teams (id, event_id, league_id, name)
values ('de000000-0000-4000-8000-000000000402', 'de000000-0000-4000-8000-000000000201', 'de000000-0000-4000-8000-00000000000a', 'Destination Team');

select lives_ok(
  $$ select public.transfer_event_roster_player((select id from public.event_roster_players where full_name = 'Player One'), 'de000000-0000-4000-8000-000000000402', 'Approved clearance') $$,
  'an owner can transfer an active player to another event team'
);
select is(
  (select transfer_from_team_id from public.event_roster_players where full_name = 'Player One'),
  (select id from public.event_teams where registration_id = 'de000000-0000-4000-8000-000000000301'),
  'the transfer records the source team'
);
select throws_ok(
  $$ select public.transfer_event_roster_player((select id from public.event_roster_players where full_name = 'Player One'), 'de000000-0000-4000-8000-000000000402', 'Same team') $$,
  '22023',
  null,
  'a player cannot be transferred to the current team'
);

select lives_ok(
  $$ select public.lock_event_team_roster((select id from public.event_teams where registration_id = 'de000000-0000-4000-8000-000000000301')) $$,
  'an owner can lock a team roster'
);
select throws_ok(
  $$ select public.add_event_roster_player((select id from public.event_teams where registration_id = 'de000000-0000-4000-8000-000000000301'), 'Player Two', null::date, null::integer) $$,
  '22023',
  null,
  'a locked roster cannot add players'
);
select lives_ok(
  $$ select public.mark_event_roster_player_status((select id from public.event_roster_players where full_name = 'Player One'), 'transferred', 'Moved clubs') $$,
  'a player status can change inside the transfer window'
);

insert into public.event_teams (id, event_id, league_id, name)
values ('de000000-0000-4000-8000-000000000401', 'de000000-0000-4000-8000-000000000202', 'de000000-0000-4000-8000-00000000000a', 'Closed Team');

select throws_ok(
  $$ select public.add_event_roster_player('de000000-0000-4000-8000-000000000401', 'Late Player', null::date, null::integer) $$,
  '22023',
  null,
  'the season roster deadline blocks new players'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'de000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"de000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);

select is(
  (select count(*)::int from public.event_roster_players),
  0,
  'another owner cannot read roster players they do not own'
);
select throws_ok(
  $$ select public.add_event_roster_player((select id from public.event_teams where registration_id = 'de000000-0000-4000-8000-000000000301'), 'Sneaky Player', null::date, null::integer) $$,
  'P0002',
  null,
  'another owner cannot mutate a hidden team through the roster RPC'
);
select throws_ok(
  $$ select public.review_event_registration('de000000-0000-4000-8000-000000000301', 'approved') $$,
  '42501',
  null,
  'another owner cannot approve a registration into a team'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'de000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"de000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal1"}', true);

select is(
  public.claim_approved_event_team('de000000-0000-4000-8000-000000000301')->>'status',
  'linked',
  'the approved applicant can claim the event team after creating a Coach workspace'
);
select is(
  public.claim_approved_event_team('de000000-0000-4000-8000-000000000301')->>'clubId',
  'de000000-0000-4000-8000-00000000000c',
  'the approved event team link payload points to the applicant coach workspace'
);
select is(
  public.claim_approved_event_team('de000000-0000-4000-8000-000000000301')->>'clubId',
  'de000000-0000-4000-8000-00000000000c',
  'claiming again is idempotent for the same coach workspace'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'de000000-0000-4000-8000-000000000005', true);
select set_config('request.jwt.claims', '{"sub":"de000000-0000-4000-8000-000000000005","role":"authenticated","aal":"aal1"}', true);

select is(
  public.claim_approved_event_team((select id from public.event_registrations where contact_email = 'submitcoach@example.test'))->>'clubId',
  'de000000-0000-4000-8000-00000000000e',
  'a newly submitted, approved application links to the applicant coach workspace'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'de000000-0000-4000-8000-000000000004', true);
select set_config('request.jwt.claims', '{"sub":"de000000-0000-4000-8000-000000000004","role":"authenticated","aal":"aal1"}', true);

select throws_ok(
  $$ select public.claim_approved_event_team('de000000-0000-4000-8000-000000000301') $$,
  '42501',
  null,
  'a different signed-in email cannot claim the approved event team'
);

select finish();
rollback;
