begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

-- Actors + data ----------------------------------------------------------------
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('ef000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'team-owner@example.test', now(), now(), now()),
  ('ef000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'team-attacker@example.test', now(), now(), now());
insert into public.user_profiles (user_id) values
  ('ef000000-0000-4000-8000-000000000001'),
  ('ef000000-0000-4000-8000-000000000002');

insert into public.clubs (id, name, short_name, founded, stadium, league, logo_url, owner_user_id)
values
  ('ef000000-0000-4000-8000-00000000000a', 'Blue Eagles FC', 'BEFC', '2019', 'Rizal Field', 'Sunday League', 'data:image/webp;base64,Y3Jlc3Q=', 'ef000000-0000-4000-8000-000000000001'),
  ('ef000000-0000-4000-8000-00000000000b', 'Attacker United', 'AU', null, null, null, null, 'ef000000-0000-4000-8000-000000000002');
insert into public.club_memberships (club_id, user_id, role, membership_state)
values
  ('ef000000-0000-4000-8000-00000000000a', 'ef000000-0000-4000-8000-000000000001', 'owner', 'active'),
  ('ef000000-0000-4000-8000-00000000000b', 'ef000000-0000-4000-8000-000000000002', 'owner', 'active');

-- Roster: one active player, one deleted player, one suspended player.
insert into public.players (id, club_id, name, roster_number, position, bio, photo_url, coach_notes, date_of_birth, registration_status, deleted_at)
values
  ('ef000000-0000-4000-8000-000000000101', 'ef000000-0000-4000-8000-00000000000a', 'Miguel Santos', 9, 'Forward', 'Private bio', 'data:image/jpeg;base64,私', 'Private note', '2008-01-01', 'active', null),
  ('ef000000-0000-4000-8000-000000000102', 'ef000000-0000-4000-8000-00000000000a', 'Deleted Player', 10, 'Midfielder', '', '', null, null, 'active', now()),
  ('ef000000-0000-4000-8000-000000000103', 'ef000000-0000-4000-8000-00000000000a', 'Suspended Player', 11, 'Defender', '', '', null, null, 'suspended', null);

-- Staff: one active with private contact details, one inactive.
insert into public.staff_members (id, club_id, name, role, bio, photo_url, email, phone, status)
values
  ('ef000000-0000-4000-8000-000000000201', 'ef000000-0000-4000-8000-00000000000a', 'Coach Reyes', 'Coach', '', '', 'coach@example.test', '+63 900 000 0000', 'active'),
  ('ef000000-0000-4000-8000-000000000202', 'ef000000-0000-4000-8000-00000000000a', 'Former Staff', 'Manager', '', '', null, null, 'inactive');

-- Tactics: latest workspace with one starter (ratings must stay private).
insert into public.tactics_workspaces (id, club_id, match_format, formation, playstyle)
values ('ef000000-0000-4000-8000-000000000301', 'ef000000-0000-4000-8000-00000000000a', '11v11', '4-3-3', 'Possession');
insert into public.tactics_lineup_assignments (
  id, club_id, tactics_workspace_id, slot_id, player_id,
  player_name_snapshot, position_snapshot, rating_snapshot, condition_snapshot
) values (
  'ef000000-0000-4000-8000-000000000401', 'ef000000-0000-4000-8000-00000000000a', 'ef000000-0000-4000-8000-000000000301',
  'ST-1', 'ef000000-0000-4000-8000-000000000101', 'Miguel Santos', 'ST', 87, 'fit'
);

-- Games: one completed match, one training session (never public), one upcoming.
insert into public.games (id, club_id, opponent, event_date, status, type, our_score, opponent_score, notes)
values
  ('ef000000-0000-4000-8000-000000000501', 'ef000000-0000-4000-8000-00000000000a', 'Red Lions', '2026-07-05', 'completed', 'league', 3, 1, 'Private match note'),
  ('ef000000-0000-4000-8000-000000000502', 'ef000000-0000-4000-8000-00000000000a', 'Training', '2026-07-08', 'completed', 'training', null, null, null),
  ('ef000000-0000-4000-8000-000000000503', 'ef000000-0000-4000-8000-00000000000a', 'Green Hawks', '2026-08-01', 'upcoming', 'league', null, null, null);

-- === Owner manages their page ==================================================
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'ef000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"ef000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

select lives_ok(
  $$ insert into public.club_public_pages (club_id, slug, headline, team_photo, is_public)
     values ('ef000000-0000-4000-8000-00000000000a', 'phase6-public-eagles', 'Sunday league champions 2026', 'data:image/webp;base64,dGVhbQ==', true) $$,
  'a club owner can create and publish their public page'
);

select throws_ok(
  $$ update public.club_public_pages set slug = 'Bad Slug!' where club_id = 'ef000000-0000-4000-8000-00000000000a' $$,
  '23514',
  null,
  'slugs must be lowercase letters, digits, and hyphens'
);

select throws_ok(
  $$ update public.club_public_pages set team_photo = 'https://evil.example/pixel.png' where club_id = 'ef000000-0000-4000-8000-00000000000a' $$,
  '23514',
  null,
  'the team photo must be an inline image data URL'
);

select throws_ok(
  $$ update public.club_public_pages set team_photo = 'data:image/webp;base64,' || repeat('A', 400001) where club_id = 'ef000000-0000-4000-8000-00000000000a' $$,
  '23514',
  null,
  'oversized team photos are rejected server-side'
);

-- === Attacker ==================================================================
select set_config('request.jwt.claim.sub', 'ef000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"ef000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);

select throws_ok(
  $$ insert into public.club_public_pages (club_id, slug) values ('ef000000-0000-4000-8000-00000000000a', 'stolen-page') $$,
  '42501',
  null,
  'an outsider cannot create a page for another club'
);

select is(
  (select count(*)::int from public.club_public_pages where club_id = 'ef000000-0000-4000-8000-00000000000a'),
  0,
  'an outsider cannot read another club''s page settings'
);

select throws_ok(
  $$ insert into public.club_public_pages (club_id, slug) values ('ef000000-0000-4000-8000-00000000000b', 'phase6-public-eagles') $$,
  '23505',
  null,
  'slugs are globally unique across clubs'
);

-- === Anonymous visitor =========================================================
set local role anon;

select is(
  public.get_public_team('phase6-public-eagles')->>'found',
  'true',
  'anyone can read a published team page without logging in'
);
select is(
  public.get_public_team('  Phase6-Public-Eagles  ')->>'found',
  'true',
  'slug lookup is trimmed and case-insensitive'
);
select is(
  public.get_public_team('phase6-public-eagles')->'club'->>'name',
  'Blue Eagles FC',
  'the public bundle includes the club profile'
);
select is(
  public.get_public_team('phase6-public-eagles')->'club'->>'logoUrl',
  'data:image/webp;base64,Y3Jlc3Q=',
  'the public bundle includes the club logo'
);
select is(
  public.get_public_team('phase6-public-eagles')->'page'->>'headline',
  'Sunday league champions 2026',
  'the public bundle includes the headline'
);
select is(
  jsonb_array_length(public.get_public_team('phase6-public-eagles')->'roster'),
  1,
  'the roster excludes soft-deleted and non-active players'
);
select ok(
  not (public.get_public_team('phase6-public-eagles')->'roster'->0 ?| array['photo_url', 'coach_notes', 'date_of_birth', 'bio', 'base_attributes', 'id']),
  'public roster rows expose only name, number, and position'
);
select is(
  jsonb_array_length(public.get_public_team('phase6-public-eagles')->'staff'),
  1,
  'the staff list excludes inactive staff'
);
select ok(
  not (public.get_public_team('phase6-public-eagles')->'staff'->0 ?| array['email', 'phone', 'bio', 'id']),
  'public staff rows expose only name and role'
);
select is(
  public.get_public_team('phase6-public-eagles')->'lineup'->>'formation',
  '4-3-3',
  'the public bundle includes the latest formation'
);
select ok(
  not (public.get_public_team('phase6-public-eagles')->'lineup'->'starters'->0 ?| array['rating_snapshot', 'condition_snapshot', 'player_id']),
  'public lineup slots omit ratings, condition, and player ids'
);
select is(
  jsonb_array_length(public.get_public_team('phase6-public-eagles')->'results'),
  1,
  'results include only completed matches (never training or upcoming games)'
);
select ok(
  not (public.get_public_team('phase6-public-eagles')->'results'->0 ?| array['notes', 'location', 'id']),
  'public results omit private match notes'
);
select is(
  public.get_public_team('unknown-team')->>'found',
  'false',
  'an unknown slug returns not found'
);

select throws_ok(
  $$ select count(*)::int from public.club_public_pages $$,
  '42501',
  null,
  'anonymous direct reads of the page settings table are blocked'
);

select finish();
rollback;
