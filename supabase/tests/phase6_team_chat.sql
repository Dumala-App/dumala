begin;

create extension if not exists pgtap with schema extensions;

select plan(21);

-- Actors -----------------------------------------------------------------------
insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values
  ('e1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'tc-owner@example.test', now(), now(), now()),
  ('e1000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'tc-player@example.test', now(), now(), now()),
  ('e1000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'tc-minor@example.test', now(), now(), now()),
  ('e1000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'tc-outsider@example.test', now(), now(), now());

insert into public.clubs (id, name, owner_user_id, club_state)
values ('e2000000-0000-4000-8000-000000000001', 'Chat FC', 'e1000000-0000-4000-8000-000000000001', 'active');
insert into public.club_memberships (club_id, user_id, role, membership_state, accepted_at)
values ('e2000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001', 'owner', 'active', now());

insert into public.players (id, club_id, name, roster_number, position)
values
  ('e3000000-0000-4000-8000-000000000001', 'e2000000-0000-4000-8000-000000000001', 'Adult Player', 10, 'CM'),
  ('e3000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000001', 'Kid Player', 7, 'ST');

insert into public.user_profiles (user_id) values
  ('e1000000-0000-4000-8000-000000000001'),
  ('e1000000-0000-4000-8000-000000000002'),
  ('e1000000-0000-4000-8000-000000000003'),
  ('e1000000-0000-4000-8000-000000000004');
select set_config('dumala.persona_change_authorized', 'on', false);
update public.user_profiles set persona = 'player'
where user_id in ('e1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000003');
select set_config('dumala.persona_change_authorized', 'off', false);

insert into public.player_profiles (user_id, display_name, date_of_birth) values
  ('e1000000-0000-4000-8000-000000000002', 'Adult Player', (current_date - interval '25 years')::date),
  ('e1000000-0000-4000-8000-000000000003', 'Kid Player', (current_date - interval '12 years')::date);

insert into public.player_club_links (user_id, club_id, player_id, linked_by) values
  ('e1000000-0000-4000-8000-000000000002', 'e2000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000001'),
  ('e1000000-0000-4000-8000-000000000003', 'e2000000-0000-4000-8000-000000000001', 'e3000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000001');

-- === Owner (staff) opens the channel and posts ================================
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);

select set_config('test.chan', public.ensure_team_channel('e2000000-0000-4000-8000-000000000001')::text, false);
select isnt(current_setting('test.chan'), '', 'staff ensures the team channel');
select set_config('test.msg_owner', (public.post_team_chat_message('e2000000-0000-4000-8000-000000000001', 'Briefing at 3pm')).id::text, false);
select isnt(current_setting('test.msg_owner'), '', 'staff posts a message');
select set_config('test.ann_owner', (public.post_team_chat_announcement('e2000000-0000-4000-8000-000000000001', 'Kickoff moved to 4pm')).id::text, false);
select is(
  (select message_kind from public.team_chat_messages where id = current_setting('test.ann_owner')::uuid),
  'announcement',
  'staff posts an official announcement'
);
select is((select count(*)::int from public.team_chat_messages), 2, 'staff reads the channel');

-- === Consented (adult) linked player reads + posts ============================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);
select is(public.can_access_team_chat('e2000000-0000-4000-8000-000000000001'), true, 'an adult linked player can access chat');
select set_config('test.msg_player', (public.post_team_chat_message('e2000000-0000-4000-8000-000000000001', 'On my way')).id::text, false);
select isnt(current_setting('test.msg_player'), '', 'a linked player posts a message');
select throws_ok(
  $$ select public.post_team_chat_announcement('e2000000-0000-4000-8000-000000000001', 'Players cannot pin this') $$,
  '42501', null, 'a linked player cannot post an announcement'
);
select is((select count(*)::int from public.team_chat_messages), 3, 'a linked player reads the channel');

-- === Unconsented minor is blocked (read + post) ===============================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000003","role":"authenticated","aal":"aal1"}', true);
select is(public.can_access_team_chat('e2000000-0000-4000-8000-000000000001'), false, 'an unconsented minor cannot access chat');
select throws_ok(
  $$ select public.post_team_chat_message('e2000000-0000-4000-8000-000000000001', 'hi') $$,
  '42501', null, 'an unconsented minor cannot post'
);
select is((select count(*)::int from public.team_chat_messages), 0, 'an unconsented minor cannot read messages');

-- Guardian consent unlocks the chat for the minor.
select set_config('test.msg_minor', 'x', false);
select is(public.set_guardian_consent('Parent Guardian', 'parent@example.test', 'Mother')::text, 'granted', 'the minor records guardian consent');
select is(public.can_access_team_chat('e2000000-0000-4000-8000-000000000001'), true, 'a consented minor can access chat');
select set_config('test.msg_minor', (public.post_team_chat_message('e2000000-0000-4000-8000-000000000001', 'Ready coach')).id::text, false);

-- === Non-member is fully blocked ==============================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000004', true);
select set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000004","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::int from public.team_chat_messages), 0, 'a non-member cannot read messages');
select throws_ok(
  $$ select public.post_team_chat_message('e2000000-0000-4000-8000-000000000001', 'let me in') $$,
  '42501', null, 'a non-member cannot post'
);

-- === Moderation ===============================================================
set local role authenticated;
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000002","role":"authenticated","aal":"aal1"}', true);
select lives_ok(
  format($$ select public.delete_team_chat_message(%L::uuid) $$, current_setting('test.msg_player')),
  'a member can delete their own message'
);
select throws_ok(
  format($$ select public.delete_team_chat_message(%L::uuid) $$, current_setting('test.msg_owner')),
  '42501', null, 'a member cannot delete another''s message'
);
select lives_ok(
  format($$ select public.report_team_chat_message(%L::uuid, 'spam') $$, current_setting('test.msg_owner')),
  'a member can report a message'
);
select lives_ok(
  format($$ select public.report_team_chat_message(%L::uuid, 'schedule question') $$, current_setting('test.ann_owner')),
  'a member can report an announcement'
);
select lives_ok(
  $$ select public.mark_team_chat_read(current_setting('test.chan')::uuid) $$,
  'a member can mark the channel read'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000001","role":"authenticated","aal":"aal1"}', true);
select lives_ok(
  format($$ select public.delete_team_chat_message(%L::uuid) $$, current_setting('test.msg_minor')),
  'club staff can delete any message'
);

select finish();
rollback;
