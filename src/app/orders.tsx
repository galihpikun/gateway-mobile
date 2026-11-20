import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/Preferences';
import { Action, Copy, Feedback, Panel, rupiah, Screen, useResource } from '../components/Flow';
import { orderApi } from '../lib/api';

export default function Orders() {
  const { user } = useAuth();
  const { tr } = usePreferences();
  const router = useRouter();
  const orders = useResource(orderApi.getMyOrders, Boolean(user));
  if (!user) return <Redirect href="/(auth)/login" />;
  const list = Array.isArray(orders.data) ? orders.data : orders.data?.data;
  return <Screen title={tr('Pesanan saya', 'My orders')}>
    <Feedback busy={orders.loading} error={orders.error} />
    <Action quiet label={tr('Muat ulang pesanan', 'Refresh orders')} onPress={orders.reload} disabled={orders.loading} />
    {list?.length === 0 && <Copy>{tr('Belum ada pesanan.', 'No orders yet.')}</Copy>}
    {list?.map(order => <Panel key={order.id}>
      <Copy bold>{order.orderNumber}</Copy>
      <Copy>{order.paymentStatus} · {rupiah(order.totalAmount)}</Copy>
      <Action quiet label={tr('Buka pesanan', 'Open order')} onPress={() => router.push({ pathname: '/orders/[id]', params: { id: order.id } })} />
    </Panel>)}
  </Screen>;
}
