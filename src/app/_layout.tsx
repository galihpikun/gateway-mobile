/**
 * Gateway Mobile — Root Layout
 * - Provides AuthContext to entire app
 * - Shows splash while checking auth
 * - Routes unauthenticated → (auth) stack
 * - Routes authenticated → (tabs) stack
 */
import '../global.css';
import React from 'react';
import { View } from 'react-native';
import { vars } from 'nativewind';
import { PreferencesProvider, useColors, usePreferences } from '../context/Preferences';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { GatewaySplash } from '../components/GatewaySplash';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { loading } = useAuth();
  const { theme } = usePreferences();
  const colors = useColors();

  return (
    <View style={[{ flex: 1 }, vars({
      '--canvas': colors.canvas, '--surface': colors.surface, '--panel': colors.panel, '--highlight': colors.highlight,
      '--field': colors.field, '--ink-primary': colors.inkPrimary, '--ink-secondary': colors.inkSecondary,
      '--gold': colors.gold, '--gold-hover': colors.goldHover, '--terracotta': colors.terracotta,
      '--line': colors.line, '--edge': colors.edge, '--danger': colors.danger, '--success': colors.success,
      '--action-ink': theme === 'light' ? '#fffdf7' : '#101415',
    })]}>
      {loading ? <GatewaySplash /> : <>
      <StatusBar style={theme === 'light' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.canvas },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="event/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="organizer" options={{ headerShown: false }} />
      </Stack>
      </>}
    </View>
  );
}

export default function RootLayout() {
  return (
    <PreferencesProvider><AuthProvider><RootNavigator /></AuthProvider></PreferencesProvider>
  );
}
