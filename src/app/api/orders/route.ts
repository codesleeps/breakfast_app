import { queryInternalDatabase } from '@/server-lib/internal-db-query';
import { auth } from '@/server-lib/auth';
import { NextResponse } from 'next/server';
import type { Order, OrderItem, OrderWithItems, OrderExtra, DietaryFlag } from '@/shared/models/breakfast';
import { demoOrders } from '@/server-lib/demo-store';

const VALID_DELIVERY_METHODS = ['delivery', 'collection'];
const VALID_PAYMENT_METHODS = ['cash', 'card', 'donation'];
const VALID_DIETARY_FLAGS: DietaryFlag[] = ['vegetarian', 'vegan', 'gluten_free', 'nut_allergy', 'dairy_free', 'halal'];
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

let useDemoMode = false;

// Demo menu items (used when no database) - must match MOCK_MENU_ITEMS in /api/menu/route.ts
const DEMO_MENU_ITEMS = new Map([
  // Main dishes - Hot
  ['1', { id: '1', name: 'Kitchen Special', price_pence: 500, available: true, prep_time_minutes: 12 }],
  ['2', { id: '2', name: 'Scrambled Eggs with Flatbread', price_pence: 300, available: true, prep_time_minutes: 8 }],
  ['3', { id: '3', name: 'Turkey Rashers', price_pence: 350, available: true, prep_time_minutes: 6 }],
  ['4', { id: '4', name: 'Poached Eggs with Flatbread', price_pence: 300, available: true, prep_time_minutes: 10 }],
  // Main dishes - Light
  ['5', { id: '5', name: 'Spicy Flatbread', price_pence: 400, available: true, prep_time_minutes: 8 }],
  ['6', { id: '6', name: 'Greek Yogurt Bowl', price_pence: 300, available: true, prep_time_minutes: 3 }],
  ['7', { id: '7', name: 'Oats Porridge', price_pence: 250, available: true, prep_time_minutes: 5 }],
  ['8', { id: '8', name: 'Cornmeal Porridge', price_pence: 250, available: true, prep_time_minutes: 5 }],
  // Drinks
  ['9', { id: '9', name: 'Filter Coffee', price_pence: 150, available: true, prep_time_minutes: 2 }],
  ['10', { id: '10', name: 'Tea', price_pence: 100, available: true, prep_time_minutes: 2 }],
  ['11', { id: '11', name: 'Orange Juice', price_pence: 200, available: true, prep_time_minutes: 1 }],
  ['12', { id: '12', name: 'Cappuccino', price_pence: 200, available: true, prep_time_minutes: 3 }],
  // Extras
  ['ex1', { id: 'ex1', name: 'Extra Fried Egg', price_pence: 50, available: true, prep_time_minutes: 2 }],
  ['ex2', { id: 'ex2', name: 'Extra Scrambled Egg', price_pence: 75, available: true, prep_time_minutes: 3 }],
  ['ex3', { id: 'ex3', name: 'Extra Mushrooms', price_pence: 50, available: true, prep_time_minutes: 3 }],
  ['ex4', { id: 'ex4', name: 'Extra Tomatoes', price_pence: 50, available: true, prep_time_minutes: 3 }],
  ['ex5', { id: 'ex5', name: 'Extra Cheese', price_pence: 50, available: true, prep_time_minutes: 1 }],
  ['ex6', { id: 'ex6', name: 'Extra Fish Fingers', price_pence: 100, available: true, prep_time_minutes: 5 }],
  ['ex7', { id: 'ex7', name: 'Extra Fried Dumplings', price_pence: 100, available: true, prep_time_minutes: 5 }],
  ['ex8', { id: 'ex8', name: 'Extra Plantains', price_pence: 75, available: true, prep_time_minutes: 4 }],
  ['ex9', { id: 'ex9', name: 'Extra Baked Beans', price_pence: 50, available: true, prep_time_minutes: 2 }],
]);

