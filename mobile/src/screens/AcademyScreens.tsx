import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentType } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View, type ImageSourcePropType } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  Bot,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  Flame,
  FileText,
  Globe2,
  GraduationCap,
  Headphones,
  Lightbulb,
  Lock,
  LogOut,
  Maximize2,
  Minimize2,
  Monitor,
  Moon,
  Play,
  Plus,
  SkipForward,
  RotateCcw,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Target,
  TrendingUp,
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
} from '../components/AcademyPrimitives';
import {
  CertificateVisual,
  CourseHeroVisual,
  LevelBadgeVisual,
  MentorRobotVisual,
  SeasonRewardVisual,
  TargetVisual,
} from '../components/AcademyVisuals';
import PyodideRunner from '../components/PyodideRunner';
import type { PyodideRunnerHandle } from '../components/PyodideRunner.types';
import { useAuth } from '../auth/AuthProvider';
import { useCelebrations } from '../celebrations/CelebrationProvider';
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
import { buildDiceBearAvatarUrl, defaultAvatarConfig, getSavedAvatarConfig, type AvatarConfig } from '../lib/avatar';
import { academyBadges, type AcademyBadge } from '../lib/badges';
import {
  colors,
  radius,
  registerThemeStyles,
  spacing,
  ThemedStatusBar,
  type ThemeColors,
  type ThemePreference,
  useTheme,
  useThemePreference,
} from '../theme';

type ScreenIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number; style?: object }>;
const leagueBadgeAssets = {
  bronze: require('../../assets/league/bronze-league-badge.png') as number,
  silver: require('../../assets/league/silver-league-badge.png') as number,
  gold: require('../../assets/league/gold-league-badge.png') as number,
  platinum: require('../../assets/league/platinum-league-badge.png') as number,
  diamond: require('../../assets/league/diamond-league-badge.png') as number,
};
const badgeAssets: Record<string, number> = {
  'algorithm-master': require('../../assets/badges/algorithm-master.png') as number,
  'quiz-champion': require('../../assets/badges/quiz-champion.png') as number,
  'consistent-learner': require('../../assets/badges/consistent-learner.png') as number,
  'python-basics': require('../../assets/badges/python-basics.png') as number,
  'neural-explorer': require('../../assets/badges/neural-explorer.png') as number,
  'prompt-guardian': require('../../assets/badges/prompt-guardian.png') as number,
  'data-cleaner': require('../../assets/badges/data-cleaner.png') as number,
  'model-trainer': require('../../assets/badges/model-trainer.png') as number,
  'deployment-pioneer': require('../../assets/badges/deployment-pioneer.png') as number,
  'lab-runner': require('../../assets/badges/lab-runner.png') as number,
  'note-keeper': require('../../assets/badges/note-keeper.png') as number,
  'league-climber': require('../../assets/badges/league-climber.png') as number,
};
function getBadgeAssetSource(id: string): ImageSourcePropType {
  if (Platform.OS === 'web') {
    return { uri: `/badges/${id}.png` };
  }
  return badgeAssets[id];
}
const leagueLeaderboard = [
  { rank: 1, name: 'Emre Yılmaz', points: '3.120' },
  { rank: 2, name: 'Zeynep Kaya', points: '2.780' },
  { rank: 3, name: 'Ali Demir', points: '2.450' },
  { rank: 4, name: 'Defne Arslan', points: '2.210' },
  { rank: 5, name: 'Mert Çelik', points: '1.980' },
  { rank: 6, name: 'İlayda Şahin', points: '1.760' },
  { rank: 7, name: 'Berkay Koç', points: '1.540' },
  { rank: 8, name: 'Sude Öztürk', points: '1.320' },
  { rank: 9, name: 'Yusuf Karaca', points: '1.120' },
  { rank: 10, name: 'Ceren Polat', points: '960' },
];
const leagueAvatarPresets: Partial<AvatarConfig>[] = [
  { top: 'shortRound', hairColor: '262e33', clothing: 'blazerAndShirt', clothesColor: '25557c', skinColor: 'edb98a', mouth: 'smile', eyes: 'happy', eyebrows: 'defaultNatural', accessories: 'none', preset: 'classic' },
  { top: 'bob', hairColor: '724133', clothing: 'collarAndSweater', clothesColor: '65c9ff', skinColor: 'd08b5b', mouth: 'twinkle', eyes: 'default', eyebrows: 'raisedExcited', accessories: 'round', preset: 'minimal' },
  { top: 'curly', hairColor: '2c1b18', clothing: 'hoodie', clothesColor: '3c4f5c', skinColor: 'ae5d29', mouth: 'smile', eyes: 'squint', eyebrows: 'upDown', accessories: 'none', preset: 'colorful' },
  { top: 'bun', hairColor: 'a55728', clothing: 'shirtCrewNeck', clothesColor: 'ffffff', skinColor: 'edb98a', mouth: 'default', eyes: 'happy', eyebrows: 'default', accessories: 'prescription01', preset: 'energetic' },
  { top: 'shaggy', hairColor: '262e33', clothing: 'graphicShirt', clothesColor: 'ff5c5c', skinColor: 'd08b5b', mouth: 'serious', eyes: 'default', eyebrows: 'defaultNatural', accessories: 'none', preset: 'classic' },
];

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
  useTheme();
  return (
    <Screen scroll={false}>
      <ThemedStatusBar />
      <View style={styles.centeredScreen}>
        <TargetVisual height={190} />
        <Text style={styles.bigTitle}>AI Engineering Academy</Text>
        <Text style={styles.centerBody}>AI mühendisliği yolculuğuna doğru seviyeden başla ve sana uygun öğrenme rotasına ilerle.</Text>
        <View style={styles.featureStack}>
          <FeatureRow icon={GraduationCap} title="Seviye Odaklı" body="Başlangıç noktanı netleştir ve doğru rotadan ilerle." />
          <FeatureRow icon={Bot} title="AI Destekli" body="Ders, quiz ve pratik akışını tek yerde takip et." tone="purple" />
          <FeatureRow icon={Target} title="Hedefe Yönelik" body="Kısa test sonrası kişisel öğrenme planını oluştur." />
        </View>
        <View style={styles.bottomAction}>
          <PrimaryButton title="Başla" onPress={() => router.push('/placement-intro')} />
        </View>
      </View>
    </Screen>
  );
}

export function PlacementIntroScreen() {
  useTheme();
  async function skipPlacement() {
    await submitPlacement(0, 1);
    router.replace('/dashboard');
  }

  return (
    <Screen scroll={false}>
      <ThemedStatusBar />
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
          <View style={{ height: 10 }} />
          <OutlineButton title="Seviye Testini Atla" onPress={skipPlacement} />
        </View>
      </View>
    </Screen>
  );
}

export function PlacementQuestionScreen() {
  useTheme();
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

  async function finishPlacement(nextAnswers: Record<number, number>) {
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

  async function continuePlacement() {
    if (!placementQuestion || typeof selected !== 'number') {
      setFlowError('Devam etmek icin bir cevap secebilir, Bilmiyorum diyebilir veya testi atlayabilirsin.');
      return;
    }
    await finishPlacement({ ...selectedAnswers, [currentIndex]: selected });
  }

  async function markUnknownAndContinue() {
    await finishPlacement({ ...selectedAnswers, [currentIndex]: -1 });
  }

  async function skipPlacement() {
    await submitPlacement(0, questions.length || 1);
    router.replace('/dashboard');
  }

  return (
    <Screen scroll={false}>
      <ThemedStatusBar />
      <Header
        back
        right={
          <Pressable accessibilityRole="button" onPress={skipPlacement} style={({ pressed }) => [styles.skipTestButton, pressed && styles.pressed]}>
            <SkipForward size={15} color={colors.primary} strokeWidth={2.8} />
            <Text style={styles.skipTestText}>Testi Atla</Text>
          </Pressable>
        }
      />
      <View style={styles.placementTopRow}>
        <Text style={styles.stepLabel}>{getPlacementStepLabel(currentIndex, questions.length || 1)}</Text>
      </View>
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
      <View style={styles.placementActions}>
        <OutlineButton title="Bu Soruyu Atla" onPress={markUnknownAndContinue} />
      </View>
      <View style={styles.rowGap}>
        <OutlineButton title="Geri" onPress={() => (currentIndex > 0 ? setCurrentIndex((index) => index - 1) : router.back())} style={styles.rowButton} />
        <PrimaryButton title={isLastPlacementQuestion(currentIndex, questions.length) ? 'Sonucu Gor' : 'Devam'} onPress={continuePlacement} style={styles.rowButton} />
      </View>
    </Screen>
  );
}

export function AuthScreen() {
  useTheme();
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
      <ThemedStatusBar />
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
  useTheme();
  const { data: interests, error } = useAsyncData<string[]>(getInterests, []);
  const [selected, setSelected] = useState(new Set(['Python', 'Makine Ogrenmesi', 'Derin Ogrenme', 'MLOps', 'Prompt Engineering']));
  async function continueWithInterests() {
    await saveSelectedInterests([...selected]);
    router.push('/level-result');
  }
  return (
    <Screen>
      <ThemedStatusBar />
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
              <Sparkles size={25} color={active ? colors.primary : colors.muted} />
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
  useTheme();
  const { celebrate } = useCelebrations();
  const result = calculatePlacementResult(4, 5);
  async function startRecommendedPath() {
    await celebrate({
      type: 'level_assigned',
      title: `${result.label} seviye açıldı`,
      body: `Öğrenme rotan ${result.label} seviyesine göre hazırlandı. Tahmini süre: ${result.estimatedHours} saat.`,
      assetKey: 'achievement',
      dedupeKey: `level-assigned-${result.level}`,
      targetRoute: '/dashboard',
    });
    router.push('/dashboard');
  }

  return (
    <Screen>
      <ThemedStatusBar />
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
      <PrimaryButton title="Yolumu Baslat" onPress={startRecommendedPath} />
      <View style={{ height: 8 }} />
      <OutlineButton title="Testi Tekrarla" onPress={() => router.push('/placement-question')} />
    </Screen>
  );
}

export function DashboardScreen() {
  useTheme();
  const { user } = useAuth();
  const { data: courses, error } = useAsyncData<CourseCard[]>(getCourseCatalog, []);
  const displayName = getDisplayName(user);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const featuredCourse = courses[0] ?? {
    slug: 'neural-networks-101',
    title: 'Neural Networks 101',
    subtitle: 'Yapay sinir aglarinin temelleri',
    level: 'Orta',
    duration: '25 dk',
    moduleCount: 8,
    progress: 65,
  };

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getSavedAvatarConfig().then((savedConfig) => {
        if (mounted) setAvatarUrl(savedConfig ? buildDiceBearAvatarUrl(savedConfig, 128) : null);
      });
      return () => {
        mounted = false;
      };
    }, [])
  );

  return (
    <Screen bottomTab="home">
      <DashboardHeader displayName={displayName} avatarUrl={avatarUrl} />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <DashboardLevelCard />
      <DashboardStatsPanel />
      <SectionTitle title="Önerilen Sonraki Ders" />
      <DashboardCourseRecommendation course={featuredCourse} />
      <DashboardGoalCard />
    </Screen>
  );
}

export function PathsScreen() {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 430;
  const pathPalette = getPathsPalette(isDark);
  const { data: paths, error } = useAsyncData<PathCard[]>(getLearningPaths, []);
  const totalLessons = paths.reduce((sum, path) => sum + path.lessonCount, 0) || 126;
  const totalHours = paths.reduce((sum, path) => sum + path.estimatedHours, 0) || 70;
  return (
    <Screen bottomTab="paths" contentStyle={[styles.pathsScreenContent, { backgroundColor: pathPalette.page }]}>
      <View style={[styles.pathsCompactHeader, { backgroundColor: pathPalette.surface, borderColor: pathPalette.border }]}>
        <View>
          <Text style={[styles.pathsCompactHeaderTitle, { color: pathPalette.text }]}>Öğrenme Planı</Text>
          <Text style={[styles.pathsCompactHeaderSubtitle, { color: pathPalette.muted }]}>Aşamalı rota takibi</Text>
        </View>
        <View style={[styles.pathsCompactHeaderIcon, { backgroundColor: pathPalette.iconSoft }]}>
          <BookOpen size={22} color={pathPalette.accent} strokeWidth={2.5} />
        </View>
      </View>
      <View style={styles.pathsHeader}>
        <Text style={[styles.pathsTitle, compact && styles.pathsTitleCompact, { color: pathPalette.text }]}>Öğrenme Yolları</Text>
        <Text style={[styles.pathsSubtitle, compact && styles.pathsSubtitleCompact, { color: pathPalette.muted }]}>AI mühendisliği yolculuğunda ilerle.</Text>
      </View>

      <LearningPathOverviewCard totalLessons={totalLessons} totalHours={totalHours} compact={compact} palette={pathPalette} />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={[styles.pathTimeline, compact && styles.pathTimelineCompact]}>
        <View style={[styles.pathTimelineLine, compact && styles.pathTimelineLineCompact, { backgroundColor: pathPalette.line }]} />
        {paths.slice(0, 4).map((path, index) => (
          <PathLevelCard key={path.slug} path={path} index={index} compact={compact} palette={pathPalette} />
        ))}
      </View>
    </Screen>
  );
}

