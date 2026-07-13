begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

-- Actors -----------------------------------------------------------------------
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('fc000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'ach-player@example.test', now(), now(), now()),
  ('fc000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'ach-other@example.test', now(), now(), now());

insert into public.user_profiles (user_id) values
  ('fc000000-0000-4000-8000-000000000001'),
  ('fc000000-0000-4000-8000-000000000002');

-- Player P has 12 drill completions, 10 workouts, and 5 favorites.
insert into public.player_drill_completions (user_id, drill_id)
  select 'fc000000-0000-4000-8000-000000000001', 'drill-' || g from generate_series(1, 12) g;
insert into public.player_workout_sessions (user_id, kind)
  select 'fc000000-0000-4000-8000-000000000001', 'stopwatch' from generate_series(1, 10) g;
insert into public.player_drill_favorites (user_id, drill_id)
  select 'fc000000-0000-4000-8000-000000000001', 'fav-' || g from generate_series(1, 5) g;

-- === Player P =================================================================
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'fc000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"fc000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

-- First sync at a 3-day streak grants the count-based badges + streak_3.
select ok(
  'workout_10' = any(public.sync_player_achievements(3)),
  'syncing awards a threshold badge and returns the new keys'
);
select is((select count(*)::int from public.player_achievements), 6, 'six badges are earned (drills 1+10, workouts 1+10, favorites, streak_3)');
select is(
  (select exists(select 1 from public.player_achievements where achievement_key = 'streak_7')),
  false,
  'a badge above the current streak is not awarded'
);
select is(
  (select exists(select 1 from public.player_achievements where achievement_key = 'drill_50')),
  false,
  'a badge above the current drill count is not awarded'
);

-- Re-syncing is idempotent.
select public.sync_player_achievements(3);
select is((select count(*)::int from public.player_achievements), 6, 're-syncing does not duplicate badges');

-- A longer streak now unlocks streak_7.
select ok(
  'streak_7' = any(public.sync_player_achievements(7)),
  'passing a longer streak unlocks the streak badge'
);

-- === Another player is isolated ===============================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'fc000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"fc000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);

select is(
  (select coalesce(array_length(public.sync_player_achievements(0), 1), 0)),
  0,
  'a player with no activity earns nothing'
);
select is((select count(*)::int from public.player_achievements), 0, 'a player cannot see another player''s badges');

select finish();
rollback;
