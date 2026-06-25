begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('11111111-eeee-4111-8111-111111111111', 'authenticated', 'authenticated', 'owner.bulletin@example.test', now(), now(), now()),
  ('22222222-eeee-4222-8222-222222222222', 'authenticated', 'authenticated', 'staff.bulletin@example.test', now(), now(), now()),
  ('33333333-eeee-4333-8333-333333333333', 'authenticated', 'authenticated', 'viewer.bulletin@example.test', now(), now(), now());

insert into public.user_profiles (user_id, display_name)
values
  ('11111111-eeee-4111-8111-111111111111', 'Owner'),
  ('22222222-eeee-4222-8222-222222222222', 'Staff'),
  ('33333333-eeee-4333-8333-333333333333', 'Viewer');

insert into public.clubs (id, name, owner_user_id)
values ('aaaaaaaa-eeee-4aaa-8aaa-aaaaaaaaaaaa', 'Bulletin Test Club', '11111111-eeee-4111-8111-111111111111');

insert into public.club_memberships (club_id, user_id, role, membership_state)
values
  ('aaaaaaaa-eeee-4aaa-8aaa-aaaaaaaaaaaa', '11111111-eeee-4111-8111-111111111111', 'owner', 'active'),
  ('aaaaaaaa-eeee-4aaa-8aaa-aaaaaaaaaaaa', '22222222-eeee-4222-8222-222222222222', 'staff', 'active'),
  ('aaaaaaaa-eeee-4aaa-8aaa-aaaaaaaaaaaa', '33333333-eeee-4333-8333-333333333333', 'viewer', 'active');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config('request.jwt.claim.sub', '22222222-eeee-4222-8222-222222222222', true);

select lives_ok(
  $$ insert into public.bulletins (id, club_id, title, content, bulletin_date, category, author_snapshot, created_by, updated_by)
     values ('bbbbbbbb-eeee-4bbb-8bbb-bbbbbbbbbbbb', 'aaaaaaaa-eeee-4aaa-8aaa-aaaaaaaaaaaa', 'Training moved', 'Indoor shoes required.', '2026-06-25', 'training', 'Staff', '22222222-eeee-4222-8222-222222222222', '22222222-eeee-4222-8222-222222222222') $$,
  'staff can create shared bulletins'
);

select throws_ok(
  $$ update public.bulletins
     set title = 'Blind edit'
     where id = 'bbbbbbbb-eeee-4bbb-8bbb-bbbbbbbbbbbb' $$,
  '42501',
  null,
  'direct bulletin updates are blocked in favor of controlled editing'
);

select lives_ok(
  $$ select public.update_bulletin_controlled(
       'bbbbbbbb-eeee-4bbb-8bbb-bbbbbbbbbbbb',
       1,
       'Training moved again',
       'Use pitch 2.',
       '2026-06-26',
       'urgent',
       'Staff'
     ) $$,
  'staff can update bulletins with the expected version'
);

select results_eq(
  $$ select title, version from public.bulletins where id = 'bbbbbbbb-eeee-4bbb-8bbb-bbbbbbbbbbbb' $$,
  $$ values ('Training moved again'::text, 2::bigint) $$,
  'controlled bulletin update increments the version'
);

select results_eq(
  $$ select count(*)::int from public.audit_events where event_type = 'bulletin_updated' and club_id = 'aaaaaaaa-eeee-4aaa-8aaa-aaaaaaaaaaaa' $$,
  $$ values (1) $$,
  'controlled bulletin update writes an activity event'
);

select throws_ok(
  $$ select public.update_bulletin_controlled(
       'bbbbbbbb-eeee-4bbb-8bbb-bbbbbbbbbbbb',
       1,
       'Stale edit',
       'This should conflict.',
       '2026-06-26',
       'urgent',
       'Staff'
     ) $$,
  '40001',
  null,
  'stale bulletin updates fail with a conflict'
);

select set_config('request.jwt.claim.sub', '33333333-eeee-4333-8333-333333333333', true);

select throws_ok(
  $$ select public.update_bulletin_controlled(
       'bbbbbbbb-eeee-4bbb-8bbb-bbbbbbbbbbbb',
       2,
       'Viewer edit',
       'Viewer cannot edit.',
       '2026-06-26',
       'urgent',
       'Viewer'
     ) $$,
  '42501',
  null,
  'viewer cannot update shared bulletins'
);

select set_config('request.jwt.claim.sub', '22222222-eeee-4222-8222-222222222222', true);

select lives_ok(
  $$ select public.remove_bulletin_controlled('bbbbbbbb-eeee-4bbb-8bbb-bbbbbbbbbbbb', 2) $$,
  'staff can remove a bulletin with the expected version'
);

select * from finish();

rollback;
