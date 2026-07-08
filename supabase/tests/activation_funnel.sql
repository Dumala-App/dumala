begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('11111111-aaaa-4111-8111-111111111111', 'authenticated', 'authenticated', 'activation-owner@example.test', now(), now(), now()),
  ('22222222-aaaa-4222-8222-222222222222', 'authenticated', 'authenticated', 'activation-coach-a@example.test', now(), now(), now()),
  ('33333333-aaaa-4333-8333-333333333333', 'authenticated', 'authenticated', 'activation-coach-b@example.test', now(), now(), now());

insert into public.app_admins (user_id, role)
values ('11111111-aaaa-4111-8111-111111111111', 'owner');

-- Coach A reached roster + schedule; Coach B reached roster only.
insert into public.app_usage_events (user_id, event_type, feature_name, created_at)
values
  ('22222222-aaaa-4222-8222-222222222222', 'activation_milestone', 'roster', now()),
  ('22222222-aaaa-4222-8222-222222222222', 'activation_milestone', 'schedule', now()),
  ('33333333-aaaa-4333-8333-333333333333', 'activation_milestone', 'roster', now()),
  -- A duplicate roster event for coach A must not double-count the user.
  ('22222222-aaaa-4222-8222-222222222222', 'activation_milestone', 'roster', now());

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config('request.jwt.claim.sub', '11111111-aaaa-4111-8111-111111111111', true);
select set_config('request.jwt.claims', '{"sub":"11111111-aaaa-4111-8111-111111111111","role":"authenticated","aal":"aal2"}', true);

select ok(
  public.get_activation_funnel_v1(30) @> '[{"step":"roster","users":2}]'::jsonb,
  'roster step counts two distinct users, de-duplicated'
);

select ok(
  public.get_activation_funnel_v1(30) @> '[{"step":"schedule","users":1}]'::jsonb,
  'schedule step counts one distinct user'
);

select ok(
  public.get_activation_funnel_v1(30) @> '[{"step":"report","users":0}]'::jsonb,
  'report step has no activations yet'
);

-- Ordinary signed-in coach cannot read the funnel.
select set_config('request.jwt.claim.sub', '22222222-aaaa-4222-8222-222222222222', true);
select set_config('request.jwt.claims', '{"sub":"22222222-aaaa-4222-8222-222222222222","role":"authenticated","aal":"aal2"}', true);

select throws_ok(
  $$ select public.get_activation_funnel_v1(30) $$,
  '42501',
  null,
  'non-admin cannot read the activation funnel'
);

select finish();
rollback;
