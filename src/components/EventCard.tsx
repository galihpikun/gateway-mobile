import { mobileLabels } from '../lib/mobileLabels';
/**
 * Gateway Mobile — Event Card Component
 * Based on .concert-card in globals.css
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Event } from '../types/api';
import { usePreferences, useColors } from '../context/Preferences';

interface EventCardProps {
  event: Event;
  price: string;
  onPress: () => void;
}

export function EventCard({ event, price, onPress }: EventCardProps) {
  const { language: uiLanguage } = usePreferences();
  const ui = (label: string) => uiLanguage === 'id' ? mobileLabels[label] ?? label : label;
  const Colors = useColors();
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).toUpperCase();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-surface border border-line rounded-sm overflow-hidden"
    >
      {/* Image */}
      <View style={{ height: 160, backgroundColor: Colors.highlight }}>
        <Image
          source={{ uri: event.coverImageUrl }}
          style={{ flex: 1 }}
          contentFit="cover"
          transition={200}
        />
        {/* Category badge */}
        {event.category && (
          <View
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              backgroundColor: Colors.canvas + 'D9',
              paddingHorizontal: 7,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 8,
                fontFamily: 'monospace',
                letterSpacing: 0.4,
              }}
            >
              {event.category.name.toUpperCase()}
            </Text>
          </View>
        )}
        {/* Arrow */}
        <View
          style={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            width: 32,
            height: 32,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.4)',
            backgroundColor: 'rgba(16,20,21,0.6)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 14 }}>↗</Text>
        </View>
      </View>

      {/* Info */}
      <View className="p-3">
        <Text
          style={{
            fontSize: 9,
            fontFamily: 'monospace',
            color: Colors.inkSecondary,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 6,
          }}
        >
          {formatDate(event.startDatetime)}
        </Text>
        <Text
          className="text-ink-primary font-bold mb-1.5"
          style={{ fontSize: 15, letterSpacing: -0.4, lineHeight: 20 }}
          numberOfLines={2}
        >
          {event.title}
        </Text>
        <View className="flex-row items-center gap-1.5 mb-2">
          <Text style={{ color: Colors.inkSecondary, fontSize: 10 }}>📍</Text>
          <Text
            className="text-ink-secondary"
            style={{ fontSize: 10, flex: 1 }}
            numberOfLines={1}
          >
            {event.location}
          </Text>
        </View>

        {/* Price bar */}
        <View
          className="flex-row items-center justify-between pt-2 mt-1"
          style={{ borderTopWidth: 1, borderTopColor: Colors.line }}
        >
          <View className="flex-row items-center gap-1">
            <Text
              style={{
                fontSize: 10,
                color: Colors.inkSecondary,
                fontFamily: 'monospace',
              }}
            >{ui("From")}{' '}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: Colors.gold,
                fontWeight: '500',
              }}
            >
              {price}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 10,
              color: Colors.inkSecondary,
              fontFamily: 'monospace',
            }}
          >{ui("Get tickets →")}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
