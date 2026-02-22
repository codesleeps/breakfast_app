import { queryInternalDatabase } from '@/server-lib/internal-db-query';
import { NextResponse } from 'next/server';
import type { Order, OrderItem, OrderWithItems } from '@/shared/models/breakfast';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const orderRows = await queryInternalDatabase(
      `SELECT id, resident_name, flat_number, delivery_method, notes, status, payment_method, total_pence, created_at, updated_at
       FROM orders WHERE id = $1`,
      [id]
    ) as unknown as Order[];

    const order = orderRows[0];
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const itemRows = await queryInternalDatabase(
      'SELECT id, order_id, menu_item_id, quantity, item_name, item_price_pence FROM order_items WHERE order_id = $1',
      [id]
    ) as unknown as OrderItem[];

    const orderWithItems: OrderWithItems = {
      ...order,
      items: itemRows,
    };

    return NextResponse.json(orderWithItems);
  } catch (error) {
    console.error('Failed to fetch order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
