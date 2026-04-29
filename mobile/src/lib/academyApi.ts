import type { User } from '@supabase/supabase-js';

import {
  courses as fallbackCourses,
  friendRanks as fallbackFriendRanks,
  interests as fallbackInterests,
  labs as fallbackLabs,
  leaderboard as fallbackLeaderboard,
  learningPaths as fallbackPaths,
  lessons as fallbackLessons,
  notes as fallbackNotes,
  placementQuestion as fallbackPlacementQuestion,
  placementQuestions as fallbackPlacementQuestions,
  quizQuestions as fallbackQuizQuestions,
} from '../data/academy';
import { calculatePlacementResult, formatDuration, runPerceptronLab, type PerceptronInput } from '../domain/academy';

async function getSupabaseClient() {
  return import('./supabase');
}

export type PathCard = {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  lessonCount: number;
  estimatedHours: number;
  status: 'active' | 'next' | 'locked';
};

export type CourseCard = {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  level: string;
  duration: string;
  moduleCount: number;
  lessonCount?: number;
  pathSlug?: string;
  progress: number;
};

export type LessonCard = {
  id?: string;
  slug: string;
  courseSlug?: string;
  title: string;
  type: 'Video' | 'Okuma' | 'Karma';
  duration: string;
  status: 'done' | 'active' | 'locked';
};

export type NoteCard = {
  id?: string;
  time: string;
  tag: string;
  text: string;
};

export type QuizQuestion = {
  id?: string;
  title: string;
  options: string[];
  optionIds?: string[];
  answerIndex?: number;
};

export type LabState = {
  id?: string;
  title: string;
  description: string;
  starterCode: string;
  values: PerceptronInput;
};

type PathCatalogRow = {
  id?: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  level?: string | null;
  estimated_minutes?: number | null;
  course_count?: number | null;
  lesson_count?: number | null;
  status?: string | null;
  sort_order?: number | null;
};

type CourseCatalogRow = {
  id?: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  level?: string | null;
  estimated_minutes?: number | null;
  module_count?: number | null;
  lesson_count?: number | null;
  status?: string | null;
};

type LessonCatalogRow = {
  id?: string;
  slug: string;
  title: string;
  lesson_type?: string | null;
  estimated_minutes?: number | null;
  sort_order?: number | null;
  metadata?: {
    course_slug?: string;
    module_order?: number;
    lesson_order?: number;
  } | null;
  modules?: {
    course_id?: string;
    courses?: {
      slug?: string;
    } | null;
  } | null;
};

export function mapPathCatalogRows(rows: PathCatalogRow[]): PathCard[] {
  return rows
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((row, index) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle ?? '',
      lessonCount: row.lesson_count ?? row.course_count ?? 0,
      estimatedHours: Math.max(1, Math.round((row.estimated_minutes ?? 60) / 60)),
      status: index === 0 || row.level === 'intermediate' ? 'active' : row.level === 'advanced' ? 'locked' : 'next',
    }));
}

export function mapCourseCatalogRows(rows: CourseCatalogRow[]): CourseCard[] {
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? '',
    level: row.level === 'intermediate' ? 'Orta' : row.level === 'advanced' ? 'Ileri' : 'Baslangic',
    duration: formatDuration(row.estimated_minutes ?? 0),
    moduleCount: row.module_count ?? 0,
    lessonCount: row.lesson_count ?? 0,
    pathSlug: (row as any).path_slug ?? (row as any).learning_path_slug,
    progress: 0,
  }));
}

export function formatAcademyError(error: unknown): string {
  const message = typeof error === 'object' && error && 'message' in error ? String((error as { message?: unknown }).message) : String(error ?? '');

  if (!message) return 'Beklenmeyen bir hata olustu.';
  if (message.includes('required secrets') || message.includes('DEEPSEEK')) {
    return 'AI Mentor icin Supabase DEEPSEEK_API_KEY secreti gerekli.';
  }
  if (message.toLowerCase().includes('provider') || message.toLowerCase().includes('oauth') || message.toLowerCase().includes('google')) {
    return 'Google girisi icin Supabase Google provider yapilandirmasi gerekli.';
  }
  if (message.toLowerCase().includes('auth')) {
    return 'Bu islem icin giris yapman gerekiyor.';
  }
  return message;
}

export async function getLearningPaths(): Promise<PathCard[]> {
  const { isSupabaseConfigured, supabase } = await getSupabaseClient();
  if (!isSupabaseConfigured) return fallbackPaths;
  const { data, error } = await supabase.from('v_learning_path_catalog').select('*').order('sort_order');
  if (error) throw error;
  if ((data ?? []).some((row: any) => typeof row.lesson_count !== 'number')) return fallbackPaths;
  const mapped = mapPathCatalogRows((data ?? []) as PathCatalogRow[]);
  if (mapped.length < 4 || mapped.reduce((sum, path) => sum + path.lessonCount, 0) < fallbackLessons.length) return fallbackPaths;
  return mapped;
}

