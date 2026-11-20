/**
 * Gateway Mobile — Organizer Onboarding & Verification Dossier
 * Mirrors gateway-fe/src/app/organizer/onboarding/page.tsx
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
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { organizerApi } from '../../lib/api';
import { OrganizerProfile, OrganizerDocument } from '../../types/api';
import { Colors } from '../../lib/theme';
import {
  pickImageDocument,
  appendDocumentToFormData,
  PickedDocument,
} from '../../lib/filePicker';

export default function OrganizerOnboardingScreen() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [organizationName, setOrganizationName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [identityCardNumber, setIdentityCardNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');

  // 4 Required compliance documents
  const [businessLicense, setBusinessLicense] = useState<PickedDocument | null>(null);
  const [guaranteeLetter, setGuaranteeLetter] = useState<PickedDocument | null>(null);
  const [organizationRegistration, setOrganizationRegistration] =
    useState<PickedDocument | null>(null);
  const [identityCard, setIdentityCard] = useState<PickedDocument | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await organizerApi.getMyProfile();
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/(auth)/login');
      return;
    }
    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, router, fetchProfile]);

  const handlePickDocument = async (
    setter: React.Dispatch<React.SetStateAction<PickedDocument | null>>,
  ) => {
    try {
      const doc = await pickImageDocument();
      if (doc) {
        if (doc.size > 5 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Maximum file size allowed is 5 MB.');
          return;
        }
        setter(doc);
      }
    } catch (err) {
      console.warn('Pick document error:', err);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (
      !organizationName.trim() ||
      !phoneNumber.trim() ||
      !address.trim() ||
      !bankName.trim() ||
      !bankAccountNumber.trim() ||
      !bankAccountName.trim()
    ) {
      setError('Please complete all required organization and banking fields.');
      return;
    }

    if (
      !businessLicense ||
      !guaranteeLetter ||
      !organizationRegistration ||
      !identityCard
    ) {
      setError(
        'All 4 legal verification documents (JPEG/PNG/WebP, max 5MB) are required.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('organizationName', organizationName.trim());
      formData.append('phoneNumber', phoneNumber.trim());
      formData.append('address', address.trim());
      if (identityCardNumber.trim()) {
        formData.append('identityCardNumber', identityCardNumber.trim());
      }
      formData.append('bankName', bankName.trim());
      formData.append('bankAccountNumber', bankAccountNumber.trim());
      formData.append('bankAccountName', bankAccountName.trim());

      appendDocumentToFormData(formData, 'businessLicense', businessLicense);
      appendDocumentToFormData(formData, 'guaranteeLetter', guaranteeLetter);
      appendDocumentToFormData(
        formData,
        'organizationRegistration',
        organizationRegistration,
      );
      appendDocumentToFormData(formData, 'identityCard', identityCard);

      const res = await organizerApi.apply(formData);
      setSuccess(res.message || 'Application submitted successfully.');
      await refreshUser();
      await fetchProfile();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to submit application.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: Colors.canvas }}
        className="flex-1 bg-canvas items-center justify-center p-6"
      >
        <ActivityIndicator size="large" color={Colors.gold} />
        <Text
          style={{ color: Colors.inkSecondary }}
          className="font-mono text-xs uppercase tracking-widest mt-4 text-center"
        >
          LOADING PROMOTER DOSSIER...
        </Text>
      </SafeAreaView>
    );
  }

  // Active / Submitted Dossier View (PENDING or APPROVED)
  if (profile && profile.status !== 'REJECTED') {
    const isApproved = profile.status === 'APPROVED';
    const statusColor = isApproved ? Colors.gold : Colors.edge;

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
            GATEWAY PROMOTER
          </Text>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {/* Dossier Card */}
          <View
            style={{
              backgroundColor: Colors.surface,
              borderColor: Colors.line,
              borderWidth: 1,
            }}
            className="p-5 rounded-sm mb-6"
          >
            <View
              style={{ borderBottomColor: Colors.line, borderBottomWidth: 1 }}
              className="pb-4 mb-4 flex-row items-start justify-between"
            >
              <View className="flex-1 mr-2">
                <Text
                  style={{ color: Colors.inkSecondary }}
                  className="font-mono text-[10px] uppercase tracking-widest mb-1"
                >
                  ORGANIZER VERIFICATION DOSSIER
                </Text>
                <Text
                  style={{ color: Colors.inkPrimary }}
                  className="font-bold text-2xl tracking-tight"
                >
                  {profile.organizationName}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: statusColor + '20',
                  borderColor: statusColor,
                  borderWidth: 1,
                }}
                className="px-3 py-1 rounded-sm"
              >
                <Text
                  style={{ color: statusColor }}
                  className="font-mono text-xs font-bold uppercase tracking-widest"
                >
                  {profile.status}
                </Text>
              </View>
            </View>

            {/* Status Message Block */}
            {isApproved ? (
              <View
                style={{
                  backgroundColor: Colors.gold + '15',
                  borderColor: Colors.gold,
                  borderWidth: 1,
                }}
                className="p-4 rounded-sm mb-5"
              >
                <Text
                  style={{ color: Colors.inkPrimary }}
                  className="font-bold text-base mb-1"
                >
                  Promoter Account Verified & Fully Activated
                </Text>
                <Text
                  style={{ color: Colors.inkSecondary }}
                  className="text-xs leading-relaxed mb-4"
                >
                  Your organization is authorized to publish events, manage live
                  ticketing tiers, and onboard gate scan staff.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/organizer/events' as any)}
                  style={{ backgroundColor: Colors.gold }}
                  className="py-3 px-4 rounded-sm items-center"
                  activeOpacity={0.8}
                >
                  <Text
                    style={{ color: Colors.canvas }}
                    className="font-mono text-xs font-bold uppercase tracking-widest"
                  >
                    Enter Organizer Studio →
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: Colors.highlight,
                  borderColor: Colors.line,
                  borderWidth: 1,
                }}
                className="p-4 rounded-sm mb-5"
              >
                <Text
                  style={{ color: Colors.inkPrimary }}
                  className="font-bold text-base mb-1"
                >
                  Dossier Under Compliance Review
                </Text>
                <Text
                  style={{ color: Colors.inkSecondary }}
                  className="text-xs leading-relaxed"
                >
                  Our compliance desk is currently reviewing your uploaded
                  statutory documents. Reviews typically complete within 24–48
                  hours. Once approved, you will unlock full access to the
                  Organizer Studio.
                </Text>
              </View>
            )}

            {/* Profile Information List */}
            <View className="space-y-3">
              <View
                style={{ borderBottomColor: Colors.line, borderBottomWidth: 1 }}
                className="pb-2.5"
              >
                <Text
                  style={{ color: Colors.inkSecondary }}
                  className="font-mono text-[10px] uppercase tracking-wider mb-0.5"
                >
                  CONTACT PHONE
                </Text>
                <Text
                  style={{ color: Colors.inkPrimary }}
                  className="font-mono text-xs font-semibold"
                >
                  {profile.phoneNumber}
                </Text>
              </View>

              <View
                style={{ borderBottomColor: Colors.line, borderBottomWidth: 1 }}
                className="pb-2.5"
              >
                <Text
                  style={{ color: Colors.inkSecondary }}
                  className="font-mono text-[10px] uppercase tracking-wider mb-0.5"
                >
                  REGISTERED ADDRESS
                </Text>
                <Text
                  style={{ color: Colors.inkPrimary }}
                  className="font-mono text-xs font-semibold"
                >
                  {profile.address}
                </Text>
              </View>

              <View
                style={{ borderBottomColor: Colors.line, borderBottomWidth: 1 }}
                className="pb-2.5"
              >
                <Text
                  style={{ color: Colors.inkSecondary }}
                  className="font-mono text-[10px] uppercase tracking-wider mb-0.5"
                >
                  BANKING SETTLEMENT DESTINATION
                </Text>
                <Text
                  style={{ color: Colors.inkPrimary }}
                  className="font-mono text-xs font-semibold"
                >
                  {profile.bankName || '—'} — {profile.bankAccountNumber || '—'} (
                  {profile.bankAccountName || '—'})
                </Text>
              </View>

              <View className="pb-1">
                <Text
                  style={{ color: Colors.inkSecondary }}
                  className="font-mono text-[10px] uppercase tracking-wider mb-0.5"
                >
                  IDENTITY REGISTRY NO.
                </Text>
                <Text
                  style={{ color: Colors.inkPrimary }}
                  className="font-mono text-xs font-semibold"
                >
                  {profile.identityCardNumber || 'On File'}
                </Text>
              </View>
            </View>

            {/* Uploaded Documents List */}
            {Boolean(profile.documents && profile.documents.length > 0) && (
              <View
                style={{
                  borderTopColor: Colors.line,
                  borderTopWidth: 1,
                  marginTop: 16,
                  paddingTop: 16,
                }}
              >
                <Text
                  style={{ color: Colors.inkSecondary }}
                  className="font-mono text-xs uppercase tracking-widest mb-3"
                >
                  COMPLIANCE DOCUMENTATION REGISTRY
                </Text>
                <View
                  style={{
                    backgroundColor: Colors.canvas,
                    borderColor: Colors.line,
                    borderWidth: 1,
                  }}
                  className="divide-y divide-[#2d3838]"
                >
                  {profile.documents?.map((doc: OrganizerDocument) => (
                    <View
                      key={doc.id}
                      style={{
                        padding: 12,
                        borderBottomColor: Colors.line,
                        borderBottomWidth: 1,
                      }}
                      className="flex-row items-center justify-between"
                    >
                      <View className="flex-1 mr-2">
                        <Text
                          style={{ color: Colors.inkPrimary }}
                          className="font-mono font-bold text-xs uppercase"
                        >
                          {doc.type.replace(/_/g, ' ')}
                        </Text>
                        {Boolean(doc.rejectionReason) && (
                          <Text
                            style={{ color: Colors.terracotta }}
                            className="font-mono text-[10px] mt-1"
                          >
                            Remark: {doc.rejectionReason}
                          </Text>
                        )}
                      </View>
                      <View
                        style={{
                          backgroundColor:
                            doc.status === 'APPROVED'
                              ? Colors.gold + '20'
                              : Colors.highlight,
                          borderColor:
                            doc.status === 'APPROVED'
                              ? Colors.gold
                              : Colors.edge,
                          borderWidth: 1,
                        }}
                        className="px-2 py-0.5 rounded-sm"
                      >
                        <Text
                          style={{
                            color:
                              doc.status === 'APPROVED'
                                ? Colors.gold
                                : Colors.inkSecondary,
                          }}
                          className="font-mono text-[9px] uppercase font-bold"
                        >
                          {doc.status}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Application / Re-apply Form
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
          ACCREDITATION
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Header */}
        <View
          style={{ borderBottomColor: Colors.line, borderBottomWidth: 1 }}
          className="pb-5 mb-5"
        >
          <Text
            style={{ color: Colors.inkSecondary }}
            className="font-mono text-xs uppercase tracking-widest mb-1"
          >
            PROMOTER ACCREDITATION // ONBOARDING
          </Text>
          <Text
            style={{ color: Colors.inkPrimary }}
            className="text-2xl font-bold tracking-tight mb-2"
          >
            Register as Event Organizer
          </Text>
          <Text
            style={{ color: Colors.inkSecondary }}
            className="text-xs font-mono leading-relaxed"
          >
            Submit your entity legal profile, bank account for ticket revenue
            settlements, and 4 statutory documents for compliance verification.
          </Text>
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

        {Boolean(profile?.status === 'REJECTED') && (
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
              Your application was rejected: {profile?.rejectionReason}. Update
              your details and upload all four documents to reapply.
            </Text>
          </View>
        )}

        {/* Section 1: Entity Details */}
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
            className="font-mono text-xs font-bold uppercase tracking-widest mb-4"
          >
            1. Organization & Contact Information
          </Text>

          <View className="mb-3">
            <Text
              style={{ color: Colors.inkSecondary }}
              className="font-mono text-[10px] uppercase tracking-wider mb-1"
            >
              Organization / Promoter Name *
            </Text>
            <TextInput
              value={organizationName}
              onChangeText={setOrganizationName}
              placeholder="e.g. Archipelago Live Entertainment"
              placeholderTextColor={Colors.edge}
              style={{
                backgroundColor: Colors.canvas,
                borderColor: Colors.line,
                borderWidth: 1,
                color: Colors.inkPrimary,
              }}
              className="px-3 py-2.5 rounded-sm text-xs"
            />
          </View>

          <View className="mb-3">
            <Text
              style={{ color: Colors.inkSecondary }}
              className="font-mono text-[10px] uppercase tracking-wider mb-1"
            >
              Official Phone Number *
            </Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+62 812 3456 7890"
              placeholderTextColor={Colors.edge}
              keyboardType="phone-pad"
              style={{
                backgroundColor: Colors.canvas,
                borderColor: Colors.line,
                borderWidth: 1,
                color: Colors.inkPrimary,
              }}
              className="px-3 py-2.5 rounded-sm text-xs font-mono"
            />
          </View>

          <View className="mb-3">
            <Text
              style={{ color: Colors.inkSecondary }}
              className="font-mono text-[10px] uppercase tracking-wider mb-1"
            >
              Registered Physical Address *
            </Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Full registered headquarters or operations office address"
              placeholderTextColor={Colors.edge}
              multiline
              numberOfLines={2}
              style={{
                backgroundColor: Colors.canvas,
                borderColor: Colors.line,
                borderWidth: 1,
                color: Colors.inkPrimary,
              }}
              className="px-3 py-2 rounded-sm text-xs"
            />
          </View>

          <View className="mb-1">
            <Text
              style={{ color: Colors.inkSecondary }}
              className="font-mono text-[10px] uppercase tracking-wider mb-1"
            >
              Identity Card / Tax Registration No.
            </Text>
            <TextInput
              value={identityCardNumber}
              onChangeText={setIdentityCardNumber}
              placeholder="NIK / NPWP (optional)"
              placeholderTextColor={Colors.edge}
              style={{
                backgroundColor: Colors.canvas,
                borderColor: Colors.line,
                borderWidth: 1,
                color: Colors.inkPrimary,
              }}
              className="px-3 py-2.5 rounded-sm text-xs font-mono"
            />
          </View>
        </View>

        {/* Section 2: Settlement Banking */}
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
            className="font-mono text-xs font-bold uppercase tracking-widest mb-4"
          >
            2. Settlement Banking Details
          </Text>

          <View className="mb-3">
            <Text
              style={{ color: Colors.inkSecondary }}
              className="font-mono text-[10px] uppercase tracking-wider mb-1"
            >
              Bank Name *
            </Text>
            <TextInput
              value={bankName}
              onChangeText={setBankName}
              placeholder="e.g. BCA / Bank Mandiri"
              placeholderTextColor={Colors.edge}
              style={{
                backgroundColor: Colors.canvas,
                borderColor: Colors.line,
                borderWidth: 1,
                color: Colors.inkPrimary,
              }}
              className="px-3 py-2.5 rounded-sm text-xs"
            />
          </View>

          <View className="mb-3">
            <Text
              style={{ color: Colors.inkSecondary }}
              className="font-mono text-[10px] uppercase tracking-wider mb-1"
            >
              Bank Account Number *
            </Text>
            <TextInput
              value={bankAccountNumber}
              onChangeText={setBankAccountNumber}
              placeholder="e.g. 1234567890"
              placeholderTextColor={Colors.edge}
              keyboardType="number-pad"
              style={{
                backgroundColor: Colors.canvas,
                borderColor: Colors.line,
                borderWidth: 1,
                color: Colors.inkPrimary,
              }}
              className="px-3 py-2.5 rounded-sm text-xs font-mono"
            />
          </View>

          <View className="mb-1">
            <Text
              style={{ color: Colors.inkSecondary }}
              className="font-mono text-[10px] uppercase tracking-wider mb-1"
            >
              Bank Account Holder Name *
            </Text>
            <TextInput
              value={bankAccountName}
              onChangeText={setBankAccountName}
              placeholder="Must match organization identity"
              placeholderTextColor={Colors.edge}
              style={{
                backgroundColor: Colors.canvas,
                borderColor: Colors.line,
                borderWidth: 1,
                color: Colors.inkPrimary,
              }}
              className="px-3 py-2.5 rounded-sm text-xs"
            />
          </View>
        </View>

        {/* Section 3: Statutory Compliance Documents */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.line,
            borderWidth: 1,
          }}
          className="p-4 rounded-sm mb-6"
        >
          <Text
            style={{ color: Colors.gold }}
            className="font-mono text-xs font-bold uppercase tracking-widest mb-1"
          >
            3. Statutory Documents (All 4 Required)
          </Text>
          <Text
            style={{ color: Colors.inkSecondary }}
            className="font-mono text-[10px] mb-4"
          >
            Supported formats: JPEG, PNG, WEBP (Max 5MB each).
          </Text>

          {/* Doc 1: Business License */}
          <View
            style={{
              backgroundColor: Colors.canvas,
              borderColor: businessLicense ? Colors.gold : Colors.line,
              borderWidth: 1,
            }}
            className="p-3.5 rounded-sm mb-3"
          >
            <Text
              style={{ color: Colors.inkPrimary }}
              className="font-mono font-bold text-xs uppercase mb-0.5"
            >
              1. Business License (NIB / SIUP) *
            </Text>
            <Text
              style={{ color: Colors.inkSecondary }}
              className="text-[11px] mb-2"
            >
              Official operating permit issued by relevant regulatory authorities.
            </Text>
            <TouchableOpacity
              onPress={() => handlePickDocument(setBusinessLicense)}
              style={{
                backgroundColor: businessLicense
                  ? Colors.gold + '20'
                  : Colors.highlight,
                borderColor: businessLicense ? Colors.gold : Colors.line,
                borderWidth: 1,
              }}
              className="py-2.5 px-3 rounded-sm flex-row items-center justify-between"
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: businessLicense ? Colors.gold : Colors.inkPrimary,
                }}
                className="font-mono text-xs uppercase"
              >
                {businessLicense ? 'Change File' : '+ Select Document'}
              </Text>
              {Boolean(businessLicense) && (
                <Text
                  style={{ color: Colors.gold }}
                  className="font-mono text-[10px]"
                >
                  ✓ Attached
                </Text>
              )}
            </TouchableOpacity>
            {Boolean(businessLicense) && (
              <Text
                style={{ color: Colors.inkSecondary }}
                className="font-mono text-[10px] mt-1.5"
              >
                File: {businessLicense?.name} (
                {(Number(businessLicense?.size || 0) / 1024 / 1024).toFixed(2)} MB)
              </Text>
            )}
          </View>

          {/* Doc 2: Guarantee Letter */}
          <View
            style={{
              backgroundColor: Colors.canvas,
              borderColor: guaranteeLetter ? Colors.gold : Colors.line,
              borderWidth: 1,
            }}
            className="p-3.5 rounded-sm mb-3"
          >
            <Text
              style={{ color: Colors.inkPrimary }}
              className="font-mono font-bold text-xs uppercase mb-0.5"
            >
              2. Guarantee Letter (Surat Pernyataan) *
            </Text>
            <Text
              style={{ color: Colors.inkSecondary }}
              className="text-[11px] mb-2"
            >
              Signed declaration affirming financial & event execution integrity.
            </Text>
            <TouchableOpacity
              onPress={() => handlePickDocument(setGuaranteeLetter)}
              style={{
                backgroundColor: guaranteeLetter
                  ? Colors.gold + '20'
                  : Colors.highlight,
                borderColor: guaranteeLetter ? Colors.gold : Colors.line,
                borderWidth: 1,
              }}
              className="py-2.5 px-3 rounded-sm flex-row items-center justify-between"
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: guaranteeLetter ? Colors.gold : Colors.inkPrimary,
                }}
                className="font-mono text-xs uppercase"
              >
                {guaranteeLetter ? 'Change File' : '+ Select Document'}
              </Text>
              {Boolean(guaranteeLetter) && (
                <Text
                  style={{ color: Colors.gold }}
                  className="font-mono text-[10px]"
                >
                  ✓ Attached
                </Text>
              )}
            </TouchableOpacity>
            {Boolean(guaranteeLetter) && (
              <Text
                style={{ color: Colors.inkSecondary }}
                className="font-mono text-[10px] mt-1.5"
              >
                File: {guaranteeLetter?.name} (
                {(Number(guaranteeLetter?.size || 0) / 1024 / 1024).toFixed(2)} MB)
              </Text>
            )}
          </View>

          {/* Doc 3: Organization Registration */}
          <View
            style={{
              backgroundColor: Colors.canvas,
              borderColor: organizationRegistration ? Colors.gold : Colors.line,
              borderWidth: 1,
            }}
            className="p-3.5 rounded-sm mb-3"
          >
            <Text
              style={{ color: Colors.inkPrimary }}
              className="font-mono font-bold text-xs uppercase mb-0.5"
            >
              3. Entity Registration (Akta / Kemenkumham) *
            </Text>
            <Text
              style={{ color: Colors.inkSecondary }}
              className="text-[11px] mb-2"
            >
              Corporate deeds of establishment or organization registration certificate.
            </Text>
            <TouchableOpacity
              onPress={() => handlePickDocument(setOrganizationRegistration)}
              style={{
                backgroundColor: organizationRegistration
                  ? Colors.gold + '20'
                  : Colors.highlight,
                borderColor: organizationRegistration ? Colors.gold : Colors.line,
                borderWidth: 1,
              }}
              className="py-2.5 px-3 rounded-sm flex-row items-center justify-between"
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: organizationRegistration
                    ? Colors.gold
                    : Colors.inkPrimary,
                }}
                className="font-mono text-xs uppercase"
              >
                {organizationRegistration ? 'Change File' : '+ Select Document'}
              </Text>
              {Boolean(organizationRegistration) && (
                <Text
                  style={{ color: Colors.gold }}
                  className="font-mono text-[10px]"
                >
                  ✓ Attached
                </Text>
              )}
            </TouchableOpacity>
            {Boolean(organizationRegistration) && (
              <Text
                style={{ color: Colors.inkSecondary }}
                className="font-mono text-[10px] mt-1.5"
              >
                File: {organizationRegistration?.name} (
                {(
                  Number(organizationRegistration?.size || 0) /
                  1024 /
                  1024
                ).toFixed(2)}{' '}
                MB)
              </Text>
            )}
          </View>

          {/* Doc 4: Identity Card */}
          <View
            style={{
              backgroundColor: Colors.canvas,
              borderColor: identityCard ? Colors.gold : Colors.line,
              borderWidth: 1,
            }}
            className="p-3.5 rounded-sm"
          >
            <Text
              style={{ color: Colors.inkPrimary }}
              className="font-mono font-bold text-xs uppercase mb-0.5"
            >
              4. Person-in-Charge Identity Card (KTP) *
            </Text>
            <Text
              style={{ color: Colors.inkSecondary }}
              className="text-[11px] mb-2"
            >
              Clear photo ID of authorized director or chief executive officer.
            </Text>
            <TouchableOpacity
              onPress={() => handlePickDocument(setIdentityCard)}
              style={{
                backgroundColor: identityCard
                  ? Colors.gold + '20'
                  : Colors.highlight,
                borderColor: identityCard ? Colors.gold : Colors.line,
                borderWidth: 1,
              }}
              className="py-2.5 px-3 rounded-sm flex-row items-center justify-between"
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: identityCard ? Colors.gold : Colors.inkPrimary,
                }}
                className="font-mono text-xs uppercase"
              >
                {identityCard ? 'Change File' : '+ Select Document'}
              </Text>
              {Boolean(identityCard) && (
                <Text
                  style={{ color: Colors.gold }}
                  className="font-mono text-[10px]"
                >
                  ✓ Attached
                </Text>
              )}
            </TouchableOpacity>
            {Boolean(identityCard) && (
              <Text
                style={{ color: Colors.inkSecondary }}
                className="font-mono text-[10px] mt-1.5"
              >
                File: {identityCard?.name} (
                {(Number(identityCard?.size || 0) / 1024 / 1024).toFixed(2)} MB)
              </Text>
            )}
          </View>
        </View>

        {/* Submit Actions */}
        <View className="flex-row items-center justify-end gap-3 pt-2">
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              borderColor: Colors.line,
              borderWidth: 1,
            }}
            className="px-5 py-3.5 rounded-sm items-center"
            activeOpacity={0.7}
          >
            <Text
              style={{ color: Colors.inkPrimary }}
              className="font-mono text-xs uppercase tracking-wider"
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={{
              backgroundColor: Colors.gold,
              opacity: submitting ? 0.6 : 1,
            }}
            className="flex-1 py-3.5 px-6 rounded-sm items-center flex-row justify-center gap-2"
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={Colors.canvas} />
            ) : null}
            <Text
              style={{ color: Colors.canvas }}
              className="font-mono text-xs uppercase tracking-widest font-black"
            >
              {submitting ? 'Uploading Dossier...' : 'Submit Dossier for Review'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
