-- FPRDS beta benchmark review and correction workflow.
--
-- Builds on the beta submission dataset (202606280001) by adding reviewer-level
-- structures: per-benchmark-row review verdicts, a correction log for proposed
-- band changes, and an aggregate distribution analysis RPC computed from the
-- per-drill results captured with each submission.

create type public.fprds_benchmark_review_decision as enum ('accept', 'change_requested', 'inconclusive');
create type public.fprds_benchmark_correction_status as enum ('proposed', 'accepted', 'rejected', 'deferred');

-- Reviewers who may read the benchmark dataset and record verdicts: dedicated
-- FPRDS reviewers, or the owner with a verified MFA session.
create or replace function public.is_fprds_benchmark_reviewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_app_admin_role(array['fprds_reviewer']::public.app_admin_role[])
    or (
      public.is_app_admin_role(array['owner']::public.app_admin_role[])
      and public.is_admin_mfa_verified()
    );
$$;

create table public.fprds_benchmark_reviews (
  id uuid primary key default gen_random_uuid(),
  drill_id text not null,
  attribute_id text not null,
  age_group public.age_group not null,
  role public.fprds_role,
  benchmark_version text not null,
  sample_size integer not null default 0,
  distribution_summary jsonb not null default '{}'::jsonb,
  review_decision public.fprds_benchmark_review_decision not null default 'inconclusive',
  reviewer_notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fprds_benchmark_reviews_drill_check check (char_length(drill_id) between 2 and 120),
  constraint fprds_benchmark_reviews_attribute_check check (char_length(attribute_id) between 2 and 120),
  constraint fprds_benchmark_reviews_sample_check check (sample_size >= 0)
);

create trigger fprds_benchmark_reviews_set_updated_at
before update on public.fprds_benchmark_reviews
for each row execute function public.set_updated_at();

create table public.fprds_benchmark_corrections (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references public.fprds_benchmark_reviews(id) on delete set null,
  drill_id text not null,
  attribute_id text not null,
  age_group public.age_group not null,
  role public.fprds_role,
  tier_label text not null,
  current_raw_best numeric,
  current_raw_worst numeric,
  proposed_raw_best numeric,
  proposed_raw_worst numeric,
  rationale text not null,
  status public.fprds_benchmark_correction_status not null default 'proposed',
  target_benchmark_version text,
  created_by uuid references auth.users(id) on delete set null,
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fprds_benchmark_corrections_drill_check check (char_length(drill_id) between 2 and 120),
  constraint fprds_benchmark_corrections_attribute_check check (char_length(attribute_id) between 2 and 120),
  constraint fprds_benchmark_corrections_tier_check check (char_length(tier_label) between 2 and 40),
  constraint fprds_benchmark_corrections_rationale_check check (char_length(rationale) between 3 and 4000)
);

create trigger fprds_benchmark_corrections_set_updated_at
before update on public.fprds_benchmark_corrections
for each row execute function public.set_updated_at();

create index fprds_benchmark_reviews_lookup_idx
  on public.fprds_benchmark_reviews(drill_id, age_group, role, benchmark_version);
create index fprds_benchmark_reviews_created_idx
  on public.fprds_benchmark_reviews(created_at desc);
create index fprds_benchmark_corrections_status_idx
  on public.fprds_benchmark_corrections(status, created_at desc);
create index fprds_benchmark_corrections_review_idx
  on public.fprds_benchmark_corrections(review_id);

alter table public.fprds_benchmark_reviews enable row level security;
alter table public.fprds_benchmark_corrections enable row level security;

create policy "reviewers read benchmark reviews"
on public.fprds_benchmark_reviews for select to authenticated
using (public.is_fprds_benchmark_reviewer());

create policy "reviewers create benchmark reviews"
on public.fprds_benchmark_reviews for insert to authenticated
with check (public.is_fprds_benchmark_reviewer() and created_by = auth.uid());

