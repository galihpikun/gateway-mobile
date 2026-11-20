/**
 * Gateway Mobile — Gateway Splash Screen
 * Shows during auth session initialization.
 */
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '../lib/theme';
import { GatewayLogo } from './GatewayLogo';

export function GatewaySplash() {
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
      <Text
        style={{
          color: Colors.inkSecondary,
          fontSize: 10,
          letterSpacing: 2.5,
          textTransform: 'uppercase',
          fontFamily: 'monospace',
        }}
      >
        The Live Experience
      </Text>
      <ActivityIndicator
        size="small"
        color={Colors.gold}
        style={{ marginTop: 24 }}
      />
    </View>
  );
}
