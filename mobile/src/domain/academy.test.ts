import { describe, expect, it } from 'vitest';

import { lessonContentBlocks, lessons } from '../data/academy';
import {
  buildLessonLearningSteps,
  buildLessonQuiz,
  calculatePlacementResult,
  calculateProgressPercent,
  countCorrectPlacementAnswers,
  createEmptyLessonFlowState,
  formatDuration,
  formatLabResultMessage,
  gradeLessonQuiz,
  getLessonFlowTarget,
  getNextCourseLesson,
  getNextLessonInSequence,
  getPlacementStepLabel,
  getQuizResultMessage,
  isLessonUnlocked,
  isLastPlacementQuestion,
  runPerceptronLab,
} from './academy';

describe('academy domain helpers', () => {
  it('maps placement scores to the intermediate learning path used by the reference result screen', () => {
    const result = calculatePlacementResult(4, 5);

    expect(result.level).toBe('intermediate');
    expect(result.label).toBe('Orta');
    expect(result.recommendedPathSlug).toBe('orta-ai-engineering');
  });

  it('runs the perceptron mini lab with the reference slider values', () => {
    const output = runPerceptronLab({
      x1: 0.6,
      x2: -0.3,
      w1: 0.8,
      w2: -0.5,
      bias: 0.1,
    });

    expect(output.z).toBeCloseTo(0.73, 5);
    expect(output.output).toBe(1);
  });

  it('keeps progress and duration formatting stable for compact mobile cards', () => {
    expect(calculateProgressPercent(24, 42)).toBe(57);
    expect(formatDuration(144)).toBe('~ 2.4 Saat');
  });

  it('tracks placement as a real multi-question flow', () => {
    expect(getPlacementStepLabel(0, 5)).toBe('Soru 1 / 5');
    expect(getPlacementStepLabel(4, 5)).toBe('Soru 5 / 5');
    expect(isLastPlacementQuestion(3, 5)).toBe(false);
    expect(isLastPlacementQuestion(4, 5)).toBe(true);
  });

  it('counts placement answers without relying on hardcoded screen scores', () => {
    const correctCount = countCorrectPlacementAnswers(
      [
        { answerIndex: 1 },
        { answerIndex: 0 },
        { answerIndex: 3 },
      ],
      { 0: 1, 1: 2, 2: 3 },
    );

    expect(correctCount).toBe(2);
  });

  it('formats quiz and lab results without forcing navigation away', () => {
    expect(getQuizResultMessage({ isCorrect: true })).toBe('Dogru cevap. XP eklendi.');
    expect(getQuizResultMessage({ isCorrect: false, explanation: 'ReLU negatifleri 0 yapar.' })).toBe('ReLU negatifleri 0 yapar.');
    expect(formatLabResultMessage({ status: 'passed', output: 1, z: 0.73 })).toBe('Lab sonucu: passed. Cikti 1, z = 0.73.');
  });

  it('keeps lesson continuation inside the selected course', () => {
    const lessons = [
      { slug: 'course-a-l1', title: 'A1', courseSlug: 'course-a' },
      { slug: 'course-a-l2', title: 'A2', courseSlug: 'course-a' },
      { slug: 'course-b-l1', title: 'B1', courseSlug: 'course-b' },
    ];

    expect(getNextCourseLesson(lessons, 'course-a-l1')?.slug).toBe('course-a-l2');
    expect(getNextCourseLesson(lessons, 'course-a-l2')).toBeUndefined();
  });

  it('can continue across an ordered learning path sequence', () => {
    const lessons = [
      { slug: 'course-a-l2' },
      { slug: 'course-b-l1' },
    ];

    expect(getNextLessonInSequence(lessons, 'course-a-l2')?.slug).toBe('course-b-l1');
  });

  it('prioritizes lab work before moving to the next lesson', () => {
    expect(getLessonFlowTarget({ labSlug: 'python-lab', nextLesson: { slug: 'next', title: 'Next' } })).toMatchObject({
      kind: 'lab',
      label: "Mini Lab'a Git",
      labSlug: 'python-lab',
    });

    expect(getLessonFlowTarget({ nextLesson: { slug: 'next', title: 'Next' } })).toMatchObject({
      kind: 'next_lesson',
      label: 'Sonraki Derse Gec',
      nextLessonSlug: 'next',
    });
  });

  it('builds at least six teaching steps from real lesson content blocks', () => {
    const lesson = lessons.find((item) => item.slug === 'python-ai-temelleri-m2-l3')!;
    const blocks = lessonContentBlocks.filter((block) => block.lessonId === lesson.id);
    const steps = buildLessonLearningSteps(lesson, blocks);

    expect(steps.length).toBeGreaterThanOrEqual(6);
    expect(steps.map((step) => step.kind)).toContain('code');
    expect(steps.map((step) => step.kind)).toContain('lab');
    expect(steps[0].title).toBe('Öğrenme hedefi');
  });

  it('builds a five-question quiz and grades the 70 percent gate as four of five correct', () => {
    const lesson = lessons.find((item) => item.slug === 'python-ai-temelleri-m2-l3')!;
    const blocks = lessonContentBlocks.filter((block) => block.lessonId === lesson.id);
    const quiz = buildLessonQuiz(lesson, blocks);
    const fourCorrectAnswers = Object.fromEntries(
      quiz.questions.map((question, index) => [question.id, index < 4 ? question.answerIndex : (question.answerIndex + 1) % question.options.length]),
    );
    const threeCorrectAnswers = Object.fromEntries(
      quiz.questions.map((question, index) => [question.id, index < 3 ? question.answerIndex : (question.answerIndex + 1) % question.options.length]),
    );

    expect(quiz.questions).toHaveLength(5);
    expect(gradeLessonQuiz(quiz, fourCorrectAnswers, '2026-04-30T00:00:00.000Z')).toMatchObject({
      correctCount: 4,
      passed: true,
      scorePercent: 80,
    });
    expect(gradeLessonQuiz(quiz, threeCorrectAnswers, '2026-04-30T00:00:00.000Z')).toMatchObject({
      correctCount: 3,
      passed: false,
      scorePercent: 60,
    });
  });

  it('unlocks only the first lesson until the previous lesson quiz is completed', () => {
    const sequence = [
      { slug: 'lesson-1' },
      { slug: 'lesson-2' },
      { slug: 'lesson-3' },
    ];
    const state = createEmptyLessonFlowState();

    expect(isLessonUnlocked(sequence, 'lesson-1', state.completedLessonSlugs)).toBe(true);
    expect(isLessonUnlocked(sequence, 'lesson-2', state.completedLessonSlugs)).toBe(false);
    expect(isLessonUnlocked(sequence, 'lesson-2', ['lesson-1'])).toBe(true);
    expect(isLessonUnlocked(sequence, 'lesson-3', ['lesson-1'])).toBe(false);
  });
});
