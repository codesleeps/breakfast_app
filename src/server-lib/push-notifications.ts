import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:hello@astonbreakfastclub.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured, skipping push notification');
    return false;
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (error: unknown) {
    const err = error as { statusCode?: number };
    if (err.statusCode === 410 || err.statusCode === 404) {
      // Subscription expired or invalid
      console.log('Push subscription expired:', subscription.endpoint);
      return false;
    }
    console.error('Error sending push notification:', error);
    return false;
  }
}

export function getOrderStatusMessage(status: string, orderId: string): NotificationPayload {
  const messages: Record<string, { title: string; body: string }> = {
    preparing: {
      title: '👨‍🍳 Order Being Prepared',
      body: 'Your breakfast order is now being prepared!',
    },
    ready: {
      title: '✅ Order Ready!',
      body: 'Your breakfast order is ready for pickup/delivery!',
    },
    delivered: {
      title: '🎉 Order Delivered',
      body: 'Your breakfast has been delivered. Enjoy!',
    },
    cancelled: {
      title: '❌ Order Cancelled',
      body: 'Your order has been cancelled.',
    },
  };

  const message = messages[status] || {
    title: 'Order Update',
    body: `Your order status has been updated to: ${status}`,
  };

  return {
    ...message,
    icon: '/breakfastApp_favicon.png',
    badge: '/breakfastApp_favicon.png',
    tag: `order-${orderId}`,
    data: { orderId, status, url: '/my-orders' },
  };
}
