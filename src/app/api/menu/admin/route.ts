import { queryInternalDatabase } from '@/server-lib/internal-db-query';
import { NextResponse } from 'next/server';
import type { MenuItem } from '@/shared/models/breakfast';

const VALID_CATEGORIES = ['Hot', 'Light', 'Drinks'];

export async function GET() {
  try {
    const items = await queryInternalDatabase(
      'SELECT * FROM menu_items ORDER BY sort_order ASC'
    ) as unknown as MenuItem[];
    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to fetch admin menu items:', error);
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
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
