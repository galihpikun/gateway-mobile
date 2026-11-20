import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useColors, usePreferences } from '../../context/Preferences';
import { Icon } from '../../components/Icon';

export default function TabsLayout() {
  const { tr } = usePreferences();
  const colors = useColors();
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, paddingTop: 4 },
      tabBarActiveTintColor: colors.gold,
      tabBarInactiveTintColor: colors.inkSecondary,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{ title: tr('Beranda', 'Home'), tabBarIcon: ({ focused }) => <Icon name="home" color={focused ? colors.gold : colors.inkSecondary} /> }} />
      <Tabs.Screen name="explore" options={{ title: tr('Jelajahi', 'Explore'), tabBarIcon: ({ focused }) => <Icon name="search" color={focused ? colors.gold : colors.inkSecondary} /> }} />
      <Tabs.Screen name="my-tickets" options={{ title: tr('Tiket', 'Tickets'), tabBarIcon: ({ focused }) => <Icon name="ticket" color={focused ? colors.gold : colors.inkSecondary} /> }} />
      <Tabs.Screen name="profile" options={{ title: tr('Profil', 'Profile'), tabBarIcon: ({ focused }) => <Icon name="user" color={focused ? colors.gold : colors.inkSecondary} /> }} />
    </Tabs>
  );
}
