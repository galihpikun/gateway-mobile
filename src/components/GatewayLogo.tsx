/**
 * Gateway Mobile — Gateway Logo Component
 * Geometric mark that mirrors the brand icon.
 */
import React from 'react';
import { View } from 'react-native';
import { useColors } from '../context/Preferences';

interface GatewayLogoProps {
  size?: number;
  color?: string;
}

export function GatewayLogo({ size = 32, color: logoColor }: GatewayLogoProps) {
  const Colors = useColors();
  const color = logoColor ?? Colors.gold;
  const s = size;
  const r = s * 0.1;

  return (
    <View
      style={{
        width: s,
        height: s,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Outer ring */}
      <View
        style={{
          position: 'absolute',
          width: s,
          height: s,
          borderRadius: s / 2,
          borderWidth: s * 0.06,
          borderColor: color,
          opacity: 0.3,
        }}
      />
      {/* Inner diamond shape */}
      <View
        style={{
          width: s * 0.5,
          height: s * 0.5,
          borderRadius: r,
          borderWidth: s * 0.08,
          borderColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
      {/* Center dot */}
      <View
        style={{
          position: 'absolute',
          width: s * 0.15,
          height: s * 0.15,
          borderRadius: s * 0.08,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
