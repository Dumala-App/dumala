begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

-- Actors + data ----------------------------------------------------------------
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('dc000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'pub-owner@example.test', now(), now(), now()),
  ('dc000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'pub-attacker@example.test', now(), now(), now());
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
values
  ('dc000000-0000-4000-8000-00000000000a', 'dc000000-0000-4000-8000-000000000001', 'Alpha League'),
  ('dc000000-0000-4000-8000-00000000000b', 'dc000000-0000-4000-8000-000000000002', 'Bravo League');
insert into public.league_seasons (id, league_id, name, status)
values
  ('dc000000-0000-4000-8000-000000000101', 'dc000000-0000-4000-8000-00000000000a', 'Season 2026', 'active'),
  ('dc000000-0000-4000-8000-000000000102', 'dc000000-0000-4000-8000-00000000000b', 'Season 2026', 'active');
-- One published victim event, one private victim event, and an attacker-owned event.
insert into public.league_events (id, league_id, season_id, name, registration_code, status, is_public)
values
  ('dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'dc000000-0000-4000-8000-000000000101', 'Open Cup', 'PUBLICCUP', 'active', true),
  ('dc000000-0000-4000-8000-000000000202', 'dc000000-0000-4000-8000-00000000000a', 'dc000000-0000-4000-8000-000000000101', 'Secret Cup', 'SECRETCUP', 'active', false),
  ('dc000000-0000-4000-8000-000000000203', 'dc000000-0000-4000-8000-00000000000b', 'dc000000-0000-4000-8000-000000000102', 'Attack Cup', 'ATTACKCUP', 'active', false);
insert into public.event_teams (id, event_id, league_id, name) values
  ('dc000000-0000-4000-8000-000000000401', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'Alpha'),
  ('dc000000-0000-4000-8000-000000000402', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'Bravo'),
  ('dc000000-0000-4000-8000-000000000403', 'dc000000-0000-4000-8000-000000000203', 'dc000000-0000-4000-8000-00000000000b', 'Attacker A'),
  ('dc000000-0000-4000-8000-000000000404', 'dc000000-0000-4000-8000-000000000203', 'dc000000-0000-4000-8000-00000000000b', 'Attacker B');
insert into public.event_fixtures (
  id, event_id, league_id, round, sequence, home_team_id, away_team_id, status,
  home_score, away_score, home_checked_in, official_name, stage, group_label
) values
  (
    'dc000000-0000-4000-8000-000000000501', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a',
    1, 1, 'dc000000-0000-4000-8000-000000000401', 'dc000000-0000-4000-8000-000000000402', 'completed',
    2, 1, true, 'Ref Private', 'group', 'A'
  ),
  (
    'dc000000-0000-4000-8000-000000000502', 'dc000000-0000-4000-8000-000000000203', 'dc000000-0000-4000-8000-00000000000b',
    1, 1, 'dc000000-0000-4000-8000-000000000403', 'dc000000-0000-4000-8000-000000000404', 'completed',
    1, 0, false, null, 'group', 'B'
  );
insert into public.fixture_stat_events (id, fixture_id, event_id, league_id, team_id, player_name, stat_type, minute, note)
values
  (
    'dc000000-0000-4000-8000-000000000601', 'dc000000-0000-4000-8000-000000000501',
    'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a',
    'dc000000-0000-4000-8000-000000000401', 'Public Scorer', 'goal', 12, 'Private note'
  ),
  (
    'dc000000-0000-4000-8000-000000000602', 'dc000000-0000-4000-8000-000000000502',
    'dc000000-0000-4000-8000-000000000203', 'dc000000-0000-4000-8000-00000000000b',
    'dc000000-0000-4000-8000-000000000403', 'Attacker Scorer', 'goal', 20, null
  );

-- Bypass-seed poison rows to prove the public RPC also filters by league_id.
-- Normal application writes cannot do this; the assertions below cover that.
set local session_replication_role = replica;
insert into public.event_teams (id, event_id, league_id, name)
values ('dc000000-0000-4000-8000-000000000499', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000b', 'Poison Team');
insert into public.event_fixtures (
  id, event_id, league_id, round, sequence, home_team_id, away_team_id, status,
  home_score, away_score, home_checked_in, official_name, stage, group_label
) values (
  'dc000000-0000-4000-8000-000000000599', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000b',
  1, 2, 'dc000000-0000-4000-8000-000000000403', 'dc000000-0000-4000-8000-000000000404', 'completed',
  99, 0, true, 'Poison Ref', 'group', 'X'
);
insert into public.fixture_stat_events (id, fixture_id, event_id, league_id, team_id, player_name, stat_type, minute, note)
values (
  'dc000000-0000-4000-8000-000000000699', 'dc000000-0000-4000-8000-000000000599',
  'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000b',
  'dc000000-0000-4000-8000-000000000403', 'Poison Scorer', 'goal', 1, 'Poison note'
);
set local session_replication_role = origin;

-- === Attacker owner ==========================================================
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'dc000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"dc000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);

select throws_ok(
  $$ insert into public.event_teams (event_id, league_id, name) values ('dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000b', 'Blocked Team') $$,
  '23503',
  null,
  'an owner cannot attach their league_id to another owner''s event team'
);
select throws_ok(
  $$ insert into public.event_fixtures (event_id, league_id, home_team_id, away_team_id) values ('dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000b', 'dc000000-0000-4000-8000-000000000403', 'dc000000-0000-4000-8000-000000000404') $$,
  '23503',
  null,
  'an owner cannot attach their league_id to another owner''s event fixture'
);
select throws_ok(
  $$ insert into public.fixture_stat_events (fixture_id, event_id, league_id, team_id, player_name, stat_type) values ('dc000000-0000-4000-8000-000000000502', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000b', 'dc000000-0000-4000-8000-000000000403', 'Blocked Scorer', 'goal') $$,
  '23503',
  null,
  'an owner cannot attach their league_id to another owner''s event stats'
);

-- === Anonymous visitor ========================================================
set local role anon;

select is(
  public.get_public_event('PUBLICCUP')->>'found',
  'true',
  'anyone can read a published event without logging in'
);
select is(
  public.get_public_event('PUBLICCUP')->'event'->>'name',
  'Open Cup',
  'the public bundle includes the event details'
);
select is(
  jsonb_array_length(public.get_public_event('PUBLICCUP')->'teams'),
  2,
  'the public bundle includes only the victim event teams'
);
select is(
  jsonb_array_length(public.get_public_event('PUBLICCUP')->'fixtures'),
  1,
  'the public bundle includes only the victim event fixtures'
);
select is(
  jsonb_array_length(public.get_public_event('PUBLICCUP')->'stats'),
  1,
  'the public bundle includes only the victim event stat events'
);
select is(
  (select count(*)::int from jsonb_array_elements(public.get_public_event('PUBLICCUP')->'teams') team where team->>'name' = 'Poison Team'),
  0,
  'the public bundle does not expose attacker-owned poisoned teams'
);
select is(
  (select count(*)::int from jsonb_array_elements(public.get_public_event('PUBLICCUP')->'stats') stat where stat->>'player_name' = 'Poison Scorer'),
  0,
  'the public bundle does not expose attacker-owned poisoned stats'
);
select is(
  public.get_public_event('SECRETCUP')->>'found',
  'false',
  'an unpublished event is not exposed'
);
select is(
  public.get_public_event('NOPE')->>'found',
  'false',
  'an unknown code returns not found'
);
select ok(
  not (public.get_public_event('PUBLICCUP')->'event' ?| array['league_id', 'notes', 'created_at', 'updated_at']),
  'public event details omit internal event fields'
);
select ok(
  not (public.get_public_event('PUBLICCUP')->'teams'->0 ?| array['registration_id', 'league_id', 'created_at', 'updated_at']),
  'public teams omit registration and tenant fields'
);
select ok(
  not (public.get_public_event('PUBLICCUP')->'fixtures'->0 ?| array['league_id', 'official_name', 'home_checked_in', 'away_checked_in', 'created_at', 'updated_at']),
  'public fixtures omit operational fields'
);
select ok(
  not (public.get_public_event('PUBLICCUP')->'stats'->0 ?| array['league_id', 'note', 'created_at', 'updated_at']),
  'public stats omit notes and tenant fields'
);

-- Anon cannot read the underlying table directly (only the RPC exposes data).
select is(
  (select count(*)::int from public.league_events),
  0,
  'RLS still hides the events table from anonymous direct reads'
);

select finish();
rollback;
