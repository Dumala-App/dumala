begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

-- Actors -----------------------------------------------------------------------
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('dc000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'org-owner-a@example.test', now(), now(), now()),
  ('dc000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'org-owner-b@example.test', now(), now(), now()),
  ('dc000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'org-coach-c@example.test', now(), now(), now()),
  ('dc000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'org-coach-d@example.test', now(), now(), now());

insert into public.user_profiles (user_id) values
  ('dc000000-0000-4000-8000-000000000001'),
  ('dc000000-0000-4000-8000-000000000002'),
  ('dc000000-0000-4000-8000-000000000003'),
  ('dc000000-0000-4000-8000-000000000004');

-- Owners A and B are League-persona accounts with the pilot entitlement; C and D
-- stay as default coach accounts.
select set_config('dumala.persona_change_authorized', 'on', false);
update public.user_profiles set persona = 'league'
where user_id in ('dc000000-0000-4000-8000-000000000001', 'dc000000-0000-4000-8000-000000000002');
select set_config('dumala.persona_change_authorized', 'off', false);

insert into public.user_entitlements (user_id, entitlement) values
  ('dc000000-0000-4000-8000-000000000001', 'league_pilot'),
  ('dc000000-0000-4000-8000-000000000002', 'league_pilot');

-- Owner A's league: one coach seat, a known invite code, and one pre-seeded
-- pending application (coach D). Setup runs as the test superuser (RLS bypassed).
insert into public.leagues (id, owner_user_id, name, coach_seat_limit, coach_invite_code)
values ('dc000000-0000-4000-8000-00000000000a', 'dc000000-0000-4000-8000-000000000001', 'Alpha League', 1, 'ORGCODE1');

insert into public.league_coach_memberships (id, league_id, coach_user_id, coach_name, coach_email, status)
values ('dc000000-0000-4000-8000-000000000301', 'dc000000-0000-4000-8000-00000000000a', 'dc000000-0000-4000-8000-000000000004', 'Coach D', 'org-coach-d@example.test', 'pending');

-- === Coach C applies ==========================================================
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'dc000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"dc000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal1"}', true);

select is(
  public.resolve_league_org_invite('ORGCODE1')->>'open',
  'true',
  'the invite resolves as open while seats remain'
);
select lives_ok(
  $$ select public.apply_to_league_org('ORGCODE1', 'Coach C', 'org-coach-c@example.test', 'Keen to join') $$,
  'a coach applies to a league organization via the invite code'
);
select throws_ok(
  $$ select public.apply_to_league_org('ORGCODE1', 'Coach C', 'org-coach-c@example.test', null) $$,
  '23505',
  null,
  'a duplicate open application from the same coach is blocked'
);
select is(
  (select count(*)::int from public.league_coach_memberships),
  1,
  'a coach reads only their own membership row'
);

-- === Owner B is isolated and cannot apply as a League account ==================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'dc000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"dc000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);

select is(
  (select count(*)::int from public.league_coach_memberships),
  0,
  'another owner cannot read memberships they do not own'
);
select throws_ok(
  $$ select public.apply_to_league_org('ORGCODE1', 'Owner B', 'org-owner-b@example.test', null) $$,
  '42501',
  null,
  'a non-coach (League) account cannot apply to an organization'
);
select throws_ok(
  $$ select public.review_league_coach_membership('dc000000-0000-4000-8000-000000000301', 'active') $$,
  '42501',
  null,
  'a non-owner cannot review another organization''s application'
);

-- === Owner A reviews applications (seat limit = 1) ============================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'dc000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"dc000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

select is(
  (select count(*)::int from public.league_coach_memberships),
  2,
  'an owner reads every application to their organization'
);
select lives_ok(
  $$ select public.review_league_coach_membership('dc000000-0000-4000-8000-000000000301', 'active') $$,
  'an owner approves an application within the seat limit'
);
select throws_ok(
  $$ select public.review_league_coach_membership(
       (select id from public.league_coach_memberships where coach_user_id = 'dc000000-0000-4000-8000-000000000003'),
       'active') $$,
  '22023',
  null,
  'approving beyond the seat limit is rejected'
);
select is(
  public.resolve_league_org_invite('ORGCODE1')->>'open',
  'false',
  'the invite reports closed once every seat is filled'
);

-- === Owner A rotates the invite code ==========================================
select lives_ok(
  $$ select public.rotate_league_coach_invite('dc000000-0000-4000-8000-00000000000a') $$,
  'an owner rotates their invite code'
);
select is(
  public.resolve_league_org_invite('ORGCODE1')->>'found',
  'false',
  'the old invite code stops resolving after rotation'
);

-- === Non-owner cannot rotate ==================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'dc000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"dc000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);

select throws_ok(
  $$ select public.rotate_league_coach_invite('dc000000-0000-4000-8000-00000000000a') $$,
  '42501',
  null,
  'a non-owner cannot rotate another organization''s invite code'
);

select finish();
rollback;
