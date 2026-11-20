import { mobileLabels } from '../../../lib/mobileLabels';
/**
 * Gateway Mobile — Organizer Studio / Workbench
 * Mirrors gateway-fe/src/app/organizer/events/page.tsx
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { eventApi } from '../../../lib/api';
import { Event, EventStatus } from '../../../types/api';
import { usePreferences, useColors } from '../../../context/Preferences';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'ALL', value: 'ALL' },
  { label: 'DRAFT', value: 'DRAFT' },
  { label: 'PENDING REVIEW', value: 'PENDING_REVIEW' },
  { label: 'PUBLISHED', value: 'PUBLISHED' },
  { label: 'COMPLETED', value: 'COMPLETED' },
  { label: 'REJECTED', value: 'REJECTED' },
];

export default function OrganizerEventsScreen() {
  const { language: uiLanguage } = usePreferences();
  const ui = (label: string) => uiLanguage === 'id' ? mobileLabels[label] ?? label : label;
  const Colors = useColors();
  const router = useRouter();
  const { user, isOrganizerApproved, loading: authLoading } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/(auth)/login');
      } else if (!isOrganizerApproved) {
        router.replace('/organizer/onboarding');
      }
    }
  }, [user, isOrganizerApproved, authLoading, router]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await eventApi.getMyOrganizerEvents({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        limit: 10,
      });
      setEvents(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    if (user && isOrganizerApproved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Set loading before fetching the requested page.
      fetchEvents();
    }
  }, [user, isOrganizerApproved, fetchEvents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const handleSubmitForReview = (id: string) => {
    Alert.alert(
      'Submit Event',
      'Submit this event for administrative review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setActionLoadingId(id);
            setActionError(null);
            setActionSuccess(null);
            try {
              await eventApi.submitEvent(id);
              setActionSuccess('Event submitted for admin review successfully.');
              await fetchEvents();
            } catch (err: unknown) {
              const msg =
                err instanceof Error ? err.message : 'Failed to submit event';
              setActionError(msg);
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ],
    );
  };

  const handleCompleteEvent = (id: string) => {
    Alert.alert(
      'Complete Event',
      'Are you sure you want to mark this event as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Completed',
          onPress: async () => {
            setActionLoadingId(id);
            setActionError(null);
            setActionSuccess(null);
            try {
              await eventApi.completeEvent(id);
              setActionSuccess('Event marked as completed.');
              await fetchEvents();
            } catch (err: unknown) {
              const msg =
                err instanceof Error
                  ? err.message
                  : 'Failed to mark event as completed';
              setActionError(msg);
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ],
    );
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadgeConfig = (status: EventStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return { label: 'PUBLISHED', color: Colors.gold };
      case 'PENDING_REVIEW':
        return { label: 'PENDING REVIEW', color: Colors.edge };
      case 'DRAFT':
        return { label: 'DRAFT', color: Colors.inkSecondary };
      case 'COMPLETED':
        return { label: 'COMPLETED', color: Colors.edge };
      case 'REJECTED':
      case ui('CANCELLED'):
        return { label: status, color: Colors.terracotta };
      default:
        return { label: status, color: Colors.inkSecondary };
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.canvas }}
      className="flex-1 bg-canvas"
      edges={['top']}
    >
      {/* Top Bar */}
      <View
        style={{ borderBottomColor: Colors.line, borderBottomWidth: 1 }}
        className="px-4 py-3 flex-row items-center justify-between"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="py-1 px-2"
        >
          <Text
            style={{ color: Colors.inkSecondary }}
            className="font-mono text-xs uppercase tracking-wider"
          >{ui("← Back")}</Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => router.push('/organizer/refunds')}
            style={{
              borderColor: Colors.line,
              borderWidth: 1,
              backgroundColor: Colors.surface,
            }}
            className="px-2.5 py-1.5 rounded-sm"
            activeOpacity={0.7}
          >
            <Text
              style={{ color: Colors.inkPrimary }}
              className="font-mono text-[11px] uppercase tracking-wider"
            >{ui("Refunds")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/organizer/events/new')}
            style={{ backgroundColor: Colors.gold }}
            className="px-3 py-1.5 rounded-sm"
            activeOpacity={0.8}
          >
            <Text
              style={{ color: Colors.canvas }}
              className="font-mono text-xs uppercase tracking-widest font-black"
            >{ui("+ New Event")}</Text>
          </TouchableOpacity>
        </View>
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
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Header */}
        <View
          style={{ borderBottomColor: Colors.line, borderBottomWidth: 1 }}
          className="pb-4 mb-4"
        >
          <Text
            style={{ color: Colors.inkSecondary }}
            className="font-mono text-xs uppercase tracking-widest mb-1"
          >{ui("PROMOTER WORKBENCH // EVENT MANAGEMENT")}</Text>
          <Text
            style={{ color: Colors.inkPrimary }}
            className="text-2xl font-bold tracking-tight mb-3"
          >{ui("Organizer Studio")}</Text>

          {/* Status Filters Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row gap-2 pt-2"
          >
            {STATUS_FILTERS.map((tab) => {
              const isActive = statusFilter === tab.value;
              return (
                <TouchableOpacity
                  key={tab.value}
                  onPress={() => {
                    setStatusFilter(tab.value);
                    setPage(1);
                  }}
                  style={{
                    backgroundColor: isActive
                      ? Colors.gold + '20'
                      : Colors.surface,
                    borderColor: isActive ? Colors.gold : Colors.line,
                    borderWidth: 1,
                  }}
                  className="px-3 py-1.5 rounded-sm mr-2"
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: isActive ? Colors.gold : Colors.inkSecondary,
                    }}
                    className="font-mono text-[11px] uppercase tracking-wider font-semibold"
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Action Alerts */}
        {Boolean(actionError) && (
          <View
            style={{
              backgroundColor: Colors.terracotta + '15',
              borderColor: Colors.terracotta,
              borderWidth: 1,
            }}
            className="p-3 mb-4 rounded-sm"
          >
            <Text
              style={{ color: Colors.danger }}
              className="font-mono text-xs"
            >
              {actionError}
            </Text>
          </View>
        )}

        {Boolean(actionSuccess) && (
          <View
            style={{
              backgroundColor: Colors.gold + '20',
              borderColor: Colors.gold,
              borderWidth: 1,
            }}
            className="p-3 mb-4 rounded-sm"
          >
            <Text
              style={{ color: Colors.gold }}
              className="font-mono text-xs font-bold"
            >
              {actionSuccess}
            </Text>
          </View>
        )}

        {/* Content */}
        {loading && !refreshing ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="small" color={Colors.gold} />
            <Text
              style={{ color: Colors.inkSecondary }}
              className="font-mono text-xs uppercase tracking-widest mt-3"
            >{ui("Loading organizer events...")}</Text>
          </View>
        ) : events.length === 0 ? (
          <View
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.line,
              borderWidth: 1,
            }}
            className="p-8 rounded-sm items-center justify-center my-6"
          >
            <Text
              style={{ color: Colors.inkSecondary }}
              className="font-mono text-xs uppercase tracking-widest font-bold mb-2 text-center"
            >{ui("NO ORGANIZER EVENTS FOUND")}</Text>
            <Text
              style={{ color: Colors.inkSecondary }}
              className="text-xs text-center leading-relaxed mb-4"
            >
              {statusFilter === 'ALL'
                ? 'You have not scheduled any events yet in your promoter workbench.'
                : `No events currently catalogued with status "${statusFilter}".`}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/organizer/events/new')}
              style={{ backgroundColor: Colors.gold }}
              className="py-2.5 px-5 rounded-sm"
              activeOpacity={0.8}
            >
              <Text
                style={{ color: Colors.canvas }}
                className="font-mono text-xs font-bold uppercase tracking-widest"
              >{ui("CREATE AN EVENT")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-4">
            {events.map((event) => {
              const isLoadingThis = actionLoadingId === event.id;
              const badge = getStatusBadgeConfig(event.status);

              return (
                <View
                  key={event.id}
                  style={{
                    backgroundColor: Colors.surface,
                    borderColor: Colors.line,
                    borderWidth: 1,
                  }}
                  className="p-4 rounded-sm mb-3.5"
                >
                  {/* Top row: Cover image + Event info */}
                  <View className="flex-row items-start gap-3">
                    <View
                      style={{
                        width: 72,
                        height: 72,
                        backgroundColor: Colors.canvas,
                        borderColor: Colors.line,
                        borderWidth: 1,
                      }}
                      className="rounded-sm overflow-hidden shrink-0"
                    >
                      {event.coverImageUrl ? (
                        <Image
                          source={{ uri: event.coverImageUrl }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="flex-1 items-center justify-center">
                          <Text
                            style={{ color: Colors.inkSecondary }}
                            className="font-mono text-[9px]"
                          >{ui("NO COVER")}</Text>
                        </View>
                      )}
                    </View>

                    <View className="flex-1 min-w-0">
                      {/* Badges */}
                      <View className="flex-row items-center gap-2 mb-1">
                        <View
                          style={{
                            backgroundColor: badge.color + '20',
                            borderColor: badge.color,
                            borderWidth: 1,
                          }}
                          className="px-2 py-0.5 rounded-sm"
                        >
                          <Text
                            style={{ color: badge.color }}
                            className="font-mono text-[9px] uppercase font-bold"
                          >
                            {badge.label}
                          </Text>
                        </View>
                        {Boolean(event.category?.name) && (
                          <Text
                            style={{ color: Colors.inkSecondary }}
                            className="font-mono text-[10px] uppercase tracking-wider"
                          >
                            {event.category?.name}
                          </Text>
                        )}
                      </View>

                      {/* Title */}
                      <Text
                        style={{ color: Colors.inkPrimary }}
                        className="font-bold text-base tracking-tight mb-1"
                        numberOfLines={1}
                      >
                        {event.title}
                      </Text>

                      {/* Date & Location */}
                      <Text
                        style={{ color: Colors.inkSecondary }}
                        className="font-mono text-[11px] mb-0.5"
                      >
                        📅 {formatDate(event.startDatetime)}
                      </Text>
                      <Text
                        style={{ color: Colors.inkSecondary }}
                        className="font-mono text-[11px]"
                        numberOfLines={1}
                      >
                        📍 {event.location}
                      </Text>
                    </View>
                  </View>

                  {/* Rejection Remark */}
                  {Boolean(
                    event.status === 'REJECTED' && event.rejectionReason,
                  ) && (
                    <View
                      style={{
                        backgroundColor: Colors.terracotta + '15',
                        borderColor: Colors.terracotta,
                        borderWidth: 1,
                      }}
                      className="p-2.5 rounded-sm mt-3"
                    >
                      <Text
                        style={{ color: Colors.danger }}
                        className="font-mono text-[11px]"
                      >{ui("Rejection Remark:")}{" "}{event.rejectionReason}
                      </Text>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View
                    style={{
                      borderTopColor: Colors.line,
                      borderTopWidth: 1,
                      marginTop: 12,
                      paddingTop: 10,
                    }}
                    className="flex-row flex-wrap items-center justify-end gap-2"
                  >
                    {/* Draft Actions */}
                    {event.status === 'DRAFT' && (
                      <>
                        <TouchableOpacity
                          onPress={() => router.push(`/organizer/events/${event.id}/edit` as any)}
                          style={{
                            borderColor: Colors.line,
                            borderWidth: 1,
                            backgroundColor: Colors.canvas,
                          }}
                          className="px-3 py-2 rounded-sm"
                          activeOpacity={0.7}
                        >
                          <Text
                            style={{ color: Colors.inkPrimary }}
                            className="font-mono text-xs uppercase tracking-wider"
                          >
                            Edit
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleSubmitForReview(event.id)}
                          disabled={isLoadingThis}
                          style={{
                            backgroundColor: Colors.gold,
                            opacity: isLoadingThis ? 0.6 : 1,
                          }}
                          className="px-3.5 py-2 rounded-sm flex-row items-center gap-1.5"
                          activeOpacity={0.8}
                        >
                          {isLoadingThis && (
                            <ActivityIndicator
                              size="small"
                              color={Colors.canvas}
                            />
                          )}
                          <Text
                            style={{ color: Colors.canvas }}
                            className="font-mono text-xs uppercase font-bold"
                          >{ui("Submit for Review")}</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {/* Published Actions */}
                    {event.status === 'PUBLISHED' && (
                      <>
                        <TouchableOpacity
                          onPress={() => router.push(`/event/${event.id}`)}
                          style={{
                            borderColor: Colors.line,
                            borderWidth: 1,
                            backgroundColor: Colors.canvas,
                          }}
                          className="px-3 py-2 rounded-sm"
                          activeOpacity={0.7}
                        >
                          <Text
                            style={{ color: Colors.inkPrimary }}
                            className="font-mono text-xs uppercase tracking-wider"
                          >{ui("View Live")}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => router.push(`/organizer/events/${event.id}/staff` as any)}
                          style={{
                            borderColor: Colors.line,
                            borderWidth: 1,
                            backgroundColor: Colors.surface,
                          }}
                          className="px-3 py-2 rounded-sm"
                          activeOpacity={0.7}
                        >
                          <Text
                            style={{ color: Colors.gold }}
                            className="font-mono text-xs uppercase tracking-wider font-bold"
                          >{ui("Staff Roster")}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleCompleteEvent(event.id)}
                          disabled={isLoadingThis}
                          style={{
                            borderColor: Colors.edge,
                            borderWidth: 1,
                            opacity: isLoadingThis ? 0.6 : 1,
                          }}
                          className="px-3 py-2 rounded-sm"
                          activeOpacity={0.7}
                        >
                          <Text
                            style={{ color: Colors.inkSecondary }}
                            className="font-mono text-xs uppercase tracking-wider"
                          >{ui("Mark Completed")}</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {/* Rejected Actions */}
                    {event.status === 'REJECTED' && (
                      <TouchableOpacity
                        onPress={() => router.push(`/organizer/events/${event.id}/edit` as any)}
                        style={{ backgroundColor: Colors.gold }}
                        className="px-3.5 py-2 rounded-sm"
                        activeOpacity={0.8}
                      >
                        <Text
                          style={{ color: Colors.canvas }}
                          className="font-mono text-xs uppercase font-bold"
                        >{ui("Edit & Resubmit")}</Text>
                      </TouchableOpacity>
                    )}

                    {/* Pending Review or Completed */}
                    {(event.status === 'PENDING_REVIEW' ||
                      event.status === 'COMPLETED') && (
                      <TouchableOpacity
                        onPress={() => router.push(`/organizer/events/${event.id}/edit` as any)}
                        style={{
                          borderColor: Colors.line,
                          borderWidth: 1,
                          backgroundColor: Colors.canvas,
                        }}
                        className="px-3 py-2 rounded-sm"
                        activeOpacity={0.7}
                      >
                        <Text
                          style={{ color: Colors.inkPrimary }}
                          className="font-mono text-xs uppercase tracking-wider"
                        >{ui("View Details")}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <View className="flex-row items-center justify-between pt-3 pb-6">
                <TouchableOpacity
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{
                    borderColor: Colors.line,
                    borderWidth: 1,
                    opacity: page <= 1 ? 0.4 : 1,
                  }}
                  className="px-4 py-2 rounded-sm"
                  activeOpacity={0.7}
                >
                  <Text
                    style={{ color: Colors.inkPrimary }}
                    className="font-mono text-xs uppercase"
                  >{ui("Previous")}</Text>
                </TouchableOpacity>

                <Text
                  style={{ color: Colors.inkSecondary }}
                  className="font-mono text-xs"
                >{ui("Page")}{" "}{page}{ui("of")}{" "}{totalPages}
                </Text>

                <TouchableOpacity
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={{
                    borderColor: Colors.line,
                    borderWidth: 1,
                    opacity: page >= totalPages ? 0.4 : 1,
                  }}
                  className="px-4 py-2 rounded-sm"
                  activeOpacity={0.7}
                >
                  <Text
                    style={{ color: Colors.inkPrimary }}
                    className="font-mono text-xs uppercase"
                  >{ui("Next")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
