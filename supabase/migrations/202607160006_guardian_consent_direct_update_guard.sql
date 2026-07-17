-- Phase 6 safety fix: direct self-service profile updates must not grant
-- guardian consent for minors. A future trusted server/admin/guardian path can
-- intentionally grant consent by setting dumala.guardian_consent_grant_authorized.

create or replace function public.guard_player_profile_minor()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  is_minor boolean := new.date_of_birth is not null
    and new.date_of_birth > (current_date - interval '18 years')::date;
  trusted_consent_grant boolean :=
    coalesce(current_setting('dumala.guardian_consent_grant_authorized', true), '') = 'on';
  grants_consent boolean := false;
  sets_consent_at boolean := false;
begin
  if not is_minor then
    new.guardian_consent_state := 'not_required';
    new.guardian_consent_at := null;
    return new;
  end if;

  if tg_op = 'INSERT' then
    grants_consent := new.guardian_consent_state = 'granted'::public.guardian_consent_state;
    sets_consent_at := new.guardian_consent_at is not null;
  else
    grants_consent := new.guardian_consent_state = 'granted'::public.guardian_consent_state
      and old.guardian_consent_state is distinct from 'granted'::public.guardian_consent_state;
    sets_consent_at := new.guardian_consent_at is not null
      and new.guardian_consent_at is distinct from old.guardian_consent_at;
  end if;

  if not trusted_consent_grant and (grants_consent or sets_consent_at) then
    raise exception 'GUARDIAN_CONSENT_GRANT_NOT_ALLOWED' using errcode = '42501';
  end if;

  if new.guardian_consent_state = 'not_required' then
    new.guardian_consent_state := 'pending';
  end if;

  if new.guardian_consent_state = 'granted'
    and (new.guardian_name is null or btrim(new.guardian_name) = '') then
    raise exception 'GUARDIAN_DETAILS_REQUIRED' using errcode = '22023';
  end if;

  return new;
end;
$$;
