begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('11111111-bbbb-4111-8111-111111111111', 'authenticated', 'authenticated', 'marketing-owner@example.test', now(), now(), now()),
  ('22222222-bbbb-4222-8222-222222222222', 'authenticated', 'authenticated', 'marketing-coach@example.test', now(), now(), now());

insert into public.app_admins (user_id, role)
values ('11111111-bbbb-4111-8111-111111111111', 'owner');

-- One live promotion, one deactivated, one scheduled for the future.
insert into public.promotions (id, name, headline, discount_type, discount_value, starts_at, ends_at, is_active)
values
  ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaa1', 'Season kickoff sale', '20% off Premium', 'percent', 20, now() - interval '1 day', now() + interval '7 days', true),
  ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaa2', 'Old sale', null, 'percent', 10, now() - interval '30 days', null, false),
  ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaa3', 'Future sale', null, 'fixed', 100, now() + interval '2 days', null, true);

-- One live published announcement and one draft.
insert into public.announcements (id, title, body, kind, is_published, starts_at)
values
  ('bbbbbbbb-1111-4111-8111-bbbbbbbbbbb1', 'Maintenance window', 'Dumala will be briefly unavailable on Sunday.', 'maintenance', true, now() - interval '1 hour'),
  ('bbbbbbbb-1111-4111-8111-bbbbbbbbbbb2', 'Unfinished draft', 'Not ready for users yet.', 'info', false, now() - interval '1 hour');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

-- Ordinary signed-in coach: only live rows are visible, and writes are denied.
select set_config('request.jwt.claim.sub', '22222222-bbbb-4222-8222-222222222222', true);
select set_config('request.jwt.claims', '{"sub":"22222222-bbbb-4222-8222-222222222222","role":"authenticated","aal":"aal1"}', true);

select is(
  (select count(*) from public.promotions),
  1::bigint,
  'non-admin sees only active, in-window promotions'
);

select is(
  (select count(*) from public.announcements),
  1::bigint,
  'non-admin sees only published, in-window announcements'
);

select throws_ok(
  $$ insert into public.promotions (name, discount_type, discount_value) values ('Rogue sale', 'percent', 50) $$,
  '42501',
  null,
  'non-admin cannot create promotions'
);

-- Update attempts silently match zero rows under RLS; verify below as admin.
update public.announcements set title = 'Hacked title' where id = 'bbbbbbbb-1111-4111-8111-bbbbbbbbbbb1';

-- Owner admin: full visibility and write access.
select set_config('request.jwt.claim.sub', '11111111-bbbb-4111-8111-111111111111', true);
select set_config('request.jwt.claims', '{"sub":"11111111-bbbb-4111-8111-111111111111","role":"authenticated","aal":"aal2"}', true);

select is(
  (select title from public.announcements where id = 'bbbbbbbb-1111-4111-8111-bbbbbbbbbbb1'),
  'Maintenance window',
  'non-admin update attempt left the announcement unchanged'
);

select is(
  (select count(*) from public.promotions),
  3::bigint,
  'app admin sees every promotion regardless of status'
);

select lives_ok(
  $$ insert into public.announcements (title, body, kind, is_published) values ('New feature', 'Marketing tab is live.', 'feature', true) $$,
  'app admin can create announcements'
);

select finish();
rollback;
