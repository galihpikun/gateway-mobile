/**
 * Gateway Mobile — My Tickets Screen
 * Shows user's issued tickets from the API.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { issuedTicketApi } from '../../lib/api';
import { IssuedTicket } from '../../types/api';
import { Colors } from '../../lib/theme';

function TicketItem({ ticket }: { ticket: IssuedTicket }) {
  const event = ticket.orderItem?.ticketType?.event;
  const ticketType = ticket.orderItem?.ticketType;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    });
  };

  const statusColor = ticket.isRedeemed
    ? Colors.edge
    : ticket.isCancelled || ticket.isRefunded
      ? Colors.terracotta
      : Colors.gold;

  const statusLabel = ticket.isRedeemed
    ? 'REDEEMED'
    : ticket.isCancelled
      ? 'CANCELLED'
      : ticket.isRefunded
        ? 'REFUNDED'
        : 'VALID';

  return (
    <View className="bg-surface border border-line rounded-sm mb-3 overflow-hidden">
      {/* Ticket header stripe */}
      <View
        style={{ backgroundColor: statusColor + '20', borderBottomWidth: 1, borderBottomColor: Colors.line }}
        className="px-4 py-2 flex-row items-center justify-between"
      >
        <Text className="text-ink-secondary text-xs font-mono uppercase tracking-widest">
          {ticketType?.name ?? 'Ticket'}
        </Text>
        <View
          style={{ backgroundColor: statusColor + '30', borderColor: statusColor, borderWidth: 1 }}
          className="px-2 py-0.5 rounded-sm"
        >
          <Text style={{ color: statusColor }} className="text-xs font-mono font-bold">
            {statusLabel}
          </Text>
        </View>
      </View>

      <View className="p-4">
        {/* Event name */}
        <Text className="text-ink-primary font-bold text-base mb-2" numberOfLines={2}>
          {event?.title ?? 'Unknown Event'}
        </Text>

        {/* Details */}
        <View className="gap-1.5 mb-3">
          {Boolean(event?.location) && (
            <View className="flex-row gap-2">
              <Text className="text-ink-secondary text-xs">📍</Text>
              <Text className="text-ink-secondary text-xs flex-1" numberOfLines={1}>
                {event!.location}
              </Text>
            </View>
          )}
          {Boolean(event?.startDatetime) && (
            <View className="flex-row gap-2">
              <Text className="text-ink-secondary text-xs">📅</Text>
              <Text className="text-ink-secondary text-xs">
                {formatDate(event!.startDatetime)}
              </Text>
            </View>
          )}
        </View>

        {/* Ticket code */}
        <View className="border-t border-line pt-3 flex-row items-center justify-between">
          <Text className="text-ink-secondary text-xs font-mono uppercase tracking-widest">
            Code
          </Text>
          <Text className="text-gold text-xs font-mono font-bold tracking-widest">
            {ticket.ticketCode}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function MyTicketsScreen() {
  const [tickets, setTickets] = useState<IssuedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      setError(false);
      const data = await issuedTicketApi.getMyTickets();
      setTickets(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.canvas }}
      className="flex-1 bg-canvas"
      edges={['top']}
    >
      {/* Header */}
      <View className="px-4 pt-4 pb-3 border-b border-line">
        <Text className="text-ink-primary font-bold text-xl tracking-tight">
          My Tickets
        </Text>
        <Text className="text-ink-secondary text-xs font-mono mt-0.5 uppercase tracking-widest">
          Your issued tickets
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text className="text-ink-secondary text-xs font-mono mt-3 uppercase tracking-widest">
            Loading tickets...
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4 pt-4"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.gold}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View className="border border-line p-8 items-center rounded-sm">
              <Text className="text-ink-primary font-bold mb-2">
                Could not load tickets
              </Text>
              <Text className="text-ink-secondary text-xs text-center mb-4">
                Please check your connection and try again.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setLoading(true);
                  fetchTickets();
                }}
                className="border border-edge px-4 py-2 rounded-sm"
              >
                <Text className="text-ink-primary text-xs font-mono">
                  Try again
                </Text>
              </TouchableOpacity>
            </View>
          ) : tickets.length === 0 ? (
            <View className="border border-line p-8 items-center rounded-sm">
              <Text className="text-4xl mb-4">🎫</Text>
              <Text className="text-ink-primary font-bold text-lg mb-2">
                No tickets yet
              </Text>
              <Text className="text-ink-secondary text-xs text-center">
                Purchase tickets to concerts and they'll appear here.
              </Text>
            </View>
          ) : (
            <View className="pb-6">
              <Text className="text-ink-secondary text-xs font-mono mb-4">
                {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} total
              </Text>
              {tickets.map((ticket) => (
                <TicketItem key={ticket.id} ticket={ticket} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
