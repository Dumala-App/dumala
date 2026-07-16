begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

-- Actors + data ----------------------------------------------------------------
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values ('dc000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'pub-owner@example.test', now(), now(), now());
insert into public.user_profiles (user_id) values ('dc000000-0000-4000-8000-000000000001');
select set_config('dumala.persona_change_authorized', 'on', false);
update public.user_profiles set persona = 'league' where user_id = 'dc000000-0000-4000-8000-000000000001';
select set_config('dumala.persona_change_authorized', 'off', false);
insert into public.user_entitlements (user_id, entitlement) values ('dc000000-0000-4000-8000-000000000001', 'league_pilot');

insert into public.leagues (id, owner_user_id, name)
values ('dc000000-0000-4000-8000-00000000000a', 'dc000000-0000-4000-8000-000000000001', 'Alpha League');
insert into public.league_seasons (id, league_id, name, status)
values ('dc000000-0000-4000-8000-000000000101', 'dc000000-0000-4000-8000-00000000000a', 'Season 2026', 'active');
-- One published event and one private one, both with a code.
insert into public.league_events (id, league_id, season_id, name, registration_code, status, is_public)
values
  ('dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'dc000000-0000-4000-8000-000000000101', 'Open Cup', 'PUBLICCUP', 'active', true),
  ('dc000000-0000-4000-8000-000000000202', 'dc000000-0000-4000-8000-00000000000a', 'dc000000-0000-4000-8000-000000000101', 'Secret Cup', 'SECRETCUP', 'active', false);
insert into public.event_teams (id, event_id, league_id, name) values
  ('dc000000-0000-4000-8000-000000000401', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'Alpha'),
  ('dc000000-0000-4000-8000-000000000402', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'Bravo');

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
  'the public bundle includes the event teams'
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

-- Anon cannot read the underlying table directly (only the RPC exposes data).
select is(
  (select count(*)::int from public.league_events),
  0,
  'RLS still hides the events table from anonymous direct reads'
);

select finish();
rollback;
