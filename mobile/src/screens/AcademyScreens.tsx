import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ComponentType } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  Bot,
  Calendar,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  Flame,
  GraduationCap,
  Lightbulb,
  Lock,
  Play,
  Plus,
  RotateCcw,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  User,
  Zap,
} from 'lucide-react-native';

import {
  Card,
  FeatureRow,
  Header,
  LogoTitle,
  OutlineButton,
  Pill,
  PrimaryButton,
  ProgressBar,
  Screen,
  SectionTitle,
  StatCard,
} from '../components/AcademyPrimitives';
import {
  CertificateVisual,
  CourseHeroVisual,
  CourseThumbVisual,
  LeagueMedalVisual,
  LevelBadgeVisual,
  MentorRobotVisual,
  SeasonRewardVisual,
  SplashHeroVisual,
  TargetVisual,
} from '../components/AcademyVisuals';
import { useAuth } from '../auth/AuthProvider';
import {
  buildLessonLearningSteps,
  buildLessonQuiz,
  calculatePlacementResult,
  calculateProgressPercent,
  countCorrectPlacementAnswers,
  createEmptyLessonFlowState,
  formatLabResultMessage,
  getNextLessonInSequence,
  getPlacementStepLabel,
  getQuizResultMessage,
  gradeLessonQuiz,
  isLessonUnlocked,
  isLastPlacementQuestion,
  runPerceptronLab,
  type LessonFlowState,
  type LessonLearningStep,
  type LessonQuiz,
  type LessonQuizResult,
} from '../domain/academy';
import {
  formatAcademyError,
  getCourseCatalog,
  getDisplayName,
  getFriendRanks,
  getInterests,
  getLab,
  getLeaderboard,
  getLearningPaths,
  getLessonContentBlocks,
  getLessonFlowState,
  getLessons,
  getNotes,
  getPlacementQuestions,
  getQuizQuestion,
  issueCertificate,
  resetLessonQuizAttempt,
  saveNote,
  saveLessonQuizResult,
  saveLessonStepProgress,
  saveSelectedInterests,
  submitLab,
  submitPlacement,
  submitQuizAnswer,
  toggleBookmark,
  updateLessonProgress,
  type CourseCard,
  type LabState,
  type LessonCard,
  type LessonContentBlock,
  type NoteCard,
  type PathCard,
  type QuizQuestion,
} from '../lib/academyApi';
import { askMentor } from '../lib/mentor';
import { colors, radius, spacing } from '../theme';

type ScreenIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number; style?: object }>;

function useAsyncData<T>(loader: () => Promise<T>, initialValue: T) {
  const [data, setData] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    loader()
      .then((nextData) => {
        if (mounted) setData(nextData);
      })
      .catch((nextError) => {
        if (mounted) setError(formatAcademyError(nextError));
      });
    return () => {
      mounted = false;
    };
  }, [loader]);

  return { data, error, setData };
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function SplashScreen() {
  return (
    <Screen scroll={false}>
      <StatusBar style="light" />
      <View style={styles.splash}>
        <LogoTitle compact dark />
        <Text style={styles.splashTitle}>Dogru seviyeden baslayarak AI muhendisliginde ustalas.</Text>
        <SplashHeroVisual height={280} />
        <PrimaryButton title="Basla" onPress={() => router.push('/placement-intro')} />
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </Screen>
  );
}

export function PlacementIntroScreen() {
  return (
    <Screen scroll={false}>
      <StatusBar style="dark" />
      <Header back />
      <View style={styles.centeredScreen}>
        <TargetVisual height={190} />
        <Text style={styles.bigTitle}>Seviyeni Belirleyelim</Text>
        <Text style={styles.centerBody}>Kisa bir test ile bilgi seviyeni olcelim ve sana en uygun ogrenme yolunu olusturalim.</Text>
        <View style={styles.featureStack}>
          <FeatureRow icon={User} title="Kisisellestirilmis" body="Seviyene uygun iceriklerle ogren." />
          <FeatureRow icon={Zap} title="Hizli Test" body="Sadece 5 soruluk kisa bir test." tone="purple" />
          <FeatureRow icon={ShieldCheck} title="Dogru Seviye" body="Dogru baslangic, hizli ilerleme." />
        </View>
        <View style={styles.bottomAction}>
          <PrimaryButton title="Teste Basla" onPress={() => router.push('/placement-question')} />
        </View>
      </View>
    </Screen>
  );
}

export function PlacementQuestionScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [flowError, setFlowError] = useState<string | null>(null);
  const { data: placementQuestions, error } = useAsyncData<QuizQuestion[]>(getPlacementQuestions, [
    {
      title: 'Asagidakilerden hangisi denetimli ogrenme ornegidir?',
      options: ['K-means', 'Spam tespiti', 'Pazar sepeti', 'Anomali'],
      answerIndex: 1,
    },
  ]);
  const questions = placementQuestions.length ? placementQuestions : [];
  const placementQuestion = questions[currentIndex] ?? questions[0];
  const selected = selectedAnswers[currentIndex];

  async function continuePlacement() {
    if (!placementQuestion || typeof selected !== 'number') {
      setFlowError('Devam etmek icin bir cevap sec.');
      return;
    }
    const nextAnswers = { ...selectedAnswers, [currentIndex]: selected };
    setSelectedAnswers(nextAnswers);
    setFlowError(null);
    if (!isLastPlacementQuestion(currentIndex, questions.length)) {
      setCurrentIndex((index) => index + 1);
      return;
    }
    const correctCount = countCorrectPlacementAnswers(questions, nextAnswers);
    await submitPlacement(correctCount, questions.length);
    router.push('/level-result');
  }

  return (
    <Screen scroll={false}>
      <StatusBar style="dark" />
      <Header back right={<Text style={styles.stepLabel}>{getPlacementStepLabel(currentIndex, questions.length || 1)}</Text>} />
      <ProgressBar value={((currentIndex + 1) / Math.max(1, questions.length)) * 100} />
      <View style={styles.questionWrap}>
        {error || flowError ? <Text style={styles.errorText}>{error ?? flowError}</Text> : null}
        <Text style={styles.questionText}>{placementQuestion?.title}</Text>
        {placementQuestion?.options.map((option, index) => {
          const active = selected === index;
          return (
            <Pressable
              key={option}
              onPress={() => {
                setSelectedAnswers((answers) => ({ ...answers, [currentIndex]: index }));
                setFlowError(null);
              }}
              style={[styles.optionRow, active && styles.optionRowActive]}
            >
              <View style={[styles.optionBadge, active && styles.optionBadgeActive]}>
                <Text style={[styles.optionBadgeText, active && styles.optionBadgeTextActive]}>{String.fromCharCode(65 + index)}</Text>
              </View>
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.rowGap}>
        <OutlineButton title="Geri" onPress={() => (currentIndex > 0 ? setCurrentIndex((index) => index - 1) : router.back())} style={styles.rowButton} />
        <PrimaryButton title={isLastPlacementQuestion(currentIndex, questions.length) ? 'Sonucu Gor' : 'Devam'} onPress={continuePlacement} style={styles.rowButton} />
      </View>
    </Screen>
  );
}

export function AuthScreen() {
  const auth = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submitEmail() {
    try {
      setError(null);
      if (mode === 'signIn') await auth.signInWithEmail(email, password);
      else await auth.signUpWithEmail(email, password);
    } catch (nextError) {
      setError(formatAcademyError(nextError));
    }
  }

  async function submitGoogle() {
    try {
      setError(null);
      await auth.signInWithGoogle();
    } catch (nextError) {
      setError(formatAcademyError(nextError));
    }
  }

  return (
    <Screen>
      <StatusBar style="dark" />
      <LogoTitle compact />
      <MentorRobotVisual height={245} />
      <SectionTitle title="Hos Geldin" subtitle="AI Engineering Academy ile ogrenmeye basla." />
      {!auth.configured ? <Text style={styles.errorText}>Canli giris icin mobile/.env icinde Supabase anon key gerekli. Demo modda gezinebilirsin.</Text> : null}
      {error || auth.error ? <Text style={styles.errorText}>{error ?? auth.error}</Text> : null}
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" style={styles.authInput} />
      <TextInput value={password} onChangeText={setPassword} placeholder="Sifre" secureTextEntry style={styles.authInput} />
      <PrimaryButton title={mode === 'signIn' ? 'Giris Yap' : 'Kayit Ol'} onPress={submitEmail} />
      <View style={{ height: 10 }} />
      <OutlineButton title={mode === 'signIn' ? 'Kayit ekranina gec' : 'Giris ekranina gec'} onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')} />
      <View style={{ height: 10 }} />
      <OutlineButton title="Google ile devam et" onPress={submitGoogle} />
      <Text style={styles.terms}>Devam ederek, Kullanim Kosullari ve Gizlilik Politikasini kabul etmis olursun.</Text>
    </Screen>
  );
}

export function InterestsScreen() {
  const { data: interests, error } = useAsyncData<string[]>(getInterests, []);
  const [selected, setSelected] = useState(new Set(['Python', 'Makine Ogrenmesi', 'Derin Ogrenme', 'MLOps', 'Prompt Engineering']));
  async function continueWithInterests() {
    await saveSelectedInterests([...selected]);
    router.push('/level-result');
  }
  return (
    <Screen>
      <StatusBar style="dark" />
      <Header back />
      <SectionTitle title="Hedeflerini Sec" subtitle="Sana uygun ogrenme yolunu olusturmak icin ilgi alanlarini sec." />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={styles.interestGrid}>
        {interests.map((interest) => {
          const active = selected.has(interest);
          return (
            <Pressable
              key={interest}
              onPress={() => {
                const next = new Set(selected);
                if (active) next.delete(interest);
                else next.add(interest);
                setSelected(next);
              }}
              style={[styles.interestTile, active && styles.interestTileActive]}
            >
              <Sparkles size={25} color={active ? colors.primary : '#9aa5bb'} />
              <Text style={[styles.interestText, active && styles.interestTextActive]}>{interest}</Text>
              {active ? <Check size={18} color={colors.primary} style={styles.interestCheck} /> : null}
            </Pressable>
          );
        })}
      </View>
      <PrimaryButton title="Devam Et" onPress={continueWithInterests} />
    </Screen>
  );
}

export function LevelResultScreen() {
  const result = calculatePlacementResult(4, 5);
  return (
    <Screen>
      <StatusBar style="light" />
      <View style={styles.darkTopCard}>
        <Text style={styles.darkTitle}>Sonucun Hazir</Text>
        <LevelBadgeVisual height={210} />
        <Pill label={`Seviyen: ${result.label}`} tone={colors.purple} />
      </View>
      <Card style={styles.resultCard}>
        <Text style={styles.resultBody}>Temel kavramlara hakimsin. Modelleme ve uygulama odakli iceriklerle devam edebilirsin.</Text>
        <InfoLine icon={Check} label="Dogru Cevap" value="4 / 5" />
        <InfoLine icon={BarChart3} label="Onerilen Yol" value="Orta" />
        <InfoLine icon={Clock3} label="Tahmini Sure" value="~10 Saat" />
      </Card>
      <PrimaryButton title="Yolumu Baslat" onPress={() => router.push('/dashboard')} />
      <View style={{ height: 8 }} />
      <OutlineButton title="Testi Tekrarla" onPress={() => router.push('/placement-question')} />
    </Screen>
  );
}

export function DashboardScreen() {
  const { user } = useAuth();
  const { data: courses, error } = useAsyncData<CourseCard[]>(getCourseCatalog, []);
  const displayName = getDisplayName(user);
  const featuredCourse = courses[0] ?? {
    slug: 'neural-networks-101',
    title: 'Neural Networks 101',
    subtitle: 'Yapay sinir aglarinin temelleri',
    level: 'Orta',
    duration: '25 dk',
    moduleCount: 8,
    progress: 65,
  };
  return (
    <Screen bottomTab="home">
      <Header
        title={`Merhaba ${displayName}`}
        subtitle="Bugun yeni bir sey ogrenmeye hazir misin?"
        right={<Bell size={22} color={colors.ink} />}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Card style={styles.levelCard}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.darkSmall}>Seviyen: Orta</Text>
            <Text style={styles.levelCaption}>Toplam Ilerleme</Text>
          </View>
          <Pill label="Profili Gor" />
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.percentText}>%45</Text>
          <Text style={styles.xpText}>XP 1.250</Text>
        </View>
        <ProgressBar value={45} color={colors.green} />
      </Card>
      <View style={styles.statsRow}>
        <StatCard icon={Flame} label="Gunluk Seri" value="7" tone={colors.red} />
        <StatCard icon={Check} label="Ders Tamamlandi" value="24" tone={colors.green} />
        <StatCard icon={Star} label="Rozet Kazanildi" value="3" tone={colors.amber} />
      </View>
      <SectionTitle title="Onerilen Sonraki Ders" />
      <CourseTeaser course={featuredCourse} />
      <Card style={styles.goalCard}>
        <Target size={36} color={colors.green} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Bugunku Hedef</Text>
          <Text style={styles.muted}>1 dersi tamamla ve 10 soru coz.</Text>
          <ProgressBar value={100} color={colors.green} />
        </View>
        <Check size={24} color={colors.green} />
      </Card>
    </Screen>
  );
}

