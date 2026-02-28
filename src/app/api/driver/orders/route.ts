import { queryInternalDatabase } from '@/server-lib/internal-db-query';
import { NextResponse } from 'next/server';
import { demoOrders } from '@/server-lib/demo-store';
import type { OrderWithItems } from '@/shared/models/breakfast';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get demo orders that are ready for delivery
    const readyDemoOrders = demoOrders.filter(
      (o) => o.status === 'ready' && o.delivery_method === 'delivery'
    );

    // Query real orders from database
    const dbOrders = await queryInternalDatabase(
      `SELECT 
        o.id, o.resident_name, o.flat_number, o.mobile_number, o.address,
        o.delivery_method, o.notes, o.status, o.payment_method, o.total_pence,
        o.created_at, o.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'order_id', oi.order_id,
              'menu_item_id', oi.menu_item_id,
              'quantity', oi.quantity,
              'item_name', oi.item_name,
              'item_price_pence', oi.item_price_pence
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status = 'ready' AND o.delivery_method = 'delivery'
      GROUP BY o.id
      ORDER BY o.created_at ASC`
    ) as unknown as OrderWithItems[];

    // Combine demo and real orders
    const allOrders = [...readyDemoOrders, ...dbOrders];

    return NextResponse.json(allOrders);
  } catch (error) {
    console.error('Failed to fetch driver orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
