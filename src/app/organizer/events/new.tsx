import { mobileLabels } from '../../../lib/mobileLabels';
/**
 * Gateway Mobile — Create New Event Screen
 * Mirrors gateway-fe/src/app/organizer/events/new/page.tsx
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { categoryApi, eventApi } from '../../../lib/api';
import { Category } from '../../../types/api';
import { EventMediaFields, ZoneChoices, type MediaField } from '../../../components/EventMediaFields';
import { venueZones } from '../../../lib/venueLayouts';
import { parseEventDate } from '../../../lib/eventDates';
import { usePreferences, useColors } from '../../../context/Preferences';
import {
  pickImageDocument,
  pickVideoDocument,
  appendDocumentToFormData,
  PickedDocument,
} from '../../../lib/filePicker';

interface TicketTierInput {
  id: string;
  name: string;
  price: number;
  quota: number;
  viewPosition?: string;
}

export default function NewEventScreen() {
  const { language: uiLanguage, tr } = usePreferences();
  const ui = (label: string) => uiLanguage === 'id' ? mobileLabels[label] ?? label : label;
  const Colors = useColors();
  const router = useRouter();
  const { user, isOrganizerApproved, loading: authLoading } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [isRefundable, setIsRefundable] = useState(true);
  const [venueLayout, setVenueLayout] = useState('ARENA');

  const [media, setMedia] = useState<Partial<Record<MediaField, PickedDocument>>>({});

  // Files
  const [coverImage, setCoverImage] = useState<PickedDocument | null>(null);

  // Dynamic Ticket Tiers
  const [ticketTiers, setTicketTiers] = useState<TicketTierInput[]>([
    { id: 'tier-1', name: 'General Admission', price: 150000, quota: 100 },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/(auth)/login');
      } else if (!isOrganizerApproved) {
        router.replace('/organizer/onboarding');
      }
    }
  }, [user, isOrganizerApproved, authLoading, router]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await categoryApi.getAll();
        const list = Array.isArray(data) ? data : [];
        setCategories(list);
        if (list.length > 0) {
          setCategoryId(list[0].id);
        }
      } catch {
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    }
    loadCategories();
  }, []);

  const handleAddTier = () => {
    setTicketTiers((prev) => [
      ...prev,
      {
        id: `tier-${Date.now()}`,
        name: '',
        price: 100000,
        quota: 50,
      },
    ]);
  };

  const handleRemoveTier = (id: string) => {
    if (ticketTiers.length === 1) {
      Alert.alert('Required', 'At least one ticket tier is required.');
      return;
    }
    setTicketTiers((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateTier = (
    id: string,
    field: keyof TicketTierInput,
    value: string | number,
  ) => {
    setTicketTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  };

  const handlePickCoverImage = async () => {
    try {
      const doc = await pickImageDocument();
      if (doc) {
        if ((doc.size ?? 0) > 5 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Cover image must be 5MB or less.');
          return;
        }
        setCoverImage(doc);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to pick a cover image.');
    }
  };

  const pickMedia = async (field: MediaField) => {
    try {
      const doc = await (field === 'previewVideo' ? pickVideoDocument() : pickImageDocument());
      if (doc) setMedia(current => ({ ...current, [field]: doc }));
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to select media.'); }
  };

  const handleSubmit = async () => {
    setError(null);

    if (
      !title.trim() ||
      !categoryId ||
      !description.trim() ||
      !location.trim()
    ) {
      setError('Please fill in all required event details.');
      return;
    }

    if (!startDatetime.trim() || !endDatetime.trim()) {
      setError('Both start and end dates/times are required (YYYY-MM-DD HH:mm).');
      return;
    }

    const startDate = parseEventDate(startDatetime);
    const endDate = parseEventDate(endDatetime);

    if (!startDate || !endDate) {
      setError('Please provide valid ISO dates (e.g. 2026-12-31 19:00).');
      return;
    }

    if (startDate >= endDate) {
      setError('The event closing datetime must be after the opening start datetime.');
      return;
    }

    if (!coverImage) {
      setError('A promotional cover image is required.');
      return;
    }

    if (!media.previewVideo || !media.ticketBackground) {
      setError('Video preview and ticket background are required.');
      return;
    }
    const availableZones = venueZones(venueLayout);
    if (ticketTiers.some(tier => !availableZones.some(zone => zone === tier.viewPosition))) {
      setError('Select a valid venue zone for each ticket tier.');
      return;
    }
    // Validate ticket tiers
    for (const tier of ticketTiers) {
      if (!tier.name.trim()) {
        setError('All ticket tiers must have a defined name.');
        return;
      }
      if (tier.price < 0) {
        setError(`Ticket tier "${tier.name}" cannot have a negative price.`);
        return;
      }
      if (!Number.isSafeInteger(tier.quota) || tier.quota < 1) {
        setError(`Ticket tier "${tier.name}" must have a quota of at least 1.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('categoryId', categoryId);
      formData.append('description', description.trim());
      formData.append('location', location.trim());
      formData.append('startDatetime', startDate.toISOString());
      formData.append('endDatetime', endDate.toISOString());
      formData.append('isRefundable', String(isRefundable));
      formData.append('venueLayout', venueLayout);

      appendDocumentToFormData(formData, 'coverImage', coverImage);
      for (const [field, file] of Object.entries(media)) appendDocumentToFormData(formData, field, file);

      formData.append(
        'ticketTypes',
        JSON.stringify(
          ticketTiers.map((tier) => ({
            name: tier.name.trim(),
            price: Number(tier.price),
            quota: Number(tier.quota),
            viewPosition: tier.viewPosition || null,
          })),
        ),
      );

      const event = await eventApi.createEvent(formData);
      router.replace({ pathname: '/organizer/events/[id]/staff', params: { id: event.id } });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create event';
      setError(msg);
    } finally {
      setSubmitting(false);
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
          >{ui("← Cancel")}</Text>
        </TouchableOpacity>
        <Text
          style={{ color: Colors.gold }}
          className="font-mono text-xs uppercase tracking-widest font-bold"
        >{ui("NEW EVENT")}</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
      >
        {/* Header */}
        <View
          style={{ borderBottomColor: Colors.line, borderBottomWidth: 1 }}
          className="pb-4 mb-5"
        >
          <Text
            style={{ color: Colors.inkSecondary }}
            className="font-mono text-xs uppercase tracking-widest mb-1"
          >{ui("NEW EVENT PUBLICATION // PRODUCTION DRAFT")}</Text>
          <Text
            style={{ color: Colors.inkPrimary }}
            className="text-2xl font-bold tracking-tight mb-1"
          >{ui("Create Live Event")}</Text>
          <Text
            style={{ color: Colors.inkSecondary }}
            className="text-xs font-mono"
          >{ui("Configure production details, promotional artwork, and tiered ticketing inventory.")}</Text>
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

        {/* Section 1: Core Details */}
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
          >{ui("1. Event Production Details")}</Text>

          <View className="mb-3">
            <Text
              style={{ color: Colors.inkSecondary }}
              className="font-mono text-[10px] uppercase tracking-wider mb-1"
            >{ui("Event Title *")}</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={ui("e.g. Symphony of the Archipelago Live")}
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

          {/* Category Select */}
          <View className="mb-3">
            <Text
              style={{ color: Colors.inkSecondary }}
              className="font-mono text-[10px] uppercase tracking-wider mb-1"
            >{ui("Category *")}</Text>
            {categoriesLoading ? (
              <ActivityIndicator size="small" color={Colors.gold} />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row gap-2 pt-1"
              >
                {categories.map((c) => {
                  const isSelected = categoryId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setCategoryId(c.id)}
                      style={{
                        backgroundColor: isSelected
                          ? Colors.gold + '20'
                          : Colors.canvas,
                        borderColor: isSelected ? Colors.gold : Colors.line,
                        borderWidth: 1,
                      }}
                      className="px-3 py-1.5 rounded-sm mr-2"
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          color: isSelected
                            ? Colors.gold
                            : Colors.inkSecondary,
                        }}
                        className="font-mono text-xs uppercase"
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          <View className="mb-3">
            <Text
              style={{ color: Colors.inkSecondary }}
              className="font-mono text-[10px] uppercase tracking-wider mb-1"
            >{ui("Description *")}</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder={ui("Full event narrative, artist lineup, schedule, and age policies")}
              placeholderTextColor={Colors.edge}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: Colors.canvas,
                borderColor: Colors.line,
                borderWidth: 1,
                color: Colors.inkPrimary,
              }}
              className="px-3 py-2 rounded-sm text-xs"
            />
          </View>

          <View className="mb-3">
            <Text
              style={{ color: Colors.inkSecondary }}
              className="font-mono text-[10px] uppercase tracking-wider mb-1"
            >{ui("Venue / Location *")}</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder={ui("e.g. Istora Senayan, Jakarta Pusat")}
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

          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text
                style={{ color: Colors.inkSecondary }}
                className="font-mono text-[10px] uppercase tracking-wider mb-1"
              >{ui("Start Datetime *")}</Text>
              <TextInput
                value={startDatetime}
                onChangeText={setStartDatetime}
                placeholder="2026-11-25 19:00"
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

            <View className="flex-1">
              <Text
                style={{ color: Colors.inkSecondary }}
                className="font-mono text-[10px] uppercase tracking-wider mb-1"
              >{ui("End Datetime *")}</Text>
              <TextInput
                value={endDatetime}
                onChangeText={setEndDatetime}
                placeholder="2026-11-25 23:00"
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

          {/* Refundable Switch */}
          <View className="flex-row items-center justify-between pt-2">
            <View>
              <Text
                style={{ color: Colors.inkPrimary }}
                className="font-mono text-xs uppercase font-bold"
              >{ui("Customer Refund Requests")}</Text>
              <Text
                style={{ color: Colors.inkSecondary }}
                className="text-[11px]"
              >{ui("Allow attendees to request refunds before the cutoff window")}</Text>
            </View>
            <Switch
              value={isRefundable}
              onValueChange={setIsRefundable}
              trackColor={{ false: Colors.line, true: Colors.gold }}
              thumbColor={Colors.canvas}
            />
          </View>
        </View>

        {/* Section 2: Media & Venue Layout */}
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
          >{ui("2. Media & Venue Layout")}</Text>

          {/* Cover image picker */}
          <View className="mb-4">
            <Text
              style={{ color: Colors.inkSecondary }}
              className="font-mono text-[10px] uppercase tracking-wider mb-1.5"
            >{ui("Primary Event Cover Artwork *")}</Text>
            <TouchableOpacity
              onPress={handlePickCoverImage}
              style={{
                backgroundColor: coverImage
                  ? Colors.gold + '20'
                  : Colors.canvas,
                borderColor: coverImage ? Colors.gold : Colors.line,
                borderWidth: 1,
              }}
              className="py-3 px-3 rounded-sm flex-row items-center justify-between"
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: coverImage ? Colors.gold : Colors.inkPrimary,
                }}
                className="font-mono text-xs uppercase font-semibold"
              >
                {coverImage ? 'Change Cover Image' : ui('+ Select Cover Image (JPEG/PNG)')}
              </Text>
              {Boolean(coverImage) && (
                <Text
                  style={{ color: Colors.gold }}
                  className="font-mono text-[10px] font-bold"
                >{ui("File attached")}</Text>
              )}
            </TouchableOpacity>
            {Boolean(coverImage) && (
              <Text
                style={{ color: Colors.inkSecondary }}
                className="font-mono text-[10px] mt-1"
              >{ui("Selected:")}{" "}{coverImage?.name} (
                {(Number(coverImage?.size || 0) / 1024 / 1024).toFixed(2)} MB)
              </Text>
            )}
          </View>

        </View>
        <View className="mb-6">
          <EventMediaFields layout={venueLayout} onLayout={setVenueLayout}
            names={{ previewVideo: media.previewVideo?.name, ticketBackground: media.ticketBackground?.name, venueImage: media.venueImage?.name }}
            onPick={field => { void pickMedia(field); }} disabled={submitting} />
        </View>

        {/* Section 3: Ticket Tiers */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderColor: Colors.line,
            borderWidth: 1,
          }}
          className="p-4 rounded-sm mb-6"
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text
              style={{ color: Colors.gold }}
              className="font-mono text-xs font-bold uppercase tracking-widest"
            >{ui("3. Ticket Inventory Tiers")}</Text>
            <TouchableOpacity
              onPress={handleAddTier}
              style={{
                borderColor: Colors.gold,
                borderWidth: 1,
                backgroundColor: Colors.gold + '15',
              }}
              className="px-2.5 py-1 rounded-sm"
              activeOpacity={0.7}
            >
              <Text
                style={{ color: Colors.gold }}
                className="font-mono text-[10px] uppercase font-bold"
              >{ui("+ Add Tier")}</Text>
            </TouchableOpacity>
          </View>

          {ticketTiers.map((tier, index) => (
            <View
              key={tier.id}
              style={{
                backgroundColor: Colors.canvas,
                borderColor: Colors.line,
                borderWidth: 1,
              }}
              className="p-3.5 rounded-sm mb-3"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text
                  style={{ color: Colors.inkPrimary }}
                  className="font-mono text-xs font-bold uppercase"
                >{ui("Tier #")}{index + 1}
                </Text>
                {ticketTiers.length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleRemoveTier(tier.id)}
                    className="p-1"
                  >
                    <Text
                      style={{ color: Colors.terracotta }}
                      className="font-mono text-[10px] uppercase font-bold"
                    >{ui("Remove")}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <ZoneChoices layout={venueLayout} value={tier.viewPosition} disabled={submitting}
                onChange={zone => handleUpdateTier(tier.id, 'viewPosition', zone)} />

              <View className="mb-2">
                <Text
                  style={{ color: Colors.inkSecondary }}
                  className="font-mono text-[9px] uppercase tracking-wider mb-0.5"
                >{ui("Tier Name (e.g. VIP, Festival, Standing)")}</Text>
                <TextInput
                  value={tier.name}
                  onChangeText={(val) => handleUpdateTier(tier.id, 'name', val)}
                  placeholder={ui("e.g. VIP Gold Access")}
                  placeholderTextColor={Colors.edge}
                  style={{
                    backgroundColor: Colors.surface,
                    borderColor: Colors.line,
                    borderWidth: 1,
                    color: Colors.inkPrimary,
                  }}
                  className="px-3 py-2 rounded-sm text-xs"
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text
                    style={{ color: Colors.inkSecondary }}
                    className="font-mono text-[9px] uppercase tracking-wider mb-0.5"
                  >{ui("Price (IDR)")}</Text>
                  <TextInput
                    value={String(tier.price)}
                    onChangeText={(val) =>
                      handleUpdateTier(tier.id, 'price', Number(val) || 0)
                    }
                    keyboardType="number-pad"
                    placeholder="150000"
                    placeholderTextColor={Colors.edge}
                    style={{
                      backgroundColor: Colors.surface,
                      borderColor: Colors.line,
                      borderWidth: 1,
                      color: Colors.inkPrimary,
                    }}
                    className="px-3 py-2 rounded-sm text-xs font-mono"
                  />
                </View>

                <View className="flex-1">
                  <Text
                    style={{ color: Colors.inkSecondary }}
                    className="font-mono text-[9px] uppercase tracking-wider mb-0.5"
                  >{ui("Total Quota")}</Text>
                  <TextInput
                    value={String(tier.quota)}
                    onChangeText={(val) =>
                      handleUpdateTier(tier.id, 'quota', Number(val) || 0)
                    }
                    keyboardType="number-pad"
                    placeholder="100"
                    placeholderTextColor={Colors.edge}
                    style={{
                      backgroundColor: Colors.surface,
                      borderColor: Colors.line,
                      borderWidth: 1,
                      color: Colors.inkPrimary,
                    }}
                    className="px-3 py-2 rounded-sm text-xs font-mono"
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={{
            backgroundColor: Colors.gold,
            opacity: submitting ? 0.6 : 1,
          }}
          className="py-4 rounded-sm items-center flex-row justify-center gap-2"
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.canvas} />
          ) : null}
          <Text
            style={{ color: Colors.canvas }}
            className="font-mono text-xs uppercase tracking-widest font-black"
          >
            {submitting ? ui('Creating Event...') : tr('Simpan draf dan pilih staf', 'Save Draft and Choose Staff')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
