begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'owner@example.test', now(), now(), now()),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'admin@example.test', now(), now(), now()),
  ('33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'coach@example.test', now(), now(), now()),
  ('44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'staff@example.test', now(), now(), now()),
  ('55555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'viewer@example.test', now(), now(), now()),
  ('66666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated', 'new-member@example.test', now(), now(), now());

insert into public.user_profiles (user_id, display_name)
values
  ('11111111-1111-4111-8111-111111111111', 'Owner'),
  ('22222222-2222-4222-8222-222222222222', 'Admin'),
  ('33333333-3333-4333-8333-333333333333', 'Coach'),
  ('44444444-4444-4444-8444-444444444444', 'Staff'),
  ('55555555-5555-4555-8555-555555555555', 'Viewer'),
  ('66666666-6666-4666-8666-666666666666', 'New Member');

insert into public.clubs (id, name, owner_user_id)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Role Test Club', '11111111-1111-4111-8111-111111111111');

insert into public.club_memberships (club_id, user_id, role, membership_state)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'owner', 'active'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222', 'admin', 'active'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '33333333-3333-4333-8333-333333333333', 'coach', 'active'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '44444444-4444-4444-8444-444444444444', 'staff', 'active'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '55555555-5555-4555-8555-555555555555', 'viewer', 'active');

select ok(
  public.user_has_club_role(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    array['owner', 'admin']::public.membership_role[],
    '22222222-2222-4222-8222-222222222222'
  ),
  'admin satisfies owner/admin role checks'
);

select ok(
  public.user_can_manage_club_table(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'players',
    '33333333-3333-4333-8333-333333333333'
  ),
  'coach can manage roster player records'
);

select isnt(
  public.user_can_manage_club_table(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'payment_ledger_entries',
    '33333333-3333-4333-8333-333333333333'
  ),
  true,
  'coach cannot manage payment ledger records'
);

select ok(
  public.user_can_manage_club_table(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'bulletins',
    '44444444-4444-4444-8444-444444444444'
  ),
  'staff can manage bulletins'
);

select isnt(
  public.user_can_manage_club_table(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'players',
    '44444444-4444-4444-8444-444444444444'
  ),
  true,
  'staff cannot manage player records'
);

select isnt(
  public.user_can_manage_club_table(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'bulletins',
    '55555555-5555-4555-8555-555555555555'
  ),
  true,
  'viewer cannot manage bulletins'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);

select lives_ok(
  $$ insert into public.club_memberships (club_id, user_id, role, membership_state)
     values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '66666666-6666-4666-8666-666666666666', 'viewer', 'active') $$,
  'admin can create a non-owner membership'
);

select throws_ok(
  $$ insert into public.club_memberships (club_id, user_id, role, membership_state)
     values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '66666666-6666-4666-8666-666666666666', 'owner', 'active') $$,
  '42501',
  null,
  'admin cannot create an owner membership'
);

select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);

select lives_ok(
  $$ insert into public.players (id, club_id, name, roster_number, position, bio, photo_url)
     values ('77777777-7777-4777-8777-777777777777', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Coach Player', 7, 'CM', '', '') $$,
  'coach can insert player records'
);

select throws_ok(
  $$ insert into public.payment_ledger_entries (id, club_id, player_name_snapshot, entry_type, category, amount, currency, entry_date, method)
     values ('88888888-8888-4888-8888-888888888888', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Coach Player', 'payment', 'monthly_fee', 100, 'PHP', '2026-06-25', 'cash') $$,
  '42501',
  null,
  'coach cannot insert payment records'
);

select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);

select lives_ok(
  $$ insert into public.bulletins (id, club_id, title, content, bulletin_date, category, author_snapshot)
     values ('99999999-9999-4999-8999-999999999999', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Training', 'Bring boots', '2026-06-25', 'training', 'Staff') $$,
  'staff can insert bulletin records'
);

select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);

select throws_ok(
  $$ insert into public.bulletins (id, club_id, title, content, bulletin_date, category, author_snapshot)
     values ('aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Viewer', 'Read only', '2026-06-25', 'training', 'Viewer') $$,
  '42501',
  null,
  'viewer cannot insert bulletin records'
);

select * from finish();

rollback;
