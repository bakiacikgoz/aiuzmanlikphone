-- AI Engineering Academy base schema for Supabase.
-- Run before sql/01_seed_content.sql.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Baki',
  username text unique,
  avatar_url text,
  level_label text not null default 'Orta',
  preferred_language text not null default 'tr',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key,
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  color text,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table if not exists public.interest_categories (
  id uuid primary key,
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table if not exists public.learning_goals (
  id uuid primary key,
  slug text not null unique,
  title text not null,
  description text,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table if not exists public.learning_paths (
  id uuid primary key,
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  level text,
  hero_image_url text,
  icon text,
  estimated_minutes integer not null default 0,
  sort_order integer not null default 0,
  status text not null default 'draft',
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.learning_path_skills (
  path_id uuid not null references public.learning_paths(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  weight numeric not null default 1,
  primary key (path_id, skill_id)
);

create table if not exists public.courses (
  id uuid primary key,
  path_id uuid references public.learning_paths(id) on delete set null,
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  level text,
  thumbnail_url text,
  hero_image_url text,
  estimated_minutes integer not null default 0,
  xp_reward integer not null default 0,
  sort_order integer not null default 0,
  status text not null default 'draft',
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.course_skills (
  course_id uuid not null references public.courses(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  weight numeric not null default 1,
  primary key (course_id, skill_id)
);

create table if not exists public.course_prerequisites (
  course_id uuid not null references public.courses(id) on delete cascade,
  prerequisite_course_id uuid not null references public.courses(id) on delete cascade,
  primary key (course_id, prerequisite_course_id)
);

create table if not exists public.modules (
  id uuid primary key,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null default 0,
  estimated_minutes integer not null default 0,
  status text not null default 'draft',
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.lessons (
  id uuid primary key,
  module_id uuid not null references public.modules(id) on delete cascade,
  slug text not null unique,
  title text not null,
  summary text,
  lesson_type text not null default 'reading',
  sort_order integer not null default 0,
  estimated_minutes integer not null default 0,
  xp_reward integer not null default 0,
  video_url text,
  thumbnail_url text,
  status text not null default 'draft',
  unlock_rule jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz
);

create table if not exists public.lesson_content_blocks (
  id uuid primary key,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  block_type text not null,
  title text,
  body text,
  media_url text,
  code_language text,
  code text,
  callout_variant text,
  data jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0
);

create table if not exists public.lesson_resources (
  id uuid primary key,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  resource_type text not null,
  url text,
  storage_path text,
  is_downloadable boolean not null default false,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.glossary_terms (
  id uuid primary key,
  skill_id uuid references public.skills(id) on delete set null,
  term text not null,
  definition text not null,
  examples text,
  status text not null default 'published'
);

create table if not exists public.assessments (
  id uuid primary key,
  slug text not null unique,
  assessment_type text not null,
  title text not null,
  description text,
  level text,
  course_id uuid references public.courses(id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  passing_score integer not null default 0,
  xp_reward integer not null default 0,
  question_count integer not null default 0,
  time_limit_minutes integer,
  max_attempts integer,
  status text not null default 'draft',
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.assessment_questions (
  id uuid primary key,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete set null,
  question_type text not null default 'single_choice',
  prompt text not null,
  explanation text,
  difficulty text,
  sort_order integer not null default 0,
  points numeric not null default 1,
  negative_points numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.assessment_options (
  id uuid primary key,
  question_id uuid not null references public.assessment_questions(id) on delete cascade,
  label text not null,
  text text not null,
  is_correct boolean not null default false,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.labs (
  id uuid primary key,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  slug text not null unique,
  title text not null,
  description text,
  language text not null default 'python',
  starter_code text,
  solution_code text,
  runner_config jsonb not null default '{}'::jsonb,
  expected_output jsonb not null default '{}'::jsonb,
  hint text,
  difficulty text,
  xp_reward integer not null default 0,
  sort_order integer not null default 0,
  status text not null default 'draft',
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.lab_parameters (
  id uuid primary key,
  lab_id uuid not null references public.labs(id) on delete cascade,
  key text not null,
  label text not null,
  input_type text not null default 'number',
  min_value numeric,
  max_value numeric,
  step_value numeric,
  default_value numeric,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.lab_test_cases (
  id uuid primary key,
  lab_id uuid not null references public.labs(id) on delete cascade,
  input_json jsonb not null default '{}'::jsonb,
  expected_json jsonb not null default '{}'::jsonb,
  is_hidden boolean not null default false,
  weight numeric not null default 1,
  sort_order integer not null default 0
);

create table if not exists public.badges (
  id uuid primary key,
  slug text not null unique,
  title text not null,
  description text,
  kind text,
  tier text,
  icon_url text,
  xp_reward integer not null default 0,
  rule jsonb not null default '{}'::jsonb,
  is_active boolean not null default true
);

create table if not exists public.rewards (
  id uuid primary key,
  slug text not null unique,
  title text not null,
  description text,
  reward_type text not null,
  value_json jsonb not null default '{}'::jsonb,
  is_active boolean not null default true
);

create table if not exists public.certificate_templates (
  id uuid primary key,
  slug text not null unique,
  title text not null,
  body_html text,
  background_url text,
  seal_url text,
  issuer_name text,
  status text not null default 'draft'
);

create table if not exists public.plans (
  id uuid primary key,
  slug text not null unique,
  name text not null,
  description text,
  price_cents integer not null default 0,
  currency text not null default 'TRY',
  ai_monthly_token_limit integer not null default 0,
  features jsonb not null default '{}'::jsonb,
  is_active boolean not null default true
);

create table if not exists public.feature_flags (
  key text primary key,
  is_enabled boolean not null default false,
  description text,
  rules jsonb not null default '{}'::jsonb
);

create table if not exists public.league_tiers (
  tier text primary key,
  name text not null,
  sort_order integer not null default 0,
  participants_per_group integer not null default 50,
  promotion_rank_max integer,
  safe_rank_max integer,
  demotion_rank_min integer,
  icon_url text,
  color text
);

create table if not exists public.league_seasons (
  id uuid primary key,
  season_no integer not null unique,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled',
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.league_groups (
  id uuid primary key,
  season_id uuid not null references public.league_seasons(id) on delete cascade,
  tier text not null references public.league_tiers(tier),
  group_no integer not null default 1
);

create table if not exists public.season_rewards (
  id uuid primary key,
  season_id uuid not null references public.league_seasons(id) on delete cascade,
  tier text not null references public.league_tiers(tier),
  rank_from integer not null,
  rank_to integer not null,
  badge_id uuid references public.badges(id) on delete set null,
  xp_reward integer not null default 0,
  title text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.content_reviews (
  id uuid primary key,
  entity_type text not null,
  entity_id uuid not null,
  reviewer_id uuid,
  status text not null default 'approved',
  comment text,
  reviewed_at timestamptz
);

create table if not exists public.content_embeddings (
  id uuid primary key,
  target_type text not null,
  target_id uuid not null,
  content text not null,
  embedding jsonb,
  model text not null,
  metadata jsonb not null default '{}'::jsonb,
  unique (target_type, target_id, model)
);

create table if not exists public.user_stats (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  total_xp integer not null default 0,
  level_number integer not null default 1,
  lessons_completed integer not null default 0,
  quizzes_completed integer not null default 0,
  labs_completed integer not null default 0,
  certificates_count integer not null default 0,
  streak_current integer not null default 0,
  streak_longest integer not null default 0,
  last_streak_date date,
  updated_at timestamptz not null default now()
);

create table if not exists public.path_enrollments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  path_id uuid not null references public.learning_paths(id) on delete cascade,
  status text not null default 'active',
  progress_percent numeric not null default 0,
  current_course_id uuid references public.courses(id) on delete set null,
  started_at timestamptz not null default now(),
  last_accessed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  primary key (user_id, path_id)
);

create table if not exists public.course_enrollments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'active',
  progress_percent numeric not null default 0,
  current_lesson_id uuid references public.lessons(id) on delete set null,
  total_xp_earned integer not null default 0,
  started_at timestamptz not null default now(),
  last_accessed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  primary key (user_id, course_id)
);

create table if not exists public.module_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  status text not null default 'not_started',
  progress_percent numeric not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  last_accessed_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

create table if not exists public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null default 'not_started',
  progress_percent numeric not null default 0,
  watched_seconds integer not null default 0,
  completed_content_blocks integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  last_position_seconds integer not null default 0,
  last_accessed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  primary key (user_id, lesson_id)
);

create table if not exists public.daily_goals (
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal_date date not null,
  target_lessons integer not null default 1,
  target_quizzes integer not null default 0,
  target_minutes integer not null default 10,
  completed_lessons integer not null default 0,
  completed_quizzes integer not null default 0,
  completed_minutes integer not null default 0,
  primary key (user_id, goal_date)
);

create table if not exists public.study_sessions (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  path_id uuid references public.learning_paths(id) on delete set null,
  course_id uuid references public.courses(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  source text not null default 'mobile',
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'started',
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  graded_at timestamptz,
  score numeric not null default 0,
  max_score numeric not null default 0,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  duration_seconds integer,
  result_level text,
  recommendation_path_id uuid references public.learning_paths(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.lab_submissions (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text,
  parameters jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  passed_tests integer not null default 0,
  total_tests integer not null default 0,
  score numeric not null default 0,
  status text not null default 'queued',
  run_time_ms integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete cascade,
  content_block_id uuid references public.lesson_content_blocks(id) on delete set null,
  title text,
  body text not null,
  color text,
  is_pinned boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  content_block_id uuid references public.lesson_content_blocks(id) on delete set null,
  highlighted_text text not null,
  start_offset integer,
  end_offset integer,
  color text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

create table if not exists public.ai_mentor_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete set null,
  title text not null,
  status text not null default 'active',
  model text,
  system_prompt_version text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_mentor_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_mentor_conversations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null,
  content text not null,
  token_input integer not null default 0,
  token_output integer not null default 0,
  latency_ms integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_usage_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.ai_mentor_conversations(id) on delete set null,
  source text not null,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  cost_estimate numeric not null default 0,
  currency text not null default 'USD',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recommendation_type text not null,
  target_type text not null,
  target_id uuid not null,
  reason text,
  score numeric not null default 0,
  is_seen boolean not null default false,
  is_accepted boolean not null default false,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text,
  target_type text,
  target_id uuid,
  is_read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  source_type text,
  source_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  awarded_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  path_id uuid references public.learning_paths(id) on delete set null,
  template_id uuid references public.certificate_templates(id) on delete set null,
  certificate_no text not null unique,
  title text not null,
  status text not null default 'issued',
  file_url text,
  verification_hash text,
  metadata jsonb not null default '{}'::jsonb,
  issued_at timestamptz not null default now()
);

create table if not exists public.league_participants (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.league_seasons(id) on delete cascade,
  group_id uuid references public.league_groups(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier text not null references public.league_tiers(tier),
  total_points integer not null default 0,
  rank integer,
  streak_count integer not null default 0,
  completed_lessons integer not null default 0,
  quiz_points integer not null default 0,
  lab_points integer not null default 0,
  promotion_status text,
  updated_at timestamptz not null default now(),
  unique (season_id, user_id)
);

create table if not exists public.league_point_events (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.league_seasons(id) on delete cascade,
  group_id uuid references public.league_groups(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_type text not null,
  source_id uuid,
  points integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.league_snapshots (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.league_seasons(id) on delete cascade,
  group_id uuid references public.league_groups(id) on delete cascade,
  standings jsonb not null default '[]'::jsonb,
  captured_at timestamptz not null default now()
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  responded_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references public.profiles(id) on delete cascade,
  opponent_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  target_type text not null,
  target_id uuid,
  points_stake integer not null default 0,
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_courses_path_id on public.courses(path_id);
create index if not exists idx_modules_course_id on public.modules(course_id);
create index if not exists idx_lessons_module_id on public.lessons(module_id);
create index if not exists idx_questions_assessment_id on public.assessment_questions(assessment_id);
create index if not exists idx_options_question_id on public.assessment_options(question_id);
create index if not exists idx_labs_lesson_id on public.labs(lesson_id);
create index if not exists idx_notes_user_lesson on public.notes(user_id, lesson_id);
create index if not exists idx_league_rank on public.league_participants(season_id, tier, rank);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists notes_updated_at on public.notes;
create trigger notes_updated_at before update on public.notes
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Baki'),
    nullif(split_part(new.email, '@', 1), ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_stats (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace view public.v_learning_path_catalog as
select
  lp.*,
  count(c.id)::integer as course_count
from public.learning_paths lp
left join public.courses c on c.path_id = lp.id and c.status = 'published'
where lp.status = 'published'
group by lp.id;

create or replace view public.v_course_catalog as
select
  c.*,
  lp.slug as path_slug,
  lp.title as path_title,
  count(distinct m.id)::integer as module_count,
  count(distinct l.id)::integer as lesson_count
from public.courses c
left join public.learning_paths lp on lp.id = c.path_id
left join public.modules m on m.course_id = c.id
left join public.lessons l on l.module_id = m.id
where c.status = 'published'
group by c.id, lp.slug, lp.title;

create or replace view public.v_assessment_options_safe as
select id, question_id, label, text, sort_order, metadata
from public.assessment_options;

create or replace view public.v_labs_safe as
select
  id, lesson_id, slug, title, description, language, starter_code,
  runner_config, expected_output, hint, difficulty, xp_reward, sort_order, status, metadata
from public.labs;

create or replace view public.v_my_dashboard as
select
  p.id as user_id,
  p.display_name,
  p.level_label,
  coalesce(us.total_xp, 0) as total_xp,
  coalesce(us.level_number, 1) as level_number,
  coalesce(us.lessons_completed, 0) as lessons_completed,
  coalesce(us.quizzes_completed, 0) as quizzes_completed,
  coalesce(us.labs_completed, 0) as labs_completed,
  coalesce(us.certificates_count, 0) as certificates_count,
  coalesce(us.streak_current, 0) as streak_current,
  pe.path_id,
  pe.progress_percent as path_progress_percent,
  ce.course_id,
  ce.progress_percent as course_progress_percent,
  ce.current_lesson_id
from public.profiles p
left join public.user_stats us on us.user_id = p.id
left join lateral (
  select * from public.path_enrollments pe
  where pe.user_id = p.id and pe.status = 'active'
  order by pe.last_accessed_at desc
  limit 1
) pe on true
left join lateral (
  select * from public.course_enrollments ce
  where ce.user_id = p.id and ce.status = 'active'
  order by ce.last_accessed_at desc
  limit 1
) ce on true
where p.id = auth.uid();

create or replace view public.v_current_leaderboard as
select
  lp.id,
  lp.season_id,
  lp.group_id,
  lp.user_id,
  coalesce(p.display_name, 'AI Learner') as display_name,
  p.avatar_url,
  lp.tier,
  lp.total_points,
  lp.rank,
  lp.streak_count,
  lp.completed_lessons,
  lp.quiz_points,
  lp.lab_points,
  lp.promotion_status
from public.league_participants lp
left join public.profiles p on p.id = lp.user_id
join public.league_seasons s on s.id = lp.season_id
where s.status = 'active';

create or replace function public.submit_placement_assessment(
  p_assessment_id uuid,
  p_correct_count integer,
  p_question_count integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_score_percent integer;
  v_level text;
  v_path uuid;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  v_score_percent := round((greatest(p_correct_count, 0)::numeric / greatest(p_question_count, 1)::numeric) * 100);
  v_level := case
    when v_score_percent >= 85 then 'advanced'
    when v_score_percent >= 60 then 'intermediate'
    else 'beginner'
  end;

  select id into v_path
  from public.learning_paths
  where level = v_level
  order by sort_order
  limit 1;

  insert into public.assessment_attempts (
    assessment_id, user_id, status, submitted_at, graded_at,
    score, max_score, correct_count, wrong_count, result_level, recommendation_path_id
  )
  values (
    p_assessment_id, v_user, 'graded', now(), now(),
    p_correct_count, p_question_count, p_correct_count, greatest(p_question_count - p_correct_count, 0), v_level, v_path
  );

  if v_path is not null then
    insert into public.path_enrollments (user_id, path_id, status, progress_percent, started_at, last_accessed_at)
    values (v_user, v_path, 'active', 0, now(), now())
    on conflict (user_id, path_id) do update set
      status = 'active',
      last_accessed_at = now();
  end if;

  return jsonb_build_object(
    'scorePercent', v_score_percent,
    'level', v_level,
    'recommendedPathId', v_path
  );
end;
$$;

create or replace function public.mark_lesson_progress(
  p_lesson_id uuid,
  p_progress_percent numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_status text;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  v_status := case when p_progress_percent >= 100 then 'completed' else 'in_progress' end;

  insert into public.lesson_progress (
    user_id, lesson_id, status, progress_percent, started_at,
    completed_at, last_accessed_at
  )
  values (
    v_user, p_lesson_id, v_status, least(100, greatest(0, p_progress_percent)),
    now(), case when v_status = 'completed' then now() else null end, now()
  )
  on conflict (user_id, lesson_id) do update set
    status = excluded.status,
    progress_percent = excluded.progress_percent,
    completed_at = coalesce(public.lesson_progress.completed_at, excluded.completed_at),
    last_accessed_at = now();

  return jsonb_build_object('lessonId', p_lesson_id, 'status', v_status, 'progressPercent', p_progress_percent);
end;
$$;

create index if not exists idx_notifications_celebration_queue
on public.notifications (user_id, is_read, created_at)
where (metadata->>'celebration') = 'true';

create index if not exists idx_notifications_celebration_dedupe
on public.notifications (user_id, ((metadata->>'dedupe_key')))
where (metadata->>'celebration') = 'true' and metadata ? 'dedupe_key';

create or replace function public.enqueue_celebration_notification(
  p_event_type text,
  p_title text,
  p_body text default null,
  p_target_type text default 'celebration',
  p_target_id uuid default null,
  p_asset_key text default null,
  p_dedupe_key text default null,
  p_target_route text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_existing public.notifications%rowtype;
  v_notification public.notifications%rowtype;
  v_metadata jsonb;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  v_metadata := coalesce(p_metadata, '{}'::jsonb)
    || jsonb_build_object(
      'celebration', true,
      'event_type', p_event_type,
      'asset_key', p_asset_key,
      'target_route', p_target_route
    );

  if p_dedupe_key is not null then
    v_metadata := v_metadata || jsonb_build_object('dedupe_key', p_dedupe_key);

    select *
    into v_existing
    from public.notifications
    where user_id = v_user
      and (metadata->>'celebration') = 'true'
      and metadata->>'dedupe_key' = p_dedupe_key
    order by created_at desc
    limit 1;

    if found then
      return jsonb_build_object(
        'id', v_existing.id,
        'created', false,
        'dedupeKey', p_dedupe_key
      );
    end if;
  end if;

  insert into public.notifications (
    user_id, notification_type, title, body, target_type, target_id, is_read, metadata
  )
  values (
    v_user, p_event_type, p_title, p_body, p_target_type, p_target_id, false, v_metadata
  )
  returning * into v_notification;

  return jsonb_build_object(
    'id', v_notification.id,
    'created', true,
    'dedupeKey', p_dedupe_key
  );
end;
$$;

create or replace function public.mark_notification_read(
  p_notification_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_notification public.notifications%rowtype;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  update public.notifications
  set is_read = true
  where id = p_notification_id
    and user_id = v_user
  returning * into v_notification;

  if not found then
    raise exception 'Notification not found';
  end if;

  return jsonb_build_object('id', v_notification.id, 'isRead', v_notification.is_read);
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','skills','interest_categories','learning_goals','learning_paths','learning_path_skills',
    'courses','course_skills','course_prerequisites','modules','lessons','lesson_content_blocks',
    'lesson_resources','glossary_terms','assessments','assessment_questions','assessment_options',
    'labs','lab_parameters','lab_test_cases','badges','rewards','certificate_templates','plans',
    'feature_flags','league_tiers','league_seasons','league_groups','season_rewards','content_reviews',
    'content_embeddings','user_stats','path_enrollments','course_enrollments','module_progress',
    'lesson_progress','daily_goals','study_sessions','assessment_attempts','lab_submissions','notes',
    'highlights','bookmarks','ai_mentor_conversations','ai_mentor_messages','ai_usage_ledger',
    'recommendations','notifications','user_badges','certificates','league_participants',
    'league_point_events','league_snapshots','friendships','challenges'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

create policy "public catalog select" on public.skills for select using (true);
create policy "public interest select" on public.interest_categories for select using (true);
create policy "public goals select" on public.learning_goals for select using (true);
create policy "public paths select" on public.learning_paths for select using (true);
create policy "public path skills select" on public.learning_path_skills for select using (true);
create policy "public courses select" on public.courses for select using (true);
create policy "public course skills select" on public.course_skills for select using (true);
create policy "public prerequisites select" on public.course_prerequisites for select using (true);
create policy "public modules select" on public.modules for select using (true);
create policy "public lessons select" on public.lessons for select using (true);
create policy "public lesson blocks select" on public.lesson_content_blocks for select using (true);
create policy "public lesson resources select" on public.lesson_resources for select using (true);
create policy "public glossary select" on public.glossary_terms for select using (true);
create policy "public assessments select" on public.assessments for select using (is_active);
create policy "public questions select" on public.assessment_questions for select using (true);
create policy "public options select" on public.assessment_options for select using (true);
create policy "public labs select" on public.labs for select using (true);
create policy "public lab params select" on public.lab_parameters for select using (true);
create policy "public lab cases select" on public.lab_test_cases for select using (not is_hidden);
create policy "public badges select" on public.badges for select using (true);
create policy "public rewards select" on public.rewards for select using (true);
create policy "public templates select" on public.certificate_templates for select using (true);
create policy "public plans select" on public.plans for select using (true);
create policy "public feature flags select" on public.feature_flags for select using (true);
create policy "public league tiers select" on public.league_tiers for select using (true);
create policy "public seasons select" on public.league_seasons for select using (true);
create policy "public groups select" on public.league_groups for select using (true);
create policy "public season rewards select" on public.season_rewards for select using (true);
create policy "public leaderboard select" on public.league_participants for select using (true);
create policy "public snapshots select" on public.league_snapshots for select using (true);

create policy "own profile select" on public.profiles for select using (id = auth.uid());
create policy "own profile update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "own stats select" on public.user_stats for select using (user_id = auth.uid());

create policy "own path enrollments" on public.path_enrollments for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own course enrollments" on public.course_enrollments for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own module progress" on public.module_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own lesson progress" on public.lesson_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own daily goals" on public.daily_goals for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own study sessions" on public.study_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own attempts" on public.assessment_attempts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own lab submissions" on public.lab_submissions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own notes" on public.notes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own highlights" on public.highlights for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own bookmarks" on public.bookmarks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own mentor conversations" on public.ai_mentor_conversations for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own mentor messages" on public.ai_mentor_messages for all using (user_id = auth.uid() or user_id is null) with check (user_id = auth.uid() or user_id is null);
create policy "own ai usage" on public.ai_usage_ledger for select using (user_id = auth.uid());
create policy "own recommendations" on public.recommendations for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own notifications" on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own badges" on public.user_badges for select using (user_id = auth.uid());
create policy "own certificates" on public.certificates for select using (user_id = auth.uid());
create policy "friendships visible" on public.friendships for all using (requester_id = auth.uid() or addressee_id = auth.uid()) with check (requester_id = auth.uid() or addressee_id = auth.uid());
create policy "challenges visible" on public.challenges for all using (challenger_id = auth.uid() or opponent_id = auth.uid()) with check (challenger_id = auth.uid() or opponent_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;

revoke all on public.assessment_options from anon, authenticated;
grant select (id, question_id, label, text, sort_order, metadata) on public.assessment_options to anon, authenticated;
grant select on public.v_assessment_options_safe to anon, authenticated;

revoke all on public.labs from anon, authenticated;
grant select (id, lesson_id, slug, title, description, language, starter_code, runner_config, expected_output, hint, difficulty, xp_reward, sort_order, status, metadata) on public.labs to anon, authenticated;
grant select on public.v_labs_safe to anon, authenticated;

grant execute on function public.submit_placement_assessment(uuid, integer, integer) to authenticated;
grant execute on function public.mark_lesson_progress(uuid, numeric) to authenticated;
grant execute on function public.enqueue_celebration_notification(text, text, text, text, uuid, text, text, text, jsonb) to authenticated;
grant execute on function public.mark_notification_read(uuid) to authenticated;

insert into storage.buckets (id, name, public)
values
  ('course-media', 'course-media', true),
  ('certificates', 'certificates', true)
on conflict (id) do update set public = excluded.public;
