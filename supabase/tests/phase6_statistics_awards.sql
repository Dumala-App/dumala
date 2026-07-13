begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

-- Actors -----------------------------------------------------------------------
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('df000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'sa-owner-a@example.test', now(), now(), now()),
  ('df000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'sa-owner-b@example.test', now(), now(), now());

insert into public.user_profiles (user_id) values
  ('df000000-0000-4000-8000-000000000001'),
  ('df000000-0000-4000-8000-000000000002');

select set_config('dumala.persona_change_authorized', 'on', false);
update public.user_profiles set persona = 'league'
where user_id in ('df000000-0000-4000-8000-000000000001', 'df000000-0000-4000-8000-000000000002');
select set_config('dumala.persona_change_authorized', 'off', false);

insert into public.user_entitlements (user_id, entitlement) values
  ('df000000-0000-4000-8000-000000000001', 'league_pilot'),
  ('df000000-0000-4000-8000-000000000002', 'league_pilot');

-- Owner A's league, event, two teams, a fixture, one stat event and one award.
insert into public.leagues (id, owner_user_id, name)
values ('df000000-0000-4000-8000-00000000000a', 'df000000-0000-4000-8000-000000000001', 'Alpha League');
insert into public.league_seasons (id, league_id, name, status)
values ('df000000-0000-4000-8000-000000000101', 'df000000-0000-4000-8000-00000000000a', 'Season 2026', 'active');
insert into public.league_events (id, league_id, season_id, name, registration_code, status)
values ('df000000-0000-4000-8000-000000000201', 'df000000-0000-4000-8000-00000000000a', 'df000000-0000-4000-8000-000000000101', 'Alpha Cup', 'ALPHACUP8', 'active');
insert into public.event_teams (id, event_id, league_id, name) values
  ('df000000-0000-4000-8000-000000000301', 'df000000-0000-4000-8000-000000000201', 'df000000-0000-4000-8000-00000000000a', 'Alpha'),
  ('df000000-0000-4000-8000-000000000302', 'df000000-0000-4000-8000-000000000201', 'df000000-0000-4000-8000-00000000000a', 'Bravo');
insert into public.event_fixtures (id, event_id, league_id, home_team_id, away_team_id) values
  ('df000000-0000-4000-8000-000000000401', 'df000000-0000-4000-8000-000000000201', 'df000000-0000-4000-8000-00000000000a',
   'df000000-0000-4000-8000-000000000301', 'df000000-0000-4000-8000-000000000302');
insert into public.fixture_stat_events (id, fixture_id, event_id, league_id, team_id, player_name, stat_type) values
  ('df000000-0000-4000-8000-000000000501', 'df000000-0000-4000-8000-000000000401', 'df000000-0000-4000-8000-000000000201',
   'df000000-0000-4000-8000-00000000000a', 'df000000-0000-4000-8000-000000000301', 'Cruz', 'goal');
insert into public.event_awards (id, event_id, league_id, title, recipient_type, team_id) values
  ('df000000-0000-4000-8000-000000000601', 'df000000-0000-4000-8000-000000000201', 'df000000-0000-4000-8000-00000000000a',
   'Champions', 'team', 'df000000-0000-4000-8000-000000000301');

-- === Owner A ==================================================================
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'df000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"df000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

select is((select count(*)::int from public.fixture_stat_events), 1, 'a League owner reads their own stat events');
select is((select count(*)::int from public.event_awards), 1, 'a League owner reads their own awards');
select lives_ok(
  $$ insert into public.fixture_stat_events (fixture_id, event_id, league_id, team_id, player_name, stat_type, minute) values ('df000000-0000-4000-8000-000000000401', 'df000000-0000-4000-8000-000000000201', 'df000000-0000-4000-8000-00000000000a', 'df000000-0000-4000-8000-000000000302', 'Reyes', 'goal', 55) $$,
  'a League owner can record a stat event under RLS'
);
select lives_ok(
  $$ insert into public.event_awards (event_id, league_id, title, recipient_type, player_name) values ('df000000-0000-4000-8000-000000000201', 'df000000-0000-4000-8000-00000000000a', 'Golden Boot', 'player', 'Cruz') $$,
  'a League owner can assign a player award'
);
select throws_ok(
  $$ insert into public.event_awards (event_id, league_id, title, recipient_type) values ('df000000-0000-4000-8000-000000000201', 'df000000-0000-4000-8000-00000000000a', 'Best Team', 'team') $$,
  '23514',
  null,
  'a team award must name a team'
);
select throws_ok(
  $$ insert into public.event_awards (event_id, league_id, title, recipient_type) values ('df000000-0000-4000-8000-000000000201', 'df000000-0000-4000-8000-00000000000a', 'MVP', 'player') $$,
  '23514',
  null,
  'a player award must name a player'
);
select throws_ok(
  $$ insert into public.fixture_stat_events (fixture_id, event_id, league_id, team_id, player_name, stat_type, minute) values ('df000000-0000-4000-8000-000000000401', 'df000000-0000-4000-8000-000000000201', 'df000000-0000-4000-8000-00000000000a', 'df000000-0000-4000-8000-000000000301', 'Cruz', 'goal', 300) $$,
  '23514',
  null,
  'a stat minute out of range is rejected'
);

-- === Owner B is isolated ======================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'df000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"df000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);

select is((select count(*)::int from public.fixture_stat_events), 0, 'another owner cannot read stat events they do not own');
select is((select count(*)::int from public.event_awards), 0, 'another owner cannot read awards they do not own');
select throws_ok(
  $$ insert into public.fixture_stat_events (fixture_id, event_id, league_id, team_id, player_name, stat_type) values ('df000000-0000-4000-8000-000000000401', 'df000000-0000-4000-8000-000000000201', 'df000000-0000-4000-8000-00000000000a', 'df000000-0000-4000-8000-000000000301', 'Intruder', 'goal') $$,
  '42501',
  null,
  'a non-owner cannot record a stat event on another league event'
);
select throws_ok(
  $$ insert into public.event_awards (event_id, league_id, title, recipient_type, team_id) values ('df000000-0000-4000-8000-000000000201', 'df000000-0000-4000-8000-00000000000a', 'Sneaky', 'team', 'df000000-0000-4000-8000-000000000301') $$,
  '42501',
  null,
  'a non-owner cannot assign an award to another league event'
);

select finish();
rollback;
