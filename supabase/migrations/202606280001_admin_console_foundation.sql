create type public.app_admin_role as enum ('owner', 'support', 'fprds_reviewer', 'billing');
create type public.feedback_status as enum ('new', 'triaged', 'planned', 'in_progress', 'resolved', 'closed');
create type public.feedback_category as enum ('improvement', 'suggestion', 'bug', 'usability_issue', 'feature_request', 'other');
create type public.feedback_urgency as enum ('low', 'normal', 'high', 'blocking');
create type public.fprds_beta_review_status as enum ('pending', 'accepted', 'excluded', 'needs_followup');
create type public.billing_provider as enum ('stripe', 'paypal', 'manual', 'other');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'paused', 'canceled', 'incomplete');

create table public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_admin_role not null default 'support',
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger app_admins_set_updated_at
before update on public.app_admins
for each row execute function public.set_updated_at();

create or replace function public.is_app_admin(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admins admin
    where admin.user_id = target_user_id
      and admin.revoked_at is null
  );
$$;

create table public.app_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  session_id text,
  event_type text not null,
  view_name text,
  feature_name text,
  app_version text,
  device_type text,
  browser_family text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint app_usage_events_event_type_check check (char_length(event_type) between 2 and 80),
  constraint app_usage_events_view_name_check check (view_name is null or char_length(view_name) <= 80),
  constraint app_usage_events_feature_name_check check (feature_name is null or char_length(feature_name) <= 80)
);

create table public.app_sessions (
  session_id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  current_view text,
  app_version text,
  device_type text,
  browser_family text,
  metadata jsonb not null default '{}'::jsonb,
  constraint app_sessions_session_id_check check (char_length(session_id) between 8 and 120),
  constraint app_sessions_current_view_check check (current_view is null or char_length(current_view) <= 80)
);

create table public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  category public.feedback_category not null,
  affected_area text not null,
  urgency public.feedback_urgency not null default 'normal',
  subject text not null,
  details text not null,
  expected_behavior text,
  contact_email text,
  page_url text,
  browser text,
  team_workspace text,
  status public.feedback_status not null default 'new',
  admin_notes text,
  assigned_to uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_submissions_subject_check check (char_length(subject) between 2 and 160),
  constraint feedback_submissions_details_check check (char_length(details) between 10 and 5000),
  constraint feedback_submissions_contact_email_check check (contact_email is null or position('@' in contact_email) > 1)
);

create trigger feedback_submissions_set_updated_at
before update on public.feedback_submissions
for each row execute function public.set_updated_at();

create table public.fprds_beta_submissions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
  assessment_session_id uuid,
  source_assessment_ref text not null,
  submitted_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  player_anonymous_id text not null,
  player_age_at_assessment numeric check (player_age_at_assessment is null or player_age_at_assessment >= 0),
  age_group public.age_group not null,
  role public.fprds_role not null,
  assessment_type public.assessment_type not null,
  benchmark_version text not null,
  weighting_version text not null,
  scoring_algorithm_version text not null,
  raw_results jsonb not null default '{}'::jsonb,
  attribute_scores jsonb not null default '{}'::jsonb,
  ovr numeric check (ovr is null or (ovr >= 0 and ovr <= 100)),
  venue_context jsonb not null default '{}'::jsonb,
  coach_confidence numeric check (coach_confidence is null or (coach_confidence >= 1 and coach_confidence <= 5)),
  coach_notes text,
  consent_version text not null,
  consented_at timestamptz not null,
  review_status public.fprds_beta_review_status not null default 'pending',
  exclusion_reason text,
  reviewer_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fprds_beta_submissions_source_ref_check check (char_length(source_assessment_ref) = 64),
  constraint fprds_beta_submissions_player_ref_check check (char_length(player_anonymous_id) = 64),
  constraint fprds_beta_submissions_submitter_source_unique unique (submitted_by, source_assessment_ref)
);

create trigger fprds_beta_submissions_set_updated_at
before update on public.fprds_beta_submissions
for each row execute function public.set_updated_at();

create or replace function public.protect_fprds_beta_submission_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_app_admin(auth.uid()) then
    return new;
  end if;

  if new.withdrawn_at is null
    or old.withdrawn_at is not null
    or (to_jsonb(new) - 'withdrawn_at' - 'updated_at') is distinct from (to_jsonb(old) - 'withdrawn_at' - 'updated_at')
  then
    raise exception 'FPRDS submitters may only withdraw their own active submission'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger fprds_beta_submissions_protect_update
before update on public.fprds_beta_submissions
for each row execute function public.protect_fprds_beta_submission_update();

create table public.fprds_beta_drill_results (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.fprds_beta_submissions(id) on delete cascade,
  drill_id text not null,
  attribute_id text not null,
  raw_value numeric not null,
  unit text,
  score numeric check (score is null or (score >= 0 and score <= 100)),
  benchmark_band jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint fprds_beta_drill_results_drill_check check (char_length(drill_id) between 2 and 120),
  constraint fprds_beta_drill_results_attribute_check check (char_length(attribute_id) between 2 and 120)
);

create table public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  provider public.billing_provider not null,
  provider_customer_id text not null,
  email text,
  name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_customers_provider_customer_unique unique (provider, provider_customer_id)
);

