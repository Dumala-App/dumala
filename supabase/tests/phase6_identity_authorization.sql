begin;

create extension if not exists pgtap with schema extensions;

select plan(27);

-- Actors -----------------------------------------------------------------------
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('a0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'p6-admin@example.test', now(), now(), now()),
  ('a0000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'p6-coach@example.test', now(), now(), now()),
  ('a0000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'p6-player@example.test', now(), now(), now()),
  ('a0000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'p6-league@example.test', now(), now(), now()),
  ('a0000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'p6-ent@example.test', now(), now(), now()),
  ('a0000000-0000-4000-8000-000000000006', 'authenticated', 'authenticated', 'p6-other@example.test', now(), now(), now());

insert into public.app_admins (user_id, role)
values ('a0000000-0000-4000-8000-000000000001', 'owner');

insert into public.user_profiles (user_id)
values
  ('a0000000-0000-4000-8000-000000000002'),
  ('a0000000-0000-4000-8000-000000000003'),
  ('a0000000-0000-4000-8000-000000000006');

-- Entitlement fixtures for is_entitled (bypass RLS as the superuser test role).
insert into public.user_entitlements (user_id, entitlement, revoked_at, expires_at)
values
  ('a0000000-0000-4000-8000-000000000005', 'active_key', null, null),
  ('a0000000-0000-4000-8000-000000000005', 'revoked_key', now(), null),
  ('a0000000-0000-4000-8000-000000000005', 'expired_key', null, now() - interval '1 day');

-- Pending waitlist request that will be provisioned later.
insert into public.league_access_requests (id, contact_name, contact_email, status)
values ('c0000000-0000-4000-8000-000000000001', 'League Owner', 'p6-league@example.test', 'pending');

-- 1) Existing profiles default to the coach persona -----------------------------
select is(
  (select persona::text from public.user_profiles where user_id = 'a0000000-0000-4000-8000-000000000002'),
  'coach',
  'new profiles default to the coach persona'
);

-- 2/3) A normal user cannot self-assign persona or grant entitlements -----------
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);

select throws_ok(
  $$ update public.user_profiles set persona = 'league' where user_id = 'a0000000-0000-4000-8000-000000000002' $$,
  '42501',
  null,
  'a normal user cannot change their own persona'
);

select throws_ok(
  $$ insert into public.user_entitlements (user_id, entitlement) values ('a0000000-0000-4000-8000-000000000002', 'league_pilot') $$,
  '42501',
  null,
  'a normal user cannot insert their own entitlements'
);

-- 4/5/6) is_entitled respects revocation and expiry -----------------------------
reset role;
select is(public.is_entitled('active_key', 'a0000000-0000-4000-8000-000000000005'), true, 'active grant is entitled');
select is(public.is_entitled('revoked_key', 'a0000000-0000-4000-8000-000000000005'), false, 'revoked grant is not entitled');
select is(public.is_entitled('expired_key', 'a0000000-0000-4000-8000-000000000005'), false, 'expired grant is not entitled');

-- 7) resolve_app_destination routes a coach to /app -----------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);
select is(
  public.resolve_app_destination() ->> 'authorized_route',
  '/app',
  'a coach resolves to the /app destination'
);

-- 8/9) Player self-service bootstrap flips persona and routes to /player ---------
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal1"}', true);
select is(public.bootstrap_player_account()::text, 'player', 'bootstrap_player_account claims the player persona');
select is(
  public.resolve_app_destination() ->> 'authorized_route',
  '/player',
  'a player resolves to the /player destination'
);

-- 10/11) Anonymous league access requests, with dedupe --------------------------
set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select lives_ok(
  $$ select public.request_league_access('Anon Owner', 'p6-anon@example.test', 'Anon Org', 'Anon League', 'Manila', 'Please') $$,
  'an anonymous visitor can submit a league access request'
);
select throws_ok(
  $$ select public.request_league_access('Anon Owner', 'p6-anon@example.test') $$,
  '23505',
  null,
  'a duplicate open request for the same email is rejected'
);

