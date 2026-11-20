import { mobileLabels } from '../../lib/mobileLabels';
/**
 * Gateway Mobile — Home Screen
 * Based on gateway-fe/src/app/page.tsx
 * Shows: featured event, event catalog with search and category filter.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { eventApi, categoryApi } from '../../lib/api';
import { Event, Category } from '../../types/api';
import { useAuth } from '../../context/AuthContext';
import { usePreferences, useColors } from '../../context/Preferences';
import { EventCard } from '../../components/EventCard';
import { FeaturedEvent } from '../../components/FeaturedEvent';
import { GatewayLogo } from '../../components/GatewayLogo';

export default function HomeScreen() {
  const { language: uiLanguage } = usePreferences();
  const ui = (label: string) => uiLanguage === 'id' ? mobileLabels[label] ?? label : label;
  const Colors = useColors();
  const { user } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

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

  const featured = events[0];
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

  if (loading) {
    return (
      <View
        style={{ flex: 1, backgroundColor: Colors.canvas }}
        className="flex-1 bg-canvas items-center justify-center"
      >
        <ActivityIndicator size="large" color={Colors.gold} />
        <Text
          style={{ color: Colors.inkSecondary }}
          className="text-ink-secondary text-xs font-mono mt-3 uppercase tracking-widest"
        >{ui("Loading concerts...")}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.canvas }}
      className="flex-1 bg-canvas"
      edges={['top']}
    >
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
        {/* Header */}
        <View className="px-4 pt-4 pb-3 flex-row items-center justify-between border-b border-line">
          <View className="flex-row items-center gap-2">
            <GatewayLogo size={28} />
            <Text className="text-ink-primary font-bold text-xl tracking-tighter">
              GATEWAY
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-ink-secondary text-xs font-mono uppercase tracking-wider">{ui("Hello,")}</Text>
            <Text
              className="text-ink-primary text-xs font-bold font-mono"
              numberOfLines={1}
            >
              {user?.fullName?.split(' ')[0] ?? 'Guest'}
            </Text>
          </View>
        </View>

        {/* Strip */}
        <View className="border-b border-line py-3 px-4 flex-row gap-5">
          <Text className="text-gold text-xs font-mono uppercase tracking-widest">{ui("GATEWAY / THE LIVE EXPERIENCE")}</Text>
        </View>

        {/* Featured Event */}
        {featured && (
          <View className="px-4 pt-5 pb-2">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-ink-secondary text-xs font-mono uppercase tracking-widest">{ui("IN THE SPOTLIGHT")}</Text>
              <Text className="text-ink-secondary text-xs">{ui("Worth being there for")}</Text>
            </View>
            <FeaturedEvent event={featured} price={formatPrice(featured)} />
          </View>
        )}

        {/* Catalog */}
        <View className="px-4 pt-6 pb-2">
          <Text className="text-ink-secondary text-xs font-mono uppercase tracking-widest mb-1">{ui("FIND YOUR FREQUENCY")}</Text>
          <Text className="text-ink-primary font-bold text-2xl tracking-tight mb-4">{ui("Find your moment.")}</Text>

          {/* Search bar */}
          <View className="flex-row items-center gap-2 bg-surface border border-line px-3 py-2 rounded-sm mb-4">
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
                <Text className="text-ink-secondary text-xs font-mono">✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
                  setSelectedCategory('');
                  setPage(1);
                }}
                className={`px-3 py-2 rounded-full border ${
                  !selectedCategory
                    ? 'border-edge bg-highlight'
                    : 'border-transparent'
                }`}
              >
                <Text
                  className={`text-xs font-mono ${
                    !selectedCategory ? 'text-ink-primary' : 'text-ink-secondary'
                  }`}
                >{ui("All concerts")}</Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    setPage(1);
                  }}
                  className={`px-3 py-2 rounded-full border ${
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
            {filtered.length}{ui("concerts to discover")}{" "}</Text>

          {/* Error state */}
          {error && (
            <View className="border border-line p-8 items-center rounded-sm mb-6">
              <Text className="text-ink-primary font-bold text-lg mb-2">{ui("Concerts could not be loaded")}</Text>
              <Text className="text-ink-secondary text-xs text-center mb-4">{ui("Please check your connection and try again.")}</Text>
              <TouchableOpacity
                onPress={() => {
                  setLoading(true);
                  fetchData();
                }}
                className="border border-edge px-4 py-2 rounded-sm"
              >
                <Text className="text-ink-primary text-xs font-mono">{ui("Try again")}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Event Grid */}
          {!error && (
            <>
              {visible.length === 0 ? (
                <View className="border border-line p-8 items-center rounded-sm mb-6">
                  <Text className="text-ink-primary font-bold text-lg mb-2">{ui("No concerts found")}</Text>
                  <Text className="text-ink-secondary text-xs text-center mb-4">{ui("Try another search or check back for new shows.")}</Text>
                  {Boolean(search || selectedCategory) && (
                    <TouchableOpacity
                      onPress={() => {
                        setSearch('');
                        setSelectedCategory('');
                        setPage(1);
                      }}
                      className="border border-edge px-4 py-2 rounded-sm"
                    >
                      <Text className="text-ink-primary text-xs font-mono">{ui("Clear filters")}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View className="gap-5 mb-6">
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
              {totalPages > 1 && (
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
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
