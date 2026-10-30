import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native';
import { api, saveToken } from '../api';
import { Field, PrimaryButton, Screen, Title, ErrorBox } from '../components/ui';
import { useTheme } from '../theme';

interface Props {
  onSignedIn: () => void;
}

export default function AuthScreen({ onSignedIn }: Props) {
  const { colors } = useTheme();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email.includes('@')) return setError('Enter a valid email');
    if (mode === 'login' && !password) return setError('Enter your password');
    if (mode === 'register' && password.length < 8) return setError('Password needs at least 8 characters');
    if (mode === 'register' && !name.trim()) return setError('Enter your name');
    setBusy(true);
    try {
      const body = mode === 'login' ? { email, password } : { email, password, displayName: name.trim() };
      const res = await api<{ token: string; userId: string }>(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(body) });
      await saveToken(res.token, res.userId);
      onSignedIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', marginBottom: 26 }}>
          <Image source={require('../../assets/logo.png')} style={{ width: 84, height: 84, borderRadius: 20 }} />
          <Text style={{ color: colors.text, fontSize: 32, fontWeight: '800', letterSpacing: -1, marginTop: 12 }}>SplitMint</Text>
          <Text style={{ color: colors.textMuted, marginTop: 4 }}>{mode === 'login' ? 'Welcome back. Pick up where you left off.' : 'Create an account to start a group.'}</Text>
        </View>
        {error ? <ErrorBox message={error} /> : null}
        <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" keyboardType="email-address" />
        {mode === 'register' ? <Field label="Your name" value={name} onChange={setName} placeholder="Asha" /> : null}
        <Field label="Password" value={password} onChange={setPassword} placeholder={mode === 'login' ? 'Password' : 'At least 8 characters'} secure />
        <PrimaryButton title={mode === 'login' ? 'Log in' : 'Create account'} onPress={submit} loading={busy} />
        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')} style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={{ color: colors.accent }}>
            {mode === 'login' ? 'New here? Create an account' : 'Have an account? Log in'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Screen>
  );
}
