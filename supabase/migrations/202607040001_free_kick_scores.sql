create table if not exists public.free_kick_scores (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 8),
  score integer not null check (score >= 0),
  mode text not null check (mode in ('freeplay', 'shootout')),
  difficulty text not null check (difficulty in ('Amateur', 'Pro', 'Legend')),
  created_at timestamptz not null default now()
);

alter table public.free_kick_scores enable row level security;

create policy "Public can read free kick scores"
  on public.free_kick_scores
  for select
  to anon, authenticated
  using (true);

create policy "Public can submit free kick scores"
  on public.free_kick_scores
  for insert
  to anon, authenticated
  with check (
    char_length(name) between 1 and 8
    and score >= 0
    and mode in ('freeplay', 'shootout')
    and difficulty in ('Amateur', 'Pro', 'Legend')
  );

create index if not exists free_kick_scores_difficulty_score_created_at_idx
  on public.free_kick_scores (difficulty, score desc, created_at asc);
