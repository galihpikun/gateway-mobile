import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Action, useResource } from '../../components/Flow';
import { Icon } from '../../components/Icon';
import { TicketDialog, useTicketInfo } from '../../components/TicketDialog';
import { useColors, usePreferences } from '../../context/Preferences';
import { issuedTicketApi } from '../../lib/api';
import type { IssuedTicket } from '../../types/api';

function TicketCard({ ticket, onPress }: { ticket: IssuedTicket; onPress: () => void }) {
  const colors = useColors();
  const { tr, language } = usePreferences();
  const { event, category, status, tone, canScan } = useTicketInfo(ticket);
  const title = event?.title ?? tr('Tiket konser', 'Concert ticket');
  const date = event?.startDatetime && new Date(event.startDatetime).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta',
  });
  const suffix = ticket.ticketCode?.slice(-4);
  const action = canScan ? tr('Tampilkan QR', 'Show QR') : tr('Lihat tiket', 'View ticket');

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={[title, category, suffix, action].filter(Boolean).join(', ')}
      onPress={onPress} className="bg-surface border border-line rounded-xl overflow-hidden"
      style={({ pressed }) => ({ backgroundColor: pressed ? colors.highlight : colors.surface })}>
      {!!event?.ticketBackgroundUrl && <Image source={event.ticketBackgroundUrl} contentFit="cover" style={{ width: '100%', height: 92 }} />}
      <View className="px-4 pt-4 pb-5 gap-2.5">
        <View className="flex-row flex-wrap justify-between gap-2 items-center">
          <Text className="text-ink-secondary text-sm font-medium shrink">{category}</Text>
          <Text className="text-[13px] font-semibold" style={{ color: tone }}>{status}</Text>
        </View>
        <Text className="text-ink-primary text-xl tracking-tight font-bold">{title}</Text>
        {(date || event?.location) && <View className="gap-1.5">
          {!!date && <View className="flex-row gap-2 items-center">
            <Icon name="calendar" size={16} />
            <Text className="text-ink-secondary text-sm shrink">{date}</Text>
          </View>}
          {!!event?.location && <View className="flex-row gap-2 items-center">
            <Icon name="pin" size={16} />
            <Text className="text-ink-secondary text-sm shrink">{event.location}</Text>
          </View>}
        </View>}
      </View>
      <View className="mx-4 border-t border-line" style={{ borderStyle: 'dashed' }} />
      <View className="flex-row gap-2 items-center px-4 py-3.5 min-h-12">
        <Icon name={canScan ? 'qr' : 'ticket'} color={colors.gold} />
        <Text className="text-gold font-semibold text-sm flex-1">{action}</Text>
        {!!suffix && <Text className="text-ink-secondary text-xs" style={{ fontVariant: ['tabular-nums'] }}>{'…' + suffix}</Text>}
        <Icon name="next" size={17} color={colors.gold} />
      </View>
    </Pressable>
  );
}

export default function MyTicketsScreen() {
  const { tr } = usePreferences();
  const colors = useColors();
  const router = useRouter();
  const tickets = useResource(issuedTicketApi.getMyTickets);
  const [selectedId, setSelectedId] = useState<string>();
  const selected = tickets.data?.find(ticket => ticket.id === selectedId);

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <FlatList data={tickets.data ?? []} keyExtractor={ticket => ticket.id}
        refreshing={tickets.loading && tickets.data !== undefined} onRefresh={tickets.reload}
        contentContainerStyle={{ width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 28, gap: 14 }}
        ListHeaderComponent={<View className="pt-5 pb-1 gap-3">
          <Text accessibilityRole="header" className="text-ink-primary text-3xl font-bold tracking-tight">{tr('Tiket saya', 'My tickets')}</Text>
          {!!tickets.error && <View className="gap-2">
            <Text accessibilityRole="alert" className="text-danger text-sm">{tr('Tiket gagal dimuat.', 'Could not load tickets.')}</Text>
            <Action quiet label={tr('Coba lagi', 'Try again')} onPress={tickets.reload} />
          </View>}
        </View>}
        ListEmptyComponent={tickets.loading ? <ActivityIndicator color={colors.gold} className="py-10" /> : !tickets.error ? (
          <View className="py-12 gap-3 items-center">
            <Icon name="ticket" size={36} color={colors.gold} />
            <Text className="text-ink-primary font-bold text-lg">{tr('Belum ada tiket', 'No tickets yet')}</Text>
            <Action quiet label={tr('Jelajahi konser', 'Explore concerts')} onPress={() => router.push('/(tabs)/explore')} />
          </View>
        ) : undefined}
        renderItem={({ item }) => <TicketCard ticket={item} onPress={() => setSelectedId(item.id)} />}
      />
      {selected && <TicketDialog ticket={selected} onClose={() => setSelectedId(undefined)} />}
    </SafeAreaView>
  );
}
