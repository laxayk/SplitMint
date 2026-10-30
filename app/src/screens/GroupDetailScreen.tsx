import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BackHeader } from '../components/BackHeader';
import { api } from '../api';
import { Card, CenteredLoading, ErrorBox, Screen, Title } from '../components/ui';
import { useTheme } from '../theme';
import { formatMoney } from '../format';

interface Balance { userId: string; email: string; netMinor: number }
interface Transfer { fromUser: string; toUser: string; amountMinor: number }
interface Payment { id: string; fromUser: string; toUser: string; amountMinor: number; status: string; recordedBy: string }
interface Expense { id: string; title: string; amountMinor: number; paidBy: string }
interface Member { userId: string; displayName: string; email: string }

export default function GroupDetailScreen({ route, navigation }: any) {
  const { groupId, name, currency } = route.params;
  const { colors } = useTheme();
  const [balances, setBalances] = useState<Balance[] | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const nameOf = (id: string) => members.find((m) => m.userId === id)?.displayName ?? id.slice(0, 6);

  const load = async () => {
    try {
      setError(null);
      const group = await api<{ members: Member[] }>(`/api/groups/${groupId}`);
      setMembers(group.members);
      setBalances(await api<Balance[]>(`/api/groups/${groupId}/balances`));
      setTransfers(await api<Transfer[]>(`/api/groups/${groupId}/settlements/suggestions`));
      setPayments(await api<Payment[]>(`/api/groups/${groupId}/payments`));
      setExpenses(await api<Expense[]>(`/api/groups/${groupId}/expenses`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the group');
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (balances === null && !error) return <Screen><CenteredLoading /></Screen>;

  return (
    <Screen>
      <BackHeader title={name} />
      {error ? <ErrorBox message={error} /> : null}
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}>
        <Card>
          <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 8 }}>Balances</Text>
          {(balances ?? []).map((b) => (
            <View key={b.userId} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
              <Text style={{ color: colors.text }}>{nameOf(b.userId)}</Text>
              <Text style={{ color: b.netMinor > 0 ? colors.positive : b.netMinor < 0 ? colors.negative : colors.textMuted, fontWeight: '600' }}>
                {b.netMinor > 0 ? 'gets back ' : b.netMinor < 0 ? 'owes ' : ''}{formatMoney(Math.abs(b.netMinor), currency)}
              </Text>
            </View>
          ))}
        </Card>

        {transfers.length > 0 ? (
          <Card>
            <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 8 }}>Suggested settlements</Text>
            {transfers.map((t, i) => (
              <Text key={i} style={{ color: colors.text, paddingVertical: 2 }}>
                {nameOf(t.fromUser)} pays {nameOf(t.toUser)} {formatMoney(t.amountMinor, currency)}
              </Text>
            ))}
          </Card>
        ) : null}

        {payments.length > 0 ? (
          <Card>
            <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 8 }}>Payments</Text>
            {payments.map((p) => (
              <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                <Text style={{ color: colors.text }}>
                  {nameOf(p.fromUser)} → {nameOf(p.toUser)} {formatMoney(p.amountMinor, currency)}
                </Text>
                <Text style={{ color: p.status === 'CONFIRMED' ? colors.positive : colors.textMuted, fontWeight: '600' }}>
                  {p.status === 'CONFIRMED' ? 'Confirmed' : 'Pending'}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}

        <Card>
          <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 8 }}>Expenses</Text>
          {expenses.length === 0 ? (
            <Text style={{ color: colors.textMuted }}>No expenses yet. Tap + to add the first one.</Text>
          ) : (
            expenses.map((e) => (
              <View key={e.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={{ color: colors.text }}>{e.title}</Text>
                <Text style={{ color: colors.textMuted }}>{formatMoney(e.amountMinor, currency)}</Text>
              </View>
            ))
          )}
        </Card>

        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={{ position: 'absolute', right: 24, bottom: 24, flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          style={{ paddingHorizontal: 18, height: 48, borderRadius: 24, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => navigation.navigate('RecordPayment', { groupId, currency, members })}
        >
          <Text style={{ color: colors.text, fontWeight: '700' }}>Record payment</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => navigation.navigate('AddExpense', { groupId, currency, members })}
        >
          <Text style={{ color: colors.accentText, fontSize: 28, marginTop: -2 }}>+</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
