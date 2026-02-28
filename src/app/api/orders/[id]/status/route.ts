import { queryInternalDatabase } from '@/server-lib/internal-db-query';
import { NextResponse } from 'next/server';
import { demoOrders } from '@/server-lib/demo-store';
import { sendPushNotification, getOrderStatusMessage, type PushSubscription } from '@/server-lib/push-notifications';

const VALID_STATUSES = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];

async function notifyOrderSubscribers(orderId: string, status: string) {
  try {
    // Get all subscriptions for this order
    const subscriptions = await queryInternalDatabase(
      `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE order_id = $1`,
      [orderId]
    );

    if (subscriptions.length === 0) return;

    const payload = getOrderStatusMessage(status, orderId);

    for (const sub of subscriptions) {
      const subscription: PushSubscription = {
        endpoint: sub.endpoint as string,
        keys: {
          p256dh: sub.p256dh as string,
          auth: sub.auth as string,
        },
      };

      const success = await sendPushNotification(subscription, payload);

      // Remove invalid subscriptions
      if (!success) {
        await queryInternalDatabase(
          `DELETE FROM push_subscriptions WHERE endpoint = $1`,
          [sub.endpoint as string]
        );
      }
    }
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  // Check if this is a demo order
  if (id.startsWith('demo-')) {
    const orderIndex = demoOrders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    demoOrders[orderIndex]!.status = status;
    demoOrders[orderIndex]!.updated_at = new Date().toISOString();
    return NextResponse.json({ success: true });
  }

  try {
    const result = await queryInternalDatabase(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
      [status, id]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Send push notifications (don't await - fire and forget)
    notifyOrderSubscribers(id, status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update order status:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
