import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';

export function Screen({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <View style={[styles.screen, { backgroundColor: colors.bg }]}>{children}</View>;
}

export function Card({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>;
}

export function Label({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <Text style={[styles.label, { color: colors.textMuted }]}>{children}</Text>;
}

export function Title({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <Text style={[styles.title, { color: colors.text }]}>{children}</Text>;
}

export function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad' | 'email-address';
  secure?: boolean;
  error?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      <Label>{props.label}</Label>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: props.error ? colors.danger : colors.border, color: colors.text }]}
        value={props.value}
        onChangeText={props.onChange}
        placeholder={props.placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={props.keyboardType ?? 'default'}
        secureTextEntry={props.secure}
        autoCapitalize="none"
      />
      {props.error ? <Text style={[styles.error, { color: colors.danger }]}>{props.error}</Text> : null}
    </View>
  );
}

export function PrimaryButton(props: { title: string; onPress: () => void; disabled?: boolean; loading?: boolean }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.accent, opacity: props.disabled ? 0.5 : 1 }]}
      onPress={props.onPress}
      disabled={props.disabled || props.loading}
    >
      {props.loading ? <ActivityIndicator color={colors.accentText} /> : <Text style={[styles.buttonText, { color: colors.accentText }]}>{props.title}</Text>}
    </TouchableOpacity>
  );
}

export function DangerButton(props: { title: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={[styles.button, { backgroundColor: colors.danger }]} onPress={props.onPress}>
      <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>{props.title}</Text>
    </TouchableOpacity>
  );
}

export function EmptyState(props: { title: string; hint?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{props.title}</Text>
      {props.hint ? <Text style={[styles.emptyHint, { color: colors.textMuted }]}>{props.hint}</Text> : null}
    </View>
  );
}

export function ErrorBox(props: { message: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.errorBox, { borderColor: colors.danger }]}>
      <Text style={{ color: colors.danger }}>{props.message}</Text>
    </View>
  );
}

export function CenteredLoading() {
  return (
    <View style={styles.empty}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  label: { fontSize: 13, marginBottom: 4, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  error: { fontSize: 12, marginTop: 4 },
  button: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyHint: { fontSize: 14, textAlign: 'center' },
  errorBox: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
});
