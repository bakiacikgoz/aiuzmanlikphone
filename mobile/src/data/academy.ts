import {
  datasetCourses,
  datasetLabs,
  datasetLearningPaths,
  datasetLessonContentBlocks,
  datasetLessons,
  datasetPlacementQuestions,
  datasetQuizQuestions,
} from './catalog.generated';

export type LearningPath = {
  id?: string;
  slug: string;
  title: string;
  subtitle: string;
  lessonCount: number;
  estimatedHours: number;
  status: 'active' | 'next' | 'locked';
};

export type Course = {
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

export type Lesson = {
  id?: string;
  slug: string;
  courseSlug?: string;
  title: string;
  type: 'Video' | 'Okuma' | 'Karma';
  duration: string;
  status: 'done' | 'active' | 'locked';
};

export type LessonContentBlock = {
  id?: string;
  lessonId: string;
  type: 'callout' | 'markdown' | 'code' | 'lab_embed';
  title: string;
  body: string;
  mediaUrl?: string;
  codeLanguage?: string;
  code?: string;
  calloutVariant?: string;
  data: Record<string, unknown>;
  sortOrder: number;
};

export type QuizSeedQuestion = {
  id?: string;
  title: string;
  options: string[];
  optionIds?: string[];
  answerIndex: number;
};

export type LabSeed = {
  id?: string;
  slug: string;
  title: string;
  description: string;
  starterCode: string;
  difficulty: string;
  xpReward: number;
};

export const learningPaths: LearningPath[] = datasetLearningPaths.map((path) => ({ ...path }));
export const courses: Course[] = datasetCourses.map((course) => ({ ...course }));
export const featuredCourse: Course = courses.find((course) => course.slug === 'neural-networks-101') ?? courses[0];
export const lessons: Lesson[] = datasetLessons.map((lesson) => ({ ...lesson }));
export const lessonContentBlocks: LessonContentBlock[] = datasetLessonContentBlocks.map((block) => ({ ...block }));
export const placementQuestions: QuizSeedQuestion[] = datasetPlacementQuestions.map((question) => ({
  ...question,
  options: [...question.options],
  optionIds: [...question.optionIds],
}));
export const placementQuestion = placementQuestions[0];
export const quizQuestions: QuizSeedQuestion[] = datasetQuizQuestions.map((question) => ({
  ...question,
  options: [...question.options],
  optionIds: [...question.optionIds],
}));
export const labs: LabSeed[] = datasetLabs.map((lab) => ({ ...lab }));

export const interests = [
  'Python',
  'Makine Öğrenmesi',
  'Derin Öğrenme',
  'MLOps',
  'LLM',
  'Prompt Engineering',
  'Veri Analizi',
  'Bilgisayarlı Görü',
];

export const notes = [
  {
    time: '06:24',
    tag: 'Aktivasyon',
    text: 'ReLU, negatif değerlerde 0 çıktığı için hesaplama daha hızlıdır.',
  },
  {
    time: '08:47',
    tag: 'Önemli',
    text: 'Sigmoid fonksiyonu 0 ile 1 arasında çıktı verdiği için olasılık yorumları için uygundur.',
  },
  {
    time: '10:15',
    tag: 'Tekrar',
    text: 'Tanh, çıktılarını -1 ile 1 arasında sınırlar ve sıfır merkezlidir.',
  },
];

export const leaderboard = [
  { rank: 1, name: 'Emir', points: 2480, delta: 0 },
  { rank: 2, name: 'Zeynep', points: 2150, delta: 0 },
  { rank: 3, name: 'Ayşe', points: 2030, delta: 0 },
  { rank: 4, name: 'Ali Yılmaz', points: 1950, delta: 2 },
  { rank: 5, name: 'Kerem', points: 1920, delta: -1 },
  { rank: 6, name: 'Aslı', points: 1890, delta: 3 },
  { rank: 7, name: 'Mete', points: 1760, delta: -2 },
  { rank: 8, name: 'Selin', points: 1680, delta: 0 },
  { rank: 9, name: 'Burak', points: 1620, delta: 1 },
  { rank: 10, name: 'Duygu', points: 1560, delta: -1 },
  { rank: 12, name: 'Baki', points: 1840, delta: 0 },
];

export const friendRanks = [
  { rank: 1, name: 'Mert', points: 1935, streak: '12 günlük seri' },
  { rank: 2, name: 'Baki', points: 1840, streak: '9 günlük seri' },
  { rank: 3, name: 'Elif', points: 1620, streak: '7 günlük seri' },
  { rank: 4, name: 'Deniz', points: 1430, streak: '6 günlük seri' },
  { rank: 5, name: 'Sena', points: 1210, streak: '4 günlük seri' },
];
