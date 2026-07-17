-- Phase 6 - Finance: make invoice settlement a single locked transition.
--
-- Invoices may only move from unpaid to paid or waived. Once settled, stale
-- callers must not be able to change the invoice status or leave ledger income
-- out of sync with the invoice state.

do $$
declare
  duplicate_invoice_ids text;
  orphan_invoice_ledger_ids text;
  paid_invoice_mismatches text;
  unsettled_invoice_ledger_ids text;
begin
  select string_agg(invoice_id::text || ' (' || entry_count::text || ' rows)', ', ' order by invoice_id::text)
  into duplicate_invoice_ids
  from (
    select invoice_id, count(*) as entry_count
    from public.league_ledger_entries
    where invoice_id is not null
    group by invoice_id
    having count(*) > 1
    order by invoice_id
    limit 10
  ) duplicates;

  if duplicate_invoice_ids is not null then
    raise exception 'DUPLICATE_INVOICE_LEDGER_ENTRIES: %', duplicate_invoice_ids using errcode = '23505';
  end if;

  select string_agg(id::text || ' -> ' || invoice_id::text, ', ' order by id::text)
  into orphan_invoice_ledger_ids
  from (
    select l.id, l.invoice_id
    from public.league_ledger_entries l
    left join public.event_invoices i on i.id = l.invoice_id
    where l.invoice_id is not null
      and i.id is null
    order by l.id
    limit 10
  ) orphans;

  if orphan_invoice_ledger_ids is not null then
    raise exception 'ORPHAN_INVOICE_LEDGER_ENTRIES: %', orphan_invoice_ledger_ids using errcode = '23503';
  end if;

  select string_agg(id::text || ' (' || matching_entry_count::text || ' matching rows)', ', ' order by id::text)
  into paid_invoice_mismatches
  from (
    select
      i.id,
      count(l.id) filter (
        where l.direction = 'income'::public.ledger_direction
          and l.league_id = i.league_id
          and l.event_id = i.event_id
          and l.amount_cents = i.amount_cents
      ) as matching_entry_count
    from public.event_invoices i
    left join public.league_ledger_entries l on l.invoice_id = i.id
    where i.status = 'paid'::public.invoice_status
    group by i.id, i.league_id, i.event_id, i.amount_cents
    having count(l.id) filter (
      where l.direction = 'income'::public.ledger_direction
        and l.league_id = i.league_id
        and l.event_id = i.event_id
        and l.amount_cents = i.amount_cents
    ) <> 1
    order by i.id
    limit 10
  ) mismatches;

  if paid_invoice_mismatches is not null then
    raise exception 'PAID_INVOICE_LEDGER_MISMATCH: %', paid_invoice_mismatches using errcode = '23514';
  end if;

  select string_agg(id::text || ' (' || status::text || ', ' || entry_count::text || ' rows)', ', ' order by id::text)
  into unsettled_invoice_ledger_ids
  from (
    select i.id, i.status, count(l.id) as entry_count
    from public.event_invoices i
    join public.league_ledger_entries l on l.invoice_id = i.id
    where i.status in ('unpaid'::public.invoice_status, 'waived'::public.invoice_status)
    group by i.id, i.status
    order by i.id
    limit 10
  ) unsettled;

  if unsettled_invoice_ledger_ids is not null then
    raise exception 'UNSETTLED_INVOICE_LEDGER_ENTRIES: %', unsettled_invoice_ledger_ids using errcode = '23514';
  end if;
end;
$$;

alter table public.league_ledger_entries
  add constraint league_ledger_entries_invoice_id_fk
  foreign key (invoice_id)
  references public.event_invoices(id);

create unique index if not exists league_ledger_entries_invoice_id_unique_idx
on public.league_ledger_entries(invoice_id)
where invoice_id is not null;

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
