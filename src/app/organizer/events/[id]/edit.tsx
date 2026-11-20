import { mobileLabels } from '../../../../lib/mobileLabels';
/**
 * Gateway Mobile — Edit Event Screen
 * Mirrors gateway-fe/src/app/organizer/events/[id]/edit/page.tsx
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
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../../context/AuthContext';
import { categoryApi, eventApi, ticketTypeApi } from '../../../../lib/api';
import { Category, Event, TicketType } from '../../../../types/api';
import { EventMediaFields, ZoneChoices, type MediaField } from '../../../../components/EventMediaFields';
import { venueZones } from '../../../../lib/venueLayouts';
import { parseEventDate, formatEventDate } from '../../../../lib/eventDates';
import { usePreferences, useColors } from '../../../../context/Preferences';
import {
  pickImageDocument,
  pickVideoDocument,
  appendDocumentToFormData,
  PickedDocument,
} from '../../../../lib/filePicker';

export default function EditEventScreen() {
  const { language: uiLanguage } = usePreferences();
  const ui = (label: string) => uiLanguage === 'id' ? mobileLabels[label] ?? label : label;
  const Colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isOrganizerApproved, loading: authLoading } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [isRefundable, setIsRefundable] = useState(true);
  const [newCoverImage, setNewCoverImage] = useState<PickedDocument | null>(null);

  const [layout, setLayout] = useState('');
  const [media, setMedia] = useState<Partial<Record<MediaField, PickedDocument>>>({});
  const [newZone, setNewZone] = useState('');
  const [updatingZone, setUpdatingZone] = useState(false);

  // New ticket tier form
  const [newTierName, setNewTierName] = useState('');
  const [newTierPrice, setNewTierPrice] = useState('100000');
  const [newTierQuota, setNewTierQuota] = useState('50');
  const [addingTier, setAddingTier] = useState(false);

  const [saving, setSaving] = useState(false);
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
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [cats, evData, tiers] = await Promise.all([
        categoryApi.getAll(),
        eventApi.getOrganizerEventDetail(id),
        ticketTypeApi.getByEvent(id),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setEvent(evData);
      setTicketTypes(Array.isArray(tiers) ? tiers : []);

      setTitle(evData.title);
      setCategoryId(evData.categoryId || (cats[0]?.id ?? ''));
      setDescription(evData.description);
      setLocation(evData.location);
      setIsRefundable(evData.isRefundable);
      setLayout(evData.venueLayout ?? "");

      if (evData.startDatetime) {
        setStartDatetime(formatEventDate(evData.startDatetime));
      }
      if (evData.endDatetime) {
        setEndDatetime(formatEventDate(evData.endDatetime));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load event';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user && isOrganizerApproved && id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Set loading before fetching the requested event.
      loadData();
    }
  }, [user, isOrganizerApproved, id, loadData]);

  const handlePickNewCover = async () => {
    try {
      const doc = await pickImageDocument();
      if (doc) {
        if ((doc.size ?? 0) > 5 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Cover image must be 5MB or less.');
          return;
        }
        setNewCoverImage(doc);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to pick a cover image.');
    }
  };

  const editable = event?.status === 'DRAFT' || event?.status === 'REJECTED';
  const pickMedia = async (field: MediaField) => {
    try {
      const doc = await (field === 'previewVideo' ? pickVideoDocument() : pickImageDocument());
      if (doc) setMedia(current => ({ ...current, [field]: doc }));
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to select media.'); }
  };
  const updateZone = async (tierId: string, zone: string) => {
    if (updatingZone || !editable || layout !== event?.venueLayout) return;
    setError(null);
    setUpdatingZone(true);
    try {
      const tier = await ticketTypeApi.update(tierId, { viewPosition: zone });
      setTicketTypes(current => current.map(item => item.id === tierId ? tier : item));
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to update the ticket zone.'); }
    finally { setUpdatingZone(false); }
  };

  const handleSave = async () => {
    if (!id || !editable || saving) return;
    setError(null);
    setSuccess(null);

    if (
      !title.trim() ||
      !categoryId ||
      !description.trim() ||
      !location.trim()
    ) {
      setError('Please fill in all required event details.');
      return;
    }

    const start = parseEventDate(startDatetime);
    const end = parseEventDate(endDatetime);
    if (!start || !end || end <= start || !venueZones(layout).length) {
      setError('Choose a venue layout and valid start/end times in WIB (YYYY-MM-DD HH:mm).');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('categoryId', categoryId);
      formData.append('description', description.trim());
      formData.append('location', location.trim());
      formData.append('startDatetime', start.toISOString());
      formData.append('endDatetime', end.toISOString());
      formData.append('isRefundable', String(isRefundable));
      formData.append('venueLayout', layout);
      for (const [field, file] of Object.entries(media)) appendDocumentToFormData(formData, field, file);

      if (newCoverImage) {
        appendDocumentToFormData(formData, 'coverImage', newCoverImage);
      }

      await eventApi.updateEvent(id, formData);
      setMedia({});
      setNewCoverImage(null);
      setSuccess('Event updated successfully.');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save event';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTicketTier = async () => {
    if (!id || !editable || layout !== event?.venueLayout || !venueZones(layout).some(zone => zone === newZone)) {
      setError('Save the venue layout and select a valid ticket zone first.');
      return;
    }
    if (!newTierName.trim()) {
      Alert.alert('Required', 'Please enter a ticket tier name.');
      return;
    }
    const price = Number(newTierPrice);
    const quota = Number(newTierQuota);
    if (isNaN(price) || price < 0) {
      Alert.alert('Invalid Price', 'Price must be 0 or greater.');
      return;
    }
    if (!Number.isSafeInteger(quota) || quota < 1) {
      Alert.alert('Invalid Quota', 'Quota must be at least 1.');
      return;
    }

    setAddingTier(true);
    try {
      await ticketTypeApi.create(id, {
        name: newTierName.trim(),
        price,
        quota,
        viewPosition: newZone,
      });
      setNewTierName('');
      setNewTierPrice('100000');
      setNewTierQuota('50');
      await loadData();
      Alert.alert('Success', 'Ticket tier added successfully.');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to add ticket tier';
      Alert.alert('Error', msg);
    } finally {
      setAddingTier(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!id) return;
    Alert.alert(
      'Submit for Review',
      'Submit this event for administrative compliance review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              await eventApi.submitEvent(id);
              Alert.alert('Submitted', 'Event submitted for review.');
              router.replace('/organizer/events' as any);
            } catch (err: unknown) {
              const msg =
                err instanceof Error ? err.message : 'Failed to submit';
              Alert.alert('Error', msg);
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
        >{ui("Loading event details...")}</Text>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.canvas }} className="justify-center gap-4 p-6">
        <Text className="text-ink-primary" accessibilityRole="alert">{error || ui('Event not found.')}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-gold">{ui('← Back')}</Text>
        </TouchableOpacity>
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
        >{ui("EDIT EVENT")}</Text>
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
          >
            STATUS: {event?.status}
          </Text>
          <Text
            style={{ color: Colors.inkPrimary }}
            className="text-2xl font-bold tracking-tight mb-1"
          >
            {event?.title || 'Edit Event Listing'}
          </Text>
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

        {/* Section 1: Event Info */}
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
          >{ui("1. Production Information")}</Text>

          <View className="mb-3">
            <Text
              style={{ color: Colors.inkSecondary }}
              className="font-mono text-[10px] uppercase tracking-wider mb-1"
            >{ui("Title *")}</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
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
                        color: isSelected ? Colors.gold : Colors.inkSecondary,
                      }}
                      className="font-mono text-xs uppercase"
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View className="mb-3">
            <Text
              style={{ color: Colors.inkSecondary }}
              className="font-mono text-[10px] uppercase tracking-wider mb-1"
            >{ui("Description *")}</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
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
            >{ui("Location / Venue *")}</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
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
              >{ui("Start Datetime")}</Text>
              <TextInput
                value={startDatetime}
                onChangeText={setStartDatetime}
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
              >{ui("End Datetime")}</Text>
              <TextInput
                value={endDatetime}
                onChangeText={setEndDatetime}
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

          {/* Refundable */}
          <View className="flex-row items-center justify-between pt-2">
            <Text
              style={{ color: Colors.inkPrimary }}
              className="font-mono text-xs uppercase font-bold"
            >{ui("Refundable Tickets")}</Text>
            <Switch
              value={isRefundable}
              onValueChange={setIsRefundable}
              trackColor={{ false: Colors.line, true: Colors.gold }}
              thumbColor={Colors.canvas}
            />
          </View>
        </View>

        {/* Section 2: Promotional Cover Image */}
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
          >{ui("2. Promotional Cover Artwork")}</Text>

          {event?.coverImageUrl && !newCoverImage ? (
            <View className="mb-3">
              <Image
                source={{ uri: event.coverImageUrl }}
                style={{ width: '100%', height: 160, borderRadius: 2 }}
                resizeMode="cover"
              />
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handlePickNewCover}
            style={{
              backgroundColor: newCoverImage
                ? Colors.gold + '20'
                : Colors.canvas,
              borderColor: newCoverImage ? Colors.gold : Colors.line,
              borderWidth: 1,
            }}
            className="py-3 px-3 rounded-sm flex-row items-center justify-between"
            activeOpacity={0.7}
          >
            <Text
              style={{
                color: newCoverImage ? Colors.gold : Colors.inkPrimary,
              }}
              className="font-mono text-xs uppercase font-semibold"
            >
              {newCoverImage ? 'Change New Artwork' : '+ Upload Replacement Image'}
            </Text>
            {Boolean(newCoverImage) && (
              <Text
                style={{ color: Colors.gold }}
                className="font-mono text-[10px] font-bold"
              >{ui("✓ Selected")}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Section 3: Existing Ticket Tiers */}
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
          >{ui("3. Ticket Tiers Inventory")}</Text>

          <View className="space-y-2 mb-4">
            <EventMediaFields layout={layout} onLayout={setLayout}
              names={{ previewVideo: media.previewVideo?.name || (event.previewVideoUrl ? 'Video saved' : undefined),
                ticketBackground: media.ticketBackground?.name || (event.ticketBackgroundUrl ? 'Background saved' : undefined),
                venueImage: media.venueImage?.name || (event.venueImageUrl ? 'Plan saved' : undefined) }}
              onPick={field => { void pickMedia(field); }} disabled={!editable || saving} />
            {layout !== event.venueLayout && <Text className="text-ink-secondary">{ui("Save the layout first to edit ticket zones.")}</Text>}
            {ticketTypes.map((tier) => (
              <View
                key={tier.id}
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
                    {tier.name}
                  </Text>
                  <Text
                    style={{ color: Colors.inkSecondary }}
                    className="font-mono text-[11px]"
                  >
                    IDR {Number(tier.price).toLocaleString('id-ID')}
                  </Text>
                </View>
                <View className="items-end">
                  <Text
                    style={{ color: Colors.gold }}
                    className="font-mono text-xs font-bold"
                  >{ui("Quota:")}{" "}{tier.availableQuota} / {tier.quota}
                  </Text>
                </View>
                <ZoneChoices layout={event.venueLayout ?? ''} value={tier.viewPosition}
                  disabled={!editable || updatingZone || saving || layout !== event.venueLayout}
                  onChange={zone => { void updateZone(tier.id, zone); }} />
              </View>
            ))}
          </View>

          {/* Add New Ticket Tier Subsection */}
          <View
            style={{
              borderTopColor: Colors.line,
              borderTopWidth: 1,
              paddingTop: 12,
            }}
          >
            <Text
              style={{ color: Colors.inkSecondary }}
              className="font-mono text-[11px] uppercase tracking-wider mb-2 font-bold"
            >{ui("+ Add New Ticket Tier")}</Text>

            <View className="mb-2">
              <TextInput
                value={newTierName}
                onChangeText={setNewTierName}
                placeholder={ui("Tier Name (e.g. Early Bird)")}
                placeholderTextColor={Colors.edge}
                style={{
                  backgroundColor: Colors.canvas,
                  borderColor: Colors.line,
                  borderWidth: 1,
                  color: Colors.inkPrimary,
                }}
                className="px-3 py-2 rounded-sm text-xs"
              />
            </View>

            <View className="flex-row gap-2 mb-2">
              <TextInput
                value={newTierPrice}
                onChangeText={setNewTierPrice}
                keyboardType="number-pad"
                placeholder={ui("Price (IDR)")}
                placeholderTextColor={Colors.edge}
                style={{
                  backgroundColor: Colors.canvas,
                  borderColor: Colors.line,
                  borderWidth: 1,
                  color: Colors.inkPrimary,
                }}
                className="flex-1 px-3 py-2 rounded-sm text-xs font-mono"
              />
              <TextInput
                value={newTierQuota}
                onChangeText={setNewTierQuota}
                keyboardType="number-pad"
                placeholder={ui("Quota")}
                placeholderTextColor={Colors.edge}
                style={{
                  backgroundColor: Colors.canvas,
                  borderColor: Colors.line,
                  borderWidth: 1,
                  color: Colors.inkPrimary,
                }}
                className="flex-1 px-3 py-2 rounded-sm text-xs font-mono"
              />
            </View>

            <ZoneChoices layout={layout} value={newZone}
              disabled={!editable || addingTier || layout !== event.venueLayout} onChange={setNewZone} />
            <TouchableOpacity
              onPress={handleAddTicketTier}
              disabled={addingTier || !editable}
              style={{
                borderColor: Colors.gold,
                borderWidth: 1,
                backgroundColor: Colors.gold + '15',
              }}
              className="py-2.5 rounded-sm items-center flex-row justify-center gap-2"
              activeOpacity={0.8}
            >
              {addingTier ? (
                <ActivityIndicator size="small" color={Colors.gold} />
              ) : null}
              <Text
                style={{ color: Colors.gold }}
                className="font-mono text-xs uppercase font-bold tracking-wider"
              >{ui("Add Tier to Event")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="space-y-3">
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || !editable}
            style={{
              backgroundColor: Colors.gold,
              opacity: saving ? 0.6 : 1,
            }}
            className="py-3.5 rounded-sm items-center flex-row justify-center gap-2 mb-2"
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.canvas} />
            ) : null}
            <Text
              style={{ color: Colors.canvas }}
              className="font-mono text-xs uppercase tracking-widest font-black"
            >
              {saving ? ui('Saving...') : ui('Save Changes')}
            </Text>
          </TouchableOpacity>

          {event?.status === 'DRAFT' && (
            <TouchableOpacity
              onPress={handleSubmitForReview}
              style={{
                borderColor: Colors.edge,
                borderWidth: 1,
                backgroundColor: Colors.canvas,
              }}
              className="py-3 rounded-sm items-center"
              activeOpacity={0.7}
            >
              <Text
                style={{ color: Colors.inkPrimary }}
                className="font-mono text-xs uppercase tracking-wider font-bold"
              >{ui("Submit Event for Compliance Review →")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
