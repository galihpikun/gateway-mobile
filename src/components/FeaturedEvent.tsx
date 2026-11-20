import { mobileLabels } from '../lib/mobileLabels';
/**
 * Gateway Mobile — Featured Event Component
 * Based on .featured-event in globals.css
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Event } from '../types/api';
import { usePreferences, useColors } from '../context/Preferences';

interface FeaturedEventProps {
  event: Event;
  price: string;
}

export function FeaturedEvent({ event, price }: FeaturedEventProps) {
  const { language: uiLanguage } = usePreferences();
  const ui = (label: string) => uiLanguage === 'id' ? mobileLabels[label] ?? label : label;
  const Colors = useColors();
  const router = useRouter();

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    });

  return (
    <TouchableOpacity
      onPress={() => router.push(`/event/${event.id}` as any)}
      activeOpacity={0.85}
      style={{
        borderWidth: 1,
        borderColor: Colors.line,
        backgroundColor: Colors.panel,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Image */}
      <View style={{ height: 200, backgroundColor: Colors.highlight }}>
        <Image
          source={{ uri: event.coverImageUrl }}
          style={{ flex: 1 }}
          contentFit="cover"
          transition={300}
        />
        {/* UP NEXT badge */}
        <View
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            backgroundColor: 'rgba(16,20,21,0.7)',
            paddingHorizontal: 9,
            paddingVertical: 5,
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 8,
              fontFamily: 'monospace',
              letterSpacing: 2,
            }}
          >{ui("UP NEXT")}</Text>
        </View>
        {/* LIVE label */}
        <View
          style={{
            position: 'absolute',
            bottom: 14,
            left: 14,
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 20,
              fontWeight: '700',
              letterSpacing: 1,
            }}
          >{ui("LIVE")}</Text>
        </View>
        <View
          style={{
            position: 'absolute',
            bottom: 14,
            right: 14,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 24 }}>↗</Text>
        </View>
      </View>

      {/* Copy */}
      <View style={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 9,
            fontFamily: 'monospace',
            color: Colors.gold,
            textTransform: 'uppercase',
            letterSpacing: 1.8,
            marginBottom: 6,
          }}
        >
          {event.category?.name ?? 'Live Music'}
        </Text>
        <Text
          style={{
            fontSize: 20,
            fontWeight: '600',
            color: Colors.inkPrimary,
            letterSpacing: -0.8,
            lineHeight: 24,
            marginBottom: 10,
          }}
          numberOfLines={2}
        >
          {event.title}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Text style={{ color: Colors.inkSecondary, fontSize: 11 }}>📅</Text>
          <Text style={{ color: Colors.inkSecondary, fontSize: 11 }}>
            {formatDate(event.startDatetime)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <Text style={{ color: Colors.inkSecondary, fontSize: 11 }}>📍</Text>
          <Text
            style={{ color: Colors.inkSecondary, fontSize: 11, flex: 1 }}
            numberOfLines={1}
          >
            {event.location}
          </Text>
        </View>

        {/* Price + CTA */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTopWidth: 1,
            borderTopColor: Colors.line,
            paddingTop: 14,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 9,
                fontFamily: 'monospace',
                color: Colors.inkSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1.8,
                marginBottom: 2,
              }}
            >{ui("From")}</Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '500',
                color: Colors.gold,
              }}
            >
              {price}
            </Text>
          </View>

          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: Colors.edge,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: Colors.gold + '20',
            }}
          >
            <Text style={{ color: Colors.gold, fontSize: 20 }}>↗</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
