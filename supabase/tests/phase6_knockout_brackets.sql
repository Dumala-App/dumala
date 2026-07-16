begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

-- Actors -----------------------------------------------------------------------
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('dc000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'ko-owner-a@example.test', now(), now(), now()),
  ('dc000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'ko-owner-b@example.test', now(), now(), now());

insert into public.user_profiles (user_id) values
  ('dc000000-0000-4000-8000-000000000001'),
  ('dc000000-0000-4000-8000-000000000002');

select set_config('dumala.persona_change_authorized', 'on', false);
update public.user_profiles set persona = 'league'
where user_id in ('dc000000-0000-4000-8000-000000000001', 'dc000000-0000-4000-8000-000000000002');
select set_config('dumala.persona_change_authorized', 'off', false);

insert into public.user_entitlements (user_id, entitlement) values
  ('dc000000-0000-4000-8000-000000000001', 'league_pilot'),
  ('dc000000-0000-4000-8000-000000000002', 'league_pilot');

-- Owner A's league, season, single-elimination event, four teams, and a 4-team
-- bracket: two semis (round 1) feeding one final (round 2, empty slots).
insert into public.leagues (id, owner_user_id, name)
values ('dc000000-0000-4000-8000-00000000000a', 'dc000000-0000-4000-8000-000000000001', 'Alpha League');
insert into public.league_seasons (id, league_id, name, status)
values ('dc000000-0000-4000-8000-000000000101', 'dc000000-0000-4000-8000-00000000000a', 'Season 2026', 'active');
insert into public.league_events (id, league_id, season_id, name, format, status)
values ('dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'dc000000-0000-4000-8000-000000000101', 'Alpha Cup', 'single_elimination', 'active');
insert into public.event_teams (id, event_id, league_id, name) values
  ('dc000000-0000-4000-8000-000000000401', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'Alpha'),
  ('dc000000-0000-4000-8000-000000000402', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'Bravo'),
  ('dc000000-0000-4000-8000-000000000403', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'Charlie'),
  ('dc000000-0000-4000-8000-000000000404', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'Delta');
insert into public.event_fixtures (id, event_id, league_id, round, sequence, home_team_id, away_team_id) values
  ('dc000000-0000-4000-8000-000000000501', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 1, 1, 'dc000000-0000-4000-8000-000000000401', 'dc000000-0000-4000-8000-000000000402'),
  ('dc000000-0000-4000-8000-000000000502', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 1, 2, 'dc000000-0000-4000-8000-000000000403', 'dc000000-0000-4000-8000-000000000404');
-- The final: both slots empty (a future round). This exercises the nullable slots.
insert into public.event_fixtures (id, event_id, league_id, round, sequence, home_team_id, away_team_id) values
  ('dc000000-0000-4000-8000-000000000503', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 2, 1, null, null);

-- === Owner A =================================================================
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'dc000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"dc000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

select is(
  (select count(*)::int from public.event_fixtures where event_id = 'dc000000-0000-4000-8000-000000000201'),
  3,
  'a bracket with empty future-round slots persists (team ids are nullable)'
);
select is(
  (select count(*)::int from public.event_fixtures where round = 2 and home_team_id is null and away_team_id is null),
  1,
  'the final starts with both slots empty'
);

-- Nothing to advance until the semis are played.
select is(public.sync_bracket('dc000000-0000-4000-8000-000000000201'), 0, 'sync advances nothing before any semi is decided');

-- Play semi 1 (Alpha beats Bravo) and semi 2 (Delta beats Charlie).
select lives_ok(
  $$ select public.record_fixture_result('dc000000-0000-4000-8000-000000000501', 2, 0) $$,
  'owner records the first semi-final result'
);
select lives_ok(
  $$ select public.record_fixture_result('dc000000-0000-4000-8000-000000000502', 1, 3) $$,
  'owner records the second semi-final result'
);

select is(public.sync_bracket('dc000000-0000-4000-8000-000000000201'), 1, 'sync fills the final once both semis are decided');
select is(
  (select home_team_id from public.event_fixtures where id = 'dc000000-0000-4000-8000-000000000503'),
  'dc000000-0000-4000-8000-000000000401'::uuid,
  'the home semi winner (Alpha) advances into the final home slot'
);
select is(
  (select away_team_id from public.event_fixtures where id = 'dc000000-0000-4000-8000-000000000503'),
  'dc000000-0000-4000-8000-000000000404'::uuid,
  'the away semi winner (Delta) advances into the final away slot'
);

-- === Non-owner cannot advance another league's bracket ========================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'dc000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"dc000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);

select throws_ok(
  $$ select public.sync_bracket('dc000000-0000-4000-8000-000000000201') $$,
  '42501',
  null,
  'a non-owner cannot sync another owner''s bracket'
);

select finish();
rollback;
