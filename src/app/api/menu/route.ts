import { queryInternalDatabase } from '@/server-lib/internal-db-query';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const items = await queryInternalDatabase(
      'SELECT id, name, description, price_pence, category, image_url, available, sort_order FROM menu_items WHERE available = true ORDER BY sort_order ASC'
    );
    return NextResponse.json(items);
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }
}
