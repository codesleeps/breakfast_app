import { queryInternalDatabase } from '@/server-lib/internal-db-query';
import { NextResponse } from 'next/server';
import type { MenuItem } from '@/shared/models/breakfast';

const VALID_CATEGORIES = ['Hot', 'Light', 'Drinks'];

const ALLOWED_FIELDS: Record<string, string> = {
  name: 'text',
  description: 'text',
  price_pence: 'number',
  category: 'text',
  image_url: 'text',
  available: 'boolean',
  sort_order: 'number',
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Build dynamic update
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    for (const [key, expectedType] of Object.entries(ALLOWED_FIELDS)) {
      if (key in body) {
        const value = body[key];

        // Validate specific fields
        if (key === 'name' && (!value || typeof value !== 'string' || value.trim().length === 0)) {
          return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
        }
        if (key === 'price_pence' && (typeof value !== 'number' || value <= 0)) {
          return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 });
        }
        if (key === 'category' && !VALID_CATEGORIES.includes(value)) {
          return NextResponse.json(
            { error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` },
            { status: 400 }
          );
        }

        let processedValue = value;
        if (expectedType === 'text' && typeof value === 'string') {
          processedValue = value.trim() || null;
        }
        if (key === 'price_pence' && typeof value === 'number') {
          processedValue = Math.round(value);
        }

        setClauses.push(`${key} = $${paramIndex}`);
        values.push(processedValue);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    values.push(id);
    const query = `UPDATE menu_items SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const rows = await queryInternalDatabase(query, values as string[]) as unknown as MenuItem[];

    const item = rows[0];
    if (!item) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Failed to update menu item:', error);
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rows = await queryInternalDatabase(
      'DELETE FROM menu_items WHERE id = $1 RETURNING id',
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete menu item:', error);
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 });
  }
}
