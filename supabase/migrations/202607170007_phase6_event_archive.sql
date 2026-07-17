-- Phase 6 - Archive completed events.
--
-- Events previously stopped at `completed`, which left finished tournaments
-- mixed in with live ones on the owner dashboard forever. `archived` is a new
-- terminal step after `completed` so owners can file a finished event away and
-- review it later without it crowding the Events list. Seasons already had this
-- step (202607100004); this brings events in line.

-- 1) Enum ---------------------------------------------------------------------
-- Postgres forbids using a new enum value in the same transaction that adds it.
-- Nothing below reads or writes 'archived' at migration time -- the RPC only
-- resolves the literal when it first runs -- so this is safe in one file.

alter type public.league_event_status add value if not exists 'archived';

-- 2) Lifecycle RPC ------------------------------------------------------------
-- Unchanged except for the completed -> archived transition.

create or replace function public.advance_event_status(
  event_id uuid,
  next_status public.league_event_status
)
returns public.league_event_status
language plpgsql
security definer
set search_path = public
as $$
declare
  event_league uuid;
  current_status public.league_event_status;
  allowed boolean;
begin
  select league_id, status into event_league, current_status
  from public.league_events where id = event_id;

  if event_league is null then
    raise exception 'EVENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not public.owns_league(event_league) then
    raise exception 'LEAGUE_OWNER_REQUIRED' using errcode = '42501';
  end if;

  allowed := (current_status = 'draft' and next_status = 'registration_open')
    or (current_status = 'registration_open' and next_status = 'active')
    or (current_status = 'active' and next_status = 'completed')
    or (current_status = 'completed' and next_status = 'archived');

  if not allowed then
    raise exception 'INVALID_EVENT_TRANSITION' using errcode = '22023';
  end if;

  update public.league_events set status = next_status where id = event_id;

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (null, auth.uid(), 'record_updated',
    jsonb_build_object('action', 'event_status_advanced', 'eventId', event_id, 'from', current_status, 'to', next_status));

  return next_status;
end;
$$;
