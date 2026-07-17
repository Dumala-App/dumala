begin;

create extension if not exists pgtap with schema extensions;

select plan(27);

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('11111111-eeee-4111-8111-111111111111', 'authenticated', 'authenticated', 'app-admin@example.test', now(), now(), now()),
  ('22222222-eeee-4222-8222-222222222222', 'authenticated', 'authenticated', 'coach-admin-console@example.test', now(), now(), now()),
  ('33333333-eeee-4333-8333-333333333333', 'authenticated', 'authenticated', 'support-admin-console@example.test', now(), now(), now());

insert into public.app_admins (user_id, role)
values
  ('11111111-eeee-4111-8111-111111111111', 'owner'),
  ('33333333-eeee-4333-8333-333333333333', 'support');

insert into public.clubs (
  id,
  name,
  owner_user_id,
  club_state,
  pending_deletion_at
)
values (
  'aaaaaaaa-eeee-4aaa-8aaa-aaaaaaaaaaaa',
  'Recoverable FC',
  '22222222-eeee-4222-8222-222222222222',
  'pending_deletion',
  now()
);

insert into public.app_usage_events (event_type, view_name, feature_name)
values ('view_opened', 'development', 'assessments');

insert into public.feedback_submissions (category, affected_area, urgency, subject, details)
values ('bug', 'FPRDS', 'normal', 'Assessment issue', 'Assessment flow did not behave as expected.');

insert into public.fprds_beta_submissions (
  source_assessment_ref,
  player_anonymous_id,
  age_group,
  role,
  assessment_type,
  benchmark_version,
  weighting_version,
  scoring_algorithm_version,
  consent_version,
  consented_at
)
values (
  repeat('a', 64),
  repeat('b', 64),
  'u15',
  'cm',
  'quick',
  'beta-1',
  'role-weights-1',
  'scoring-1',
  'beta-consent-1',
  now()
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config('request.jwt.claim.sub', '11111111-eeee-4111-8111-111111111111', true);
select set_config('request.jwt.claims', '{"sub":"11111111-eeee-4111-8111-111111111111","role":"authenticated","aal":"aal1"}', true);

select ok(
  public.is_app_admin('11111111-eeee-4111-8111-111111111111'),
  'listed user is an app admin'
);

select ok(
  public.is_app_admin_role(array['owner']::public.app_admin_role[]),
  'listed owner has the owner admin role'
);

select isnt(
  public.is_admin_mfa_verified(),
  true,
  'owner session starts without MFA verification'
);

select results_eq(
  $$ select count(*)::int from public.feedback_submissions $$,
  $$ values (0) $$,
  'owner without MFA cannot read protected admin feedback'
);

select throws_ok(
  $$ select public.get_admin_storage_metrics_v1(30) $$,
  '42501',
  null,
  'owner without MFA cannot read storage metrics'
);

select set_config('request.jwt.claims', '{"sub":"11111111-eeee-4111-8111-111111111111","role":"authenticated","aal":"aal2"}', true);

select ok(
  public.is_admin_mfa_verified(),
  'owner session with aal2 is MFA verified'
);

select results_eq(
  $$ select count(*)::int from public.feedback_submissions $$,
  $$ values (1) $$,
  'app admin can read feedback submissions'
);

select results_eq(
  $$ select count(*)::int from public.app_usage_events $$,
  $$ values (1) $$,
  'app admin can read app usage events'
);

select ok(
  public.get_admin_product_metrics_v1(30) ? 'feedback',
  'owner with MFA can read product metrics and write audit role safely'
);

select ok(
  public.get_admin_growth_metrics_v1(30) ? 'users',
  'owner with MFA can read growth metrics for users and workspaces'
);

select ok(
  public.get_admin_storage_metrics_v1(30) ? 'tables',
  'owner with MFA can read database storage metrics'
);

select results_eq(
  $$ select count(*)::int from public.admin_storage_snapshots where snapshot_date = current_date $$,
  $$ values (1) $$,
  'storage metrics RPC creates or updates today snapshot'
);

select ok(
  jsonb_array_length(public.get_admin_storage_metrics_v1(30)->'trend') >= 1,
  'storage metrics include at least today in the trend'
);

select ok(
  public.list_admin_recoverable_workspaces_v1(365) @> '[{"name":"Recoverable FC","state":"pending_deletion"}]'::jsonb,
  'owner with MFA can list recoverable workspaces'
);

select is(
  public.restore_admin_workspace_v1('aaaaaaaa-eeee-4aaa-8aaa-aaaaaaaaaaaa')->>'state',
  'active',
  'owner with MFA can restore a recoverable workspace'
);

reset role;
select results_eq(
  $$ select club_state from public.clubs where id = 'aaaaaaaa-eeee-4aaa-8aaa-aaaaaaaaaaaa' $$,
  $$ values ('active'::public.club_state) $$,
  'restored workspace is active again'
);
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '11111111-eeee-4111-8111-111111111111', true);
select set_config('request.jwt.claims', '{"sub":"11111111-eeee-4111-8111-111111111111","role":"authenticated","aal":"aal2"}', true);