export function PathsScreen() {
  const { data: paths, error } = useAsyncData<PathCard[]>(getLearningPaths, []);
  const { data: courses } = useAsyncData<CourseCard[]>(getCourseCatalog, []);
  return (
    <Screen bottomTab="paths">
      <Header title="Ogrenme Yollari" subtitle="AI muhendisligi yolculugunda ilerle." />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {paths.map((path) => {
        const locked = path.status === 'locked';
        const active = path.status === 'active';
        return (
          <Pressable
            key={path.slug}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/course-detail', params: { path: path.slug } })}
            style={({ pressed }) => [styles.pathPressable, pressed && styles.pressed]}
          >
          <Card style={[styles.pathCard, active && styles.pathActive, locked && styles.pathLocked]}>
            <View style={[styles.pathIcon, { backgroundColor: active ? colors.greenSoft : locked ? '#eef0f6' : colors.primarySoft }]}>
              {locked ? <Lock color="#7d879b" /> : active ? <GraduationCap color={colors.green} /> : <BarChart3 color={colors.primary} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{path.title}</Text>
              <Text style={styles.muted}>{path.subtitle}</Text>
              <View style={styles.inlineMeta}>
                <Text style={styles.metaText}>{path.lessonCount} Ders</Text>
                <Text style={styles.metaText}>~ {path.estimatedHours} Saat</Text>
              </View>
            </View>
            <Pill label={active ? 'Aktif' : locked ? 'Kilitli' : 'Siradaki'} tone={active ? colors.green : locked ? '#7d879b' : colors.primary} />
          </Card>
          </Pressable>
        );
      })}
      <SectionTitle title="Katalogdan ders sec" subtitle={`${courses.length} kurs, ${paths.reduce((sum, item) => sum + item.lessonCount, 0)} ders`} />
      <View style={styles.catalogGrid}>
        {courses.slice(0, 6).map((course) => (
          <Pressable
            key={course.slug}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/course-detail', params: { course: course.slug } })}
            style={({ pressed }) => [styles.catalogCourse, pressed && styles.pressed]}
          >
            <Text style={styles.catalogCourseTitle}>{course.title}</Text>
            <Text style={styles.metaText}>{course.level} • {course.lessonCount ?? 9} ders</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

export function CourseDetailScreen() {
  const params = useLocalSearchParams<{ path?: string; course?: string }>();
  const selectedPath = firstParam(params.path);
  const selectedCourseSlug = firstParam(params.course);
  const { data: paths } = useAsyncData<PathCard[]>(getLearningPaths, []);
  const { data: courses, error: courseError } = useAsyncData<CourseCard[]>(getCourseCatalog, []);
  const { data: allLessons, error: lessonsError } = useAsyncData<LessonCard[]>(getLessons, []);
  const { data: lessonFlowState } = useAsyncData<LessonFlowState>(getLessonFlowState, createEmptyLessonFlowState());
  const featuredCourse = courses[0] ?? {
    title: 'Neural Networks 101',
    subtitle: 'Yapay sinir aglarinin temelleri',
    level: 'Orta',
    duration: '25 dk',
    moduleCount: 8,
    progress: 65,
    slug: 'neural-networks-101',
  };
  const selectedPathCard = paths.find((path) => path.slug === selectedPath);
  const pathCourses = selectedPath ? courses.filter((course) => course.pathSlug === selectedPath) : [];
  const isPathDetail = Boolean(selectedPath && !selectedCourseSlug && pathCourses.length);
  const selectedCourse = courses.find((course) => course.slug === selectedCourseSlug)
    ?? courses.find((course) => course.pathSlug === selectedPath)
    ?? featuredCourse;
  const courseLessons = allLessons.filter((lesson) => lesson.courseSlug === selectedCourse.slug);
  const pathCourseSlugs = new Set(pathCourses.map((course) => course.slug));
  const pathLessons = allLessons.filter((lesson) => lesson.courseSlug && pathCourseSlugs.has(lesson.courseSlug));
  const visibleLessons = isPathDetail
    ? pathLessons
    : courseLessons.length ? courseLessons : allLessons.slice(0, Math.max(4, selectedCourse.lessonCount ?? 4));
  const statusCourseSlugs = new Set(
    (isPathDetail
      ? pathCourses
      : selectedCourse.pathSlug
        ? courses.filter((course) => course.pathSlug === selectedCourse.pathSlug)
        : [selectedCourse]
    ).map((course) => course.slug),
  );
  const lessonStatusSequence = allLessons.filter((lesson) => lesson.courseSlug && statusCourseSlugs.has(lesson.courseSlug));
  const completedLessonSlugs = new Set(lessonFlowState.completedLessonSlugs);
  const getVisibleLessonStatus = (lesson: LessonCard): LessonCard['status'] => {
    if (completedLessonSlugs.has(lesson.slug)) return 'done';
    return isLessonUnlocked(lessonStatusSequence.length ? lessonStatusSequence : visibleLessons, lesson.slug, completedLessonSlugs) ? 'active' : 'locked';
  };
  const visibleCompletedCount = visibleLessons.filter((lesson) => completedLessonSlugs.has(lesson.slug)).length;
  const pathProgress = visibleLessons.length ? calculateProgressPercent(visibleCompletedCount, visibleLessons.length) : selectedCourse.progress;
  const detailTitle = isPathDetail ? `${selectedPathCard?.title ?? selectedCourse.level} Seviye Rotası` : selectedCourse.title;
  const detailSubtitle = isPathDetail ? (selectedPathCard?.subtitle ?? selectedCourse.subtitle) : selectedCourse.subtitle;
  const detailDuration = isPathDetail ? `~ ${selectedPathCard?.estimatedHours ?? 1} Saat` : selectedCourse.duration;
  const detailLevel = isPathDetail ? (selectedPathCard?.title ?? selectedCourse.level) : selectedCourse.level;
  const detailProgress = isPathDetail ? pathProgress : selectedCourse.progress;
  const lessonGroups = isPathDetail
    ? pathCourses
      .map((course) => ({
        course,
        lessons: visibleLessons.filter((lesson) => lesson.courseSlug === course.slug),
      }))
      .filter((group) => group.lessons.length)
    : [{ course: selectedCourse, lessons: visibleLessons }];
  const continueLesson = visibleLessons.find((lesson) => getVisibleLessonStatus(lesson) === 'active') ?? visibleLessons[0];
  const openLesson = (lesson: LessonCard | undefined) => {
    if (!lesson) return;
    if (getVisibleLessonStatus(lesson) === 'locked') return;
    router.push({ pathname: '/lesson-player', params: { lesson: lesson.slug } });
  };
  return (
    <Screen>
      <StatusBar style="light" />
      <Header back backFallback="/paths" right={<Pressable onPress={() => toggleBookmark('course', selectedCourse.id)}><Bookmark size={22} color={colors.ink} /></Pressable>} />
      <CourseHeroVisual
        height={228}
        title={detailTitle}
        subtitle={detailSubtitle}
        metrics={[detailDuration, detailLevel, `${visibleLessons.length || (selectedCourse.lessonCount ?? 0)} ders`]}
        progress={detailProgress}
      />
      {courseError || lessonsError ? <Text style={styles.errorText}>{courseError ?? lessonsError}</Text> : null}
      <View style={styles.courseHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bigTitle}>{detailTitle}</Text>
          <Text style={styles.muted}>{detailSubtitle}</Text>
        </View>
        <View style={styles.progressCircle}>
          <Text style={styles.progressCircleText}>%{detailProgress}</Text>
        </View>
      </View>
      <View style={styles.metaStrip}>
        <InfoMini icon={Clock3} label="Sure" value={detailDuration} />
        <InfoMini icon={BookOpen} label="Icerik" value={`${visibleLessons.length || (selectedCourse.lessonCount ?? 0)} Ders`} />
        <InfoMini icon={BarChart3} label="Seviye" value={detailLevel} />
      </View>
      <SectionTitle title="Ders Icerigi" subtitle={isPathDetail ? `${pathCourses.length} kurs, ${visibleLessons.length} ders` : undefined} />
      {lessonGroups.map((group) => (
        <View key={group.course.slug}>
          {isPathDetail ? (
            <View style={styles.lessonGroupHeader}>
              <Text style={styles.lessonGroupTitle}>{group.course.title}</Text>
              <Text style={styles.lessonGroupMeta}>{group.lessons.length} ders</Text>
            </View>
          ) : null}
          {group.lessons.map((lesson) => {
            const lessonStatus = getVisibleLessonStatus(lesson);
            return (
              <Pressable key={lesson.slug} onPress={() => openLesson(lesson)} style={[styles.lessonRow, lessonStatus === 'locked' && styles.lessonRowLocked]}>
                <View style={[styles.lessonStatus, lessonStatus === 'done' && styles.lessonDone]}>
                  {lessonStatus === 'locked' ? <Lock size={14} color="#8993a8" /> : lessonStatus === 'done' ? <Check size={14} color={colors.surface} /> : <Play size={13} color={colors.primary} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.lessonTitle, lessonStatus === 'locked' && styles.lockedLessonText]}>{lesson.title}</Text>
                  <Text style={styles.metaText}>{lesson.type} • {lesson.duration}{lessonStatus === 'locked' ? ' • Kilitli' : lessonStatus === 'done' ? ' • Tamamlandi' : ' • Aktif'}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
      <View style={styles.quickActions}>
        <OutlineButton title="Notlar" onPress={() => router.push('/notes')} icon={<BookOpen size={18} color={colors.primary} />} style={styles.rowButton} />
        <OutlineButton title="Quiz" onPress={() => router.push('/quiz')} icon={<ShieldCheck size={18} color={colors.primary} />} style={styles.rowButton} />
      </View>
      <PrimaryButton title="Derse Devam Et" onPress={() => openLesson(continueLesson)} icon={<Play size={18} color={colors.surface} />} />
    </Screen>
  );
}

function getLearningStepLabel(kind: LessonLearningStep['kind']) {
  if (kind === 'goal') return 'Hedef';
  if (kind === 'concept') return 'Kavram';
  if (kind === 'why') return 'Neden';
  if (kind === 'practice') return 'Uygulama';
  if (kind === 'code') return 'Kod';
  if (kind === 'lab') return 'Mini Lab';
  return 'Tekrar';
}

function LearningStepIcon({ kind }: { kind: LessonLearningStep['kind'] }) {
  if (kind === 'goal') return <Target size={20} color={colors.primary} />;
  if (kind === 'why') return <Lightbulb size={20} color={colors.amber} />;
  if (kind === 'practice') return <Settings2 size={20} color={colors.purple} />;
  if (kind === 'code') return <BookOpen size={20} color={colors.green} />;
  if (kind === 'lab') return <Zap size={20} color={colors.primary} />;
  if (kind === 'summary') return <ShieldCheck size={20} color={colors.green} />;
  return <BookOpen size={20} color={colors.primary} />;
}

function LessonLearningStepView({ step, lessonSlug }: { step: LessonLearningStep; lessonSlug: string }) {
  const labParams: Record<string, string> = {};
  if (step.labSlug) labParams.lab = step.labSlug;
  if (lessonSlug) labParams.lesson = lessonSlug;

  return (
    <Card style={styles.learningStepCard}>
      <View style={styles.stepKickerRow}>
        <View style={styles.stepIconBubble}>
          <LearningStepIcon kind={step.kind} />
        </View>
        <Text style={styles.stepKicker}>{getLearningStepLabel(step.kind)}</Text>
      </View>
      <Text style={styles.learningStepTitle}>{step.title}</Text>
      <Text style={styles.learningStepBody}>{step.body}</Text>
      {step.bullets?.length ? (
        <View style={styles.learningList}>
          {step.bullets.map((item) => (
            <View key={item} style={styles.learningBulletRow}>
              <View style={styles.learningBulletDot} />
              <Text style={styles.learningBulletText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {step.orderedItems?.length ? (
        <View style={styles.learningList}>
          {step.orderedItems.map((item, index) => (
            <View key={item} style={styles.learningOrderedRow}>
              <View style={styles.learningNumberBadge}>
                <Text style={styles.learningNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.learningBulletText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {step.code ? (
        <View style={styles.codeCard}>
          {step.codeLanguage ? <Text style={styles.codeLanguage}>{step.codeLanguage}</Text> : null}
          {step.code.split('\n').map((line, index) => (
            <Text key={`${step.id}-code-${index}`} style={styles.codeLine}>{line || ' '}</Text>
          ))}
        </View>
      ) : null}
      {step.labSlug ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/lab', params: labParams })}
          style={({ pressed }) => [styles.labEmbedCard, pressed && styles.pressed]}
        >
          <View style={styles.lessonStatus}>
            <Zap size={14} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.contentBlockTitle}>{step.actionLabel ?? "Mini Lab'a Git"}</Text>
            <Text style={styles.contentBlockBody}>Lab isteğe bağlı pekiştirmedir; dersten geçiş quiz başarısıyla açılır.</Text>
          </View>
          <ChevronRight size={20} color={colors.primary} />
        </Pressable>
      ) : null}
    </Card>
  );
}

function LessonQuizPanel({
  quiz,
  currentQuestionIndex,
  selectedAnswers,
  quizResult,
  quizError,
  onSelectAnswer,
}: {
  quiz: LessonQuiz;
  currentQuestionIndex: number;
  selectedAnswers: Record<string, number | undefined>;
  quizResult?: LessonQuizResult;
  quizError?: string | null;
  onSelectAnswer: (questionId: string, answerIndex: number) => void;
}) {
  const currentQuestion = quiz.questions[currentQuestionIndex] ?? quiz.questions[0];
  const answeredCount = quizResult?.questionCount ?? quiz.questions.filter((question) => typeof selectedAnswers[question.id] === 'number').length;
  const checked = Boolean(quizResult);
  if (!currentQuestion) return null;

  return (
    <Card style={[styles.learningStepCard, styles.quizFocusCard]}>
      <View style={styles.stepKickerRow}>
        <View style={styles.stepIconBubble}>
          <ShieldCheck size={20} color={colors.green} />
        </View>
        <Text style={styles.stepKicker}>Ders Sonu Quiz</Text>
      </View>
      <Text style={styles.learningStepTitle}>{quiz.title}</Text>
      <Text style={styles.learningStepBody}>Sonraki derse geçmek için 5 sorudan en az 4 tanesini doğru cevaplamalısın.</Text>
      <View style={styles.quizProgressRow}>
        <Text style={styles.quizProgressText}>Soru {currentQuestionIndex + 1} / {quiz.questions.length}</Text>
        <Text style={styles.quizProgressText}>{answeredCount} cevaplandı</Text>
      </View>
      <ProgressBar value={calculateProgressPercent(currentQuestionIndex + 1, quiz.questions.length)} />
      {quizError ? <Text style={styles.errorText}>{quizError}</Text> : null}
      {quizResult ? (
        <Text style={quizResult.passed ? styles.successText : styles.errorText}>
          Sonuç: {quizResult.correctCount} / {quizResult.questionCount} doğru (%{quizResult.scorePercent}). {quizResult.passed ? 'Başarılı, sonraki ders açıldı.' : 'Tekrar çalışıp yeniden dene.'}
        </Text>
      ) : null}
      <View style={styles.lessonQuizStack}>
        <View key={currentQuestion.id} style={styles.lessonQuizQuestion}>
          <Text style={styles.lessonQuizPrompt}>{currentQuestionIndex + 1}. {currentQuestion.prompt}</Text>
          {currentQuestion.options.map((option, optionIndex) => {
            const selected = selectedAnswers[currentQuestion.id] === optionIndex;
            const correct = currentQuestion.answerIndex === optionIndex;
            const wrongSelection = checked && selected && !correct;
            return (
              <Pressable
                key={`${currentQuestion.id}-${option}`}
                accessibilityRole="button"
                onPress={() => {
                  if (!quizResult) onSelectAnswer(currentQuestion.id, optionIndex);
                }}
                style={[
                  styles.lessonQuizOption,
                  selected && styles.lessonQuizOptionSelected,
                  checked && correct && styles.lessonQuizOptionCorrect,
                  wrongSelection && styles.lessonQuizOptionWrong,
                ]}
              >
                <Text style={[
                  styles.lessonQuizOptionText,
                  selected && styles.lessonQuizOptionTextSelected,
                  checked && correct && styles.lessonQuizOptionTextCorrect,
                  wrongSelection && styles.lessonQuizOptionTextWrong,
                ]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
          {quizResult ? <Text style={styles.quizExplanation}>{currentQuestion.explanation}</Text> : null}
        </View>
      </View>
    </Card>
  );
}

export function LessonPlayerScreen() {
  const params = useLocalSearchParams<{ lesson?: string }>();
  const selectedLessonSlug = firstParam(params.lesson);
  const { data: courseLessons } = useAsyncData<LessonCard[]>(getLessons, []);
  const { data: courses } = useAsyncData<CourseCard[]>(getCourseCatalog, []);
  const { data: lessonFlowState, setData: setLessonFlowState } = useAsyncData<LessonFlowState>(getLessonFlowState, createEmptyLessonFlowState());
  const currentLesson = courseLessons[1] ?? {
    courseSlug: 'neural-networks-101',
    title: 'Perceptron ve Aktivasyon Fonksiyonlari',
    slug: 'neural-networks-101-m1-l2',
    type: 'Video' as const,
    duration: '12 dk',
    status: 'active' as const,
  };
  const selectedLesson = courseLessons.find((lesson) => lesson.slug === selectedLessonSlug)
    ?? courseLessons.find((lesson) => lesson.status === 'active')
    ?? currentLesson;
  const selectedCourse = courses.find((course) => course.slug === selectedLesson.courseSlug);
  const contentLoader = useCallback(() => getLessonContentBlocks(selectedLesson.id), [selectedLesson.id]);
  const { data: contentBlocks, error: contentError } = useAsyncData<LessonContentBlock[]>(contentLoader, []);
  const lessonSequence = useMemo(() => {
    if (!selectedCourse?.slug) return courseLessons;
    const pathCourses = selectedCourse.pathSlug ? courses.filter((course) => course.pathSlug === selectedCourse.pathSlug) : [selectedCourse];
    const sequencedLessons = pathCourses.flatMap((course) => courseLessons.filter((lesson) => lesson.courseSlug === course.slug));
    return sequencedLessons.length ? sequencedLessons : courseLessons.filter((lesson) => lesson.courseSlug === selectedCourse.slug);
  }, [courseLessons, courses, selectedCourse]);
  const nextLesson = useMemo(() => getNextLessonInSequence(lessonSequence, selectedLesson.slug), [lessonSequence, selectedLesson.slug]);
  const previousLessonIndex = lessonSequence.findIndex((lesson) => lesson.slug === selectedLesson.slug) - 1;
  const previousLesson = previousLessonIndex >= 0 ? lessonSequence[previousLessonIndex] : undefined;
  const completedLessonSlugs = useMemo(() => new Set(lessonFlowState.completedLessonSlugs), [lessonFlowState.completedLessonSlugs]);
  const lessonUnlocked = !lessonSequence.length || isLessonUnlocked(lessonSequence, selectedLesson.slug, completedLessonSlugs);
  const learningSteps = useMemo(() => buildLessonLearningSteps(selectedLesson, contentBlocks), [contentBlocks, selectedLesson]);
  const lessonQuiz = useMemo(() => buildLessonQuiz(selectedLesson, contentBlocks), [contentBlocks, selectedLesson]);
  const savedStepIndex = Math.min(lessonFlowState.stepProgressByLessonSlug[selectedLesson.slug] ?? 0, learningSteps.length);
  const savedQuizResult = lessonFlowState.quizResultsByLessonSlug[selectedLesson.slug];
  const [stepIndex, setStepIndex] = useState(savedStepIndex);
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number | undefined>>({});
  const [quizError, setQuizError] = useState<string | null>(null);
  const [localQuizResult, setLocalQuizResult] = useState<LessonQuizResult | undefined>();
  const quizResult = localQuizResult ?? savedQuizResult;
  const isQuizStep = stepIndex >= learningSteps.length;
  const activeStep = learningSteps[Math.min(stepIndex, Math.max(0, learningSteps.length - 1))];
  const totalSteps = learningSteps.length + 1;
  const displayedStep = Math.min(stepIndex + 1, totalSteps);
  const lessonProgress = quizResult?.passed ? 100 : calculateProgressPercent(displayedStep, totalSteps);
  const quizQuestionCount = lessonQuiz.questions.length;
  const currentQuizQuestion = lessonQuiz.questions[quizQuestionIndex];
  const currentQuizAnswered = currentQuizQuestion ? typeof selectedAnswers[currentQuizQuestion.id] === 'number' : false;
  const isLastQuizQuestion = quizQuestionIndex >= quizQuestionCount - 1;
  const courseDetailRoute = selectedCourse?.pathSlug
    ? ({ pathname: '/course-detail', params: { path: selectedCourse.pathSlug } } as const)
    : selectedCourse?.slug
      ? ({ pathname: '/course-detail', params: { course: selectedCourse.slug } } as const)
      : ('/paths' as const);

  useEffect(() => {
    setStepIndex(savedStepIndex);
    setQuizQuestionIndex(0);
    setSelectedAnswers({});
    setQuizError(null);
    setLocalQuizResult(undefined);
  }, [selectedLesson.slug, savedStepIndex, learningSteps.length]);

  async function goToStep(nextStepIndex: number) {
    const boundedStepIndex = Math.min(Math.max(0, nextStepIndex), learningSteps.length);
    setStepIndex(boundedStepIndex);
    const nextState = await saveLessonStepProgress(selectedLesson.slug, boundedStepIndex);
    setLessonFlowState(nextState);
  }

  async function submitLessonQuiz() {
    const allAnswered = lessonQuiz.questions.every((question) => typeof selectedAnswers[question.id] === 'number');
    if (!allAnswered) {
      setQuizError('Devam etmek için tüm quiz sorularını cevapla.');
      return;
    }

    const result = gradeLessonQuiz(lessonQuiz, selectedAnswers);
    setQuizError(null);
    setQuizQuestionIndex(0);
    setLocalQuizResult(result);
    const nextState = await saveLessonQuizResult(selectedLesson.slug, result);
    setLessonFlowState(nextState);
    if (result.passed) {
      await updateLessonProgress(selectedLesson.id, 100);
    }
  }

  async function retryQuiz() {
    const nextState = await resetLessonQuizAttempt(selectedLesson.slug);
    setLessonFlowState(nextState);
    setQuizQuestionIndex(0);
    setSelectedAnswers({});
    setQuizError(null);
    setLocalQuizResult(undefined);
    await goToStep(learningSteps.length);
  }

  async function studyAgain() {
    const nextState = await resetLessonQuizAttempt(selectedLesson.slug);
    setLessonFlowState(nextState);
    setQuizQuestionIndex(0);
    setSelectedAnswers({});
    setQuizError(null);
    setLocalQuizResult(undefined);
    await goToStep(0);
  }

  function goToNextQuizQuestion() {
    if (!currentQuizAnswered) {
      setQuizError('Önce bu soruya bir cevap seç.');
      return;
    }
    setQuizError(null);
    setQuizQuestionIndex((index) => Math.min(index + 1, Math.max(0, quizQuestionCount - 1)));
  }

  function continueAfterPassedQuiz() {
    if (nextLesson) {
      router.push({ pathname: '/lesson-player', params: { lesson: nextLesson.slug } });
      return;
    }

    router.push(courseDetailRoute);
  }

  if (courseLessons.length && !lessonUnlocked) {
    return (
      <Screen fullWidth contentStyle={styles.lessonScreenContent}>
        <StatusBar style="dark" />
        <Header title="Ders kilitli" back backFallback={courseDetailRoute} />
        <Card style={styles.lockedLessonCard}>
          <Lock size={34} color="#8993a8" />
          <Text style={styles.learningStepTitle}>Önce önceki dersi tamamla</Text>
          <Text style={styles.learningStepBody}>
            Bu dersin açılması için önce {previousLesson?.title ?? 'önceki ders'} dersinin quizinden başarılı olmalısın.
          </Text>
          <PrimaryButton
            title={previousLesson ? 'Önceki Derse Git' : 'Ders Listesine Dön'}
            onPress={() => {
              if (previousLesson) router.push({ pathname: '/lesson-player', params: { lesson: previousLesson.slug } });
              else router.push(courseDetailRoute);
            }}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen fullWidth contentStyle={styles.lessonScreenContent}>
      <StatusBar style="dark" />
      <Header title={selectedCourse?.title ?? 'Ders'} back backFallback={courseDetailRoute} right={<Pressable onPress={() => toggleBookmark('lesson', selectedLesson.id)}><Bookmark size={22} color={colors.ink} /></Pressable>} />
      <View style={styles.lessonProgressBlock}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Adım {displayedStep} / {totalSteps}</Text>
          <Text style={styles.metaText}>{isQuizStep ? `Quiz • Soru ${quizQuestionIndex + 1}/${quizQuestionCount}` : getLearningStepLabel(activeStep.kind)}</Text>
        </View>
        <ProgressBar value={lessonProgress} />
      </View>
      {contentError ? <Text style={styles.errorText}>{contentError}</Text> : null}
      {isQuizStep ? (
        <LessonQuizPanel
          quiz={lessonQuiz}
          currentQuestionIndex={quizQuestionIndex}
          selectedAnswers={selectedAnswers}
          quizResult={quizResult}
          quizError={quizError}
          onSelectAnswer={(questionId, answerIndex) => {
            setSelectedAnswers((answers) => ({ ...answers, [questionId]: answerIndex }));
            setQuizError(null);
            const answeredQuestionIndex = lessonQuiz.questions.findIndex((question) => question.id === questionId);
            if (answeredQuestionIndex >= 0 && answeredQuestionIndex < lessonQuiz.questions.length - 1) {
              setQuizQuestionIndex(answeredQuestionIndex + 1);
            }
          }}
        />
      ) : (
        <LessonLearningStepView step={activeStep} lessonSlug={selectedLesson.slug} />
      )}
      <View style={styles.rowGap}>
        <OutlineButton
          title={isQuizStep && !quizResult && quizQuestionIndex > 0 ? 'Önceki Soru' : stepIndex > 0 ? 'Önceki' : 'Not Al'}
          onPress={() => {
            if (isQuizStep && !quizResult && quizQuestionIndex > 0) {
              setQuizQuestionIndex((index) => Math.max(0, index - 1));
              setQuizError(null);
              return;
            }
            if (stepIndex > 0) {
              goToStep(stepIndex - 1);
              return;
            }
            router.push({ pathname: '/notes', params: { lesson: selectedLesson.slug } });
          }}
          style={styles.rowButton}
        />
        {!isQuizStep ? (
          <PrimaryButton title={stepIndex === learningSteps.length - 1 ? "Quiz'e Geç" : 'Devam'} onPress={() => goToStep(stepIndex + 1)} style={styles.rowButton} />
        ) : quizResult?.passed ? (
          <PrimaryButton title={nextLesson ? 'Sonraki Derse Geç' : 'Dersi Tamamla'} onPress={continueAfterPassedQuiz} style={styles.rowButton} />
        ) : quizResult ? (
          <PrimaryButton title="Yeniden Dene" onPress={retryQuiz} style={styles.rowButton} />
        ) : !isLastQuizQuestion ? (
          <PrimaryButton title={currentQuizAnswered ? 'Sonraki Soru' : 'Cevap Seç'} onPress={goToNextQuizQuestion} style={styles.rowButton} />
        ) : (
          <PrimaryButton title="Quiz'i Kontrol Et" onPress={submitLessonQuiz} style={styles.rowButton} />
        )}
      </View>
      {isQuizStep && quizResult && !quizResult.passed ? <OutlineButton title="Tekrar Çalış" onPress={studyAgain} /> : null}
    </Screen>
  );
}

export function ReadingScreen() {
  const params = useLocalSearchParams<{ lesson?: string }>();
  const selectedLessonSlug = firstParam(params.lesson);
  const returnToLesson = () => router.replace({ pathname: '/lesson-player', params: selectedLessonSlug ? { lesson: selectedLessonSlug } : {} });

  return (
    <Screen>
      <Header title="Ders Notu" back />
      <SectionTitle title="Ders akisi lesson-player ekraninda" subtitle="Secilen dersin konu anlatimi, kod ornegi, mini lab ve sonraki adimi artik tek ekranda tasiniyor." />
      <Card style={styles.infoCallout}>
        <BookOpen size={24} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.linkTitle}>Eski okuma ekrani pasif</Text>
          <Text style={styles.muted}>Bu sayfa geriye uyumluluk icin duruyor. Ders icindeki devam butonlari artik secili dersin gercek icerigini ve lab baglantisini kullanir.</Text>
        </View>
      </Card>
      <PrimaryButton title="Derse Don" onPress={returnToLesson} />
    </Screen>
  );
}

export function LabScreen() {
  const params = useLocalSearchParams<{ lab?: string; lesson?: string }>();
  const selectedLabSlug = firstParam(params.lab);
  const selectedLessonSlug = firstParam(params.lesson);
  const labLoader = useCallback(() => getLab(selectedLabSlug), [selectedLabSlug]);
  const { data: lab, error } = useAsyncData<LabState>(labLoader, {
    title: 'Perceptron Hesapla',
    description: 'Agirliklari ve girdi degerlerini kullanarak ciktiyi hesapla.',
    starterCode: 'def perceptron(x1, x2, w1, w2, bias):\n  z = w1*x1 + w2*x2 + bias\n  return 1 if z >= 0 else 0',
    values: { x1: 0.6, x2: -0.3, w1: 0.8, w2: -0.5, bias: 0.1 },
  });
  const [values, setValues] = useState(lab.values);
  const [labMessage, setLabMessage] = useState<string | null>(null);
  useEffect(() => setValues(lab.values), [lab.values]);
  const result = useMemo(() => runPerceptronLab(values), [values]);
  function returnToLesson() {
    if (selectedLessonSlug) {
      router.push({ pathname: '/lesson-player', params: { lesson: selectedLessonSlug } });
      return;
    }

    router.push('/course-detail');
  }
  return (
    <Screen>
      <Header title="Mini Lab" back right={<CircleHelp size={22} color={colors.ink} />} />
      <SectionTitle title={lab.title} />
      {error || labMessage ? <Text style={error ? styles.errorText : styles.successText}>{error ?? labMessage}</Text> : null}
      <Card style={styles.infoCallout}>
        <Sparkles color={colors.primary} />
        <Text style={styles.muted}>{lab.description}</Text>
      </Card>
      <Card style={styles.codeCard}>
        {lab.starterCode.split('\n').map((line) => <Text key={line} style={styles.codeLine}>{line}</Text>)}
        <Pill label="Python" tone={colors.purple} />
      </Card>
      {Object.entries(values).map(([key, value]) => (
        <View key={key} style={styles.sliderRow}>
          <Text style={styles.sliderLabel}>{key}</Text>
          <Pressable
            style={styles.sliderTrack}
            onPress={() => setValues((current) => ({ ...current, [key]: Number((value + 0.1 > 1 ? -1 : value + 0.1).toFixed(1)) }))}
          >
            <View style={[styles.sliderFill, { width: `${((value + 1) / 2) * 100}%` }]} />
          </Pressable>
          <Text style={styles.sliderValue}>{value.toFixed(1)}</Text>
        </View>
      ))}
      <Card style={styles.outputCard}>
        <Check size={38} color={colors.green} />
        <View>
          <Text style={styles.outputTitle}>Cikti: {result.output}</Text>
          <Text style={styles.muted}>z = {result.z.toFixed(2)} {'->'} {result.output}</Text>
        </View>
      </Card>
      <View style={styles.rowGap}>
        <OutlineButton
          title="Sifirla"
          onPress={() => {
            setValues(lab.values);
            setLabMessage(null);
          }}
          icon={<RotateCcw size={18} color={colors.primary} />}
          style={styles.rowButton}
        />
        <PrimaryButton title="Calistir" onPress={async () => {
          const submitted = await submitLab(lab.id, values);
          setLabMessage(formatLabResultMessage(submitted));
        }} icon={<Play size={18} color={colors.surface} />} style={styles.rowButton} />
      </View>
      {labMessage ? (
        <Card style={styles.flowCard}>
          <View style={styles.flowCardContent}>
            <View style={styles.flowIcon}>
              <Check size={18} color={colors.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.flowTitle}>Lab tamamlandi</Text>
            <Text style={styles.contentBlockBody}>Lab pekiştirme adımı tamamlandı. Sonraki dersi açmak için derse dönüp quizden başarılı olmalısın.</Text>
          </View>
          </View>
          <PrimaryButton title="Derse Dön" onPress={returnToLesson} style={styles.flowButton} />
        </Card>
      ) : null}
    </Screen>
  );
}

export function QuizScreen() {
  const [selected, setSelected] = useState(1);
  const [quizMessage, setQuizMessage] = useState<string | null>(null);
  const { data: quiz, error } = useAsyncData<QuizQuestion>(getQuizQuestion, {
    title: 'ReLU aktivasyon fonksiyonunun en onemli avantaji hangisidir?',
    options: ['Her zaman negatif ciktilar uretir.', 'Hesaplamasi basittir ve daha hizlidir.', 'Ciktilari -1 ile 1 arasinda sinirlar.', 'Tum noronlari aktif tutar.'],
    answerIndex: 1,
  });
  return (
    <Screen>
      <Header title="Ara Quiz 1 / 3" back />
      <ProgressBar value={33} />
      {error || quizMessage ? <Text style={error ? styles.errorText : styles.successText}>{error ?? quizMessage}</Text> : null}
      <Text style={styles.questionText}>{quiz.title}</Text>
      {quiz.options.map((item, index) => (
        <Pressable key={item} onPress={() => setSelected(index)} style={[styles.optionRow, selected === index && styles.optionRowActive]}>
          <View style={[styles.optionBadge, selected === index && styles.optionBadgeActive]}>
            <Text style={[styles.optionBadgeText, selected === index && styles.optionBadgeTextActive]}>{String.fromCharCode(65 + index)}</Text>
          </View>
          <Text style={styles.optionText}>{item}</Text>
        </Pressable>
      ))}
      <OutlineButton title="Ipucu" icon={<Lightbulb size={18} color={colors.primary} />} />
      <View style={styles.rowGap}>
        <OutlineButton title="Onceki" style={styles.rowButton} />
        <PrimaryButton title={quizMessage ? 'Notlara Gec' : 'Cevabi Kontrol Et'} onPress={async () => {
          if (quizMessage) {
            router.push('/notes');
            return;
          }
          const result = await submitQuizAnswer(quiz.id, quiz.optionIds?.[selected]);
          setQuizMessage(getQuizResultMessage(result));
        }} style={styles.rowButton} />
      </View>
    </Screen>
  );
}

export function NotesScreen() {
  const { data: noteItems, error, setData } = useAsyncData<NoteCard[]>(getNotes, []);
  const { data: courseLessons } = useAsyncData<LessonCard[]>(getLessons, []);
  const [draft, setDraft] = useState('');
  async function addNote() {
    const text = draft.trim() || 'ReLU, negatif degerlerde 0 ciktigi icin hesaplama daha hizlidir.';
    await saveNote(courseLessons[1]?.id, text, 'Onemli');
    setData([{ time: 'simdi', tag: 'Onemli', text }, ...noteItems]);
    setDraft('');
  }
  return (
    <Screen bottomTab="progress">
      <Header title="Notlarim" right={<Plus size={24} color={colors.primary} />} />
      <View style={styles.searchRow}>
        <Pill label="Bu Derse Ait" />
        <TextInput value={draft} onChangeText={setDraft} placeholder="Yeni not yaz..." placeholderTextColor="#a0a9bc" style={styles.searchInput} />
        <Settings2 size={22} color={colors.primary} />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {noteItems.map((note) => (
        <Card key={note.time} style={styles.noteCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.metaText}>{note.time}</Text>
            <Pill label={note.tag} tone={note.tag === 'Onemli' ? colors.amber : colors.purple} />
          </View>
          <Text style={styles.noteText}>“{note.text}”</Text>
          <Bookmark size={20} color={colors.primary} style={styles.noteBookmark} />
        </Card>
      ))}
      <Pressable onPress={addNote} style={styles.floatingAdd}>
        <Plus size={28} color={colors.surface} />
      </Pressable>
    </Screen>
  );
}

export function MentorScreen() {
  const { session } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'user', text: 'Backpropagation neden onemlidir?' },
    { role: 'assistant', text: 'Backpropagation, hatayi agin cikisindan girisine dogru geri yayarak her katmandaki agirliklarin nasil guncellenecegini hesaplar.' },
    { role: 'assistant', text: 'Bu sayede model, hatayi azaltacak yonde ogrenir ve daha dogru tahminler yapmayi ogrenir.' },
  ]);
  const [loading, setLoading] = useState(false);
  const [mentorError, setMentorError] = useState<string | null>(null);

  async function sendMessage(text = input) {
    if (!text.trim() || loading) return;
    setMessages((current) => [...current, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      setMentorError(null);
      const answer = await askMentor(text, session?.access_token);
      setMessages((current) => [...current, { role: 'assistant', text: answer }]);
    } catch (nextError) {
      setMentorError(formatAcademyError(nextError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll={false}>
      <Header title="AI Mentor" subtitle="Ders yardimcin" back right={<Bot size={24} color={colors.primary} />} />
      <View style={styles.chatArea}>
        {mentorError ? <Text style={styles.errorText}>{mentorError}</Text> : null}
        {messages.map((message, index) => (
          <View key={`${message.role}-${index}`} style={[styles.messageBubble, message.role === 'user' && styles.userBubble]}>
            <Text style={[styles.messageText, message.role === 'user' && styles.userMessageText]}>{message.text}</Text>
          </View>
        ))}
      </View>
      <View style={styles.promptChips}>
        {['Ornek', 'Basit anlat', 'Ozet'].map((text) => (
          <OutlineButton key={text} title={text} onPress={() => sendMessage(text)} style={styles.promptButton} />
        ))}
      </View>
      <View style={styles.chatInputRow}>
        <TextInput value={input} onChangeText={setInput} placeholder="Sorunu yaz..." style={styles.chatInput} />
        <Pressable onPress={() => sendMessage()} style={styles.sendButton}>
          <Send size={22} color={colors.surface} />
        </Pressable>
      </View>
    </Screen>
  );
}

export function ProgressScreen() {
  return (
    <Screen bottomTab="progress">
      <Header title="Ilerlemen" right={<Calendar size={22} color={colors.ink} />} />
      <Card style={styles.progressHeroPanel}>
        <View style={styles.progressHeroHeader}>
          <View>
            <Text style={styles.progressKicker}>Haftalik hedef</Text>
            <Text style={styles.progressHeroTitle}>Orta rota ilerliyor</Text>
          </View>
          <Pill label="+18%" tone={colors.green} />
        </View>
        <View style={styles.analyticsTop}>
          <View style={styles.bigRing}><Text style={styles.bigRingText}>%68</Text></View>
          <View style={styles.progressMetricStack}>
            <StatLine icon={Zap} label="Bu Hafta" value="645 XP" />
            <StatLine icon={Star} label="Toplam XP" value="1.250" />
            <StatLine icon={BookOpen} label="Ders" value="24 / 42" />
          </View>
        </View>
      </Card>
      <Card style={styles.activityCard}>
        <Text style={styles.cardTitle}>Haftalik Aktivite</Text>
        <Text style={styles.muted}>En guclu gunun Carsamba. Bugun 1 kisa dersle seriyi koru.</Text>
        <View style={styles.barChart}>
          {[62, 72, 84, 75, 58, 50, 28].map((h, i) => (
            <View key={i} style={styles.barWrap}>
              <View style={[styles.bar, { height: h }]} />
              <Text style={styles.metaText}>{['Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt', 'Paz'][i]}</Text>
            </View>
          ))}
        </View>
      </Card>
      <View style={styles.rowGap}>
        <Card style={styles.smallSummary}><Text style={styles.cardTitle}>Seri Devam Ediyor!</Text><Text style={styles.muted}>7 gun ust uste</Text></Card>
        <Card style={styles.smallSummary}><Text style={styles.cardTitle}>Cozulen Quiz</Text><Text style={styles.muted}>37 soru</Text></Card>
      </View>
      <Card style={styles.nextMilestoneCard}>
        <View style={styles.pathIcon}>
          <Target size={24} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Siradaki kilometre tasi</Text>
          <Text style={styles.muted}>Neural Networks 101 kursunda 3 ders daha tamamla ve Model Degerlendirme modulu acilsin.</Text>
          <ProgressBar value={72} color={colors.green} />
        </View>
      </Card>
    </Screen>
  );
}

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const displayName = getDisplayName(user);
  return (
    <Screen bottomTab="profile">
      <View style={styles.profileHero}>
        <View style={styles.avatar}><Text style={styles.avatarText}>B</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileMeta}>AI Learner • Orta Seviye</Text>
          <ProgressBar value={62} color={colors.purple} />
        </View>
        <Pill label="Lv. 4" />
      </View>
      <View style={styles.statsRow}>
        <StatCard icon={BookOpen} value="24" label="Ders" />
        <StatCard icon={Award} value="3" label="Rozet" tone={colors.purple} />
        <StatCard icon={Award} value="1" label="Sertifika" tone={colors.green} />
      </View>
      <SectionTitle title="Kazanilan Rozetler" subtitle="Tumunu Gor" />
      <View style={styles.badgeRow}>
        {['Algoritma Ustasi', 'Quiz Sampiyonu', 'Istikrarli Ogrenci'].map((badge, index) => (
          <Card key={badge} style={styles.badgeMini}>
            <Trophy size={38} color={[colors.amber, colors.purple, colors.primary][index]} />
            <Text style={styles.badgeText}>{badge}</Text>
          </Card>
        ))}
      </View>
      {['Bildirimler', 'Dil', 'Gizlilik', 'Destek'].map((item) => (
        <Card key={item} style={styles.settingsRow}>
          <Text style={styles.cardTitle}>{item}</Text>
          <ChevronRight color={colors.muted} />
        </Card>
      ))}
      <View style={{ height: 12 }} />
      <OutlineButton title="Cikis Yap" onPress={signOut} />
    </Screen>
  );
}

export function CertificateScreen() {
  const { data: courses } = useAsyncData<CourseCard[]>(getCourseCatalog, []);
  const [message, setMessage] = useState<string | null>(null);
  return (
    <Screen>
      <StatusBar style="light" />
      <View style={styles.certificateTop}>
        <Text style={styles.darkTitle}>Tebrikler!</Text>
        <Text style={styles.darkSubtitle}>Dersi basariyla tamamladin.</Text>
        <CertificateVisual />
      </View>
      <Card style={styles.nextCourse}>
        <BookOpen color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Bir sonraki oneri</Text>
          <Text style={styles.muted}>Deep Learning Basics • Orta Seviye • ~12 Saat</Text>
        </View>
        <ChevronRight color={colors.muted} />
      </Card>
      {message ? <Text style={styles.successText}>{message}</Text> : null}
      <PrimaryButton title="Sertifikayi Goruntule" onPress={async () => {
        await issueCertificate(courses[0]?.id);
        setMessage('Sertifika kaydi olusturuldu.');
      }} />
      <View style={{ height: 10 }} />
      <OutlineButton title="Paylas" icon={<Download size={18} color={colors.primary} />} />
    </Screen>
  );
}

export function LeagueScreen() {
  return (
    <Screen bottomTab="league">
      <Header title="Haftalik Lig" right={<Bell size={22} color={colors.ink} />} />
      <Card style={styles.leagueHero}>
        <LeagueMedalVisual />
        <Text style={styles.leagueTitle}>Altin Lig</Text>
        <Text style={styles.darkSubtitle}>Siralamam: #12</Text>
        <Text style={styles.leaguePoints}>1.840</Text>
        <ProgressBar value={74} color={colors.green} />
        <Text style={styles.darkSubtitle}>Terfi icin 260 puan kaldi</Text>
      </Card>
      <View style={styles.statsRow}>
        <StatCard icon={BarChart3} label="Bu Hafta" value="+420" tone={colors.green} />
        <StatCard icon={Flame} label="Galibiyet Serisi" value="5" tone={colors.red} />
        <StatCard icon={BookOpen} label="Tamamlanan Ders" value="9" />
      </View>
      <SectionTitle title="Lig Durumu" />
      <LeagueStatus label="Terfi Bolgesi" value="Ilk 10" tone={colors.green} />
      <LeagueStatus label="Guvende" value="11 - 30" tone={colors.primary} />
      <LeagueStatus label="Dusme Bolgesi" value="30 alti" tone={colors.red} />
    </Screen>
  );
}

export function LeaderboardScreen() {
  const { data: board, error } = useAsyncData(getLeaderboard, []);
  return (
    <Screen>
      <Header title="Leaderboard" back right={<CircleHelp size={22} color={colors.ink} />} />
      <View style={styles.filterRow}>
        <Pill label="Altin Lig" tone={colors.amber} />
        <Pill label="Bu Hafta" />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={styles.podium}>
        {board.slice(0, 3).map((item) => (
          <View key={item.name} style={styles.podiumItem}>
            <View style={styles.avatarSmall}><Text style={styles.avatarText}>{item.name[0]}</Text></View>
            <Text style={styles.rankMedal}>{item.rank}</Text>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.metaText}>{item.points}</Text>
          </View>
        ))}
      </View>
      {board.slice(3).map((item) => (
        <Card key={`${item.rank}-${item.name}`} style={[styles.leaderRow, item.name === 'Baki' && styles.leaderRowActive]}>
          <Text style={styles.rankText}>{item.rank}</Text>
          <View style={styles.avatarTiny}><Text style={styles.avatarTinyText}>{item.name[0]}</Text></View>
          <Text style={styles.leaderName}>{item.name}</Text>
          <Text style={styles.leaderPoints}>{item.points.toLocaleString('tr-TR')}</Text>
        </Card>
      ))}
    </Screen>
  );
}

export function FriendsScreen() {
  const { data: ranks } = useAsyncData(getFriendRanks, []);
  return (
    <Screen bottomTab="league">
      <Header title="Arkadaslarin Arasinda" back />
      <View style={styles.segmented}><Text style={styles.segmentText}>Genel</Text><Text style={styles.segmentActive}>Arkadaslar</Text></View>
      {ranks.map((item) => (
        <Card key={item.name} style={[styles.friendRow, item.name === 'Baki' && styles.friendRowActive]}>
          <Text style={styles.rankText}>{item.rank}</Text>
          <View style={styles.avatarTiny}><Text style={styles.avatarTinyText}>{item.name[0]}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.leaderName}>{item.name}</Text>
            <Text style={styles.metaText}>{item.points} puan</Text>
          </View>
          <Text style={styles.metaText}>{item.streak}</Text>
        </Card>
      ))}
      <Card style={styles.challengeCard}>
        <Trophy color={colors.amber} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Senden onde: Mert (+95 puan)</Text>
          <PrimaryButton title="Meydan Oku" />
        </View>
      </Card>
    </Screen>
  );
}

export function LeagueDetailScreen() {
  return (
    <Screen>
      <Header title="Lig Detayi" back />
      <Card style={styles.pathCard}>
        <Trophy size={58} color={colors.amber} />
        <View style={{ flex: 1 }}>
          <Text style={styles.bigTitle}>Altin Lig</Text>
          <Text style={styles.muted}>Sezon bitimine 4 gun</Text>
        </View>
      </Card>
      <Card style={styles.rankScale}>
        <View style={styles.scaleBar}><View style={styles.scaleMarker}><Text style={styles.scaleMarkerText}>#12</Text></View></View>
        <View style={{ flex: 1, gap: 12 }}>
          <LeagueStatus label="Terfi" value="Ilk 10" tone={colors.green} />
          <LeagueStatus label="Guvende" value="11 - 30" tone={colors.primary} />
          <LeagueStatus label="Dusme" value="30 alti" tone={colors.red} />
        </View>
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Puan Gecmisi (7 Gun)</Text>
        <View style={styles.lineChart}>{[20, 30, 38, 50, 55, 66, 78].map((h, i) => <View key={i} style={[styles.lineDot, { marginTop: 88 - h }]} />)}</View>
      </Card>
      <View style={styles.rowGap}>
        <OutlineButton title="Kurallari Gor" style={styles.rowButton} />
        <PrimaryButton title="Daha Fazla Puan Kazan" style={styles.rowButton} />
      </View>
    </Screen>
  );
}

export function RewardsScreen() {
  return (
    <Screen>
      <Header title="Sezon Odulleri" back />
      <SeasonRewardVisual height={180} />
      {[
        ['Ilk 3', 'Ozel Elmas Rozeti + 500 XP', colors.purple],
        ['Ilk 10', 'Altin Rozet + 250 XP', colors.amber],
        ['Katilim', '50 XP + Lig Katilim Rozeti', colors.primary],
      ].map(([title, body, tone]) => (
        <Card key={title} style={styles.rewardRow}>
          <Award color={tone} />
          <View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.muted}>{body}</Text>
          </View>
        </Card>
      ))}
      <Card style={styles.predictionCard}>
        <Text style={styles.cardTitle}>Mevcut Tahminin</Text>
        <Text style={styles.bigTitle}>Su an #12</Text>
        <Text style={styles.muted}>Hedef: Ilk 10</Text>
      </Card>
      <PrimaryButton title="Odul Detaylari" />
    </Screen>
  );
}

export function SeasonsScreen() {
  return (
    <Screen>
      <Header title="Gecmis Sezonlar" back />
      {[
        ['Sezon 8', 'Altin Lig', '#12', 'Tamamlandi'],
        ['Sezon 7', 'Gumus Lig', '#5', 'Terfi'],
        ['Sezon 6', 'Gumus Lig', '#14', 'Guvende'],
        ['Sezon 5', 'Bronz Lig', '#3', 'Terfi'],
      ].map(([season, tier, result, status]) => (
        <Card key={season} style={styles.seasonRow}>
          <Trophy color={status === 'Terfi' ? colors.green : colors.amber} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{season}</Text>
            <Text style={styles.muted}>{tier}</Text>
          </View>
          <Text style={styles.rankResult}>{result}</Text>
          <Pill label={status} tone={status === 'Terfi' ? colors.green : colors.primary} />
        </Card>
      ))}
      <Card style={styles.bestCard}>
        <Trophy color={colors.primary} />
        <View>
          <Text style={styles.bigTitle}>En iyi Sonuc: #3</Text>
          <Text style={styles.muted}>Toplam 4 sezon katilim</Text>
        </View>
      </Card>
      <PrimaryButton title="Detaylari Gor" />
    </Screen>
  );
}

function CourseTeaser({ course }: { course: CourseCard }) {
  return (
    <Card style={styles.courseTeaser}>
      <CourseThumbVisual />
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{course.title}</Text>
        <Text style={styles.muted}>{course.subtitle || 'Yapay sinir aglarinin temellerini ogrenmeye basla.'}</Text>
        <Pill label={course.duration} />
      </View>
      <Pressable onPress={() => router.push({ pathname: '/course-detail', params: { course: course.slug } })} style={styles.teaserAction}>
        <Text style={styles.teaserActionText}>Devam Et</Text>
      </Pressable>
    </Card>
  );
}

function InfoLine({ icon: Icon, label, value }: { icon: ScreenIcon; label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Icon size={22} color={colors.primary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function InfoMini({ icon: Icon, label, value }: { icon: ScreenIcon; label: string; value: string }) {
  return (
    <View style={styles.infoMini}>
      <Icon size={17} color={colors.primary} />
      <Text style={styles.metaText}>{label}</Text>
      {value ? <Text style={styles.metaText}>{value}</Text> : null}
    </View>
  );
}

function StatLine({ icon: Icon, label, value }: { icon: ScreenIcon; label: string; value: string }) {
  return (
    <View style={styles.statLine}>
      <Icon size={18} color={colors.amber} />
      <View>
        <Text style={styles.metaText}>{label}</Text>
        <Text style={styles.cardTitle}>{value}</Text>
      </View>
    </View>
  );
}

function LeagueStatus({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <Card style={styles.statusLine}>
      <View style={[styles.statusDot, { backgroundColor: tone }]} />
      <Text style={[styles.statusText, { color: tone }]}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create<Record<string, any>>({
  splash: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    backgroundColor: colors.primaryDark,
    marginHorizontal: -spacing.lg,
    marginVertical: -spacing.sm,
    padding: spacing.xl,
  },
  splashTitle: {
    color: colors.surface,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7c86b6',
  },
  dotActive: {
    backgroundColor: colors.surface,
  },
  centeredScreen: {
    flex: 1,
    alignItems: 'center',
  },
  bigTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
  },
  centerBody: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
  },
  featureStack: {
    width: '100%',
    marginTop: spacing.lg,
  },
  bottomAction: {
    width: '100%',
    marginTop: 'auto',
  },
  stepLabel: {
    color: colors.ink,
    fontWeight: '800',
  },
  questionWrap: {
    marginTop: spacing.xl,
    gap: spacing.md,
    flex: 1,
  },
  questionText: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '900',
    marginVertical: spacing.lg,
  },
  optionRow: {
    minHeight: 60,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  optionRowActive: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: '#f9fbff',
  },
  optionBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#edf1f8',
  },
  optionBadgeActive: {
    backgroundColor: colors.primary,
  },
  optionBadgeText: {
    color: '#7d879b',
    fontWeight: '900',
  },
  optionBadgeTextActive: {
    color: colors.surface,
  },
  optionText: {
    flex: 1,
    color: colors.text,
    fontWeight: '700',
  },
  optionTextActive: {
    color: colors.ink,
  },
  rowGap: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  rowButton: {
    flex: 1,
  },
  terms: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  authInput: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.red,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  successText: {
    color: colors.green,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  interestTile: {
    width: '47.8%',
    minHeight: 86,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    justifyContent: 'center',
    gap: 8,
  },
  interestTileActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primarySoft,
  },
  interestText: {
    color: colors.text,
    fontWeight: '800',
  },
  interestTextActive: {
    color: colors.ink,
  },
  interestCheck: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  darkTopCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  darkTitle: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  darkSubtitle: {
    color: '#c9d4ff',
    fontSize: 14,
    fontWeight: '700',
  },
  resultCard: {
    marginTop: -18,
    gap: spacing.md,
  },
  resultBody: {
    color: colors.muted,
    lineHeight: 21,
    textAlign: 'center',
  },
  infoLine: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoLabel: {
    flex: 1,
    color: colors.muted,
    fontWeight: '700',
  },
  infoValue: {
    color: colors.ink,
    fontWeight: '900',
  },
  levelCard: {
    backgroundColor: colors.primaryDark,
    gap: spacing.md,
  },
  darkSmall: {
    color: colors.surface,
    fontSize: 17,
    fontWeight: '900',
  },
  levelCaption: {
    color: '#bfc9ef',
    marginTop: 18,
    fontSize: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  percentText: {
    color: colors.surface,
    fontSize: 28,
    fontWeight: '900',
  },
  xpText: {
    color: colors.surface,
    fontSize: 21,
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.74,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  courseTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  teaserAction: {
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  teaserActionText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900',
  },
  goalCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: colors.greenSoft,
  },
  pathPressable: {
    marginBottom: spacing.md,
  },
  pathCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pathActive: {
    borderColor: '#a7e7c2',
    backgroundColor: '#f4fff8',
  },
  pathLocked: {
    opacity: 0.82,
  },
  pathIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineMeta: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  catalogGrid: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  catalogCourse: {
    minHeight: 62,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  catalogCourseTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  progressCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 6,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleText: {
    color: colors.ink,
    fontWeight: '900',
  },
  metaStrip: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  infoMini: {
    flex: 1,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  lessonRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  lessonRowLocked: {
    backgroundColor: '#f6f8fc',
    opacity: 0.72,
  },
  lessonStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  lessonDone: {
    backgroundColor: colors.green,
  },
  lessonTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  lockedLessonText: {
    color: '#778198',
  },
  lessonGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  lessonGroupTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  lessonGroupMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  contentCard: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  contentCallout: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
  },
  contentBlockTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  contentBlockBody: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  markdownHeading: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
  },
  markdownSubheading: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 22,
    marginTop: 2,
  },
  markdownText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  markdownBullet: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
    paddingLeft: 4,
  },
  markdownSpacer: {
    height: 4,
  },
  codeLanguage: {
    color: '#d4e4ff',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 8,
  },
  labEmbedCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#c7dcff',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.primarySoft,
  },
  lockedLessonCard: {
    marginTop: spacing.xl,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  lessonScreenContent: {
    gap: spacing.md,
    minHeight: '100%',
  },
  lessonProgressBlock: {
    gap: spacing.sm,
  },
  learningStepCard: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  stepKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  stepKicker: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  learningStepTitle: {
    color: colors.ink,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
  },
  learningStepBody: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
  learningList: {
    gap: spacing.sm,
  },
  learningBulletRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  learningBulletDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 7,
  },
  learningBulletText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  learningOrderedRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  learningNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  learningNumberText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900',
  },
  lessonQuizStack: {
    gap: spacing.md,
  },
  quizFocusCard: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  quizProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'center',
  },
  quizProgressText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  lessonQuizQuestion: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  lessonQuizPrompt: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '900',
  },
  lessonQuizOption: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  lessonQuizOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  lessonQuizOptionCorrect: {
    borderColor: colors.green,
    backgroundColor: '#eafaf1',
  },
  lessonQuizOptionWrong: {
    borderColor: colors.red,
    backgroundColor: '#fff1f1',
  },
  lessonQuizOptionText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  lessonQuizOptionTextSelected: {
    color: colors.ink,
  },
  lessonQuizOptionTextCorrect: {
    color: colors.green,
  },
  lessonQuizOptionTextWrong: {
    color: colors.red,
  },
  quizExplanation: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  flowCard: {
    marginTop: spacing.md,
    gap: spacing.md,
    backgroundColor: '#f7fbff',
  },
  flowCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  flowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  flowTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 3,
  },
  flowButton: {
    width: '100%',
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  bulletCard: {
    marginTop: spacing.md,
  },
  bullet: {
    color: colors.text,
    marginTop: 8,
  },
  activationCard: {
    gap: spacing.md,
  },
  linkTitle: {
    color: colors.primary,
    fontWeight: '900',
  },
  activationGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  activationCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  activationName: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 12,
  },
  tinyChart: {
    height: 58,
    width: '100%',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chartLine: {
    height: 3,
    width: 70,
    backgroundColor: colors.primary,
    borderRadius: 99,
    alignSelf: 'center',
  },
  noteCallout: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: '#f7fbff',
  },
  infoCallout: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
  },
  codeCard: {
    backgroundColor: colors.primaryDark,
    marginVertical: spacing.md,
  },
  codeLine: {
    color: '#9fe7c2',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 6,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sliderLabel: {
    width: 34,
    color: colors.text,
    fontWeight: '800',
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#dfe6f4',
    borderRadius: 99,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  sliderValue: {
    width: 46,
    textAlign: 'right',
    color: colors.muted,
    fontWeight: '800',
  },
  outputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.greenSoft,
  },
  outputTitle: {
    color: colors.green,
    fontSize: 20,
    fontWeight: '900',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  searchInput: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    color: colors.text,
  },
  noteCard: {
    marginBottom: spacing.md,
  },
  noteText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  noteBookmark: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
  },
  floatingAdd: {
    position: 'absolute',
    right: 22,
    bottom: 94,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatArea: {
    flex: 1,
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSoft,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primarySoft,
    borderColor: '#c7dcff',
  },
  messageText: {
    color: colors.text,
    lineHeight: 20,
  },
  userMessageText: {
    color: colors.ink,
  },
  promptChips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  promptButton: {
    flex: 1,
    minHeight: 52,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chatInput: {
    flex: 1,
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyticsTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  progressHeroPanel: {
    backgroundColor: colors.primarySoft,
    borderColor: '#c8dcff',
    padding: spacing.md,
  },
  progressHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    alignItems: 'center',
  },
  progressKicker: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  progressHeroTitle: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '900',
    marginTop: 2,
  },
  progressMetricStack: {
    flex: 1,
    gap: spacing.sm,
  },
  bigRing: {
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 11,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigRingText: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '900',
  },
  statLine: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#c8dcff',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  activityCard: {
    marginTop: spacing.md,
  },
  barChart: {
    height: 136,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  barWrap: {
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    width: 20,
    borderRadius: 7,
    backgroundColor: colors.primary,
  },
  smallSummary: {
    flex: 1,
  },
  nextMilestoneCard: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  profileHero: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#e7efff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 24,
  },
  profileName: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: '900',
  },
  profileMeta: {
    color: '#c9d4ff',
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  badgeMini: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  badgeText: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
  },
  settingsRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  certificateTop: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  nextCourse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  leagueHero: {
    backgroundColor: colors.primaryDark,
    gap: spacing.sm,
  },
  leagueTitle: {
    color: colors.surface,
    fontSize: 28,
    fontWeight: '900',
  },
  leaguePoints: {
    color: colors.surface,
    fontSize: 32,
    fontWeight: '900',
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statusText: {
    flex: 1,
    fontWeight: '900',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  podiumItem: {
    alignItems: 'center',
    gap: 4,
  },
  avatarSmall: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankMedal: {
    color: colors.amber,
    fontSize: 22,
    fontWeight: '900',
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  leaderRowActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  rankText: {
    color: colors.ink,
    width: 24,
    fontWeight: '900',
    fontSize: 16,
  },
  avatarTiny: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTinyText: {
    color: colors.primary,
    fontWeight: '900',
  },
  leaderName: {
    flex: 1,
    color: colors.text,
    fontWeight: '900',
  },
  leaderPoints: {
    color: colors.ink,
    fontWeight: '900',
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.faint,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  segmentText: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 12,
    color: colors.muted,
    fontWeight: '800',
  },
  segmentActive: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 12,
    backgroundColor: colors.primary,
    color: colors.surface,
    borderRadius: radius.sm,
    fontWeight: '900',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  friendRowActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  challengeCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
  },
  rankScale: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginVertical: spacing.md,
  },
  scaleBar: {
    width: 44,
    height: 180,
    borderRadius: 22,
    backgroundColor: colors.green,
  },
  scaleMarker: {
    position: 'absolute',
    top: 58,
    left: -10,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  scaleMarkerText: {
    color: colors.surface,
    fontWeight: '900',
  },
  lineChart: {
    height: 110,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  lineDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: colors.primary,
  },
  rewardRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  predictionCard: {
    backgroundColor: colors.primarySoft,
    marginVertical: spacing.md,
  },
  seasonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rankResult: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  bestCard: {
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.md,
  },
});
