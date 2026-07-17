-- Fix: admin_grant_entitlement / admin_revoke_entitlement raised
-- "column reference \"entitlement\" is ambiguous" and could never grant or
-- revoke anything.
--
-- Both functions take a parameter named `entitlement`, which collides with
-- public.user_entitlements.entitlement. The grant path failed on the ON CONFLICT
-- inference clause -- a conflict target cannot be table-qualified, so there is no
-- way to disambiguate it from the parameter. The revoke path failed on its WHERE
-- clause for the same reason.
--
-- admin_provision_league_owner runs the same insert without trouble because its
-- only parameter is `request_id`, which is why League provisioning worked while
-- the Admin Console entitlement toggle did not.
--
-- The signatures are unchanged: the client calls these RPCs with named arguments
-- (see src/cloud/identity.ts), so the parameter names are part of the contract and
-- cannot be renamed. Instead the parameters are copied into locals with distinct
-- names, every column reference is table-qualified, and the grant upsert becomes
-- an update-then-insert so no unqualifiable conflict target is needed.

create or replace function public.admin_grant_entitlement(
  target_user_id uuid,
  entitlement text,
  expires_at timestamptz default null,
  notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_key text := lower(nullif(trim(coalesce(admin_grant_entitlement.entitlement, '')), ''));
  grant_expires timestamptz := admin_grant_entitlement.expires_at;
  grant_notes text := nullif(trim(coalesce(admin_grant_entitlement.notes, '')), '');
begin
  perform public.require_owner_admin_mfa('admin_grant_entitlement', 'user_entitlements');

  if normalized_key is null or normalized_key !~ '^[a-z0-9][a-z0-9_-]{0,39}$' then
    raise exception 'INVALID_ENTITLEMENT_KEY' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.user_profiles
    where user_profiles.user_id = admin_grant_entitlement.target_user_id
  ) then
    raise exception 'USER_NOT_FOUND' using errcode = 'P0002';
  end if;

  update public.user_entitlements
  set expires_at = grant_expires,
      notes = grant_notes,
      granted_by = auth.uid(),
      granted_at = now()
  where user_entitlements.user_id = admin_grant_entitlement.target_user_id
    and user_entitlements.entitlement = normalized_key
    and user_entitlements.revoked_at is null;

  if not found then
    begin
      insert into public.user_entitlements (user_id, entitlement, granted_by, expires_at, notes)
      values (admin_grant_entitlement.target_user_id, normalized_key, auth.uid(), grant_expires, grant_notes);
    exception when unique_violation then
      -- A concurrent grant won the race; fold this call into the existing row so
      -- the caller still sees the upsert semantics the ON CONFLICT clause gave.
      update public.user_entitlements
      set expires_at = grant_expires,
          notes = grant_notes,
          granted_by = auth.uid(),
          granted_at = now()
      where user_entitlements.user_id = admin_grant_entitlement.target_user_id
        and user_entitlements.entitlement = normalized_key
        and user_entitlements.revoked_at is null;
    end;
  end if;

  perform public.record_admin_audit(
    'entitlement_granted',
    'user_entitlements',
    admin_grant_entitlement.target_user_id::text,
    jsonb_build_object('entitlement', normalized_key, 'expires_at', grant_expires)
  );

  return jsonb_build_object('user_id', admin_grant_entitlement.target_user_id, 'entitlement', normalized_key);
end;
$$;

create or replace function public.admin_revoke_entitlement(
  target_user_id uuid,
  entitlement text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_key text := lower(nullif(trim(coalesce(admin_revoke_entitlement.entitlement, '')), ''));
begin
  perform public.require_owner_admin_mfa('admin_revoke_entitlement', 'user_entitlements');

  if normalized_key is null then
    raise exception 'INVALID_ENTITLEMENT_KEY' using errcode = '22023';
  end if;

  update public.user_entitlements
  set revoked_at = now()
  where user_entitlements.user_id = admin_revoke_entitlement.target_user_id
    and user_entitlements.entitlement = normalized_key
    and user_entitlements.revoked_at is null;

  perform public.record_admin_audit(
    'entitlement_revoked',
    'user_entitlements',
    admin_revoke_entitlement.target_user_id::text,
    jsonb_build_object('entitlement', normalized_key)
  );

  return jsonb_build_object('user_id', admin_revoke_entitlement.target_user_id, 'entitlement', normalized_key, 'revoked', true);
end;
$$;
