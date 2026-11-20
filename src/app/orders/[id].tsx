import { useCallback, useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { openBrowserAsync } from 'expo-web-browser';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { usePreferences } from '../../context/Preferences';
import { Action, Copy, Feedback, Field, message, Panel, rupiah, Screen, useResource } from '../../components/Flow';
import { orderApi, refundApi } from '../../lib/api';

export default function OrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { tr } = usePreferences();
  const router = useRouter();
  const load = useCallback(() => orderApi.getOrderDetail(id), [id]);
  const order = useResource(load, Boolean(user && id));
  const record = order.data?.id === id ? order.data : undefined;
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const pending = useRef(false);

  async function payment(url: string) {
    if (pending.current || !/^https:\/\//i.test(url)) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      if (Platform.OS === 'web') await Linking.openURL(url);
      else await openBrowserAsync(url);
    } catch (failure) { setError(message(failure)); }
    finally { pending.current = false; setBusy(false); order.reload(); }
  }

  async function requestRefund() {
    if (record?.canRequestRefund !== true || pending.current || !reason.trim()) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await refundApi.create(id, reason.trim());
      setReason('');
      setNote(tr('Refund diajukan.', 'Refund requested.'));
      order.reload();
    } catch (failure) { setError(message(failure)); }
    finally { pending.current = false; setBusy(false); }
  }
  if (!user) return <Redirect href="/(auth)/login" />;
  const concert = record?.orderItems?.[0]?.ticketType?.event;
  const refunds = record?.refunds ?? [];
  return <Screen title={tr('Rincian pesanan', 'Order details')}>
    <Feedback busy={order.loading || busy} error={order.error || error} />
    <Action quiet label={tr('Periksa status terbaru', 'Refresh status')} onPress={order.reload} disabled={order.loading || busy} />
    {record && <Panel>
      <Copy bold>{record.orderNumber}</Copy>
      {concert && <Copy>{concert.title}</Copy>}
      <Copy>{record.paymentStatus} · {rupiah(record.totalAmount)}</Copy>
      {record.orderItems?.map(item => <Copy key={item.id}>{item.quantity} × {item.ticketType?.name} · {rupiah(item.price)}</Copy>)}
      {record.paymentStatus === 'PENDING' && record.paymentUrl && /^https:\/\//i.test(record.paymentUrl) &&
        <Action label={tr('Bayar di Xendit', 'Pay with Xendit')} onPress={() => { void payment(record.paymentUrl!); }} disabled={busy} />}
      {record.paymentStatus === 'PAID' && <Action label={tr('Buka tiket saya', 'Open my tickets')} onPress={() => router.push('/(tabs)/my-tickets')} />}
    </Panel>}
    {!!refunds.length && <Panel>{refunds.map(refund => <Copy key={refund.id}>Refund · {refund.status} · {rupiah(refund.amount)}</Copy>)}</Panel>}
    {!!note && <Copy bold>{note}</Copy>}
    {record?.canRequestRefund === true && <Panel>
      <Copy bold>{tr('Ajukan refund', 'Request refund')}</Copy>
      <Field label={tr('Alasan refund', 'Refund reason')} value={reason} onChangeText={setReason} editable={!busy} multiline />
      <Action label={tr('Kirim pengajuan refund', 'Submit refund request')} disabled={busy || !reason.trim()} onPress={() => { void requestRefund(); }} />
    </Panel>}
  </Screen>;
}
