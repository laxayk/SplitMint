import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, PanResponder, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';

export const MONO = Platform.select({ web: 'ui-monospace, SFMono-Regular, Menlo, monospace', default: 'monospace' }) as string;

/** Fades and lifts its children in; `delay` staggers a list of sections. */
export function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 320, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}

export function Screen({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <View style={[styles.screen, { backgroundColor: colors.bg }]}>{children}</View>;
}

/** A ledger sheet: flat surface, hairline border, rows separated by rules. */
export function Card({ children, flush }: { children: React.ReactNode; flush?: boolean }) {
  const { colors } = useTheme();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: flush ? 0 : 16 }]}>{children}</View>;
}

export function SectionHeader({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.section, { color: colors.textMuted }]}>{String(children).toUpperCase()}</Text>
      {right}
    </View>
  );
}

export function Row({ children, last }: { children: React.ReactNode; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>{children}</View>
  );
}

export function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  const { colors } = useTheme();
  const hues = ['#0F766E', '#B45309', '#7C3AED', '#BE123C', '#1D4ED8', '#4D7C0F'];
  const bg = hues[(name.charCodeAt(0) || 0) % hues.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.42 }}>{(name[0] ?? '?').toUpperCase()}</Text>
    </View>
  );
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
  keyboardType?: 'default' | 'email-address' | 'decimal-pad';
  secure?: boolean;
  error?: string;
}) {
  const { colors } = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{props.label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: props.error ? colors.danger : focus ? colors.accent : colors.border, color: colors.text }]}
        value={props.value}
        onChangeText={props.onChange}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
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
  const s = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(s, { toValue: v, useNativeDriver: false, speed: 40, bounciness: 0 }).start();
  return (
    <Animated.View style={{ transform: [{ scale: s }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.button, { backgroundColor: colors.accent, opacity: props.disabled ? 0.5 : 1 }]}
        onPress={props.onPress}
        onPressIn={() => to(0.97)}
        onPressOut={() => to(1)}
        disabled={props.disabled || props.loading}
      >
        {props.loading ? <ActivityIndicator color={colors.accentText} /> : <Text style={[styles.buttonText, { color: colors.accentText }]}>{props.title}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

/** Pull bar. The exact value is always editable in a field next to it. */
export function Slider(props: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  const { colors } = useTheme();
  const trackRef = useRef<View>(null);
  const geo = useRef({ left: 0, width: 1 });
  const cfg = useRef(props); cfg.current = props;
  const [w, setW] = useState(1);
  const setFrom = (pageX: number) => {
    const { min, max, step = 1, onChange } = cfg.current;
    const ratio = Math.min(1, Math.max(0, (pageX - geo.current.left) / geo.current.width));
    onChange(Math.round((min + ratio * (max - min)) / step) * step);
  };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => {
      trackRef.current?.measureInWindow((x, _y, width) => {
        geo.current = { left: x, width: width || 1 };
        setFrom(e.nativeEvent.pageX);
      });
    },
    onPanResponderMove: (e) => setFrom(e.nativeEvent.pageX),
  })).current;
  const ratio = props.max > props.min ? Math.min(1, Math.max(0, (props.value - props.min) / (props.max - props.min))) : 0;
  return (
    <View {...pan.panHandlers} style={{ height: 36, justifyContent: 'center' }}>
      <View ref={trackRef} onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, marginHorizontal: 11 }}>
        <View style={{ width: `${ratio * 100}%`, height: 6, borderRadius: 3, backgroundColor: colors.accent }} />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', left: ratio * w, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surface, borderWidth: 3, borderColor: colors.accent }} />
    </View>
  );
}

export function EmptyState(props: { title: string; hint?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Text style={{ fontSize: 28, color: colors.accent }}>⇄</Text>
      </View>
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
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 18 },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, marginBottom: 14, overflow: 'hidden' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 6 },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8, marginBottom: 14 },
  label: { fontSize: 12, marginBottom: 6, fontWeight: '700', letterSpacing: 0.4 },
  input: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 17 },
  error: { fontSize: 12, marginTop: 4 },
  button: { borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  emptyHint: { fontSize: 15, textAlign: 'center', lineHeight: 21 },
  errorBox: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
});
