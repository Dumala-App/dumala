begin;

create extension if not exists pgtap with schema extensions;

select plan(7);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('11111111-ffff-4111-8111-111111111111', 'authenticated', 'authenticated', 'owner.concurrent@example.test', now(), now(), now()),
  ('22222222-ffff-4222-8222-222222222222', 'authenticated', 'authenticated', 'coach.concurrent@example.test', now(), now(), now()),
  ('33333333-ffff-4333-8333-333333333333', 'authenticated', 'authenticated', 'viewer.concurrent@example.test', now(), now(), now());

insert into public.user_profiles (user_id, display_name)
values
  ('11111111-ffff-4111-8111-111111111111', 'Owner'),
  ('22222222-ffff-4222-8222-222222222222', 'Coach'),
  ('33333333-ffff-4333-8333-333333333333', 'Viewer');

insert into public.clubs (id, name, owner_user_id)
values ('aaaaaaaa-ffff-4aaa-8aaa-aaaaaaaaaaaa', 'Concurrent Test Club', '11111111-ffff-4111-8111-111111111111');

insert into public.club_memberships (club_id, user_id, role, membership_state)
values
  ('aaaaaaaa-ffff-4aaa-8aaa-aaaaaaaaaaaa', '11111111-ffff-4111-8111-111111111111', 'owner', 'active'),
  ('aaaaaaaa-ffff-4aaa-8aaa-aaaaaaaaaaaa', '22222222-ffff-4222-8222-222222222222', 'coach', 'active'),
  ('aaaaaaaa-ffff-4aaa-8aaa-aaaaaaaaaaaa', '33333333-ffff-4333-8333-333333333333', 'viewer', 'active');

insert into public.players (id, club_id, name, roster_number, position, bio, photo_url)
values ('bbbbbbbb-ffff-4bbb-8bbb-bbbbbbbbbbbb', 'aaaaaaaa-ffff-4aaa-8aaa-aaaaaaaaaaaa', 'Original Player', 10, 'CM', '', '');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '22222222-ffff-4222-8222-222222222222', true);

select throws_ok(
  $$ update public.players
     set name = 'Blind overwrite'
     where id = 'bbbbbbbb-ffff-4bbb-8bbb-bbbbbbbbbbbb' $$,
  '42501',
  null,
  'direct updates to versioned records are blocked'
);

select lives_ok(
  $$ select public.apply_controlled_record_update(
       'players',
       'bbbbbbbb-ffff-4bbb-8bbb-bbbbbbbbbbbb',
       1,
       '{"name":"Controlled Player","bio":"Updated safely"}'::jsonb
     ) $$,
  'controlled update succeeds with the current version'
);

select results_eq(
  $$ select name, bio, version from public.players where id = 'bbbbbbbb-ffff-4bbb-8bbb-bbbbbbbbbbbb' $$,
  $$ values ('Controlled Player'::text, 'Updated safely'::text, 2::bigint) $$,
  'controlled update applies the patch and increments version'
);

select results_eq(
  $$ select count(*)::int
     from public.audit_events
     where club_id = 'aaaaaaaa-ffff-4aaa-8aaa-aaaaaaaaaaaa'
       and user_id = '22222222-ffff-4222-8222-222222222222'
       and event_type = 'record_updated'
       and metadata->>'entityTable' = 'players' $$,
  $$ values (1) $$,
  'controlled update writes a redacted activity event'
);

select throws_ok(
  $$ select public.apply_controlled_record_update(
       'players',
       'bbbbbbbb-ffff-4bbb-8bbb-bbbbbbbbbbbb',
       1,
       '{"name":"Stale overwrite"}'::jsonb
     ) $$,
  '40001',
  null,
  'stale controlled update fails instead of overwriting'
);

select throws_ok(
  $$ select public.apply_controlled_record_update(
       'players',
       'bbbbbbbb-ffff-4bbb-8bbb-bbbbbbbbbbbb',
       2,
       '{"club_id":"aaaaaaaa-ffff-4aaa-8aaa-aaaaaaaaaaaa"}'::jsonb
     ) $$,
  '22023',
  null,
  'controlled update rejects protected fields'
);

select set_config('request.jwt.claim.sub', '33333333-ffff-4333-8333-333333333333', true);

select throws_ok(
  $$ select public.apply_controlled_record_update(
       'players',
       'bbbbbbbb-ffff-4bbb-8bbb-bbbbbbbbbbbb',
       2,
       '{"name":"Viewer overwrite"}'::jsonb
     ) $$,
  '42501',
  null,
  'viewer cannot use controlled updates for managed records'
);

select * from finish();

rollback;
