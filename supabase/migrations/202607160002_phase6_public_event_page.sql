-- Phase 6 - Public event page (shareable read-only results).
--
-- An owner can publish an event's results page. Once published, anyone with the
-- link sees a read-only view of teams, fixtures/results, standings/bracket, and
-- scorers - no login. Privacy-first: nothing is public until the owner opts in
-- (is_public defaults false). Public reads go through one security-definer RPC
-- so anon never touches the owner-scoped tables directly, and only non-sensitive
-- competition data is exposed (no emails, no finance).

-- 1) Publish flag -------------------------------------------------------------

alter table public.league_events add column is_public boolean not null default false;

create index league_events_public_idx on public.league_events(registration_code) where is_public;

-- 2) Public read RPC ----------------------------------------------------------

create or replace function public.get_public_event(code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  ev public.league_events%rowtype;
  league_name text;
begin
  select * into ev
  from public.league_events
  where registration_code = upper(btrim(coalesce(code, ''))) and is_public;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  select name into league_name from public.leagues where id = ev.league_id;

  return jsonb_build_object(
    'found', true,
    'leagueName', league_name,
    'event', jsonb_build_object(
      'id', ev.id, 'name', ev.name, 'format', ev.format, 'category', ev.category,
      'status', ev.status, 'starts_on', ev.starts_on, 'ends_on', ev.ends_on
    ),
    'teams', coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at) from public.event_teams t where t.event_id = ev.id), '[]'::jsonb),
    'fixtures', coalesce((select jsonb_agg(to_jsonb(f) order by f.round, f.sequence) from public.event_fixtures f where f.event_id = ev.id), '[]'::jsonb),
    'stats', coalesce((select jsonb_agg(to_jsonb(s) order by s.created_at) from public.fixture_stat_events s where s.event_id = ev.id), '[]'::jsonb)
  );
end;
$$;

-- 3) Grants -------------------------------------------------------------------

grant execute on function public.get_public_event(text) to anon, authenticated;
