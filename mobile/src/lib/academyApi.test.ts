import { describe, expect, it } from 'vitest';

import { courses, labs, learningPaths, lessonContentBlocks, lessons, placementQuestions, quizQuestions } from '../data/academy';
import type { LessonQuizResult } from '../domain/academy';
import {
  formatAcademyError,
  getLab,
  getLessonContentBlocks,
  getLessonFlowState,
  mapCourseCatalogRows,
  mapPathCatalogRows,
  resetLessonQuizAttempt,
  saveLessonQuizResult,
  saveLessonStepProgress,
} from './academyApi';

describe('academyApi mapping helpers', () => {
  it('maps Supabase path catalog rows into compact mobile cards', () => {
    const paths = mapPathCatalogRows([
      {
        id: 'path-1',
        slug: 'orta-ai-engineering',
        title: 'Orta',
        subtitle: 'Makine ogrenmesi',
        level: 'intermediate',
        estimated_minutes: 600,
        course_count: 2,
        status: 'published',
        sort_order: 2,
      },
      {
        id: 'path-2',
        slug: 'ileri-ai-engineering',
        title: 'Ileri',
        subtitle: 'MLOps',
        level: 'advanced',
        estimated_minutes: 720,
        course_count: 1,
        status: 'published',
        sort_order: 3,
      },
    ]);

    expect(paths).toEqual([
      {
        id: 'path-1',
        slug: 'orta-ai-engineering',
        title: 'Orta',
        subtitle: 'Makine ogrenmesi',
        lessonCount: 2,
        estimatedHours: 10,
        status: 'active',
      },
      {
        id: 'path-2',
        slug: 'ileri-ai-engineering',
        title: 'Ileri',
        subtitle: 'MLOps',
        lessonCount: 1,
        estimatedHours: 12,
        status: 'locked',
      },
    ]);
  });

  it('maps course rows with module and lesson counts', () => {
    const [course] = mapCourseCatalogRows([
      {
        id: 'course-1',
        slug: 'neural-networks-101',
        title: 'Neural Networks 101',
        subtitle: 'Yapay sinir aglari',
        level: 'intermediate',
        estimated_minutes: 150,
        module_count: 3,
        lesson_count: 12,
        status: 'published',
      },
    ]);

    expect(course).toMatchObject({
      id: 'course-1',
      slug: 'neural-networks-101',
      duration: '~ 2.5 Saat',
      moduleCount: 3,
      lessonCount: 12,
      progress: 0,
    });
  });

  it('normalizes Supabase and Edge Function errors for the UI', () => {
    expect(formatAcademyError({ message: 'Function is missing required secrets.' })).toContain('DEEPSEEK_API_KEY');
    expect(formatAcademyError({ message: 'provider is not enabled' })).toContain('Google');
    expect(formatAcademyError(null)).toBe('Beklenmeyen bir hata olustu.');
  });

  it('uses the real seed catalog instead of handwritten training placeholders', () => {
    expect(learningPaths).toHaveLength(4);
    expect(courses).toHaveLength(14);
    expect(lessons).toHaveLength(126);
    expect(lessonContentBlocks).toHaveLength(420);
    expect(placementQuestions).toHaveLength(12);
    expect(quizQuestions.length).toBeGreaterThan(190);
    expect(labs).toHaveLength(42);
    expect(lessons.filter((lesson) => lesson.courseSlug === 'neural-networks-101')).toHaveLength(9);
  });

  it('resolves all lessons for the beginner learning path', () => {
    const beginnerPath = learningPaths.find((path) => path.slug === 'baslangic-ai-engineering');
    const beginnerCourses = courses.filter((course) => course.pathSlug === beginnerPath?.slug);
    const beginnerCourseSlugs = new Set(beginnerCourses.map((course) => course.slug));
    const beginnerLessons = lessons.filter((lesson) => lesson.courseSlug && beginnerCourseSlugs.has(lesson.courseSlug));

    expect(beginnerPath).toBeDefined();
    expect(beginnerCourses).toHaveLength(4);
    expect(beginnerLessons).toHaveLength(36);
    expect(beginnerLessons).toHaveLength(beginnerPath?.lessonCount ?? 0);
  });

  it('loads sorted fallback content blocks for a selected lesson', async () => {
    const lesson = lessons.find((item) => item.slug === 'python-ai-temelleri-m1-l3');
    const blocks = await getLessonContentBlocks(lesson?.id);

    expect(blocks).toHaveLength(4);
    expect(blocks.map((block) => block.type)).toEqual(['callout', 'markdown', 'code', 'lab_embed']);
    expect(blocks.map((block) => block.sortOrder)).toEqual([1, 2, 3, 4]);
    expect(blocks[1].body).toContain('Fonksiyonlar, modüller ve hata yönetimi');
  });

  it('loads the requested fallback lab by slug', async () => {
    const lab = await getLab('python-ai-temelleri-m2-lab');

    expect(lab.title).toBe('Mini Lab: Veri yapıları ve dosya işlemleri');
  });

  it('persists lesson flow progress in the fallback storage layer', async () => {
    const lessonSlug = 'storage-test-lesson';
    await resetLessonQuizAttempt(lessonSlug);
    await saveLessonStepProgress(lessonSlug, 3);

    let state = await getLessonFlowState();
    expect(state.stepProgressByLessonSlug[lessonSlug]).toBe(3);

    const passedResult: LessonQuizResult = {
      lessonSlug,
      questionCount: 5,
      correctCount: 4,
      scorePercent: 80,
      passed: true,
      submittedAt: '2026-04-30T00:00:00.000Z',
    };
    await saveLessonQuizResult(lessonSlug, passedResult);

    state = await getLessonFlowState();
    expect(state.completedLessonSlugs).toContain(lessonSlug);
    expect(state.quizResultsByLessonSlug[lessonSlug]).toMatchObject({ passed: true, correctCount: 4 });

    await resetLessonQuizAttempt(lessonSlug);
    state = await getLessonFlowState();
    expect(state.completedLessonSlugs).not.toContain(lessonSlug);
    expect(state.quizResultsByLessonSlug[lessonSlug]).toBeUndefined();
  });
});
