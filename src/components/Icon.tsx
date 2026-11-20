import Svg, { Path } from 'react-native-svg';
import { useColors } from '../context/Preferences';

const paths = {
  home: 'M3 10.5 12 3l9 7.5V21h-6v-7H9v7H3z',
  search: 'M16 16l4.5 4.5M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0z',
  ticket: 'M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4zM15 6v2m0 3v2m0 3v2',
  user: 'M20 21v-2a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v2m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
  calendar: 'M3 8h18m-5-5v4m-8-4v4M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
  pin: 'M19 10c0 5-7 11-7 11s-7-6-7-11a7 7 0 0 1 14 0zM14.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
  close: 'm6 6 12 12M18 6 6 18',
  next: 'm9 6 6 6-6 6',
  back: 'm15 6-6 6 6 6',
  globe: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0zM2 12h20m-10 10c5-5 5-15 0-20-5 5-5 15 0 20z',
  sun: 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M19 5l-1.5 1.5m-11 11L5 19m11-7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
  moon: 'M20.7 14.3A9 9 0 0 1 9.7 3.3 9 9 0 1 0 20.7 14.3z',
  check: 'm5 12 4 4L19 6',
  qr: 'M3 3h6v6H3zm12 0h6v6h-6zM3 15h6v6H3zM15 21v-6h6m-3 3h3v3m-3 0h1',
  settings: 'M4 7h5m4 0h7M4 17h9m4 0h3M9 5v4m8 6v4',
  order: 'M5 3h14v18l-3-2-4 2-4-2-3 2zM8 8h8m-8 4h8',
  shield: 'M12 3 4 6v5c0 5 4 8 8 10 4-2 8-5 8-10V6zm-3 9 2 2 4-4',
  refund: 'M3 11h18M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm2 8h3',
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color?: string }) {
  const colors = useColors();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <Path d={paths[name]} fill="none" stroke={color ?? colors.inkSecondary} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