// Check if we should use demo mode (no valid database tables)
async function shouldUseDemoMode(): Promise<boolean> {
  if (useDemoMode) return true;
  try {
    await queryInternalDatabase('SELECT 1 FROM menu_items LIMIT 1');
    return false;
  } catch {
    useDemoMode = true;
    return true;
  }
}

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
  // Return demo orders if in demo mode
  if (useDemoMode) {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    
    let filtered = demoOrders;
    if (statusFilter) {
      const statuses = statusFilter.split(',').map(s => s.trim());
      filtered = demoOrders.filter(o => statuses.includes(o.status));
    }
    return NextResponse.json(filtered);
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    let orderQuery = `
      SELECT id, resident_name, flat_number, mobile_number, address, delivery_method, notes, dietary_flags, status, payment_method, total_pence, scheduled_for, created_at, updated_at
      FROM orders
      WHERE created_at >= CURRENT_DATE OR (scheduled_for IS NOT NULL AND scheduled_for >= CURRENT_DATE)
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
      'SELECT id, order_id, menu_item_id, quantity, item_name, item_price_pence, item_prep_time_minutes FROM order_items WHERE order_id = ANY($1)',
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
    console.error('Failed to fetch orders, using demo mode:', error);
    useDemoMode = true;
    return NextResponse.json(demoOrders);
  }
}

function createDemoOrder(data: {
  resident_name: string;
  flat_number?: string | null;
  mobile_number?: string | null;
  address?: string | null;
  delivery_method: 'delivery' | 'collection';
  notes?: string | null;
  dietary_flags?: DietaryFlag[];
  payment_method: 'cash' | 'card' | 'donation';
  items: Array<{ menu_item_id: string; quantity: number }>;
  extras?: Array<{ menu_item_id: string; quantity: number }>;
  scheduled_for?: string | null;
}): OrderWithItems {
  let totalPence = 0;
  const orderItems: OrderItem[] = [];
  const orderExtras: OrderExtra[] = [];
  const orderId = `demo-${Date.now()}`;

  for (const item of data.items) {
    const menuItem = DEMO_MENU_ITEMS.get(item.menu_item_id);
    if (menuItem) {
      totalPence += menuItem.price_pence * item.quantity;
      orderItems.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        order_id: orderId,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        item_name: menuItem.name,
        item_price_pence: menuItem.price_pence,
        item_prep_time_minutes: menuItem.prep_time_minutes,
      });
    }
  }

  // Process extras
  if (data.extras) {
    for (const extra of data.extras) {
      const menuItem = DEMO_MENU_ITEMS.get(extra.menu_item_id);
      if (menuItem) {
        totalPence += menuItem.price_pence * extra.quantity;
        orderExtras.push({
          id: `extra-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          order_id: orderId,
          menu_item_id: extra.menu_item_id,
          quantity: extra.quantity,
          item_name: menuItem.name,
          item_price_pence: menuItem.price_pence,
        });
      }
    }
  }

  const now = new Date().toISOString();
  const orderWithItems: OrderWithItems = {
    id: orderId,
    resident_name: data.resident_name.trim(),
    flat_number: data.flat_number?.trim() || null,
    mobile_number: data.mobile_number?.trim() || null,
    address: data.address?.trim() || null,
    delivery_method: data.delivery_method,
    notes: data.notes?.trim() || null,
    dietary_flags: data.dietary_flags && data.dietary_flags.length > 0 ? data.dietary_flags : null,
    status: 'pending',
    payment_method: data.payment_method,
    total_pence: totalPence,
    scheduled_for: data.scheduled_for || null,
    created_at: now,
    updated_at: now,
    items: orderItems,
    extras: orderExtras,
  };

  demoOrders.push(orderWithItems);
  return orderWithItems;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { resident_name, flat_number, mobile_number, address, delivery_method, notes, dietary_flags, payment_method, items, extras, scheduled_for } = body;

  // Read session (optional - guest ordering allowed)
  let userId: string | null = null;
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session?.user?.id) {
      userId = session.user.id;
    }
  } catch {
    // No session - guest order
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

  // Validate extras structure if provided
  if (extras && Array.isArray(extras)) {
    for (const extra of extras) {
      if (!extra.menu_item_id || typeof extra.quantity !== 'number' || extra.quantity < 1) {
        return NextResponse.json({ error: 'Invalid extra in order' }, { status: 400 });
      }
    }
  }

  // Validate dietary flags if provided
  const validatedDietaryFlags: DietaryFlag[] = [];
  if (dietary_flags && Array.isArray(dietary_flags)) {
    for (const flag of dietary_flags) {
      if (VALID_DIETARY_FLAGS.includes(flag)) {
        validatedDietaryFlags.push(flag);
      }
    }
  }

  // Demo mode - create order in memory (skip kitchen hours check for demo)
  if (await shouldUseDemoMode()) {
    // Verify all items exist in demo menu
    for (const item of items) {
      const menuItem = DEMO_MENU_ITEMS.get(item.menu_item_id);
      if (!menuItem) {
        return NextResponse.json({ error: `Menu item not found: ${item.menu_item_id}` }, { status: 400 });
      }
    }
    // Verify all extras exist in demo menu
    if (extras && Array.isArray(extras)) {
      for (const extra of extras) {
        const menuItem = DEMO_MENU_ITEMS.get(extra.menu_item_id);
        if (!menuItem) {
          return NextResponse.json({ error: `Extra item not found: ${extra.menu_item_id}` }, { status: 400 });
        }
      }
    }

    const order = createDemoOrder({
      resident_name,
      flat_number,
      mobile_number,
      address,
      delivery_method,
      notes,
      dietary_flags: validatedDietaryFlags,
      payment_method,
      items,
      extras,
      scheduled_for,
    });
    return NextResponse.json(order, { status: 201 });
  }

  try {
    // Check service hours (skip for scheduled orders)
    const isScheduledOrder = scheduled_for && new Date(scheduled_for) > new Date();
    if (!isScheduledOrder) {
      const kitchenStatus = await isKitchenOpen();
      if (!kitchenStatus.open) {
        return NextResponse.json(
          { error: kitchenStatus.message ?? 'The kitchen is currently closed' },
          { status: 403 }
        );
      }
    }

    // Look up menu item prices from DB
    const menuItemIds = items.map((i: { menu_item_id: string }) => i.menu_item_id);
    const menuItems = await queryInternalDatabase(
      'SELECT id, name, price_pence, available, prep_time_minutes FROM menu_items WHERE id = ANY($1)',
      [menuItemIds]
    ) as unknown as Array<{ id: string; name: string; price_pence: number; available: boolean; prep_time_minutes: number }>;

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
      `INSERT INTO orders (id, resident_name, flat_number, mobile_number, address, delivery_method, notes, dietary_flags, status, payment_method, total_pence, user_id, scheduled_for, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10, $11, NOW(), NOW())
       RETURNING id, resident_name, flat_number, mobile_number, address, delivery_method, notes, dietary_flags, status, payment_method, total_pence, user_id, scheduled_for, created_at, updated_at`,
      [
        resident_name.trim(),
        flat_number?.trim() || null,
        mobile_number?.trim() || null,
        address?.trim() || null,
        delivery_method,
        notes?.trim() || null,
        validatedDietaryFlags.length > 0 ? validatedDietaryFlags : null,
        payment_method,
        totalPence,
        userId,
        scheduled_for || null,
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
        `INSERT INTO order_items (id, order_id, menu_item_id, quantity, item_name, item_price_pence, item_prep_time_minutes)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
         RETURNING id, order_id, menu_item_id, quantity, item_name, item_price_pence, item_prep_time_minutes`,
        [order.id, item.menu_item_id, item.quantity, menuItem.name, menuItem.price_pence, menuItem.prep_time_minutes ?? 5]
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
    console.error('Failed to create order, switching to demo mode:', error);
    useDemoMode = true;
    
    // Retry in demo mode
    return POST(request);
  }
}
