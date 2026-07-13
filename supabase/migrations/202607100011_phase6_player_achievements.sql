-- Phase 6 - Player engagement: achievements / badges.
--
-- Milestone badges earned from a player's own activity (drills completed,
-- workouts logged, favorites, and the current streak). Counts are computed
-- server-side from the caller's own rows; the streak (which depends on the
-- device's local day boundaries) is passed in by the client. Grants are
-- idempotent, so the client can call sync on every load. The thresholds here are
-- mirrored by the display catalog in src/player/achievements.ts — keep them in
-- sync. Built on the player engagement tables (202607100003).

create table public.player_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_key text not null,
  earned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, achievement_key),
  constraint player_achievements_key_check check (char_length(achievement_key) between 1 and 60)
);

alter table public.player_achievements enable row level security;

-- A player reads only their own badges. Inserts happen only through the definer
-- RPC below (there is no INSERT policy), so a client cannot self-grant arbitrary
-- badges — the RPC re-derives the counts from the caller's own data.
create policy "players read own achievements"
on public.player_achievements for select to authenticated
using (user_id = auth.uid());

grant select on public.player_achievements to authenticated;

-- Grant any newly-earned achievements for the calling player; returns the keys
-- that were awarded on this call (empty when nothing new).
create or replace function public.sync_player_achievements(p_streak integer default 0)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  drills integer;
  workouts integer;
  favorites integer;
  streak integer := greatest(coalesce(p_streak, 0), 0);
  new_keys text[];
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select count(*) into drills from public.player_drill_completions where user_id = auth.uid();
  select count(*) into workouts from public.player_workout_sessions where user_id = auth.uid();
  select count(*) into favorites from public.player_drill_favorites where user_id = auth.uid();

  with defs(key, val, threshold) as (
    values
      ('first_touch', drills, 1),
      ('drill_10', drills, 10),
      ('drill_50', drills, 50),
      ('first_workout', workouts, 1),
      ('workout_10', workouts, 10),
      ('streak_3', streak, 3),
      ('streak_7', streak, 7),
      ('collector', favorites, 5)
  ),
  ins as (
    insert into public.player_achievements (user_id, achievement_key)
    select auth.uid(), d.key from defs d where d.val >= d.threshold
    on conflict (user_id, achievement_key) do nothing
    returning achievement_key
  )
  select coalesce(array_agg(achievement_key), '{}') into new_keys from ins;

  return new_keys;
end;
$$;

grant execute on function public.sync_player_achievements(integer) to authenticated;
