-- AI Engineering Academy Dataset v1 - optional demo user seed
-- Run this AFTER at least one real user has signed up.
-- It does not create auth.users. If there is no public.profiles row, it safely no-ops.

begin;

do $$
declare
  u uuid;
  u2 uuid;
  conv_id uuid := 'dcbef95f-6c91-598b-a06f-216e460f8a00';
  cert_tpl uuid := 'd9b273f7-39d1-548a-bd9b-7e5ba2750693';
  cert_hash text;
begin
  select id into u from public.profiles order by created_at asc limit 1;
  select id into u2 from public.profiles where id <> u order by created_at asc limit 1;

  if u is null then
    raise notice 'No public.profiles rows found. Create/sign in a user first, then rerun this demo seed.';
    return;
  end if;

  insert into public.user_stats (user_id, total_xp, level_number, lessons_completed, quizzes_completed, labs_completed, certificates_count, streak_current, streak_longest, last_streak_date)
  values (u, 1250, 4, 24, 3, 1, 1, 7, 12, current_date)
  on conflict (user_id) do update set
    total_xp = greatest(public.user_stats.total_xp, excluded.total_xp),
    level_number = excluded.level_number,
    lessons_completed = greatest(public.user_stats.lessons_completed, excluded.lessons_completed),
    quizzes_completed = greatest(public.user_stats.quizzes_completed, excluded.quizzes_completed),
    labs_completed = greatest(public.user_stats.labs_completed, excluded.labs_completed),
    certificates_count = greatest(public.user_stats.certificates_count, excluded.certificates_count),
    streak_current = greatest(public.user_stats.streak_current, excluded.streak_current),
    streak_longest = greatest(public.user_stats.streak_longest, excluded.streak_longest),
    last_streak_date = current_date;

  insert into public.path_enrollments (user_id, path_id, status, progress_percent, current_course_id, started_at, last_accessed_at, metadata)
  values (u, '7c8fbe51-6e9f-5b2a-8167-9e60128a34ca', 'active', 45, 'bcbfa4cb-70c6-528e-9e8e-e035e48606fb', now() - interval '9 days', now(), '{"seed_pack":"ai-eng-academy-v1"}')
  on conflict (user_id, path_id) do update set progress_percent = excluded.progress_percent, current_course_id = excluded.current_course_id, last_accessed_at = now();

  insert into public.course_enrollments (user_id, course_id, status, progress_percent, current_lesson_id, total_xp_earned, started_at, last_accessed_at, metadata)
  values (u, 'bcbfa4cb-70c6-528e-9e8e-e035e48606fb', 'active', 65, '6e4c9822-4972-5059-a4f1-a5d67b154182', 420, now() - interval '7 days', now(), '{"seed_pack":"ai-eng-academy-v1"}')
  on conflict (user_id, course_id) do update set progress_percent = excluded.progress_percent, current_lesson_id = excluded.current_lesson_id, total_xp_earned = excluded.total_xp_earned, last_accessed_at = now();

  insert into public.module_progress (user_id, module_id, status, progress_percent, started_at, completed_at, last_accessed_at)
  values (u, '968856e6-d60d-52b6-8372-4e3375e58521', 'completed', 100, now() - interval '5 days', now() - interval '2 days', now())
  on conflict (user_id, module_id) do update set status='completed', progress_percent=100, completed_at=coalesce(public.module_progress.completed_at, now()), last_accessed_at=now();

  insert into public.lesson_progress (user_id, lesson_id, status, progress_percent, watched_seconds, completed_content_blocks, started_at, completed_at, last_position_seconds, last_accessed_at, metadata)
  values
    (u, '76204e6b-4947-5c17-829b-d6b7dbfdac04', 'completed', 100, 720, 3, now() - interval '5 days', now() - interval '5 days', 720, now(), '{"seed_pack":"ai-eng-academy-v1"}'),
    (u, 'ed98bc72-44ff-53e6-bb9b-e8211a092fd4', 'completed', 100, 610, 3, now() - interval '4 days', now() - interval '4 days', 610, now(), '{"seed_pack":"ai-eng-academy-v1"}'),
    (u, '6e4c9822-4972-5059-a4f1-a5d67b154182', 'in_progress', 35, 260, 1, now() - interval '1 day', null, 260, now(), '{"seed_pack":"ai-eng-academy-v1"}')
  on conflict (user_id, lesson_id) do update set status=excluded.status, progress_percent=excluded.progress_percent, watched_seconds=excluded.watched_seconds, completed_content_blocks=excluded.completed_content_blocks, last_position_seconds=excluded.last_position_seconds, last_accessed_at=now();

  insert into public.daily_goals (user_id, goal_date, target_lessons, target_quizzes, target_minutes, completed_lessons, completed_quizzes, completed_minutes)
  values (u, current_date, 1, 0, 10, 1, 0, 18)
  on conflict (user_id, goal_date) do update set completed_lessons=excluded.completed_lessons, completed_quizzes=excluded.completed_quizzes, completed_minutes=excluded.completed_minutes;

  insert into public.study_sessions (id, user_id, path_id, course_id, lesson_id, started_at, ended_at, source, metadata)
  values
    ('4d933d77-afba-517c-b9f8-b81873d9be03', u, '7c8fbe51-6e9f-5b2a-8167-9e60128a34ca', 'bcbfa4cb-70c6-528e-9e8e-e035e48606fb', '76204e6b-4947-5c17-829b-d6b7dbfdac04', now() - interval '5 days 30 minutes', now() - interval '5 days', 'mobile', '{"seed_pack":"ai-eng-academy-v1"}'),
    ('7af76d25-53ef-53c5-9433-3b43a9a4d7db', u, '7c8fbe51-6e9f-5b2a-8167-9e60128a34ca', 'bcbfa4cb-70c6-528e-9e8e-e035e48606fb', 'ed98bc72-44ff-53e6-bb9b-e8211a092fd4', now() - interval '4 days 25 minutes', now() - interval '4 days', 'mobile', '{"seed_pack":"ai-eng-academy-v1"}')
  on conflict (id) do nothing;

  insert into public.assessment_attempts (id, assessment_id, user_id, status, started_at, submitted_at, graded_at, score, max_score, correct_count, wrong_count, duration_seconds, result_level, recommendation_path_id, metadata)
  values
    ('aeae81a9-e892-5fd0-8c62-a40886853c62', 'f9eb680a-8c85-500d-981e-e8ab14032c08', u, 'graded', now() - interval '10 days', now() - interval '10 days' + interval '7 minutes', now() - interval '10 days' + interval '8 minutes', 8, 12, 8, 4, 420, 'intermediate', '7c8fbe51-6e9f-5b2a-8167-9e60128a34ca', '{"seed_pack":"ai-eng-academy-v1"}'),
    ('1f01920c-a110-5ac4-9993-03ef194faf3a', '73235f9b-5917-5268-b304-19ece9b4f59d', u, 'graded', now() - interval '2 days', now() - interval '2 days' + interval '4 minutes', now() - interval '2 days' + interval '5 minutes', 3, 3, 3, 0, 240, null, null, '{"seed_pack":"ai-eng-academy-v1"}')
  on conflict (id) do update set status=excluded.status, score=excluded.score, max_score=excluded.max_score, correct_count=excluded.correct_count, wrong_count=excluded.wrong_count;

  insert into public.lab_submissions (id, lab_id, user_id, code, parameters, output, passed_tests, total_tests, score, status, run_time_ms, metadata)
  values ('f406a17f-9f98-547d-8233-a384637ea197', '174cc889-607d-5b7b-8ff1-c86bad21de4d', u, 'def solve(params): return {"result": float(params["value"])*float(params["weight"])+float(params["bias"])}', '{"value":2,"weight":3,"bias":1}', '{"result":7}', 2, 2, 100, 'passed', 87, '{"seed_pack":"ai-eng-academy-v1"}')
  on conflict (id) do update set output=excluded.output, passed_tests=excluded.passed_tests, total_tests=excluded.total_tests, score=excluded.score, status=excluded.status;

  insert into public.notes (id, user_id, course_id, lesson_id, content_block_id, title, body, color, is_pinned, metadata)
  values ('c45faad4-cd92-54ff-8009-3578549d67fc', u, 'bcbfa4cb-70c6-528e-9e8e-e035e48606fb', '76204e6b-4947-5c17-829b-d6b7dbfdac04', 'ef03e9f9-9682-5987-a139-c4fb0fd81caf', 'ReLU notu', 'ReLU negatif değerlerde 0 üretir; gradyan akışı için pratikte hesaplaması hızlıdır.', 'blue', true, '{"seed_pack":"ai-eng-academy-v1"}')
  on conflict (id) do update set title=excluded.title, body=excluded.body, is_pinned=excluded.is_pinned;

  insert into public.highlights (id, user_id, lesson_id, content_block_id, highlighted_text, start_offset, end_offset, color, note)
  values ('0d3a8491-3ad3-5727-84af-0adad69e6e44', u, '76204e6b-4947-5c17-829b-d6b7dbfdac04', 'ef03e9f9-9682-5987-a139-c4fb0fd81caf', 'AI mühendisliği, araştırma sonucunu çalışan ürüne dönüştürme disiplinidir.', 0, 76, 'yellow', 'Dashboardda önemli not olarak gösterilebilir.')
  on conflict (id) do nothing;

  insert into public.bookmarks (user_id, target_type, target_id, metadata)
  values (u, 'course', 'bcbfa4cb-70c6-528e-9e8e-e035e48606fb', '{"seed_pack":"ai-eng-academy-v1"}')
  on conflict (user_id, target_type, target_id) do update set metadata=excluded.metadata;

  insert into public.ai_mentor_conversations (id, user_id, course_id, lesson_id, title, status, model, system_prompt_version, metadata)
  values (conv_id, u, 'bcbfa4cb-70c6-528e-9e8e-e035e48606fb', '76204e6b-4947-5c17-829b-d6b7dbfdac04', 'Backpropagation destek sohbeti', 'active', 'gpt-5.5-pro', 'mentor-v1', '{"seed_pack":"ai-eng-academy-v1"}')
  on conflict (id) do update set title=excluded.title, status=excluded.status, updated_at=now();

  insert into public.ai_mentor_messages (id, conversation_id, user_id, role, content, token_input, token_output, latency_ms, metadata)
  values
    ('80656131-337d-5993-9b00-e5b5926b34e1', conv_id, u, 'user', 'Backpropagation neden önemli?', 11, 0, null, '{"seed_pack":"ai-eng-academy-v1"}'),
    ('83b29da7-0106-5c18-84e1-0c075a99dbf3', conv_id, u, 'assistant', 'Backpropagation, hatanın çıktından gizli katmanlara doğru nasıl dağıtılacağını hesaplar. Böylece model ağırlıklarını daha doğru tahminler yapacak yönde günceller.', 0, 43, 820, '{"seed_pack":"ai-eng-academy-v1"}')
  on conflict (id) do update set content=excluded.content, token_input=excluded.token_input, token_output=excluded.token_output;

  insert into public.ai_usage_ledger (id, user_id, conversation_id, source, tokens_in, tokens_out, cost_estimate, currency, metadata)
  values ('543934fb-a3a9-5e55-9f4a-b36ce82966cb', u, conv_id, 'mentor', 120, 220, 0.0012, 'USD', '{"seed_pack":"ai-eng-academy-v1"}')
  on conflict (id) do nothing;

  insert into public.recommendations (id, user_id, recommendation_type, target_type, target_id, reason, score, is_seen, is_accepted, expires_at, metadata)
  values
    ('fc85ebbd-835e-5174-9843-15181b0f3d8a', u, 'lesson', 'lesson', '6e4c9822-4972-5059-a4f1-a5d67b154182', 'Neural Networks 101 akışında sıradaki ders.', 0.95, false, false, now() + interval '14 days', '{"seed_pack":"ai-eng-academy-v1"}'),
    ('e6f6ec42-afe9-51c8-a29f-c3b4a5395b6f', u, 'course', 'course', '1baef71c-6bb1-5c08-9b0d-1e1fc9095ae3', 'Modelleme bilgini değerlendirme ve deney yönetimi ile güçlendirebilirsin.', 0.82, false, false, now() + interval '14 days', '{"seed_pack":"ai-eng-academy-v1"}')
  on conflict (id) do update set reason=excluded.reason, score=excluded.score, expires_at=excluded.expires_at;

  insert into public.notifications (id, user_id, notification_type, title, body, target_type, target_id, is_read, metadata)
  values
    ('94178c59-b94e-53ff-a291-5272f34abe07', u, 'achievement', 'Rozet kazandın', 'Neural Networks 101 modülünde ilerledin.', 'course', 'bcbfa4cb-70c6-528e-9e8e-e035e48606fb', false, '{"seed_pack":"ai-eng-academy-v1"}'),
    ('01960101-1cc0-5004-8d62-04412a67ee9d', u, 'league', 'Altın Ligdesin', 'İlk 10 hedefine 260 puan kaldı.', 'league', 'f90bba73-fe51-5f52-b77b-793d3a6659d9', false, '{"seed_pack":"ai-eng-academy-v1"}')
  on conflict (id) do update set title=excluded.title, body=excluded.body, is_read=excluded.is_read;

  insert into public.user_badges (id, user_id, badge_id, source_type, source_id, metadata)
  values
    ('81f6fbd4-7448-50c1-a6e7-942b7a86735c', u, 'bd43af56-8d61-5898-80b0-9b60200e4ead', 'streak', null, '{"seed_pack":"ai-eng-academy-v1"}'),
    ('26d366a4-3c0d-51d2-ae4b-222bdb4e9648', u, 'b86265fa-4430-5564-aed9-33369b111e77', 'quiz', '73235f9b-5917-5268-b304-19ece9b4f59d', '{"seed_pack":"ai-eng-academy-v1"}')
  on conflict (user_id, badge_id) do update set metadata=excluded.metadata;

  cert_hash := encode(digest('AEA-DEMO-' || left(u::text, 8), 'sha256'), 'hex');
  insert into public.certificates (user_id, course_id, path_id, template_id, certificate_no, title, status, file_url, verification_hash, metadata)
  values (u, 'bcbfa4cb-70c6-528e-9e8e-e035e48606fb', '7c8fbe51-6e9f-5b2a-8167-9e60128a34ca', cert_tpl, 'AEA-DEMO-' || left(u::text, 8), 'Neural Networks 101', 'issued', 'certificates/demo-' || left(u::text, 8) || '.pdf', cert_hash, '{"seed_pack":"ai-eng-academy-v1"}')
  on conflict (certificate_no) do update set title=excluded.title, file_url=excluded.file_url, verification_hash=excluded.verification_hash, metadata=excluded.metadata;

  insert into public.league_participants (id, season_id, group_id, user_id, tier, total_points, rank, streak_count, completed_lessons, quiz_points, lab_points, promotion_status)
  values ('6f5caf41-2a62-587b-8325-d773f001902f', 'c242e1d2-83e6-57c6-b0c1-a0daa2f75593', 'f90bba73-fe51-5f52-b77b-793d3a6659d9', u, 'gold', 1840, 12, 9, 24, 370, 160, 'safe')
  on conflict (season_id, user_id) do update set total_points=excluded.total_points, rank=excluded.rank, streak_count=excluded.streak_count, completed_lessons=excluded.completed_lessons, quiz_points=excluded.quiz_points, lab_points=excluded.lab_points, promotion_status=excluded.promotion_status;

  insert into public.league_point_events (id, season_id, group_id, user_id, source_type, source_id, points, metadata)
  values ('01c3b930-2b84-52f0-9820-78706d346c80', 'c242e1d2-83e6-57c6-b0c1-a0daa2f75593', 'f90bba73-fe51-5f52-b77b-793d3a6659d9', u, 'lesson', '76204e6b-4947-5c17-829b-d6b7dbfdac04', 40, '{"seed_pack":"ai-eng-academy-v1"}')
  on conflict (id) do nothing;

  insert into public.league_snapshots (id, season_id, group_id, standings)
  values ('34650936-b4be-522f-8cc3-2ba89fd3bc7d', 'c242e1d2-83e6-57c6-b0c1-a0daa2f75593', 'f90bba73-fe51-5f52-b77b-793d3a6659d9', jsonb_build_array(jsonb_build_object('rank', 12, 'user_id', u, 'display_name', (select display_name from public.profiles where id = u), 'points', 1840)))
  on conflict (id) do update set standings=excluded.standings, captured_at=now();

  if u2 is not null then
    insert into public.friendships (id, requester_id, addressee_id, status, responded_at, metadata)
    values ('dfceaa37-5910-59f3-9a33-e223710197cc', u, u2, 'accepted', now() - interval '2 days', '{"seed_pack":"ai-eng-academy-v1"}')
    on conflict do nothing;

    insert into public.challenges (id, challenger_id, opponent_id, title, target_type, target_id, points_stake, status, starts_at, ends_at, metadata)
    values ('fcd37a6b-8edf-54e2-a806-37c647ffb06f', u, u2, 'Neural Quiz Meydan Okuması', 'quiz', '73235f9b-5917-5268-b304-19ece9b4f59d', 50, 'active', now(), now() + interval '3 days', '{"seed_pack":"ai-eng-academy-v1"}')
    on conflict (id) do update set status=excluded.status, starts_at=excluded.starts_at, ends_at=excluded.ends_at;
  end if;
end $$;

commit;
