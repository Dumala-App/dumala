begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

-- Actors -----------------------------------------------------------------------
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('de000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'te-owner-a@example.test', now(), now(), now()),
  ('de000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'te-owner-b@example.test', now(), now(), now());

insert into public.user_profiles (user_id) values
  ('de000000-0000-4000-8000-000000000001'),
  ('de000000-0000-4000-8000-000000000002');

select set_config('dumala.persona_change_authorized', 'on', false);
update public.user_profiles set persona = 'league'
where user_id in ('de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-000000000002');
select set_config('dumala.persona_change_authorized', 'off', false);

insert into public.user_entitlements (user_id, entitlement) values
  ('de000000-0000-4000-8000-000000000001', 'league_pilot'),
  ('de000000-0000-4000-8000-000000000002', 'league_pilot');

-- Owner A's league, season, event, three teams, and one scheduled fixture.
insert into public.leagues (id, owner_user_id, name)
values ('de000000-0000-4000-8000-00000000000a', 'de000000-0000-4000-8000-000000000001', 'Alpha League');
insert into public.league_seasons (id, league_id, name, status)
values ('de000000-0000-4000-8000-000000000101', 'de000000-0000-4000-8000-00000000000a', 'Season 2026', 'active');
insert into public.league_events (id, league_id, season_id, name, registration_code, status)
values ('de000000-0000-4000-8000-000000000201', 'de000000-0000-4000-8000-00000000000a', 'de000000-0000-4000-8000-000000000101', 'Alpha Cup', 'ALPHACUP7', 'active');
insert into public.event_teams (id, event_id, league_id, name) values
  ('de000000-0000-4000-8000-000000000301', 'de000000-0000-4000-8000-000000000201', 'de000000-0000-4000-8000-00000000000a', 'Alpha'),
  ('de000000-0000-4000-8000-000000000302', 'de000000-0000-4000-8000-000000000201', 'de000000-0000-4000-8000-00000000000a', 'Bravo'),
  ('de000000-0000-4000-8000-000000000303', 'de000000-0000-4000-8000-000000000201', 'de000000-0000-4000-8000-00000000000a', 'Charlie');
insert into public.event_fixtures (id, event_id, league_id, round, home_team_id, away_team_id) values
  ('de000000-0000-4000-8000-000000000401', 'de000000-0000-4000-8000-000000000201', 'de000000-0000-4000-8000-00000000000a', 1,
   'de000000-0000-4000-8000-000000000301', 'de000000-0000-4000-8000-000000000302');

-- === Owner A ==================================================================
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'de000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"de000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

select is((select count(*)::int from public.event_teams), 3, 'a League owner reads their own event teams');
select lives_ok(
  $$ insert into public.event_teams (event_id, league_id, name) values ('de000000-0000-4000-8000-000000000201', 'de000000-0000-4000-8000-00000000000a', 'Delta') $$,
  'a League owner can add an event team under RLS'
);
select lives_ok(
  $$ insert into public.event_fixtures (event_id, league_id, round, home_team_id, away_team_id) values ('de000000-0000-4000-8000-000000000201', 'de000000-0000-4000-8000-00000000000a', 1, 'de000000-0000-4000-8000-000000000302', 'de000000-0000-4000-8000-000000000303') $$,
  'a League owner can add a fixture under RLS'
);
select throws_ok(
  $$ insert into public.event_fixtures (event_id, league_id, home_team_id, away_team_id) values ('de000000-0000-4000-8000-000000000201', 'de000000-0000-4000-8000-00000000000a', 'de000000-0000-4000-8000-000000000301', 'de000000-0000-4000-8000-000000000301') $$,
  '23514',
  null,
  'a fixture cannot pit a team against itself'
);

select is(
  (public.record_fixture_result('de000000-0000-4000-8000-000000000401', 2, 1)).status::text,
  'completed',
  'recording a result marks the fixture completed'
);
select is(
  (select home_score from public.event_fixtures where id = 'de000000-0000-4000-8000-000000000401'),
  2,
  'the recorded home score is persisted'
);
select throws_ok(
  $$ select public.record_fixture_result('de000000-0000-4000-8000-000000000401', 2, -1) $$,
  '22023',
  null,
  'a negative score is rejected'
);
select throws_ok(
  $$ select public.record_fixture_result('de000000-0000-4000-8000-0000000004ff', 1, 0) $$,
  'P0002',
  null,
  'recording a result for a missing fixture is rejected'
);

-- === Owner B is isolated ======================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'de000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"de000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);

select is((select count(*)::int from public.event_teams), 0, 'another owner cannot read teams they do not own');
select is((select count(*)::int from public.event_fixtures), 0, 'another owner cannot read fixtures they do not own');
select throws_ok(
  $$ insert into public.event_teams (event_id, league_id, name) values ('de000000-0000-4000-8000-000000000201', 'de000000-0000-4000-8000-00000000000a', 'Intruder') $$,
  '42501',
  null,
  'a non-owner cannot add a team to another league event'
);
select throws_ok(
  $$ select public.record_fixture_result('de000000-0000-4000-8000-000000000401', 3, 0) $$,
  '42501',
  null,
  'a non-owner cannot record a result on another owner''s fixture'
);

select finish();
rollback;
