import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';

/** Simple back affordance for stack screens (headers are hidden app-wide). */
export function BackHeader({ title }: { title: string }) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
        <Text style={{ fontSize: 22, color: colors.accent }}>←</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, flex: 1 }} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}
