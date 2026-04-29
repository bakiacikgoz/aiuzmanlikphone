import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ComponentType } from 'react';
import { useEffect, useMemo, useState } from 'react';
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
  calculatePlacementResult,
  countCorrectPlacementAnswers,
  formatLabResultMessage,
  getPlacementStepLabel,
  getQuizResultMessage,
  isLastPlacementQuestion,
  runPerceptronLab,
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
  getLessons,
  getNotes,
  getPlacementQuestions,
  getQuizQuestion,
  issueCertificate,
  saveNote,
  saveSelectedInterests,
  submitLab,
  submitPlacement,
  submitQuizAnswer,
  toggleBookmark,
  updateLessonProgress,
  type CourseCard,
  type LabState,
  type LessonCard,
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
  const { data: courses, error: courseError } = useAsyncData<CourseCard[]>(getCourseCatalog, []);
  const { data: allLessons, error: lessonsError } = useAsyncData<LessonCard[]>(getLessons, []);
  const featuredCourse = courses[0] ?? {
    title: 'Neural Networks 101',
    subtitle: 'Yapay sinir aglarinin temelleri',
    level: 'Orta',
    duration: '25 dk',
    moduleCount: 8,
    progress: 65,
    slug: 'neural-networks-101',
  };
  const selectedCourse = courses.find((course) => course.slug === selectedCourseSlug)
    ?? courses.find((course) => course.pathSlug === selectedPath)
    ?? featuredCourse;
  const courseLessons = allLessons.filter((lesson) => lesson.courseSlug === selectedCourse.slug);
  const visibleLessons = courseLessons.length ? courseLessons : allLessons.slice(0, Math.max(4, selectedCourse.lessonCount ?? 4));
  return (
    <Screen>
      <StatusBar style="light" />
      <Header back right={<Pressable onPress={() => toggleBookmark('course', selectedCourse.id)}><Bookmark size={22} color={colors.ink} /></Pressable>} />
      <CourseHeroVisual
        height={228}
        title={selectedCourse.title}
        subtitle={selectedCourse.subtitle}
        metrics={[selectedCourse.duration, selectedCourse.level, `${selectedCourse.lessonCount ?? visibleLessons.length} ders`]}
        progress={selectedCourse.progress}
      />
      {courseError || lessonsError ? <Text style={styles.errorText}>{courseError ?? lessonsError}</Text> : null}
      <View style={styles.courseHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bigTitle}>{selectedCourse.title}</Text>
          <Text style={styles.muted}>{selectedCourse.subtitle}</Text>
        </View>
        <View style={styles.progressCircle}>
          <Text style={styles.progressCircleText}>%{selectedCourse.progress}</Text>
        </View>
      </View>
      <View style={styles.metaStrip}>
        <InfoMini icon={Clock3} label="Sure" value={selectedCourse.duration} />
        <InfoMini icon={BookOpen} label="Icerik" value={`${selectedCourse.lessonCount ?? visibleLessons.length} Ders`} />
        <InfoMini icon={BarChart3} label="Seviye" value={selectedCourse.level} />
      </View>
      <SectionTitle title="Ders Icerigi" />
      {visibleLessons.map((lesson) => (
        <Pressable key={lesson.slug} onPress={() => router.push('/lesson-player')} style={styles.lessonRow}>
          <View style={[styles.lessonStatus, lesson.status === 'done' && styles.lessonDone]}>
            {lesson.status === 'locked' ? <Lock size={14} color="#8993a8" /> : lesson.status === 'done' ? <Check size={14} color={colors.surface} /> : <Play size={13} color={colors.primary} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.lessonTitle}>{lesson.title}</Text>
            <Text style={styles.metaText}>{lesson.type} • {lesson.duration}</Text>
          </View>
        </Pressable>
      ))}
      <View style={styles.quickActions}>
        <OutlineButton title="Notlar" onPress={() => router.push('/notes')} icon={<BookOpen size={18} color={colors.primary} />} style={styles.rowButton} />
        <OutlineButton title="Quiz" onPress={() => router.push('/quiz')} icon={<ShieldCheck size={18} color={colors.primary} />} style={styles.rowButton} />
      </View>
      <PrimaryButton title="Derse Devam Et" onPress={() => router.push('/lesson-player')} icon={<Play size={18} color={colors.surface} />} />
    </Screen>
  );
}

