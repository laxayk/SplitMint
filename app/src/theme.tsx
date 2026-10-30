import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeChoice = 'light' | 'dark' | 'system';

export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  positive: string;
  negative: string;
  border: string;
  danger: string;
}

export const lightPalette: Palette = {
  bg: '#F1F6F3',
  surface: '#FFFFFF',
  surfaceAlt: '#E3EEE9',
  text: '#0B1F1A',
  textMuted: '#566B64',
  accent: '#0F766E',
  accentText: '#FFFFFF',
  positive: '#0B9B68',
  negative: '#D6443A',
  border: '#D3E2DB',
  danger: '#D6443A',
};

export const darkPalette: Palette = {
  bg: '#09130F',
  surface: '#10201B',
  surfaceAlt: '#1A2E28',
  text: '#E8F5F0',
  textMuted: '#88A59B',
  accent: '#2DD4BF',
  accentText: '#04201B',
  positive: '#34D399',
  negative: '#F87171',
  border: '#223D36',
  danger: '#F87171',
};

interface ThemeState {
  choice: ThemeChoice;
  resolved: 'light' | 'dark';
  colors: Palette;
  setChoice: (c: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeState>({
  choice: 'system',
  resolved: 'light',
  colors: lightPalette,
  setChoice: () => {},
});

const STORAGE_KEY = 'splitmint.theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [choice, setChoiceState] = useState<ThemeChoice>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setChoiceState(v);
    });
  }, []);

  const setChoice = (c: ThemeChoice) => {
    setChoiceState(c);
    AsyncStorage.setItem(STORAGE_KEY, c);
  };

  const resolved = choice === 'system' ? system : choice;
  const colors = resolved === 'dark' ? darkPalette : lightPalette;

  const value = useMemo(() => ({ choice, resolved, colors, setChoice }), [choice, resolved]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
