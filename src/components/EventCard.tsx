import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useColors, usePreferences } from '../context/Preferences';
import type { Event } from '../types/api';
import { rupiah } from './Flow';
import { Icon } from './Icon';

export function EventCard({ event, featured = false }: { event: Event; featured?: boolean }) {
  const { tr, language } = usePreferences();
  const colors = useColors();
  const availablePrices = (event.ticketTypes ?? []).filter(type => type.availableQuota > 0).map(type => Number(type.price));
  const price = availablePrices.length ? Math.min(...availablePrices) : null;
  const priceLabel = price === null ? tr('Tiket habis', 'Sold out')
    : price === 0 ? tr('Gratis', 'Free') : tr('Mulai ', 'From ') + rupiah(price);
  const date = new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta',
  }).format(new Date(event.startDatetime));

  return (
    <Link href={{ pathname: '/event/[id]', params: { id: event.id } }} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={event.title + ', ' + date}
        className={'border border-line rounded-xl overflow-hidden ' + (featured ? '' : 'flex-row items-start gap-3 p-3')}
        style={({ pressed }) => ({ backgroundColor: pressed ? colors.highlight : colors.surface })}>
        {event.coverImageUrl ? (
          <Image source={event.coverImageUrl} contentFit="cover" style={featured ? { width: '100%', aspectRatio: 1.85 } : { width: 84, height: 94, borderRadius: 7, backgroundColor: colors.panel }} />
        ) : featured ? null : (
          <View className="w-[84px] h-[94px] bg-panel rounded-lg items-center justify-center">
            <Icon name="ticket" size={25} />
          </View>
        )}
        <View className={featured ? 'px-4 py-4 gap-2' : 'flex-1 gap-1.5 self-center'}>
          <View className="flex-row items-center gap-1.5">
            <Icon name="calendar" size={15} />
            <Text className="text-ink-secondary text-[13px] shrink">{date}</Text>
          </View>
          <Text className={featured ? 'text-ink-primary text-2xl font-bold tracking-tight' : 'text-ink-primary text-base font-bold'} numberOfLines={2}>{event.title}</Text>
          <View className="flex-row items-center gap-1.5">
            <Icon name="pin" size={15} />
            <Text numberOfLines={1} className="text-ink-secondary text-[13px] flex-1">{event.location}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-gold text-sm font-semibold flex-1">{priceLabel}</Text>
            <Icon name="next" size={17} color={colors.gold} />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
