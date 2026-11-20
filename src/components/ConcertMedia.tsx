import { useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { usePreferences } from '../context/Preferences';
import { Action, Copy, Panel } from './Flow';
import type { Event } from '../types/api';
import { venueLayouts, venueZones, zoneNames, type Zone } from '../lib/venueLayouts';

function PreviewVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  return <VideoView player={player} style={{ width: '100%', aspectRatio: 16 / 9 }} nativeControls />;
}

export function ConcertMedia({ event }: { event: Event }) {
  const { tr, language } = usePreferences();
  const [preview, setPreview] = useState(false);
  const [zone, setZone] = useState<Zone>();
  const venue = venueLayouts.find(item => item.id === event.venueLayout);
  const areas = venueZones(event.venueLayout ?? '');
  if (!venue && !event.venueImageUrl && !event.previewVideoUrl) return null;
  const bands = {
    theater: [54, 70, 86, 68], arena: [62, 84, 96, 86], stadium: [52, 75, 98, 98],
    field: [68, 80, 100], hall: [84, 84, 84],
  } as const;

  return <View className="gap-3 mb-4">
    {(venue || event.venueImageUrl) && <Panel>
      <Copy bold>{tr('Denah venue', 'Venue plan')}</Copy>
      {venue && <>
        <Copy>{venue.name} · {tr('ilustrasi zona', 'illustrative zones')}</Copy>
        <View accessibilityLabel={tr('Urutan zona dari panggung', 'Zone order from the stage')} className="gap-2 items-center bg-panel p-3" style={{ borderRadius: venue.shape === 'arena' ? 34 : venue.shape === 'stadium' ? 22 : 6 }}>
          <View className="bg-field border border-edge items-center px-4 py-2 rounded-sm" style={{ width: venue.shape === 'hall' ? '68%' : '52%' }}>
            <Copy bold>{tr('Panggung', 'Stage')}</Copy>
          </View>
          {areas.map((area, index) => <View key={area} style={{ width: `${bands[venue.shape][index]}%`, maxWidth: 520 }}>
            <Action quiet={area !== zone} label={zoneNames[area][language]} onPress={() => setZone(area)} />
          </View>)}
        </View>
        {zone && <Copy>{(event.ticketTypes ?? []).filter(tier => tier.viewPosition === zone).map(tier => tier.name).join(' · ') || tr('Tidak ada jenis tiket di zona ini.', 'No ticket categories in this zone.')}</Copy>}
      </>}
      {!!event.venueImageUrl && <Image source={event.venueImageUrl} style={{ width: '100%', aspectRatio: 16 / 10 }} contentFit="contain" accessibilityLabel={tr('Denah resmi dari organizer', 'Official organizer plan')} />}
    </Panel>}
    {!!event.previewVideoUrl && <Panel>
      <Action quiet label={preview ? tr('Tutup video', 'Close video') : tr('Buka video konser', 'Open concert preview')} onPress={() => setPreview(previous => !previous)} />
      {preview && <PreviewVideo uri={event.previewVideoUrl} />}
    </Panel>}
  </View>;
}
