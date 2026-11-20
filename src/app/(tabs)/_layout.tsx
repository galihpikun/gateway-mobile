/**
 * Gateway Mobile — Tab Layout
 * Guards: unauthenticated users are redirected to login.
 */
import { Tabs, Redirect } from 'expo-router';
import { Platform, View, Text } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useColors, usePreferences } from '../../context/Preferences';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const Colors = useColors();
  return (
    <Text
      style={{
        fontSize: 9,
        fontWeight: '600',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        color: focused ? Colors.gold : Colors.edge,
        marginTop: 2,
      }}
    >
      {label}
    </Text>
  );
}

function HomeIcon({ focused }: { focused: boolean }) {
  const Colors = useColors();
  return (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 16,
          height: 11,
          borderWidth: 1.5,
          borderColor: focused ? Colors.gold : Colors.edge,
          borderRadius: 2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          width: 6,
          height: 7,
          borderWidth: 1.5,
          borderColor: focused ? Colors.gold : Colors.edge,
          borderRadius: 1,
        }}
      />
    </View>
  );
}

function SearchIcon({ focused }: { focused: boolean }) {
  const Colors = useColors();
  return (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 11,
          height: 11,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: focused ? Colors.gold : Colors.edge,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: 1,
          right: 2,
          width: 5,
          height: 1.5,
          backgroundColor: focused ? Colors.gold : Colors.edge,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

function TicketIcon({ focused }: { focused: boolean }) {
  const Colors = useColors();
  return (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 18,
          height: 10,
          borderWidth: 1.5,
          borderColor: focused ? Colors.gold : Colors.edge,
          borderRadius: 2,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 5,
          width: 1.5,
          height: 10,
          backgroundColor: focused ? Colors.gold : Colors.edge,
        }}
      />
    </View>
  );
}

function ProfileIcon({ focused }: { focused: boolean }) {
  const Colors = useColors();
  return (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 9,
          height: 9,
          borderRadius: 5,
          borderWidth: 1.5,
          borderColor: focused ? Colors.gold : Colors.edge,
          marginBottom: 1,
        }}
      />
      <View
        style={{
          width: 14,
          height: 5,
          borderTopLeftRadius: 7,
          borderTopRightRadius: 7,
          borderWidth: 1.5,
          borderColor: focused ? Colors.gold : Colors.edge,
          borderBottomWidth: 0,
        }}
      />
    </View>
  );
}

export default function TabsLayout() {
  const { tr } = usePreferences();
  const Colors = useColors();
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.canvas,
          borderTopColor: Colors.line,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 80 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.edge,
        tabBarLabelStyle: {
          display: 'none',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <HomeIcon focused={focused} />,
          tabBarLabel: ({ focused }) => <TabIcon label={tr('Beranda', 'Home')} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          tabBarIcon: ({ focused }) => <SearchIcon focused={focused} />,
          tabBarLabel: ({ focused }) => <TabIcon label={tr('Jelajahi', 'Explore')} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="my-tickets"
        options={{
          tabBarIcon: ({ focused }) => <TicketIcon focused={focused} />,
          tabBarLabel: ({ focused }) => <TabIcon label={tr('Tiket', 'Tickets')} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} />,
          tabBarLabel: ({ focused }) => <TabIcon label={tr('Profil', 'Profile')} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
