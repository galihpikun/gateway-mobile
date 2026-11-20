import { mobileLabels } from '../../lib/mobileLabels';
/**
 * Gateway Mobile — Organizer Refunds Screen
 * Mirrors gateway-fe/src/app/organizer/refunds/page.tsx
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { refundApi } from '../../lib/api';
import { Refund } from '../../types/api';
import { usePreferences, useColors } from '../../context/Preferences';

const STATUS_FILTERS = [
  { label: 'ALL', value: 'ALL' },
  { label: 'PENDING APPROVAL', value: 'PENDING_APPROVAL' },
  { label: 'APPROVED', value: 'APPROVED' },
  { label: 'REJECTED', value: 'REJECTED' },
  { label: 'SUCCEEDED', value: 'SUCCEEDED' },
];

export default function OrganizerRefundsScreen() {
  const { language: uiLanguage } = usePreferences();
  const ui = (label: string) => uiLanguage === 'id' ? mobileLabels[label] ?? label : label;
  const Colors = useColors();
  const router = useRouter();
  const { user, isOrganizerApproved, isAdmin, loading: authLoading } = useAuth();

  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/(auth)/login');
      } else if (!isOrganizerApproved && !isAdmin) {
        router.replace('/organizer/onboarding');
      }
    }
  }, [user, isOrganizerApproved, isAdmin, authLoading, router]);

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await refundApi.getOrganizerRefunds({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        limit: 10,
      });
      setRefunds(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to load refunds.");
      setRefunds([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Set loading before fetching the selected page and status.
      fetchRefunds();
    }
  }, [user, fetchRefunds]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRefunds();
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
      case 'APPROVED':
        return Colors.gold;
      case 'REJECTED':
      case 'FAILED':
        return Colors.terracotta;
      default:
        return Colors.edge;
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
        <Text
          style={{ color: Colors.gold }}
          className="font-mono text-xs uppercase tracking-widest font-bold"
        >{ui("REFUND DESK")}</Text>
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
          >{ui("PROMOTER DESK // FINANCIAL SETTLEMENTS")}</Text>
          <Text
            style={{ color: Colors.inkPrimary }}
            className="text-2xl font-bold tracking-tight mb-3"
          >{ui("Attendee Refund Requests")}</Text>

          {/* Status Filters Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row gap-2 pt-1"
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

        {/* Alerts */}
        {Boolean(error) && (
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
              {error}
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
            >{ui("Loading refund requests...")}</Text>
          </View>
        ) : refunds.length === 0 ? (
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
            >{ui("NO REFUND REQUESTS FOUND")}</Text>
            <Text
              style={{ color: Colors.inkSecondary }}
              className="text-xs text-center leading-relaxed"
            >
              {statusFilter === 'ALL'
                ? 'There are currently no refund submissions for your scheduled events.'
                : `No refund records found with status "${statusFilter}".`}
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {refunds.map((refund) => {
              const statusColor = getStatusColor(refund.status);

              return (
                <View
                  key={refund.id}
                  style={{
                    backgroundColor: Colors.surface,
                    borderColor: Colors.line,
                    borderWidth: 1,
                  }}
                  className="p-4 rounded-sm mb-3.5"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text
                      style={{ color: Colors.inkPrimary }}
                      className="font-bold text-base"
                    >
                      {refund.event?.title || 'Concert Ticket'}
                    </Text>
                    <View
                      style={{
                        backgroundColor: statusColor + '20',
                        borderColor: statusColor,
                        borderWidth: 1,
                      }}
                      className="px-2 py-0.5 rounded-sm"
                    >
                      <Text
                        style={{ color: statusColor }}
                        className="font-mono text-[9px] uppercase font-bold"
                      >
                        {refund.status}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={{ color: Colors.gold }}
                    className="font-mono text-sm font-bold mb-1"
                  >
                    IDR {Number(refund.amount).toLocaleString('id-ID')}
                  </Text>

                  <Text
                    style={{ color: Colors.inkSecondary }}
                    className="font-mono text-[11px] mb-0.5"
                  >{ui("Order #")}{refund.order?.orderNumber || refund.orderId} ·{' '}
                    {formatDate(refund.createdAt)}
                  </Text>

                  <Text
                    style={{ color: Colors.inkSecondary }}
                    className="font-mono text-[11px] mb-2"
                  >{ui("Applicant:")}{" "}{refund.requestedBy?.fullName} ({refund.requestedBy?.email})
                  </Text>

                  <View
                    style={{
                      backgroundColor: Colors.canvas,
                      borderColor: Colors.line,
                      borderWidth: 1,
                    }}
                    className="p-2.5 rounded-sm mb-3"
                  >
                    <Text
                      style={{ color: Colors.inkSecondary }}
                      className="font-mono text-[9px] uppercase tracking-wider mb-0.5"
                    >{ui("Attendee Stated Reason")}</Text>
                    <Text
                      style={{ color: Colors.inkPrimary }}
                      className="text-xs leading-relaxed"
                    >
                      &quot;{refund.reason}&quot;
                    </Text>
                  </View>

                  {Boolean(refund.adminReason) && (
                    <Text
                      style={{ color: Colors.terracotta }}
                      className="font-mono text-[11px] mb-2"
                    >{ui("Rejection Remark:")}{" "}{refund.adminReason}
                    </Text>
                  )}

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