create trigger billing_customers_set_updated_at
before update on public.billing_customers
for each row execute function public.set_updated_at();

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  billing_customer_id uuid references public.billing_customers(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  provider public.billing_provider not null,
  provider_subscription_id text,
  plan_code text not null,
  status public.subscription_status not null,
  trial_ends_at timestamptz,
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  canceled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_provider_subscription_unique unique (provider, provider_subscription_id)
);

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create table public.billing_events (
  id uuid primary key default gen_random_uuid(),
  provider public.billing_provider not null,
  provider_event_id text not null,
  event_type text not null,
  processed_at timestamptz,
  received_at timestamptz not null default now(),
  processing_error text,
  payload_summary jsonb not null default '{}'::jsonb,
  constraint billing_events_provider_event_unique unique (provider, provider_event_id)
);

create index app_admins_active_idx on public.app_admins(user_id) where revoked_at is null;
create index app_usage_events_created_idx on public.app_usage_events(created_at desc);
create index app_usage_events_type_created_idx on public.app_usage_events(event_type, created_at desc);
create index app_usage_events_view_created_idx on public.app_usage_events(view_name, created_at desc);
create index app_sessions_last_seen_idx on public.app_sessions(last_seen_at desc);
create index feedback_submissions_status_created_idx on public.feedback_submissions(status, created_at desc);
create index feedback_submissions_area_created_idx on public.feedback_submissions(affected_area, created_at desc);
create index fprds_beta_submissions_review_idx on public.fprds_beta_submissions(review_status, submitted_at desc);
create index fprds_beta_submissions_grouping_idx on public.fprds_beta_submissions(age_group, role, assessment_type, benchmark_version);
create index fprds_beta_drill_results_drill_idx on public.fprds_beta_drill_results(drill_id, attribute_id);
create index billing_customers_club_idx on public.billing_customers(club_id);
create index subscriptions_club_status_idx on public.subscriptions(club_id, status);
create index billing_events_received_idx on public.billing_events(received_at desc);

alter table public.app_admins enable row level security;
alter table public.app_usage_events enable row level security;
alter table public.app_sessions enable row level security;
alter table public.feedback_submissions enable row level security;
alter table public.fprds_beta_submissions enable row level security;
alter table public.fprds_beta_drill_results enable row level security;
alter table public.billing_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_events enable row level security;

create policy "app admins can read app admins"
on public.app_admins for select to authenticated
using (public.is_app_admin());

create policy "clients can create usage events"
on public.app_usage_events for insert to anon, authenticated
with check (
  user_id is null or user_id = auth.uid()
);

create policy "app admins can read usage events"
on public.app_usage_events for select to authenticated
using (public.is_app_admin());

create policy "clients can create app sessions"
on public.app_sessions for insert to anon, authenticated
with check (
  user_id is null or user_id = auth.uid()
);

create policy "clients can update their app sessions"
on public.app_sessions for update to anon, authenticated
using (
  user_id is null or user_id = auth.uid()
)
with check (
  user_id is null or user_id = auth.uid()
);

create policy "app admins can read app sessions"
on public.app_sessions for select to authenticated
using (public.is_app_admin());

create policy "clients can create feedback"
on public.feedback_submissions for insert to anon, authenticated
with check (
  user_id is null or user_id = auth.uid()
);

create policy "app admins can manage feedback"
on public.feedback_submissions for all to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "club members can create their fprds beta submissions"
on public.fprds_beta_submissions for insert to authenticated
with check (
  submitted_by = auth.uid()
  and withdrawn_at is null
  and (
    club_id is null
    or public.is_active_club_member(club_id)
  )
);

create policy "submitting users can read their fprds beta submissions"
on public.fprds_beta_submissions for select to authenticated
using (
  submitted_by = auth.uid()
  or public.is_app_admin()
);

create policy "submitting users can withdraw their fprds beta submissions"
on public.fprds_beta_submissions for update to authenticated
using (
  submitted_by = auth.uid()
  or public.is_app_admin()
)
with check (
  submitted_by = auth.uid()
  or public.is_app_admin()
);

create policy "submitters can create fprds beta drill results"
on public.fprds_beta_drill_results for insert to authenticated
with check (
  exists (
    select 1
    from public.fprds_beta_submissions submission
    where submission.id = fprds_beta_drill_results.submission_id
      and submission.submitted_by = auth.uid()
  )
);

create policy "submitters and admins can read fprds beta drill results"
on public.fprds_beta_drill_results for select to authenticated
using (
  public.is_app_admin()
  or exists (
    select 1
    from public.fprds_beta_submissions submission
    where submission.id = fprds_beta_drill_results.submission_id
      and submission.submitted_by = auth.uid()
  )
);

create policy "app admins can manage billing customers"
on public.billing_customers for all to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "app admins can manage subscriptions"
on public.subscriptions for all to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

create policy "app admins can manage billing events"
on public.billing_events for all to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

grant usage on schema public to anon;
grant execute on function public.is_app_admin(uuid) to anon, authenticated;
grant execute on function public.protect_fprds_beta_submission_update() to authenticated;
grant select on public.app_admins to authenticated;
grant insert, select on public.app_usage_events to anon, authenticated;
grant insert, update, select on public.app_sessions to anon, authenticated;
grant insert, select, update on public.feedback_submissions to anon, authenticated;
grant insert, select, update on public.fprds_beta_submissions to authenticated;
grant insert, select on public.fprds_beta_drill_results to authenticated;
grant select, insert, update on public.billing_customers to authenticated;
grant select, insert, update on public.subscriptions to authenticated;
grant select, insert, update on public.billing_events to authenticated;
