begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

-- Actors -----------------------------------------------------------------------
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('c0000000-0000-4000-8000-000000000001','authenticated','authenticated','pe-coach@example.test', now(), now(), now()),
  ('c0000000-0000-4000-8000-000000000002','authenticated','authenticated','pe-playera@example.test', now(), now(), now()),
  ('c0000000-0000-4000-8000-000000000003','authenticated','authenticated','pe-playerb@example.test', now(), now(), now()),
  ('c0000000-0000-4000-8000-000000000004','authenticated','authenticated','pe-playerc@example.test', now(), now(), now());

insert into public.clubs (id, name, owner_user_id, club_state)
values ('c1000000-0000-4000-8000-000000000001','Engagement FC','c0000000-0000-4000-8000-000000000001','active');
insert into public.club_memberships (club_id, user_id, role, membership_state, accepted_at)
values ('c1000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','owner','active', now());
insert into public.players (id, club_id, name, roster_number, position)
values ('c2000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','Kid Player', 9, 'ST');

insert into public.user_profiles (user_id)
values
  ('c0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000003');
select set_config('dumala.persona_change_authorized', 'on', false);
update public.user_profiles set persona = 'player'
where user_id in ('c0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000003');
select set_config('dumala.persona_change_authorized', 'off', false);

-- Pending link request from player A (captured for the approval test).
insert into public.player_link_requests (id, requester_user_id, club_id, claimed_name)
values ('c3000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000002','c1000000-0000-4000-8000-000000000001','Kid Player');

-- === Player A owns their activity ============================================
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);

select lives_ok(
  $$ insert into public.player_drill_completions (user_id, drill_id, duration_seconds) values ('c0000000-0000-4000-8000-000000000002','drill-agility', 600) $$,
  'a player can log their own drill completion'
);
select is((select count(*)::int from public.player_drill_completions), 1, 'a player sees their own completion');
select lives_ok(
  $$ insert into public.player_drill_favorites (user_id, drill_id) values ('c0000000-0000-4000-8000-000000000002','drill-shooting') $$,
  'a player can favorite a drill'
);
select lives_ok(
  $$ insert into public.player_workout_sessions (user_id, kind, total_seconds) values ('c0000000-0000-4000-8000-000000000002','interval', 900) $$,
  'a player can save a workout session'
);
select throws_ok(
  $$ insert into public.player_notifications (user_id, type, title, body) values ('c0000000-0000-4000-8000-000000000002','system','Hi','Hello') $$,
  '42501',
  null,
  'a player cannot insert a notification directly'
);

-- === Player B cannot see Player A's activity =================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::int from public.player_drill_completions), 0, 'another player cannot read completions');
select is((select count(*)::int from public.player_workout_sessions), 0, 'another player cannot read workout sessions');

-- === Coach approval creates a notification for the requester ==================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);
select lives_ok(
  $$ select public.approve_player_link('c3000000-0000-4000-8000-000000000001','c2000000-0000-4000-8000-000000000001') $$,
  'the coach approves the link'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);
select is(
  (select count(*)::int from public.player_notifications where type = 'link_approved'),
  1,
  'the requester receives a link_approved notification'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::int from public.player_notifications), 0, 'another player cannot read the notification');

-- === The requester can mark it read ==========================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);
select lives_ok(
  $$ update public.player_notifications set read_at = now() where user_id = 'c0000000-0000-4000-8000-000000000002' $$,
  'the requester can mark a notification read'
);
select is(
  (select count(*)::int from public.player_notifications where read_at is not null),
  1,
  'the notification is now marked read'
);

-- === Fresh sign-in gets a welcome notification ===============================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c0000000-0000-4000-8000-000000000004', true);
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-4000-8000-000000000004","role":"authenticated","aal":"aal1"}', true);
select is(public.bootstrap_player_account()::text, 'player', 'a fresh account claims the player persona');
select is(
  (select count(*)::int from public.player_notifications where type = 'welcome'),
  1,
  'a fresh player gets a welcome notification'
);

select finish();
rollback;
