import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { getRandomValues } from 'expo-crypto';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../context/Preferences';
import { Action, Copy, Feedback, Field, message, Panel, rupiah, Screen, useResource } from '../../components/Flow';
import { ApiError, eventApi, orderApi } from '../../lib/api';
import { zoneName, zoneNames } from '../../lib/venueLayouts';
import { canBuy } from '../../lib/checkout';

const identities = ['KTP', 'NPWP', 'STUDENT_CARD', 'SIM', 'PASSPORT', 'KITAS', 'OTHER'] as const;

export default function Checkout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { tr, language } = usePreferences();
  const load = useCallback(() => eventApi.getEventDetail(id), [id]);
  const event = useResource(load, Boolean(user && id));
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [name, setName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [identityType, setType] = useState<typeof identities[number]>('KTP');
  const [identityNumber, setIdentity] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const attempt = useRef<{ signature: string; key: string } | undefined>(undefined);
  const concert = event.data?.id === id ? event.data : undefined;
  const tiers = concert?.ticketTypes ?? [];
  const selected = tiers.filter(tier => (amounts[tier.id] || 0) > 0);
  const items = selected.map(tier => ({ ticketTypeId: tier.id, quantity: amounts[tier.id] }));
  const invalidStock = selected.some(tier => amounts[tier.id] > tier.availableQuota);
  const total = selected.reduce((sum, tier) => sum + Number(tier.price) * amounts[tier.id], 0);
  const blocked = !concert || !canBuy(user, concert);
  const identityHint = identityType === 'KTP' ? tr('NIK 16 angka', '16-digit NIK')
    : identityType === 'NPWP' ? tr('NPWP 15 atau 16 angka', '15 or 16 digits')
    : tr('4–32 huruf atau angka', '4–32 letters or digits');

  async function submit() {
    if (pending.current || blocked || invalidStock || !items.length || !event.data || event.data.id !== id) return;
    const normalized = identityNumber.toUpperCase().replace(/[ .-]/g, '');
    const format = identityType === 'KTP' ? /^\d{16}$/ : identityType === 'NPWP' ? /^\d{15,16}$/ : /^[A-Z0-9]{4,32}$/;
    if (!format.test(normalized)) {
      setError(tr('Format nomor identitas: ', 'Identity format: ') + identityHint);
      return;
    }
    if (name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !/^\+?\d{8,15}$/.test(phone.replace(/[\s().-]/g, ''))) {
      setError(tr('Periksa nama, email, dan nomor telepon (8–15 angka).', 'Check the name, email and phone number (8–15 digits).'));
      return;
    }
    pending.current = true;
    setBusy(true);
    setError('');
    const buyer = { fullName: name.trim(), email: email.trim(), phone: phone.trim(), identityType, identityNumber: normalized, language };
    const signature = JSON.stringify([items, buyer.fullName, buyer.email, buyer.phone, identityType, normalized.slice(-4), language]);
    try {
      if (attempt.current?.signature !== signature) {
        const random = getRandomValues(new Uint8Array(16));
        attempt.current = { signature, key: Array.from(random, byte => byte.toString(16).padStart(2, '0')).join('') };
      }
      const order = await orderApi.create({ items, buyer, idempotencyKey: attempt.current.key });
      router.replace({ pathname: '/orders/[id]', params: { id: order.id } });
    } catch (failure) {
      if (failure instanceof ApiError && (failure.statusCode === 400 || failure.message.startsWith('Previous order with this idempotency key'))) attempt.current = undefined;
      setError(message(failure));
    } finally { pending.current = false; setBusy(false); }
  }
  if (!user) return <Redirect href="/(auth)/login" />;
  return <Screen title={tr('Pesan tiket', 'Checkout')}>
    <Feedback busy={event.loading} error={event.error} />
    {!!event.error && <Action quiet label={tr('Coba lagi', 'Retry')} onPress={event.reload} />}
    {concert && <Copy bold>{concert.title}</Copy>}
    {concert && blocked && <Copy>{tr('Pembelian tersedia untuk akun pembeli biasa.', 'Checkout is available to regular customer accounts.')}</Copy>}
    {concert && !blocked && <>
      <Panel>
        <Copy bold>{tr('Pilih jumlah tiket', 'Select quantities')}</Copy>
        {!tiers.length && <Copy>{tr('Belum ada tiket.', 'No tickets available.')}</Copy>}
        {tiers.map(tier => {
          const zone = zoneName(tier.viewPosition);
          return <View key={tier.id} className="gap-2 border-b border-line pb-3">
          <Copy bold>{tier.name} · {rupiah(tier.price)}</Copy>
          <Copy>{tier.availableQuota} {tr('tersedia', 'available')}{zone && ` · ${zoneNames[zone][language]}`}</Copy>
          <View className="flex-row gap-3 items-center">
            <Action quiet label={'− ' + tier.name} disabled={!amounts[tier.id] || busy} onPress={() => setAmounts(current => ({ ...current, [tier.id]: Math.max(0, (current[tier.id] || 0) - 1) }))} />
            <Copy bold>{amounts[tier.id] || 0}</Copy>
            <Action quiet label={'+ ' + tier.name} disabled={(amounts[tier.id] || 0) >= tier.availableQuota || busy} onPress={() => setAmounts(current => ({ ...current, [tier.id]: Math.min(tier.availableQuota, (current[tier.id] || 0) + 1) }))} />
          </View>
        </View>;
        })}
        <Copy bold>Total · {rupiah(total)}</Copy>
      </Panel>
      <Panel>
        <Copy bold>{tr('Data pembeli', 'Buyer details')}</Copy>
        <Field label={tr('Nama lengkap', 'Full name')} value={name} onChangeText={setName} maxLength={120} editable={!busy} />
        <Field label={tr('Email penerima tiket', 'Ticket delivery email')} value={email} onChangeText={setEmail} maxLength={254} keyboardType="email-address" autoCapitalize="none" editable={!busy} />
        <Field label={tr('Nomor telepon', 'Phone number')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={!busy} />
        <Copy bold>{tr('Jenis identitas', 'Identity type')}</Copy>
        <View className="flex-row flex-wrap gap-2">{identities.map(type => <Action key={type} label={type === 'STUDENT_CARD' ? tr('Kartu pelajar', 'Student ID') : type === 'OTHER' ? tr('Lainnya', 'Other') : type}
          quiet={identityType !== type} disabled={busy} onPress={() => { setType(type); setIdentity(''); setError(''); }} />)}</View>
        <Field label={tr('Nomor identitas', 'ID number')} value={identityNumber} onChangeText={setIdentity} placeholder={identityHint}
          keyboardType={identityType === 'KTP' || identityType === 'NPWP' ? 'number-pad' : 'default'} editable={!busy} autoCapitalize="characters" autoCorrect={false} maxLength={42} />
        <Copy>{tr('Backend menyimpan empat karakter terakhir nomor identitas.', 'The backend keeps the last four characters of your ID number.')}</Copy>
        <Feedback busy={busy} error={error || (invalidStock ? tr('Kuota berubah. Sesuaikan pilihan tiket.', 'Availability changed. Adjust ticket quantities.') : '')} />
        <Action label={tr('Buat pesanan', 'Create order')} onPress={() => { void submit(); }} disabled={busy || !items.length || invalidStock} />
      </Panel>
    </>}
  </Screen>;
}
