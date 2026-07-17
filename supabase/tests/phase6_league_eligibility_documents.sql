begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('ed000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'ed-owner-a@example.test', now(), now(), now()),
  ('ed000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'ed-owner-b@example.test', now(), now(), now());

insert into public.user_profiles (user_id) values
  ('ed000000-0000-4000-8000-000000000001'),
  ('ed000000-0000-4000-8000-000000000002');

select set_config('dumala.persona_change_authorized', 'on', false);
update public.user_profiles set persona = 'league'
where user_id in ('ed000000-0000-4000-8000-000000000001', 'ed000000-0000-4000-8000-000000000002');
select set_config('dumala.persona_change_authorized', 'off', false);

insert into public.user_entitlements (user_id, entitlement) values
  ('ed000000-0000-4000-8000-000000000001', 'league_pilot'),
  ('ed000000-0000-4000-8000-000000000002', 'league_pilot');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ed000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"ed000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

insert into public.leagues (id, owner_user_id, name)
values ('ed000000-0000-4000-8000-00000000000a', 'ed000000-0000-4000-8000-000000000001', 'Alpha League');
insert into public.league_seasons (id, league_id, name)
values ('ed000000-0000-4000-8000-000000000101', 'ed000000-0000-4000-8000-00000000000a', 'Season 2026');
insert into public.league_events (id, league_id, season_id, name, registration_code)
values ('ed000000-0000-4000-8000-000000000201', 'ed000000-0000-4000-8000-00000000000a', 'ed000000-0000-4000-8000-000000000101', 'Alpha Cup', 'ALPHAED');

select lives_ok(
  $$ insert into public.league_eligibility_rules (id, league_id, season_id, scope, target, title, min_age, max_age)
     values ('ed000000-0000-4000-8000-000000000301', 'ed000000-0000-4000-8000-00000000000a', 'ed000000-0000-4000-8000-000000000101', 'season', 'player', 'U14 age window', 11, 14) $$,
  'owner can create a season-scoped eligibility rule'
);

select lives_ok(
  $$ insert into public.league_document_requirements (id, league_id, event_id, scope, target, title, instructions, expires)
     values ('ed000000-0000-4000-8000-000000000401', 'ed000000-0000-4000-8000-00000000000a', 'ed000000-0000-4000-8000-000000000201', 'event', 'team', 'Signed waiver', 'Upload the signed team waiver.', true) $$,
  'owner can create an event-scoped document requirement'
);

select is((select count(*)::int from public.league_eligibility_rules), 1, 'owner reads own eligibility rules');
select is((select count(*)::int from public.league_document_requirements), 1, 'owner reads own document requirements');

select throws_ok(
  $$ insert into public.league_eligibility_rules (league_id, scope, target, title, min_age, max_age)
     values ('ed000000-0000-4000-8000-00000000000a', 'league', 'player', 'Bad age window', 16, 12) $$,
  '23514',
  null,
  'age maximum cannot be below minimum'
);

select throws_ok(
  $$ insert into public.league_document_requirements (league_id, scope, event_id, target, title)
     values ('ed000000-0000-4000-8000-00000000000a', 'league', 'ed000000-0000-4000-8000-000000000201', 'team', 'Invalid scope') $$,
  '23514',
  null,
  'league-scoped documents cannot point at an event'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'ed000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"ed000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);

select is((select count(*)::int from public.league_eligibility_rules), 0, 'another owner cannot read eligibility rules');
select is((select count(*)::int from public.league_document_requirements), 0, 'another owner cannot read document requirements');
select throws_ok(
  $$ insert into public.league_eligibility_rules (league_id, scope, target, title)
     values ('ed000000-0000-4000-8000-00000000000a', 'league', 'team', 'Sneaky rule') $$,
  '42501',
  null,
  'another owner cannot create eligibility rules for a league they do not own'
);
select throws_ok(
  $$ insert into public.league_document_requirements (league_id, scope, target, title)
     values ('ed000000-0000-4000-8000-00000000000a', 'league', 'team', 'Sneaky document') $$,
  '42501',
  null,
  'another owner cannot create document requirements for a league they do not own'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'ed000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"ed000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

select lives_ok(
  $$ update public.league_eligibility_rules
     set title = 'Updated age window'
     where id = 'ed000000-0000-4000-8000-000000000301' $$,
  'owner can update eligibility rules'
);
select lives_ok(
  $$ delete from public.league_document_requirements
     where id = 'ed000000-0000-4000-8000-000000000401' $$,
  'owner can delete document requirements'
);

select is((select count(*)::int from public.league_document_requirements), 0, 'deleted document requirement is gone');
select is((select title from public.league_eligibility_rules where id = 'ed000000-0000-4000-8000-000000000301'), 'Updated age window', 'updated rule persists');

select finish();
rollback;
