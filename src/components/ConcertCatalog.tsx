import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors, usePreferences } from '../context/Preferences';
import { categoryApi, eventApi } from '../lib/api';
import { EventCard } from './EventCard';
import { Action, useResource } from './Flow';
import { GatewayLogo } from './GatewayLogo';
import { Icon } from './Icon';

async function loadCatalog() {
  const [events, categories] = await Promise.all([eventApi.getPublicEvents({ limit: 10000 }), categoryApi.getAll()]);
  return { events: events.data, categories, loadedAt: Date.now() };
}

export function ConcertCatalog({ home = false }: { home?: boolean }) {
  const colors = useColors();
  const { tr } = usePreferences();
  const catalog = useResource(loadCatalog);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = home ? 6 : 10;
  const events = catalog.data?.events ?? [];
  const loadedAt = catalog.data?.loadedAt ?? Infinity;
  const query = search.trim().toLowerCase();
  const filtered = events.filter(event => (!category || event.categoryId === category) &&
    (!query || (event.title + ' ' + event.location).toLowerCase().includes(query)));
  const featured = home && !query && !category && catalog.data
    ? filtered.find(event => Date.parse(event.endDatetime) > loadedAt &&
        event.ticketTypes?.some(type => type.availableQuota > 0))
    : undefined;
  const results = featured ? filtered.filter(event => event.id !== featured.id) : filtered;
  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = results.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const searchLabel = tr('Cari konser atau kota', 'Search concerts or cities');

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function selectCategory(value: string) {
    setCategory(value);
    setPage(1);
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <ScrollView keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={catalog.loading && !!catalog.data} tintColor={colors.gold} onRefresh={catalog.reload} />}
        contentContainerStyle={{ width: '100%', maxWidth: 680, alignSelf: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 }}>
        {home ? <View className="flex-row items-center gap-2 mb-1">
          <GatewayLogo size={28} />
          <Text accessibilityRole="header" className="text-ink-primary text-xl font-bold tracking-tight">Gateway</Text>
        </View> : <Text accessibilityRole="header" className="text-ink-primary text-3xl font-bold tracking-tight">{tr('Jelajahi konser', 'Explore concerts')}</Text>}

        <View className="bg-surface border border-line rounded-lg flex-row items-center gap-2.5 min-h-12 pl-3.5 pr-1.5">
          <Icon name="search" size={19} />
          <TextInput accessibilityLabel={searchLabel} value={search} onChangeText={updateSearch}
            placeholder={searchLabel} placeholderTextColor={colors.inkSecondary}
            returnKeyType="search" className="flex-1 text-ink-primary text-base py-2.5" />
          {!!search && <Pressable accessibilityRole="button" accessibilityLabel={tr('Hapus pencarian', 'Clear search')}
            onPress={() => updateSearch('')} className="min-w-11 min-h-11 items-center justify-center">
            <Icon name="close" size={17} />
          </Pressable>}
        </View>
        {!!catalog.data && <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 8 }}>
          {[{ id: '', name: tr('Semua', 'All') }, ...catalog.data.categories].map(item => (
            <Pressable key={item.id} accessibilityRole="button" aria-pressed={item.id === category}
              onPress={() => selectCategory(item.id)} className="px-3 min-h-11 justify-center border rounded-lg"
              style={{ borderColor: item.id === category ? colors.gold : colors.line, backgroundColor: item.id === category ? colors.highlight : colors.canvas }}>
              <Text className="text-sm font-medium" style={{ color: item.id === category ? colors.gold : colors.inkSecondary }}>{item.name}</Text>
            </Pressable>
          ))}
        </ScrollView>}

        {catalog.loading && !catalog.data && <ActivityIndicator className="py-8" color={colors.gold} />}
        {!!catalog.error && <View className="gap-2">
          <Text accessibilityRole="alert" className="text-danger text-sm">{tr('Daftar konser gagal dimuat.', 'Could not load concerts.')}</Text>
          <Action quiet label={tr('Coba lagi', 'Try again')} onPress={catalog.reload} />
        </View>}
        {!!featured && <View className="gap-2.5 pt-2">
          <Text accessibilityRole="header" className="text-ink-primary text-xl font-bold">{tr('Konser pilihan', 'Featured concert')}</Text>
          <EventCard event={featured} featured />
        </View>}
        {!!visible.length && <View className="gap-2.5 pt-1">
          {home && <Text accessibilityRole="header" className="text-ink-primary text-xl font-bold">{featured ? tr('Konser lainnya', 'More concerts') : tr('Konser', 'Concerts')}</Text>}
          {visible.map(event => <EventCard key={event.id} event={event} />)}
        </View>}
        {!!catalog.data && !filtered.length && <View className="gap-3 py-8 items-center">
          <Text className="text-ink-secondary text-base">{tr('Tidak ada konser yang ditemukan.', 'No concerts found.')}</Text>
          {!!(search || category) && <Action quiet label={tr('Reset filter', 'Reset filters')} onPress={() => { updateSearch(''); selectCategory(''); }} />}
        </View>}
        {totalPages > 1 && <View className="flex-row items-center justify-between gap-3">
          <Action quiet label={tr('Sebelumnya', 'Previous')} disabled={currentPage === 1} onPress={() => setPage(currentPage - 1)} />
          <Text className="text-ink-secondary text-sm">{currentPage} / {totalPages}</Text>
          <Action quiet label={tr('Berikutnya', 'Next')} disabled={currentPage === totalPages} onPress={() => setPage(currentPage + 1)} />
        </View>}
      </ScrollView>
    </SafeAreaView>
  );
}
