import { useCallback, useRef, useState } from 'react';
import { Linking, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/Preferences';
import { Action, Copy, Feedback, Field, message, Panel, rupiah, Screen, useResource } from '../components/Flow';
import { adminApi } from '../lib/operations';
import type { Event, OrganizerProfile, Refund, User } from '../types/api';

type Section = 'events' | 'organizers' | 'refunds' | 'users';
type Review = { type: 'event' | 'organizer' | 'document' | 'refund'; id: string; name: string; action: 'approve' | 'reject' };

export default function AdminScreen() {
  const { user, isAdmin } = useAuth();
  const { tr } = usePreferences();
  const [section, setSection] = useState<Section>('events');
  const [page, setPage] = useState(1);
  const [organizerId, setOrganizerId] = useState('');
  const [review, setReview] = useState<Review>();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const dashboard = useResource(adminApi.dashboard, isAdmin);
  const loadRows = useCallback(async () => {
    const result = await adminApi[section](page);
    return { section, page, result };
  }, [section, page]);
  const rows = useResource(loadRows, isAdmin);
  const loadOrganizer = useCallback(() => adminApi.organizer(organizerId), [organizerId]);
  const organizer = useResource(loadOrganizer, isAdmin && Boolean(organizerId));
  const records = rows.data?.section === section && rows.data.page === page ? rows.data.result : undefined;
  const profile = organizer.data?.id === organizerId ? organizer.data : undefined;

  function reviewButtons(type: Review['type'], id: string, name: string) {
    return <View className="flex-row flex-wrap gap-2">
      {(['approve', 'reject'] as const).map(action => <Action key={action} quiet label={action === 'approve' ? tr('Setujui', 'Approve') : tr('Tolak', 'Reject')} disabled={busy} onPress={() => {
        setReview({ type, id, name, action }); setReason(''); setError(''); setNote('');
      }} />)}
    </View>;
  }

  async function submitReview() {
    if (!review || pending.current || (review.action === 'reject' && !reason.trim())) return;
    pending.current = true;
    setBusy(true);
    setError('');
    const handlers = { event: adminApi.reviewEvent, organizer: adminApi.reviewOrganizer, document: adminApi.reviewDocument, refund: adminApi.reviewRefund };
    try {
      const result = await handlers[review.type](review.id, review.action, review.action === 'reject' ? reason.trim() : undefined);
      setNote(result.message);
      setReview(undefined);
      rows.reload();
      organizer.reload();
      dashboard.reload();
    } catch (failure) { setError(message(failure)); }
    finally { pending.current = false; setBusy(false); }
  }

  if (!user) return <Redirect href="/(auth)/login" />;
  if (!isAdmin) return <Redirect href="/(tabs)" />;

  return <Screen title={tr('Dashboard admin', 'Admin dashboard')}>
    <Feedback busy={dashboard.loading} error={dashboard.error} />
    {dashboard.data && <Panel>
      <Copy bold>{tr('Ringkasan platform', 'Platform summary')}</Copy>
      <Copy>{tr('Pengguna', 'Users')} {dashboard.data.summary.totalUsers} · {tr('Konser terbit', 'Published concerts')} {dashboard.data.summary.publishedEvents}</Copy>
      <Copy>{tr('Pesanan lunas', 'Paid orders')} {dashboard.data.summary.paidOrders} · {tr('Tiket digunakan', 'Tickets redeemed')} {dashboard.data.summary.totalRedeemedTickets}</Copy>
    </Panel>}
    <View className="flex-row flex-wrap gap-2">
      {([['events', tr('Konser', 'Concerts')], ['organizers', 'Organizer'], ['refunds', 'Refund'], ['users', tr('Pengguna', 'Users')]] as const).map(([key, label]) =>
        <Action key={key} label={label} quiet={section !== key} disabled={busy} onPress={() => {
          setSection(key); setPage(1); setOrganizerId(''); setReview(undefined); setError(''); setNote('');
        }} />)}
    </View>
    <Feedback busy={rows.loading} error={rows.error} />
    <Action quiet label={tr('Muat ulang', 'Refresh')} disabled={busy} onPress={() => { rows.reload(); dashboard.reload(); organizer.reload(); }} />
    {review && <Panel>
      <Copy bold>{review.action === 'approve' ? tr('Konfirmasi persetujuan', 'Confirm approval') : tr('Konfirmasi penolakan', 'Confirm rejection')}</Copy>
      <Copy>{review.name}</Copy>
      {review.action === 'reject' && <Field label={tr('Alasan penolakan', 'Rejection reason')} value={reason} onChangeText={setReason} multiline editable={!busy} />}
      <Action label={tr('Konfirmasi', 'Confirm')} disabled={busy || (review.action === 'reject' && !reason.trim())} onPress={() => { void submitReview(); }} />
      <Action quiet label={tr('Batal', 'Cancel')} disabled={busy} onPress={() => { setReview(undefined); setError(''); }} />
    </Panel>}
    <Feedback error={error} />
    {!!note && <Copy bold>{note}</Copy>}
    {section === 'organizers' && organizerId !== '' && <Panel>
      <Feedback busy={organizer.loading} error={organizer.error} />
      {profile && <>
        <Copy bold>{profile.organizationName} · {profile.status}</Copy>
        {profile.documents?.map(doc => <View key={doc.id} className="gap-2 border-t border-line pt-2">
          <Copy>{doc.type} · {doc.status}</Copy>
          {/^https?:\/\//i.test(doc.fileUrl) && <Action quiet label={tr('Buka dokumen', 'Open document')} onPress={() => { void Linking.openURL(doc.fileUrl).catch(failure => setError(message(failure))); }} />}
          {doc.status === 'PENDING' && reviewButtons('document', doc.id, doc.type)}
        </View>)}
        {profile.status === 'PENDING' && reviewButtons('organizer', profile.id, profile.organizationName)}
      </>}
      <Action quiet label={tr('Tutup detail', 'Close details')} disabled={busy} onPress={() => setOrganizerId('')} />
    </Panel>}
    {records?.data.length === 0 && <Copy>{tr('Belum ada data.', 'No records.')}</Copy>}
    {(records?.data ?? []).map(record => {
      if (section === 'events') {
        const event = record as Event;
        return <Panel key={event.id}><Copy bold>{event.title}</Copy><Copy>{event.status} · {event.location}</Copy><Copy>{event.description}</Copy>
          {event.status === 'PENDING_REVIEW' && reviewButtons('event', event.id, event.title)}
        </Panel>;
      }
      if (section === 'organizers') {
        const item = record as OrganizerProfile;
        return <Panel key={item.id}><Copy bold>{item.organizationName}</Copy><Copy>{item.status}</Copy>
          <Action quiet label={tr('Periksa dokumen', 'Review documents')} disabled={busy} onPress={() => { setOrganizerId(item.id); setReview(undefined); }} />
        </Panel>;
      }
      if (section === 'refunds') {
        const refund = record as Refund;
        const name = refund.event?.title ?? tr('Pengajuan refund', 'Refund request');
        return <Panel key={refund.id}><Copy bold>{name}</Copy><Copy>{refund.status} · {rupiah(refund.amount)}</Copy><Copy>{refund.reason}</Copy>
          {refund.status === 'PENDING_APPROVAL' && reviewButtons('refund', refund.id, name)}
        </Panel>;
      }
      const account = record as User;
      return <Panel key={account.id}><Copy bold>{account.fullName}</Copy><Copy>{account.email} · {account.role}</Copy></Panel>;
    })}
    {records && records.meta.totalPages > 1 && <View className="flex-row flex-wrap items-center gap-2">
      <Action quiet label={tr('Sebelumnya', 'Previous')} onPress={() => setPage(page - 1)} disabled={page <= 1 || busy || rows.loading} />
      <Copy>{page} / {records.meta.totalPages}</Copy>
      <Action quiet label={tr('Berikutnya', 'Next')} onPress={() => setPage(page + 1)} disabled={page >= records.meta.totalPages || busy || rows.loading} />
    </View>}
  </Screen>;
}
