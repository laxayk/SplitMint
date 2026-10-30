import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BackHeader } from '../components/BackHeader';
import { api, loadUserId } from '../api';
import { Avatar, Card, CenteredLoading, ErrorBox, FadeIn, Field, MONO, PrimaryButton, Row, Screen, SectionHeader } from '../components/ui';
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

  const myNet = (balances ?? []).find((b) => b.userId === me)?.netMinor ?? 0;
  const heroColor = myNet > 0 ? '#5EEAD4' : myNet < 0 ? '#FCA5A5' : '#E8F5F0';
  const heroLabel = myNet > 0 ? 'You get back' : myNet < 0 ? 'You owe' : 'You are settled up';
  const money = (n: number) => formatMoney(Math.abs(n), currency);

  return (
    <Screen>
      <BackHeader title={name} />
      {error ? <ErrorBox message={error} /> : null}
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}>
        <FadeIn>
          <View style={{ backgroundColor: '#06332E', borderRadius: 18, padding: 20, marginBottom: 18 }}>
            <Text style={{ color: '#8FD9C8', fontSize: 12, fontWeight: '700', letterSpacing: 1.4 }}>{heroLabel.toUpperCase()}</Text>
            <Text style={{ color: heroColor, fontSize: 40, fontWeight: '800', fontFamily: MONO, marginTop: 6, letterSpacing: -1 }}>{money(myNet)}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
              {members.map((m, i) => (
                <View key={m.userId} style={{ marginLeft: i === 0 ? 0 : -8, borderWidth: 2, borderColor: '#06332E', borderRadius: 20 }}>
                  <Avatar name={m.displayName} size={30} />
                </View>
              ))}
              <Text style={{ color: '#8FD9C8', marginLeft: 10 }}>{members.length} people · {currency}</Text>
            </View>
          </View>
        </FadeIn>

        <FadeIn delay={60}>
          <SectionHeader>Balances</SectionHeader>
          <Card flush>
            {(balances ?? []).map((b, i, arr) => (
              <Row key={b.userId} last={i === arr.length - 1}>
                <Avatar name={nameOf(b.userId)} />
                <Text style={{ color: colors.text, flex: 1, fontSize: 16, fontWeight: '600' }}>{nameOf(b.userId)}</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: b.netMinor > 0 ? colors.positive : b.netMinor < 0 ? colors.negative : colors.textMuted, fontWeight: '700', fontFamily: MONO, fontSize: 16 }}>
                    {b.netMinor > 0 ? 'gets back ' : b.netMinor < 0 ? 'owes ' : ''}{money(b.netMinor)}
                  </Text>
                </View>
              </Row>
            ))}
          </Card>
        </FadeIn>

        {transfers.length > 0 ? (
          <FadeIn delay={100}>
            <SectionHeader>Suggested settlements</SectionHeader>
            <Card flush>
              {transfers.map((t, i) => (
                <Row key={i} last={i === transfers.length - 1}>
                  <Avatar name={nameOf(t.fromUser)} size={28} />
                  <Text style={{ color: colors.textMuted, fontSize: 18 }}>→</Text>
                  <Avatar name={nameOf(t.toUser)} size={28} />
                  <Text style={{ color: colors.text, flex: 1 }}>
                    {nameOf(t.fromUser)} pays {nameOf(t.toUser)} {formatMoney(t.amountMinor, currency)}
                  </Text>
                </Row>
              ))}
            </Card>
          </FadeIn>
        ) : null}

        {payments.length > 0 ? (
          <FadeIn delay={120}>
            <SectionHeader>Payments</SectionHeader>
            <Card flush>
              {payments.map((p, i) => {
                const canConfirm = p.status !== 'CONFIRMED' && me !== null && p.recordedBy !== me && (p.fromUser === me || p.toUser === me);
                return (
                  <Row key={p.id} last={i === payments.length - 1}>
                    <Text style={{ color: colors.text, flex: 1 }}>
                      {nameOf(p.fromUser)} → {nameOf(p.toUser)} {formatMoney(p.amountMinor, currency)}
                    </Text>
                    {canConfirm ? (
                      <TouchableOpacity onPress={() => confirm(p)} hitSlop={8} style={{ backgroundColor: colors.accent, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 6 }}>
                        <Text style={{ color: colors.accentText, fontWeight: '800' }}>Confirm</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={{ backgroundColor: p.status === 'CONFIRMED' ? colors.positive + '22' : colors.surfaceAlt, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ color: p.status === 'CONFIRMED' ? colors.positive : colors.textMuted, fontWeight: '700' }}>
                          {p.status === 'CONFIRMED' ? 'Confirmed' : 'Pending'}
                        </Text>
                      </View>
                    )}
                  </Row>
                );
              })}
            </Card>
          </FadeIn>
        ) : null}

        <FadeIn delay={140}>
          <SectionHeader>Expenses</SectionHeader>
          <Card flush>
            {expenses.length === 0 ? (
              <Row last><Text style={{ color: colors.textMuted }}>No expenses yet. Tap + to add the first one.</Text></Row>
            ) : (
              expenses.map((e, i) => (
                <Row key={e.id} last={i === expenses.length - 1}>
                  <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18, color: colors.accent, fontWeight: '800' }}>{e.title[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{e.title}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{e.date} · paid by {nameOf(e.paidBy)}</Text>
                    {me !== null && e.createdBy === me ? (
                      <View style={{ flexDirection: 'row', gap: 16, marginTop: 6 }}>
                        <TouchableOpacity onPress={() => navigation.navigate('AddExpense', { groupId, currency, members, existing: e })} hitSlop={8}>
                          <Text style={{ color: colors.accent, fontWeight: '700' }}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteExpense(e)} hitSlop={8}>
                          <Text style={{ color: colors.danger, fontWeight: '700' }}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                  <Text style={{ color: colors.text, fontFamily: MONO, fontWeight: '700', fontSize: 16 }}>{formatMoney(e.amountMinor, currency)}</Text>
                </Row>
              ))
            )}
          </Card>
        </FadeIn>

        <SectionHeader>Members</SectionHeader>
        <Card flush>
          {members.map((m, i) => (
            <Row key={m.userId} last={false}>
              <Avatar name={m.displayName} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{m.displayName}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{m.email}</Text>
              </View>
            </Row>
          ))}
          <View style={{ padding: 16 }}>
            <Field label="Add a member by email" value={memberEmail} onChange={setMemberEmail} placeholder="friend@example.com" keyboardType="email-address" error={memberMsg && memberMsg !== 'Added.' ? memberMsg : undefined} />
            {memberMsg === 'Added.' ? <Text style={{ color: colors.positive, marginBottom: 8 }}>Added.</Text> : null}
            <PrimaryButton title="Add member" onPress={addMember} />
            <View style={{ height: 10 }} />
            <TouchableOpacity onPress={leave} hitSlop={8}>
              <Text style={{ color: colors.danger, fontWeight: '800' }}>Leave group</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {activity.length > 0 ? (
          <>
            <SectionHeader>Activity</SectionHeader>
            <Card flush>
              {activity.map((a, i) => (
                <Row key={`${a.kind}-${a.id}`} last={i === activity.length - 1}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text }}>{a.text}</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>{a.at.slice(0, 16).replace('T', ' ')}</Text>
                  </View>
                </Row>
              ))}
            </Card>
          </>
        ) : null}

        <View style={{ height: 110 }} />
      </ScrollView>

      <View style={{ position: 'absolute', left: 18, right: 18, bottom: 20, flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          testID="fab-pay"
          style={{ flex: 1, height: 54, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => navigation.navigate('RecordPayment', { groupId, currency, members, transfers })}
        >
          <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 16 }}>Record payment</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="fab-add"
          accessibilityLabel="Add expense"
          style={{ flex: 1, height: 54, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
          onPress={() => navigation.navigate('AddExpense', { groupId, currency, members })}
        >
          <Text style={{ color: colors.accentText, fontSize: 22, marginTop: -2 }}>+</Text>
          <Text style={{ color: colors.accentText, fontWeight: '800', fontSize: 16 }}>Expense</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
