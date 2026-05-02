import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  ChevronRight,
  Crown,
  Dice5,
  Eye,
  Glasses,
  Palette,
  Save,
  Scissors,
  Shirt,
  Shuffle,
  Smile,
  Sparkles,
} from 'lucide-react-native';

import { useAuth } from '../auth/AuthProvider';
import { Header, OutlineButton, PrimaryButton, Screen } from '../components/AcademyPrimitives';
import {
  accessoryChoices,
  avatarTabs,
  buildDiceBearAvatarUrl,
  clothingChoices,
  clothesColorChoices,
  createRandomAvatarConfig,
  defaultAvatarConfig,
  eyebrowChoices,
  eyeChoices,
  faceChoices,
  getSavedAvatarConfig,
  hairChoices,
  hairColorChoices,
  mouthChoices,
  presetChoices,
  saveAvatarConfig,
  withSeed,
  type AvatarChoice,
  type AvatarConfig,
  type AvatarTab,
} from '../lib/avatar';
import { getDisplayName } from '../lib/academyApi';
import {
  colors,
  radius,
  registerThemeStyles,
  spacing,
  ThemedStatusBar,
  type ThemeColors,
  useTheme,
} from '../theme';

const tabIcons = {
  face: Smile,
  hair: Scissors,
  eyes: Eye,
  clothing: Shirt,
  accessories: Glasses,
};