-- 12/13/14) Requester reads only their own request ------------------------------
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);
select lives_ok(
  $$ select public.request_league_access('Coach Owner', 'p6-coachreq@example.test') $$,
  'a signed-in coach can submit a league access request'
);
select is(
  (select count(*)::int from public.league_access_requests),
  1,
  'a requester sees only their own request'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000006', true);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000006","role":"authenticated","aal":"aal1"}', true);
select is(
  (select count(*)::int from public.league_access_requests),
  0,
  'a different user cannot read another requester''s request'
);

-- 15) A non-admin cannot provision a league owner -------------------------------
select throws_ok(
  $$ select public.admin_provision_league_owner('c0000000-0000-4000-8000-000000000001') $$,
  '42501',
  null,
  'a non-admin cannot provision a league owner'
);

-- 16) An owner admin (MFA) provisions the league owner atomically ---------------
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2"}', true);
select lives_ok(
  $$ select public.admin_provision_league_owner('c0000000-0000-4000-8000-000000000001') $$,
  'an owner admin provisions the league owner'
);

-- 17/18/19) Provisioning flips persona, grants the entitlement, marks the request
reset role;
select set_config('request.jwt.claims', '', true);
select is(
  (select persona::text from public.user_profiles where user_id = 'a0000000-0000-4000-8000-000000000004'),
  'league',
  'provisioning sets the target persona to league'
);
select is(
  public.is_entitled('league_pilot', 'a0000000-0000-4000-8000-000000000004'),
  true,
  'provisioning grants the league_pilot entitlement'
);
select is(
  (select status::text from public.league_access_requests where id = 'c0000000-0000-4000-8000-000000000001'),
  'provisioned',
  'provisioning marks the request as provisioned'
);

-- 20/21) The provisioned owner resolves to /league and is entitled --------------
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000004', true);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000004","role":"authenticated","aal":"aal1"}', true);
select is(
  public.resolve_app_destination() ->> 'authorized_route',
  '/league',
  'a provisioned league owner resolves to the /league destination'
);
select is(
  (public.resolve_app_destination() -> 'league_entitled')::text,
  'true',
  'a provisioned league owner reports the league entitlement'
);

-- 22..27) The Admin Console entitlement toggle: grant, re-grant, revoke ----------
-- These call admin_grant_entitlement/admin_revoke_entitlement directly. Both take
-- an `entitlement` parameter that shadows user_entitlements.entitlement, and both
-- were unusable ("column reference \"entitlement\" is ambiguous") until the
-- references were qualified.
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'a0000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal2"}', true);

select lives_ok(
  $$ select public.admin_grant_entitlement('a0000000-0000-4000-8000-000000000006', 'league_pilot', null, 'Granted from Admin Access tab') $$,
  'an owner admin grants an entitlement without an ambiguous column reference'
);
select is(
  public.is_entitled('league_pilot', 'a0000000-0000-4000-8000-000000000006'),
  true,
  'the granted entitlement is active'
);

-- Re-granting takes the update branch and must stay a single active row.
select lives_ok(
  $$ select public.admin_grant_entitlement('a0000000-0000-4000-8000-000000000006', 'league_pilot', null, 'Re-granted') $$,
  're-granting an existing entitlement updates it in place'
);
select is(
  (select count(*)::int from public.user_entitlements
   where user_id = 'a0000000-0000-4000-8000-000000000006'
     and entitlement = 'league_pilot'
     and revoked_at is null),
  1,
  're-granting leaves exactly one active grant'
);

select lives_ok(
  $$ select public.admin_revoke_entitlement('a0000000-0000-4000-8000-000000000006', 'league_pilot') $$,
  'an owner admin revokes an entitlement without an ambiguous column reference'
);
select is(
  public.is_entitled('league_pilot', 'a0000000-0000-4000-8000-000000000006'),
  false,
  'the revoked entitlement is no longer active'
);

select finish();
rollback;
