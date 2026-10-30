import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { loadToken } from './src/api';
import { ThemeProvider, useTheme } from './src/theme';
import { CenteredLoading, Screen } from './src/components/ui';
import AuthScreen from './src/screens/AuthScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import NewGroupScreen from './src/screens/NewGroupScreen';
import GroupDetailScreen from './src/screens/GroupDetailScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import RecordPaymentScreen from './src/screens/RecordPaymentScreen';
import Splash from './src/components/Splash';
import SettingsScreen from './src/screens/SettingsScreen';

function TabIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = { Groups: '\u2261', Settings: '\u2699' };
  return <Text style={{ fontSize: 18, lineHeight: 22, color }}>{icons[name] ?? '\u25CF'}</Text>;
}

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function MainTabs({ onSignedOut }: { onSignedOut: () => void }) {
  const { colors } = useTheme();
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 84, paddingTop: 8, paddingBottom: 14 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700', lineHeight: 16 },
        tabBarIcon: ({ color }) => <TabIcon name={route.name} color={color} />,
      })}
    >
      <Tabs.Screen name="Groups" component={GroupsScreen} />
      <Tabs.Screen name="Settings">
        {() => <SettingsScreen onSignedOut={onSignedOut} />}
      </Tabs.Screen>
    </Tabs.Navigator>
  );
}

function Root() {
  const { colors, resolved } = useTheme();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    loadToken().then((t) => setSignedIn(t !== null));
  }, []);

  if (!splashDone || signedIn === null) return <Splash onDone={() => setSplashDone(true)} />;

  const navTheme = (resolved === 'dark' ? DarkTheme : DefaultTheme);
  navTheme.colors.background = colors.bg;

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!signedIn ? (
          <Stack.Screen name="Auth">{() => <AuthScreen onSignedIn={() => setSignedIn(true)} />}</Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Main">{() => <MainTabs onSignedOut={() => setSignedIn(false)} />}</Stack.Screen>
            <Stack.Screen name="NewGroup" component={NewGroupScreen} />
            <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
            <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
            <Stack.Screen name="RecordPayment" component={RecordPaymentScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}
