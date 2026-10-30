import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BackHeader } from '../components/BackHeader';
import { api, loadUserId } from '../api';
import { Card, CenteredLoading, ErrorBox, Field, PrimaryButton, Screen } from '../components/ui';
import { useTheme } from '../theme';
import { formatMoney } from '../format';

interface Balance { userId: string; email: string; netMinor: number }
interface Transfer { fromUser: string; toUser: string; amountMinor: number }
interface Payment { id: string; fromUser: string; toUser: string; amountMinor: number; status: string; recordedBy: string }
interface Share { userId: string; shareMinor: number }
interface Expense { id: string; title: string; amountMinor: number; date: string; paidBy: string; createdBy: string; shares: Share[] }
interface Member { userId: string; displayName: string; email: string }
interface ActivityItem { kind: string; id: string; text: string; at: string }

export default function GroupDetailScreen({ route, navigation }: any) {
  const { groupId, name, currency } = route.params;
  const { colors } = useTheme();
  const [me, setMe] = useState<string | null>(null);
  const [balances, setBalances] = useState<Balance[] | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [formerMembers, setFormerMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberMsg, setMemberMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const nameOf = (id: string) =>
    members.find((m) => m.userId === id)?.displayName
    ?? formerMembers.find((m) => m.userId === id)?.displayName
    ?? id.slice(0, 6);

  const load = async () => {
    try {
      setError(null);
      setMe(await loadUserId());
      const group = await api<{ members: Member[]; formerMembers: Member[] }>(`/api/groups/${groupId}`);
      setMembers(group.members);
      setFormerMembers(group.formerMembers ?? []);
      setBalances(await api<Balance[]>(`/api/groups/${groupId}/balances`));
      setTransfers(await api<Transfer[]>(`/api/groups/${groupId}/settlements/suggestions`));
      setPayments(await api<Payment[]>(`/api/groups/${groupId}/payments`));
      setExpenses(await api<Expense[]>(`/api/groups/${groupId}/expenses`));
      setActivity(await api<ActivityItem[]>(`/api/groups/${groupId}/activity`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the group');
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const addMember = async () => {
    setMemberMsg(null);
    if (!memberEmail.includes('@')) return setMemberMsg('Enter their email');
    try {
      await api(`/api/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify({ email: memberEmail.trim() }) });
      setMemberEmail('');
      setMemberMsg('Added.');
      load();
    } catch (e) {
      setMemberMsg(e instanceof Error ? e.message : 'Could not add them');
    }
  };

  const leave = async () => {
    try {
      await api(`/api/groups/${groupId}/leave`, { method: 'POST' });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not leave the group');
    }
  };

  const confirm = async (p: Payment) => {
    try {
      await api(`/api/payments/${p.id}/confirm`, { method: 'POST' });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not confirm the payment');
    }
  };

  const deleteExpense = async (e: Expense) => {
    try {
      await api(`/api/expenses/${e.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the expense');
    }
  };

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
            {payments.map((p) => {
              const canConfirm = p.status !== 'CONFIRMED' && me !== null && p.recordedBy !== me && (p.fromUser === me || p.toUser === me);
              return (
                <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, gap: 8 }}>
                  <Text style={{ color: colors.text, flex: 1 }}>
                    {nameOf(p.fromUser)} → {nameOf(p.toUser)} {formatMoney(p.amountMinor, currency)}
                  </Text>
                  {canConfirm ? (
                    <TouchableOpacity onPress={() => confirm(p)} hitSlop={8}>
                      <Text style={{ color: colors.accent, fontWeight: '700' }}>Confirm</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={{ color: p.status === 'CONFIRMED' ? colors.positive : colors.textMuted, fontWeight: '600' }}>
                      {p.status === 'CONFIRMED' ? 'Confirmed' : 'Pending'}
                    </Text>
                  )}
                </View>
              );
            })}
          </Card>
        ) : null}

        <Card>
          <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 8 }}>Expenses</Text>
          {expenses.length === 0 ? (
            <Text style={{ color: colors.textMuted }}>No expenses yet. Tap + to add the first one.</Text>
          ) : (
            expenses.map((e) => (
              <View key={e.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text }}>{e.title}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{e.date} · paid by {nameOf(e.paidBy)}</Text>
                </View>
                <Text style={{ color: colors.textMuted }}>{formatMoney(e.amountMinor, currency)}</Text>
                {me !== null && e.createdBy === me ? (
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity onPress={() => navigation.navigate('AddExpense', { groupId, currency, members, existing: e })} hitSlop={8}>
                      <Text style={{ color: colors.accent, fontWeight: '600' }}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteExpense(e)} hitSlop={8}>
                      <Text style={{ color: colors.danger, fontWeight: '600' }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </Card>

        <Card>
          <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 8 }}>Members</Text>
          {members.map((m) => (
            <Text key={m.userId} style={{ color: colors.text, paddingVertical: 2 }}>{m.displayName} · {m.email}</Text>
          ))}
          <View style={{ height: 8 }} />
          <Field label="Add a member by email" value={memberEmail} onChange={setMemberEmail} placeholder="friend@example.com" keyboardType="email-address" error={memberMsg && memberMsg !== 'Added.' ? memberMsg : undefined} />
          {memberMsg === 'Added.' ? <Text style={{ color: colors.positive, marginBottom: 8 }}>Added.</Text> : null}
          <PrimaryButton title="Add member" onPress={addMember} />
          <View style={{ height: 8 }} />
          <TouchableOpacity onPress={leave} hitSlop={8}>
            <Text style={{ color: colors.danger, fontWeight: '700' }}>Leave group</Text>
          </TouchableOpacity>
        </Card>

        {activity.length > 0 ? (
          <Card>
            <Text style={{ fontWeight: '700', color: colors.text, marginBottom: 8 }}>Activity</Text>
            {activity.map((a) => (
              <View key={`${a.kind}-${a.id}`} style={{ paddingVertical: 3 }}>
                <Text style={{ color: colors.text }}>{a.text}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{a.at.slice(0, 16).replace('T', ' ')}</Text>
              </View>
            ))}
          </Card>
        ) : null}

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
