import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { api, newRequestId } from '../api';
import { ErrorBox, Field, PrimaryButton, Screen, Title } from '../components/ui';
import { useTheme } from '../theme';
import { formatMoney, parseMoney } from '../format';
import { splitPreview, type SplitMode } from '../split';

interface Member { userId: string; displayName: string }

const MODES: { key: SplitMode; label: string }[] = [
  { key: 'EQUAL', label: 'Equally' },
  { key: 'EXACT', label: 'Exact' },
  { key: 'PERCENT', label: '%' },
];

export default function AddExpenseScreen({ route, navigation }: any) {
  const { groupId, currency, members } = route.params as { groupId: string; currency: string; members: Member[] };
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(members[0]?.userId ?? '');
  const [sharedBy, setSharedBy] = useState<string[]>(members.map((m) => m.userId));
  const [mode, setMode] = useState<SplitMode>('EQUAL');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // One id per screen visit: a retry or double tap saves once on the server.
  const [requestId] = useState(newRequestId());

  const amountMinor = parseMoney(amount);
  const preview = useMemo(
    () => (amountMinor ? splitPreview(mode, amountMinor, sharedBy) : null),
    [amountMinor, mode, sharedBy],
  );

  const toggleShare = (id: string) =>
    setSharedBy((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const save = async () => {
    if (!title.trim()) return setError('Give the expense a title');
    if (!amountMinor || amountMinor <= 0) return setError('Enter an amount like 12.50');
    if (sharedBy.length === 0) return setError('Pick at least one person sharing it');
    setBusy(true);
    setError(null);
    try {
      await api(`/api/groups/${groupId}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          amountMinor,
          date: new Date().toISOString().slice(0, 10),
          paidBy,
          requestId,
          splitMode: mode,
          sharedBy,
          // Exact and percent entry live in the edit flow; MVP posts equal splits.
        }),
      });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the expense');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView>
        <Title>Add expense</Title>
        {error ? <ErrorBox message={error} /> : null}
        <Field label="Title" value={title} onChange={setTitle} placeholder="Dinner at Bukhara" />
        <Field label={`Amount (${currency})`} value={amount} onChange={setAmount} placeholder="0.00" keyboardType="decimal-pad" />

        <Text style={{ color: colors.textMuted, fontWeight: '600', marginBottom: 6 }}>Paid by</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {members.map((m) => (
            <TouchableOpacity
              key={m.userId}
              onPress={() => setPaidBy(m.userId)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18,
                backgroundColor: paidBy === m.userId ? colors.accent : colors.surfaceAlt,
              }}
            >
              <Text style={{ color: paidBy === m.userId ? colors.accentText : colors.text }}>{m.displayName}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: colors.textMuted, fontWeight: '600', marginBottom: 6 }}>Shared by</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {members.map((m) => {
            const on = sharedBy.includes(m.userId);
            return (
              <TouchableOpacity
                key={m.userId}
                onPress={() => toggleShare(m.userId)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18,
                  backgroundColor: on ? colors.surface : colors.surfaceAlt,
                  borderWidth: 1, borderColor: on ? colors.accent : colors.border,
                }}
              >
                <Text style={{ color: on ? colors.accent : colors.textMuted }}>{m.displayName}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={{ color: colors.textMuted, fontWeight: '600', marginBottom: 6 }}>Split</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {MODES.map((m) => (
            <TouchableOpacity
              key={m.key}
              onPress={() => setMode(m.key)}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18,
                backgroundColor: mode === m.key ? colors.accent : colors.surfaceAlt,
              }}
            >
              <Text style={{ color: mode === m.key ? colors.accentText : colors.text }}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'EQUAL' && preview ? (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: colors.textMuted, fontWeight: '600', marginBottom: 6 }}>Preview (server confirms on save)</Text>
            {sharedBy.map((id) => (
              <View key={id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                <Text style={{ color: colors.text }}>{members.find((m) => m.userId === id)?.displayName}</Text>
                <Text style={{ color: colors.textMuted }}>{formatMoney(preview[id] ?? 0, currency)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <PrimaryButton title="Save expense" onPress={save} loading={busy} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}
