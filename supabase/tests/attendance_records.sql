begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'owner-a@example.test', now(), now(), now()),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'coach-a@example.test', now(), now(), now()),
  ('33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'staff-a@example.test', now(), now(), now()),
  ('44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'viewer-a@example.test', now(), now(), now()),
  ('55555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'owner-b@example.test', now(), now(), now());

insert into public.user_profiles (user_id, display_name)
values
  ('11111111-1111-4111-8111-111111111111', 'Owner A'),
  ('22222222-2222-4222-8222-222222222222', 'Coach A'),
  ('33333333-3333-4333-8333-333333333333', 'Staff A'),
  ('44444444-4444-4444-8444-444444444444', 'Viewer A'),
  ('55555555-5555-4555-8555-555555555555', 'Owner B');

insert into public.clubs (id, name, owner_user_id)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Club A', '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Club B', '55555555-5555-4555-8555-555555555555');

insert into public.club_memberships (club_id, user_id, role, membership_state)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'owner', 'active'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222', 'coach', 'active'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '33333333-3333-4333-8333-333333333333', 'staff', 'active'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '44444444-4444-4444-8444-444444444444', 'viewer', 'active'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '55555555-5555-4555-8555-555555555555', 'owner', 'active');

insert into public.players (id, club_id, name, roster_number, position, bio, photo_url)
values ('99999999-9999-4999-8999-999999999999', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Roster Player', 9, 'ST', '', '');

-- Role capability checks against the authorization helper.
select ok(
  public.user_can_manage_club_table('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'attendance_sessions', '22222222-2222-4222-8222-222222222222'),
  'coach can manage attendance sessions'
);

select ok(
  public.user_can_manage_club_table('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'attendance_entries', '22222222-2222-4222-8222-222222222222'),
  'coach can manage attendance entries'
);

select isnt(
  public.user_can_manage_club_table('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'attendance_sessions', '33333333-3333-4333-8333-333333333333'),
  true,
  'staff cannot manage attendance sessions'
);

select isnt(
  public.user_can_manage_club_table('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'attendance_entries', '44444444-4444-4444-8444-444444444444'),
  true,
  'viewer cannot manage attendance entries'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

-- Coach records a session and an entry for their own club.
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);

select lives_ok(
  $$ insert into public.attendance_sessions (id, club_id, session_date, session_type)
     values ('a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2026-07-20', 'training') $$,
  'coach can insert an attendance session for their club'
);

select lives_ok(
  $$ insert into public.attendance_entries (id, club_id, attendance_session_id, player_id, player_name_snapshot, status)
     values ('e1e1e1e1-1111-4111-8111-e1e1e1e1e1e1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1', '99999999-9999-4999-8999-999999999999', 'Roster Player', 'absent') $$,
  'coach can insert an attendance entry for their club'
);

-- Staff and cross-club writes are rejected.
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);

select throws_ok(
  $$ insert into public.attendance_sessions (id, club_id, session_date, session_type)
     values ('a2a2a2a2-2222-4222-8222-a2a2a2a2a2a2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2026-07-21', 'training') $$,
  '42501',
  null,
  'staff cannot insert an attendance session'
);

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);

select throws_ok(
  $$ insert into public.attendance_sessions (id, club_id, session_date, session_type)
     values ('a3a3a3a3-3333-4333-8333-a3a3a3a3a3a3', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '2026-07-22', 'training') $$,
  '42501',
  null,
  'coach cannot insert an attendance session into another club'
);

-- Tenant isolation: another club's owner cannot read Club A attendance.
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);

select is(
  (select count(*)::int from public.attendance_sessions),
  0,
  'a different club owner cannot see Club A attendance sessions'
);

select is(
  (select count(*)::int from public.attendance_entries),
  0,
  'a different club owner cannot see Club A attendance entries'
);

select * from finish();

rollback;
