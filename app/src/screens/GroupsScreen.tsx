import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { Card, CenteredLoading, EmptyState, ErrorBox, Screen, Title } from '../components/ui';
import { useTheme } from '../theme';

interface Group {
  id: string;
  name: string;
  currency: string;
  members: { userId: string; displayName: string }[];
}

export default function GroupsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setError(null);
      setGroups(await api<Group[]>('/api/groups'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load groups');
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  return (
    <Screen>
      <Title>Your groups</Title>
      {error ? <ErrorBox message={error} /> : null}
      {groups === null ? (
        <CenteredLoading />
      ) : groups.length === 0 ? (
        <EmptyState title="No groups yet" hint="Create one for a trip, a flat or a night out." />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('GroupDetail', { groupId: item.id, name: item.name, currency: item.currency })}>
              <Card>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{item.name}</Text>
                <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                  {item.members.length} member{item.members.length === 1 ? '' : 's'} · {item.currency}
                </Text>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
      <TouchableOpacity
        style={{ position: 'absolute', right: 24, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}
        onPress={() => navigation.navigate('NewGroup')}
      >
        <Text style={{ color: colors.accentText, fontSize: 28, marginTop: -2 }}>+</Text>
      </TouchableOpacity>
    </Screen>
  );
}
