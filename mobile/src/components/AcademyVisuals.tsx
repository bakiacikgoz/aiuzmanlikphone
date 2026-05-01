import { LinearGradient } from 'expo-linear-gradient';
import {
  Award,
  BookOpen,
  Bot,
  Check,
  GraduationCap,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { colors, radius, shadow, spacing } from '../theme';

type HeightProp = {
  height?: number;
};

export function BrandMark({ size = 52, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <LinearGradient
      colors={dark ? ['#1d4cff', '#16d7ff'] : ['#0b66f5', '#20c7e8']}
      style={[styles.brandMark, { width: size, height: size, borderRadius: Math.round(size * 0.27) }]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 64 64">
        <Rect x="14" y="15" width="36" height="34" rx="11" fill="rgba(255,255,255,0.2)" />
        <Line x1="25" y1="25" x2="39" y2="39" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        <Line x1="39" y1="25" x2="25" y2="39" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
        <Circle cx="20" cy="19" r="5" fill="#ffffff" />
        <Circle cx="44" cy="19" r="5" fill="#ffffff" />
        <Circle cx="20" cy="45" r="5" fill="#ffffff" />
        <Circle cx="44" cy="45" r="5" fill="#ffffff" />
      </Svg>
    </LinearGradient>
  );
}

export function SplashHeroVisual({ height = 280 }: HeightProp) {
  return (
    <VisualFrame height={height} dark>
      <Svg width="100%" height="100%" viewBox="0 0 320 260" style={StyleSheet.absoluteFill}>
        <Circle cx="164" cy="106" r="76" fill="none" stroke="rgba(32,199,232,0.28)" strokeWidth="2" />
        <Circle cx="164" cy="106" r="116" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        <Line x1="86" y1="92" x2="164" y2="58" stroke="rgba(255,255,255,0.28)" strokeWidth="2" />
        <Line x1="164" y1="58" x2="236" y2="104" stroke="rgba(255,255,255,0.28)" strokeWidth="2" />
        <Line x1="86" y1="92" x2="128" y2="166" stroke="rgba(255,255,255,0.24)" strokeWidth="2" />
        <Line x1="128" y1="166" x2="236" y2="104" stroke="rgba(255,255,255,0.24)" strokeWidth="2" />
        <Circle cx="86" cy="92" r="9" fill="#20c7e8" />
        <Circle cx="164" cy="58" r="9" fill="#ffffff" />
        <Circle cx="236" cy="104" r="9" fill="#35c77b" />
        <Circle cx="128" cy="166" r="9" fill="#7357ff" />
      </Svg>
      <View style={styles.heroGlassCard}>
        <GraduationCap size={36} color="#ffffff" strokeWidth={2.4} />
        <View>
          <Text style={styles.visualWhiteTitle}>AI Path</Text>
          <Text style={styles.visualWhiteCaption}>24 derslik rota</Text>
        </View>
        <View style={styles.heroStatus}>
          <Text style={styles.heroStatusText}>45%</Text>
        </View>
      </View>
      <View style={styles.heroCodePanel}>
        {['model.train()', 'loss.backward()', 'deploy()'].map((line) => (
          <View key={line} style={styles.codePill}>
            <Text style={styles.codePillText}>{line}</Text>
          </View>
        ))}
      </View>
    </VisualFrame>
  );
}

export function CourseHeroVisual({
  height = 210,
  title = 'Neural Networks 101',
  subtitle = 'Perceptron, aktivasyon ve backprop',
  metrics = ['12 dk', 'Orta', 'Video'],
  progress = 0,
}: HeightProp & { title?: string; subtitle?: string; metrics?: string[]; progress?: number }) {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <VisualFrame height={height} dark>
      <Svg width="100%" height="100%" viewBox="0 0 360 230" style={StyleSheet.absoluteFill}>
        <Rect x="0" y="0" width="360" height="230" fill="#020a2e" />
        {[236, 252, 268, 284, 300, 316, 332].map((x) => (
          <Line key={`grid-v-${x}`} x1={x} y1="26" x2={x} y2="92" stroke="rgba(104,118,255,0.12)" strokeWidth="1" />
        ))}
        {[34, 50, 66, 82].map((y) => (
          <Line key={`grid-h-${y}`} x1="232" y1={y} x2="342" y2={y} stroke="rgba(104,118,255,0.10)" strokeWidth="1" />
        ))}
        {[236, 252, 268, 284, 300, 316, 332].flatMap((x) => [34, 50, 66, 82].map((y) => (
          <Circle key={`dot-${x}-${y}`} cx={x} cy={y} r="1.8" fill="rgba(80,92,230,0.18)" />
        )))}
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Path
            key={`wave-${index}`}
            d={`M214 ${150 + index * 8} C250 ${126 + index * 2}, 284 ${104 + index * 4}, 358 ${108 + index * 9}`}
            fill="none"
            stroke="rgba(82,64,255,0.18)"
            strokeWidth="1.2"
          />
        ))}
        <Path d="M18 166 C76 140, 132 152, 182 126 S250 82, 332 108" fill="none" stroke="rgba(32,199,232,0.18)" strokeWidth="5" strokeLinecap="round" />
      </Svg>
      <View style={styles.courseHeroContent}>
        <View style={styles.courseHeroTop}>
          <View style={styles.courseHeroMark}>
            <Zap size={25} color="#8af8ff" fill="#8af8ff" />
          </View>
          <View style={styles.courseHeroDivider} />
          <View style={styles.courseHeroEyebrowWrap}>
            <Text style={styles.courseHeroEyebrow}>Ders Rotası</Text>
            <Text style={styles.courseHeroMeta}>{metrics[1] ?? 'Seviye'} seviye</Text>
          </View>
          <CourseProgressBadge progress={clampedProgress} />
        </View>
        <View style={styles.courseHeroCopy}>
          <Text style={styles.courseHeroTitle}>{title}</Text>
          <Text style={styles.courseHeroSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.courseMetricRow}>
          {metrics.map((metric) => <MetricChip key={metric} label={metric} />)}
        </View>
      </View>
    </VisualFrame>
  );
}