export async function getCourseCatalog(): Promise<CourseCard[]> {
  const { isSupabaseConfigured, supabase } = await getSupabaseClient();
  if (!isSupabaseConfigured) {
    return fallbackCourses.map((course) => ({
      ...course,
      id: undefined,
      lessonCount: course.lessonCount ?? fallbackLessons.filter((lesson) => lesson.courseSlug === course.slug).length,
    }));
  }
  const { data, error } = await supabase.from('v_course_catalog').select('*').order('sort_order');
  if (error) throw error;
  const mapped = mapCourseCatalogRows((data ?? []) as CourseCatalogRow[]);
  if (mapped.length < 4) {
    return fallbackCourses.map((course) => ({
      ...course,
      id: undefined,
      lessonCount: course.lessonCount ?? fallbackLessons.filter((lesson) => lesson.courseSlug === course.slug).length,
    }));
  }
  return mapped;
}

export async function getLessons(): Promise<LessonCard[]> {
  const { isSupabaseConfigured, supabase } = await getSupabaseClient();
  if (!isSupabaseConfigured) return fallbackLessons;
  const { data, error } = await supabase
    .from('lessons')
    .select('id, slug, title, lesson_type, estimated_minutes, sort_order, metadata, modules!inner(course_id, courses!inner(slug))')
    .eq('status', 'published');
  if (error) throw error;
  if ((data ?? []).length < fallbackLessons.length) return fallbackLessons;
  return ((data ?? []) as LessonCatalogRow[])
    .map((row) => {
      const lessonOrder = row.metadata?.lesson_order ?? row.sort_order ?? 0;
      return {
        id: row.id,
        slug: row.slug,
        courseSlug: row.metadata?.course_slug ?? row.modules?.courses?.slug,
        title: row.title,
        type: (row.lesson_type === 'video' ? 'Video' : row.lesson_type === 'reading' ? 'Okuma' : 'Karma') as LessonCard['type'],
        duration: formatDuration(row.estimated_minutes ?? 0),
        status: (lessonOrder < 3 ? 'done' : lessonOrder === 3 ? 'active' : 'locked') as LessonCard['status'],
        order: (row.metadata?.module_order ?? 0) * 10 + lessonOrder,
      };
    })
    .sort((a, b) => (a.courseSlug ?? '').localeCompare(b.courseSlug ?? '') || a.order - b.order)
    .map(({ order: _order, ...lesson }) => lesson);
}

export async function getInterests(): Promise<string[]> {
  const { isSupabaseConfigured, supabase } = await getSupabaseClient();
  if (!isSupabaseConfigured) return fallbackInterests;
  const { data, error } = await supabase.from('interest_categories').select('name').eq('is_active', true).order('sort_order');
  if (error) throw error;
  return (data ?? []).map((row: any) => row.name);
}

export async function getPlacementQuestion(): Promise<QuizQuestion> {
  return fallbackPlacementQuestion;
}

export async function getPlacementQuestions(): Promise<QuizQuestion[]> {
  return fallbackPlacementQuestions;
}

export async function getNotes(): Promise<NoteCard[]> {
  const { isSupabaseConfigured, supabase } = await getSupabaseClient();
  if (!isSupabaseConfigured) return fallbackNotes;
  const { data, error } = await supabase.from('notes').select('id, title, body, created_at').order('created_at', { ascending: false }).limit(20);
  if (error) throw error;
  if (!data?.length) return fallbackNotes;
  return data.map((row: any) => ({
    id: row.id,
    time: new Date(row.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    tag: row.title ?? 'Not',
    text: row.body,
  }));
}

export async function getQuizQuestion(): Promise<QuizQuestion> {
  const { isSupabaseConfigured, supabase } = await getSupabaseClient();
  if (!isSupabaseConfigured) {
    return fallbackQuizQuestions[0];
  }
  const { data: question, error } = await supabase
    .from('assessment_questions')
    .select('id, prompt, explanation, sort_order, assessments!inner(assessment_type, status)')
    .neq('assessments.assessment_type', 'placement')
    .eq('assessments.status', 'published')
    .order('sort_order')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!question) return fallbackQuizQuestions[0];
  const { data: options, error: optionsError } = await supabase.from('v_assessment_options_safe').select('id, text, sort_order').eq('question_id', question.id).order('sort_order');
  if (optionsError) throw optionsError;
  return {
    id: question.id,
    title: question.prompt,
    options: (options ?? []).map((row: any) => row.text),
    optionIds: (options ?? []).map((row: any) => row.id),
  };
}

