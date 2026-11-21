import { mobileLabels } from '../../lib/mobileLabels';
/**
 * Gateway Mobile — Profile Screen
 * - View & Edit personal info (Full name, Avatar)
 * - Security & Password change via single-use email OTP
 * - Promoter & Organizer studio shortcuts
 * - Cross-platform Sign Out with reliable navigation redirect
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../lib/api';
import { Icon, type IconName } from '../../components/Icon';
import { usePreferences, useColors } from '../../context/Preferences';

import {
  pickImageDocument,
  appendDocumentToFormData,
  PickedDocument,
} from '../../lib/filePicker';

function ProfileLink({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      className="flex-row min-h-14 items-center gap-3 border-t border-line px-4 py-3"
      style={({ pressed }) => ({ backgroundColor: pressed ? colors.highlight : colors.surface })}>
      <Icon name={icon} color={colors.gold} />
      <Text className="flex-1 text-ink-primary text-base font-semibold">{label}</Text>
      <Icon name="next" size={17} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const ui = (label: string) => tr(mobileLabels[label] ?? label, label);
  const Colors = useColors();
  const { tr } = usePreferences();
  const router = useRouter();
  const { user, logout, loading, refreshUser } = useAuth();

  // Profile Edit states
  const [fullName, setFullName] = useState('');
  const [avatarDoc, setAvatarDoc] = useState<PickedDocument | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Change with OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSaving, setPassSaving] = useState(false);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  // Logout state
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Synchronize the editable draft when the authenticated account changes.
      setFullName(user.fullName || '');
      setAvatarPreview(user.avatar ?? null);
    }
  }, [user]);

  // Sign out handler
  const executeLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (
        typeof window !== 'undefined' &&
        window.confirm(ui('Are you sure you want to sign out of Gateway?'))
      ) {
        executeLogout();
      }
    } else {
      Alert.alert(
        ui('Sign Out'),
        ui('Are you sure you want to sign out of Gateway?'),
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: ui('Sign Out'),
            style: 'destructive',
            onPress: executeLogout,
          },
        ],
      );
    }
  };

  // Pick new avatar image
  const handlePickAvatar = async () => {
    try {
      const doc = await pickImageDocument();
      if (doc) {
        setProfileError(null);
        setAvatarDoc(doc);
        setAvatarPreview(doc.uri);
      }
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : tr('Foto gagal dibuka.', 'Could not open the photo.'));
    }
  };

  // Save profile updates (fullName + avatar)
  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      setProfileError('Full name cannot be empty.');
      return;
    }
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      if (avatarDoc) {
        appendDocumentToFormData(formData, 'avatar', avatarDoc);
      }

      await authApi.updateMe(formData);
      await refreshUser();
      setAvatarDoc(null);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to update profile';
      setProfileError(msg);
    } finally {
      setProfileSaving(false);
    }
  };

  // Send Change Password OTP
  const handleSendPasswordOtp = async () => {
    setPassSaving(true);
    setPassError(null);
    try {
      await authApi.sendChangePasswordOtp();
      setOtpSent(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to dispatch password OTP';
      setPassError(msg);
    } finally {
      setPassSaving(false);
    }
  };

  // Confirm password change with OTP
  const handleChangePassword = async () => {
    setPassError(null);
    setPassSuccess(false);

    if (otpCode.trim().length !== 6) {
      setPassError('Please enter the 6-digit OTP code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('New password and confirmation do not match.');
      return;
    }

    setPassSaving(true);
    try {
      await authApi.changePassword(otpCode.trim(), newPassword);
      setPassSuccess(true);
      setOtpSent(false);
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(false), 3500);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to change password. Invalid OTP.';
      setPassError(msg);
    } finally {
      setPassSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ width: '100%', maxWidth: 600, alignSelf: 'center', paddingBottom: 20 }}>
        <View className="px-4 pt-5 pb-4 gap-1">
          <Text accessibilityRole="header" className="text-ink-primary text-3xl font-bold tracking-tight">{tr('Profil', 'Profile')}</Text>
          {!!user?.fullName && <Text className="text-ink-secondary text-base">{user.fullName}</Text>}
        </View>
        <View className="mx-4 bg-surface border border-line rounded-xl overflow-hidden">
          <ProfileLink icon="order" label={tr('Pesanan saya', 'My orders')} onPress={() => router.push('/orders')} />
          <ProfileLink icon="settings" label={tr('Pengaturan', 'Settings')} onPress={() => router.push('/settings')} />
          {user?.role === 'ADMIN' && <ProfileLink icon="shield" label={tr('Dashboard admin', 'Admin dashboard')} onPress={() => router.push('/admin')} />}
          {user?.role === 'STAFF' && <ProfileLink icon="qr" label={tr('Scanner gerbang', 'Gate scanner')} onPress={() => router.push('/staff')} />}
        </View>
        {/* Suspension warning */}
        {user?.isSuspended && (
          <View
            style={{
              backgroundColor: Colors.terracotta + '15',
              borderColor: Colors.terracotta,
              borderWidth: 1,
            }}
            className="mx-4 mt-4 p-3 rounded-sm"
          >
            <Text
              style={{ color: Colors.terracotta }}
              className="font-bold text-xs font-mono uppercase tracking-widest"
            >{ui("Account Suspended")}</Text>
            {Boolean(user.suspendReason) && (
              <Text
                style={{ color: Colors.danger }}
                className="text-xs font-mono mt-1"
              >
                {user.suspendReason}
              </Text>
            )}
          </View>
        )}

        {/* Section 1: Edit Personal Information & Avatar */}
        <View className="px-4 pt-5 pb-5">
          <Text
            style={{ color: Colors.inkSecondary }}
            className="text-ink-primary font-bold text-lg mb-2"
          >{ui("Personal Information")}</Text>

          <View
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.line,
              borderWidth: 1,
            }}
            className="p-4 rounded-xl"
          >
            {/* Avatar Preview & Picker */}
            <View className="items-center py-2 mb-4">
              {avatarPreview ? (
                <Image
                  source={{ uri: avatarPreview }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    borderWidth: 2,
                    borderColor: Colors.gold,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: Colors.highlight,
                    borderWidth: 2,
                    borderColor: Colors.edge,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: Colors.gold,
                      fontSize: 28,
                      fontWeight: '700',
                    }}
                  >
                    {user?.fullName?.[0]?.toUpperCase() ?? 'G'}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handlePickAvatar}
                style={{
                  borderColor: Colors.gold,
                  borderWidth: 1,
                  backgroundColor: Colors.gold + '15',
                }}
                className="mt-3 px-3 py-1.5 rounded-sm"
                activeOpacity={0.7}
              >
                <Text
                  style={{ color: Colors.gold }}
                  className="font-mono text-[11px] uppercase font-bold tracking-wider"
                >
                  {avatarDoc ? ui('Photo attached') : ui('Change Profile Picture')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Profile Success / Error alerts */}
            {profileSuccess && (
              <View
                style={{
                  backgroundColor: Colors.gold + '20',
                  borderColor: Colors.gold,
                  borderWidth: 1,
                }}
                className="p-2.5 mb-3 rounded-sm"
              >
                <Text
                  style={{ color: Colors.gold }}
                  className="font-mono text-xs font-bold text-center"
                >{ui("Profile updated successfully.")}</Text>
              </View>
            )}

            {Boolean(profileError) && (
              <View
                style={{
                  backgroundColor: Colors.terracotta + '15',
                  borderColor: Colors.terracotta,
                  borderWidth: 1,
                }}
                className="p-2.5 mb-3 rounded-sm"
              >
                <Text
                  style={{ color: Colors.danger }}
                  className="font-mono text-xs"
                >
                  {profileError}
                </Text>
              </View>
            )}

            {/* Editable Full Name */}
            <View className="mb-3">
              <Text
                style={{ color: Colors.inkSecondary }}
                className="font-mono text-[10px] uppercase tracking-wider mb-1"
              >{ui("Full Name")}</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder={ui("Your full name")}
                placeholderTextColor={Colors.edge}
                style={{
                  backgroundColor: Colors.canvas,
                  borderColor: Colors.line,
                  borderWidth: 1,
                  color: Colors.inkPrimary,
                }}
                className="px-3 py-2 rounded-sm text-xs font-semibold"
              />
            </View>

            {/* Email (Read Only) */}
            <View className="mb-4">
              <Text
                style={{ color: Colors.inkSecondary }}
                className="font-mono text-[10px] uppercase tracking-wider mb-1"
              >{ui("Registered Email Address")}</Text>
              <TextInput
                value={user?.email || ''}
                editable={false}
                style={{
                  backgroundColor: Colors.canvas,
                  borderColor: Colors.line,
                  borderWidth: 1,
                  color: Colors.inkSecondary,
                }}
                className="px-3 py-2 rounded-sm text-xs font-mono"
              />
              <Text
                style={{ color: Colors.gold }}
                className="font-mono text-[10px] mt-1"
              >
                {user?.emailVerified ? ui('Verified account') : ui('Unverified')}
              </Text>
            </View>

            {/* Save Profile Button */}
            <TouchableOpacity
              onPress={handleUpdateProfile}
              disabled={profileSaving}
              style={{
                backgroundColor: Colors.gold,
                opacity: profileSaving ? 0.6 : 1,
              }}
              className="py-2.5 rounded-sm items-center flex-row justify-center gap-2"
              activeOpacity={0.8}
            >
              {profileSaving ? (
                <ActivityIndicator size="small" color={Colors.canvas} />
              ) : null}
              <Text
                style={{ color: Colors.canvas }}
                className="font-mono text-xs uppercase font-bold tracking-widest"
              >
                {profileSaving ? ui('Saving Changes...') : ui('Save Profile Changes')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Change Password with OTP */}
        <View className="px-4 pb-5">
          <Text
            style={{ color: Colors.inkSecondary }}
            className="text-ink-primary font-bold text-lg mb-2"
          >{ui("Security")}</Text>

          <View
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.line,
              borderWidth: 1,
            }}
            className="p-4 rounded-xl"
          >
            <Text
              style={{ color: Colors.inkPrimary }}
              className="font-bold text-base mb-1"
            >{ui("Change Password")}</Text>
            <Text
              style={{ color: Colors.inkSecondary }}
              className="text-xs font-mono leading-relaxed mb-3"
            >{ui("Dispatches a single-use verification code to your email address before updating credentials.")}</Text>

            {passSuccess && (
              <View
                style={{
                  backgroundColor: Colors.gold + '20',
                  borderColor: Colors.gold,
                  borderWidth: 1,
                }}
                className="p-2.5 mb-3 rounded-sm"
              >
                <Text
                  style={{ color: Colors.gold }}
                  className="font-mono text-xs font-bold text-center"
                >{ui("Password updated successfully.")}</Text>
              </View>
            )}

            {Boolean(passError) && (
              <View
                style={{
                  backgroundColor: Colors.terracotta + '15',
                  borderColor: Colors.terracotta,
                  borderWidth: 1,
                }}
                className="p-2.5 mb-3 rounded-sm"
              >
                <Text
                  style={{ color: Colors.danger }}
                  className="font-mono text-xs"
                >
                  {passError}
                </Text>
              </View>
            )}

            {!otpSent ? (
              <TouchableOpacity
                onPress={handleSendPasswordOtp}
                disabled={passSaving}
                style={{
                  borderColor: Colors.line,
                  borderWidth: 1,
                  backgroundColor: Colors.canvas,
                  opacity: passSaving ? 0.6 : 1,
                }}
                className="py-3 rounded-sm items-center flex-row justify-center gap-2"
                activeOpacity={0.7}
              >
                {passSaving ? (
                  <ActivityIndicator size="small" color={Colors.gold} />
                ) : null}
                <Text
                  style={{ color: Colors.inkPrimary }}
                  className="font-mono text-xs uppercase font-bold tracking-wider"
                >
                  {passSaving
                    ? ui('DISPATCHING OTP...')
                    : ui('REQUEST PASSWORD CHANGE OTP')}
                </Text>
              </TouchableOpacity>
            ) : (
              <View className="space-y-3">
                <View className="mb-2">
                  <Text
                    style={{ color: Colors.gold }}
                    className="font-mono text-[10px] uppercase tracking-wider mb-1 font-bold"
                  >{ui("6-Digit OTP Code (Sent to")}{" "}{user?.email})
                  </Text>
                  <TextInput
                    value={otpCode}
                    onChangeText={setOtpCode}
                    maxLength={6}
                    keyboardType="number-pad"
                    placeholder="123456"
                    placeholderTextColor={Colors.edge}
                    style={{
                      backgroundColor: Colors.canvas,
                      borderColor: Colors.gold,
                      borderWidth: 1,
                      color: Colors.inkPrimary,
                    }}
                    className="px-3 py-2 rounded-sm text-sm font-mono tracking-widest text-center"
                  />
                </View>

                <View className="mb-2">
                  <Text
                    style={{ color: Colors.inkSecondary }}
                    className="font-mono text-[10px] uppercase tracking-wider mb-1"
                  >{ui("New Password")}</Text>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    placeholder={ui("Min 6 characters")}
                    placeholderTextColor={Colors.edge}
                    style={{
                      backgroundColor: Colors.canvas,
                      borderColor: Colors.line,
                      borderWidth: 1,
                      color: Colors.inkPrimary,
                    }}
                    className="px-3 py-2 rounded-sm text-xs font-mono"
                  />
                </View>

                <View className="mb-3">
                  <Text
                    style={{ color: Colors.inkSecondary }}
                    className="font-mono text-[10px] uppercase tracking-wider mb-1"
                  >{ui("Confirm New Password")}</Text>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    placeholder={ui("Re-enter new password")}
                    placeholderTextColor={Colors.edge}
                    style={{
                      backgroundColor: Colors.canvas,
                      borderColor: Colors.line,
                      borderWidth: 1,
                      color: Colors.inkPrimary,
                    }}
                    className="px-3 py-2 rounded-sm text-xs font-mono"
                  />
                </View>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setOtpSent(false)}
                    style={{
                      borderColor: Colors.line,
                      borderWidth: 1,
                      backgroundColor: Colors.canvas,
                    }}
                    className="px-3 py-2.5 rounded-sm items-center"
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{ color: Colors.inkSecondary }}
                      className="font-mono text-xs uppercase"
                    >{ui("Cancel")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleChangePassword}
                    disabled={passSaving || otpCode.length !== 6}
                    style={{
                      backgroundColor: Colors.gold,
                      opacity: passSaving || otpCode.length !== 6 ? 0.5 : 1,
                    }}
                    className="flex-1 py-2.5 rounded-sm items-center flex-row justify-center gap-2"
                    activeOpacity={0.8}
                  >
                    {passSaving ? (
                      <ActivityIndicator size="small" color={Colors.canvas} />
                    ) : null}
                    <Text
                      style={{ color: Colors.canvas }}
                      className="font-mono text-xs uppercase font-bold tracking-widest"
                    >
                      {passSaving ? ui('SAVING...') : ui('CONFIRM PASSWORD')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Section 4: Organizer Studio */}
        {user?.role === 'USER' && <View className="px-4 pb-6">
          <Text
            style={{ color: Colors.inkSecondary }}
            className="text-ink-primary font-bold text-lg mb-2"
          >{ui("Organizer Studio")}</Text>

          {user?.organizerProfile ? (
            <View
              style={{
                backgroundColor: Colors.surface,
                borderColor: Colors.line,
                borderWidth: 1,
              }}
              className="p-4 rounded-xl"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text
                  style={{ color: Colors.inkPrimary }}
                  className="font-bold text-base"
                >
                  {user.organizerProfile.organizationName || 'Promoter Profile'}
                </Text>
                <View
                  style={{
                    backgroundColor:
                      user.organizerProfile.status === 'APPROVED'
                        ? Colors.gold + '20'
                        : Colors.highlight,
                    borderColor:
                      user.organizerProfile.status === 'APPROVED'
                        ? Colors.gold
                        : Colors.edge,
                    borderWidth: 1,
                  }}
                  className="px-2 py-0.5 rounded-sm"
                >
                  <Text
                    style={{
                      color:
                        user.organizerProfile.status === 'APPROVED'
                          ? Colors.gold
                          : Colors.inkSecondary,
                    }}
                    className="font-mono text-[10px] uppercase font-bold"
                  >
                    {user.organizerProfile.status}
                  </Text>
                </View>
              </View>

              {user.organizerProfile.status === 'APPROVED' ? (
                <View className="mt-2 space-y-2">
                  <TouchableOpacity
                    onPress={() => router.push('/organizer/events' as any)}
                    style={{ backgroundColor: Colors.gold }}
                    className="py-2.5 px-4 rounded-sm items-center mb-2"
                    activeOpacity={0.8}
                  >
                    <Text
                      style={{ color: Colors.canvas }}
                      className="font-mono text-xs font-bold uppercase tracking-widest"
                    >{ui("Open Organizer Studio →")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push('/organizer/onboarding')}
                    style={{
                      borderColor: Colors.line,
                      borderWidth: 1,
                      backgroundColor: Colors.canvas,
                    }}
                    className="py-2 px-3 rounded-sm items-center"
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{ color: Colors.inkSecondary }}
                      className="font-mono text-[11px] uppercase tracking-wider"
                    >{ui("View verification documents")}</Text>
                  </TouchableOpacity>
                </View>
              ) : user.organizerProfile.status === 'PENDING' ? (
                <View className="mt-2">
                  <Text
                    style={{ color: Colors.inkSecondary }}
                    className="text-xs mb-3 leading-relaxed"
                  >{ui("Your statutory documents are currently under compliance review.")}</Text>
                  <TouchableOpacity
                    onPress={() => router.push('/organizer/onboarding')}
                    style={{
                      borderColor: Colors.gold,
                      borderWidth: 1,
                      backgroundColor: Colors.gold + '15',
                    }}
                    className="py-2.5 px-3 rounded-sm items-center"
                    activeOpacity={0.8}
                  >
                    <Text
                      style={{ color: Colors.gold }}
                      className="font-mono text-xs font-bold uppercase tracking-widest"
                    >{ui("View submitted documents")}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="mt-2">
                  {Boolean(user.organizerProfile.rejectionReason) && (
                    <Text
                      style={{ color: Colors.danger }}
                      className="font-mono text-xs mb-3"
                    >{ui("Remark:")}{" "}{user.organizerProfile.rejectionReason}
                    </Text>
                  )}
                  <TouchableOpacity
                    onPress={() => router.push('/organizer/onboarding')}
                    style={{ backgroundColor: Colors.gold }}
                    className="py-2.5 px-4 rounded-sm items-center"
                    activeOpacity={0.8}
                  >
                    <Text
                      style={{ color: Colors.canvas }}
                      className="font-mono text-xs font-bold uppercase tracking-widest"
                    >{ui("Reapply as Organizer →")}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View
              style={{
                backgroundColor: Colors.surface,
                borderColor: Colors.line,
                borderWidth: 1,
              }}
              className="p-4 rounded-xl"
            >
              <Text
                style={{ color: Colors.inkPrimary }}
                className="font-bold text-base mb-1"
              >{ui("Host & Publish Events")}</Text>
              <Text
                style={{ color: Colors.inkSecondary }}
                className="text-xs leading-relaxed mb-3"
              >{ui("Apply as an accredited event promoter to publish concerts, manage ticketing tiers, and monitor attendance.")}</Text>
              <TouchableOpacity
                onPress={() => router.push('/organizer/onboarding')}
                style={{
                  backgroundColor: Colors.gold,
                }}
                className="py-2.5 px-4 rounded-sm items-center"
                activeOpacity={0.8}
              >
                <Text
                  style={{ color: Colors.canvas }}
                  className="font-mono text-xs font-bold uppercase tracking-widest"
                >{ui("Apply as Organizer →")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>}

        {/* Section 5: Sign Out */}
        <View className="px-4 pb-10">
          <TouchableOpacity
            onPress={handleLogout}
            disabled={loggingOut || loading}
            style={{
              borderColor: Colors.terracotta,
              borderWidth: 1,
              backgroundColor: Colors.terracotta + '10',
            }}
            className="py-3.5 items-center rounded-sm flex-row justify-center gap-2"
            activeOpacity={0.75}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color={Colors.terracotta} />
            ) : null}
            <Text
              style={{ color: Colors.terracotta }}
              className="font-bold text-sm"
            >
              {loggingOut ? ui('Signing out...') : ui('Sign Out')}
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
