import { queryInternalDatabase } from '@/server-lib/internal-db-query';
import { NextResponse } from 'next/server';
import type { MenuItem } from '@/shared/models/breakfast';

const VALID_CATEGORIES = ['Hot', 'Light', 'Drinks'];

// Mock menu items for demo mode (same as in /api/menu/route.ts but includes all fields)
const MOCK_MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Full English Breakfast', description: 'Eggs, bacon, sausage, beans, toast, tomato, mushrooms', price_pence: 650, category: 'Hot', image_url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=200&h=200&fit=crop', available: true, sort_order: 1 },
  { id: '2', name: 'Scrambled Eggs on Toast', description: 'Fluffy scrambled eggs on toasted sourdough', price_pence: 400, category: 'Hot', image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=200&fit=crop', available: true, sort_order: 2 },
  { id: '3', name: 'Bacon Sandwich', description: 'Crispy bacon in a fresh bap', price_pence: 350, category: 'Hot', image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200&h=200&fit=crop', available: true, sort_order: 3 },
  { id: '4', name: 'Poached Eggs on Avocado Toast', description: 'Perfectly poached eggs on smashed avocado', price_pence: 550, category: 'Hot', image_url: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=200&h=200&fit=crop', available: true, sort_order: 4 },
  { id: '5', name: 'Toast with Jam', description: 'Thick cut toast with strawberry jam', price_pence: 150, category: 'Light', image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop', available: true, sort_order: 5 },
  { id: '6', name: 'Greek Yogurt Bowl', description: 'Creamy yogurt with honey, granola and fresh berries', price_pence: 350, category: 'Light', image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=200&fit=crop', available: true, sort_order: 6 },
  { id: '7', name: 'Fresh Fruit Salad', description: 'Seasonal fruits served with a mint drizzle', price_pence: 300, category: 'Light', image_url: 'https://images.unsplash.com/photo-1564093497595-593b96d80180?w=200&h=200&fit=crop', available: true, sort_order: 7 },
  { id: '8', name: 'Croissant', description: 'Buttery, flaky pastry freshly baked', price_pence: 250, category: 'Light', image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&h=200&fit=crop', available: true, sort_order: 8 },
  { id: '9', name: 'Filter Coffee', description: 'Rich, smooth house blend', price_pence: 200, category: 'Drinks', image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop', available: true, sort_order: 9 },
  { id: '10', name: 'Tea', description: 'English Breakfast tea with milk', price_pence: 150, category: 'Drinks', image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=200&h=200&fit=crop', available: true, sort_order: 10 },
  { id: '11', name: 'Orange Juice', description: 'Freshly squeezed orange juice', price_pence: 250, category: 'Drinks', image_url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=200&h=200&fit=crop', available: true, sort_order: 11 },
  { id: '12', name: 'Cappuccino', description: 'Espresso with steamed milk foam', price_pence: 300, category: 'Drinks', image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=200&h=200&fit=crop', available: true, sort_order: 12 },
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
    const { name, description, price_pence, category, image_url, available, sort_order } = body;

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
      `INSERT INTO menu_items (id, name, description, price_pence, category, image_url, available, sort_order, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [
        name.trim(),
        description?.trim() || null,
        Math.round(price_pence),
        category,
        image_url?.trim() || null,
        available ?? true,
        sort_order ?? 0,
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
