begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

-- Actors -----------------------------------------------------------------------
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('ea000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'fi-owner-a@example.test', now(), now(), now()),
  ('ea000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'fi-owner-b@example.test', now(), now(), now());

insert into public.user_profiles (user_id) values
  ('ea000000-0000-4000-8000-000000000001'),
  ('ea000000-0000-4000-8000-000000000002');

select set_config('dumala.persona_change_authorized', 'on', false);
update public.user_profiles set persona = 'league'
where user_id in ('ea000000-0000-4000-8000-000000000001', 'ea000000-0000-4000-8000-000000000002');
select set_config('dumala.persona_change_authorized', 'off', false);

insert into public.user_entitlements (user_id, entitlement) values
  ('ea000000-0000-4000-8000-000000000001', 'league_pilot'),
  ('ea000000-0000-4000-8000-000000000002', 'league_pilot');

-- Owner A's league, event, team, one ledger entry and one unpaid invoice.
insert into public.leagues (id, owner_user_id, name)
values ('ea000000-0000-4000-8000-00000000000a', 'ea000000-0000-4000-8000-000000000001', 'Alpha League');
insert into public.league_seasons (id, league_id, name, status)
values ('ea000000-0000-4000-8000-000000000101', 'ea000000-0000-4000-8000-00000000000a', 'Season 2026', 'active');
insert into public.league_events (id, league_id, season_id, name, registration_code, status)
values ('ea000000-0000-4000-8000-000000000201', 'ea000000-0000-4000-8000-00000000000a', 'ea000000-0000-4000-8000-000000000101', 'Alpha Cup', 'ALPHACUP9', 'active');
insert into public.event_teams (id, event_id, league_id, name)
values ('ea000000-0000-4000-8000-000000000301', 'ea000000-0000-4000-8000-000000000201', 'ea000000-0000-4000-8000-00000000000a', 'Alpha');
insert into public.league_ledger_entries (id, league_id, direction, category, amount_cents)
values ('ea000000-0000-4000-8000-000000000401', 'ea000000-0000-4000-8000-00000000000a', 'income', 'Sponsorship', 100000);
insert into public.event_invoices (id, league_id, event_id, team_id, bill_to, amount_cents)
values ('ea000000-0000-4000-8000-000000000501', 'ea000000-0000-4000-8000-00000000000a', 'ea000000-0000-4000-8000-000000000201', 'ea000000-0000-4000-8000-000000000301', 'Alpha FC', 50000);

-- === Owner A ==================================================================
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ea000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"ea000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

select is((select currency from public.leagues where id = 'ea000000-0000-4000-8000-00000000000a'), 'PHP', 'a league carries a default currency');
select is((select count(*)::int from public.league_ledger_entries), 1, 'a League owner reads their own ledger');
select lives_ok(
  $$ insert into public.league_ledger_entries (league_id, direction, category, amount_cents) values ('ea000000-0000-4000-8000-00000000000a', 'expense', 'Referees', 25000) $$,
  'a League owner can record a ledger entry under RLS'
);
select throws_ok(
  $$ insert into public.league_ledger_entries (league_id, direction, category, amount_cents) values ('ea000000-0000-4000-8000-00000000000a', 'expense', 'Bad', -5) $$,
  '23514',
  null,
  'a negative amount is rejected'
);
select is((select count(*)::int from public.event_invoices), 1, 'a League owner reads their own invoices');
select is(
  (public.settle_invoice('ea000000-0000-4000-8000-000000000501', 'paid', current_date)).status::text,
  'paid',
  'settling an invoice marks it paid'
);
select is((select count(*)::int from public.league_ledger_entries), 3, 'paying an invoice posts a reconciling ledger entry');
-- Re-settle the already-paid invoice: must not post a second ledger entry.
select public.settle_invoice('ea000000-0000-4000-8000-000000000501', 'paid', current_date);
select is((select count(*)::int from public.league_ledger_entries), 3, 're-paying a paid invoice does not double-post');
select throws_ok(
  $$ select public.settle_invoice('ea000000-0000-4000-8000-000000000501', 'unpaid') $$,
  '22023',
  null,
  'settling to an invalid status is rejected'
);

-- === Owner B is isolated ======================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'ea000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"ea000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);

select is((select count(*)::int from public.league_ledger_entries), 0, 'another owner cannot read a ledger they do not own');
select is((select count(*)::int from public.event_invoices), 0, 'another owner cannot read invoices they do not own');
select throws_ok(
  $$ select public.settle_invoice('ea000000-0000-4000-8000-000000000501', 'paid') $$,
  '42501',
  null,
  'a non-owner cannot settle another league''s invoice'
);
select throws_ok(
  $$ insert into public.league_ledger_entries (league_id, direction, category, amount_cents) values ('ea000000-0000-4000-8000-00000000000a', 'income', 'Sneaky', 100) $$,
  '42501',
  null,
  'a non-owner cannot post to another league ledger'
);

select finish();
rollback;
