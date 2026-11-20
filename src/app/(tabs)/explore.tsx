import { mobileLabels } from '../../lib/mobileLabels';
/**
 * Gateway Mobile — Explore Screen
 * Full event catalog with search + category filter.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { eventApi, categoryApi } from '../../lib/api';
import { Event, Category } from '../../types/api';
import { usePreferences, useColors } from '../../context/Preferences';
import { EventCard } from '../../components/EventCard';

export default function ExploreScreen() {
  const { language: uiLanguage } = usePreferences();
  const ui = (label: string) => uiLanguage === 'id' ? mobileLabels[label] ?? label : label;
  const Colors = useColors();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const fetchData = useCallback(async () => {
    try {
      setError(false);
      const [eventsRes, cats] = await Promise.all([
        eventApi.getPublicEvents({ limit: 10000 }),
        categoryApi.getAll(),
      ]);
      setEvents(eventsRes.data);
      setCategories(cats);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Start the initial request and reset its error state.
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filtered = useMemo(
    () =>
      events.filter(
        (event) =>
          (!selectedCategory || event.categoryId === selectedCategory) &&
          `${event.title} ${event.location}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [events, selectedCategory, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatPrice = (event: Event) => {
    const prices =
      event.ticketTypes
        ?.filter((t) => t.availableQuota > 0)
        .map((t) => Number(t.price)) || [];
    if (!prices.length) return ui('Sold out');
    const min = Math.min(...prices);
    if (min === 0) return ui('Free');
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(min);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.canvas }}
      className="flex-1 bg-canvas"
      edges={['top']}
    >
      {/* Header */}
      <View className="px-4 pt-4 pb-3 border-b border-line">
        <Text className="text-ink-primary font-bold text-xl tracking-tight">{ui("Explore Concerts")}</Text>
        <Text className="text-ink-secondary text-xs font-mono mt-0.5">{ui("FIND YOUR FREQUENCY")}</Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-4">
          {/* Search */}
          <View className="flex-row items-center gap-2 bg-surface border border-line px-3 py-2.5 rounded-sm mb-3">
            <Text className="text-ink-secondary text-sm">🔍</Text>
            <TextInput
              value={search}
              onChangeText={(t) => {
                setSearch(t);
                setPage(1);
              }}
              placeholder={ui("Artist, concert or city")}
              placeholderTextColor={Colors.inkSecondary + '80'}
              className="flex-1 text-ink-primary text-xs font-mono"
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearch('');
                  setPage(1);
                }}
              >
                <Text className="text-ink-secondary font-mono text-xs">✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
          >
            <View className="flex-row gap-2 py-1">
              <TouchableOpacity
                onPress={() => {
                  setSelectedCategory('');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full border ${
                  !selectedCategory
                    ? 'border-edge bg-highlight'
                    : 'border-transparent'
                }`}
              >
                <Text
                  className={`text-xs font-mono ${
                    !selectedCategory
                      ? 'text-ink-primary'
                      : 'text-ink-secondary'
                  }`}
                >{ui("All")}</Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full border ${
                    selectedCategory === cat.id
                      ? 'border-edge bg-highlight'
                      : 'border-transparent'
                  }`}
                >
                  <Text
                    className={`text-xs font-mono ${
                      selectedCategory === cat.id
                        ? 'text-ink-primary'
                        : 'text-ink-secondary'
                    }`}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Count */}
          <Text className="text-ink-secondary text-xs font-mono mb-4">
            {loading ? 'Loading...' : `${filtered.length} concerts`}
          </Text>

          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color={Colors.gold} />
            </View>
          ) : error ? (
            <View className="border border-line p-8 items-center rounded-sm">
              <Text className="text-ink-primary font-bold mb-2">{ui("Could not load concerts")}</Text>
              <TouchableOpacity
                onPress={() => {
                  setLoading(true);
                  fetchData();
                }}
                className="border border-edge px-4 py-2 rounded-sm mt-2"
              >
                <Text className="text-ink-primary text-xs font-mono">{ui("Retry")}</Text>
              </TouchableOpacity>
            </View>
          ) : visible.length === 0 ? (
            <View className="border border-line p-8 items-center rounded-sm">
              <Text className="text-ink-primary font-bold mb-2">{ui("No concerts found")}</Text>
              {Boolean(search || selectedCategory) && (
                <TouchableOpacity
                  onPress={() => {
                    setSearch('');
                    setSelectedCategory('');
                    setPage(1);
                  }}
                  className="border border-edge px-4 py-2 rounded-sm mt-2"
                >
                  <Text className="text-ink-primary text-xs font-mono">{ui("Clear filters")}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View className="gap-4 mb-4">
              {visible.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  price={formatPrice(event)}
                  onPress={() =>
                    router.push(`/event/${event.id}` as any)
                  }
                />
              ))}
            </View>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <View className="flex-row items-center justify-between border-t border-line pt-4 mb-8">
              <TouchableOpacity
                onPress={() => setPage(page - 1)}
                disabled={page === 1}
                className={`border border-edge px-4 py-2 rounded-sm ${
                  page === 1 ? 'opacity-40' : ''
                }`}
              >
                <Text className="text-ink-primary text-xs font-mono">{ui("Previous")}</Text>
              </TouchableOpacity>
              <Text className="text-ink-secondary text-xs font-mono">
                {page} / {totalPages}
              </Text>
              <TouchableOpacity
                onPress={() => setPage(page + 1)}
                disabled={page === totalPages}
                className={`border border-edge px-4 py-2 rounded-sm ${
                  page === totalPages ? 'opacity-40' : ''
                }`}
              >
                <Text className="text-ink-primary text-xs font-mono">{ui("Next")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
