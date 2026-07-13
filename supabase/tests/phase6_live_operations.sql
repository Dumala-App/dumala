begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

-- Actors -----------------------------------------------------------------------
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('fb000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'lo-owner-a@example.test', now(), now(), now()),
  ('fb000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'lo-owner-b@example.test', now(), now(), now());

insert into public.user_profiles (user_id) values
  ('fb000000-0000-4000-8000-000000000001'),
  ('fb000000-0000-4000-8000-000000000002');

select set_config('dumala.persona_change_authorized', 'on', false);
update public.user_profiles set persona = 'league'
where user_id in ('fb000000-0000-4000-8000-000000000001', 'fb000000-0000-4000-8000-000000000002');
select set_config('dumala.persona_change_authorized', 'off', false);

insert into public.user_entitlements (user_id, entitlement) values
  ('fb000000-0000-4000-8000-000000000001', 'league_pilot'),
  ('fb000000-0000-4000-8000-000000000002', 'league_pilot');

-- Owner A's league, event, two teams and one fixture.
insert into public.leagues (id, owner_user_id, name)
values ('fb000000-0000-4000-8000-00000000000a', 'fb000000-0000-4000-8000-000000000001', 'Alpha League');
insert into public.league_seasons (id, league_id, name, status)
values ('fb000000-0000-4000-8000-000000000101', 'fb000000-0000-4000-8000-00000000000a', 'Season 2026', 'active');
insert into public.league_events (id, league_id, season_id, name, registration_code, status)
values ('fb000000-0000-4000-8000-000000000201', 'fb000000-0000-4000-8000-00000000000a', 'fb000000-0000-4000-8000-000000000101', 'Alpha Cup', 'ALPHACP10', 'active');
insert into public.event_teams (id, event_id, league_id, name) values
  ('fb000000-0000-4000-8000-000000000301', 'fb000000-0000-4000-8000-000000000201', 'fb000000-0000-4000-8000-00000000000a', 'Alpha'),
  ('fb000000-0000-4000-8000-000000000302', 'fb000000-0000-4000-8000-000000000201', 'fb000000-0000-4000-8000-00000000000a', 'Bravo');
insert into public.event_fixtures (id, event_id, league_id, home_team_id, away_team_id) values
  ('fb000000-0000-4000-8000-000000000401', 'fb000000-0000-4000-8000-000000000201', 'fb000000-0000-4000-8000-00000000000a',
   'fb000000-0000-4000-8000-000000000301', 'fb000000-0000-4000-8000-000000000302');

-- === Owner A ==================================================================
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'fb000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"fb000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

select lives_ok(
  $$ update public.event_fixtures set home_checked_in = true, official_name = 'Ref Diaz' where id = 'fb000000-0000-4000-8000-000000000401' $$,
  'a League owner can check a team in and assign an official'
);
select is(
  (select home_checked_in from public.event_fixtures where id = 'fb000000-0000-4000-8000-000000000401'),
  true,
  'the check-in is persisted'
);
select lives_ok(
  $$ insert into public.event_incidents (event_id, league_id, fixture_id, kind, summary) values ('fb000000-0000-4000-8000-000000000201', 'fb000000-0000-4000-8000-00000000000a', 'fb000000-0000-4000-8000-000000000401', 'injury', 'Player taken off after a knock') $$,
  'a League owner can log an incident under RLS'
);
select is((select count(*)::int from public.event_incidents), 1, 'a League owner reads their own incidents');

-- === Owner B is isolated ======================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'fb000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"fb000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);

select is((select count(*)::int from public.event_incidents), 0, 'another owner cannot read incidents they do not own');
select is((select count(*)::int from public.event_fixtures), 0, 'another owner cannot see fixtures they do not own');
select throws_ok(
  $$ insert into public.event_incidents (event_id, league_id, kind, summary) values ('fb000000-0000-4000-8000-000000000201', 'fb000000-0000-4000-8000-00000000000a', 'dispute', 'Sneaky') $$,
  '42501',
  null,
  'a non-owner cannot log an incident on another league event'
);
-- A non-owner's UPDATE is filtered to zero rows by RLS (a silent no-op).
update public.event_fixtures set away_checked_in = true where id = 'fb000000-0000-4000-8000-000000000401';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'fb000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"fb000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);
select is(
  (select away_checked_in from public.event_fixtures where id = 'fb000000-0000-4000-8000-000000000401'),
  false,
  'a non-owner cannot flip a check-in on another owner''s fixture'
);

select finish();
rollback;
