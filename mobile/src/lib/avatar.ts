import AsyncStorage from '@react-native-async-storage/async-storage';

export const AVATAR_STORAGE_KEY = 'academy:selectedAvatar';

export type AvatarTab = 'face' | 'hair' | 'eyes' | 'clothing' | 'accessories';

export type AvatarConfig = {
  seed: string;
  skinColor: string;
  mouth: string;
  top: string;
  hairColor: string;
  eyes: string;
  eyebrows: string;
  clothing: string;
  clothesColor: string;
  accessories: string;
  backgroundColor: string;
  preset: string;
};

export type AvatarChoice = {
  label: string;
  value: string;
  preview?: string;
};

export const avatarTabs: { key: AvatarTab; label: string }[] = [
  { key: 'face', label: 'Yüz' },
  { key: 'hair', label: 'Saç' },
  { key: 'eyes', label: 'Göz' },
  { key: 'clothing', label: 'Kıyafet' },
  { key: 'accessories', label: 'Aksesuar' },
];

export const hairChoices: AvatarChoice[] = [
  { label: 'Dağınık', value: 'shaggy' },
  { label: 'Kısa', value: 'shortRound' },
  { label: 'Dalgalı', value: 'shortWaved' },
  { label: 'Kıvırcık', value: 'curly' },
  { label: 'Bob', value: 'bob' },
  { label: 'Topuz', value: 'bun' },
];

export const hairColorChoices: AvatarChoice[] = [
  { label: 'Kahve', value: '2c1b18', preview: '#2c1b18' },
  { label: 'Kestane', value: '724133', preview: '#724133' },
  { label: 'Kumral', value: 'a55728', preview: '#a55728' },
  { label: 'Siyah', value: '262e33', preview: '#262e33' },
  { label: 'Bakır', value: 'c93305', preview: '#c93305' },
  { label: 'Sarı', value: 'd6b370', preview: '#d6b370' },
];

export const faceChoices: AvatarChoice[] = [
  { label: 'Açık', value: 'edb98a', preview: '#edb98a' },
  { label: 'Buğday', value: 'd08b5b', preview: '#d08b5b' },
  { label: 'Sıcak', value: 'ae5d29', preview: '#ae5d29' },
  { label: 'Koyu', value: '614335', preview: '#614335' },
];

export const mouthChoices: AvatarChoice[] = [
  { label: 'Gülümse', value: 'smile' },
  { label: 'Rahat', value: 'default' },
  { label: 'Mutlu', value: 'twinkle' },
  { label: 'Sakin', value: 'serious' },
];

export const eyeChoices: AvatarChoice[] = [
  { label: 'Canlı', value: 'happy' },
  { label: 'Normal', value: 'default' },
  { label: 'Parlak', value: 'hearts' },
  { label: 'Odaklı', value: 'squint' },
  { label: 'Rahat', value: 'closed' },
];

export const eyebrowChoices: AvatarChoice[] = [
  { label: 'Doğal', value: 'default' },
  { label: 'Yumuşak', value: 'defaultNatural' },
  { label: 'Meraklı', value: 'raisedExcited' },
  { label: 'Odaklı', value: 'upDown' },
];

export const clothingChoices: AvatarChoice[] = [
  { label: 'Hoodie', value: 'hoodie' },
  { label: 'Blazer', value: 'blazerAndShirt' },
  { label: 'Kazak', value: 'collarAndSweater' },
  { label: 'Tişört', value: 'shirtCrewNeck' },
  { label: 'Grafik', value: 'graphicShirt' },
];

export const clothesColorChoices: AvatarChoice[] = [
  { label: 'Lacivert', value: '25557c', preview: '#25557c' },
  { label: 'Mavi', value: '65c9ff', preview: '#65c9ff' },
  { label: 'Yeşil', value: '3c4f5c', preview: '#3c4f5c' },
  { label: 'Kırmızı', value: 'ff5c5c', preview: '#ff5c5c' },
  { label: 'Beyaz', value: 'ffffff', preview: '#ffffff' },
];

export const accessoryChoices: AvatarChoice[] = [
  { label: 'Yok', value: 'none' },
  { label: 'Yuvarlak', value: 'round' },
  { label: 'Klasik', value: 'prescription01' },
  { label: 'Güneş', value: 'sunglasses' },
  { label: 'Kurt', value: 'kurt' },
];

export const presetChoices: AvatarChoice[] = [
  { label: 'Minimal', value: 'minimal', preview: '#f2f6ff' },
  { label: 'Enerjik', value: 'energetic', preview: '#ffd5dc' },
  { label: 'Klasik', value: 'classic', preview: '#d1d4f9' },
  { label: 'Renkli', value: 'colorful', preview: '#b6e3f4' },
];

export const defaultAvatarConfig: AvatarConfig = {
  seed: 'AI Uzmanlik',
  skinColor: 'edb98a',
  mouth: 'smile',
  top: 'shaggy',
  hairColor: '2c1b18',
  eyes: 'happy',
  eyebrows: 'defaultNatural',
  clothing: 'hoodie',
  clothesColor: '25557c',
  accessories: 'none',
  backgroundColor: 'f2f6ff',
  preset: 'minimal',
};

const presetBackgrounds: Record<string, string> = {
  minimal: 'f2f6ff',
  energetic: 'ffd5dc',
  classic: 'd1d4f9',
  colorful: 'b6e3f4',
};

function encodeParams(params: Record<string, string | number>) {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

export function buildDiceBearAvatarUrl(config: AvatarConfig, size = 256) {
  const backgroundColor = presetBackgrounds[config.preset] ?? config.backgroundColor;
  const params: Record<string, string | number> = {
    seed: config.seed,
    size,
    radius: 50,
    backgroundColor,
    skinColor: config.skinColor,
    mouth: config.mouth,
    top: config.top,
    hairColor: config.hairColor,
    eyes: config.eyes,
    eyebrows: config.eyebrows,
    clothing: config.clothing,
    clothesColor: config.clothesColor,
    facialHairProbability: 0,
    accessoriesProbability: config.accessories === 'none' ? 0 : 100,
  };

  if (config.accessories !== 'none') {
    params.accessories = config.accessories;
  }

  return `https://api.dicebear.com/9.x/avataaars/png?${encodeParams(params)}`;
}

export function withSeed(config: AvatarConfig, seed: string): AvatarConfig {
  return { ...config, seed: seed.trim() || defaultAvatarConfig.seed };
}

export function createRandomAvatarConfig(seedBase = 'avatar'): AvatarConfig {
  const pick = (choices: AvatarChoice[]) => choices[Math.floor(Math.random() * choices.length)].value;
  const preset = pick(presetChoices);
  return {
    seed: `${seedBase}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    skinColor: pick(faceChoices),
    mouth: pick(mouthChoices),
    top: pick(hairChoices),
    hairColor: pick(hairColorChoices),
    eyes: pick(eyeChoices),
    eyebrows: pick(eyebrowChoices),
    clothing: pick(clothingChoices),
    clothesColor: pick(clothesColorChoices),
    accessories: pick(accessoryChoices),
    backgroundColor: presetBackgrounds[preset],
    preset,
  };
}

export async function getSavedAvatarConfig() {
  const rawConfig = await AsyncStorage.getItem(AVATAR_STORAGE_KEY);
  if (!rawConfig) return null;

  try {
    return { ...defaultAvatarConfig, ...JSON.parse(rawConfig) } as AvatarConfig;
  } catch {
    return null;
  }
}

export async function saveAvatarConfig(config: AvatarConfig) {
  await AsyncStorage.setItem(AVATAR_STORAGE_KEY, JSON.stringify(config));
}
