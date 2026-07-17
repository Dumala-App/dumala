-- Phase 6 safety fix: player self-service can record guardian details, but it
-- must not grant consent for minors. A trusted guardian/admin verification path
-- can set guardian_consent_state = 'granted' separately when it exists.

create or replace function public.set_guardian_consent(
  p_guardian_name text,
  p_guardian_email text,
  p_guardian_relationship text
)
returns public.guardian_consent_state
language plpgsql
security definer
set search_path = public
as $$
declare
  next_state public.guardian_consent_state;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if nullif(btrim(coalesce(p_guardian_name, '')), '') is null then
    raise exception 'GUARDIAN_DETAILS_REQUIRED' using errcode = '22023';
  end if;

  update public.player_profiles p
  set guardian_name = btrim(p_guardian_name),
      guardian_email = nullif(btrim(coalesce(p_guardian_email, '')), ''),
      guardian_relationship = nullif(btrim(coalesce(p_guardian_relationship, '')), ''),
      guardian_consent_state = case
        when p.date_of_birth is not null
          and p.date_of_birth > (current_date - interval '18 years')::date
          then case
            when p.guardian_consent_state = 'revoked' then 'revoked'::public.guardian_consent_state
            else 'pending'::public.guardian_consent_state
          end
        else 'not_required'::public.guardian_consent_state
      end,
      guardian_consent_at = null
  where p.user_id = auth.uid()
  returning p.guardian_consent_state into next_state;

  if not found then
    raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0002';
  end if;

  return next_state;
end;
$$;
