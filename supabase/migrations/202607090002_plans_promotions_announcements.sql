-- Consolidate subscription plans to free/premium and add owner-managed
-- promotions (discounts/sales) and announcements for the Dumala Admin Console.

-- 1) Plan consolidation: the app now offers Free and Premium only.
--    Legacy trial/pro/club codes are folded into premium; the original code is
--    preserved in the plan note when no note exists.
update public.user_moderation
set plan_code = 'premium',
    plan_note = coalesce(plan_note, 'Migrated from legacy ' || plan_code || ' plan')
where plan_code in ('trial', 'pro', 'club');

update public.subscriptions
set plan_code = 'premium'
where plan_code in ('trial', 'pro', 'club');

-- 2) Promotions: discounts or sales the owner can run against a plan.
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  headline text,
  description text,
  plan_code text not null default 'premium',
  discount_type text not null default 'percent',
  discount_value numeric not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotions_name_check check (char_length(name) between 2 and 120),
  constraint promotions_headline_check check (headline is null or char_length(headline) <= 160),
  constraint promotions_description_check check (description is null or char_length(description) <= 1000),
  constraint promotions_plan_code_check check (plan_code ~ '^[a-z0-9][a-z0-9_-]{0,39}$'),
  constraint promotions_discount_type_check check (discount_type in ('percent', 'fixed')),
  constraint promotions_discount_value_check check (discount_value > 0),
  constraint promotions_percent_range_check check (discount_type <> 'percent' or discount_value <= 100),
  constraint promotions_window_check check (ends_at is null or ends_at > starts_at)
);

create trigger promotions_set_updated_at
before update on public.promotions
for each row execute function public.set_updated_at();

-- 3) Announcements: product notices the owner publishes to app users.
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  kind text not null default 'info',
  is_published boolean not null default false,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_title_check check (char_length(title) between 2 and 160),
  constraint announcements_body_check check (char_length(body) between 2 and 2000),
  constraint announcements_kind_check check (kind in ('info', 'feature', 'maintenance', 'promo')),
  constraint announcements_window_check check (ends_at is null or ends_at > starts_at)
);

create trigger announcements_set_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

create index promotions_live_idx on public.promotions(is_active, starts_at desc);
create index announcements_live_idx on public.announcements(is_published, starts_at desc);

alter table public.promotions enable row level security;
alter table public.announcements enable row level security;

-- Clients (including signed-out landing page visitors) may read only promotions
-- and announcements that are currently live; admins manage everything.
create policy "anyone can read live promotions"
on public.promotions for select to anon, authenticated
using (
  is_active
  and starts_at <= now()
  and (ends_at is null or ends_at > now())
);

create policy "app admins can manage promotions"
on public.promotions for all to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "anyone can read live announcements"
on public.announcements for select to anon, authenticated
using (
  is_published
  and starts_at <= now()
  and (ends_at is null or ends_at > now())
);

create policy "app admins can manage announcements"
on public.announcements for all to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

grant select on public.promotions to anon, authenticated;
grant insert, update, delete on public.promotions to authenticated;
grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;
