begin;

create extension if not exists pgtap with schema extensions;

select plan(5);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('11111111-dddd-4111-8111-111111111111', 'authenticated', 'authenticated', 'owner.activity@example.test', now(), now(), now()),
  ('22222222-dddd-4222-8222-222222222222', 'authenticated', 'authenticated', 'admin.activity@example.test', now(), now(), now()),
  ('33333333-dddd-4333-8333-333333333333', 'authenticated', 'authenticated', 'coach.activity@example.test', now(), now(), now()),
  ('44444444-dddd-4444-8444-444444444444', 'authenticated', 'authenticated', 'viewer.activity@example.test', now(), now(), now());

insert into public.user_profiles (user_id, display_name)
values
  ('11111111-dddd-4111-8111-111111111111', 'Owner'),
  ('22222222-dddd-4222-8222-222222222222', 'Admin'),
  ('33333333-dddd-4333-8333-333333333333', 'Coach'),
  ('44444444-dddd-4444-8444-444444444444', 'Viewer');

insert into public.clubs (id, name, owner_user_id)
values ('aaaaaaaa-dddd-4aaa-8aaa-aaaaaaaaaaaa', 'Activity Test Club', '11111111-dddd-4111-8111-111111111111');

insert into public.club_memberships (club_id, user_id, role, membership_state)
values
  ('aaaaaaaa-dddd-4aaa-8aaa-aaaaaaaaaaaa', '11111111-dddd-4111-8111-111111111111', 'owner', 'active'),
  ('aaaaaaaa-dddd-4aaa-8aaa-aaaaaaaaaaaa', '22222222-dddd-4222-8222-222222222222', 'admin', 'active'),
  ('aaaaaaaa-dddd-4aaa-8aaa-aaaaaaaaaaaa', '33333333-dddd-4333-8333-333333333333', 'coach', 'active'),
  ('aaaaaaaa-dddd-4aaa-8aaa-aaaaaaaaaaaa', '44444444-dddd-4444-8444-444444444444', 'viewer', 'active');

insert into public.audit_events (id, club_id, user_id, event_type, metadata)
values
  ('bbbbbbbb-dddd-4bbb-8bbb-bbbbbbbbbbbb', 'aaaaaaaa-dddd-4aaa-8aaa-aaaaaaaaaaaa', '11111111-dddd-4111-8111-111111111111', 'membership_role_changed', '{"role":"coach"}'),
  ('cccccccc-dddd-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-dddd-4aaa-8aaa-aaaaaaaaaaaa', '33333333-dddd-4333-8333-333333333333', 'invitation_created', '{"role":"viewer"}');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config('request.jwt.claim.sub', '11111111-dddd-4111-8111-111111111111', true);

select results_eq(
  $$ select count(*)::int from public.audit_events where club_id = 'aaaaaaaa-dddd-4aaa-8aaa-aaaaaaaaaaaa' $$,
  $$ values (2) $$,
  'owner can read club activity history'
);

select set_config('request.jwt.claim.sub', '22222222-dddd-4222-8222-222222222222', true);

select results_eq(
  $$ select count(*)::int from public.audit_events where club_id = 'aaaaaaaa-dddd-4aaa-8aaa-aaaaaaaaaaaa' $$,
  $$ values (2) $$,
  'admin can read club activity history'
);

select set_config('request.jwt.claim.sub', '33333333-dddd-4333-8333-333333333333', true);

select results_eq(
  $$ select count(*)::int from public.audit_events where club_id = 'aaaaaaaa-dddd-4aaa-8aaa-aaaaaaaaaaaa' $$,
  $$ values (1) $$,
  'coach can read only their own activity rows'
);

select set_config('request.jwt.claim.sub', '44444444-dddd-4444-8444-444444444444', true);

select results_eq(
  $$ select count(*)::int from public.audit_events where club_id = 'aaaaaaaa-dddd-4aaa-8aaa-aaaaaaaaaaaa' $$,
  $$ values (0) $$,
  'viewer cannot browse sensitive club activity history'
);

select lives_ok(
  $$ insert into public.audit_events (club_id, user_id, event_type, metadata)
     values ('aaaaaaaa-dddd-4aaa-8aaa-aaaaaaaaaaaa', '44444444-dddd-4444-8444-444444444444', 'authorization_denied', '{"action":"activity_history"}') $$,
  'active member can write their own redacted authorization audit row'
);

select * from finish();

rollback;
