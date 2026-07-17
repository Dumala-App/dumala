-- Phase 6 - League eligibility rules and required documents.
--
-- League owners can define competition rules and document requirements at
-- league, season, or event scope. These are configuration records only: uploads,
-- review queues, and expiry reminders arrive with the deeper roster/documents
-- workflow.

create type public.league_requirement_scope as enum ('league', 'season', 'event');
create type public.league_requirement_target as enum ('team', 'player', 'coach', 'staff');

create unique index if not exists league_seasons_id_league_id_uidx
on public.league_seasons(id, league_id);

create table public.league_eligibility_rules (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  season_id uuid references public.league_seasons(id) on delete cascade,
  event_id uuid references public.league_events(id) on delete cascade,
  scope public.league_requirement_scope not null default 'league',
  target public.league_requirement_target not null default 'team',
  title text not null,
  description text,
  min_age integer,
  max_age integer,
  effective_from date,
  effective_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint league_eligibility_rules_title_check check (char_length(title) between 2 and 160),
  constraint league_eligibility_rules_description_check check (description is null or char_length(description) <= 2000),
  constraint league_eligibility_rules_age_check check (
    (min_age is null or min_age between 0 and 99)
    and (max_age is null or max_age between 0 and 99)
    and (min_age is null or max_age is null or max_age >= min_age)
  ),
  constraint league_eligibility_rules_date_check check (effective_until is null or effective_from is null or effective_until >= effective_from),
  constraint league_eligibility_rules_scope_check check (
    (scope = 'league' and season_id is null and event_id is null)
    or (scope = 'season' and season_id is not null and event_id is null)
    or (scope = 'event' and event_id is not null)
  )
);

create trigger league_eligibility_rules_set_updated_at
before update on public.league_eligibility_rules
for each row execute function public.set_updated_at();

create index league_eligibility_rules_league_scope_idx
on public.league_eligibility_rules(league_id, scope, target);

alter table public.league_eligibility_rules
  add constraint league_eligibility_rules_season_league_fk
  foreign key (season_id, league_id)
  references public.league_seasons(id, league_id)
  on delete cascade,
  add constraint league_eligibility_rules_event_league_fk
  foreign key (event_id, league_id)
  references public.league_events(id, league_id)
  on delete cascade;

create table public.league_document_requirements (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  season_id uuid references public.league_seasons(id) on delete cascade,
  event_id uuid references public.league_events(id) on delete cascade,
  scope public.league_requirement_scope not null default 'league',
  target public.league_requirement_target not null default 'team',
  title text not null,
  instructions text,
  required boolean not null default true,
  expires boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint league_document_requirements_title_check check (char_length(title) between 2 and 160),
  constraint league_document_requirements_instructions_check check (instructions is null or char_length(instructions) <= 2000),
  constraint league_document_requirements_scope_check check (
    (scope = 'league' and season_id is null and event_id is null)
    or (scope = 'season' and season_id is not null and event_id is null)
    or (scope = 'event' and event_id is not null)
  )
);

create trigger league_document_requirements_set_updated_at
before update on public.league_document_requirements
for each row execute function public.set_updated_at();

create index league_document_requirements_league_scope_idx
on public.league_document_requirements(league_id, scope, target);

alter table public.league_document_requirements
  add constraint league_document_requirements_season_league_fk
  foreign key (season_id, league_id)
  references public.league_seasons(id, league_id)
  on delete cascade,
  add constraint league_document_requirements_event_league_fk
  foreign key (event_id, league_id)
  references public.league_events(id, league_id)
  on delete cascade;

alter table public.league_eligibility_rules enable row level security;
alter table public.league_document_requirements enable row level security;

create policy "owners read own eligibility rules"
on public.league_eligibility_rules for select to authenticated
using (public.owns_league(league_id));
create policy "owners create own eligibility rules"
on public.league_eligibility_rules for insert to authenticated
with check (public.owns_league(league_id));
create policy "owners update own eligibility rules"
on public.league_eligibility_rules for update to authenticated
using (public.owns_league(league_id))
with check (public.owns_league(league_id));
create policy "owners delete own eligibility rules"
on public.league_eligibility_rules for delete to authenticated
using (public.owns_league(league_id));

create policy "owners read own document requirements"
on public.league_document_requirements for select to authenticated
using (public.owns_league(league_id));
create policy "owners create own document requirements"
on public.league_document_requirements for insert to authenticated
with check (public.owns_league(league_id));
create policy "owners update own document requirements"
on public.league_document_requirements for update to authenticated
using (public.owns_league(league_id))
with check (public.owns_league(league_id));
create policy "owners delete own document requirements"
on public.league_document_requirements for delete to authenticated
using (public.owns_league(league_id));

grant select, insert, update, delete on public.league_eligibility_rules to authenticated;
grant select, insert, update, delete on public.league_document_requirements to authenticated;
