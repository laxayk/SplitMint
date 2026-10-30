import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TouchableOpacity } from 'react-native';
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
    if (password.length < 8) return setError('Password needs at least 8 characters');
    if (mode === 'register' && !name.trim()) return setError('Enter your name');
    setBusy(true);
    try {
      const body = mode === 'login' ? { email, password } : { email, password, displayName: name.trim() };
      const res = await api<{ token: string }>(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(body) });
      await saveToken(res.token);
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
        <Title>SplitMint</Title>
        {error ? <ErrorBox message={error} /> : null}
        <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" keyboardType="email-address" />
        {mode === 'register' ? <Field label="Your name" value={name} onChange={setName} placeholder="Asha" /> : null}
        <Field label="Password" value={password} onChange={setPassword} placeholder="At least 8 characters" secure />
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