export async function getLab(): Promise<LabState> {
  const { isSupabaseConfigured, supabase } = await getSupabaseClient();
  const fallbackValues = { x1: 0.6, x2: -0.3, w1: 0.8, w2: -0.5, bias: 0.1 };
  const fallbackLab = fallbackLabs[0];
  if (!isSupabaseConfigured) {
    return {
      id: fallbackLab.id,
      title: fallbackLab.title,
      description: fallbackLab.description,
      starterCode: fallbackLab.starterCode,
      values: fallbackValues,
    };
  }
  const { data, error } = await supabase.from('v_labs_safe').select('*').eq('status', 'published').order('sort_order').limit(1).maybeSingle();
  if (error) throw error;
  if (!data) {
    return {
      id: fallbackLab.id,
      title: fallbackLab.title,
      description: fallbackLab.description,
      starterCode: fallbackLab.starterCode,
      values: fallbackValues,
    };
  }
  const { data: params } = await supabase.from('lab_parameters').select('key, default_value').eq('lab_id', data.id);
  const values = { ...fallbackValues };
  for (const param of params ?? []) {
    if (param.key in values) values[param.key as keyof PerceptronInput] = Number(param.default_value);
  }
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    starterCode: data.starter_code,
    values,
  };
}

export async function getLeaderboard() {
  const { isSupabaseConfigured, supabase } = await getSupabaseClient();
  if (!isSupabaseConfigured) return fallbackLeaderboard;
  const { data, error } = await supabase.from('v_current_leaderboard').select('*').order('rank', { ascending: true }).limit(20);
  if (error) throw error;
  if (!data?.length) return fallbackLeaderboard;
  return data.map((row: any) => ({ rank: row.rank ?? 0, name: row.display_name, points: row.total_points, delta: 0 }));
}

export async function getFriendRanks() {
  return fallbackFriendRanks;
}

export async function submitPlacement(correctCount: number, questionCount: number) {
  const { isSupabaseConfigured, supabase } = await getSupabaseClient();
  const local = calculatePlacementResult(correctCount, questionCount);
  if (!isSupabaseConfigured) return local;
  const { data, error } = await supabase.rpc('submit_placement', { p_correct_count: correctCount, p_question_count: questionCount });
  if (error) throw error;
  return { ...local, scorePercent: Number((data as any)?.scorePercent ?? local.scorePercent) };
}

export async function saveSelectedInterests(interests: string[]) {
  const { isSupabaseConfigured, supabase } = await getSupabaseClient();
  if (!isSupabaseConfigured) return { saved: false, interests };
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { saved: false, interests };
  const { data, error } = await supabase.rpc('save_interests', { p_interest_names: interests });
  if (error) throw error;
  return data ?? { saved: true, interests };
}

export async function updateLessonProgress(lessonId: string | undefined, progressPercent: number) {
  const { isSupabaseConfigured, supabase } = await getSupabaseClient();
  if (!isSupabaseConfigured || !lessonId) return { status: progressPercent >= 100 ? 'completed' : 'in_progress' };
  const { data, error } = await supabase.rpc('update_lesson_progress', { p_lesson_id: lessonId, p_progress_percent: progressPercent });
  if (error) throw error;
  return data;
}

export async function submitQuizAnswer(questionId: string | undefined, optionId: string | undefined) {
  const { isSupabaseConfigured, supabase } = await getSupabaseClient();
  if (!isSupabaseConfigured || !questionId || !optionId) return { isCorrect: true, explanation: 'Demo modunda cevap dogru kabul edildi.' };
  const { data, error } = await supabase.rpc('submit_quiz_answer', { p_question_id: questionId, p_option_id: optionId });
  if (error) throw error;
  return data as { isCorrect: boolean; explanation?: string };
}

export async function saveNote(lessonId: string | undefined, body: string, title = 'Ders Notu') {
  const { isSupabaseConfigured, supabase } = await getSupabaseClient();
  if (!isSupabaseConfigured || !lessonId) return { body };
  const { data, error } = await supabase.rpc('save_note', { p_lesson_id: lessonId, p_body: body, p_title: title });
  if (error) throw error;
  return data;
}

export async function toggleBookmark(targetType: string, targetId: string | undefined) {
  const { isSupabaseConfigured, supabase } = await getSupabaseClient();
  if (!isSupabaseConfigured || !targetId) return { bookmarked: true };
  const { data, error } = await supabase.rpc('toggle_bookmark', { p_target_type: targetType, p_target_id: targetId });
  if (error) throw error;
  return data;
}

export async function submitLab(labId: string | undefined, values: PerceptronInput) {
  const { isSupabaseConfigured, supabase } = await getSupabaseClient();
  const result = runPerceptronLab(values);
  if (!isSupabaseConfigured || !labId) return { ...result, status: 'passed' };
  const { data, error } = await supabase.rpc('submit_lab_submission', {
    p_lab_id: labId,
    p_parameters: values,
    p_code: null,
    p_passed_tests: result.output === 1 ? 1 : 0,
    p_total_tests: 1,
  });
  if (error) throw error;
  return { ...result, ...(data as object) };
}

export async function issueCertificate(courseId: string | undefined) {
  const { isSupabaseConfigured, supabase } = await getSupabaseClient();
  if (!isSupabaseConfigured || !courseId) return null;
  const { data, error } = await supabase.rpc('issue_certificate', { p_course_id: courseId });
  if (error) throw error;
  return data;
}

export function getDisplayName(user: User | null | undefined) {
  return user?.user_metadata?.display_name ?? user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Baki';
}
