import { queryInternalDatabase } from '@/server-lib/internal-db-query';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, orderId, userId } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription object' },
        { status: 400 }
      );
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    // Upsert subscription (update if endpoint exists, insert if not)
    await queryInternalDatabase(
      `INSERT INTO push_subscriptions (user_id, order_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (endpoint) DO UPDATE SET
         user_id = COALESCE($1, push_subscriptions.user_id),
         order_id = COALESCE($2, push_subscriptions.order_id),
         p256dh = $4,
         auth = $5`,
      [userId || null, orderId || null, endpoint, p256dh, auth]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    await queryInternalDatabase(
      `DELETE FROM push_subscriptions WHERE endpoint = $1`,
      [endpoint]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
}
