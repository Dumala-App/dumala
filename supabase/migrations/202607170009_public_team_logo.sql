-- Expose the club logo on the public team page.
--
-- get_public_team already returns logo_color (used for the fallback initials
-- tile). The page now leads with a real logo, so send logo_url too. It is the
-- club's own crest on the club's own opt-in showcase page, so it belongs to the
-- same showcase-safe set as the name and stadium - no new privacy surface.
--
-- Everything else about the function is unchanged.

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
      'logoColor', club.logo_color,
      'logoUrl', club.logo_url
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