select results_eq(
  $$ select count(*)::int from public.fprds_beta_submissions $$,
  $$ values (1) $$,
  'app admin can read FPRDS beta submissions'
);

update public.fprds_beta_submissions
set review_status = 'accepted', reviewer_notes = 'Validated by test reviewer'
where source_assessment_ref = repeat('a', 64);

select results_eq(
  $$ select review_status from public.fprds_beta_submissions where source_assessment_ref = repeat('a', 64) $$,
  $$ values ('accepted'::public.fprds_beta_review_status) $$,
  'app admin can record an FPRDS review decision'
);

select set_config('request.jwt.claim.sub', '33333333-eeee-4333-8333-333333333333', true);
select set_config('request.jwt.claims', '{"sub":"33333333-eeee-4333-8333-333333333333","role":"authenticated","aal":"aal2"}', true);

select throws_ok(
  $$ select public.get_admin_storage_metrics_v1(30) $$,
  '42501',
  null,
  'non-owner admin cannot read storage metrics'
);

select set_config('request.jwt.claim.sub', '22222222-eeee-4222-8222-222222222222', true);
select set_config('request.jwt.claims', '{"sub":"22222222-eeee-4222-8222-222222222222","role":"authenticated","aal":"aal2"}', true);

select lives_ok(
  $$
    insert into public.fprds_beta_submissions (
      source_assessment_ref, submitted_by, player_anonymous_id, age_group, role, assessment_type,
      benchmark_version, weighting_version, scoring_algorithm_version, consent_version, consented_at
    ) values (
      repeat('c', 64), '22222222-eeee-4222-8222-222222222222', repeat('d', 64), 'u15', 'cm', 'quick',
      'beta-1', 'role-weights-1', 'scoring-1', 'beta-consent-1', now()
    )
  $$,
  'signed-in coach can submit anonymized FPRDS results'
);

select throws_ok(
  $$
    insert into public.fprds_beta_submissions (
      source_assessment_ref, submitted_by, player_anonymous_id, age_group, role, assessment_type,
      benchmark_version, weighting_version, scoring_algorithm_version, consent_version, consented_at
    ) values (
      repeat('c', 64), '22222222-eeee-4222-8222-222222222222', repeat('e', 64), 'u15', 'cm', 'quick',
      'beta-1', 'role-weights-1', 'scoring-1', 'beta-consent-1', now()
    )
  $$,
  '23505',
  null,
  'duplicate assessment submission is rejected'
);

select throws_ok(
  $$ update public.fprds_beta_submissions set review_status = 'accepted' where source_assessment_ref = repeat('c', 64) $$,
  '42501',
  null,
  'coach cannot change review status on own submission'
);

select isnt(
  public.is_app_admin('22222222-eeee-4222-8222-222222222222'),
  true,
  'ordinary signed-in user is not an app admin'
);

select throws_ok(
  $$ select public.restore_admin_workspace_v1('aaaaaaaa-eeee-4aaa-8aaa-aaaaaaaaaaaa') $$,
  '42501',
  null,
  'ordinary signed-in user cannot restore workspaces'
);

select results_eq(
  $$ select count(*)::int from public.feedback_submissions $$,
  $$ values (0) $$,
  'ordinary user cannot read feedback submissions'
);

update public.feedback_submissions set status = 'triaged';

select pass('ordinary user update runs against zero visible feedback rows');

reset role;

select results_eq(
  $$ select status from public.feedback_submissions where subject = 'Assessment issue' $$,
  $$ values ('new'::public.feedback_status) $$,
  'ordinary user cannot change feedback status'
);

select * from finish();

rollback;
