import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ThemeName = 'light' | 'dark';

export type ThemeColors = {
  ink: string;
  text: string;
  muted: string;
  faint: string;
  line: string;
  surface: string;
  surfaceSoft: string;
  surfaceMuted: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  purple: string;
  purpleSoft: string;
  cyan: string;
  green: string;
  greenSoft: string;
  amber: string;
  amberSoft: string;
  red: string;
  redSoft: string;
  overlay: string;
  inverseText: string;
};

export type ThemeShadow = {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  elevation: number;
};

const THEME_STORAGE_KEY = 'academy.themePreference';

export const lightColors: ThemeColors = {
  ink: '#111111',
  text: '#242424',
  muted: '#6f6f6f',
  faint: '#f3f4f6',
  line: '#e3e3e7',
  surface: '#ffffff',
  surfaceSoft: '#f7f7f8',
  surfaceMuted: '#eeeeef',
  primary: '#111111',
  primaryDark: '#050505',
  primarySoft: '#eeeeef',
  purple: '#4b4b4b',
  purpleSoft: '#efeff1',
  cyan: '#575757',
  green: '#25a866',
  greenSoft: '#eafaf1',
  amber: '#d99a11',
  amberSoft: '#fff7df',
  red: '#df3f51',
  redSoft: '#fff0f1',
  overlay: 'rgba(17,17,17,0.46)',
  inverseText: '#ffffff',
};

export const darkColors: ThemeColors = {
  ink: '#f5f5f5',
  text: '#e8e8e8',
  muted: '#a6a6ad',
  faint: '#202023',
  line: '#2f2f33',
  surface: '#141416',
  surfaceSoft: '#0b0b0c',
  surfaceMuted: '#1f1f22',
  primary: '#f5f5f5',
  primaryDark: '#050505',
  primarySoft: '#242427',
  purple: '#d4d4d8',
  purpleSoft: '#26262a',
  cyan: '#d1d5db',
  green: '#4fdf91',
  greenSoft: '#0d2b1b',
  amber: '#f3ba42',
  amberSoft: '#32240a',
  red: '#ff6675',
  redSoft: '#351014',
  overlay: 'rgba(0,0,0,0.58)',
  inverseText: '#0b0b0c',
};

const lightShadow: ThemeShadow = {
  shadowColor: '#111111',
  shadowOpacity: 0.1,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 5,
};

const darkShadow: ThemeShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.28,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 5,
};

export const semanticColors = {
  success: lightColors.green,
  successSoft: lightColors.greenSoft,
  warning: lightColors.amber,
  warningSoft: lightColors.amberSoft,
  danger: lightColors.red,
  dangerSoft: lightColors.redSoft,
};

export const colors: ThemeColors = { ...lightColors };
export const shadow: ThemeShadow = { ...lightShadow };

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
};

type ThemeStyleUpdater = (nextColors: ThemeColors, nextShadow: ThemeShadow) => void;
const themeStyleUpdaters = new Set<ThemeStyleUpdater>();
let activeThemeName: ThemeName = 'light';

function resolveColors(themeName: ThemeName) {
  return themeName === 'dark'
    ? { nextColors: darkColors, nextShadow: darkShadow }
    : { nextColors: lightColors, nextShadow: lightShadow };
}

function applyTheme(themeName: ThemeName) {
  if (activeThemeName === themeName) return;
  activeThemeName = themeName;
  const { nextColors, nextShadow } = resolveColors(themeName);
  Object.assign(colors, nextColors);
  Object.assign(shadow, nextShadow);
  themeStyleUpdaters.forEach((updateStyles) => updateStyles(colors, shadow));
}

export function registerThemeStyles(updateStyles: ThemeStyleUpdater) {
  themeStyleUpdaters.add(updateStyles);
  updateStyles(colors, shadow);
  return () => {
    themeStyleUpdaters.delete(updateStyles);
  };
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

type ThemeContextValue = {
  colors: ThemeColors;
  shadow: ThemeShadow;
  spacing: typeof spacing;
  radius: typeof radius;
  themeName: ThemeName;
  preference: ThemePreference;
  setPreference: (nextPreference: ThemePreference) => Promise<void>;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const themeName: ThemeName = preference === 'system'
    ? systemScheme === 'dark'
      ? 'dark'
      : 'light'
    : preference;

  applyTheme(themeName);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((storedPreference) => {
        if (mounted && isThemePreference(storedPreference)) {
          setPreferenceState(storedPreference);
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const setPreference = useCallback(async (nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, nextPreference);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    colors,
    shadow,
    spacing,
    radius,
    themeName,
    preference,
    setPreference,
    isDark: themeName === 'dark',
  }), [preference, setPreference, themeName]);

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  const context = React.use(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export function useThemePreference() {
  const { preference, setPreference, themeName, isDark } = useTheme();
  return { preference, setPreference, themeName, isDark };
}

export function ThemedStatusBar() {
  const { themeName } = useTheme();
  return React.createElement(StatusBar, { style: themeName === 'dark' ? 'light' : 'dark' });
}
