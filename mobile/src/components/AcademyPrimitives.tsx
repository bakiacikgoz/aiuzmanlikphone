import { router } from 'expo-router';
import type { ComponentType, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarChart3,
  ChevronLeft,
  Home,
  Map,
  Trophy,
  User,
} from 'lucide-react-native';

import { BrandMark } from './AcademyVisuals';
import { colors, radius, shadow, spacing } from '../theme';

export type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export function Screen({
  children,
  bottomTab,
  scroll = true,
}: {
  children: ReactNode;
  bottomTab?: 'home' | 'paths' | 'progress' | 'league' | 'profile';
  scroll?: boolean;
}) {
  const content = scroll ? (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.fixedContent}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.phone}>
        {content}
        {bottomTab ? <BottomNav active={bottomTab} /> : null}
      </View>
    </SafeAreaView>
  );
}

export function Header({
  title,
  subtitle,
  right,
  back = false,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  back?: boolean;
}) {
  return (
    <View style={styles.header}>
      {back ? (
        <IconButton icon={ChevronLeft} onPress={() => router.back()} />
      ) : (
        <View style={styles.headerSpacer} />
      )}
      <View style={styles.headerTitleWrap}>
        {title ? <Text style={styles.headerTitle}>{title}</Text> : null}
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

export function LogoTitle({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  return (
    <View style={[styles.logoRow, compact && styles.logoRowCompact]}>
      <BrandMark size={compact ? 52 : 84} dark={dark} />
      <View>
        <Text style={[styles.logoText, compact && styles.logoTextSmall, dark && styles.logoTextLight]}>AI Engineering</Text>
        <Text style={[styles.logoTextBlue, compact && styles.logoTextSmall]}>Academy</Text>
      </View>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function FeatureRow({
  icon: Icon,
  title,
  body,
  tone = 'primary',
}: {
  icon: IconType;
  title: string;
  body: string;
  tone?: 'primary' | 'purple' | 'green' | 'amber';
}) {
  const toneColor = tone === 'green' ? colors.green : tone === 'amber' ? colors.amber : tone === 'purple' ? colors.purple : colors.primary;
  return (
    <View style={styles.featureRow}>
      <View style={[styles.iconBubble, { backgroundColor: `${toneColor}18` }]}>
        <Icon size={27} color={toneColor} strokeWidth={2.6} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureBody}>{body}</Text>
      </View>
    </View>
  );
}

export function PrimaryButton({ title, onPress, icon, style }: { title: string; onPress?: () => void; icon?: ReactNode; style?: object }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.primaryButton, style, pressed && styles.pressed]}>
      <Text style={styles.primaryButtonText}>{title}</Text>
      {icon}
    </Pressable>
  );
}

export function OutlineButton({ title, onPress, icon, style }: { title: string; onPress?: () => void; icon?: ReactNode; style?: object }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.outlineButton, style, pressed && styles.pressed]}>
      {icon}
      <Text style={styles.outlineButtonText}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({ icon: Icon, onPress }: { icon: IconType; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <Icon size={22} color={colors.ink} strokeWidth={2.5} />
    </Pressable>
  );
}

export function ProgressBar({ value, color = colors.primary }: { value: number; color?: string }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }]} />
    </View>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function StatCard({ label, value, icon: Icon, tone = colors.primary }: { label: string; value: string; icon: IconType; tone?: string }) {
  return (
    <Card style={styles.statCard}>
      <Icon size={24} color={tone} strokeWidth={2.5} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

export function Pill({ label, tone = colors.primary }: { label: string; tone?: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: `${tone}18` }]}>
      <Text style={[styles.pillText, { color: tone }]}>{label}</Text>
    </View>
  );
}

function BottomNav({ active }: { active: 'home' | 'paths' | 'progress' | 'league' | 'profile' }) {
  const items: { key: typeof active; label: string; route: string; icon: IconType }[] = [
    { key: 'home', label: 'Ana Sayfa', route: '/dashboard', icon: Home },
    { key: 'paths', label: 'Yollar', route: '/paths', icon: Map },
    { key: 'progress', label: 'Ilerleme', route: '/progress', icon: BarChart3 },
    { key: 'league', label: 'Lig', route: '/league', icon: Trophy },
    { key: 'profile', label: 'Profil', route: '/profile', icon: User },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const Icon = item.icon;
        const selected = item.key === active;
        return (
          <Pressable key={item.key} onPress={() => router.push(item.route)} style={styles.navItem}>
            <Icon size={22} color={selected ? colors.primary : '#8b96ad'} strokeWidth={2.4} />
            <Text style={[styles.navLabel, selected && styles.navLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create<Record<string, any>>({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'flex-start',
  },
  phone: {
    flex: 1,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 104,
  },
  fixedContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerSpacer: {
    width: 44,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    width: 44,
    alignItems: 'flex-end',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoRowCompact: {
    gap: 10,
    justifyContent: 'center',
  },
  logoText: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 36,
  },
  logoTextBlue: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 36,
  },
  logoTextLight: {
    color: colors.surface,
  },
  logoTextSmall: {
    fontSize: 23,
    lineHeight: 27,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  iconBubble: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  featureBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '800',
  },
  outlineButton: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.surface,
  },
  outlineButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  progressTrack: {
    height: 8,
    borderRadius: 99,
    backgroundColor: '#e7ebf5',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
  sectionTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeading: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 3,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  statValue: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  pillText: {
    fontWeight: '800',
    fontSize: 12,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 78,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  navLabel: {
    color: '#8b96ad',
    fontSize: 10,
    fontWeight: '700',
  },
  navLabelActive: {
    color: colors.primary,
  },
});
