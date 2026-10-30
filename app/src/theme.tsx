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
  bg: '#F4F5FA',
  surface: '#FFFFFF',
  surfaceAlt: '#ECEDF5',
  text: '#1B1D29',
  textMuted: '#6B6F82',
  accent: '#4A54C4',
  accentText: '#FFFFFF',
  positive: '#2E9E5B',
  negative: '#C44A4A',
  border: '#DDE0EC',
  danger: '#C44A4A',
};

export const darkPalette: Palette = {
  bg: '#14161F',
  surface: '#1E2130',
  surfaceAlt: '#272B3D',
  text: '#F2F3F8',
  textMuted: '#9BA0B5',
  accent: '#8F98FF',
  accentText: '#14161F',
  positive: '#4CC47C',
  negative: '#E07A7A',
  border: '#31364B',
  danger: '#E07A7A',
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
