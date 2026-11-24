import { mobileLabels } from '../../../../lib/mobileLabels';
/**
 * Gateway Mobile — Event Staff Roster Screen
 * Mirrors gateway-fe/src/app/organizer/events/[id]/staff/page.tsx
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../../context/AuthContext';
import { organizerApi, eventApi } from '../../../../lib/api';
import { User, Event } from '../../../../types/api';
import { usePreferences, useColors } from '../../../../context/Preferences';

interface StaffItem {
  id: string;
  type: 'ACTIVE' | 'PENDING';
  assignmentId?: string;
  invitationId?: string;
  eventId: string;
  eventTitle: string;
  eventStatus: string;
  startDatetime: string;
  userId: string;
  fullName: string;
  email: string;
  avatar?: string | null;
  createdAt: string;
}

export default function EventStaffScreen() {
  const { language: uiLanguage, tr } = usePreferences();
  const ui = (label: string) => uiLanguage === 'id' ? mobileLabels[label] ?? label : label;
  const Colors = useColors();
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isOrganizerApproved, loading: authLoading } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [activeStaff, setActiveStaff] = useState<StaffItem[]>([]);
  const [pendingStaff, setPendingStaff] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Invite states
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/(auth)/login');
      } else if (!isOrganizerApproved) {
        router.replace('/organizer/onboarding');
      }
    }
  }, [user, isOrganizerApproved, authLoading, router]);

  const loadData = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const [evData, staffData] = await Promise.all([
        eventApi.getOrganizerEventDetail(eventId),
        organizerApi.getStaff(eventId) as unknown as Promise<{
          active?: StaffItem[];
          pending?: StaffItem[];
        }>,
      ]);
      setEvent(evData);
      setActiveStaff(staffData?.active || []);
      setPendingStaff(staffData?.pending || []);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to load staff roster';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (user && isOrganizerApproved && eventId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Set loading before fetching assignments for the requested event.
      loadData();
    }
  }, [user, isOrganizerApproved, eventId, loadData]);

  const canSubmit = event?.status === 'DRAFT' || event?.status === 'REJECTED';
  const handleSubmit = async () => {
    if (!canSubmit || invitingId || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await eventApi.submitEvent(eventId);
      router.replace('/organizer/events');
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('Gagal mengajukan konser.', 'Failed to submit event.'));
      setSubmitting(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const users = await eventApi.searchInvitableUsers(searchQuery.trim());
      setSearchResults(users || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async (targetUserId: string) => {
    if (!eventId) return;
    if (submitting || invitingId) return;
    setInvitingId(targetUserId);
    setError(null);
    setSuccess(null);
    try {
      await eventApi.inviteStaff(eventId, targetUserId);
      setSuccess('Staff invitation sent successfully.');
      setSearchResults((prev) => prev.filter((u) => u.id !== targetUserId));
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to invite staff';
      setError(msg);
    } finally {
      setInvitingId(null);
    }
  };

  const handleRemove = (assignmentId?: string) => {
    if (!assignmentId || !eventId) return;
    Alert.alert(
      'Remove Staff',
      'Revoke ticket scanning privileges for this staff member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemovingId(assignmentId);
            setError(null);
            setSuccess(null);
            try {
              await eventApi.removeOrganizerStaff(eventId, assignmentId);
              setSuccess('Staff member removed.');
              await loadData();
            } catch (err: unknown) {
              const msg =
                err instanceof Error ? err.message : 'Failed to remove staff';
              setError(msg);
            } finally {
              setRemovingId(null);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: Colors.canvas }}
        className="flex-1 bg-canvas items-center justify-center p-6"
      >
        <ActivityIndicator size="large" color={Colors.gold} />
        <Text
          style={{ color: Colors.inkSecondary }}
          className="font-mono text-xs uppercase tracking-widest mt-4"
        >{ui("Loading staff roster...")}</Text>
      </SafeAreaView>
    );
  }

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
          onPress={() => router.canGoBack() ? router.back() : router.replace('/organizer/events')}
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
        >{ui("STAFF ROSTER")}</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Header */}
        <View
          style={{ borderBottomColor: Colors.line, borderBottomWidth: 1 }}
          className="pb-4 mb-5"
        >
          <Text
            style={{ color: Colors.inkSecondary }}
            className="font-mono text-xs uppercase tracking-widest mb-1"
          >{ui("GATE SCANNING ACCESS //")}{" "}{event?.title}
          </Text>
          <Text
            style={{ color: Colors.inkPrimary }}
            className="text-2xl font-bold tracking-tight mb-1"
          >{ui("Manage Scanning Staff")}</Text>
          <Text
            style={{ color: Colors.inkSecondary }}
            className="text-xs font-mono"
          >{ui("Authorize event crew members to redeem and scan attendee QR passes at gates.")}</Text>
          {canSubmit && <View className="mt-4 gap-2">
            <Text style={{ color: Colors.inkSecondary }} className="text-sm">
              {tr('Undangan staf aktif setelah konser disetujui.', 'Staff invitations activate when the event is approved.')}
            </Text>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting || Boolean(invitingId)}
              style={{ backgroundColor: Colors.gold, opacity: submitting || invitingId ? 0.5 : 1 }}
              className="self-start px-4 py-3 rounded-sm"
            >
              <Text style={{ color: Colors.canvas }} className="font-bold text-sm">
                {submitting ? tr('Mengajukan konser...', 'Submitting for review...') : tr('Ajukan untuk ditinjau', 'Submit for Review')}
              </Text>
            </TouchableOpacity>
          </View>}
        </View>

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

        {/* Section 1: Search & Invite Staff */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.line,
            borderWidth: 1,
          }}
          className="p-4 rounded-sm mb-5"
        >
          <Text
            style={{ color: Colors.gold }}
            className="font-mono text-xs font-bold uppercase tracking-widest mb-3"
          >{ui("+ Onboard Crew Member")}</Text>

          <View className="flex-row gap-2 mb-3">
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={ui("Search by full name or email")}
              placeholderTextColor={Colors.edge}
              style={{
                backgroundColor: Colors.canvas,
                borderColor: Colors.line,
                borderWidth: 1,
                color: Colors.inkPrimary,
              }}
              className="flex-1 px-3 py-2 rounded-sm text-xs font-mono"
            />
            <TouchableOpacity
              onPress={handleSearchUsers}
              disabled={searching}
              style={{ backgroundColor: Colors.gold }}
              className="px-4 py-2 rounded-sm items-center justify-center"
              activeOpacity={0.8}
            >
              {searching ? (
                <ActivityIndicator size="small" color={Colors.canvas} />
              ) : (
                <Text
                  style={{ color: Colors.canvas }}
                  className="font-mono text-xs font-bold uppercase"
                >{ui("Search")}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Search results */}
          {searchResults.length > 0 && (
            <View
              style={{
                backgroundColor: Colors.canvas,
                borderColor: Colors.line,
                borderWidth: 1,
              }}
              className="p-3 rounded-sm divide-y divide-[#2d3838]"
            >
              {searchResults.map((usr) => (
                <View
                  key={usr.id}
                  className="flex-row items-center justify-between py-2"
                >
                  <View className="flex-1 mr-2">
                    <Text
                      style={{ color: Colors.inkPrimary }}
                      className="font-mono text-xs font-bold"
                    >
                      {usr.fullName}
                    </Text>
                    <Text
                      style={{ color: Colors.inkSecondary }}
                      className="font-mono text-[10px]"
                    >
                      {usr.email}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleInvite(usr.id)}
                    disabled={invitingId === usr.id}
                    style={{
                      borderColor: Colors.gold,
                      borderWidth: 1,
                      backgroundColor: Colors.gold + '15',
                    }}
                    className="px-3 py-1.5 rounded-sm"
                    activeOpacity={0.8}
                  >
                    <Text
                      style={{ color: Colors.gold }}
                      className="font-mono text-[10px] font-bold uppercase"
                    >
                      {invitingId === usr.id ? 'Inviting...' : '+ Invite'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Section 2: Active Staff Roster */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.line,
            borderWidth: 1,
          }}
          className="p-4 rounded-sm mb-5"
        >
          <Text
            style={{ color: Colors.gold }}
            className="font-mono text-xs font-bold uppercase tracking-widest mb-3"
          >{ui("Active Gate Scanning Crew (")}{activeStaff.length})
          </Text>

          {activeStaff.length === 0 ? (
            <Text
              style={{ color: Colors.inkSecondary }}
              className="text-xs font-mono py-2"
            >{ui("No active scanning staff assigned to this event yet.")}</Text>
          ) : (
            <View className="space-y-2">
              {activeStaff.map((staff) => (
                <View
                  key={staff.id}
                  style={{
                    backgroundColor: Colors.canvas,
                    borderColor: Colors.line,
                    borderWidth: 1,
                  }}
                  className="p-3 rounded-sm flex-row items-center justify-between mb-2"
                >
                  <View className="flex-1 mr-2">
                    <Text
                      style={{ color: Colors.inkPrimary }}
                      className="font-mono text-xs font-bold"
                    >
                      {staff.fullName}
                    </Text>
                    <Text
                      style={{ color: Colors.inkSecondary }}
                      className="font-mono text-[10px]"
                    >
                      {staff.email}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemove(staff.assignmentId)}
                    disabled={removingId === staff.assignmentId}
                    style={{
                      borderColor: Colors.terracotta,
                      borderWidth: 1,
                    }}
                    className="px-2.5 py-1 rounded-sm"
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{ color: Colors.terracotta }}
                      className="font-mono text-[10px] uppercase font-bold"
                    >
                      {removingId === staff.assignmentId ? '...' : 'Revoke'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Section 3: Pending Invitations */}
        {pendingStaff.length > 0 && (
          <View
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.line,
              borderWidth: 1,
            }}
            className="p-4 rounded-sm"
          >
            <Text
              style={{ color: Colors.inkSecondary }}
              className="font-mono text-xs font-bold uppercase tracking-widest mb-3"
            >{ui("Pending Invitations (")}{pendingStaff.length})
            </Text>
            {pendingStaff.map((staff) => (
              <View
                key={staff.id}
                style={{
                  backgroundColor: Colors.canvas,
                  borderColor: Colors.line,
                  borderWidth: 1,
                }}
                className="p-3 rounded-sm flex-row items-center justify-between mb-2"
              >
                <View>
                  <Text
                    style={{ color: Colors.inkPrimary }}
                    className="font-mono text-xs font-bold"
                  >
                    {staff.fullName}
                  </Text>
                  <Text
                    style={{ color: Colors.inkSecondary }}
                    className="font-mono text-[10px]"
                  >
                    {staff.email}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: Colors.highlight,
                    borderColor: Colors.edge,
                    borderWidth: 1,
                  }}
                  className="px-2 py-0.5 rounded-sm"
                >
                  <Text
                    style={{ color: Colors.inkSecondary }}
                    className="font-mono text-[9px] uppercase font-bold"
                  >{ui("Pending")}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