export function TargetVisual({ height = 190 }: HeightProp) {
  return (
    <View style={[styles.targetVisual, { height }]}>
      <View style={styles.targetRings}>
        <View style={styles.targetRingMid}>
          <View style={styles.targetRingInner}>
            <Target size={54} color={colors.surface} strokeWidth={2.7} />
          </View>
        </View>
      </View>
      <View style={[styles.orbitDot, styles.orbitDotBlue]} />
      <View style={[styles.orbitDot, styles.orbitDotGreen]} />
      <View style={[styles.orbitDot, styles.orbitDotPurple]} />
    </View>
  );
}

export function MentorRobotVisual({ height = 245 }: HeightProp) {
  return (
    <VisualFrame height={height}>
      <View style={styles.robotHalo} />
      <View style={styles.robotHead}>
        <View style={styles.robotAntenna} />
        <Bot size={70} color={colors.primary} strokeWidth={2.1} />
        <View style={styles.robotSignal}>
          <Sparkles size={22} color={colors.purple} />
        </View>
      </View>
      <View style={styles.robotBody}>
        <Text style={styles.robotBodyTitle}>Mentor hazir</Text>
        <Text style={styles.robotBodyCaption}>Kod, quiz ve ders sorulari</Text>
      </View>
    </VisualFrame>
  );
}

export function LevelBadgeVisual({ height = 210 }: HeightProp) {
  return (
    <View style={[styles.levelVisual, { height }]}>
      <View style={styles.levelRibbonLeft} />
      <View style={styles.levelRibbonRight} />
      <LinearGradient colors={['#ffd76a', '#f5a524']} style={styles.levelMedal}>
        <ShieldCheck size={62} color={colors.surface} strokeWidth={2.4} />
        <Text style={styles.levelMedalText}>ORTA</Text>
      </LinearGradient>
      <View style={styles.levelSparkA}><Star size={18} color="#ffd76a" fill="#ffd76a" /></View>
      <View style={styles.levelSparkB}><Sparkles size={22} color="#20c7e8" /></View>
    </View>
  );
}

export function CertificateVisual() {
  return (
    <View style={styles.certificateVisual}>
      <View style={styles.certHeader}>
        <BrandMark size={42} />
        <View>
          <Text style={styles.certKicker}>AI Engineering Academy</Text>
          <Text style={styles.certTitle}>Certificate</Text>
        </View>
      </View>
      <View style={styles.certRule} />
      <Text style={styles.certName}>Baki</Text>
      <Text style={styles.certBody}>Neural Networks 101 egitimini basariyla tamamladi.</Text>
      <View style={styles.certFooter}>
        <View>
          <View style={styles.signatureLine} />
          <Text style={styles.certSmall}>Instructor</Text>
        </View>
        <View style={styles.certSeal}>
          <Award size={34} color={colors.surface} />
        </View>
      </View>
    </View>
  );
}

