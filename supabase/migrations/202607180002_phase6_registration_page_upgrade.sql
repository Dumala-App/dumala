-- Phase 6 - Public tournament registration page upgrade.
--
-- Gives each event an owner-managed registration landing page that can be shared
-- directly as #/register/CODE. The page is separate from the public results page:
-- registration can be open and descriptive before standings/results are public.
-- The metadata is intentionally reusable for a future public tournaments index.

alter table public.league_events
  add column if not exists registration_page_enabled boolean not null default true,
  add column if not exists registration_headline text,
  add column if not exists registration_details text,
  add column if not exists registration_contact_note text,
  add column if not exists registration_terms text,
  add constraint league_events_registration_headline_check
    check (registration_headline is null or char_length(registration_headline) <= 180),
  add constraint league_events_registration_details_check
    check (registration_details is null or char_length(registration_details) <= 4000),
  add constraint league_events_registration_contact_note_check
    check (registration_contact_note is null or char_length(registration_contact_note) <= 1000),
  add constraint league_events_registration_terms_check
    check (registration_terms is null or char_length(registration_terms) <= 2000);

create index if not exists league_events_registration_page_idx
on public.league_events(registration_page_enabled, status, starts_on)
where registration_page_enabled;

create or replace function public.lookup_event_registration(code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  ev public.league_events%rowtype;
  lg public.leagues%rowtype;
  approved_count integer;
begin
  select * into ev from public.league_events where registration_code = upper(btrim(coalesce(code, '')));
  if not found or not ev.registration_page_enabled then
    return jsonb_build_object('found', false);
  end if;

  select * into lg from public.leagues where id = ev.league_id;
  select count(*) into approved_count from public.event_registrations where event_id = ev.id and status = 'approved';

  return jsonb_build_object(
    'found', true,
    'open', ev.status = 'registration_open',
    'eventId', ev.id,
    'leagueId', ev.league_id,
    'leagueName', lg.name,
    'leagueLocation', lg.location,
    'name', ev.name,
    'category', ev.category,
    'format', ev.format,
    'teamCap', ev.team_cap,
    'spotsRemaining', case when ev.team_cap is null then null else greatest(0, ev.team_cap - approved_count) end,
    'status', ev.status,
    'startsOn', ev.starts_on,
    'endsOn', ev.ends_on,
    'headline', ev.registration_headline,
    'details', ev.registration_details,
    'contactNote', ev.registration_contact_note,
    'terms', ev.registration_terms,
    'eligibilityRules', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id,
        'target', r.target,
        'title', r.title,
        'description', r.description,
        'minAge', r.min_age,
        'maxAge', r.max_age
      ) order by r.created_at)
      from public.league_eligibility_rules r
      where r.league_id = ev.league_id
        and (
          r.scope = 'league'
          or (r.scope = 'season' and r.season_id = ev.season_id)
          or (r.scope = 'event' and r.event_id = ev.id)
        )
    ), '[]'::jsonb),
    'documentRequirements', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id,
        'target', d.target,
        'title', d.title,
        'instructions', d.instructions,
        'required', d.required,
        'expires', d.expires
      ) order by d.required desc, d.created_at)
      from public.league_document_requirements d
      where d.league_id = ev.league_id
        and (
          d.scope = 'league'
          or (d.scope = 'season' and d.season_id = ev.season_id)
          or (d.scope = 'event' and d.event_id = ev.id)
        )
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.lookup_event_registration(text) to anon, authenticated;
