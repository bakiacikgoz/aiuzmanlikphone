import { describe, expect, it } from 'vitest';

import { courses, labs, learningPaths, lessons, placementQuestions, quizQuestions } from '../data/academy';
import { formatAcademyError, mapCourseCatalogRows, mapPathCatalogRows } from './academyApi';

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
    expect(placementQuestions).toHaveLength(12);
    expect(quizQuestions.length).toBeGreaterThan(190);
    expect(labs).toHaveLength(42);
    expect(lessons.filter((lesson) => lesson.courseSlug === 'neural-networks-101')).toHaveLength(9);
  });
});
