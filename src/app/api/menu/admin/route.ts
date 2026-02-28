import { queryInternalDatabase } from '@/server-lib/internal-db-query';
import { NextResponse } from 'next/server';
import type { MenuItem } from '@/shared/models/breakfast';

const VALID_CATEGORIES = ['Hot', 'Light', 'Drinks', 'Extras'];

// Mock menu items for demo mode (same as in /api/menu/route.ts but includes all fields)
const MOCK_MENU_ITEMS: MenuItem[] = [
  // Main dishes - Hot
  { id: '1', name: 'Kitchen Special', description: '2 x fried eggs, 4 x fish fingers, baked beans, fried plantains and 3 x fried dumplings', price_pence: 650, category: 'Hot', image_url: '/kitchen_special.jpg', available: true, sort_order: 1, is_extra: false, prep_time_minutes: 12 },
  { id: '2', name: 'Scrambled Eggs with Flatbread', description: 'Fluffy scrambled eggs served with homemade flatbread', price_pence: 400, category: 'Hot', image_url: '/open_flatbread.jpg', available: true, sort_order: 2, is_extra: false, prep_time_minutes: 8 },
  { id: '3', name: 'Bacon Sandwich', description: 'Crispy bacon in a fresh bap', price_pence: 350, category: 'Hot', image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200&h=200&fit=crop', available: true, sort_order: 3, is_extra: false, prep_time_minutes: 6 },
  { id: '4', name: 'Poached Eggs with Flatbread', description: 'Perfectly poached eggs served with homemade flatbread', price_pence: 450, category: 'Hot', image_url: '/quarter_flatbread.jpg', available: true, sort_order: 4, is_extra: false, prep_time_minutes: 10 },
  // Main dishes - Light
  { id: '5', name: 'Spicy Flatbread', description: 'Homemade flatbread filled with spicy ground chicken, onions and peppers', price_pence: 350, category: 'Light', image_url: '/Flatbread.webp', available: true, sort_order: 5, is_extra: false, prep_time_minutes: 8 },
  { id: '6', name: 'Greek Yogurt Bowl', description: 'Creamy yogurt with honey, granola and fresh berries', price_pence: 350, category: 'Light', image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=200&fit=crop', available: true, sort_order: 6, is_extra: false, prep_time_minutes: 3 },
  { id: '7', name: 'Fresh Fruit Salad', description: 'Seasonal fruits served with a mint drizzle', price_pence: 300, category: 'Light', image_url: 'https://images.unsplash.com/photo-1564093497595-593b96d80180?w=200&h=200&fit=crop', available: true, sort_order: 7, is_extra: false, prep_time_minutes: 4 },
  { id: '8', name: 'Croissant', description: 'Buttery, flaky pastry freshly baked', price_pence: 250, category: 'Light', image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&h=200&fit=crop', available: true, sort_order: 8, is_extra: false, prep_time_minutes: 2 },
  // Drinks
  { id: '9', name: 'Filter Coffee', description: 'Rich, smooth house blend', price_pence: 200, category: 'Drinks', image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop', available: true, sort_order: 9, is_extra: false, prep_time_minutes: 2 },
  { id: '10', name: 'Tea', description: 'English Breakfast tea with milk', price_pence: 150, category: 'Drinks', image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop', available: true, sort_order: 10, is_extra: false, prep_time_minutes: 2 },
  { id: '11', name: 'Orange Juice', description: 'Freshly squeezed orange juice', price_pence: 250, category: 'Drinks', image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=200&fit=crop', available: true, sort_order: 11, is_extra: false, prep_time_minutes: 1 },
  { id: '12', name: 'Cappuccino', description: 'Espresso with steamed milk foam', price_pence: 300, category: 'Drinks', image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=200&h=200&fit=crop', available: true, sort_order: 12, is_extra: false, prep_time_minutes: 3 },
  // Extras
  { id: 'ex1', name: 'Extra Fried Egg', description: 'Single fried egg', price_pence: 50, category: 'Extras', image_url: '/eggs_boiled_fried_scrambled_poached.jpg', available: true, sort_order: 101, is_extra: true, prep_time_minutes: 2 },
  { id: 'ex2', name: 'Extra Scrambled Egg', description: 'Portion of scrambled eggs', price_pence: 75, category: 'Extras', image_url: '/eggs_boiled_fried_scrambled_poached.jpg', available: true, sort_order: 102, is_extra: true, prep_time_minutes: 3 },
  { id: 'ex3', name: 'Extra Mushrooms', description: 'Sautéed mushrooms', price_pence: 50, category: 'Extras', image_url: null, available: true, sort_order: 103, is_extra: true, prep_time_minutes: 3 },
  { id: 'ex4', name: 'Extra Tomatoes', description: 'Grilled tomatoes', price_pence: 50, category: 'Extras', image_url: null, available: true, sort_order: 104, is_extra: true, prep_time_minutes: 3 },
  { id: 'ex5', name: 'Extra Cheese', description: 'Cheddar cheese', price_pence: 50, category: 'Extras', image_url: null, available: true, sort_order: 105, is_extra: true, prep_time_minutes: 1 },
  { id: 'ex6', name: 'Extra Fish Fingers', description: '2 x fish fingers', price_pence: 100, category: 'Extras', image_url: '/fish_fingers.png', available: true, sort_order: 106, is_extra: true, prep_time_minutes: 5 },
  { id: 'ex7', name: 'Extra Fried Dumplings', description: '2 x fried dumplings', price_pence: 100, category: 'Extras', image_url: '/fried_dumplings.jpg', available: true, sort_order: 107, is_extra: true, prep_time_minutes: 5 },
  { id: 'ex8', name: 'Extra Plantains', description: 'Fried plantains', price_pence: 75, category: 'Extras', image_url: '/fried_plantains.png', available: true, sort_order: 108, is_extra: true, prep_time_minutes: 4 },
  { id: 'ex9', name: 'Extra Baked Beans', description: 'Portion of baked beans', price_pence: 50, category: 'Extras', image_url: null, available: true, sort_order: 109, is_extra: true, prep_time_minutes: 2 },
];

export async function GET() {
  try {
    const items = await queryInternalDatabase(
      'SELECT * FROM menu_items ORDER BY sort_order ASC'
    ) as unknown as MenuItem[];
    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to fetch admin menu items, using mock data:', error);
    // Return mock data when database is not available
    return NextResponse.json(MOCK_MENU_ITEMS);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, price_pence, category, image_url, available, sort_order, prep_time_minutes } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (typeof price_pence !== 'number' || price_pence <= 0) {
      return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 });
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    const rows = await queryInternalDatabase(
      `INSERT INTO menu_items (id, name, description, price_pence, category, image_url, available, sort_order, prep_time_minutes)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        name.trim(),
        description?.trim() || null,
        Math.round(price_pence),
        category,
        image_url?.trim() || null,
        available ?? true,
        sort_order ?? 0,
        prep_time_minutes ?? 5,
      ]
    ) as unknown as MenuItem[];

    const item = rows[0];
    if (!item) {
      return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Failed to create menu item:', error);
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
  }
}
