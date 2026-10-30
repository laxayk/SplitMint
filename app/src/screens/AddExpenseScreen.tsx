import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  const [exact, setExact] = useState<Record<string, string>>({});
  const [percent, setPercent] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // One id per screen visit: a retry or double tap saves once on the server.
  const [requestId] = useState(newRequestId());

  const amountMinor = parseMoney(amount);
  const exactMinor: Record<string, number> = {};
  for (const [k, v] of Object.entries(exact)) {
    const p = parseMoney(v);
    if (p !== null) exactMinor[k] = p;
  }
  const percentNum: Record<string, number> = {};
  for (const [k, v] of Object.entries(percent)) {
    const p = Number(v);
    if (v.trim() !== '' && Number.isFinite(p)) percentNum[k] = p;
  }

  const preview = useMemo(() => {
    if (!amountMinor || sharedBy.length === 0) return null;
    if (mode === 'EXACT') return splitPreview('EXACT', amountMinor, sharedBy, exactMinor);
    if (mode === 'PERCENT') return splitPreview('PERCENT', amountMinor, sharedBy, undefined, percentNum);
    return splitPreview('EQUAL', amountMinor, sharedBy);
  }, [amountMinor, mode, sharedBy, exact, percent]);

  const exactSum = sharedBy.reduce((s, id) => s + (exactMinor[id] ?? 0), 0);
  const percentSum = sharedBy.reduce((s, id) => s + (percentNum[id] ?? 0), 0);

  const validate = (): string | null => {
    if (!title.trim()) return 'Give the expense a title';
    if (!amountMinor || amountMinor <= 0) return 'Enter an amount like 12.50';
    if (sharedBy.length === 0) return 'Pick at least one person sharing it';
    if (mode === 'EXACT' && exactSum !== amountMinor) {
      return `Exact shares add up to ${formatMoney(exactSum, currency)}, not ${formatMoney(amountMinor, currency)}`;
    }
    if (mode === 'PERCENT' && Math.abs(percentSum - 100) > 0.0001) {
      return `Percentages add up to ${percentSum}%, not 100%`;
    }
    return null;
  };

  const save = async () => {
    const problem = validate();
    if (problem) return setError(problem);
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
          ...(mode === 'EXACT' ? { exactShares: exactMinor } : {}),
          ...(mode === 'PERCENT' ? { percentShares: percentNum } : {}),
        }),
      });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the expense');
    } finally {
      setBusy(false);
    }
  };

  const toggleShare = (id: string) =>
    setSharedBy((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const chip = (list: string[], current: string, onPick: (v: string) => void, label: (id: string) => string) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      {list.map((id) => (
        <TouchableOpacity
          key={id}
          onPress={() => onPick(id)}
          style={{
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18,
            backgroundColor: current === id ? colors.accent : colors.surfaceAlt,
          }}
        >
          <Text style={{ color: current === id ? colors.accentText : colors.text }}>{label(id)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const memberName = (id: string) => members.find((m) => m.userId === id)?.displayName ?? '?';

  return (
    <Screen>
      <ScrollView>
        <Title>Add expense</Title>
        {error ? <ErrorBox message={error} /> : null}
        <Field label="Title" value={title} onChange={setTitle} placeholder="Dinner at Bukhara" />
        <Field label={`Amount (${currency})`} value={amount} onChange={setAmount} placeholder="0.00" keyboardType="decimal-pad" />

        <Text style={{ color: colors.textMuted, fontWeight: '600', marginBottom: 6 }}>Paid by</Text>
        {chip(members.map((m) => m.userId), paidBy, setPaidBy, memberName)}

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

        {mode === 'EXACT' ? (
          <View style={{ marginBottom: 12 }}>
            {sharedBy.map((id) => (
              <View key={id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12 }}>
                <Text style={{ flex: 1, color: colors.text }}>{memberName(id)}</Text>
                <TextInput
                  style={{
                    width: 110, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
                    backgroundColor: colors.surface, borderColor: colors.border, color: colors.text,
                  }}
                  value={exact[id] ?? ''}
                  onChangeText={(v) => setExact((cur) => ({ ...cur, [id]: v }))}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
            ))}
            <Text style={{ color: exactSum === amountMinor ? colors.positive : colors.textMuted }}>
              Shares: {formatMoney(exactSum, currency)} of {formatMoney(amountMinor ?? 0, currency)}
            </Text>
          </View>
        ) : null}

        {mode === 'PERCENT' ? (
          <View style={{ marginBottom: 12 }}>
            {sharedBy.map((id) => (
              <View key={id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12 }}>
                <Text style={{ flex: 1, color: colors.text }}>{memberName(id)}</Text>
                <TextInput
                  style={{
                    width: 90, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
                    backgroundColor: colors.surface, borderColor: colors.border, color: colors.text,
                  }}
                  value={percent[id] ?? ''}
                  onChangeText={(v) => setPercent((cur) => ({ ...cur, [id]: v }))}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                />
                <Text style={{ color: colors.textMuted }}>%</Text>
              </View>
            ))}
            <Text style={{ color: Math.abs(percentSum - 100) < 0.0001 ? colors.positive : colors.textMuted }}>
              Total: {percentSum}% of 100%
            </Text>
          </View>
        ) : null}

        {mode === 'EQUAL' && preview ? (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: colors.textMuted, fontWeight: '600', marginBottom: 6 }}>Preview (server confirms on save)</Text>
            {sharedBy.map((id) => (
              <View key={id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                <Text style={{ color: colors.text }}>{memberName(id)}</Text>
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
