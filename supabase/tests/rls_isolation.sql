begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'owner-a@example.test', now(), now(), now()),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'owner-b@example.test', now(), now(), now());

insert into public.user_profiles (user_id, display_name)
values
  ('11111111-1111-4111-8111-111111111111', 'Owner A'),
  ('22222222-2222-4222-8222-222222222222', 'Owner B');

insert into public.clubs (id, name, owner_user_id)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Club A', '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Club B', '22222222-2222-4222-8222-222222222222');

insert into public.club_memberships (club_id, user_id, role, membership_state)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'owner', 'active'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', 'owner', 'active');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select is(
  (select count(*)::int from public.user_profiles),
  1,
  'authenticated user sees only their own profile'
);

select is(
  (select count(*)::int from public.clubs),
  1,
  'authenticated user sees only their active club'
);

select lives_ok(
  $$ insert into public.players (id, club_id, name, roster_number, position, bio, photo_url)
     values ('33333333-3333-4333-8333-333333333333', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Visible Player', 9, 'ST', '', '') $$,
  'authenticated member can insert a player into their club'
);

select throws_ok(
  $$ insert into public.players (id, club_id, name, roster_number, position, bio, photo_url)
     values ('44444444-4444-4444-8444-444444444444', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Blocked Player', 10, 'CM', '', '') $$,
  '42501',
  null,
  'authenticated member cannot insert a player into another club'
);

select lives_ok(
  $$ insert into public.audit_events (club_id, user_id, event_type, metadata)
     values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'export_requested', '{"target":"club"}') $$,
  'authenticated member can write an audit event for their club'
);

select throws_ok(
  $$ insert into public.audit_events (club_id, user_id, event_type, metadata)
     values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111', 'export_requested', '{"target":"club"}') $$,
  '42501',
  null,
  'authenticated member cannot write an audit event for another club'
);

select throws_ok(
  $$ insert into public.audit_events (club_id, user_id, event_type, metadata)
     values (null, '22222222-2222-4222-8222-222222222222', 'export_requested', '{"target":"account"}') $$,
  '42501',
  null,
  'authenticated user cannot write account audit events for another user'
);

select is(
  (select count(*)::int from public.players where club_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  1,
  'cross-club rejected writes do not leak domain records'
);

select * from finish();

rollback;
