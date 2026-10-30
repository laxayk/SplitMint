import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { Avatar, CenteredLoading, EmptyState, ErrorBox, FadeIn, Screen } from '../components/ui';
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
      <View style={{ marginBottom: 14, marginTop: 6 }}>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1.4 }}>SPLITMINT</Text>
        <Text style={{ color: colors.text, fontSize: 32, fontWeight: '800', letterSpacing: -1 }}>Your groups</Text>
      </View>
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
          renderItem={({ item, index }) => (
            <FadeIn delay={index * 50}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('GroupDetail', { groupId: item.id, name: item.name, currency: item.currency })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}
              >
                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: colors.accentText, fontWeight: '800', fontSize: 20 }}>{item.name[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{item.name}</Text>
                  <Text style={{ color: colors.textMuted, marginTop: 3 }}>
                    {item.members.length} member{item.members.length === 1 ? '' : 's'} · {item.currency}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  {item.members.slice(0, 3).map((m, i) => (
                    <View key={m.userId} style={{ marginLeft: i === 0 ? 0 : -10, borderWidth: 2, borderColor: colors.surface, borderRadius: 18 }}>
                      <Avatar name={m.displayName} size={28} />
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            </FadeIn>
          )}
        />
      )}
      <TouchableOpacity
        testID="fab-add"
        accessibilityLabel="New group"
        style={{ position: 'absolute', left: 18, right: 18, bottom: 18, height: 54, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
        onPress={() => navigation.navigate('NewGroup')}
      >
        <Text style={{ color: colors.accentText, fontSize: 22, marginTop: -2 }}>+</Text>
        <Text style={{ color: colors.accentText, fontWeight: '800', fontSize: 16 }}>New group</Text>
      </TouchableOpacity>
    </Screen>
  );
}
