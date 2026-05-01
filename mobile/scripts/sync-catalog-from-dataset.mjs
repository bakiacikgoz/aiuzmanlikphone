import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const mobileRoot = resolve(scriptDir, '..');
const workspaceRoot = resolve(mobileRoot, '..');
const sourcePath = resolve(workspaceRoot, 'data/json/catalog_full.json');
const outputPath = resolve(mobileRoot, 'src/data/catalog.generated.ts');

const catalog = JSON.parse(readFileSync(sourcePath, 'utf8'));

const levelLabels = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
  expert: 'Uzman',
};

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} dk`;
  const hours = minutes / 60;
  return `~ ${Number.isInteger(hours) ? hours : hours.toFixed(1)} Saat`;
}

const pathById = new Map(catalog.paths.map((path) => [path.id, path]));
const modulesById = new Map(catalog.modules.map((module) => [module.id, module]));
const courseById = new Map(catalog.courses.map((course) => [course.id, course]));
const courseSlugById = new Map(catalog.courses.map((course) => [course.id, course.slug]));

const lessonsByCourseId = new Map();
for (const lesson of catalog.lessons) {
  const module = modulesById.get(lesson.module_id);
  if (!module) continue;
  const list = lessonsByCourseId.get(module.course_id) ?? [];
  list.push(lesson);
  lessonsByCourseId.set(module.course_id, list);
}

const modulesByCourseId = new Map();
for (const module of catalog.modules) {
  const list = modulesByCourseId.get(module.course_id) ?? [];
  list.push(module);
  modulesByCourseId.set(module.course_id, list);
}

const pathStatus = ['active', 'next', 'locked', 'locked'];
const learningPaths = catalog.paths
  .slice()
  .sort((a, b) => a.sort_order - b.sort_order)
  .map((path, index) => {
    const courses = catalog.courses.filter((course) => course.path_id === path.id);
    const lessonCount = courses.reduce((total, course) => total + (lessonsByCourseId.get(course.id)?.length ?? 0), 0);
    return {
      id: path.id,
      slug: path.slug,
      title: path.title,
      subtitle: path.subtitle,
      lessonCount,
      estimatedHours: Math.max(1, Math.round(path.estimated_minutes / 60)),
      status: pathStatus[index] ?? 'locked',
    };
  });

const progressBySortOrder = [72, 44, 18, 30, 65, 10, 8, 0, 0, 0, 0, 0, 0, 0];
const courses = catalog.courses
  .slice()
  .sort((a, b) => a.sort_order - b.sort_order)
  .map((course, index) => ({
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle,
    level: levelLabels[course.level] ?? course.level,
    duration: formatDuration(course.estimated_minutes),
    moduleCount: modulesByCourseId.get(course.id)?.length ?? 0,
    lessonCount: lessonsByCourseId.get(course.id)?.length ?? 0,
    pathSlug: pathById.get(course.path_id)?.slug,
    progress: progressBySortOrder[index] ?? 0,
  }));

const lessonTypeLabels = {
  video: 'Video',
  reading: 'Okuma',
  mixed: 'Karma',
};

const lessons = catalog.lessons
  .slice()
  .sort((a, b) => {
    const moduleA = modulesById.get(a.module_id);
    const moduleB = modulesById.get(b.module_id);
    const courseA = courseById.get(moduleA?.course_id);
    const courseB = courseById.get(moduleB?.course_id);
    return (
      (courseA?.sort_order ?? 0) - (courseB?.sort_order ?? 0)
      || (moduleA?.sort_order ?? 0) - (moduleB?.sort_order ?? 0)
      || a.sort_order - b.sort_order
    );
  })
  .map((lesson) => {
    const module = modulesById.get(lesson.module_id);
    const courseSlug = module ? courseSlugById.get(module.course_id) : lesson.metadata?.course_slug;
    const lessonOrder = lesson.metadata?.lesson_order ?? lesson.sort_order;
    return {
      id: lesson.id,
      slug: lesson.slug,
      courseSlug,
      title: lesson.title,
      type: lessonTypeLabels[lesson.lesson_type] ?? 'Karma',
      duration: formatDuration(lesson.estimated_minutes),
      status: lessonOrder < 3 ? 'done' : lessonOrder === 3 ? 'active' : 'locked',
    };
  });

const lessonContentBlocks = catalog.blocks
  .slice()
  .sort((a, b) => a.lesson_id.localeCompare(b.lesson_id) || a.sort_order - b.sort_order)
  .map((block) => ({
    id: block.id,
    lessonId: block.lesson_id,
    type: block.block_type,
    title: block.title ?? '',
    body: block.body ?? '',
    mediaUrl: block.media_url ?? undefined,
    codeLanguage: block.code_language ?? undefined,
    code: block.code ?? undefined,
    calloutVariant: block.callout_variant ?? undefined,
    data: block.data ?? {},
    sortOrder: block.sort_order,
  }));

function mapQuestion(question) {
  const options = catalog.options
    .filter((option) => option.question_id === question.id)
    .sort((a, b) => a.sort_order - b.sort_order);
  return {
    id: question.id,
    title: question.prompt,
    options: options.map((option) => option.text),
    optionIds: options.map((option) => option.id),
    answerIndex: Math.max(0, options.findIndex((option) => option.is_correct)),
  };
}

const placementAssessment = catalog.assessments.find((assessment) => assessment.assessment_type === 'placement');
const placementQuestions = catalog.questions
  .filter((question) => question.assessment_id === placementAssessment?.id)
  .sort((a, b) => a.sort_order - b.sort_order)
  .map(mapQuestion);

const quizAssessmentIds = new Set(
  catalog.assessments
    .filter((assessment) => assessment.assessment_type !== 'placement' && assessment.status === 'published')
    .map((assessment) => assessment.id),
);
const quizQuestions = catalog.questions
  .filter((question) => quizAssessmentIds.has(question.assessment_id))
  .sort((a, b) => a.sort_order - b.sort_order)
  .map(mapQuestion);

const labs = catalog.labs
  .filter((lab) => lab.status === 'published')
  .map((lab) => ({
    id: lab.id,
    slug: lab.slug,
    title: lab.title,
    description: lab.description,
    starterCode: lab.starter_code,
    difficulty: lab.difficulty,
    xpReward: lab.xp_reward,
  }));

const output = `// Generated from ../data/json/catalog_full.json by scripts/sync-catalog-from-dataset.mjs.
// Do not edit this file by hand; update the source dataset and rerun npm run sync:catalog.

export const datasetLearningPaths = ${JSON.stringify(learningPaths, null, 2)} as const;

export const datasetCourses = ${JSON.stringify(courses, null, 2)} as const;

export const datasetLessons = ${JSON.stringify(lessons, null, 2)} as const;

export const datasetLessonContentBlocks = ${JSON.stringify(lessonContentBlocks, null, 2)} as const;

export const datasetPlacementQuestions = ${JSON.stringify(placementQuestions, null, 2)} as const;

export const datasetQuizQuestions = ${JSON.stringify(quizQuestions, null, 2)} as const;

export const datasetLabs = ${JSON.stringify(labs, null, 2)} as const;
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, output, 'utf8');
console.log(`Wrote ${outputPath}`);
console.log(`Catalog: ${learningPaths.length} paths, ${courses.length} courses, ${lessons.length} lessons, ${lessonContentBlocks.length} blocks, ${placementQuestions.length} placement questions, ${quizQuestions.length} quiz questions, ${labs.length} labs.`);
