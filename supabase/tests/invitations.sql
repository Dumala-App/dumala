begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('11111111-aaaa-4111-8111-111111111111', 'authenticated', 'authenticated', 'owner.invite@example.test', now(), now(), now()),
  ('22222222-aaaa-4222-8222-222222222222', 'authenticated', 'authenticated', 'admin.invite@example.test', now(), now(), now()),
  ('33333333-aaaa-4333-8333-333333333333', 'authenticated', 'authenticated', 'coach.invite@example.test', now(), now(), now()),
  ('44444444-aaaa-4444-8444-444444444444', 'authenticated', 'authenticated', 'invited.coach@example.test', now(), now(), now()),
  ('55555555-aaaa-4555-8555-555555555555', 'authenticated', 'authenticated', 'other.invite@example.test', now(), now(), now());

insert into public.user_profiles (user_id, display_name)
values
  ('11111111-aaaa-4111-8111-111111111111', 'Owner'),
  ('22222222-aaaa-4222-8222-222222222222', 'Admin'),
  ('33333333-aaaa-4333-8333-333333333333', 'Coach'),
  ('44444444-aaaa-4444-8444-444444444444', 'Invited Coach'),
  ('55555555-aaaa-4555-8555-555555555555', 'Other');

insert into public.clubs (id, name, owner_user_id)
values ('aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa', 'Invitation Test Club', '11111111-aaaa-4111-8111-111111111111');

insert into public.club_memberships (club_id, user_id, role, membership_state)
values
  ('aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa', '11111111-aaaa-4111-8111-111111111111', 'owner', 'active'),
  ('aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa', '22222222-aaaa-4222-8222-222222222222', 'admin', 'active'),
  ('aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa', '33333333-aaaa-4333-8333-333333333333', 'coach', 'active');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config('request.jwt.claim.sub', '22222222-aaaa-4222-8222-222222222222', true);
select set_config('request.jwt.claim.email', 'admin.invite@example.test', true);
select set_config('request.jwt.claims', '{"sub":"22222222-aaaa-4222-8222-222222222222","role":"authenticated","email":"admin.invite@example.test"}', true);

select lives_ok(
  $$ insert into public.club_invitations (id, club_id, email, role, status, invited_by, expires_at)
     values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa', 'Invited.Coach@Example.Test', 'coach', 'pending', '22222222-aaaa-4222-8222-222222222222', now() + interval '7 days') $$,
  'admin can create a pending non-owner invitation'
);

insert into public.club_invitations (id, club_id, email, role, status, invited_by, expires_at)
values ('cccccccc-bbbb-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa', 'invited.staff@example.test', 'staff', 'pending', '22222222-aaaa-4222-8222-222222222222', now() + interval '7 days');

select throws_ok(
  $$ insert into public.club_invitations (club_id, email, role, status, invited_by, expires_at)
     values ('aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa', 'owner2@example.test', 'owner', 'pending', '22222222-aaaa-4222-8222-222222222222', now() + interval '7 days') $$,
  null,
  null,
  'admin cannot invite an owner role'
);

select set_config('request.jwt.claim.sub', '33333333-aaaa-4333-8333-333333333333', true);
select set_config('request.jwt.claim.email', 'coach.invite@example.test', true);
select set_config('request.jwt.claims', '{"sub":"33333333-aaaa-4333-8333-333333333333","role":"authenticated","email":"coach.invite@example.test"}', true);

select throws_ok(
  $$ insert into public.club_invitations (club_id, email, role, status, invited_by, expires_at)
     values ('aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa', 'staff@example.test', 'staff', 'pending', '33333333-aaaa-4333-8333-333333333333', now() + interval '7 days') $$,
  '42501',
  null,
  'coach cannot create invitations'
);

select set_config('request.jwt.claim.sub', '44444444-aaaa-4444-8444-444444444444', true);
select set_config('request.jwt.claim.email', 'invited.coach@example.test', true);
select set_config('request.jwt.claims', '{"sub":"44444444-aaaa-4444-8444-444444444444","role":"authenticated","email":"invited.coach@example.test"}', true);

select results_eq(
  $$ select count(*)::int from public.club_invitations where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  $$ values (1) $$,
  'invited email can read its pending invitation'
);

select set_config('request.jwt.claim.sub', '55555555-aaaa-4555-8555-555555555555', true);
select set_config('request.jwt.claim.email', 'other.invite@example.test', true);
select set_config('request.jwt.claims', '{"sub":"55555555-aaaa-4555-8555-555555555555","role":"authenticated","email":"other.invite@example.test"}', true);

select results_eq(
  $$ select count(*)::int from public.club_invitations where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  $$ values (0) $$,
  'other emails cannot read the pending invitation'
);

select set_config('request.jwt.claim.sub', '44444444-aaaa-4444-8444-444444444444', true);
select set_config('request.jwt.claim.email', 'invited.coach@example.test', true);
select set_config('request.jwt.claims', '{"sub":"44444444-aaaa-4444-8444-444444444444","role":"authenticated","email":"invited.coach@example.test"}', true);

select lives_ok(
  $$ select public.accept_club_invitation('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') $$,
  'invited user can accept a matching invitation atomically'
);

select results_eq(
  $$ select count(*)::int
     from public.club_memberships
     where club_id = 'aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa'
       and user_id = '44444444-aaaa-4444-8444-444444444444'
       and role = 'coach'
       and membership_state = 'active' $$,
  $$ values (1) $$,
  'accepted invitation creates the active membership'
);

select results_eq(
  $$ select count(*)::int
     from public.audit_events
     where club_id = 'aaaaaaaa-bbbb-4aaa-8aaa-aaaaaaaaaaaa'
       and user_id = '44444444-aaaa-4444-8444-444444444444'
       and event_type = 'invitation_accepted'
       and metadata = '{"role":"coach"}'::jsonb $$,
  $$ values (1) $$,
  'accepted invitation writes a redacted activity event'
);

select throws_ok(
  $$ select public.accept_club_invitation('cccccccc-bbbb-4ccc-8ccc-cccccccccccc') $$,
  '42501',
  null,
  'uninvited user cannot accept someone else''s invitation'
);

select * from finish();

rollback;
