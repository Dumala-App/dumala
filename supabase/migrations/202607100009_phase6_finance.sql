-- Phase 6 - Finance + reporting (backbone).
--
-- A per-league general ledger (income/expense, optionally tagged to a season or
-- event) and team invoices (bill a club for an event, mark paid or waived).
-- Paying an invoice posts a reconciling income entry to the ledger atomically.
-- Summary totals (income, expense, net, outstanding) are derived in the app.
-- Money is stored in integer minor units (cents) to avoid float drift.
-- Exports, per-category dashboards, and season closeout come later. Built on the
-- League/event layers and reuses owns_league.

-- 1) Currency on the league ---------------------------------------------------

alter table public.leagues add column currency text not null default 'PHP';
alter table public.leagues add constraint leagues_currency_check check (char_length(currency) between 1 and 8);

-- 2) Enums --------------------------------------------------------------------

create type public.ledger_direction as enum ('income', 'expense');
create type public.invoice_status as enum ('unpaid', 'paid', 'waived');

-- 3) Tables -------------------------------------------------------------------

create table public.league_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  season_id uuid references public.league_seasons(id) on delete set null,
  event_id uuid references public.league_events(id) on delete set null,
  invoice_id uuid,
  direction public.ledger_direction not null,
  category text not null,
  description text,
  amount_cents integer not null,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ledger_category_check check (char_length(category) between 1 and 80),
  constraint ledger_description_check check (description is null or char_length(description) <= 300),
  constraint ledger_amount_check check (amount_cents >= 0)
);

create trigger league_ledger_entries_set_updated_at
before update on public.league_ledger_entries
for each row execute function public.set_updated_at();

create index league_ledger_entries_league_idx on public.league_ledger_entries(league_id, occurred_on);

create table public.event_invoices (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  event_id uuid not null references public.league_events(id) on delete cascade,
  team_id uuid references public.event_teams(id) on delete set null,
  registration_id uuid references public.event_registrations(id) on delete set null,
  bill_to text not null,
  description text,
  amount_cents integer not null,
  due_on date,
  status public.invoice_status not null default 'unpaid',
  paid_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoice_bill_to_check check (char_length(bill_to) between 1 and 160),
  constraint invoice_description_check check (description is null or char_length(description) <= 300),
  constraint invoice_amount_check check (amount_cents >= 0)
);

create trigger event_invoices_set_updated_at
before update on public.event_invoices
for each row execute function public.set_updated_at();

create index event_invoices_league_status_idx on public.event_invoices(league_id, status);
create index event_invoices_event_idx on public.event_invoices(event_id);

-- 4) RPC: settle an invoice (mark paid/waived; paid posts a ledger entry) ------

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
  select * into inv from public.event_invoices where id = invoice_id;
  if not found then
    raise exception 'INVOICE_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not public.owns_league(inv.league_id) then
    raise exception 'LEAGUE_OWNER_REQUIRED' using errcode = '42501';
  end if;
  if next_status not in ('paid', 'waived') then
    raise exception 'INVALID_INVOICE_STATUS' using errcode = '22023';
  end if;

  update public.event_invoices
  set status = next_status,
      paid_on = case when next_status = 'paid' then coalesce(settle_invoice.paid_on, current_date) else null end
  where id = invoice_id
  returning * into updated;

  -- Post a reconciling income entry only on the transition into 'paid'.
  if next_status = 'paid' and inv.status <> 'paid' then
    insert into public.league_ledger_entries (league_id, event_id, invoice_id, direction, category, description, amount_cents, occurred_on)
    values (inv.league_id, inv.event_id, inv.id, 'income', 'Registration fee',
      'Invoice — ' || inv.bill_to, inv.amount_cents, coalesce(settle_invoice.paid_on, current_date));
  end if;

  insert into public.audit_events (club_id, user_id, event_type, metadata)
  values (null, auth.uid(), 'record_updated',
    jsonb_build_object('action', 'invoice_settled', 'invoiceId', invoice_id, 'status', next_status));

  return updated;
end;
$$;

-- 5) Row level security -------------------------------------------------------

alter table public.league_ledger_entries enable row level security;
alter table public.event_invoices enable row level security;

create policy "owners read own ledger"
on public.league_ledger_entries for select to authenticated
using (public.owns_league(league_id));
create policy "owners create ledger entries"
on public.league_ledger_entries for insert to authenticated
with check (public.owns_league(league_id));
create policy "owners update own ledger"
on public.league_ledger_entries for update to authenticated
using (public.owns_league(league_id))
with check (public.owns_league(league_id));
create policy "owners delete own ledger"
on public.league_ledger_entries for delete to authenticated
using (public.owns_league(league_id));

create policy "owners read own invoices"
on public.event_invoices for select to authenticated
using (public.owns_league(league_id));
create policy "owners create invoices"
on public.event_invoices for insert to authenticated
with check (public.owns_league(league_id));
create policy "owners update own invoices"
on public.event_invoices for update to authenticated
using (public.owns_league(league_id))
with check (public.owns_league(league_id));
create policy "owners delete own invoices"
on public.event_invoices for delete to authenticated
using (public.owns_league(league_id));

-- 6) Grants -------------------------------------------------------------------

grant select, insert, update, delete on public.league_ledger_entries to authenticated;
grant select, insert, update, delete on public.event_invoices to authenticated;
grant execute on function public.settle_invoice(uuid, public.invoice_status, date) to authenticated;
