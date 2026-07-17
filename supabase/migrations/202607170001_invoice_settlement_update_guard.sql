-- Phase 6 - Finance: enforce invoice settlement invariants on direct writes.
--
-- Owners may still update ordinary invoice fields through RLS, but settlement
-- fields are controlled by settle_invoice so invoice status and ledger income
-- cannot drift apart through direct table updates.

create or replace function public.is_finance_settlement_definer_context()
returns boolean
language sql
stable
set search_path = public
as $$
  select current_user = pg_get_userbyid(proowner)
  from pg_proc
  where oid = 'public.settle_invoice(uuid, public.invoice_status, date)'::regprocedure;
$$;

grant execute on function public.is_finance_settlement_definer_context() to authenticated;

create or replace function public.enforce_event_invoice_settlement_write()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  -- SECURITY INVOKER trigger functions see current_user as authenticated for
  -- direct client writes, and as the RPC owner while settle_invoice runs under
  -- SECURITY DEFINER. Clients can set GUCs, but cannot spoof current_user.
  trusted_settlement boolean := public.is_finance_settlement_definer_context();
  status_changed boolean := false;
  paid_on_changed boolean := false;
begin
  if tg_op = 'INSERT' then
    if new.status is null then
      new.status := 'unpaid'::public.invoice_status;
    end if;

    if new.status <> 'unpaid'::public.invoice_status or new.paid_on is not null then
      raise exception 'INVOICE_INITIAL_STATUS_INVALID' using errcode = '22023';
    end if;

    return new;
  end if;

  status_changed := new.status is distinct from old.status;
  paid_on_changed := new.paid_on is distinct from old.paid_on;

  if old.status in ('paid'::public.invoice_status, 'waived'::public.invoice_status) then
    raise exception 'INVOICE_ALREADY_SETTLED' using errcode = '22023';
  end if;

  if not status_changed and not paid_on_changed then
    return new;
  end if;

  if not trusted_settlement then
    raise exception 'INVOICE_SETTLEMENT_RPC_REQUIRED' using errcode = '42501';
  end if;

  if not status_changed or new.status not in ('paid'::public.invoice_status, 'waived'::public.invoice_status) then
    raise exception 'INVALID_INVOICE_STATUS' using errcode = '22023';
  end if;

  if new.status = 'paid'::public.invoice_status and new.paid_on is null then
    raise exception 'INVOICE_PAID_ON_REQUIRED' using errcode = '22023';
  end if;

  if new.status <> 'paid'::public.invoice_status and new.paid_on is not null then
    raise exception 'INVOICE_PAID_ON_NOT_ALLOWED' using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists event_invoices_enforce_settlement_write on public.event_invoices;
create trigger event_invoices_enforce_settlement_write
before insert or update on public.event_invoices
for each row execute function public.enforce_event_invoice_settlement_write();

create or replace function public.settle_invoice(
  invoice_id uuid,
  next_status public.invoice_status,
  paid_on date default current_date
)
returns public.event_invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.event_invoices%rowtype;
  updated public.event_invoices%rowtype;
begin
  select *
  into inv
  from public.event_invoices
  where id = invoice_id
  for update;

  if not found then
    raise exception 'INVOICE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not public.owns_league(inv.league_id) then
    raise exception 'LEAGUE_OWNER_REQUIRED' using errcode = '42501';
  end if;
  if next_status is null or next_status not in ('paid', 'waived') then
    raise exception 'INVALID_INVOICE_STATUS' using errcode = '22023';
  end if;
  if inv.status <> 'unpaid' then
    raise exception 'INVOICE_ALREADY_SETTLED' using errcode = '22023';
  end if;

  update public.event_invoices
  set status = next_status,
      paid_on = case when next_status = 'paid' then coalesce(settle_invoice.paid_on, current_date) else null end
  where id = inv.id
  returning * into updated;

  if next_status = 'paid' then
    insert into public.league_ledger_entries (league_id, event_id, invoice_id, direction, category, description, amount_cents, occurred_on)
    values (inv.league_id, inv.event_id, inv.id, 'income', 'Registration fee',
      'Invoice - ' || inv.bill_to, inv.amount_cents, coalesce(settle_invoice.paid_on, current_date));
  end if;

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (null, auth.uid(), 'record_updated',
    jsonb_build_object('action', 'invoice_settled', 'invoiceId', invoice_id, 'status', next_status));

  return updated;
end;
$$;

grant execute on function public.settle_invoice(uuid, public.invoice_status, date) to authenticated;
