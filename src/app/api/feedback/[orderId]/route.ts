import { queryInternalDatabase } from '@/server-lib/internal-db-query';
import { NextResponse } from 'next/server';
import type { OrderFeedback } from '@/shared/models/breakfast';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const rows = await queryInternalDatabase(
      'SELECT id, order_id, rating, comment, created_at FROM order_feedback WHERE order_id = $1',
      [orderId]
    ) as unknown as OrderFeedback[];

    if (rows.length > 0) {
      return NextResponse.json({ exists: true, feedback: rows[0] });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error('Failed to check feedback:', error);
    return NextResponse.json({ error: 'Failed to check feedback' }, { status: 500 });
  }
}