export function CourseDetailScreen() {
  useTheme();
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
  const pathCourses = useMemo(
    () => (selectedPath ? courses.filter((course) => course.pathSlug === selectedPath) : []),
    [courses, selectedPath],
  );
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
  const lessonGroups = useMemo(() => (isPathDetail
    ? pathCourses
      .map((course) => ({
        course,
        lessons: visibleLessons.filter((lesson) => lesson.courseSlug === course.slug),
      }))
      .filter((group) => group.lessons.length)
    : [{ course: selectedCourse, lessons: visibleLessons }]), [isPathDetail, pathCourses, selectedCourse, visibleLessons]);
  const lessonGroupSlugsKey = lessonGroups.map((group) => group.course.slug).join('|');
  const firstLessonGroupSlug = lessonGroups[0]?.course.slug ?? '';
  const [expandedCourseSlugs, setExpandedCourseSlugs] = useState<string[]>([]);

  useEffect(() => {
    if (!firstLessonGroupSlug) return;
    const validSlugs = new Set(lessonGroupSlugsKey.split('|').filter(Boolean));
    setExpandedCourseSlugs((current) => {
      const next = current.filter((slug) => validSlugs.has(slug));
      return next.length ? next : [firstLessonGroupSlug];
    });
  }, [firstLessonGroupSlug, lessonGroupSlugsKey]);

  const toggleLessonGroup = (courseSlug: string) => {
    setExpandedCourseSlugs((current) => (
      current.includes(courseSlug)
        ? current.filter((slug) => slug !== courseSlug)
        : [...current, courseSlug]
    ));
  };

  const openLesson = (lesson: LessonCard | undefined) => {
    if (!lesson) return;
    if (getVisibleLessonStatus(lesson) === 'locked') return;
    router.push({ pathname: '/lesson-player', params: { lesson: lesson.slug } });
  };
  return (
    <Screen contentStyle={styles.courseDetailScreen}>
      <ThemedStatusBar />
      <Header
        title={isPathDetail ? 'Öğrenme Rotası' : 'Kurs Detayı'}
        subtitle={detailLevel}
        back
        backFallback="/paths"
        right={<Pressable onPress={() => toggleBookmark('course', selectedCourse.id)}><Bookmark size={22} color={colors.ink} /></Pressable>}
      />
      <CourseHeroVisual
        height={232}
        title={detailTitle}
        subtitle={detailSubtitle}
        metrics={[detailDuration, detailLevel, `${visibleLessons.length || (selectedCourse.lessonCount ?? 0)} ders`]}
        progress={detailProgress}
      />
      {courseError || lessonsError ? <Text style={styles.errorText}>{courseError ?? lessonsError}</Text> : null}
      <View style={styles.courseOverviewPanel}>
        <View style={styles.courseHeader}>
          <View style={styles.courseOverviewCopy}>
            <Text style={styles.courseOverviewTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.88}>{detailTitle}</Text>
            <Text style={styles.courseOverviewSubtitle} numberOfLines={2}>{detailSubtitle}</Text>
          </View>
          <CourseProgressRing value={detailProgress} />
        </View>
        <View style={styles.courseOverviewDivider} />
        <View style={styles.metaStrip}>
          <InfoMini icon={Clock3} label="Süre" value={detailDuration} />
          <View style={styles.metaDivider} />
          <InfoMini icon={BookOpen} label="İçerik" value={`${visibleLessons.length || (selectedCourse.lessonCount ?? 0)} Ders`} />
          <View style={styles.metaDivider} />
          <InfoMini icon={BarChart3} label="Seviye" value={detailLevel} />
        </View>
        <View style={styles.courseContentDivider} />
        <View style={styles.courseContentHeader}>
          <Text style={styles.courseContentTitle}>Ders İçeriği</Text>
          <Text style={styles.courseContentSubtitle}>{isPathDetail ? `${pathCourses.length} kur, ${visibleLessons.length} ders` : `${visibleLessons.length || (selectedCourse.lessonCount ?? 0)} ders`}</Text>
        </View>
        {lessonGroups.map((group) => (
          <View key={group.course.slug} style={styles.lessonGroupBlock}>
            {(() => {
              const expanded = expandedCourseSlugs.includes(group.course.slug);
              return (
            <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${group.course.title} derslerini ${expanded ? 'kapat' : 'aç'}`}
              accessibilityState={{ expanded }}
              onPress={() => toggleLessonGroup(group.course.slug)}
              style={({ pressed }) => [styles.lessonGroupHeader, pressed && styles.pressed]}
            >
              <Text style={styles.lessonGroupTitle}>{group.course.title}</Text>
              <View style={styles.lessonGroupRight}>
                <Text style={styles.lessonGroupMeta}>{group.lessons.length} ders</Text>
                <View style={[styles.lessonGroupChevronBox, !expanded && styles.lessonGroupChevronClosed]}>
                  <ChevronDown size={18} color="#dce9ff" strokeWidth={3} />
                </View>
              </View>
            </Pressable>
            {expanded ? group.lessons.map((lesson) => {
              const lessonStatus = getVisibleLessonStatus(lesson);
              const unlocked = lessonStatus !== 'locked';
              return (
                <Pressable
                  key={lesson.slug}
                  accessibilityRole="button"
                  onPress={() => openLesson(lesson)}
                  style={({ pressed }) => [
                    styles.lessonRow,
                    unlocked && styles.lessonRowActive,
                    lessonStatus === 'locked' && styles.lessonRowLocked,
                    pressed && unlocked && styles.pressed,
                  ]}
                >
                  <View style={[styles.courseLessonStatus, unlocked && styles.courseLessonStatusActive]}>
                    {lessonStatus === 'locked' ? <Lock size={14} color={colors.muted} /> : <Play size={14} color={colors.green} fill={colors.green} />}
                  </View>
                  <View style={styles.lessonTextBlock}>
                    <Text style={[styles.lessonTitle, lessonStatus === 'locked' && styles.lockedLessonText]} numberOfLines={2}>{lesson.title}</Text>
                    <Text style={[styles.lessonMeta, lessonStatus === 'locked' && styles.lockedLessonText]}>{lesson.type}  •  {lesson.duration}  •  {lessonStatus === 'locked' ? 'Kilitli' : lessonStatus === 'done' ? 'Tamamlandı' : 'Aktif'}</Text>
                  </View>
                  <View style={[styles.lessonActionStatus, unlocked && styles.lessonActionStatusActive]}>
                    {lessonStatus === 'locked' ? <Lock size={16} color={colors.muted} /> : <Check size={17} color={colors.ink} strokeWidth={2.8} />}
                  </View>
                </Pressable>
              );
            }) : null}
            </>
              );
            })()}
          </View>
        ))}
      </View>
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
  if (kind === 'goal') return <Target size={23} color={colors.primary} strokeWidth={2.6} />;
  if (kind === 'why') return <Lightbulb size={23} color={colors.amber} strokeWidth={2.6} />;
  if (kind === 'practice') return <Settings2 size={23} color={colors.purple} strokeWidth={2.6} />;
  if (kind === 'code') return <BookOpen size={23} color={colors.green} strokeWidth={2.6} />;
  if (kind === 'lab') return <Zap size={23} color={colors.primary} strokeWidth={2.6} />;
  if (kind === 'summary') return <ShieldCheck size={23} color={colors.green} strokeWidth={2.6} />;
  return <BookOpen size={23} color={colors.primary} strokeWidth={2.6} />;
}

function LessonLearningStepView({ step, lessonSlug }: { step: LessonLearningStep; lessonSlug: string }) {
  const labParams: Record<string, string> = {};
  if (step.labSlug) labParams.lab = step.labSlug;
  if (lessonSlug) labParams.lesson = lessonSlug;

  return (
    <Card style={styles.learningStepCard}>
      <LessonStepCardPattern />
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
              <View style={styles.learningCheckBubble}>
                <Check size={18} color={colors.primary} strokeWidth={3} />
              </View>
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
        <CodeExecutionCard code={step.code} language={step.codeLanguage} stepId={step.id} />
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

function LessonStepCardPattern() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 360 520" style={StyleSheet.absoluteFill}>
      {[0, 1, 2, 3, 4, 5, 6].map((index) => (
        <Path
          key={index}
          d={`M210 ${96 + index * 8} C258 ${96 - index * 7}, 300 ${74 - index * 2}, 365 ${8 + index * 10}`}
          fill="none"
          stroke="rgba(17,17,17,0.08)"
          strokeWidth="1"
        />
      ))}
      {[252, 270, 288, 306, 324, 342].map((x) => (
        [22, 40, 58, 76, 94].map((y) => (
          <Circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="rgba(17,17,17,0.14)" />
        ))
      ))}
    </Svg>
  );
}

function CodeExecutionCard({ code, language, stepId }: { code: string; language?: string; stepId: string }) {
  const runnerRef = useRef<PyodideRunnerHandle>(null);
  const [editableCode, setEditableCode] = useState(code);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [runState, setRunState] = useState<CodeRunState>('idle');
  const [output, setOutput] = useState('');
  const [runError, setRunError] = useState<string | null>(null);
  const codeLanguage = language ?? 'python';
  const canRunPython = codeLanguage.toLowerCase() === 'python';

  const runEditableCode = useCallback(async () => {
    if (!canRunPython) {
      setRunState('error');
      setRunError(`${codeLanguage} için çalışma ortamı henüz desteklenmiyor.`);
      setOutput(`${codeLanguage} için çalışma ortamı henüz desteklenmiyor.`);
      return;
    }

    setRunState('running');
    setRunError(null);

    try {
      const result = await runnerRef.current?.runPython(editableCode);
      if (!result) throw new Error('Python çalışma ortamı hazır değil.');

      setOutput(result.output);
      setRunError(result.error ?? null);
      setRunState(result.ok ? 'success' : 'error');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setOutput(message);
      setRunError(message);
      setRunState('error');
    }
  }, [canRunPython, codeLanguage, editableCode]);

  return (
    <>
      {canRunPython ? <PyodideRunner ref={runnerRef} /> : null}
      <CodeEditorPanel
        code={editableCode}
        language={codeLanguage}
        runState={runState}
        output={output}
        error={runError}
        stepId={stepId}
        onChangeCode={setEditableCode}
        onRun={runEditableCode}
        onToggleFullscreen={() => setIsFullscreen(true)}
      />
      <Modal visible={isFullscreen} animationType="slide" onRequestClose={() => setIsFullscreen(false)}>
        <View style={styles.codeFullscreenShell}>
          <CodeEditorPanel
            code={editableCode}
            language={codeLanguage}
            runState={runState}
            output={output}
            error={runError}
            stepId={`${stepId}-fullscreen`}
            fullscreen
            onChangeCode={setEditableCode}
            onRun={runEditableCode}
            onToggleFullscreen={() => setIsFullscreen(false)}
          />
        </View>
      </Modal>
    </>
  );
}

function CodeEditorPanel({
  code,
  language,
  runState,
  output,
  error,
  stepId,
  fullscreen = false,
  onChangeCode,
  onRun,
  onToggleFullscreen,
}: {
  code: string;
  language: string;
  runState: CodeRunState;
  output: string;
  error: string | null;
  stepId: string;
  fullscreen?: boolean;
  onChangeCode: (code: string) => void;
  onRun: () => void | Promise<void>;
  onToggleFullscreen: () => void;
}) {
  const { width } = useWindowDimensions();
  const lineCount = Math.max(1, code.split('\n').length);
  const isRunning = runState === 'running';
  const isSuccess = runState === 'success';
  const isError = runState === 'error';
  const hasRun = isSuccess || isError;
  const compactHeader = !fullscreen && width < 390;
  const statusLabel = isRunning ? 'Çalışıyor' : isError ? 'Hata' : isSuccess ? 'Başarılı' : 'Bekliyor';
  const buttonLabel = isRunning ? 'Çalışıyor' : hasRun && !compactHeader ? 'Tekrar Çalıştır' : 'Çalıştır';
  const outputText = hasRun ? output : 'Kodu çalıştırınca konsol çıktısı burada görünecek.';

  return (
    <View style={[styles.codeRunnerCard, fullscreen && styles.codeRunnerCardFullscreen]}>
      <View style={styles.codeRunnerHeader}>
        <View style={styles.codeRunnerTitleRow}>
          <View style={styles.codeRunnerDot} />
          <View style={styles.codeRunnerTitleTextWrap}>
            <Text numberOfLines={1} style={styles.codeRunnerTitle}>Kod Çalıştırıcı</Text>
            <Text numberOfLines={1} style={styles.codeRunnerSubtitle}>{language} ortamı</Text>
          </View>
        </View>
        <View style={styles.codeRunnerActions}>
          <Pressable accessibilityRole="button" onPress={onToggleFullscreen} style={({ pressed }) => [styles.codeIconButton, pressed && styles.pressed]}>
            {fullscreen ? <Minimize2 size={17} color="#ffffff" strokeWidth={2.4} /> : <Maximize2 size={17} color="#ffffff" strokeWidth={2.4} />}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={isRunning}
            onPress={onRun}
            style={({ pressed }) => [styles.codeRunButton, isRunning && styles.codeRunButtonDisabled, pressed && styles.pressed]}
          >
            <Play size={15} color={colors.surface} fill={colors.surface} />
            <Text style={styles.codeRunButtonText}>{buttonLabel}</Text>
          </Pressable>
        </View>
      </View>
      <View style={[styles.codeEditor, fullscreen && styles.codeEditorFullscreen]}>
        <View style={styles.codeLineNumberColumn}>
          {Array.from({ length: lineCount }).map((_, index) => (
            <Text key={`${stepId}-line-${index}`} style={styles.codeLineNumber}>{index + 1}</Text>
          ))}
        </View>
        <View style={[styles.codeInputLayer, fullscreen && styles.codeInputLayerFullscreen]}>
          <View pointerEvents="none" style={styles.codeHighlightLayer}>
            <HighlightedPythonCode code={code} fullscreen={fullscreen} />
          </View>
          <TextInput
            value={code}
            onChangeText={onChangeCode}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            textAlignVertical="top"
            accessibilityLabel="Düzenlenebilir kod alanı"
            cursorColor="#ffffff"
            selectionColor="rgba(37,136,255,0.36)"
            style={[styles.codeRunnerInput, fullscreen && styles.codeRunnerInputFullscreen]}
          />
        </View>
      </View>
      <View style={[styles.codeOutputPanel, isSuccess && styles.codeOutputPanelActive, isError && styles.codeOutputPanelError]}>
        <View style={styles.codeOutputHeader}>
          <Text style={styles.codeOutputLabel}>Çıktı</Text>
          <View style={styles.codeOutputStatus}>
            {isSuccess ? <Check size={13} color={colors.green} strokeWidth={3} /> : <RotateCcw size={13} color={isError ? colors.red : colors.muted} strokeWidth={2.6} />}
            <Text style={[styles.codeOutputStatusText, isSuccess && styles.codeOutputStatusTextActive, isError && styles.codeOutputStatusTextError]}>{statusLabel}</Text>
          </View>
        </View>
        <Text selectable style={hasRun ? [styles.codeOutputText, isError && styles.codeOutputTextError] : styles.codeOutputPlaceholder}>
          {isError && error ? error : outputText}
        </Text>
      </View>
    </View>
  );
}

type CodeRunState = 'idle' | 'running' | 'success' | 'error';

type CodeToken = {
  text: string;
  tone: 'plain' | 'keyword' | 'builtin' | 'string' | 'number' | 'comment' | 'operator' | 'function';
};

const pythonKeywords = new Set([
  'and',
  'as',
  'assert',
  'break',
  'class',
  'continue',
  'def',
  'elif',
  'else',
  'except',
  'False',
  'finally',
  'for',
  'from',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'None',
  'not',
  'or',
  'pass',
  'return',
  'True',
  'try',
  'while',
  'with',
  'yield',
]);

const pythonBuiltins = new Set([
  'bool',
  'dict',
  'enumerate',
  'float',
  'int',
  'len',
  'list',
  'map',
  'max',
  'min',
  'print',
  'range',
  'round',
  'set',
  'str',
  'sum',
  'tuple',
]);

const pythonTokenPattern = /(#.*$|(['"])(?:\\.|(?!\2).)*\2|\b[A-Za-z_]\w*(?=\s*\()|\b[A-Za-z_]\w*\b|\b\d+(?:\.\d+)?\b|[()[\]{}.,:;=+\-*/%<>!]+)/g;

function HighlightedPythonCode({ code, fullscreen }: { code: string; fullscreen: boolean }) {
  return (
    <Text style={[styles.codeHighlightText, fullscreen && styles.codeHighlightTextFullscreen]}>
      {code.split('\n').map((line, lineIndex, lines) => (
        <Text key={`code-highlight-line-${lineIndex}`}>
          {tokenizePythonLine(line).map((token, tokenIndex) => (
            <Text key={`code-token-${lineIndex}-${tokenIndex}`} style={getCodeTokenStyle(token.tone)}>
              {token.text}
            </Text>
          ))}
          {lineIndex < lines.length - 1 ? '\n' : null}
        </Text>
      ))}
    </Text>
  );
}

function tokenizePythonLine(line: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let cursor = 0;
  const matches = line.matchAll(pythonTokenPattern);

  for (const match of matches) {
    const text = match[0];
    const index = match.index ?? 0;
    if (index > cursor) {
      tokens.push({ text: line.slice(cursor, index), tone: 'plain' });
    }
    tokens.push({ text, tone: getPythonTokenTone(text) });
    cursor = index + text.length;
  }

  if (cursor < line.length) {
    tokens.push({ text: line.slice(cursor), tone: 'plain' });
  }

  return tokens.length ? tokens : [{ text: ' ', tone: 'plain' }];
}

function getPythonTokenTone(token: string): CodeToken['tone'] {
  if (token.startsWith('#')) return 'comment';
  if (/^(['"])/.test(token)) return 'string';
  if (/^\d/.test(token)) return 'number';
  if (pythonKeywords.has(token)) return 'keyword';
  if (pythonBuiltins.has(token)) return 'builtin';
  if (/^[()[\]{}.,:;=+\-*/%<>!]+$/.test(token)) return 'operator';
  if (/^[A-Za-z_]\w*$/.test(token)) return 'function';
  return 'plain';
}

function getCodeTokenStyle(tone: CodeToken['tone']) {
  if (tone === 'keyword') return styles.codeTokenKeyword;
  if (tone === 'builtin') return styles.codeTokenBuiltin;
  if (tone === 'string') return styles.codeTokenString;
  if (tone === 'number') return styles.codeTokenNumber;
  if (tone === 'comment') return styles.codeTokenComment;
  if (tone === 'operator') return styles.codeTokenOperator;
  if (tone === 'function') return styles.codeTokenFunction;
  return styles.codeTokenPlain;
}

function LessonSegmentedProgress({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.lessonSegmentRow}>
      {Array.from({ length: total }).map((_, index) => (
        <View key={index} style={[styles.lessonSegment, index < current && styles.lessonSegmentActive]} />
      ))}
    </View>
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
  useTheme();
  const { celebrate } = useCelebrations();
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
      const eventType = nextLesson ? 'lesson_completed' : 'course_completed';
      await celebrate({
        type: eventType,
        title: nextLesson ? 'Ders tamamlandı' : 'Kurs tamamlandı',
        body: `${selectedLesson.title} akışını %${result.scorePercent} quiz başarısıyla tamamladın.`,
        assetKey: 'achievement',
        dedupeKey: `${eventType}-${selectedLesson.slug}-${result.submittedAt}`,
        targetRoute: nextLesson ? `/lesson-player?lesson=${encodeURIComponent(nextLesson.slug)}` : '/paths',
      });
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
        <ThemedStatusBar />
        <Header title="Ders kilitli" back backFallback={courseDetailRoute} />
        <Card style={styles.lockedLessonCard}>
          <Lock size={34} color={colors.muted} />
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
      <ThemedStatusBar />
      <Header title={selectedCourse?.title ?? 'Ders'} back backFallback={courseDetailRoute} right={<Pressable onPress={() => toggleBookmark('lesson', selectedLesson.id)}><Bookmark size={22} color={colors.ink} /></Pressable>} />
      <View style={styles.lessonProgressBlock}>
        <View style={styles.lessonStepHeader}>
          <Text style={styles.lessonStepCount}>Adım {displayedStep} <Text style={styles.lessonStepSlash}>/ {totalSteps}</Text></Text>
          <Text style={styles.lessonStepLabel}>{isQuizStep ? `Quiz • Soru ${quizQuestionIndex + 1}/${quizQuestionCount}` : getLearningStepLabel(activeStep.kind)}</Text>
        </View>
        <LessonSegmentedProgress total={totalSteps} current={displayedStep} />
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
      <View style={styles.lessonActionRow}>
        <OutlineButton
          title={isQuizStep && !quizResult && quizQuestionIndex > 0 ? 'Önceki Soru' : stepIndex > 0 ? 'Önceki' : 'Not Al'}
          icon={!isQuizStep && stepIndex === 0 ? <BookOpen size={24} color="#f97316" strokeWidth={2.5} /> : undefined}
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
          style={[styles.rowButton, !isQuizStep && stepIndex === 0 && styles.lessonNoteButton]}
          textStyle={!isQuizStep && stepIndex === 0 ? styles.lessonNoteButtonText : undefined}
        />
        {!isQuizStep ? (
          <PrimaryButton title={stepIndex === learningSteps.length - 1 ? "Quiz'e Geç" : 'Devam'} onPress={() => goToStep(stepIndex + 1)} icon={<ChevronRight size={28} color={colors.surface} strokeWidth={2.6} />} style={[styles.rowButton, styles.lessonContinueButton]} />
        ) : quizResult?.passed ? (
          <PrimaryButton title={nextLesson ? 'Sonraki Derse Geç' : 'Dersi Tamamla'} onPress={continueAfterPassedQuiz} icon={<ChevronRight size={24} color={colors.surface} />} style={[styles.rowButton, styles.lessonContinueButton]} />
        ) : quizResult ? (
          <PrimaryButton title="Yeniden Dene" onPress={retryQuiz} style={[styles.rowButton, styles.lessonContinueButton]} />
        ) : !isLastQuizQuestion ? (
          <PrimaryButton title={currentQuizAnswered ? 'Sonraki Soru' : 'Cevap Seç'} onPress={goToNextQuizQuestion} icon={<ChevronRight size={24} color={colors.surface} />} style={[styles.rowButton, styles.lessonContinueButton]} />
        ) : (
          <PrimaryButton title="Quiz'i Kontrol Et" onPress={submitLessonQuiz} style={[styles.rowButton, styles.lessonContinueButton]} />
        )}
      </View>
      {isQuizStep && quizResult && !quizResult.passed ? <OutlineButton title="Tekrar Çalış" onPress={studyAgain} /> : null}
    </Screen>
  );
}

export function ReadingScreen() {
  useTheme();
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
  useTheme();
  const { celebrate } = useCelebrations();
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
          await celebrate({
            type: 'lab_completed',
            title: 'Lab tamamlandı',
            body: `${lab.title} uygulamasını başarıyla çalıştırdın.`,
            assetKey: 'achievement',
            dedupeKey: `lab-completed-${lab.id ?? selectedLabSlug ?? lab.title}`,
            targetRoute: selectedLessonSlug ? `/lesson-player?lesson=${encodeURIComponent(selectedLessonSlug)}` : '/paths',
          });
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
  useTheme();
  const { celebrate } = useCelebrations();
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
          if (result.isCorrect) {
            await celebrate({
              type: 'quiz_correct',
              title: 'Quiz doğru cevaplandı',
              body: 'Doğru cevapla XP ilerlemesine katkı sağladın.',
              assetKey: 'quiz-champion',
              badgeSlug: 'quiz-champion',
              dedupeKey: `quiz-correct-${quiz.id ?? quiz.title}`,
              targetRoute: '/progress',
            });
          }
        }} style={styles.rowButton} />
      </View>
    </Screen>
  );
}

export function NotesScreen() {
  useTheme();
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
        <TextInput value={draft} onChangeText={setDraft} placeholder="Yeni not yaz..." placeholderTextColor={colors.muted} style={styles.searchInput} />
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
  useTheme();
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
  useTheme();
  const activity = [
    { label: 'Pzt', value: 72 },
    { label: 'Sal', value: 82 },
    { label: 'Çar', value: 98, active: true },
    { label: 'Per', value: 77 },
    { label: 'Cum', value: 60 },
    { label: 'Cmt', value: 48 },
    { label: 'Paz', value: 34 },
  ];

  return (
    <Screen bottomTab="progress" contentStyle={styles.progressScreenContent}>
      <View style={styles.progressTopBar}>
        <Text style={styles.progressPageTitle}>İlerleme</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Takvim" style={({ pressed }) => [styles.progressCalendarButton, pressed && styles.pressed]}>
          <Calendar size={29} color={colors.ink} strokeWidth={2.3} />
        </Pressable>
      </View>

      <LinearGradient colors={['#151a1f', '#0f1419', '#111820']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.progressHeroPanel}>
        <View style={styles.progressHeroBody}>
          <View style={styles.progressHeroCopy}>
            <Text style={styles.progressKicker}>HAFTALIK HEDEF</Text>
            <Text style={styles.progressHeroTitle}>Orta rota{"\n"}ilerliyor</Text>
            <View style={styles.progressGainPill}>
              <TrendingUp size={19} color="#97efb1" strokeWidth={2.8} />
              <Text style={styles.progressGainText}>+18%</Text>
            </View>
          </View>
          <ProgressHeroRing progress={68} />
        </View>
        <View style={styles.progressHeroDivider} />
        <View style={styles.progressHeroStats}>
          <ProgressHeroStat icon={Zap} label="Bu Hafta" value="645 XP" />
          <View style={styles.progressStatDivider} />
          <ProgressHeroStat icon={Star} label="Toplam XP" value="1.250" />
          <View style={styles.progressStatDivider} />
          <ProgressHeroStat icon={BookOpen} label="Ders" value="24 / 42" />
        </View>
      </LinearGradient>

      <Card style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.progressCardTitle}>Haftalık Aktivite</Text>
            <Text style={styles.progressMuted}>En güçlü günün Çarşamba. Bugün 1 kısa dersle seriyi koru.</Text>
          </View>
          <View style={styles.activityIconButton}>
            <BarChart3 size={25} color={colors.ink} strokeWidth={2.8} />
          </View>
        </View>
        <View style={styles.barChart}>
          <View style={styles.chartGuide} />
          {activity.map((item) => (
            <View key={item.label} style={styles.barWrap}>
              <View style={[styles.bar, item.active && styles.barActive, { height: item.value }]} />
              <Text style={[styles.barLabel, item.active && styles.barLabelActive]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </Card>
      <View style={styles.progressSummaryRow}>
        <ProgressSummaryCard icon={Flame} title="Seri Devam Ediyor!" subtitle="7 gün üst üste" active />
        <ProgressSummaryCard icon={CircleHelp} title="Çözülen Quiz" subtitle="37 soru" />
      </View>
      <Card style={styles.nextMilestoneCard}>
        <View style={styles.milestoneIcon}>
          <Target size={40} color={colors.ink} strokeWidth={2.5} />
        </View>
        <View style={styles.milestoneBody}>
          <View style={styles.milestoneTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.progressCardTitle}>Sıradaki kilometre taşı</Text>
              <Text style={styles.progressMuted}>Neural Networks 101 kursunda 3 ders daha tamamla ve Model Değerlendirme modülü açılsın.</Text>
            </View>
            <View style={styles.milestoneBadge}>
              <Award size={22} color={colors.ink} strokeWidth={2.5} />
            </View>
          </View>
          <View style={styles.milestoneProgressRow}>
            <Text style={styles.milestoneLessonText}>3 / 6 ders</Text>
            <View style={styles.milestoneTrack}>
              <View style={styles.milestoneFill} />
            </View>
            <Text style={styles.milestonePercent}>%50</Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { preference, setPreference, themeName } = useThemePreference();
  const { refreshCelebrations } = useCelebrations();
  const displayName = getDisplayName(user);
  const profileInitial = displayName.trim().charAt(0).toLocaleUpperCase('tr-TR') || 'A';
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const themeLabel = getThemePreferenceLabel(preference);
  const profileStats = [
    { icon: BookOpen, value: '24', label: 'Ders', sublabel: 'Tamamlanan', tone: colors.primary, softTone: colors.primarySoft },
    { icon: Award, value: '3', label: 'Rozet', sublabel: 'Kazanılan', tone: colors.purple, softTone: colors.purpleSoft },
    { icon: Bookmark, value: '1', label: 'Sertifika', sublabel: 'Elde edilen', tone: colors.green, softTone: colors.greenSoft },
  ];
  const profileBadges = academyBadges.filter((badge) => badge.earned).slice(0, 3);
  const settingsItems = [
    { title: 'Avatar Oluştur', icon: User, onPress: () => router.push('/avatar') },
    { title: 'Tema', icon: preference === 'system' ? Monitor : themeName === 'dark' ? Moon : Sun, value: themeLabel, onPress: () => setThemeModalVisible(true) },
    { title: 'Bildirimler', icon: FileText },
    { title: 'Dil', icon: Globe2 },
    { title: 'Gizlilik', icon: Lock },
    { title: 'Destek', icon: Headphones },
  ];

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      refreshCelebrations().catch(() => undefined);
      getSavedAvatarConfig().then((savedConfig) => {
        if (mounted) setAvatarUrl(savedConfig ? buildDiceBearAvatarUrl(savedConfig, 128) : null);
      });
      return () => {
        mounted = false;
      };
    }, [refreshCelebrations])
  );

  return (
    <Screen bottomTab="profile" contentStyle={styles.profileScreenContent}>
      <LinearGradient colors={['#050505', '#111111', '#1f1f22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profileHero}>
        <ProfileHeroPattern />
        <Pressable accessibilityRole="button" accessibilityLabel="Avatar oluştur" onPress={() => router.push('/avatar')} style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
          {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.profileAvatarImage} resizeMode="cover" /> : <Text style={styles.profileAvatarText}>{profileInitial}</Text>}
        </Pressable>
        <View style={styles.profileHeroBody}>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileMeta}>AI Learner • Orta Seviye</Text>
          <View style={styles.profileProgressTrack}>
            <View style={styles.profileProgressFill} />
          </View>
          <Text style={styles.profileXp}><Text style={styles.profileXpStrong}>XP 1.250</Text> / 2.000</Text>
        </View>
        <View style={styles.profileLevelPill}>
          <Text style={styles.profileLevelText}>Lv. 4</Text>
        </View>
      </LinearGradient>

      <View style={styles.profileStatsPanel}>
        {profileStats.map((stat, index) => (
          <ProfileStatItem key={stat.label} {...stat} showDivider={index < profileStats.length - 1} />
        ))}
      </View>

      <View style={styles.profileBadgePanel}>
        <View style={styles.profileSectionHeader}>
          <Text style={styles.profileSectionTitle}>Kazanılan Rozetler</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/badges')} style={({ pressed }) => [styles.profileSeeAll, pressed && styles.pressed]}>
            <Text style={styles.profileSeeAllText}>Tümünü Gör</Text>
            <ChevronRight size={22} color={colors.primary} strokeWidth={3} />
          </Pressable>
        </View>
        <View style={styles.badgeRow}>
          {profileBadges.map((badge) => (
            <ProfileBadgeCard key={badge.id} badge={badge} />
          ))}
        </View>
      </View>

      <View style={styles.profileSettingsStack}>
        {settingsItems.map((item) => (
          <ProfileSettingsRow key={item.title} title={item.title} icon={item.icon} value={item.value} onPress={item.onPress} />
        ))}
      </View>

      <Pressable accessibilityRole="button" onPress={signOut} style={({ pressed }) => [styles.profileLogoutButton, pressed && styles.pressed]}>
        <LogOut size={26} color={colors.primary} strokeWidth={2.6} />
        <Text style={styles.profileLogoutText}>Çıkış Yap</Text>
      </Pressable>
      <ThemePreferenceModal
        visible={themeModalVisible}
        selected={preference}
        resolvedTheme={themeName}
        onClose={() => setThemeModalVisible(false)}
        onSelect={setPreference}
      />
    </Screen>
  );
}

export function BadgeCollectionScreen() {
  useTheme();
  const { refreshCelebrations } = useCelebrations();
  const earnedCount = academyBadges.filter((badge) => badge.earned).length;

  useFocusEffect(
    useCallback(() => {
      refreshCelebrations().catch(() => undefined);
    }, [refreshCelebrations])
  );

  return (
    <Screen contentStyle={styles.badgesScreenContent}>
      <Header title="Rozetler" subtitle={`${earnedCount} / ${academyBadges.length} kazanıldı`} back backFallback="/profile" />
      <View style={styles.badgesHeroCard}>
        <View>
          <Text style={styles.badgesHeroKicker}>Koleksiyon</Text>
          <Text style={styles.badgesHeroTitle}>Tüm Başarı Rozetleri</Text>
        </View>
        <View style={styles.badgesHeroCount}>
          <Text style={styles.badgesHeroCountText}>{earnedCount}</Text>
          <Text style={styles.badgesHeroCountLabel}>Kazanılan</Text>
        </View>
      </View>
      <View style={styles.badgesGrid}>
        {academyBadges.map((badge) => (
          <BadgeCollectionCard key={badge.id} badge={badge} />
        ))}
      </View>
    </Screen>
  );
}

function BadgeCollectionCard({ badge }: { badge: AcademyBadge }) {
  return (
    <View style={[styles.badgeCollectionCard, !badge.earned && styles.badgeCollectionCardLocked]}>
      <View style={styles.badgeCollectionImageWrap}>
        <Image source={getBadgeAssetSource(badge.id)} style={[styles.badgeCollectionImage, !badge.earned && styles.badgeCollectionImageLocked]} resizeMode="contain" />
      </View>
      <Text style={styles.badgeCollectionTitle}>{badge.title}</Text>
      <Text style={styles.badgeCollectionDescription}>{badge.earned ? badge.description : badge.requirement}</Text>
      <View style={[styles.badgeStatusPill, !badge.earned && styles.badgeStatusPillLocked]}>
        <Text style={[styles.badgeStatusText, !badge.earned && styles.badgeStatusTextLocked]}>{badge.earned ? 'Kazanıldı' : 'Kilitli'}</Text>
      </View>
    </View>
  );
}

function getThemePreferenceLabel(preference: ThemePreference) {
  if (preference === 'light') return 'Açık';
  if (preference === 'dark') return 'Koyu';
  return 'Sistem';
}

function ProfileHeroPattern() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 360 132" style={StyleSheet.absoluteFill}>
      <Path d="M7 14 C76 62, 154 55, 202 -9" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
      <Path d="M170 114 C238 57, 263 24, 354 52" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
      <Path d="M220 94 C266 34, 294 15, 357 24" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="2" />
      <Circle cx="262" cy="34" r="6" fill="rgba(255,255,255,0.025)" />
      <Circle cx="312" cy="94" r="32" fill="rgba(255,255,255,0.04)" />
    </Svg>
  );
}

function ProfileStatItem({
  icon: Icon,
  value,
  label,
  sublabel,
  tone,
  softTone,
  showDivider,
}: {
  icon: ScreenIcon;
  value: string;
  label: string;
  sublabel: string;
  tone: string;
  softTone: string;
  showDivider: boolean;
}) {
  return (
    <View style={styles.profileStatItem}>
      <View style={[styles.profileStatIcon, { backgroundColor: softTone }]}>
        <Icon size={24} color={tone} strokeWidth={2.8} />
      </View>
      <View style={styles.profileStatText}>
        <Text style={styles.profileStatValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{value}</Text>
        <Text style={styles.profileStatLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>{label}</Text>
        <Text style={styles.profileStatSublabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82}>{sublabel}</Text>
      </View>
      {showDivider ? <View style={styles.profileStatDivider} /> : null}
    </View>
  );
}

function ProfileBadgeCard({ badge }: { badge: AcademyBadge }) {
  return (
    <View style={styles.badgeMini}>
      <View style={styles.badgeTrophyWrap}>
        <Image source={getBadgeAssetSource(badge.id)} style={styles.badgeAssetImage} resizeMode="contain" />
      </View>
      <Text style={styles.badgeText}>{badge.shortTitle}</Text>
    </View>
  );
}

function ProfileSettingsRow({ title, icon: Icon, value, onPress }: { title: string; icon: ScreenIcon; value?: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}>
      <View style={styles.settingsIconBubble}>
        <Icon size={27} color={colors.primary} strokeWidth={2.5} />
      </View>
      <Text style={styles.settingsTitle}>{title}</Text>
      {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
      <ChevronRight size={26} color={colors.muted} strokeWidth={2.7} />
    </Pressable>
  );
}

function ThemePreferenceModal({
  visible,
  selected,
  resolvedTheme,
  onClose,
  onSelect,
}: {
  visible: boolean;
  selected: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  onClose: () => void;
  onSelect: (preference: ThemePreference) => Promise<void>;
}) {
  const options: { key: ThemePreference; label: string; description: string; icon: ScreenIcon }[] = [
    { key: 'system', label: 'Sistem', description: 'Cihaz tema ayarını takip eder', icon: Monitor },
    { key: 'light', label: 'Açık', description: 'Aydınlık nötr arayüz', icon: Sun },
    { key: 'dark', label: 'Koyu', description: 'Siyah tonlu koyu arayüz', icon: Moon },
  ];

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.themeModalBackdrop}>
        <Pressable accessibilityRole="button" accessibilityLabel="Tema penceresini kapat" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={styles.themeModalCard}>
          <View style={styles.themeModalHeader}>
            <View>
              <Text style={styles.themeModalTitle}>Tema</Text>
              <Text style={styles.themeModalSubtitle}>Aktif görünüm: {resolvedTheme === 'dark' ? 'Koyu' : 'Açık'}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.themeModalClose, pressed && styles.pressed]}>
              <ChevronRight size={24} color={colors.ink} strokeWidth={2.7} />
            </Pressable>
          </View>
          <View style={styles.themeOptionStack}>
            {options.map((option) => {
              const Icon = option.icon;
              const isSelected = selected === option.key;
              return (
                <Pressable
                  key={option.key}
                  accessibilityRole="button"
                  onPress={() => onSelect(option.key)}
                  style={({ pressed }) => [styles.themeOptionRow, isSelected && styles.themeOptionRowActive, pressed && styles.pressed]}
                >
                  <View style={[styles.themeOptionIcon, isSelected && styles.themeOptionIconActive]}>
                    <Icon size={22} color={isSelected ? colors.surface : colors.primary} strokeWidth={2.5} />
                  </View>
                  <View style={styles.themeOptionCopy}>
                    <Text style={styles.themeOptionTitle}>{option.label}</Text>
                    <Text style={styles.themeOptionDescription}>{option.description}</Text>
                  </View>
                  {isSelected ? (
                    <View style={styles.themeOptionCheck}>
                      <Check size={16} color={colors.surface} strokeWidth={3} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function CertificateScreen() {
  useTheme();
  const { celebrate } = useCelebrations();
  const { data: courses } = useAsyncData<CourseCard[]>(getCourseCatalog, []);
  const [message, setMessage] = useState<string | null>(null);
  return (
    <Screen>
      <ThemedStatusBar />
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
        await celebrate({
          type: 'certificate_earned',
          title: 'Sertifika kazanıldı',
          body: `${courses[0]?.title ?? 'Kurs'} sertifikan başarıyla oluşturuldu.`,
          assetKey: 'achievement',
          dedupeKey: `certificate-${courses[0]?.id ?? courses[0]?.slug ?? 'demo'}`,
          targetRoute: '/certificate',
        });
      }} />
      <View style={{ height: 10 }} />
      <OutlineButton title="Paylas" icon={<Download size={18} color={colors.primary} />} />
    </Screen>
  );
}

export function LeagueScreen() {
  useTheme();
  const { refreshCelebrations } = useCelebrations();
  return (
    <Screen bottomTab="league">
      <Header
        title="Haftalık Lig"
        right={
          <Pressable accessibilityRole="button" accessibilityLabel="Lig başarı bildirimlerini yenile" onPress={() => refreshCelebrations()} style={({ pressed }) => [styles.leagueBellWrap, pressed && styles.pressed]}>
            <Bell size={27} color={colors.ink} strokeWidth={2.4} />
            <View style={styles.leagueBellDot} />
          </Pressable>
        }
      />
      <View style={styles.leagueHero}>
        <View style={styles.leagueHeroCopy}>
          <View style={styles.leaguePill}>
            <View style={styles.leaguePillIcon}>
              <Trophy size={18} color={colors.surface} strokeWidth={2.7} />
            </View>
            <Text style={styles.leaguePillText}>ALTIN LİG</Text>
          </View>
          <Text style={styles.leagueTitle}>Altın Lig</Text>
          <Text style={styles.leagueRank}>Sıralamam: <Text style={styles.leagueRankStrong}>#12</Text></Text>
          <Text style={styles.leaguePoints}>1.840</Text>
        </View>
        <View style={styles.leagueBadgeStage}>
          <Image source={leagueBadgeAssets.gold} style={styles.leagueBadgeImage} resizeMode="contain" />
        </View>
        <View style={styles.leagueProgressTrack}>
          <View style={styles.leagueProgressFill} />
          <View style={styles.leagueProgressMarker}><Star size={12} color={colors.surface} fill={colors.surface} /></View>
        </View>
        <Text style={styles.leagueRemaining}>Terfi için <Text style={styles.leagueRemainingStrong}>260</Text> puan kaldı</Text>
      </View>
      <View style={styles.leagueStatsBand}>
        <LeagueStat icon={BarChart3} value="+420" label="Bu Hafta" />
        <View style={styles.leagueStatDivider} />
        <LeagueStat icon={Flame} value="5" label="Galibiyet Serisi" />
        <View style={styles.leagueStatDivider} />
        <LeagueStat icon={BookOpen} value="9" label="Tamamlanan Ders" />
      </View>
      <View style={styles.leagueStatusHeader}>
        <Text style={styles.leagueStatusTitle}>Lig Durumu</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/league-detail')} style={({ pressed }) => [styles.leagueDetailsLink, pressed && styles.pressed]}>
          <Text style={styles.leagueDetailsText}>Detayları Gör</Text>
          <ChevronRight size={22} color={colors.primary} strokeWidth={2.5} />
        </Pressable>
      </View>
      <View style={styles.leagueStatusCard}>
        {leagueLeaderboard.map((player, index) => (
          <LeagueLeaderboardRow key={player.rank} player={player} isLast={index === leagueLeaderboard.length - 1} />
        ))}
      </View>
    </Screen>
  );
}

export function LeaderboardScreen() {
  useTheme();
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
  useTheme();
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
  useTheme();
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
  useTheme();
  const { celebrate } = useCelebrations();
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
      <PrimaryButton title="Odul Detaylari" onPress={() => celebrate({
        type: 'season_reward',
        title: 'Sezon ödülü hazır',
        body: 'Altın Lig hedefin için sezon ödül tahmini hazırlandı.',
        assetKey: 'gold',
        nextTier: 'gold',
        points: 250,
        dedupeKey: 'season-reward-preview-gold-top-10',
        targetRoute: '/rewards',
      })} />
    </Screen>
  );
}

export function SeasonsScreen() {
  useTheme();
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

function DashboardHeader({ displayName, avatarUrl }: { displayName: string; avatarUrl: string | null }) {
  const initial = displayName.trim().charAt(0).toLocaleUpperCase('tr-TR') || 'A';
  return (
    <View style={styles.dashboardHeader}>
      <Pressable accessibilityRole="button" onPress={() => router.push('/profile')} style={({ pressed }) => [styles.dashboardHeaderProfileLink, pressed && styles.pressed]}>
        <View style={styles.dashboardAvatarWrap}>
          {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.dashboardAvatarImage} resizeMode="cover" /> : <Text style={styles.dashboardAvatarInitial}>{initial}</Text>}
        </View>
        <View style={styles.dashboardHeaderText}>
          <Text style={styles.dashboardGreeting}>Merhaba {displayName}</Text>
          <Text style={styles.dashboardSubtitle}>Bugün yeni bir şey öğrenmeye hazır mısın?</Text>
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Bildirimler" style={({ pressed }) => [styles.dashboardBellButton, pressed && styles.pressed]}>
        <Bell size={28} color={colors.ink} strokeWidth={2.4} />
        <View style={styles.notificationDot} />
      </Pressable>
    </View>
  );
}

function DashboardLevelCard() {
  return (
    <LinearGradient colors={['#050505', '#111111', '#1f1f22']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dashboardLevelCard}>
      <Svg width="100%" height="100%" viewBox="0 0 360 230" style={StyleSheet.absoluteFill}>
        {[0, 1, 2, 3, 4].map((index) => (
          <Path
            key={index}
            d={`M96 ${128 + index * 7} C158 ${136 + index * 3}, 202 ${108 - index}, 240 ${36 + index * 8} S306 ${118 + index * 3}, 370 ${74 + index * 7}`}
            fill="none"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="1.2"
          />
        ))}
        {[86, 128, 174, 238, 286, 322].map((cx, index) => (
          <Circle key={cx} cx={cx} cy={92 + (index % 3) * 22} r="1.7" fill="rgba(255,255,255,0.42)" />
        ))}
      </Svg>
      <View style={styles.dashboardLevelTop}>
        <View style={styles.levelBadgeIcon}>
          <BarChart3 size={36} color="#f5f5f5" strokeWidth={2.4} />
        </View>
        <Text style={styles.levelHeroTitle}>Seviyen: Orta</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/profile')} style={styles.profileButton}>
          <Text style={styles.profileButtonText}>Profili Gör</Text>
          <ChevronRight size={19} color="#ffffff" strokeWidth={3} />
        </Pressable>
      </View>
      <Text style={styles.levelProgressLabel}>Toplam İlerleme</Text>
      <View style={styles.levelMetricRow}>
        <Text style={styles.levelPercent}>%45</Text>
        <Text style={styles.levelXp}>XP 1.250</Text>
      </View>
      <ProgressBar value={45} color={colors.green} />
      <View style={styles.levelFooterRow}>
        <Text style={styles.levelCompleteText}><Text style={styles.levelCompleteStrong}>45%</Text> tamamlandı</Text>
        <Text style={styles.levelNextText}>Sonraki seviye için 1.530 XP</Text>
      </View>
    </LinearGradient>
  );
}

function DashboardStatsPanel() {
  return (
    <LinearGradient colors={[colors.surface, colors.surfaceSoft]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dashboardStatsPanel}>
      <View style={styles.dashboardStatsRow}>
        <DashboardStatTile kind="streak" label="Günlük Seri" value="7" tone={colors.red} softTone={colors.redSoft} />
        <View style={styles.dashboardStatDivider} />
        <DashboardStatTile kind="lessons" label="Ders Tamamlandı" value="24" tone={colors.green} softTone={colors.greenSoft} />
        <View style={styles.dashboardStatDivider} />
        <DashboardStatTile kind="badges" label="Rozet Kazanıldı" value="3" tone={colors.amber} softTone={colors.amberSoft} />
      </View>
    </LinearGradient>
  );
}

type DashboardStatKind = 'streak' | 'lessons' | 'badges';

function DashboardStatGlyph({ kind, tone, softTone }: { kind: DashboardStatKind; tone: string; softTone: string }) {
  return (
    <LinearGradient colors={[softTone, colors.surface]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dashboardStatIcon}>
      <Svg width={30} height={30} viewBox="0 0 30 30">
        <Circle cx="15" cy="15" r="12.5" fill="none" stroke={tone} strokeOpacity="0.18" strokeWidth="1.4" />
        {kind === 'streak' ? (
          <>
            <Path d="M16.3 4.9C15.2 9.2 20.5 10.8 19.2 16.1C18.4 19.5 15.7 21.4 12.4 21.1C9.6 20.8 7.5 18.7 7.6 15.7C7.7 13.3 9.1 11.7 11.1 10.5C10.6 13.6 12.4 15 14.2 15.3C16.5 15.7 17.8 13.9 16.7 11.8C16.1 10.6 15.3 9.6 15.4 8.2C15.4 6.9 15.7 5.8 16.3 4.9Z" fill="none" stroke={tone} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M12.8 22.3C16.3 23 20.6 21.3 21.9 17.1" fill="none" stroke={tone} strokeOpacity="0.55" strokeWidth="1.7" strokeLinecap="round" />
          </>
        ) : null}
        {kind === 'lessons' ? (
          <>
            <Path d="M8 15.7L12.3 20L22.1 9.8" fill="none" stroke={tone} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M7.8 8.6H14.5" fill="none" stroke={tone} strokeOpacity="0.45" strokeWidth="1.8" strokeLinecap="round" />
          </>
        ) : null}
        {kind === 'badges' ? (
          <>
            <Path d="M15 6.1L17.6 11.4L23.4 12.2L19.2 16.3L20.2 22.1L15 19.4L9.8 22.1L10.8 16.3L6.6 12.2L12.4 11.4L15 6.1Z" fill="none" stroke={tone} strokeWidth="2.1" strokeLinejoin="round" />
            <Circle cx="15" cy="15.1" r="2.2" fill={tone} opacity="0.18" />
          </>
        ) : null}
      </Svg>
    </LinearGradient>
  );
}

function DashboardStatTile({
  kind,
  label,
  value,
  tone,
  softTone,
}: {
  kind: DashboardStatKind;
  label: string;
  value: string;
  tone: string;
  softTone: string;
}) {
  return (
    <View style={styles.dashboardStatTile}>
      <DashboardStatGlyph kind={kind} tone={tone} softTone={softTone} />
      <Text style={styles.dashboardStatValue}>{value}</Text>
      <Text style={styles.dashboardStatLabel}>{label}</Text>
    </View>
  );
}

function DashboardCourseRecommendation({ course }: { course: CourseCard }) {
  return (
    <View style={styles.dashboardCourseCard}>
      <View style={styles.dashboardCourseMain}>
        <DashboardCourseArt />
        <View style={styles.dashboardCourseContent}>
          <Text style={styles.dashboardCourseTitle}>{course.title}</Text>
          <Text style={styles.dashboardCourseSubtitle}>{course.subtitle || 'AI projeleri için Python çalışma akışı'}</Text>
        </View>
      </View>
      <View style={styles.dashboardCourseFooter}>
        <View style={styles.dashboardCoursePill}>
          <Clock3 size={16} color={colors.primary} strokeWidth={2.5} />
          <Text style={styles.dashboardCoursePillText}>{course.duration}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/course-detail', params: { course: course.slug } })}
          style={({ pressed }) => [styles.dashboardContinueButton, pressed && styles.pressed]}
        >
          <Text style={styles.dashboardContinueText}>Devam Et</Text>
          <View style={styles.dashboardContinueIcon}>
            <ChevronRight size={17} color={colors.surface} strokeWidth={3} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function DashboardCourseArt() {
  return (
    <LinearGradient colors={['#050505', '#3f3f46']} style={styles.dashboardCourseArt}>
      <Svg width="100%" height="100%" viewBox="0 0 92 92" style={StyleSheet.absoluteFill}>
        {[18, 30, 46, 62, 74].map((x) => (
          <Line key={x} x1={x} y1="22" x2={x} y2="56" stroke="rgba(255,255,255,0.32)" strokeWidth="1" />
        ))}
        <Path d="M17 65 C31 58, 43 62, 51 74 C39 72, 27 74, 17 77 Z" fill="rgba(255,255,255,0.68)" />
        <Path d="M52 74 C59 62, 72 58, 84 65 L84 77 C74 74, 62 72, 52 74 Z" fill="rgba(255,255,255,0.54)" />
        <Path d="M28 44 C27 27, 38 24, 49 33 C58 25, 70 28, 69 44 C68 59, 54 58, 50 49 C45 59, 29 59, 28 44 Z" fill="none" stroke="#f5f5f5" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="39" cy="39" r="2" fill="#f5f5f5" />
        <Circle cx="59" cy="54" r="2" fill="#f5f5f5" />
      </Svg>
    </LinearGradient>
  );
}

function DashboardGoalCard() {
  return (
    <View style={styles.dashboardGoalCard}>
      <View style={styles.goalTargetIcon}>
        <Target size={45} color={colors.green} strokeWidth={2.6} />
      </View>
      <View style={styles.dashboardGoalContent}>
        <Text style={styles.dashboardGoalTitle}>Bugünkü Hedef</Text>
        <Text style={styles.dashboardGoalText}>1 dersi tamamla ve 10 soru çöz.</Text>
        <ProgressBar value={60} color={colors.green} />
        <Text style={styles.dashboardGoalProgress}>60% tamamlandı</Text>
      </View>
      <View style={styles.goalCheckIcon}>
        <Check size={25} color={colors.surface} strokeWidth={3.2} />
      </View>
    </View>
  );
}

type PathsPalette = {
  page: string;
  surface: string;
  elevated: string;
  activeSurface: string;
  text: string;
  muted: string;
  border: string;
  activeBorder: string;
  line: string;
  accent: string;
  accentSoft: string;
  iconSoft: string;
  button: string;
  track: string;
};

function getPathsPalette(isDark: boolean): PathsPalette {
  return isDark
    ? {
      page: '#101114',
      surface: '#171a20',
      elevated: '#1c2027',
      activeSurface: '#13241d',
      text: '#f7f9fb',
      muted: '#b8c0ca',
      border: '#303743',
      activeBorder: '#21b573',
      line: '#3a414c',
      accent: '#39d98a',
      accentSoft: '#163426',
      iconSoft: '#242a32',
      button: '#181c22',
      track: '#303640',
    }
    : {
      page: colors.surface,
      surface: colors.surface,
      elevated: colors.surface,
      activeSurface: '#f1fff7',
      text: '#05080b',
      muted: '#5d6470',
      border: colors.line,
      activeBorder: colors.green,
      line: colors.line,
      accent: colors.green,
      accentSoft: colors.greenSoft,
      iconSoft: '#f4f5f6',
      button: colors.surface,
      track: colors.line,
    };
}

function LearningPathOverviewCard({ totalLessons, totalHours, compact, palette }: { totalLessons: number; totalHours: number; compact: boolean; palette: PathsPalette }) {
  return (
    <LinearGradient colors={['#151a1f', '#0f1419', '#111820']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.pathOverviewCard, compact && styles.pathOverviewCardCompact]}>
      <View style={styles.pathOverviewMainRow}>
        <View style={styles.pathOverviewBody}>
          <Text style={styles.pathOverviewKicker}>ÖĞRENME ROTASI</Text>
          <Text style={[styles.pathOverviewTitle, compact && styles.pathOverviewTitleCompact]}>Yolculuğun Başladı</Text>
          <Text style={[styles.pathOverviewText, compact && styles.pathOverviewTextCompact]}>4 aşamalı öğrenme yolunda ilk adımı tamamla.</Text>
          <View style={[styles.pathOverviewProgress, compact && styles.pathOverviewProgressCompact]}>
            <View style={styles.pathOverviewProgressFill} />
          </View>
        </View>
        <View style={[styles.pathOverviewRing, compact && styles.pathOverviewRingCompact]}>
          <Svg width={compact ? 118 : 132} height={compact ? 118 : 132} viewBox="0 0 132 132">
            <Circle cx="66" cy="66" r="52" stroke="rgba(255,255,255,0.13)" strokeWidth="13" fill="none" />
            <Circle
              cx="66"
              cy="66"
              r="52"
              stroke="#9cf0ad"
              strokeWidth="13"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 52} ${2 * Math.PI * 52}`}
              strokeDashoffset={(2 * Math.PI * 52) * 0.75}
              transform="rotate(-96 66 66)"
            />
          </Svg>
          <Text style={[styles.pathOverviewRingValue, compact && styles.pathOverviewRingValueCompact]}>1 / 4</Text>
          <Text style={[styles.pathOverviewRingLabel, compact && styles.pathOverviewRingLabelCompact]}>AŞAMA</Text>
        </View>
      </View>
      <View style={styles.pathOverviewDivider} />
      <View style={[styles.pathOverviewMetaRow, compact && styles.pathOverviewMetaRowCompact]}>
        <View style={styles.pathOverviewMetaItem}>
          <View style={styles.pathOverviewMetaIcon}>
            <BookOpen size={compact ? 19 : 22} color="#9cf0ad" strokeWidth={2.5} />
          </View>
          <Text style={[styles.pathOverviewMetaText, compact && styles.pathOverviewMetaTextCompact]}>{totalLessons} Ders</Text>
        </View>
        <View style={styles.pathOverviewMetaDivider} />
        <View style={styles.pathOverviewMetaItem}>
          <View style={styles.pathOverviewMetaIcon}>
            <Clock3 size={compact ? 19 : 22} color="#9cf0ad" strokeWidth={2.5} />
          </View>
          <Text style={[styles.pathOverviewMetaText, compact && styles.pathOverviewMetaTextCompact]}>~ {totalHours} Saat</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function PathTimelineMarker({ index, active, compact, palette }: { index: number; active: boolean; compact: boolean; palette: PathsPalette }) {
  return (
    <View style={[styles.pathTimelineMarker, compact && styles.pathTimelineMarkerCompact, { backgroundColor: palette.surface, borderColor: palette.border }, active && styles.pathTimelineMarkerActive, active && { backgroundColor: palette.accent, borderColor: palette.accentSoft }]}>
      <Text style={[styles.pathTimelineMarkerText, compact && styles.pathTimelineMarkerTextCompact, { color: palette.muted }, active && styles.pathTimelineMarkerTextActive, active && { color: colors.surface }]}>{index + 1}</Text>
    </View>
  );
}

function PathLevelCard({ path, index, compact, palette }: { path: PathCard; index: number; compact: boolean; palette: PathsPalette }) {
  const active = path.status === 'active';
  const locked = path.status === 'locked';
  const tone = active ? palette.accent : locked ? palette.muted : palette.text;
  const softTone = active ? palette.accentSoft : palette.iconSoft;
  const badgeLabel = active ? 'Aktif' : locked ? 'Kilitli' : 'Sıradaki';

  return (
    <View style={[styles.pathTimelineItem, compact && styles.pathTimelineItemCompact]}>
      <PathTimelineMarker index={index} active={active} compact={compact} palette={palette} />
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/course-detail', params: { path: path.slug } })}
        style={({ pressed }) => [styles.pathLevelPressable, pressed && styles.pressed]}
      >
        <View style={[styles.pathLevelCard, compact && styles.pathLevelCardCompact, { backgroundColor: palette.surface, borderColor: palette.border }, active && styles.pathLevelCardActive, active && { backgroundColor: palette.activeSurface, borderColor: palette.activeBorder }]}>
          {active ? <PathActivePattern /> : null}
          <View style={[styles.pathCardNotch, compact && styles.pathCardNotchCompact, { backgroundColor: palette.surface, borderColor: palette.border }, active && styles.pathCardNotchActive, active && { backgroundColor: palette.activeSurface, borderColor: palette.activeBorder }]} />
          <View style={[styles.pathLevelIcon, compact && styles.pathLevelIconCompact, { backgroundColor: softTone, borderColor: palette.border }]}>
            <PathLevelIcon path={path} color={tone} compact={compact} />
          </View>
          <View style={styles.pathLevelBody}>
            <View style={styles.pathLevelTitleRow}>
              <Text style={[styles.pathLevelTitle, compact && styles.pathLevelTitleCompact, { color: palette.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.88}>{path.title}</Text>
              <View style={[styles.pathStatusBadge, compact && styles.pathStatusBadgeCompact, { backgroundColor: active ? palette.accentSoft : palette.iconSoft }]}>
                {locked ? <Lock size={compact ? 13 : 17} color={palette.muted} strokeWidth={2.6} /> : <View style={[styles.pathStatusDot, { backgroundColor: active ? palette.accent : palette.muted }]} />}
                <Text style={[styles.pathStatusText, { color: tone }]} numberOfLines={1}>{badgeLabel}</Text>
              </View>
            </View>
            <Text style={[styles.pathLevelSubtitle, compact && styles.pathLevelSubtitleCompact, { color: palette.muted }]} numberOfLines={2}>{path.subtitle}</Text>
            <View style={[styles.pathLevelDivider, compact && styles.pathLevelDividerCompact, { backgroundColor: palette.line }]} />
            <View style={styles.pathLevelMetaRow}>
              <View style={styles.pathLevelMetaItem}>
                <BookOpen size={compact ? 15 : 18} color={palette.text} strokeWidth={2.3} />
                <Text style={[styles.pathLevelMetaText, compact && styles.pathLevelMetaTextCompact, { color: palette.text }]}>{path.lessonCount} Ders</Text>
              </View>
              <View style={[styles.pathLevelMetaDivider, { backgroundColor: palette.line }]} />
              <View style={styles.pathLevelMetaItem}>
                <Clock3 size={compact ? 15 : 18} color={palette.text} strokeWidth={2.3} />
                <Text style={[styles.pathLevelMetaText, compact && styles.pathLevelMetaTextCompact, { color: palette.text }]}>~ {path.estimatedHours} Saat</Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function PathLevelIcon({ path, color, compact }: { path: PathCard; color: string; compact: boolean }) {
  const largeSize = compact ? 24 : 28;
  const defaultSize = compact ? 25 : 30;
  if (path.slug.includes('capstone') || path.title.toLowerCase().includes('uzman')) return <Trophy size={largeSize} color={color} strokeWidth={2.4} />;
  if (path.status === 'locked') return <Lock size={largeSize} color={color} strokeWidth={2.4} />;
  if (path.status === 'active') return <GraduationCap size={defaultSize} color={color} strokeWidth={2.4} />;
  return <BarChart3 size={defaultSize} color={color} strokeWidth={2.4} />;
}

function PathActivePattern() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 360 108" style={StyleSheet.absoluteFill}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <Path
          key={index}
          d={`M214 ${116 - index * 8} C254 ${86 - index * 3}, 305 ${74 - index * 2}, 366 ${30 + index * 7}`}
          fill="none"
          stroke="rgba(53,199,123,0.10)"
          strokeWidth="1"
        />
      ))}
      {[268, 284, 300, 316, 332].map((x) => (
        <Line key={x} x1={x} y1="26" x2="360" y2={x - 220} stroke="rgba(53,199,123,0.08)" strokeWidth="1" />
      ))}
    </Svg>
  );
}

function LeagueStat({ icon: Icon, value, label }: { icon: ScreenIcon; value: string; label: string }) {
  return (
    <View style={styles.leagueStatItem}>
      <View style={styles.leagueStatIcon}>
        <Icon size={24} color={colors.primary} strokeWidth={2.5} />
      </View>
      <Text style={styles.leagueStatValue}>{value}</Text>
      <Text style={styles.leagueStatLabel}>{label}</Text>
    </View>
  );
}

function getLeagueRowTone(rank: number) {
  if (rank <= 3) return { color: colors.green, rowStyle: styles.leagueLeaderboardRowTop };
  if (rank <= 7) return { color: colors.primary, rowStyle: styles.leagueLeaderboardRowMiddle };
  return { color: colors.red, rowStyle: styles.leagueLeaderboardRowBottom };
}

function getLeagueAvatarUri(name: string) {
  const charSum = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const preset = leagueAvatarPresets[charSum % leagueAvatarPresets.length];
  return buildDiceBearAvatarUrl({ ...defaultAvatarConfig, ...preset, seed: `league-${name}` }, 96);
}

function LeagueLeaderboardRow({
  player,
  isLast = false,
}: {
  player: { rank: number; name: string; points: string };
  isLast?: boolean;
}) {
  const tone = getLeagueRowTone(player.rank);

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.leagueLeaderboardRow,
        tone.rowStyle,
        !isLast && styles.leagueLeaderboardRowDivider,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.leagueLeaderboardRank, { color: tone.color }]}>{player.rank}</Text>
      <Image source={{ uri: getLeagueAvatarUri(player.name) }} style={styles.leagueLeaderboardAvatar} resizeMode="cover" />
      <Text style={styles.leagueLeaderboardName} numberOfLines={1}>{player.name}</Text>
      <Text style={styles.leagueLeaderboardPoints}>{player.points} puan</Text>
      <ChevronRight size={22} color={colors.muted} strokeWidth={2.5} />
    </Pressable>
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

function CourseProgressRing({ value }: { value: number }) {
  const progress = Math.min(100, Math.max(0, value));
  const size = 62;
  const stroke = 6;
  const radiusValue = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radiusValue;
  const visibleProgress = Math.max(progress, progress > 0 ? 4 : 3);
  const dashOffset = circumference * (1 - visibleProgress / 100);

  return (
    <View style={styles.courseProgressRing}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={size / 2} cy={size / 2} r={radiusValue} stroke={colors.surfaceMuted} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusValue}
          stroke={colors.primary}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={styles.progressCircleText}>%{progress}</Text>
    </View>
  );
}

function InfoMini({ icon: Icon, label, value }: { icon: ScreenIcon; label: string; value: string }) {
  return (
    <View style={styles.infoMini}>
      <View style={styles.infoMiniIcon}>
        <Icon size={21} color={colors.ink} strokeWidth={2.4} />
      </View>
      <Text style={styles.infoMiniLabel}>{label}</Text>
      {value ? <Text style={styles.infoMiniValue}>{value}</Text> : null}
    </View>
  );
}

function ProgressHeroRing({ progress }: { progress: number }) {
  const size = 120;
  const strokeWidth = 10;
  const radiusValue = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusValue;
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <View style={styles.progressRingWrap}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={size / 2} cy={size / 2} r={radiusValue} stroke="rgba(255,255,255,0.13)" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusValue}
          stroke="#9cf0ad"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-102 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={styles.progressRingText}>%{progress}</Text>
    </View>
  );
}

function ProgressHeroStat({ icon: Icon, label, value }: { icon: ScreenIcon; label: string; value: string }) {
  return (
    <View style={styles.progressHeroStat}>
      <View style={styles.progressHeroStatIcon}>
        <Icon size={19} color="#9cf0ad" strokeWidth={2.5} />
      </View>
      <View style={styles.progressHeroStatText}>
        <Text style={styles.progressHeroStatLabel}>{label}</Text>
        <Text style={styles.progressHeroStatValue}>{value}</Text>
      </View>
    </View>
  );
}

function ProgressSummaryCard({ icon: Icon, title, subtitle, active = false }: { icon: ScreenIcon; title: string; subtitle: string; active?: boolean }) {
  return (
    <Card style={[styles.smallSummary, active && styles.smallSummaryActive]}>
      <View style={[styles.summaryIcon, active && styles.summaryIconActive]}>
        <Icon size={29} color={active ? colors.green : colors.ink} strokeWidth={2.5} />
      </View>
      <View style={styles.summaryText}>
        <Text style={styles.summaryTitle}>{title}</Text>
        <Text style={styles.progressMuted}>{subtitle}</Text>
      </View>
    </Card>
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

function createStyles(themeColors: ThemeColors) {
  const colors = themeColors;
  const isDark = colors.surface === '#141416';
  const progressSurface = isDark ? '#101820' : colors.surface;
  const progressSurfaceSoft = isDark ? '#18232c' : colors.surface;
  const progressText = isDark ? '#f6fbff' : '#05080b';
  const progressMutedText = isDark ? '#b8c8d8' : '#5f6672';
  const progressBorder = isDark ? '#243747' : '#e5e9ef';
  const progressInnerBorder = isDark ? '#6f8aa3' : '#edf0f4';
  const progressInactiveBar = isDark ? '#24415e' : '#191c20';
  const progressTrack = isDark ? '#253441' : '#e8ebef';
  const progressIconSoft = isDark ? '#223342' : '#edf9ef';
  const progressIconActiveSoft = isDark ? '#173d2b' : '#edf9ef';
  const progressSummaryActiveSurface = isDark ? '#132437' : colors.surface;
  const progressSummaryActiveBorder = isDark ? '#2d6f54' : colors.green;
  const progressRaisedShadow = isDark ? '#000000' : '#111820';

  return StyleSheet.create<Record<string, any>>({
  splash: {
    flex: 1,
    marginHorizontal: -spacing.lg,
    marginVertical: -spacing.sm,
    overflow: 'hidden',
    backgroundColor: isDark ? '#05060a' : '#07101e',
  },
  splashContent: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 26,
  },
  splashCopyBlock: {
    gap: 12,
  },
  splashBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  splashBrandMark: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  splashBrandTitle: {
    color: '#f8fbff',
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '900',
  },
  splashBrandSubtitle: {
    color: '#8bb8ff',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
    marginTop: -1,
  },
  splashEyebrow: {
    color: '#f7c66a',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900',
    letterSpacing: 2.2,
  },
  splashHeadline: {
    color: '#f8fbff',
    fontSize: 32,
    lineHeight: 37,
    fontWeight: '900',
  },
  splashHeadlineAccent: {
    color: '#8bb8ff',
  },
  splashSubtitle: {
    color: 'rgba(248,251,255,0.72)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  splashSubtitleAccent: {
    color: '#f7c66a',
    fontWeight: '900',
  },
  splashArtwork: {
    height: 294,
    marginHorizontal: -6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashBottom: {
    gap: 14,
  },
  splashCta: {
    minHeight: 62,
    borderRadius: 22,
    backgroundColor: '#f8fbff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#8bb8ff',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  splashCtaText: {
    color: '#05060a',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
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
    backgroundColor: colors.line,
  },
  dotActive: {
    backgroundColor: '#f7c66a',
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
  skipTestButton: {
    minHeight: 40,
    borderRadius: 20,
    paddingLeft: 11,
    paddingRight: 13,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.primarySoft,
  },
  skipTestText: {
    color: colors.primary,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
  },
  placementTopRow: {
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  questionWrap: {
    marginTop: spacing.lg,
    gap: spacing.sm,
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
    backgroundColor: colors.surfaceSoft,
  },
  optionBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  optionBadgeActive: {
    backgroundColor: colors.primary,
  },
  optionBadgeText: {
    color: colors.muted,
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
  placementActions: {
    marginTop: spacing.sm,
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
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  darkSubtitle: {
    color: 'rgba(255,255,255,0.72)',
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
  dashboardHeader: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: spacing.lg,
    padding: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    shadowColor: '#111111',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  dashboardHeaderProfileLink: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  dashboardAvatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dashboardAvatarImage: {
    width: '100%',
    height: '100%',
  },
  dashboardAvatarInitial: {
    color: colors.ink,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '900',
  },
  dashboardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  dashboardGreeting: {
    color: colors.ink,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
  },
  dashboardSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },
  dashboardBellButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  notificationDot: {
    position: 'absolute',
    right: 8,
    top: 7,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  dashboardLevelCard: {
    minHeight: 226,
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  dashboardLevelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  levelBadgeIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  levelHeroTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
  },
  profileButton: {
    minHeight: 42,
    borderRadius: 22,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  profileButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  levelProgressLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    marginTop: spacing.xl,
  },
  levelMetricRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  levelPercent: {
    color: '#ffffff',
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '900',
  },
  levelXp: {
    color: '#ffffff',
    fontSize: 26,
    lineHeight: 33,
    fontWeight: '900',
  },
  levelFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  levelCompleteText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
  },
  levelCompleteStrong: {
    color: colors.green,
    fontWeight: '900',
  },
  levelNextText: {
    flex: 1,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    textAlign: 'right',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  dashboardStatsPanel: {
    minHeight: 118,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  dashboardStatsRow: {
    flex: 1,
    minHeight: 118,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  dashboardStatTile: {
    flex: 1,
    minHeight: 94,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  dashboardStatDivider: {
    width: 1,
    height: 64,
    backgroundColor: colors.line,
  },
  dashboardStatIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  dashboardStatValue: {
    color: colors.ink,
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '900',
  },
  dashboardStatLabel: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
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
  dashboardCourseCard: {
    minHeight: 174,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    gap: spacing.md,
    padding: spacing.md,
  },
  dashboardCourseMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dashboardCourseArt: {
    width: 92,
    height: 92,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardCourseContent: {
    flex: 1,
    minWidth: 0,
  },
  dashboardCourseTitle: {
    color: colors.ink,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  dashboardCourseSubtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  dashboardCourseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dashboardCoursePill: {
    flex: 1,
    minHeight: 32,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
  },
  dashboardCoursePillText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  dashboardContinueButton: {
    minWidth: 118,
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 7,
  },
  dashboardContinueText: {
    color: colors.primary,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
  },
  dashboardContinueIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardGoalCard: {
    minHeight: 126,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.green,
    backgroundColor: colors.greenSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  goalTargetIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardGoalContent: {
    flex: 1,
    gap: 7,
  },
  dashboardGoalTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  dashboardGoalText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 20,
  },
  dashboardGoalProgress: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '900',
  },
  goalCheckIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathsScreenContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 124,
    backgroundColor: colors.surface,
  },
  pathsCompactHeader: {
    minHeight: 64,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  pathsCompactHeaderTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },
  pathsCompactHeaderSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
    fontWeight: '700',
  },
  pathsCompactHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathsHeader: {
    display: 'none',
    alignItems: 'flex-start',
    paddingTop: 0,
    paddingBottom: 20,
  },
  pathsTitle: {
    color: colors.ink,
    fontSize: 40,
    lineHeight: 47,
    fontWeight: '900',
    letterSpacing: 0,
  },
  pathsTitleCompact: {
    fontSize: 34,
    lineHeight: 40,
  },
  pathsSubtitle: {
    color: colors.muted,
    fontSize: 19,
    lineHeight: 26,
    marginTop: 8,
  },
  pathsSubtitleCompact: {
    fontSize: 17,
    lineHeight: 23,
  },
  pathOverviewCard: {
    minHeight: 206,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    marginBottom: 28,
    overflow: 'hidden',
    shadowColor: '#05080b',
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 16 },
    elevation: 5,
  },
  pathOverviewCardCompact: {
    minHeight: 196,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    marginBottom: 24,
  },
  pathOverviewMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  pathOverviewRing: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathOverviewRingCompact: {
    width: 118,
    height: 118,
  },
  pathOverviewRingValue: {
    position: 'absolute',
    top: 45,
    color: '#f6fbff',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  pathOverviewRingValueCompact: {
    top: 40,
    fontSize: 25,
    lineHeight: 30,
  },
  pathOverviewRingLabel: {
    position: 'absolute',
    top: 78,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '900',
  },
  pathOverviewRingLabelCompact: {
    top: 69,
    fontSize: 10,
    lineHeight: 15,
  },
  pathOverviewBody: {
    flex: 1,
    minWidth: 0,
    zIndex: 2,
  },
  pathOverviewKicker: {
    color: '#9cf0ad',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '900',
    letterSpacing: 3,
  },
  pathOverviewTitle: {
    color: '#f6fbff',
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900',
    marginTop: 6,
  },
  pathOverviewTitleCompact: {
    fontSize: 22,
    lineHeight: 26,
  },
  pathOverviewText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  pathOverviewTextCompact: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },
  pathOverviewProgress: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.13)',
    marginTop: 13,
    overflow: 'hidden',
  },
  pathOverviewProgressCompact: {
    marginTop: 13,
  },
  pathOverviewProgressFill: {
    width: '31%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#35c77b',
  },
  pathOverviewDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginTop: 14,
    marginBottom: 13,
  },
  pathOverviewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 12,
  },
  pathOverviewMetaRowCompact: {
    gap: 8,
  },
  pathOverviewMetaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pathOverviewMetaIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  pathOverviewMetaText: {
    color: '#f6fbff',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
  },
  pathOverviewMetaTextCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  pathOverviewMetaDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  pathTimeline: {
    position: 'relative',
    gap: 18,
    paddingBottom: 28,
  },
  pathTimelineCompact: {
    gap: 16,
  },
  pathTimelineLine: {
    position: 'absolute',
    left: 23,
    top: 36,
    bottom: 58,
    width: 2,
    backgroundColor: colors.line,
  },
  pathTimelineLineCompact: {
    left: 21,
  },
  pathTimelineItem: {
    minHeight: 118,
    position: 'relative',
    paddingLeft: 58,
  },
  pathTimelineItemCompact: {
    minHeight: 106,
    paddingLeft: 58,
  },
  pathLevelPressable: {
    width: '100%',
  },
  pathLevelCard: {
    minHeight: 118,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 14,
    paddingRight: 12,
    paddingVertical: 12,
    overflow: 'hidden',
    shadowColor: '#111111',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  pathLevelCardCompact: {
    minHeight: 106,
    gap: 10,
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 10,
  },
  pathLevelCardActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenSoft,
  },
  pathCardNotch: {
    position: 'absolute',
    left: -9,
    top: 48,
    width: 18,
    height: 18,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    transform: [{ rotate: '45deg' }],
  },
  pathCardNotchCompact: {
    top: 44,
  },
  pathCardNotchActive: {
    borderColor: colors.green,
    backgroundColor: colors.greenSoft,
  },
  pathLevelIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathLevelIconCompact: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  pathLevelBody: {
    flex: 1,
    minWidth: 0,
  },
  pathLevelTitle: {
    color: colors.ink,
    flex: 1,
    minWidth: 0,
    fontSize: 19,
    lineHeight: 23,
    fontWeight: '900',
  },
  pathLevelTitleCompact: {
    fontSize: 18,
    lineHeight: 22,
  },
  pathLevelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pathLevelSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },
  pathLevelSubtitleCompact: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  pathLevelDivider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 9,
  },
  pathLevelDividerCompact: {
    marginVertical: 7,
  },
  pathLevelMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  pathLevelMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pathLevelMetaDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.line,
  },
  pathLevelMetaText: {
    color: colors.ink,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },
  pathLevelMetaTextCompact: {
    fontSize: 11,
    lineHeight: 15,
  },
  pathStatusBadge: {
    minHeight: 28,
    minWidth: 68,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pathStatusBadgeCompact: {
    minHeight: 25,
    minWidth: 62,
    borderRadius: 13,
    paddingHorizontal: 7,
  },
  pathStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  pathStatusText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900',
  },
  pathTimelineMarker: {
    position: 'absolute',
    left: 0,
    top: 36,
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    shadowColor: '#111111',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  pathTimelineMarkerCompact: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  pathTimelineMarkerActive: {
    width: 46,
    height: 46,
    borderRadius: 23,
    left: 0,
    top: 36,
    borderWidth: 3,
    borderColor: '#dff7ea',
    backgroundColor: colors.green,
  },
  pathTimelineMarkerText: {
    color: colors.muted,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  pathTimelineMarkerTextCompact: {
    fontSize: 18,
    lineHeight: 22,
  },
  pathTimelineMarkerTextActive: {
    color: colors.surface,
  },
  catalogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  catalogHeaderIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catalogHeaderTitle: {
    color: colors.ink,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '900',
  },
  catalogHeaderSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
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
    borderColor: colors.green,
    backgroundColor: colors.greenSoft,
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
  catalogCourseRow: {
    minHeight: 66,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  catalogCourseIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catalogCourseBody: {
    flex: 1,
    minWidth: 0,
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
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  catalogCourseMeta: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    marginTop: 3,
  },
  courseDetailScreen: {
    backgroundColor: colors.surface,
    gap: 14,
  },
  courseOverviewPanel: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  courseOverviewCopy: {
    flex: 1,
    minWidth: 0,
  },
  courseOverviewTitle: {
    color: colors.ink,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
    letterSpacing: 0,
  },
  courseOverviewSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  courseProgressRing: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  progressCircleText: {
    position: 'absolute',
    color: colors.ink,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  courseOverviewDivider: {
    height: 1,
    backgroundColor: colors.line,
    marginHorizontal: 16,
  },
  metaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoMini: {
    flex: 1,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 2,
  },
  metaDivider: {
    width: 1,
    height: 52,
    backgroundColor: colors.line,
  },
  infoMiniIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.greenSoft,
  },
  infoMiniLabel: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  infoMiniValue: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  courseContentDivider: {
    height: 1,
    backgroundColor: colors.line,
  },
  courseContentHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  courseContentTitle: {
    color: colors.ink,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '900',
  },
  courseContentSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  lessonGroupBlock: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  lessonRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 15,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 9,
  },
  lessonRowActive: {
    borderColor: colors.green,
    borderLeftWidth: 5,
  },
  lessonRowLocked: {
    backgroundColor: colors.surface,
  },
  courseLessonStatus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  courseLessonStatusActive: {
    backgroundColor: colors.greenSoft,
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
  lessonTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  lessonTitle: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  lessonMeta: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    marginTop: 3,
  },
  lockedLessonText: {
    color: colors.muted,
  },
  lessonActionStatus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonActionStatusActive: {
    borderColor: colors.green,
    backgroundColor: colors.surface,
  },
  lessonGroupHeader: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  lessonGroupTitle: {
    flex: 1,
    minWidth: 0,
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
  },
  lessonGroupRight: {
    minWidth: 84,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    flexShrink: 0,
  },
  lessonGroupChevronBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lessonGroupChevronClosed: {
    transform: [{ rotate: '-90deg' }],
  },
  lessonGroupMeta: {
    color: colors.green,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    flexShrink: 0,
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
  codeRunnerCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#0b0b0c',
    borderWidth: 1,
    borderColor: '#2f2f33',
    marginTop: spacing.sm,
  },
  codeRunnerCardFullscreen: {
    flex: 1,
    borderRadius: 0,
    marginTop: 0,
    borderWidth: 0,
  },
  codeFullscreenShell: {
    flex: 1,
    backgroundColor: '#0b0b0c',
  },
  codeRunnerHeader: {
    minHeight: 58,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: '#141416',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  codeRunnerTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  codeRunnerDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#35c77b',
  },
  codeRunnerTitleTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  codeRunnerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  codeIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1f1f22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeRunnerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  codeRunnerSubtitle: {
    color: '#a6a6ad',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  codeRunButton: {
    minHeight: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  codeRunButtonDisabled: {
    opacity: 0.72,
  },
  codeRunButtonText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900',
  },
  codeEditor: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#0b0b0c',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  codeEditorFullscreen: {
    flex: 1,
    paddingTop: spacing.md,
  },
  codeEditorLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  codeLineNumber: {
    width: 24,
    color: '#a6a6ad',
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'right',
  },
  codeLineNumberColumn: {
    paddingTop: 2,
  },
  codeRunnerLineText: {
    flex: 1,
    color: '#9fe7c2',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  codeInputLayer: {
    flex: 1,
    minHeight: 128,
    position: 'relative',
  },
  codeInputLayerFullscreen: {
    minHeight: 0,
    height: '100%',
  },
  codeHighlightLayer: {
    position: 'absolute',
    inset: 0,
  },
  codeHighlightText: {
    color: '#d7dde8',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  codeHighlightTextFullscreen: {
    fontSize: 14,
    lineHeight: 21,
  },
  codeTokenPlain: {
    color: '#d7dde8',
  },
  codeTokenKeyword: {
    color: '#ff7ab2',
  },
  codeTokenBuiltin: {
    color: '#82aaff',
  },
  codeTokenString: {
    color: '#c3e88d',
  },
  codeTokenNumber: {
    color: '#f78c6c',
  },
  codeTokenComment: {
    color: '#6f7787',
  },
  codeTokenOperator: {
    color: '#89ddff',
  },
  codeTokenFunction: {
    color: '#7fdbca',
  },
  codeRunnerInput: {
    flex: 1,
    minHeight: 128,
    color: 'transparent',
    caretColor: '#ffffff',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    padding: 0,
    margin: 0,
    outlineStyle: 'none',
  },
  codeRunnerInputFullscreen: {
    minHeight: 0,
    height: '100%',
    fontSize: 14,
    lineHeight: 21,
  },
  codeOutputPanel: {
    margin: spacing.sm,
    marginTop: 0,
    borderRadius: radius.md,
    backgroundColor: '#121316',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: spacing.md,
  },
  codeOutputPanelActive: {
    backgroundColor: '#141916',
    borderColor: 'rgba(37,168,102,0.72)',
  },
  codeOutputPanelError: {
    backgroundColor: '#191214',
    borderColor: 'rgba(223,63,81,0.72)',
  },
  codeOutputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  codeOutputLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  codeOutputStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  codeOutputStatusText: {
    color: '#a6a6ad',
    fontSize: 11,
    fontWeight: '900',
  },
  codeOutputStatusTextActive: {
    color: '#55d88e',
  },
  codeOutputStatusTextError: {
    color: '#ff8b98',
  },
  codeOutputText: {
    color: '#a7f3ca',
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '800',
  },
  codeOutputTextError: {
    color: '#ffadb6',
  },
  codeOutputPlaceholder: {
    color: '#a6a6ad',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  labEmbedCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
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
    paddingTop: spacing.sm,
  },
  lessonProgressBlock: {
    gap: spacing.md,
  },
  lessonStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  lessonStepCount: {
    color: colors.ink,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  lessonStepSlash: {
    color: colors.primary,
    fontWeight: '800',
  },
  lessonStepLabel: {
    color: colors.primary,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
  },
  lessonSegmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lessonSegment: {
    flex: 1,
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
  },
  lessonSegmentActive: {
    backgroundColor: colors.primary,
  },
  learningStepCard: {
    marginTop: spacing.lg,
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  stepKickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepIconBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  stepKicker: {
    color: colors.primary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
  },
  learningStepTitle: {
    color: colors.ink,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
  },
  learningStepBody: {
    color: colors.ink,
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '500',
  },
  learningList: {
    gap: spacing.sm,
  },
  learningBulletRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    minHeight: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSoft,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  learningBulletDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 7,
  },
  learningCheckBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  learningBulletText: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '900',
  },
  learningOrderedRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSoft,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
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
  lessonActionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  lessonNoteButton: {
    minHeight: 58,
    borderWidth: 2,
    borderColor: '#f97316',
    backgroundColor: colors.surface,
  },
  lessonNoteButtonText: {
    color: '#f97316',
    fontSize: 15,
    fontWeight: '900',
  },
  lessonContinueButton: {
    minHeight: 58,
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
    backgroundColor: colors.greenSoft,
  },
  lessonQuizOptionWrong: {
    borderColor: colors.red,
    backgroundColor: colors.redSoft,
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
    backgroundColor: colors.surfaceSoft,
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
    backgroundColor: colors.surfaceSoft,
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
    backgroundColor: colors.line,
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
    borderColor: colors.line,
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
  progressScreenContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 124,
    backgroundColor: colors.surface,
    gap: 16,
  },
  progressTopBar: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    shadowColor: '#111111',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  progressPageTitle: {
    color: colors.ink,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },
  progressCalendarButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  progressHeroPanel: {
    minHeight: 218,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    overflow: 'hidden',
    shadowColor: '#05080b',
    shadowOpacity: 0.17,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  progressHeroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  progressHeroCopy: {
    flex: 1,
    minWidth: 0,
  },
  progressKicker: {
    color: '#9cf0ad',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  progressHeroTitle: {
    color: '#f6fbff',
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    marginTop: 7,
  },
  progressGainPill: {
    alignSelf: 'flex-start',
    minHeight: 36,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    marginTop: 12,
    backgroundColor: 'rgba(92, 220, 130, 0.18)',
  },
  progressGainText: {
    color: '#9cf0ad',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },
  progressRingWrap: {
    width: 122,
    height: 122,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingText: {
    position: 'absolute',
    color: '#f6fbff',
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '900',
  },
  progressHeroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginTop: 13,
    marginBottom: 11,
  },
  progressHeroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 7,
  },
  progressHeroStat: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  progressHeroStatIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.11)',
  },
  progressHeroStatText: {
    minWidth: 0,
    alignItems: 'flex-start',
  },
  progressHeroStatLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
  },
  progressHeroStatValue: {
    color: colors.surface,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
    marginTop: 1,
  },
  progressStatDivider: {
    width: 1,
    height: 42,
    backgroundColor: 'rgba(255,255,255,0.18)',
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
    borderColor: colors.line,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  activityCard: {
    borderRadius: 22,
    borderColor: progressBorder,
    padding: 20,
    backgroundColor: progressSurface,
    shadowColor: progressRaisedShadow,
    shadowOpacity: isDark ? 0.28 : 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  activityIconButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: progressBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: progressSurfaceSoft,
  },
  progressCardTitle: {
    color: progressText,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '900',
  },
  progressMuted: {
    color: progressMutedText,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  barChart: {
    height: 176,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: isDark ? '#86a4bd' : progressInnerBorder,
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 18,
    position: 'relative',
  },
  chartGuide: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 62,
    height: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: isDark ? '#8db0cd' : '#d9dde3',
  },
  barWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    height: '100%',
  },
  bar: {
    width: 26,
    borderRadius: 9,
    backgroundColor: progressInactiveBar,
  },
  barActive: {
    backgroundColor: colors.green,
  },
  barLabel: {
    color: progressMutedText,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  barLabelActive: {
    color: colors.green,
    fontWeight: '900',
  },
  progressSummaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  smallSummary: {
    flex: 1,
    minHeight: 126,
    borderRadius: 22,
    borderColor: progressBorder,
    padding: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: progressSurface,
    shadowColor: progressRaisedShadow,
    shadowOpacity: isDark ? 0.28 : 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  smallSummaryActive: {
    borderColor: progressSummaryActiveBorder,
    backgroundColor: progressSummaryActiveSurface,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: progressIconSoft,
  },
  summaryIconActive: {
    backgroundColor: progressIconActiveSoft,
  },
  summaryText: {
    minWidth: 0,
    width: '100%',
  },
  summaryTitle: {
    color: progressText,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '900',
  },
  nextMilestoneCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    borderRadius: 22,
    borderColor: progressBorder,
    padding: 18,
    backgroundColor: progressSurface,
    shadowColor: progressRaisedShadow,
    shadowOpacity: isDark ? 0.28 : 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  milestoneIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: progressSurfaceSoft,
    borderWidth: 1,
    borderColor: progressBorder,
  },
  milestoneBody: {
    flex: 1,
    minWidth: 0,
  },
  milestoneTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  milestoneBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: progressBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: progressSurfaceSoft,
  },
  milestoneProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  milestoneLessonText: {
    color: progressText,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
  },
  milestoneTrack: {
    flex: 1,
    height: 9,
    borderRadius: 999,
    backgroundColor: progressTrack,
    overflow: 'hidden',
  },
  milestoneFill: {
    width: '50%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.green,
  },
  milestonePercent: {
    color: colors.green,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },
  profileScreenContent: {
    paddingHorizontal: 12,
    paddingTop: 13,
    paddingBottom: 124,
    backgroundColor: colors.surfaceSoft,
    gap: 15,
  },
  profileHero: {
    minHeight: 133,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 22,
    overflow: 'hidden',
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.surface,
    shadowOpacity: 0.42,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  profileAvatarText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 31,
    lineHeight: 36,
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 24,
  },
  profileHeroBody: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    color: '#ffffff',
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '900',
  },
  profileMeta: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 15,
    lineHeight: 20,
    marginTop: 5,
  },
  profileProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    marginTop: 14,
  },
  profileProgressFill: {
    width: '64%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.purple,
  },
  profileXp: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    marginTop: 14,
  },
  profileXpStrong: {
    color: '#ffffff',
    fontWeight: '900',
  },
  profileLevelPill: {
    position: 'absolute',
    top: 25,
    right: 20,
    minWidth: 49,
    height: 40,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.34,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  profileLevelText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '900',
  },
  profileStatsPanel: {
    minHeight: 100,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 12,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.07,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  profileStatItem: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 2,
    position: 'relative',
  },
  profileStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileStatText: {
    width: 60,
    minWidth: 60,
  },
  profileStatValue: {
    color: colors.ink,
    fontSize: 26,
    lineHeight: 29,
    fontWeight: '900',
    includeFontPadding: false,
  },
  profileStatLabel: {
    color: colors.ink,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    marginTop: 1,
    includeFontPadding: false,
  },
  profileStatSublabel: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    marginTop: 5,
    includeFontPadding: false,
  },
  profileStatDivider: {
    position: 'absolute',
    right: -1,
    height: 56,
    width: 1,
    backgroundColor: colors.line,
  },
  profileBadgePanel: {
    minHeight: 195,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 17,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  profileSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: 17,
  },
  profileSectionTitle: {
    color: colors.ink,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
    flexShrink: 0,
  },
  profileSeeAll: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingLeft: spacing.sm,
  },
  profileSeeAllText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  badgeMini: {
    flex: 1,
    minHeight: 122,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  badgeTrophyWrap: {
    width: 82,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeAssetImage: {
    width: 78,
    height: 78,
  },
  badgeStar: {
    position: 'absolute',
    right: 2,
    bottom: 8,
  },
  badgeText: {
    color: colors.ink,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    marginTop: 5,
  },
  badgesScreenContent: {
    gap: spacing.md,
    paddingBottom: 116,
  },
  badgesHeroCard: {
    minHeight: 104,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.lg,
  },
  badgesHeroKicker: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  badgesHeroTitle: {
    color: colors.ink,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    marginTop: 3,
  },
  badgesHeroCount: {
    minWidth: 82,
    minHeight: 72,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
  },
  badgesHeroCountText: {
    color: colors.ink,
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '900',
  },
  badgesHeroCountLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  badgeCollectionCard: {
    width: '48%',
    minHeight: 258,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: spacing.md,
    alignItems: 'center',
  },
  badgeCollectionCardLocked: {
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  badgeCollectionImageWrap: {
    width: 122,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.sm,
  },
  badgeCollectionImage: {
    width: 118,
    height: 108,
  },
  badgeCollectionImageLocked: {
    opacity: 0.86,
  },
  badgeLockOverlay: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    right: -2,
    bottom: -2,
  },
  badgeCollectionTitle: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  badgeCollectionDescription: {
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  badgeStatusPill: {
    minHeight: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.primarySoft,
  },
  badgeStatusPillLocked: {
    backgroundColor: colors.surfaceMuted,
  },
  badgeStatusText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '900',
  },
  badgeStatusTextLocked: {
    color: colors.muted,
  },
  profileSettingsStack: {
    gap: 9,
  },
  settingsRow: {
    minHeight: 55,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  settingsIconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTitle: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  settingsValue: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  profileLogoutButton: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  profileLogoutText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  themeModalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  themeModalCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  themeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  themeModalTitle: {
    color: colors.ink,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
  themeModalSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 3,
  },
  themeModalClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    transform: [{ rotate: '90deg' }],
  },
  themeOptionStack: {
    gap: spacing.sm,
  },
  themeOptionRow: {
    minHeight: 74,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  themeOptionRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  themeOptionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  themeOptionIconActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  themeOptionCopy: {
    flex: 1,
  },
  themeOptionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  themeOptionDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 3,
  },
  themeOptionCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
  leagueBellWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueBellDot: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  leagueHero: {
    minHeight: 254,
    position: 'relative',
    marginTop: spacing.xs,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    overflow: 'hidden',
  },
  leagueHeroCopy: {
    width: '56%',
    zIndex: 2,
  },
  leaguePill: {
    alignSelf: 'flex-start',
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#efdcae',
    backgroundColor: '#fffaf0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 5,
    paddingRight: spacing.md,
    marginBottom: spacing.sm,
  },
  leaguePillIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f4bc22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffe49a',
  },
  leaguePillText: {
    color: '#c99008',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    letterSpacing: 0,
  },
  leagueTitle: {
    color: colors.ink,
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: 0,
  },
  leagueRank: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.sm,
    fontWeight: '700',
  },
  leagueRankStrong: {
    color: colors.primary,
    fontWeight: '900',
  },
  leaguePoints: {
    color: colors.ink,
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '900',
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  leagueBadgeStage: {
    position: 'absolute',
    right: 0,
    top: 36,
    width: 148,
    height: 148,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  leagueBadgeImage: {
    width: 136,
    height: 136,
  },
  leagueProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.line,
    marginTop: spacing.lg,
    overflow: 'visible',
  },
  leagueProgressFill: {
    width: '74%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  leagueProgressMarker: {
    position: 'absolute',
    left: '72%',
    top: -7,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueRemaining: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  leagueRemainingStrong: {
    color: colors.primary,
    fontWeight: '900',
  },
  leagueStatsBand: {
    minHeight: 106,
    marginHorizontal: -spacing.lg,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leagueStatItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  leagueStatValue: {
    color: colors.ink,
    fontSize: 21,
    lineHeight: 25,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  leagueStatLabel: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  leagueStatDivider: {
    width: 1,
    height: 56,
    backgroundColor: colors.line,
  },
  leagueStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  leagueStatusTitle: {
    color: colors.ink,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
  },
  leagueDetailsLink: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  leagueDetailsText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  leagueStatusCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
  },
  leagueLeaderboardRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.lg,
  },
  leagueLeaderboardRowTop: {
    backgroundColor: colors.greenSoft,
  },
  leagueLeaderboardRowMiddle: {
    backgroundColor: colors.surfaceSoft,
  },
  leagueLeaderboardRowBottom: {
    backgroundColor: colors.redSoft,
  },
  leagueLeaderboardRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  leagueLeaderboardRank: {
    width: 25,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  leagueLeaderboardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
  },
  leagueLeaderboardName: {
    flex: 1,
    minWidth: 0,
    color: colors.ink,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
  },
  leagueLeaderboardPoints: {
    width: 88,
    color: colors.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  leagueStatusRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  leagueStatusRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  leagueStatusDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  leagueStatusLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
  },
  leagueStatusValue: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 19,
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
}

let styles = createStyles(colors);

registerThemeStyles((nextColors) => {
  styles = createStyles(nextColors);
});
