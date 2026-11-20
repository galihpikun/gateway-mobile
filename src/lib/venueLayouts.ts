export const zones = ['FRONT', 'MIDDLE', 'REAR', 'BALCONY'] as const;
export type Zone = typeof zones[number];

export const zoneNames = {
  FRONT: { id: 'Depan', en: 'Front' },
  MIDDLE: { id: 'Tengah', en: 'Middle' },
  REAR: { id: 'Belakang', en: 'Rear' },
  BALCONY: { id: 'Tribun atas', en: 'Upper stand' },
} as const;

export function zoneName(value?: string | null) {
  return zones.find(zone => zone === value);
}

export const venueLayouts = [
  { id: 'THEATER', name: 'Teater / Theater', upper: true, shape: 'theater' },
  { id: 'ARENA', name: 'Arena', upper: true, shape: 'arena' },
  { id: 'OUTDOOR', name: 'Lapangan terbuka / Open air', upper: false, shape: 'field' },
  { id: 'INDONESIA_ARENA', name: 'Indonesia Arena', upper: true, shape: 'arena' },
  { id: 'ISTORA', name: 'Istora Senayan', upper: false, shape: 'arena' },
  { id: 'JIS', name: 'Jakarta International Stadium', upper: true, shape: 'stadium' },
  { id: 'STADION_MADYA', name: 'Stadion Madya GBK', upper: false, shape: 'stadium' },
  { id: 'ICE_BSD', name: 'ICE BSD', upper: false, shape: 'hall' },
  { id: 'JIEXPO_THEATRE', name: 'JIExpo Theatre', upper: true, shape: 'theater' },
  { id: 'JIEXPO_HALL', name: 'JIExpo Exhibition Hall', upper: false, shape: 'hall' },
] as const;

export function venueZones(layout: string) {
  const entry = venueLayouts.find((item) => item.id === layout);
  return entry ? (entry.upper ? zones : zones.slice(0, 3)) : [];
}
