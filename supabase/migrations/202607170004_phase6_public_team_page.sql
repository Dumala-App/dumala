-- Phase 6 - Public team page (a coach's shareable one-pager).
--
-- A club owner/admin can publish a public, read-only showcase page for their
-- team at dumala.asia/#/t/<slug>. Privacy-first: nothing is public until the
-- coach opts in (is_public defaults false). Anonymous reads go through one
-- security-definer RPC that returns only showcase-safe fields - no emails or
-- phone numbers, no coach notes, no player ratings or birthdates, no payments.
-- Storage-conscious: exactly one team photo per club, compressed client-side
-- to a small WebP data URL and hard-capped here so the database cannot bloat.

-- 1) Page settings -------------------------------------------------------------

create table public.club_public_pages (
  club_id uuid primary key references public.clubs(id) on delete cascade,
  is_public boolean not null default false,
  slug text not null,
  headline text,
  team_photo text,
  show_roster boolean not null default true,
  show_staff boolean not null default true,
  show_lineup boolean not null default true,
  show_results boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint club_public_pages_slug_unique unique (slug),
  -- Lowercase letters, digits, and hyphens; 3-32 chars; no edge hyphens.
  constraint club_public_pages_slug_format_check check (slug ~ '^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$'),
  constraint club_public_pages_headline_length_check check (headline is null or char_length(headline) <= 160),
  -- One ~200 KB image compressed client-side. Base64 data URLs are ~4/3 of the
  -- binary size, so 400k characters is the hard server-side ceiling.
  constraint club_public_pages_photo_size_check check (team_photo is null or length(team_photo) <= 400000),
  constraint club_public_pages_photo_format_check check (team_photo is null or team_photo like 'data:image/%')
);

create index club_public_pages_public_slug_idx on public.club_public_pages(slug) where is_public;

create trigger club_public_pages_set_updated_at
before update on public.club_public_pages
for each row execute function public.set_updated_at();

-- 2) Row level security --------------------------------------------------------

alter table public.club_public_pages enable row level security;

create policy "club members read own public page settings"
on public.club_public_pages for select to authenticated
using (public.is_active_club_member(club_id));

create policy "club managers create public page"
on public.club_public_pages for insert to authenticated
with check (public.user_has_club_role(club_id, array['owner', 'admin']::public.membership_role[]));

create policy "club managers update public page"
on public.club_public_pages for update to authenticated
using (public.user_has_club_role(club_id, array['owner', 'admin']::public.membership_role[]))
with check (public.user_has_club_role(club_id, array['owner', 'admin']::public.membership_role[]));

create policy "club managers delete public page"
on public.club_public_pages for delete to authenticated
using (public.user_has_club_role(club_id, array['owner', 'admin']::public.membership_role[]));

grant select, insert, update, delete on public.club_public_pages to authenticated;

-- 3) Public read RPC ------------------------------------------------------------

create or replace function public.get_public_team(page_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  page public.club_public_pages%rowtype;
  club public.clubs%rowtype;
  lineup_workspace public.tactics_workspaces%rowtype;
  lineup_formation text;
  lineup_match_format text;
  lineup_starters jsonb := '[]'::jsonb;
begin
  select * into page
  from public.club_public_pages
  where slug = lower(btrim(coalesce(page_slug, ''))) and is_public;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  select * into club
  from public.clubs
  where id = page.club_id and club_state = 'active';

  if not found then
    return jsonb_build_object('found', false);
  end if;

  if page.show_lineup then
    select * into lineup_workspace
    from public.tactics_workspaces
    where club_id = club.id and deleted_at is null
    order by updated_at desc
    limit 1;

    if found then
      lineup_formation := lineup_workspace.formation;
      lineup_match_format := lineup_workspace.match_format;
      -- Name + position snapshots only; ratings and condition stay private.
      lineup_starters := coalesce((
        select jsonb_agg(jsonb_build_object(
          'slotId', a.slot_id,
          'name', a.player_name_snapshot,
          'position', a.position_snapshot
        ) order by a.slot_id)
        from public.tactics_lineup_assignments a
        where a.tactics_workspace_id = lineup_workspace.id and a.deleted_at is null
      ), '[]'::jsonb);
    end if;
  end if;

  return jsonb_build_object(
    'found', true,
    'club', jsonb_build_object(
      'name', club.name,
      'shortName', club.short_name,
      'founded', club.founded,
      'stadium', club.stadium,
      'league', club.league,
      'logoColor', club.logo_color
    ),
    'page', jsonb_build_object(
      'headline', page.headline,
      'teamPhoto', page.team_photo,
      'updatedAt', page.updated_at
    ),
    'roster', case when page.show_roster then coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', p.name,
        'number', p.roster_number,
        'position', p.position
      ) order by p.roster_number)
      from public.players p
      where p.club_id = club.id and p.deleted_at is null and p.registration_status = 'active'
    ), '[]'::jsonb) else '[]'::jsonb end,
    'staff', case when page.show_staff then coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', s.name,
        'role', s.role
      ) order by s.name)
      from public.staff_members s
      where s.club_id = club.id and s.deleted_at is null and s.status = 'active'
    ), '[]'::jsonb) else '[]'::jsonb end,
    'lineup', jsonb_build_object(
      'formation', lineup_formation,
      'matchFormat', lineup_match_format,
      'starters', lineup_starters
    ),
    'results', case when page.show_results then coalesce((
      select jsonb_agg(jsonb_build_object(
        'opponent', recent.opponent,
        'date', recent.event_date,
        'ourScore', recent.our_score,
        'opponentScore', recent.opponent_score,
        'type', recent.type
      ) order by recent.event_date desc)
      from (
        select g.opponent, g.event_date, g.our_score, g.opponent_score, g.type
        from public.games g
        where g.club_id = club.id
          and g.deleted_at is null
          and g.status = 'completed'
          and g.type in ('league', 'cup', 'friendly')
          and g.our_score is not null
          and g.opponent_score is not null
        order by g.event_date desc
        limit 10
      ) recent
    ), '[]'::jsonb) else '[]'::jsonb end
  );
end;
$$;

grant execute on function public.get_public_team(text) to anon, authenticated;
