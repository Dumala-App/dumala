-- Phase 6 - Finance: guard settled invoices and invoice-linked ledger entries.
--
-- Settlement reversals are not implemented yet. Until a trusted reversal path
-- exists, direct table writes must not remove settled invoices or mutate ledger
-- entries that were generated from invoice settlement.

create or replace function public.enforce_event_invoice_settlement_delete()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  trusted_reversal boolean := public.is_finance_settlement_definer_context();
begin
  if old.status in ('paid'::public.invoice_status, 'waived'::public.invoice_status)
    and not trusted_reversal then
    raise exception 'INVOICE_REVERSAL_RPC_REQUIRED' using errcode = '42501';
  end if;

  return old;
end;
$$;

drop trigger if exists event_invoices_enforce_settlement_delete on public.event_invoices;
create trigger event_invoices_enforce_settlement_delete
before delete on public.event_invoices
for each row execute function public.enforce_event_invoice_settlement_delete();

create or replace function public.enforce_invoice_ledger_entry_write()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  trusted_reversal boolean := public.is_finance_settlement_definer_context();
begin
  if tg_op = 'INSERT' then
    if new.invoice_id is not null and not trusted_reversal then
      raise exception 'INVOICE_LEDGER_RPC_REQUIRED' using errcode = '42501';
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.invoice_id is not null and not trusted_reversal then
      raise exception 'INVOICE_LEDGER_REVERSAL_RPC_REQUIRED' using errcode = '42501';
    end if;

    return old;
  end if;

  if (old.invoice_id is not null or new.invoice_id is not null) and not trusted_reversal then
    raise exception 'INVOICE_LEDGER_REVERSAL_RPC_REQUIRED' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists league_ledger_entries_enforce_invoice_write on public.league_ledger_entries;
create trigger league_ledger_entries_enforce_invoice_write
before insert or update or delete on public.league_ledger_entries
for each row execute function public.enforce_invoice_ledger_entry_write();
