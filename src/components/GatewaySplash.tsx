/**
 * Gateway Mobile — Gateway Splash Screen
 * Shows during auth session initialization.
 */
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useColors } from '../context/Preferences';
import { GatewayLogo } from './GatewayLogo';

export function GatewaySplash() {
  const Colors = useColors();
  useEffect(() => {
    // Hide the native splash once our component is mounted
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.canvas,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <GatewayLogo size={64} />
      <Text
        style={{
          color: Colors.inkPrimary,
          fontSize: 28,
          fontWeight: '800',
          letterSpacing: -1.5,
        }}
      >
        GATEWAY
      </Text>
      <ActivityIndicator
        size="small"
        color={Colors.gold}
        style={{ marginTop: 24 }}
      />
    </View>
  );
}
