import LottieView from 'lottie-react-native';
import { router } from 'expo-router';
import { Award, ChevronRight, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import {
  celebrationSparklesLottie,
  getCelebrationActionLabel,
  getCelebrationArtwork,
} from './catalog';
import type { CelebrationEvent } from './types';
import { colors, radius, spacing } from '../theme';

export function CelebrationOverlay({
  event,
  visible,
  onDismiss,
}: {
  event: CelebrationEvent | null;
  visible: boolean;
  onDismiss: () => void;
}) {
  const { width } = useWindowDimensions();
  const reduceMotion = useReduceMotionPreference();
  const backdrop = useSharedValue(0);
  const card = useSharedValue(0);
  const copy = useSharedValue(0);
  const artwork = useMemo(() => (event ? getCelebrationArtwork(event) : null), [event]);

  useEffect(() => {
    const target = visible ? 1 : 0;
    const duration = reduceMotion ? 1 : 420;
    backdrop.value = withTiming(target, { duration, easing: Easing.out(Easing.cubic) });
    card.value = withTiming(target, { duration: reduceMotion ? 1 : 520, easing: Easing.out(Easing.exp) });
    copy.value = visible
      ? withDelay(reduceMotion ? 0 : 180, withTiming(1, { duration: reduceMotion ? 1 : 360, easing: Easing.out(Easing.cubic) }))
      : withTiming(0, { duration: reduceMotion ? 1 : 120 });
  }, [backdrop, card, copy, reduceMotion, visible, event?.id]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: card.value,
    transform: [
      { translateY: (1 - card.value) * 26 },
      { scale: 0.9 + card.value * 0.1 },
    ],
  }));

  const copyStyle = useAnimatedStyle(() => ({
    opacity: copy.value,
    transform: [{ translateY: (1 - copy.value) * 12 }],
  }));

  if (!event || !artwork) return null;

  function close() {
    onDismiss();
  }

  function continueFromCelebration() {
    const targetRoute = event?.targetRoute;
    onDismiss();
    if (targetRoute) {
      requestAnimationFrame(() => router.push(targetRoute as never));
    }
  }

  const compact = width < 380;
  const actionLabel = getCelebrationActionLabel(event);
  const showLeagueTransition = Boolean(artwork.secondary && (event.type === 'league_promotion' || event.type === 'league_demotion'));

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={close}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        {!reduceMotion && Platform.OS !== 'web' ? (
          <LottieView source={celebrationSparklesLottie} autoPlay loop style={styles.lottieLayer} />
        ) : null}
        <Animated.View style={[styles.panel, compact && styles.panelCompact, cardStyle, { borderColor: artwork.accent }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Kutlamayı kapat" onPress={close} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <X size={22} color={colors.inverseText} strokeWidth={2.5} />
          </Pressable>
          <View style={[styles.kicker, { backgroundColor: `${artwork.accent}24` }]}>
            <Award size={17} color={artwork.accent} strokeWidth={2.7} />
            <Text style={[styles.kickerText, { color: artwork.accent }]}>Başarı Açıldı</Text>
          </View>
          <View style={styles.artStage}>
            {showLeagueTransition ? (
              <View style={styles.leagueTransition}>
                <Image source={artwork.secondary} style={[styles.tierImage, styles.tierImagePrevious]} resizeMode="contain" />
                <ChevronRight size={34} color={artwork.accent} strokeWidth={3} />
                <Image source={artwork.primary} style={styles.tierImage} resizeMode="contain" />
              </View>
            ) : (
              <Image source={artwork.primary} style={[styles.heroImage, compact && styles.heroImageCompact]} resizeMode="contain" />
            )}
          </View>
          <Animated.View style={[styles.copyBlock, copyStyle]}>
            <Text style={styles.title}>{event.title}</Text>
            <Text style={styles.body}>{event.body}</Text>
            {typeof event.points === 'number' ? <Text style={[styles.points, { color: artwork.accent }]}>+{event.points.toLocaleString('tr-TR')} puan</Text> : null}
          </Animated.View>
          <View style={styles.actionRow}>
            <Pressable accessibilityRole="button" onPress={continueFromCelebration} style={({ pressed }) => [styles.primaryAction, { backgroundColor: artwork.accent }, pressed && styles.pressed]}>
              <Text style={styles.primaryActionText}>{actionLabel}</Text>
              <ChevronRight size={22} color={colors.inverseText} strokeWidth={2.8} />
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function useReduceMotionPreference() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 6, 8, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  lottieLayer: {
    position: 'absolute',
    width: '120%',
    height: '120%',
  },
  panel: {
    width: '100%',
    maxWidth: 430,
    minHeight: 610,
    borderRadius: 26,
    borderWidth: 1.5,
    backgroundColor: '#101113',
    padding: spacing.lg,
    alignItems: 'center',
    overflow: 'hidden',
  },
  panelCompact: {
    minHeight: 560,
    paddingHorizontal: spacing.md,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 3,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  kicker: {
    minHeight: 34,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  kickerText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  artStage: {
    height: 270,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  heroImage: {
    width: 265,
    height: 265,
  },
  heroImageCompact: {
    width: 230,
    height: 230,
  },
  leagueTransition: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  tierImage: {
    width: 134,
    height: 134,
  },
  tierImagePrevious: {
    opacity: 0.5,
    transform: [{ scale: 0.82 }],
  },
  copyBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  title: {
    color: colors.inverseText,
    fontSize: 31,
    lineHeight: 38,
    fontWeight: '900',
    textAlign: 'center',
  },
  body: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  points: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    marginTop: 2,
  },
  actionRow: {
    width: '100%',
    marginTop: 'auto',
    paddingTop: spacing.xl,
  },
  primaryAction: {
    minHeight: 58,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryActionText: {
    color: colors.inverseText,
    fontSize: 16,
    fontWeight: '900',
  },
});
