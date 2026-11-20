import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useColors, usePreferences } from '../context/Preferences';
import type { IssuedTicket } from '../types/api';
import { Icon } from './Icon';

export function useTicketInfo(ticket: IssuedTicket) {
  const { tr } = usePreferences();
  const colors = useColors();
  const category = ticket.orderItem?.ticketType?.name ?? tr('Tiket', 'Ticket');
  const event = ticket.orderItem?.ticketType?.event;
  const canScan = Boolean(ticket.ticketCode) && !ticket.isCancelled && !ticket.isRefunded && !ticket.isRedeemed;
  const status = ticket.isRefunded ? tr('Dana dikembalikan', 'Refunded')
    : ticket.isCancelled ? tr('Dibatalkan', 'Cancelled')
      : ticket.isRedeemed ? tr('Sudah check-in', 'Checked in')
        : canScan ? tr('Siap digunakan', 'Ready to use') : tr('QR tidak tersedia', 'QR unavailable');
  const tone = ticket.isRefunded || ticket.isCancelled ? colors.danger : canScan ? colors.success : colors.inkSecondary;
  return { event, category, canScan, status, tone };
}

export function TicketDialog({ ticket, onClose }: { ticket: IssuedTicket; onClose: () => void }) {
  const { tr } = usePreferences();
  const colors = useColors();
  const { width, height } = useWindowDimensions();
  const { event, category, canScan, status, tone } = useTicketInfo(ticket);
  const qrSize = Math.min(360, Math.max(120, width - 76), Math.max(160, height - 320));
  const heading = canScan ? tr('QR tiket', 'Ticket QR') : tr('Detail tiket', 'Ticket details');

  return (
    <Modal visible transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#080b0ccb', justifyContent: 'center', padding: 16 }}>
        <Pressable accessible={false} style={{ position: 'absolute', inset: 0 }} onPress={onClose} />
        <View accessibilityViewIsModal style={{
          alignSelf: 'center', width: '100%', maxWidth: 440, maxHeight: '100%',
          borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: 'hidden',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingLeft: 18, paddingRight: 8, borderBottomWidth: 1, borderBottomColor: colors.line }}>
            <Text accessibilityRole="header" style={{ flex: 1, color: colors.inkPrimary, fontWeight: '700', fontSize: 19 }}>{heading}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={tr('Tutup', 'Close')} onPress={onClose}
              style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? colors.highlight : colors.surface })}>
              <Icon name="close" color={colors.inkPrimary} size={22} />
            </Pressable>
          </View>
          <ScrollView bounces={false} contentContainerStyle={{ padding: 18, gap: 14 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ color: colors.inkPrimary, fontSize: 18, fontWeight: '700' }}>{event?.title ?? category}</Text>
              <Text style={{ color: colors.inkSecondary, fontSize: 14 }}>{category}</Text>
            </View>
            {canScan ? <>
              <View accessible accessibilityRole="image" accessibilityLabel={heading}
                style={{ backgroundColor: '#fff', alignSelf: 'center', padding: 2, borderRadius: 8 }}>
                <QRCode value={ticket.ticketCode} size={qrSize} quietZone={Math.ceil(qrSize / 5)} color="#101415" backgroundColor="#fff" />
              </View>
              <Text selectable style={{ color: colors.inkPrimary, fontVariant: ['tabular-nums'], fontSize: 14, fontWeight: '600', textAlign: 'center' }}>{ticket.ticketCode}</Text>
              <Text style={{ color: colors.inkSecondary, fontSize: 14, textAlign: 'center' }}>{tr('Tunjukkan QR ini ke petugas di pintu masuk.', 'Show this QR code at the entrance.')}</Text>
            </> : <Text style={{ color: tone, fontSize: 15, fontWeight: '600' }}>{status}</Text>}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