export function AvatarCreatorScreen() {
  useTheme();
  const { user } = useAuth();
  const displayName = getDisplayName(user);
  const [activeTab, setActiveTab] = useState<AvatarTab>('hair');
  const [config, setConfig] = useState<AvatarConfig>(() => withSeed(defaultAvatarConfig, displayName));
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const avatarUrl = useMemo(() => buildDiceBearAvatarUrl(config, 256), [config]);

  useEffect(() => {
    let mounted = true;
    getSavedAvatarConfig().then((savedConfig) => {
      if (mounted && savedConfig) setConfig(savedConfig);
    });
    return () => {
      mounted = false;
    };
  }, []);

  function updateConfig(nextConfig: Partial<AvatarConfig>) {
    setConfig((currentConfig) => ({ ...currentConfig, ...nextConfig }));
    setSavedMessage(null);
  }

  async function saveAndContinue() {
    await saveAvatarConfig(config);
    setSavedMessage('Avatar kaydedildi.');
    router.replace('/profile');
  }

  function randomizeAvatar() {
    setConfig(createRandomAvatarConfig(displayName));
    setActiveTab('hair');
    setSavedMessage(null);
  }

  return (
    <Screen contentStyle={styles.screenContent}>
      <ThemedStatusBar />
      <Header
        title="Avatar Oluştur"
        subtitle="Kendine en uygun görünümü seç"
        back
        backFallback="/profile"
        right={
          <Pressable accessibilityRole="button" accessibilityLabel="Avatarı kaydet" onPress={saveAndContinue} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
            <Save size={24} color={colors.ink} strokeWidth={2.7} />
          </Pressable>
        }
      />

      <View style={styles.previewStage}>
        <View style={styles.avatarRing}>
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Rastgele avatar oluştur" onPress={randomizeAvatar} style={({ pressed }) => [styles.diceButton, pressed && styles.pressed]}>
          <Dice5 size={31} color={colors.primary} strokeWidth={2.5} />
          <Sparkles size={14} color={colors.primary} strokeWidth={3} style={styles.diceSparkTop} />
          <Sparkles size={11} color={colors.primary} strokeWidth={3} style={styles.diceSparkBottom} />
        </Pressable>
      </View>

      <View style={styles.seedPanel}>
        <Text style={styles.seedLabel}>Seed</Text>
        <TextInput
          value={config.seed}
          onChangeText={(seed) => updateConfig({ seed })}
          placeholder="Kullanıcı adı veya e-posta"
          placeholderTextColor={colors.muted}
          style={styles.seedInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.tabs}>
        {avatarTabs.map((tab) => {
          const Icon = tabIcons[tab.key];
          const selected = activeTab === tab.key;
          return (
            <Pressable key={tab.key} accessibilityRole="button" onPress={() => setActiveTab(tab.key)} style={({ pressed }) => [styles.tabButton, selected && styles.tabButtonActive, pressed && styles.pressed]}>
              <Icon size={22} color={selected ? colors.surface : colors.primary} strokeWidth={2.4} />
              <Text style={[styles.tabText, selected && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.editorPanel}>
        {activeTab === 'face' ? (
          <>
            <ChoiceHeader title="Ten Rengi" />
            <SwatchRow choices={faceChoices} selected={config.skinColor} onSelect={(skinColor) => updateConfig({ skinColor })} />
            <ChoiceHeader title="İfade" />
            <ChipRow choices={mouthChoices} selected={config.mouth} onSelect={(mouth) => updateConfig({ mouth })} />
          </>
        ) : null}

        {activeTab === 'hair' ? (
          <>
            <ChoiceHeader title="Saç Modeli" actionLabel="Tümünü Gör" />
            <AvatarPreviewRow config={config} choices={hairChoices} selected={config.top} onSelect={(top) => updateConfig({ top })} apply={(choice) => ({ top: choice.value })} />
            <ChoiceHeader title="Saç Rengi" />
            <SwatchRow choices={hairColorChoices} selected={config.hairColor} onSelect={(hairColor) => updateConfig({ hairColor })} />
          </>
        ) : null}

        {activeTab === 'eyes' ? (
          <>
            <ChoiceHeader title="Göz Modeli" />
            <AvatarPreviewRow config={config} choices={eyeChoices} selected={config.eyes} onSelect={(eyes) => updateConfig({ eyes })} apply={(choice) => ({ eyes: choice.value })} />
            <ChoiceHeader title="Kaş Modeli" />
            <ChipRow choices={eyebrowChoices} selected={config.eyebrows} onSelect={(eyebrows) => updateConfig({ eyebrows })} />
          </>
        ) : null}

        {activeTab === 'clothing' ? (
          <>
            <ChoiceHeader title="Kıyafet" />
            <AvatarPreviewRow config={config} choices={clothingChoices} selected={config.clothing} onSelect={(clothing) => updateConfig({ clothing })} apply={(choice) => ({ clothing: choice.value })} />
            <ChoiceHeader title="Kıyafet Rengi" />
            <SwatchRow choices={clothesColorChoices} selected={config.clothesColor} onSelect={(clothesColor) => updateConfig({ clothesColor })} />
          </>
        ) : null}

        {activeTab === 'accessories' ? (
          <>
            <ChoiceHeader title="Aksesuar" />
            <AvatarPreviewRow config={config} choices={accessoryChoices} selected={config.accessories} onSelect={(accessories) => updateConfig({ accessories })} apply={(choice) => ({ accessories: choice.value })} />
          </>
        ) : null}

        <ChoiceHeader title="Stil" />
        <View style={styles.presetGrid}>
          {presetChoices.map((preset) => {
            const selected = config.preset === preset.value;
            return (
              <Pressable
                key={preset.value}
                accessibilityRole="button"
                onPress={() => updateConfig({ preset: preset.value, backgroundColor: preset.preview?.replace('#', '') ?? config.backgroundColor })}
                style={({ pressed }) => [styles.presetButton, selected && styles.presetButtonActive, pressed && styles.pressed]}
              >
                {preset.value === 'minimal' ? <Sparkles size={22} color={colors.primary} /> : null}
                {preset.value === 'energetic' ? <Shuffle size={22} color={colors.primary} /> : null}
                {preset.value === 'classic' ? <Crown size={22} color={colors.primary} /> : null}
                {preset.value === 'colorful' ? <Palette size={22} color={colors.primary} /> : null}
                <Text style={[styles.presetText, selected && styles.presetTextActive]}>{preset.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {savedMessage ? <Text style={styles.savedMessage}>{savedMessage}</Text> : null}

      <View style={styles.footerActions}>
        <OutlineButton title="Rastgele Oluştur" onPress={randomizeAvatar} icon={<Shuffle size={25} color={colors.primary} strokeWidth={2.6} />} style={styles.actionButton} />
        <PrimaryButton title="Devam Et" onPress={saveAndContinue} icon={<ChevronRight size={27} color={colors.surface} strokeWidth={2.7} />} style={styles.actionButton} />
      </View>
    </Screen>
  );
}

function ChoiceHeader({ title, actionLabel }: { title: string; actionLabel?: string }) {
  return (
    <View style={styles.choiceHeader}>
      <Text style={styles.choiceTitle}>{title}</Text>
      {actionLabel ? (
        <View style={styles.choiceAction}>
          <Text style={styles.choiceActionText}>{actionLabel}</Text>
          <ChevronRight size={22} color={colors.primary} strokeWidth={2.7} />
        </View>
      ) : null}
    </View>
  );
}

function AvatarPreviewRow({
  config,
  choices,
  selected,
  onSelect,
  apply,
}: {
  config: AvatarConfig;
  choices: AvatarChoice[];
  selected: string;
  onSelect: (value: string) => void;
  apply: (choice: AvatarChoice) => Partial<AvatarConfig>;
}) {
  return (
    <View style={styles.previewRow}>
      {choices.map((choice) => {
        const active = selected === choice.value;
        const previewConfig = { ...config, ...apply(choice) };
        return (
          <Pressable key={choice.value} accessibilityRole="button" accessibilityLabel={choice.label} onPress={() => onSelect(choice.value)} style={({ pressed }) => [styles.previewTile, active && styles.previewTileActive, pressed && styles.pressed]}>
            <Image source={{ uri: buildDiceBearAvatarUrl(previewConfig, 96) }} style={styles.previewImage} resizeMode="cover" />
          </Pressable>
        );
      })}
    </View>
  );
}

function SwatchRow({ choices, selected, onSelect }: { choices: AvatarChoice[]; selected: string; onSelect: (value: string) => void }) {
  return (
    <View style={styles.swatchRow}>
      {choices.map((choice) => {
        const active = selected === choice.value;
        return (
          <Pressable key={choice.value} accessibilityRole="button" accessibilityLabel={choice.label} onPress={() => onSelect(choice.value)} style={({ pressed }) => [styles.swatchOuter, active && styles.swatchOuterActive, pressed && styles.pressed]}>
            <View style={[styles.swatch, { backgroundColor: choice.preview ?? `#${choice.value}` }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

function ChipRow({ choices, selected, onSelect }: { choices: AvatarChoice[]; selected: string; onSelect: (value: string) => void }) {
  return (
    <View style={styles.chipRow}>
      {choices.map((choice) => {
        const active = selected === choice.value;
        return (
          <Pressable key={choice.value} accessibilityRole="button" onPress={() => onSelect(choice.value)} style={({ pressed }) => [styles.chipButton, active && styles.chipButtonActive, pressed && styles.pressed]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{choice.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(themeColors: ThemeColors) {
  const colors = themeColors;

  return StyleSheet.create<Record<string, any>>({
  screenContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: colors.surfaceSoft,
    gap: spacing.md,
  },
  saveButton: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewStage: {
    minHeight: 326,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarRing: {
    width: 263,
    height: 263,
    borderRadius: 132,
    borderWidth: 8,
    borderColor: colors.surface,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  diceButton: {
    position: 'absolute',
    right: 58,
    bottom: 28,
    width: 78,
    height: 78,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  diceSparkTop: {
    position: 'absolute',
    top: 15,
    right: 20,
  },
  diceSparkBottom: {
    position: 'absolute',
    right: 12,
    bottom: 24,
  },
  seedPanel: {
    minHeight: 72,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  seedLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  seedInput: {
    color: colors.ink,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    padding: 0,
  },
  tabs: {
    minHeight: 84,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 9,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 60,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 4,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  tabTextActive: {
    color: colors.surface,
  },
  editorPanel: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 17,
    gap: spacing.md,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  choiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  choiceTitle: {
    color: colors.ink,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
  },
  choiceAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  choiceActionText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  previewRow: {
    flexDirection: 'row',
    gap: 11,
  },
  previewTile: {
    flex: 1,
    minWidth: 0,
    aspectRatio: 1,
    borderRadius: 17,
    borderWidth: 1.3,
    borderColor: colors.line,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewTileActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  swatchOuter: {
    width: 47,
    height: 47,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  swatchOuterActive: {
    borderColor: colors.primary,
  },
  swatch: {
    width: 35,
    height: 35,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipButton: {
    minHeight: 43,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  chipButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  chipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  chipTextActive: {
    color: colors.primary,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 11,
  },
  presetButton: {
    width: '48%',
    minHeight: 55,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  presetButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  presetText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  presetTextActive: {
    color: colors.primary,
  },
  footerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    minHeight: 62,
  },
  savedMessage: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.74,
  },
  });
}

let styles = createStyles(colors);

registerThemeStyles((nextColors) => {
  styles = createStyles(nextColors);
});
