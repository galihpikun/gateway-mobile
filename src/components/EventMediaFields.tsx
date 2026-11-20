import { View } from 'react-native';
import { usePreferences } from '../context/Preferences';
import { Action, Copy, Panel } from './Flow';
import { venueLayouts, venueZones, zoneNames, type Zone } from '../lib/venueLayouts';

export type MediaField = 'previewVideo' | 'ticketBackground' | 'venueImage';

export function EventMediaFields({ layout, onLayout, names, onPick, disabled }: {
  layout: string; onLayout: (id: string) => void; names: Partial<Record<MediaField, string>>;
  onPick: (field: MediaField) => void; disabled?: boolean;
}) {
  const { tr } = usePreferences();
  const fields = [
    ['previewVideo', tr('Video preview · MP4/WebM maks. 25 MB', 'Video preview · MP4/WebM up to 25 MB')],
    ['ticketBackground', tr('Foto latar tiket · maks. 5 MB', 'Ticket background · up to 5 MB')],
    ['venueImage', tr('Denah resmi opsional · maks. 5 MB', 'Optional official plan · up to 5 MB')],
  ] as const;
  return <Panel>
    <Copy bold>{tr('Layout dan media konser', 'Concert layout and media')}</Copy>
    <View className="flex-row flex-wrap gap-2">
      {venueLayouts.map(venue => <Action key={venue.id} quiet={venue.id !== layout} disabled={disabled} label={venue.name} onPress={() => onLayout(venue.id)} />)}
    </View>
    {fields.map(([key, label]) => <View key={key} className="gap-1">
      <Action quiet label={label} onPress={() => onPick(key)} disabled={disabled} />
      {!!names[key] && <Copy>{names[key]}</Copy>}
    </View>)}
  </Panel>;
}

export function ZoneChoices({ layout, value, onChange, disabled }: {
  layout: string; value?: string | null; onChange: (zone: Zone) => void; disabled?: boolean;
}) {
  const { tr, language } = usePreferences();
  return <View className="gap-2 mt-2">
    <Copy>{tr('Zona tiket', 'Ticket zone')}</Copy>
    <View className="flex-row flex-wrap gap-2">
      {venueZones(layout).map(zone => <Action key={zone} quiet={zone !== value} label={zoneNames[zone][language]} onPress={() => onChange(zone)} disabled={disabled} />)}
    </View>
  </View>;
}
