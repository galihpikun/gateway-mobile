/**
 * Gateway Mobile — Design Tokens
 * Extracted from gateway-fe/src/app/globals.css
 * Dark-only palette to match the Gateway brand.
 */

export const Colors = {
  // Backgrounds
  canvas: '#101415',
  surface: '#1b2323',
  surfaceCard: '#1b2323',
  panel: '#171d1d',
  highlight: '#26302c',
  field: '#111917',
  footer: '#0c1010',

  // Text
  inkPrimary: '#f3f0e8',
  inkSecondary: '#a5b2ad',

  // Accents
  gold: '#e6b35a',
  goldHover: '#f2c67f',
  terracotta: '#d88b75',

  // Borders & lines
  line: '#35403c',
  edge: '#53615b',

  // Status
  danger: '#ffc2b1',
  success: '#7ec8a0',
} as const;

export const FontSize = {
  xs: 10,
  sm: 11,
  base: 12,
  md: 13,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 44,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Radius = {
  none: 0,
  sm: 3,
  md: 6,
  lg: 12,
  xl: 20,
  full: 9999,
} as const;

export const Spacing = {
  0.5: 2,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export type GatewayColor = keyof typeof Colors;
