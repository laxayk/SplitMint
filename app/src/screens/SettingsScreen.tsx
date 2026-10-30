import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { clearToken } from '../api';
import { Card, Screen, Title } from '../components/ui';
import { useTheme, type ThemeChoice } from '../theme';

interface Props {
  onSignedOut: () => void;
}

const CHOICES: { key: ThemeChoice; label: string }[] = [
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
  { key: 'system', label: 'Match phone' },
];

export default function SettingsScreen({ onSignedOut }: Props) {
  const { colors, choice, setChoice } = useTheme();

  return (
    <Screen>
      <Title>Settings</Title>
      <Card>
        <Text style={{ color: colors.textMuted, fontWeight: '600', marginBottom: 8 }}>Theme</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {CHOICES.map((c) => (
            <TouchableOpacity
              key={c.key}
              onPress={() => setChoice(c.key)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                backgroundColor: choice === c.key ? colors.accent : colors.surfaceAlt,
              }}
            >
              <Text style={{ color: choice === c.key ? colors.accentText : colors.text }}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
      <Card>
        <TouchableOpacity
          onPress={async () => {
            await clearToken();
            onSignedOut();
          }}
        >
          <Text style={{ color: colors.danger, fontWeight: '700' }}>Log out</Text>
        </TouchableOpacity>
      </Card>
    </Screen>
  );
}
