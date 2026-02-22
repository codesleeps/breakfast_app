import { queryInternalDatabase } from '@/server-lib/internal-db-query';
import { NextResponse } from 'next/server';
import type { Order, OrderItem, OrderWithItems } from '@/shared/models/breakfast';

const VALID_DELIVERY_METHODS = ['delivery', 'collection'];
const VALID_PAYMENT_METHODS = ['cash', 'card', 'donation'];
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

async function isKitchenOpen(): Promise<{ open: boolean; message?: string }> {
  try {
    const rows = await queryInternalDatabase(
      'SELECT key, value FROM kitchen_settings WHERE key IN ($1, $2, $3)',
      ['service_days', 'service_start_hour', 'service_end_hour']
    ) as unknown as Array<{ key: string; value: string }>;

    const settingsMap = new Map(rows.map(r => [r.key, r.value]));

    const serviceDaysRaw = settingsMap.get('service_days');
    let serviceDays: string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (serviceDaysRaw) {
      try {
        serviceDays = JSON.parse(serviceDaysRaw);
      } catch {
        // fallback
      }
    }

    const startHour = parseInt(settingsMap.get('service_start_hour') ?? '8', 10);
    const endHour = parseInt(settingsMap.get('service_end_hour') ?? '11', 10);

    const now = new Date();
    const currentDay = DAY_NAMES[now.getDay()] ?? 'sunday';
    const currentHour = now.getHours();

    if (!serviceDays.includes(currentDay)) {
      return { open: false, message: 'The kitchen is not open today' };
    }

    if (currentHour < startHour || currentHour >= endHour) {
      return { open: false, message: `The kitchen is only open from ${startHour}am to ${endHour}am` };
    }

    return { open: true };
  } catch {
    // If we can't check settings, allow the order (fail open)
    return { open: true };
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    let orderQuery = `
      SELECT id, resident_name, flat_number, delivery_method, notes, status, payment_method, total_pence, created_at, updated_at
      FROM orders
      WHERE created_at >= CURRENT_DATE
    `;
    const params: (string | string[])[] = [];

    if (statusFilter) {
      const statuses = statusFilter.split(',').map(s => s.trim());
      params.push(statuses);
      orderQuery += ` AND status = ANY($1)`;
    }

    orderQuery += ' ORDER BY created_at DESC';

    const orders = await queryInternalDatabase(orderQuery, params) as unknown as Order[];

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
    console.error('Failed to fetch orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { resident_name, flat_number, delivery_method, notes, payment_method, items } = body;

    // Check service hours
    const kitchenStatus = await isKitchenOpen();
    if (!kitchenStatus.open) {
      return NextResponse.json(
        { error: kitchenStatus.message ?? 'The kitchen is currently closed' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!resident_name || typeof resident_name !== 'string' || resident_name.trim().length === 0) {
      return NextResponse.json({ error: 'Resident name is required' }, { status: 400 });
    }

    if (!delivery_method || !VALID_DELIVERY_METHODS.includes(delivery_method)) {
      return NextResponse.json({ error: 'Invalid delivery method' }, { status: 400 });
    }

    if (!payment_method || !VALID_PAYMENT_METHODS.includes(payment_method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    // Validate items structure
    for (const item of items) {
      if (!item.menu_item_id || typeof item.quantity !== 'number' || item.quantity < 1) {
        return NextResponse.json({ error: 'Invalid item in order' }, { status: 400 });
      }
    }

    // Look up menu item prices from DB
    const menuItemIds = items.map((i: { menu_item_id: string }) => i.menu_item_id);
    const menuItems = await queryInternalDatabase(
      'SELECT id, name, price_pence, available FROM menu_items WHERE id = ANY($1)',
      [menuItemIds]
    ) as unknown as Array<{ id: string; name: string; price_pence: number; available: boolean }>;

    const menuItemMap = new Map(menuItems.map(mi => [mi.id, mi]));

    // Verify all items exist and are available
    for (const item of items) {
      const menuItem = menuItemMap.get(item.menu_item_id);
      if (!menuItem) {
        return NextResponse.json({ error: `Menu item not found: ${item.menu_item_id}` }, { status: 400 });
      }
      if (!menuItem.available) {
        return NextResponse.json({ error: `Menu item not available: ${menuItem.name}` }, { status: 400 });
      }
    }

    // Calculate total
    let totalPence = 0;
    for (const item of items) {
      const menuItem = menuItemMap.get(item.menu_item_id);
      if (menuItem) {
        totalPence += menuItem.price_pence * item.quantity;
      }
    }

    // Insert order
    const orderRows = await queryInternalDatabase(
      `INSERT INTO orders (id, resident_name, flat_number, delivery_method, notes, status, payment_method, total_pence, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'pending', $5, $6, NOW(), NOW())
       RETURNING id, resident_name, flat_number, delivery_method, notes, status, payment_method, total_pence, created_at, updated_at`,
      [
        resident_name.trim(),
        flat_number?.trim() || null,
        delivery_method,
        notes?.trim() || null,
        payment_method,
        totalPence,
      ]
    ) as unknown as Order[];

    const order = orderRows[0];
    if (!order) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Insert order items
    const orderItems: OrderItem[] = [];
    for (const item of items) {
      const menuItem = menuItemMap.get(item.menu_item_id);
      if (!menuItem) continue;

      const insertedItems = await queryInternalDatabase(
        `INSERT INTO order_items (id, order_id, menu_item_id, quantity, item_name, item_price_pence)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
         RETURNING id, order_id, menu_item_id, quantity, item_name, item_price_pence`,
        [order.id, item.menu_item_id, item.quantity, menuItem.name, menuItem.price_pence]
      ) as unknown as OrderItem[];

      const insertedItem = insertedItems[0];
      if (insertedItem) {
        orderItems.push(insertedItem);
      }
    }

    const orderWithItems: OrderWithItems = {
      ...order,
      items: orderItems,
    };

    return NextResponse.json(orderWithItems, { status: 201 });
  } catch (error) {
    console.error('Failed to create order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}