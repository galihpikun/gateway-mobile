import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Redirect, useFocusEffect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/Preferences';
import { Action, Copy, Feedback, Field, message, Panel, Screen, useResource } from '../components/Flow';
import { type GateTicket, staffApi } from '../lib/operations';

export default function StaffScreen() {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (role === 'ADMIN') return <Redirect href="/admin" />;
  if (role !== 'STAFF') return <Redirect href="/(tabs)" />;
  return <StaffConsole />;
}

function StaffConsole() {
  const { tr } = usePreferences();
  const events = useResource(staffApi.events);
  const [focused, setFocused] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [foreground, setForeground] = useState(AppState.currentState == null || AppState.currentState === 'active');
  const [selected, setSelected] = useState('');
  const gate = events.data?.find(event => event.id === selected) ?? events.data?.[0];
  const eventId = gate?.id;
  const loadStats = useCallback(() => staffApi.dashboard(eventId!), [eventId]);
  const stats = useResource(loadStats, Boolean(eventId));
  const [code, setCode] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [candidate, setCandidate] = useState<{ eventId: string; ticket: GateTicket }>();
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => { setFocused(false); setCameraOpen(false); };
  }, []));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      setForeground(state === 'active');
      if (state !== 'active') setCameraOpen(false);
    });
    return () => subscription.remove();
  }, []);

  async function inspect(value: string) {
    if (!eventId || !value.trim() || pending.current) return;
    pending.current = true;
    setBusy(true);
    setCameraOpen(false);
    setCandidate(undefined);
    setError('');
    setNote('');
    try {
      setCode(value.trim());
      const ticket = await staffApi.lookup(eventId, value.trim());
      setCandidate({ eventId, ticket });
    } catch (failure) { setError(message(failure)); }
    finally { pending.current = false; setBusy(false); }
  }

  async function redeem() {
    if (!candidate || candidate.eventId !== eventId || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await staffApi.redeem(eventId, candidate.ticket.ticketCode);
      setNote(tr('Tiket berhasil check-in.', 'Ticket checked in.'));
      setCode('');
      setCandidate(undefined);
      stats.reload();
    } catch (failure) { setError(message(failure)); }
    finally { pending.current = false; setBusy(false); }
  }

  async function openCamera() {
    setError('');
    try {
      const result = permission?.granted ? permission : await requestPermission();
      if (result.granted) setCameraOpen(true);
      else setError(tr('Izin kamera ditolak. Izinkan dari pengaturan atau masukkan kode secara manual.', 'Camera permission denied. Allow access in settings or enter the code manually.'));
    } catch (failure) { setError(message(failure)); }
  }

  const checked = candidate?.eventId === eventId ? candidate?.ticket : undefined;
  const eligible = checked && !checked.isRedeemed && !checked.isCancelled && !checked.isRefunded && stats.data?.event.id === eventId && stats.data?.event.isActive;

  return <Screen title={tr('Scanner gerbang', 'Gate scanner')}>
    <Feedback busy={events.loading} error={events.error} />
    <Action quiet label={tr('Muat ulang penugasan', 'Refresh assignments')} onPress={events.reload} disabled={busy || events.loading} />
    {!events.loading && !events.error && !events.data?.length && <Copy>{tr('Belum ada konser yang ditugaskan.', 'No assigned concerts.')}</Copy>}
    {!!events.data?.length && <Panel>
      <Copy bold>{tr('Pilih konser', 'Choose a concert')}</Copy>
      {events.data.map(event => <Action key={event.id} label={event.title} quiet={event.id !== eventId} disabled={busy} onPress={() => {
        setSelected(event.id); setCandidate(undefined); setError(''); setNote(''); setCode(''); setCameraOpen(false);
      }} />)}
    </Panel>}
    {eventId && <Panel>
      <Feedback busy={stats.loading} error={stats.error} />
      {stats.data?.event.id === eventId && <>
        <Copy bold>{stats.data.event.title}</Copy>
        <Copy>{stats.data.statistics.totalRedeemed} / {stats.data.statistics.totalParticipants} {tr('tiket sudah check-in', 'tickets checked in')}</Copy>
        {!stats.data.event.isActive && <Copy>{tr('Check-in tersedia selama jadwal konser berlangsung.', 'Check-in is available during the concert.')}</Copy>}
      </>}
      <Action quiet label={tr('Perbarui status konser', 'Refresh concert status')} onPress={stats.reload} disabled={busy || stats.loading} />
      {cameraOpen && focused && foreground ? <>
        <View style={{ height: 280, overflow: 'hidden', borderRadius: 8 }}>
          <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={busy ? undefined : ({ data }) => { void inspect(data); }}
            onMountError={({ message: detail }) => { setError(detail); setCameraOpen(false); }} />
        </View>
        <Action label={tr('Tutup kamera', 'Close camera')} quiet onPress={() => setCameraOpen(false)} />
      </> : <Action label={tr('Buka kamera QR', 'Open QR camera')} onPress={() => { void openCamera(); }} disabled={busy} />}
      {permission && !permission.granted && !permission.canAskAgain && <Action quiet label={tr('Buka pengaturan aplikasi', 'Open app settings')} onPress={() => { void Linking.openSettings().catch(failure => setError(message(failure))); }} />}
      <Field label={tr('Kode tiket', 'Ticket code')} value={code} onChangeText={value => { setCode(value); setCandidate(undefined); }} autoCapitalize="characters" autoCorrect={false} editable={!busy} />
      <Action quiet label={tr('Periksa tiket', 'Look up ticket')} onPress={() => { void inspect(code); }} disabled={busy || !code.trim()} />
      <Feedback busy={busy} error={error} />
      {!!note && <Copy bold>{note}</Copy>}
      {checked && <>
        <Copy bold>{checked.owner.fullName} · {checked.ticketType.name}</Copy>
        <Copy>{checked.ticketCode}</Copy>
        <Copy>{checked.isRedeemed ? tr('Sudah digunakan', 'Already used') : checked.isCancelled ? tr('Dibatalkan', 'Cancelled') : checked.isRefunded ? tr('Sudah direfund', 'Refunded') : tr('Tiket ditemukan', 'Ticket found')}</Copy>
        <Action label={tr('Konfirmasi check-in', 'Confirm check-in')} disabled={!eligible || busy} onPress={() => { void redeem(); }} />
      </>}
    </Panel>}
    {stats.data?.event.id === eventId && !!stats.data?.recentRedemptions.length && <Panel>
      <Copy bold>{tr('Check-in terbaru', 'Recent check-ins')}</Copy>
      {stats.data.recentRedemptions.map(row => <Copy key={row.id}>{row.buyerName} · {row.ticketType}</Copy>)}
    </Panel>}
  </Screen>;
}