create policy "reviewers update benchmark reviews"
on public.fprds_benchmark_reviews for update to authenticated
using (public.is_fprds_benchmark_reviewer())
with check (public.is_fprds_benchmark_reviewer());

create policy "reviewers read benchmark corrections"
on public.fprds_benchmark_corrections for select to authenticated
using (public.is_fprds_benchmark_reviewer());

create policy "reviewers create benchmark corrections"
on public.fprds_benchmark_corrections for insert to authenticated
with check (public.is_fprds_benchmark_reviewer() and created_by = auth.uid());

create policy "reviewers update benchmark corrections"
on public.fprds_benchmark_corrections for update to authenticated
using (public.is_fprds_benchmark_reviewer())
with check (public.is_fprds_benchmark_reviewer());

-- Aggregate benchmark distribution analysis grouped by drill, attribute, age
-- group, role, assessment type, and benchmark version. Excludes withdrawn and
-- reviewer-excluded submissions. Reviewer-only.
create or replace function public.get_fprds_benchmark_analysis_v1(min_sample integer default 1)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
  floor_sample integer := greatest(1, coalesce(min_sample, 1));
begin
  if not public.is_fprds_benchmark_reviewer() then
    raise exception 'FPRDS benchmark analysis is restricted to reviewers'
      using errcode = '42501';
  end if;

  select coalesce(
    jsonb_agg(row_data order by row_data->>'drillId', row_data->>'ageGroup', row_data->>'role'),
    '[]'::jsonb
  )
  into result
  from (
    select jsonb_build_object(
      'drillId', dr.drill_id,
      'attributeId', dr.attribute_id,
      'ageGroup', sub.age_group,
      'role', sub.role,
      'assessmentType', sub.assessment_type,
      'benchmarkVersion', sub.benchmark_version,
      'unit', dr.unit,
      'sampleSize', count(*)::int,
      'clubCount', count(distinct sub.club_id)::int,
      'min', round(min(dr.raw_value)::numeric, 2),
      'max', round(max(dr.raw_value)::numeric, 2),
      'avg', round(avg(dr.raw_value)::numeric, 2),
      'p10', round(percentile_cont(0.1) within group (order by dr.raw_value)::numeric, 2),
      'p25', round(percentile_cont(0.25) within group (order by dr.raw_value)::numeric, 2),
      'median', round(percentile_cont(0.5) within group (order by dr.raw_value)::numeric, 2),
      'p75', round(percentile_cont(0.75) within group (order by dr.raw_value)::numeric, 2),
      'p90', round(percentile_cont(0.9) within group (order by dr.raw_value)::numeric, 2),
      'avgScore', round(avg(dr.score)::numeric, 1),
      'tierDistribution', jsonb_build_object(
        'Elite', count(*) filter (where dr.benchmark_band->>'tier' = 'Elite'),
        'Advanced', count(*) filter (where dr.benchmark_band->>'tier' = 'Advanced'),
        'Developing', count(*) filter (where dr.benchmark_band->>'tier' = 'Developing'),
        'Below Average', count(*) filter (where dr.benchmark_band->>'tier' = 'Below Average'),
        'Beginner', count(*) filter (where dr.benchmark_band->>'tier' = 'Beginner'),
        'Unbanded', count(*) filter (where dr.benchmark_band->>'tier' is null)
      )
    ) as row_data
    from public.fprds_beta_drill_results dr
    join public.fprds_beta_submissions sub on sub.id = dr.submission_id
    where sub.withdrawn_at is null
      and sub.review_status <> 'excluded'
    group by dr.drill_id, dr.attribute_id, sub.age_group, sub.role, sub.assessment_type, sub.benchmark_version, dr.unit
    having count(*) >= floor_sample
  ) grouped;

  return result;
end;
$$;

grant execute on function public.is_fprds_benchmark_reviewer() to authenticated;
grant execute on function public.get_fprds_benchmark_analysis_v1(integer) to authenticated;
grant select, insert, update on public.fprds_benchmark_reviews to authenticated;
grant select, insert, update on public.fprds_benchmark_corrections to authenticated;