export function LeagueMedalVisual() {
  return (
    <View style={styles.leagueVisual}>
      <Svg width="100%" height="100%" viewBox="0 0 310 94" style={StyleSheet.absoluteFill}>
        <Circle cx="155" cy="46" r="66" fill="rgba(245,165,36,0.16)" />
        <Circle cx="155" cy="46" r="42" fill="rgba(245,165,36,0.22)" />
        <Line x1="40" y1="76" x2="270" y2="22" stroke="rgba(255,255,255,0.16)" strokeWidth="2" />
      </Svg>
      <LinearGradient colors={['#ffd76a', '#f5a524']} style={styles.leagueMedal}>
        <Trophy size={54} color={colors.surface} strokeWidth={2.5} />
      </LinearGradient>
      <View style={styles.leagueStarA}><Star size={18} color="#ffd76a" fill="#ffd76a" /></View>
      <View style={styles.leagueStarB}><Star size={14} color="#ffffff" fill="#ffffff" /></View>
    </View>
  );
}

export function SeasonRewardVisual({ height = 180 }: HeightProp) {
  return (
    <VisualFrame height={height} dark>
      <View style={styles.rewardPodium}>
        <View style={[styles.podiumBlock, styles.podiumSide]}>
          <Text style={styles.podiumRank}>2</Text>
        </View>
        <View style={[styles.podiumBlock, styles.podiumCenter]}>
          <Trophy size={52} color="#ffd76a" fill="#ffd76a" />
          <Text style={styles.podiumRank}>1</Text>
        </View>
        <View style={[styles.podiumBlock, styles.podiumSide]}>
          <Text style={styles.podiumRank}>3</Text>
        </View>
      </View>
      <View style={styles.rewardStars}>
        {[0, 1, 2, 3].map((item) => (
          <Star key={item} size={18 + item * 2} color="#ffd76a" fill="#ffd76a" />
        ))}
      </View>
    </VisualFrame>
  );
}

export function CourseThumbVisual() {
  return (
    <LinearGradient colors={['#071537', '#0b66f5']} style={styles.courseThumb}>
      <BookOpen size={28} color={colors.surface} />
      <View style={styles.courseThumbPlay}>
        <Play size={14} color={colors.primary} fill={colors.primary} />
      </View>
    </LinearGradient>
  );
}

function VisualFrame({ children, dark = false, height }: HeightProp & { children: React.ReactNode; dark?: boolean }) {
  return (
    <LinearGradient
      colors={dark ? ['#020b2b', '#111a64'] : ['#ffffff', '#eef4ff']}
      style={[styles.visualFrame, { height }, dark && styles.visualFrameDark]}
    >
      {children}
    </LinearGradient>
  );
}

function MetricChip({ label }: { label: string }) {
  return (
    <View style={styles.metricChip}>
      <View style={styles.metricCheck}>
        <Check size={17} color="#3cf5de" strokeWidth={3} />
      </View>
      <Text style={styles.metricChipText}>{label}</Text>
    </View>
  );
}

