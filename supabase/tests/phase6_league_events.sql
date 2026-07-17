begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

-- Actors -----------------------------------------------------------------------
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('dc000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'ev-owner-a@example.test', now(), now(), now()),
  ('dc000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'ev-owner-b@example.test', now(), now(), now()),
  ('dc000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'ev-coach@example.test', now(), now(), now());

insert into public.user_profiles (user_id) values
  ('dc000000-0000-4000-8000-000000000001'),
  ('dc000000-0000-4000-8000-000000000002'),
  ('dc000000-0000-4000-8000-000000000003');

-- Owners A and B are League-persona accounts with the pilot entitlement.
select set_config('dumala.persona_change_authorized', 'on', false);
update public.user_profiles set persona = 'league'
where user_id in ('dc000000-0000-4000-8000-000000000001', 'dc000000-0000-4000-8000-000000000002');
select set_config('dumala.persona_change_authorized', 'off', false);

insert into public.user_entitlements (user_id, entitlement) values
  ('dc000000-0000-4000-8000-000000000001', 'league_pilot'),
  ('dc000000-0000-4000-8000-000000000002', 'league_pilot');

-- Owner A's league, season, two events (event1 opens for registration, cap = 1)
-- and two pre-seeded applications (for owner-review + cap fixtures). These run as
-- the test superuser (before the role switch) so RLS is bypassed for setup.
insert into public.leagues (id, owner_user_id, name)
values ('dc000000-0000-4000-8000-00000000000a', 'dc000000-0000-4000-8000-000000000001', 'Alpha League');
insert into public.league_seasons (id, league_id, name, status)
values ('dc000000-0000-4000-8000-000000000101', 'dc000000-0000-4000-8000-00000000000a', 'Season 2026', 'active');
insert into public.league_events (id, league_id, season_id, name, format, team_cap, registration_code, status)
values
  ('dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'dc000000-0000-4000-8000-000000000101', 'Alpha Cup', 'round_robin', 1, 'ALPHACUP1', 'draft'),
  ('dc000000-0000-4000-8000-000000000202', 'dc000000-0000-4000-8000-00000000000a', 'dc000000-0000-4000-8000-000000000101', 'Beta Cup', 'single_elimination', null, 'BETACUP22', 'draft');
insert into public.event_registrations (id, event_id, league_id, club_name, contact_name, contact_email, status)
values
  ('dc000000-0000-4000-8000-000000000301', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'Rovers FC', 'Coach One', 'coach1@example.test', 'submitted'),
  ('dc000000-0000-4000-8000-000000000302', 'dc000000-0000-4000-8000-000000000201', 'dc000000-0000-4000-8000-00000000000a', 'United FC', 'Coach Two', 'coach2@example.test', 'submitted');

-- === Owner A ==================================================================
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'dc000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"dc000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

select is((select count(*)::int from public.league_events), 2, 'a League owner reads their own events');
select is(
  public.advance_event_status('dc000000-0000-4000-8000-000000000201', 'registration_open')::text,
  'registration_open',
  'draft advances to registration_open'
);
select throws_ok(
  $$ select public.advance_event_status('dc000000-0000-4000-8000-000000000202', 'active') $$,
  '22023',
  null,
  'an event cannot jump from draft straight to active'
);
select lives_ok(
  $$ insert into public.league_events (league_id, season_id, name) values ('dc000000-0000-4000-8000-00000000000a', 'dc000000-0000-4000-8000-000000000101', 'Gamma Cup') $$,
  'a League owner can create an event under RLS'
);

-- === Owner B is isolated ======================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'dc000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"dc000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);

select is((select count(*)::int from public.league_events), 0, 'another owner cannot read events they do not own');
select throws_ok(
  $$ insert into public.league_events (league_id, season_id, name) values ('dc000000-0000-4000-8000-00000000000a', 'dc000000-0000-4000-8000-000000000101', 'Sneaky Cup') $$,
  '42501',
  null,
  'a non-owner cannot add an event to another league'
);
select throws_ok(
  $$ select public.advance_event_status('dc000000-0000-4000-8000-000000000201', 'active') $$,
  '42501',
  null,
  'a non-owner cannot advance another owner''s event'
);

-- === A coach cannot own events ================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'dc000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"dc000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal1"}', true);

select throws_ok(
  $$ insert into public.league_events (league_id, season_id, name) values ('dc000000-0000-4000-8000-00000000000a', 'dc000000-0000-4000-8000-000000000101', 'Coach Cup') $$,
  '42501',
  null,
  'a non-League account cannot create an event'
);

-- === Public registration (event1 is registration_open) ========================
-- lookup + submit are definer RPCs; a coach applies without owning anything.
select is(
  public.lookup_event_registration('ALPHACUP1')->>'open',
  'true',
  'the public lookup reports an open event when registration is open'
);
select lives_ok(
  $$ select public.submit_event_registration('ALPHACUP1', 'Wanderers FC', null, 'U12', 'Coach Three', 'coach3@example.test', 14, 'Please add us') $$,
  'a coach can submit an application to an open event'
);
select throws_ok(
  $$ select public.submit_event_registration('ALPHACUP1', 'Rovers FC', null, null, 'Coach One', 'coach1@example.test', null, null) $$,
  '23505',
  null,
  'a duplicate open application from the same email is blocked'
);

-- === Owner A reviews applications (cap = 1) ====================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'dc000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"dc000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

select is(
  (select count(*)::int from public.event_registrations where event_id = 'dc000000-0000-4000-8000-000000000201'),
  3,
  'an owner reads every application to their event'
);
select lives_ok(
  $$ select public.review_event_registration('dc000000-0000-4000-8000-000000000301', 'approved') $$,
  'an owner approves an application within the team cap'
);
select throws_ok(
  $$ select public.review_event_registration('dc000000-0000-4000-8000-000000000302', 'approved') $$,
  '22023',
  null,
  'approving beyond the team cap is rejected'
);

-- === Non-owner cannot review ==================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'dc000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"dc000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);

select throws_ok(
  $$ select public.review_event_registration('dc000000-0000-4000-8000-000000000301', 'rejected') $$,
  '42501',
  null,
  'a non-owner cannot review another owner''s application'
);

-- === Registration closes when the event leaves registration_open ==============
set local role authenticated;
select set_config('request.jwt.claim.sub', 'dc000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"dc000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

select lives_ok(
  $$ select public.advance_event_status('dc000000-0000-4000-8000-000000000201', 'active') $$,
  'registration_open advances to active'
);
select is(
  public.lookup_event_registration('ALPHACUP1')->>'open',
  'false',
  'the public lookup reports the event closed once it leaves registration_open'
);
select throws_ok(
  $$ select public.submit_event_registration('ALPHACUP1', 'Latecomers FC', null, null, 'Coach Four', 'coach4@example.test', null, null) $$,
  '22023',
  null,
  'an application to a closed event is rejected'
);

-- === Archiving a finished event ===============================================
select lives_ok(
  $$ select public.advance_event_status('dc000000-0000-4000-8000-000000000201', 'completed') $$,
  'active advances to completed'
);
select is(
  public.advance_event_status('dc000000-0000-4000-8000-000000000201', 'archived')::text,
  'archived',
  'completed advances to archived'
);
select throws_ok(
  $$ select public.advance_event_status('dc000000-0000-4000-8000-000000000201', 'active') $$,
  '22023',
  null,
  'an archived event cannot be reopened'
);
select throws_ok(
  $$ select public.advance_event_status('dc000000-0000-4000-8000-000000000202', 'archived') $$,
  '22023',
  null,
  'an event cannot jump straight to archived'
);

select finish();
rollback;
