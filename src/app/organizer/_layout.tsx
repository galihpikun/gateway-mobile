/**
 * Gateway Mobile — Organizer Routes Stack
 * Includes:
 * - /organizer/onboarding (Apply as organizer / view dossier)
 * - /organizer/events (Organizer studio & event list)
 * - /organizer/events/new (Create new event)
 * - /organizer/events/[id]/edit (Edit event & ticket tiers)
 * - /organizer/events/[id]/staff (Manage gate scanning staff)
 * - /organizer/refunds (Manage refund requests)
 */
import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '../../lib/theme';

export default function OrganizerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.canvas },
      }}
    >
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="events/index" options={{ headerShown: false }} />
      <Stack.Screen name="events/new" options={{ headerShown: false }} />
      <Stack.Screen name="events/[id]/edit" options={{ headerShown: false }} />
      <Stack.Screen name="events/[id]/staff" options={{ headerShown: false }} />
      <Stack.Screen name="refunds" options={{ headerShown: false }} />
    </Stack>
  );
}
