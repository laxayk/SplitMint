import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { BackHeader } from '../components/BackHeader';
import { api, newRequestId } from '../api';
import { ErrorBox, Field, PrimaryButton, Screen, Title } from '../components/ui';
import { useTheme } from '../theme';
import { parseMoney } from '../format';

interface Member { userId: string; displayName: string }

export default function RecordPaymentScreen({ route, navigation }: any) {
  const { groupId, currency, members } = route.params as { groupId: string; currency: string; members: Member[] };
  const { colors } = useTheme();
  const [fromUser, setFromUser] = useState(members[0]?.userId ?? '');
  const [toUser, setToUser] = useState(members[1]?.userId ?? '');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [requestId] = useState(newRequestId());

  const save = async () => {
    const amountMinor = parseMoney(amount);
    if (!amountMinor || amountMinor <= 0) return setError('Enter an amount like 12.50');
    if (fromUser === toUser) return setError('A payment needs two different people');
    setBusy(true);
    try {
      await api(`/api/groups/${groupId}/payments`, {
        method: 'POST',
        body: JSON.stringify({ fromUser, toUser, amountMinor, requestId }),
      });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not record the payment');
    } finally {
      setBusy(false);
    }
  };

  const picker = (label: string, value: string, setValue: (v: string) => void) => (
    <>
      <Text style={{ color: colors.textMuted, fontWeight: '600', marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {members.map((m) => (
          <TouchableOpacity
            key={m.userId}
            onPress={() => setValue(m.userId)}
            style={{
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18,
              backgroundColor: value === m.userId ? colors.accent : colors.surfaceAlt,
            }}
          >
            <Text style={{ color: value === m.userId ? colors.accentText : colors.text }}>{m.displayName}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  return (
    <Screen>
      <BackHeader title="Record a payment" />
      {error ? <ErrorBox message={error} /> : null}
      {picker('From (who paid)', fromUser, setFromUser)}
      {picker('To (who received)', toUser, setToUser)}
      <Field label={`Amount (${currency})`} value={amount} onChange={setAmount} placeholder="0.00" keyboardType="decimal-pad" />
      <Text style={{ color: colors.textMuted, marginBottom: 8 }}>
        The other person confirms it before it changes balances. This only records the payment; no money moves here.
      </Text>
      <PrimaryButton title="Record payment" onPress={save} loading={busy} />
    </Screen>
  );
}
