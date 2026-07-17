begin;

create extension if not exists pgtap with schema extensions;

select plan(28);

-- Actors -----------------------------------------------------------------------
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('d1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'lf-owner-a@example.test', now(), now(), now()),
  ('d1000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'lf-owner-b@example.test', now(), now(), now()),
  ('d1000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'lf-coach@example.test', now(), now(), now());

insert into public.user_profiles (user_id) values
  ('d1000000-0000-4000-8000-000000000001'),
  ('d1000000-0000-4000-8000-000000000002'),
  ('d1000000-0000-4000-8000-000000000003');

-- Owners A and B are League-persona accounts with the pilot entitlement.
select set_config('dumala.persona_change_authorized', 'on', false);
update public.user_profiles set persona = 'league'
where user_id in ('d1000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000002');
select set_config('dumala.persona_change_authorized', 'off', false);

insert into public.user_entitlements (user_id, entitlement) values
  ('d1000000-0000-4000-8000-000000000001', 'league_pilot'),
  ('d1000000-0000-4000-8000-000000000002', 'league_pilot');

-- === Owner A builds their league ==============================================
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"d1000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

select lives_ok(
  $$ insert into public.leagues (id, owner_user_id, name) values ('da000000-0000-4000-8000-00000000000a', 'd1000000-0000-4000-8000-000000000001', 'Alpha League') $$,
  'a League owner can create a league'
);
select lives_ok(
  $$ insert into public.league_seasons (id, league_id, name, status) values ('da000000-0000-4000-8000-000000000101', 'da000000-0000-4000-8000-00000000000a', 'Season 2026', 'draft') $$,
  'a League owner can create a season'
);
select lives_ok(
  $$ insert into public.league_seasons (id, league_id, name, status) values ('da000000-0000-4000-8000-000000000102', 'da000000-0000-4000-8000-00000000000a', 'Cup 2026', 'draft') $$,
  'a League owner can create a second season'
);
select lives_ok(
  $$ insert into public.league_venues (id, league_id, name) values ('da000000-0000-4000-8000-000000000201', 'da000000-0000-4000-8000-00000000000a', 'Central Pitch') $$,
  'a League owner can create a venue'
);
select lives_ok(
  $$ insert into public.league_events (id, league_id, season_id, name, registration_code) values ('da000000-0000-4000-8000-000000000301', 'da000000-0000-4000-8000-00000000000a', 'da000000-0000-4000-8000-000000000102', 'Revocation Cup', 'REVOKE01') $$,
  'a League owner can create a downstream event'
);
select is((select count(*)::int from public.leagues), 1, 'an owner reads only their own league');

-- === Owner B is isolated ======================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"d1000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::int from public.leagues), 0, 'another owner cannot read a league they do not own');
select is((select count(*)::int from public.league_seasons), 0, 'another owner cannot read seasons they do not own');
select throws_ok(
  $$ insert into public.league_seasons (league_id, name) values ('da000000-0000-4000-8000-00000000000a', 'Sneaky Season') $$,
  '42501',
  null,
  'a non-owner cannot add a season to another league'
);
select throws_ok(
  $$ select public.advance_season_status('da000000-0000-4000-8000-000000000102', 'registration_open') $$,
  '42501',
  null,
  'a non-owner cannot advance a season'
);

-- === A coach cannot own a league ==============================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"d1000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$ insert into public.leagues (owner_user_id, name) values ('d1000000-0000-4000-8000-000000000003', 'Coach League') $$,
  '42501',
  null,
  'a non-League account cannot create a league'
);

-- === Season lifecycle state machine ===========================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"d1000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

select is(
  public.advance_season_status('da000000-0000-4000-8000-000000000101', 'registration_open')::text,
  'registration_open',
  'draft advances to registration_open'
);
select lives_ok(
  $$ select public.advance_season_status('da000000-0000-4000-8000-000000000101', 'active') $$,
  'registration_open advances to active'
);
select throws_ok(
  $$ select public.advance_season_status('da000000-0000-4000-8000-000000000102', 'active') $$,
  '22023',
  null,
  'draft cannot jump straight to active'
);
select throws_ok(
  $$ select public.advance_season_status('da000000-0000-4000-8000-000000000101', 'draft') $$,
  '22023',
  null,
  'a season cannot move backwards'
);

-- === Revoked League Owner entitlement loses access ===========================
reset role;
update public.user_entitlements
set revoked_at = now()
where user_id = 'd1000000-0000-4000-8000-000000000001'
  and entitlement = 'league_pilot'
  and revoked_at is null;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"d1000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

select ok(
  not public.is_league_owner('d1000000-0000-4000-8000-000000000001'),
  'revoking league_pilot removes League Owner status'
);
select ok(
  not public.owns_league('da000000-0000-4000-8000-00000000000a'),
  'revoking league_pilot removes owns_league access'
);
select is((select count(*)::int from public.leagues), 0, 'a revoked League owner cannot read their league');
select is_empty(
  $$ update public.leagues
     set name = 'Renamed After Revocation'
     where id = 'da000000-0000-4000-8000-00000000000a'
     returning 1 $$,
  'a revoked League owner cannot update their league'
);
select is_empty(
  $$ delete from public.leagues
     where id = 'da000000-0000-4000-8000-00000000000a'
     returning 1 $$,
  'a revoked League owner cannot delete their league'
);
select is((select count(*)::int from public.league_seasons), 0, 'a revoked League owner cannot read seasons');
select throws_ok(
  $$ insert into public.league_seasons (league_id, name) values ('da000000-0000-4000-8000-00000000000a', 'Revoked Season') $$,
  '42501',
  null,
  'a revoked League owner cannot create a season'
);
select is((select count(*)::int from public.league_venues), 0, 'a revoked League owner cannot read venues');
select throws_ok(
  $$ insert into public.league_venues (league_id, name) values ('da000000-0000-4000-8000-00000000000a', 'Revoked Pitch') $$,
  '42501',
  null,
  'a revoked League owner cannot create a venue'
);
select throws_ok(
  $$ select public.advance_season_status('da000000-0000-4000-8000-000000000102', 'registration_open') $$,
  '42501',
  null,
  'a revoked League owner cannot advance a season'
);
select is((select count(*)::int from public.league_events), 0, 'a revoked League owner cannot read downstream events');
select throws_ok(
  $$ select public.advance_event_status('da000000-0000-4000-8000-000000000301', 'registration_open') $$,
  '42501',
  null,
  'a revoked League owner cannot advance a downstream event'
);
select ok(
  not public.owns_event('da000000-0000-4000-8000-000000000301'),
  'revoking league_pilot removes owns_event access'
);

select finish();
rollback;
