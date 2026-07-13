begin;

create extension if not exists pgtap with schema extensions;

select plan(19);

-- Actors -----------------------------------------------------------------------
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('b0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'pf-coach@example.test', now(), now(), now()),
  ('b0000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'pf-minor@example.test', now(), now(), now()),
  ('b0000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'pf-adult@example.test', now(), now(), now()),
  ('b0000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'pf-outsider@example.test', now(), now(), now());

-- Coach club with an owner membership and one roster player + a fixture.
insert into public.clubs (id, name, owner_user_id, club_state)
values ('c1000000-0000-4000-8000-000000000001', 'Foundation FC', 'b0000000-0000-4000-8000-000000000001', 'active');

insert into public.club_memberships (club_id, user_id, role, membership_state, accepted_at)
values ('c1000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'owner', 'active', now());

insert into public.players (id, club_id, name, roster_number, position)
values ('d1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'Kid Striker', 7, 'ST');

insert into public.games (id, club_id, opponent, event_date, status, type)
values ('e1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'Rivals FC', '2026-08-01', 'upcoming', 'league');

insert into public.club_join_codes (club_id, code)
values ('c1000000-0000-4000-8000-000000000001', 'JOINCODE1');

-- Profiles: coach + outsider default to coach; the two players get the player persona.
insert into public.user_profiles (user_id)
values
  ('b0000000-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000002'),
  ('b0000000-0000-4000-8000-000000000003'),
  ('b0000000-0000-4000-8000-000000000004');

select set_config('dumala.persona_change_authorized', 'on', false);
update public.user_profiles set persona = 'player'
where user_id in ('b0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000003');
select set_config('dumala.persona_change_authorized', 'off', false);

-- Player profiles: one minor, one adult.
insert into public.player_profiles (user_id, display_name, date_of_birth)
values
  ('b0000000-0000-4000-8000-000000000002', 'Minor Player', (current_date - interval '10 years')::date),
  ('b0000000-0000-4000-8000-000000000003', 'Adult Player', (current_date - interval '25 years')::date);

-- 1/2) Minor detection drives guardian consent state ---------------------------
select is(
  (select guardian_consent_state::text from public.player_profiles where user_id = 'b0000000-0000-4000-8000-000000000002'),
  'pending',
  'a minor profile starts with pending guardian consent'
);
select is(
  (select guardian_consent_state::text from public.player_profiles where user_id = 'b0000000-0000-4000-8000-000000000003'),
  'not_required',
  'an adult profile does not require guardian consent'
);

-- 3) Player profiles are owner-only --------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::int from public.player_profiles), 1, 'a player reads only their own profile');

select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000004', true);
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000004","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::int from public.player_profiles), 0, 'a different user cannot read a player profile');

-- 4/5/6/7) Guardian gate + request lifecycle (as the minor) --------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);

select throws_ok(
  $$ select public.request_player_link('JOINCODE1', 'Kid Striker', 7, null) $$,
  '42501',
  null,
  'a minor without consent cannot request a link'
);

select is(
  public.set_guardian_consent('Parent Guardian', 'parent@example.test', 'Mother')::text,
  'granted',
  'the minor records guardian consent'
);

select set_config('test.req1', public.request_player_link('JOINCODE1', 'Kid Striker', 7, null)::text, false);
select isnt(current_setting('test.req1'), '', 'a minor with consent can request a link');

select throws_ok(
  $$ select public.request_player_link('JOINCODE1', 'Kid Striker', 7, null) $$,
  '23505',
  null,
  'a duplicate open request is rejected'
);

-- 8) Non-player persona cannot request -----------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000004', true);
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000004","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$ select public.request_player_link('JOINCODE1', 'Someone', null, null) $$,
  '42501',
  null,
  'a non-player account cannot request a link'
);

-- 9) A second player submits a request -----------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal1"}', true);
select set_config('test.req2', public.request_player_link('JOINCODE1', 'Adult Player', null, 'Please add me')::text, false);
select isnt(current_setting('test.req2'), '', 'a second player can submit a request');

-- 10) Staff read requests; outsiders do not ------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::int from public.player_link_requests), 2, 'club staff read all of their club''s requests');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000004', true);
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000004","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::int from public.player_link_requests), 0, 'a non-member cannot read link requests');

-- 11) Non-staff cannot approve -------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  format($$ select public.approve_player_link(%L::uuid, 'd1000000-0000-4000-8000-000000000001') $$, current_setting('test.req1')),
  '42501',
  null,
  'a non-staff account cannot approve a link'
);

-- 12/13/14) Owner approves; link is created and request marked approved --------
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);
select lives_ok(
  format($$ select public.approve_player_link(%L::uuid, 'd1000000-0000-4000-8000-000000000001') $$, current_setting('test.req1')),
  'an owner approves the minor''s request'
);

reset role;
select set_config('request.jwt.claims', '', true);
select is(
  (select count(*)::int from public.player_club_links
   where user_id = 'b0000000-0000-4000-8000-000000000002'
     and player_id = 'd1000000-0000-4000-8000-000000000001'
     and state = 'active'),
  1,
  'approval creates an active player-club link'
);
select is(
  (select status::text from public.player_link_requests where id = current_setting('test.req1')::uuid),
  'approved',
  'approval marks the request approved'
);

-- 15) The roster slot cannot be linked twice -----------------------------------
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  format($$ select public.approve_player_link(%L::uuid, 'd1000000-0000-4000-8000-000000000001') $$, current_setting('test.req2')),
  '23505',
  null,
  'a roster slot cannot be linked to two accounts'
);

-- 16) Linked players read the schedule; unlinked players do not ----------------
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::int from public.games), 1, 'a linked player can read the club schedule');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'b0000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::int from public.games), 0, 'an unlinked player cannot read the club schedule');

select finish();
rollback;
