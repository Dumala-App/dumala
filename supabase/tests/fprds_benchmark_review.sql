begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('11111111-cccc-4111-8111-111111111111', 'authenticated', 'authenticated', 'benchmark-owner@example.test', now(), now(), now()),
  ('44444444-cccc-4444-8444-444444444444', 'authenticated', 'authenticated', 'benchmark-reviewer@example.test', now(), now(), now()),
  ('22222222-cccc-4222-8222-222222222222', 'authenticated', 'authenticated', 'benchmark-coach@example.test', now(), now(), now());

insert into public.app_admins (user_id, role)
values
  ('11111111-cccc-4111-8111-111111111111', 'owner'),
  ('44444444-cccc-4444-8444-444444444444', 'fprds_reviewer');

insert into public.fprds_beta_submissions (
  id, source_assessment_ref, player_anonymous_id, age_group, role, assessment_type,
  benchmark_version, weighting_version, scoring_algorithm_version, consent_version, consented_at, review_status
)
values (
  'bbbbbbbb-cccc-4bbb-8bbb-bbbbbbbbbbbb', repeat('a', 64), repeat('b', 64), 'u15', 'cm', 'quick',
  'fprds-beta-1', 'fprds-beta-1', 'fprds-beta-1', 'beta-consent-1', now(), 'pending'
);

insert into public.fprds_beta_drill_results (submission_id, drill_id, attribute_id, raw_value, unit, score, benchmark_band)
values
  ('bbbbbbbb-cccc-4bbb-8bbb-bbbbbbbbbbbb', 'sprint_30m', 'pace', 4.5, 'seconds', 70, '{"tier":"Developing"}'::jsonb),
  ('bbbbbbbb-cccc-4bbb-8bbb-bbbbbbbbbbbb', 'sprint_30m', 'pace', 4.6, 'seconds', 68, '{"tier":"Developing"}'::jsonb),
  ('bbbbbbbb-cccc-4bbb-8bbb-bbbbbbbbbbbb', 'ball_retention', 'ballRetention', 8, 'seconds', 60, '{"tier":"Advanced"}'::jsonb);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

-- Owner with a verified MFA session.
select set_config('request.jwt.claim.sub', '11111111-cccc-4111-8111-111111111111', true);
select set_config('request.jwt.claims', '{"sub":"11111111-cccc-4111-8111-111111111111","role":"authenticated","aal":"aal2"}', true);

select ok(
  jsonb_array_length(public.get_fprds_benchmark_analysis_v1(1)) >= 1,
  'owner with MFA can read benchmark distribution analysis'
);

select ok(
  public.get_fprds_benchmark_analysis_v1(1) @> '[{"drillId":"sprint_30m","attributeId":"pace","sampleSize":2}]'::jsonb,
  'analysis aggregates drill results into benchmark cells'
);

select lives_ok(
  $$
    insert into public.fprds_benchmark_reviews (drill_id, attribute_id, age_group, role, benchmark_version, sample_size, review_decision, created_by)
    values ('sprint_30m', 'pace', 'u15', 'cm', 'fprds-beta-1', 2, 'change_requested', '11111111-cccc-4111-8111-111111111111')
  $$,
  'reviewer can record a benchmark review verdict'
);

select lives_ok(
  $$
    insert into public.fprds_benchmark_corrections (drill_id, attribute_id, age_group, role, tier_label, rationale, created_by)
    values ('sprint_30m', 'pace', 'u15', 'cm', 'Developing', 'Distribution skews easy for U15 midfielders.', '11111111-cccc-4111-8111-111111111111')
  $$,
  'reviewer can log a benchmark correction'
);

update public.fprds_benchmark_corrections set status = 'accepted' where drill_id = 'sprint_30m';

select results_eq(
  $$ select status from public.fprds_benchmark_corrections where drill_id = 'sprint_30m' $$,
  $$ values ('accepted'::public.fprds_benchmark_correction_status) $$,
  'reviewer can accept a proposed benchmark correction'
);

-- Dedicated FPRDS reviewer (no MFA requirement).
select set_config('request.jwt.claim.sub', '44444444-cccc-4444-8444-444444444444', true);
select set_config('request.jwt.claims', '{"sub":"44444444-cccc-4444-8444-444444444444","role":"authenticated","aal":"aal1"}', true);

select ok(
  (select count(*) from public.fprds_benchmark_reviews) >= 1,
  'fprds reviewer can read benchmark reviews'
);

-- Ordinary signed-in coach: no benchmark access.
select set_config('request.jwt.claim.sub', '22222222-cccc-4222-8222-222222222222', true);
select set_config('request.jwt.claims', '{"sub":"22222222-cccc-4222-8222-222222222222","role":"authenticated","aal":"aal2"}', true);

select throws_ok(
  $$ select public.get_fprds_benchmark_analysis_v1(1) $$,
  '42501',
  null,
  'non-reviewer cannot read benchmark analysis'
);

select throws_ok(
  $$
    insert into public.fprds_benchmark_reviews (drill_id, attribute_id, age_group, role, benchmark_version, sample_size, review_decision, created_by)
    values ('sprint_30m', 'pace', 'u15', 'cm', 'fprds-beta-1', 2, 'accept', '22222222-cccc-4222-8222-222222222222')
  $$,
  '42501',
  null,
  'non-reviewer cannot record a benchmark review'
);

select finish();
rollback;