function CourseProgressBadge({ progress }: { progress: number }) {
  const radiusValue = 15;
  const circumference = 2 * Math.PI * radiusValue;
  const dashOffset = circumference - (circumference * progress) / 100;

  return (
    <View style={styles.courseProgressBadge}>
      <Svg width="30" height="30" viewBox="0 0 38 38">
        <Circle cx="19" cy="19" r={radiusValue} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
        <Circle
          cx="19"
          cy="19"
          r={radiusValue}
          fill="none"
          stroke="#6f63ff"
          strokeWidth="4"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin="19, 19"
        />
      </Svg>
      <Text style={styles.courseProgressBadgeText}>%{progress}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brandMark: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow,
  },
  visualFrame: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
  },
  visualFrameDark: {
    borderColor: 'rgba(119,112,255,0.48)',
  },
  heroGlassCard: {
    minWidth: 230,
    minHeight: 86,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  visualWhiteTitle: {
    color: colors.surface,
    fontWeight: '900',
    fontSize: 18,
  },
  visualWhiteCaption: {
    color: '#c9d4ff',
    fontWeight: '700',
    fontSize: 12,
    marginTop: 2,
  },
  heroStatus: {
    marginLeft: 'auto',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 5,
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatusText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900',
  },
  heroCodePanel: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.lg,
  },
  codePill: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  codePillText: {
    color: '#9fe7c2',
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '800',
  },
  courseHeroContent: {
    width: '100%',
    alignSelf: 'stretch',
    gap: spacing.sm,
    justifyContent: 'space-between',
    flex: 1,
  },
  courseHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  courseHeroMark: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#0b25c8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(142,150,255,0.65)',
  },
  courseHeroDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginHorizontal: 3,
  },
  courseHeroEyebrowWrap: {
    flex: 1,
  },
  courseHeroEyebrow: {
    color: '#68dcff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  courseHeroMeta: {
    color: '#d8dcff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  courseProgressBadge: {
    minWidth: 72,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    flexDirection: 'row',
    gap: 7,
  },
  courseProgressBadgeText: {
    color: colors.surface,
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 0,
  },
  courseHeroCopy: {
    maxWidth: 336,
  },
  courseHeroTitle: {
    color: colors.surface,
    fontWeight: '900',
    fontSize: 22,
    lineHeight: 27,
  },
  courseHeroSubtitle: {
    color: '#cfd4f4',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  courseMetricRow: {
    width: '100%',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.17)',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  metricCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(7,21,55,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricChipText: {
    color: colors.surface,
    fontWeight: '800',
    fontSize: 12,
  },
  targetVisual: {
    width: 230,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetRings: {
    width: 174,
    height: 174,
    borderRadius: 87,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 16,
    borderColor: '#d7e6ff',
  },
  targetRingMid: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 13,
    borderColor: colors.cyan,
  },
  targetRingInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitDot: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 4,
    borderColor: colors.surface,
  },
  orbitDotBlue: {
    left: 16,
    top: 28,
    backgroundColor: colors.primary,
  },
  orbitDotGreen: {
    right: 20,
    top: 62,
    backgroundColor: colors.green,
  },
  orbitDotPurple: {
    left: 52,
    bottom: 12,
    backgroundColor: colors.purple,
  },
  robotHalo: {
    position: 'absolute',
    width: 178,
    height: 178,
    borderRadius: 89,
    backgroundColor: colors.primarySoft,
  },
  robotHead: {
    width: 132,
    height: 118,
    borderRadius: 34,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#cfe0ff',
    ...shadow,
  },
  robotAntenna: {
    position: 'absolute',
    top: -22,
    width: 3,
    height: 24,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  robotSignal: {
    position: 'absolute',
    right: -14,
    top: -12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  robotBody: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  robotBodyTitle: {
    color: colors.surface,
    fontWeight: '900',
  },
  robotBodyCaption: {
    color: '#d8e6ff',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  levelVisual: {
    width: 230,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelMedal: {
    width: 138,
    height: 138,
    borderRadius: 69,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 7,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  levelMedalText: {
    color: colors.surface,
    fontWeight: '900',
    fontSize: 18,
    marginTop: 4,
  },
  levelRibbonLeft: {
    position: 'absolute',
    bottom: 24,
    left: 56,
    width: 46,
    height: 78,
    borderRadius: 12,
    backgroundColor: colors.primary,
    transform: [{ rotate: '18deg' }],
  },
  levelRibbonRight: {
    position: 'absolute',
    bottom: 24,
    right: 56,
    width: 46,
    height: 78,
    borderRadius: 12,
    backgroundColor: colors.purple,
    transform: [{ rotate: '-18deg' }],
  },
  levelSparkA: {
    position: 'absolute',
    right: 22,
    top: 32,
  },
  levelSparkB: {
    position: 'absolute',
    left: 18,
    top: 56,
  },
  certificateVisual: {
    width: '100%',
    minHeight: 318,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderWidth: 7,
    borderColor: '#d8e6ff',
  },
  certHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  certKicker: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  certTitle: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 31,
  },
  certRule: {
    height: 2,
    backgroundColor: colors.line,
    marginVertical: spacing.lg,
  },
  certName: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  certBody: {
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: spacing.md,
  },
  certFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  signatureLine: {
    width: 104,
    height: 2,
    backgroundColor: colors.ink,
  },
  certSmall: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 5,
  },
  certSeal: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueVisual: {
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  leagueMedal: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  leagueStarA: {
    position: 'absolute',
    left: 76,
    top: 22,
  },
  leagueStarB: {
    position: 'absolute',
    right: 78,
    bottom: 18,
  },
  rewardPodium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  podiumBlock: {
    width: 70,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumCenter: {
    height: 112,
  },
  podiumSide: {
    height: 78,
  },
  podiumRank: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: '900',
  },
  rewardStars: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  courseThumb: {
    width: 92,
    height: 86,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  courseThumbPlay: {
    position: 'absolute',
    right: 9,
    bottom: 9,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
