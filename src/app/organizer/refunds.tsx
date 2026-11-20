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
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { refundApi } from '../../lib/api';
import { Refund } from '../../types/api';
import { Colors } from '../../lib/theme';

const STATUS_FILTERS = [
  { label: 'ALL', value: 'ALL' },
  { label: 'PENDING APPROVAL', value: 'PENDING_APPROVAL' },
  { label: 'APPROVED', value: 'APPROVED' },
  { label: 'REJECTED', value: 'REJECTED' },
  { label: 'SUCCEEDED', value: 'SUCCEEDED' },
];

export default function OrganizerRefundsScreen() {
  const router = useRouter();
  const { user, isOrganizerApproved, isAdmin, loading: authLoading } = useAuth();

  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    } catch {
      setRefunds([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    if (user) {
      fetchRefunds();
    }
  }, [user, fetchRefunds]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRefunds();
  };

  const handleApprove = (id: string) => {
    Alert.alert(
      'Approve Refund',
      'Approve this refund request? Funds will be credited back to the attendee.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setProcessingId(id);
            setError(null);
            setSuccess(null);
            try {
              await refundApi.approveRefund(id);
              setSuccess('Refund request approved successfully.');
              await fetchRefunds();
            } catch (err: unknown) {
              const msg =
                err instanceof Error ? err.message : 'Failed to approve refund';
              setError(msg);
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

  const handleConfirmReject = async (id: string) => {
    if (!rejectReason.trim()) {
      Alert.alert('Required', 'Please enter a rejection reason.');
      return;
    }
    setProcessingId(id);
    setError(null);
    setSuccess(null);
    try {
      await refundApi.rejectRefund(id, rejectReason.trim());
      setSuccess('Refund request rejected.');
      setRejectingId(null);
      setRejectReason('');
      await fetchRefunds();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to reject refund';
      setError(msg);
    } finally {
      setProcessingId(null);
    }
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
          >
            ← Back
          </Text>
        </TouchableOpacity>
        <Text
          style={{ color: Colors.gold }}
          className="font-mono text-xs uppercase tracking-widest font-bold"
        >
          REFUND DESK
        </Text>
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
          >
            PROMOTER DESK // FINANCIAL SETTLEMENTS
          </Text>
          <Text
            style={{ color: Colors.inkPrimary }}
            className="text-2xl font-bold tracking-tight mb-3"
          >
            Attendee Refund Requests
          </Text>

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

        {Boolean(success) && (
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
              {success}
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
            >
              Loading refund requests...
            </Text>
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
            >
              NO REFUND REQUESTS FOUND
            </Text>
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
              const isProcessing = processingId === refund.id;
              const isRejecting = rejectingId === refund.id;

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
                  >
                    Order #{refund.order?.orderNumber || refund.orderId} ·{' '}
                    {formatDate(refund.createdAt)}
                  </Text>

                  <Text
                    style={{ color: Colors.inkSecondary }}
                    className="font-mono text-[11px] mb-2"
                  >
                    Applicant: {refund.requestedBy?.fullName} ({refund.requestedBy?.email})
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
                    >
                      Attendee Stated Reason
                    </Text>
                    <Text
                      style={{ color: Colors.inkPrimary }}
                      className="text-xs leading-relaxed"
                    >
                      "{refund.reason}"
                    </Text>
                  </View>

                  {Boolean(refund.adminReason) && (
                    <Text
                      style={{ color: Colors.terracotta }}
                      className="font-mono text-[11px] mb-2"
                    >
                      Rejection Remark: {refund.adminReason}
                    </Text>
                  )}

                  {/* Actions for PENDING_APPROVAL */}
                  {refund.status === 'PENDING_APPROVAL' && (
                    <View
                      style={{
                        borderTopColor: Colors.line,
                        borderTopWidth: 1,
                        paddingTop: 10,
                      }}
                    >
                      {isRejecting ? (
                        <View className="space-y-2">
                          <TextInput
                            value={rejectReason}
                            onChangeText={setRejectReason}
                            placeholder="State reason for rejecting refund..."
                            placeholderTextColor={Colors.edge}
                            style={{
                              backgroundColor: Colors.canvas,
                              borderColor: Colors.line,
                              borderWidth: 1,
                              color: Colors.inkPrimary,
                            }}
                            className="px-3 py-2 rounded-sm text-xs"
                          />
                          <View className="flex-row justify-end gap-2">
                            <TouchableOpacity
                              onPress={() => setRejectingId(null)}
                              style={{
                                borderColor: Colors.line,
                                borderWidth: 1,
                              }}
                              className="px-3 py-1.5 rounded-sm"
                            >
                              <Text
                                style={{ color: Colors.inkSecondary }}
                                className="font-mono text-xs uppercase"
                              >
                                Cancel
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleConfirmReject(refund.id)}
                              disabled={isProcessing}
                              style={{ backgroundColor: Colors.terracotta }}
                              className="px-3 py-1.5 rounded-sm"
                            >
                              <Text
                                style={{ color: Colors.canvas }}
                                className="font-mono text-xs uppercase font-bold"
                              >
                                Confirm Rejection
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <View className="flex-row items-center justify-end gap-2">
                          <TouchableOpacity
                            onPress={() => setRejectingId(refund.id)}
                            style={{
                              borderColor: Colors.terracotta,
                              borderWidth: 1,
                            }}
                            className="px-3 py-2 rounded-sm"
                            activeOpacity={0.7}
                          >
                            <Text
                              style={{ color: Colors.terracotta }}
                              className="font-mono text-xs uppercase font-bold"
                            >
                              Reject
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleApprove(refund.id)}
                            disabled={isProcessing}
                            style={{ backgroundColor: Colors.gold }}
                            className="px-4 py-2 rounded-sm flex-row items-center gap-1.5"
                            activeOpacity={0.8}
                          >
                            {isProcessing && (
                              <ActivityIndicator
                                size="small"
                                color={Colors.canvas}
                              />
                            )}
                            <Text
                              style={{ color: Colors.canvas }}
                              className="font-mono text-xs uppercase font-black"
                            >
                              Approve Refund
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
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
                  >
                    Previous
                  </Text>
                </TouchableOpacity>

                <Text
                  style={{ color: Colors.inkSecondary }}
                  className="font-mono text-xs"
                >
                  Page {page} of {totalPages}
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
                  >
                    Next
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
