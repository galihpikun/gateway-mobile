import { mobileLabels } from '../../lib/mobileLabels';
/**
 * Gateway Mobile — Event Detail Screen
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { usePreferences, useColors } from '../../context/Preferences';
import { canBuy } from '../../lib/checkout';
import { Icon } from '../../components/Icon';
import { ConcertMedia } from '../../components/ConcertMedia';
import { eventApi } from '../../lib/api';
import { Event } from '../../types/api';


export default function EventDetailScreen() {
  const ui = (label: string) => tr(mobileLabels[label] ?? label, label);
  const Colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { tr, language } = usePreferences();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    eventApi
      .getEventDetail(id)
      .then(setEvent)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    });

  const formatPrice = (price: number | string) => {
    const p = Number(price);
    if (p === 0) return ui('Free');
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(p);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-canvas items-center justify-center">
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView className="flex-1 bg-canvas items-center justify-center px-6">
        <Text className="text-ink-primary font-bold text-xl mb-2">{ui("Event not found")}</Text>
        <Text className="text-ink-secondary text-xs text-center mb-6">{ui("This event could not be loaded. It may have been removed.")}</Text>
        <TouchableOpacity
          accessibilityRole="button" accessibilityLabel={tr('Kembali', 'Back')}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/explore')}
          className="border border-edge px-5 py-2.5 rounded-sm"
        >
          <Text className="text-ink-primary text-xs font-mono">{ui("Go Back")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.canvas }}
      className="flex-1 bg-canvas"
      edges={['top', 'bottom']}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ width: '100%', maxWidth: 680, alignSelf: 'center' }}>
        {/* Cover Image */}
        <View style={{ height: 220, backgroundColor: Colors.highlight }}>
          <Image
            source={{ uri: event.coverImageUrl }}
            style={{ flex: 1 }}
            contentFit="cover"
            transition={300}
          />
          {/* Back button overlay */}
          <TouchableOpacity
            accessibilityRole="button" accessibilityLabel={tr('Kembali', 'Back')}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/explore')}
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              backgroundColor: Colors.canvas + 'CC',
              borderWidth: 1,
              borderColor: Colors.edge,
              width: 44,
              height: 44,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="back" color={Colors.inkPrimary} />
          </TouchableOpacity>

        </View>

        <View className="px-5 pt-5 pb-8">
          {!!event.category && <Text className="text-gold text-sm font-medium mb-2">{event.category.name}</Text>}

          {/* Title */}
          <Text accessibilityRole="header" className="text-ink-primary font-bold text-3xl tracking-tight mb-4">
            {event.title}
          </Text>

          {/* Key Details */}
          <View className="bg-surface border border-line rounded-xl p-4 mb-5 gap-3">
            <View className="flex-row gap-3">
              <Icon name="calendar" size={18} />
              <View className="flex-1">
                <Text className="text-ink-primary text-sm">
                  {formatDate(event.startDatetime)}
                </Text>
                <Text className="text-ink-secondary text-sm">
                  {formatTime(event.startDatetime)} —{' '}
                  {formatTime(event.endDatetime)} WIB
                </Text>
              </View>
            </View>
            <View className="flex-row gap-3">
              <Icon name="pin" size={18} />
              <Text className="text-ink-primary text-sm flex-1">
                {event.location}
              </Text>
            </View>
            {Boolean(event.organizer?.organizerProfile?.organizationName) && (
              <View className="flex-row gap-3">
                <Icon name="user" size={18} />
                <Text className="text-ink-primary text-sm flex-1">
                  {event.organizer?.organizerProfile?.organizationName}
                </Text>
              </View>
            )}
            <View className="flex-row gap-3">
              <Icon name="refund" size={18} />
              <Text className="text-ink-secondary text-sm flex-1">
                {event.isRefundable ? ui('Refundable') : ui('Non-refundable')}
              </Text>
            </View>
          </View>

          {/* Ticket Types */}
          <ConcertMedia event={event} />
          {event.ticketTypes && event.ticketTypes.length > 0 && (
            <View className="mb-5">
              <Text className="text-ink-primary text-lg font-bold mb-3">{ui("Ticket Types")}</Text>
              <View className="gap-2">
                {event.ticketTypes.map((type) => (
                  <View
                    key={type.id}
                    className="bg-surface border border-line rounded-lg px-4 py-3 flex-row items-center justify-between"
                  >
                    <View className="flex-1">
                      <Text className="text-ink-primary text-sm font-bold">
                        {type.name}
                      </Text>
                      <Text className="text-ink-secondary text-sm mt-0.5">
                        {type.availableQuota > 0
                          ? type.availableQuota + ' ' + tr('tersedia', 'available')
                          : ui('Sold out')}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-gold font-bold text-base">
                        {formatPrice(type.price)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          <View className="mb-5">
            <Text className="text-ink-primary text-lg font-bold mb-3">{ui("About this Event")}</Text>
            <Text
              className="text-ink-secondary text-sm leading-relaxed"
              style={{ lineHeight: 20 }}
            >
              {event.description}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Get Tickets CTA */}
      {canBuy(user, event) &&
        event.ticketTypes &&
        event.ticketTypes.some((t) => t.availableQuota > 0) && (
          <View
            style={{
              backgroundColor: Colors.canvas,
              borderTopWidth: 1,
              borderTopColor: Colors.line,
              padding: 16,
              paddingBottom: 12,
            }}
          >
            <View className="flex-row flex-wrap items-center justify-between gap-3 w-full max-w-[680px] self-center">
              <View>
                <Text className="text-ink-secondary text-sm uppercase tracking-widest">{ui("From")}</Text>
                <Text className="text-gold font-bold text-xl">
                  {(() => {
                    const prices =
                      event.ticketTypes
                        ?.filter((t) => t.availableQuota > 0)
                        .map((t) => Number(t.price)) || [];
                    if (!prices.length) return ui('Sold out');
                    const min = Math.min(...prices);
                    return min === 0
                      ? ui('Free')
                      : new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          maximumFractionDigits: 0,
                        }).format(min);
                  })()}
                </Text>
              </View>
              <Link href={{ pathname: '/checkout/[id]', params: { id: event.id } }} asChild>
                <Pressable accessibilityRole="link" className="bg-gold px-5 min-h-12 rounded-lg flex-row items-center gap-2">
                  <Text className="text-action-ink font-bold text-base">{tr('Beli tiket', 'Get tickets')}</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        )}
    </SafeAreaView>
  );
}