export function LessonPlayerScreen() {
  const { data: courseLessons } = useAsyncData<LessonCard[]>(getLessons, []);
  const currentLesson = courseLessons[1] ?? {
    title: 'Perceptron ve Aktivasyon Fonksiyonlari',
    slug: 'neural-networks-101-m1-l2',
    type: 'Video' as const,
    duration: '12 dk',
    status: 'active' as const,
  };
  return (
    <Screen>
      <StatusBar style="dark" />
      <Header title="Neural Networks 101" back right={<Pressable onPress={() => toggleBookmark('lesson', currentLesson.id)}><Bookmark size={22} color={colors.ink} /></Pressable>} />
      <CourseHeroVisual
        height={218}
        title={currentLesson.title}
        subtitle="Yapay sinir aglarinin temel yapi taslari"
        metrics={[currentLesson.duration, 'Orta', currentLesson.type]}
        progress={35}
      />
      <Text style={styles.bigTitle}>{currentLesson.title}</Text>
      <Text style={styles.muted}>Yapay sinir aglarinin temel yapi taslari</Text>
      <View style={styles.metaStrip}>
        <InfoMini icon={Clock3} label="12 dk" value="" />
        <InfoMini icon={Play} label="Video" value="" />
        <InfoMini icon={BarChart3} label="Orta" value="" />
      </View>
      <Text style={styles.cardTitle}>Ilerleme</Text>
      <ProgressBar value={35} />
      <Card style={styles.bulletCard}>
        <Text style={styles.cardTitle}>Bu derste ogreneceklerin</Text>
        {['Perceptron modelinin calisma prensibi', 'Aktivasyon fonksiyonlarinin rolu', 'ReLU, Sigmoid ve Tanh karsilastirmasi'].map((item) => (
          <Text key={item} style={styles.bullet}>• {item}</Text>
        ))}
      </Card>
      <View style={styles.rowGap}>
        <OutlineButton title="Not Al" onPress={() => router.push('/notes')} style={styles.rowButton} />
        <PrimaryButton title="Derse Devam Et" onPress={async () => {
          await updateLessonProgress(currentLesson.id, 55);
          router.push('/reading');
        }} style={styles.rowButton} />
      </View>
    </Screen>
  );
}

export function ReadingScreen() {
  return (
    <Screen>
      <Header title="Ders Notu" back />
      <SectionTitle title="Aktivasyon Fonksiyonlari" subtitle="Aktivasyon fonksiyonlari, yapay sinir aglarinda noronun cikti degerini belirler ve modele lineer olmayanlik kazandirir." />
      <Card style={styles.activationCard}>
        <Text style={styles.linkTitle}>Yaygin Aktivasyon Fonksiyonlari</Text>
        <View style={styles.activationGrid}>
          {['ReLU', 'Sigmoid', 'Tanh'].map((name, index) => (
            <View key={name} style={styles.activationCell}>
              <Text style={styles.activationName}>{name}</Text>
              <View style={styles.tinyChart}>
                <View style={[styles.chartLine, { transform: [{ rotate: index === 0 ? '-35deg' : index === 1 ? '-65deg' : '-78deg' }] }]} />
              </View>
            </View>
          ))}
        </View>
      </Card>
      <Card style={styles.noteCallout}>
        <Star size={24} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.linkTitle}>Onemli Nokta</Text>
          <Text style={styles.muted}>ReLU, negatif degerlerde 0 ciktigi icin hesaplama daha hizlidir ve gradient kaybolma problemini azaltmaya yardimci olur.</Text>
        </View>
      </Card>
      <View style={styles.rowGap}>
        <OutlineButton title="Sayfa 2 / 5" style={styles.rowButton} />
        <PrimaryButton title="Sonraki" onPress={() => router.push('/lab')} style={styles.rowButton} />
      </View>
    </Screen>
  );
}

export function LabScreen() {
  const { data: lab, error } = useAsyncData<LabState>(getLab, {
    title: 'Perceptron Hesapla',
    description: 'Agirliklari ve girdi degerlerini kullanarak ciktiyi hesapla.',
    starterCode: 'def perceptron(x1, x2, w1, w2, bias):\n  z = w1*x1 + w2*x2 + bias\n  return 1 if z >= 0 else 0',
    values: { x1: 0.6, x2: -0.3, w1: 0.8, w2: -0.5, bias: 0.1 },
  });
  const [values, setValues] = useState(lab.values);
  const [labMessage, setLabMessage] = useState<string | null>(null);
  useEffect(() => setValues(lab.values), [lab.values]);
  const result = useMemo(() => runPerceptronLab(values), [values]);
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
        <PrimaryButton title={labMessage ? "Quiz'e Gec" : 'Calistir'} onPress={async () => {
          if (labMessage) {
            router.push('/quiz');
            return;
          }
          const submitted = await submitLab(lab.id, values);
          setLabMessage(formatLabResultMessage(submitted));
        }} icon={<Play size={18} color={colors.surface} />} style={styles.rowButton} />
      </View>
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
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  infoMini: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
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
