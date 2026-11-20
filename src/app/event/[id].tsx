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
import { ConcertMedia } from '../../components/ConcertMedia';
import { eventApi } from '../../lib/api';
import { Event } from '../../types/api';


export default function EventDetailScreen() {
  const ui = (label: string) => tr(mobileLabels[label] ?? label, label);
  const Colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { tr } = usePreferences();

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
    new Date(dateStr).toLocaleDateString('id-ID', {
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
          onPress={() => router.back()}
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
      edges={['top']}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              backgroundColor: Colors.canvas + 'CC',
              borderWidth: 1,
              borderColor: Colors.edge,
              width: 36,
              height: 36,
              borderRadius: 4,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: Colors.inkPrimary, fontSize: 16 }}>←</Text>
          </TouchableOpacity>

          {/* Category badge */}
          {event.category && (
            <View
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                backgroundColor: Colors.canvas + 'CC',
              }}
              className="px-2 py-1"
            >
              <Text className="text-white text-xs font-mono uppercase tracking-widest">
                {event.category.name}
              </Text>
            </View>
          )}
        </View>

        <View className="px-4 pt-5 pb-10">
          {/* Category eyebrow */}
          <Text className="text-gold text-xs font-mono uppercase tracking-widest mb-2">
            {event.category?.name ?? 'Live Event'}
          </Text>

          {/* Title */}
          <Text className="text-ink-primary font-bold text-2xl tracking-tight mb-4">
            {event.title}
          </Text>

          {/* Key Details */}
          <View className="bg-surface border border-line rounded-sm p-4 mb-5 gap-3">
            <View className="flex-row gap-3">
              <Text className="text-ink-secondary text-sm w-5">📅</Text>
              <View className="flex-1">
                <Text className="text-ink-primary text-sm">
                  {formatDate(event.startDatetime)}
                </Text>
                <Text className="text-ink-secondary text-xs font-mono">
                  {formatTime(event.startDatetime)} —{' '}
                  {formatTime(event.endDatetime)} WIB
                </Text>
              </View>
            </View>
            <View className="flex-row gap-3">
              <Text className="text-ink-secondary text-sm w-5">📍</Text>
              <Text className="text-ink-primary text-sm flex-1">
                {event.location}
              </Text>
            </View>
            {Boolean(event.organizer?.organizerProfile?.organizationName) && (
              <View className="flex-row gap-3">
                <Text className="text-ink-secondary text-sm w-5">🎪</Text>
                <Text className="text-ink-primary text-sm flex-1">
                  {event.organizer?.organizerProfile?.organizationName}
                </Text>
              </View>
            )}
            <View className="flex-row gap-3">
              <Text className="text-ink-secondary text-sm w-5">🔄</Text>
              <Text className="text-ink-secondary text-xs font-mono flex-1">
                {event.isRefundable ? ui('Refundable') : ui('Non-refundable')}
              </Text>
            </View>
          </View>

          {/* Ticket Types */}
          <ConcertMedia event={event} />
          {event.ticketTypes && event.ticketTypes.length > 0 && (
            <View className="mb-5">
              <Text className="text-ink-secondary text-xs font-mono uppercase tracking-widest mb-3">{ui("Ticket Types")}</Text>
              <View className="gap-2">
                {event.ticketTypes.map((type) => (
                  <View
                    key={type.id}
                    className="bg-surface border border-line rounded-sm px-4 py-3 flex-row items-center justify-between"
                  >
                    <View className="flex-1">
                      <Text className="text-ink-primary text-sm font-bold">
                        {type.name}
                      </Text>
                      <Text className="text-ink-secondary text-xs font-mono mt-0.5">
                        {type.availableQuota > 0
                          ? `${type.availableQuota} available`
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
            <Text className="text-ink-secondary text-xs font-mono uppercase tracking-widest mb-3">{ui("About this Event")}</Text>
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
              paddingBottom: 32,
            }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-ink-secondary text-xs font-mono uppercase tracking-widest">{ui("From")}</Text>
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
                <Pressable accessibilityRole="link" className="bg-gold px-6 py-3 rounded-sm">
                  <Text className="text-action-ink font-bold text-sm uppercase tracking-widest">{tr('Beli tiket', 'Get tickets')}</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        )}
    </SafeAreaView>
  );
}
