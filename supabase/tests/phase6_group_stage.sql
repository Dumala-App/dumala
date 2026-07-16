begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

-- Actors -----------------------------------------------------------------------
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('dc000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'gs-owner-a@example.test', now(), now(), now()),
  ('dc000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'gs-owner-b@example.test', now(), now(), now());

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

insert into public.leagues (id, owner_user_id, name)
values ('dc000000-0000-4000-8000-00000000000a', 'dc000000-0000-4000-8000-000000000001', 'Alpha League');
insert into public.league_seasons (id, league_id, name, status)
values ('dc000000-0000-4000-8000-000000000101', 'dc000000-0000-4000-8000-00000000000a', 'Season 2026', 'active');
insert into public.league_events (id, league_id, season_id, name, format, status)
values ('dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'dc000000-0000-4000-8000-000000000101', 'Alpha Cup', 'group_knockout', 'active');
insert into public.event_teams (id, event_id, league_id, name) values
  ('dc000000-0000-4000-8000-000000000401', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'Alpha'),
  ('dc000000-0000-4000-8000-000000000402', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'Bravo'),
  ('dc000000-0000-4000-8000-000000000403', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'Charlie'),
  ('dc000000-0000-4000-8000-000000000404', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'Delta');

-- A group-stage fixture (round 1) and a knockout fixture that deliberately reuses
-- round 1/sequence 1 to prove sync_bracket keeps the two stages apart. The final
-- (knockout round 2) is fed by the knockout round-1 fixture, not the group one.
insert into public.event_fixtures (id, event_id, league_id, stage, group_label, round, sequence, home_team_id, away_team_id, status, home_score, away_score) values
  ('dc000000-0000-4000-8000-000000000501', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'group', 'A', 1, 1, 'dc000000-0000-4000-8000-000000000401', 'dc000000-0000-4000-8000-000000000402', 'completed', 5, 0),
  ('dc000000-0000-4000-8000-000000000601', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'knockout', null, 1, 1, 'dc000000-0000-4000-8000-000000000403', 'dc000000-0000-4000-8000-000000000404', 'completed', 1, 2),
  ('dc000000-0000-4000-8000-000000000602', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'knockout', null, 2, 1, null, null, 'scheduled', null, null);

-- === Owner A =================================================================
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'dc000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"dc000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

select is(
  (select stage from public.event_fixtures where id = 'dc000000-0000-4000-8000-000000000501'),
  'group',
  'a group-stage fixture stores its stage'
);
select is(
  (select group_label from public.event_fixtures where id = 'dc000000-0000-4000-8000-000000000501'),
  'A',
  'a group-stage fixture stores its group label'
);

-- sync advances the knockout final from the knockout semi (Delta won 2-1),
-- ignoring the group fixture that shares round 1 / sequence 1.
select is(public.sync_bracket('dc000000-0000-4000-8000-000000000201'), 1, 'sync advances exactly one knockout slot');
select is(
  (select home_team_id from public.event_fixtures where id = 'dc000000-0000-4000-8000-000000000602'),
  'dc000000-0000-4000-8000-000000000404'::uuid,
  'the knockout semi winner (Delta) advances, not the group winner (Alpha)'
);
select is(
  (select away_team_id from public.event_fixtures where id = 'dc000000-0000-4000-8000-000000000602'),
  null,
  'the final away slot stays empty (its knockout feeder does not exist yet)'
);

-- === Non-owner cannot advance =================================================
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
