import { queryInternalDatabase } from '@/server-lib/internal-db-query';
import { auth } from '@/server-lib/auth';
import { NextResponse } from 'next/server';
import type { Order, OrderItem, OrderWithItems } from '@/shared/models/breakfast';

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const orders = await queryInternalDatabase(
      `SELECT id, resident_name, flat_number, mobile_number, address, delivery_method, notes, status, payment_method, total_pence, user_id, created_at, updated_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [session.user.id]
    ) as unknown as Order[];

    if (orders.length === 0) {
      return NextResponse.json([]);
    }

    const orderIds = orders.map(o => o.id);
    const itemsRows = await queryInternalDatabase(
      'SELECT id, order_id, menu_item_id, quantity, item_name, item_price_pence FROM order_items WHERE order_id = ANY($1)',
      [orderIds]
    ) as unknown as OrderItem[];

    const itemsByOrderId = new Map<string, OrderItem[]>();
    for (const item of itemsRows) {
      const existing = itemsByOrderId.get(item.order_id);
      if (existing) {
        existing.push(item);
      } else {
        itemsByOrderId.set(item.order_id, [item]);
      }
    }

    const ordersWithItems: OrderWithItems[] = orders.map(order => ({
      ...order,
      items: itemsByOrderId.get(order.id) ?? [],
    }));

    return NextResponse.json(ordersWithItems);
  } catch (error) {
    console.error('Failed to fetch user orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
