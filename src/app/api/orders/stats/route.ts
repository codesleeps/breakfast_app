import { queryInternalDatabase } from '@/server-lib/internal-db-query';
import { NextResponse } from 'next/server';
import type { OrderStats } from '@/shared/models/breakfast';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'today';
    
    // Calculate date filter based on range
    let dateFilter: string;
    switch (range) {
      case 'week':
        dateFilter = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'all':
        dateFilter = '1=1'; // No filter
        break;
      default: // 'today'
        dateFilter = 'created_at >= CURRENT_DATE';
    }

    // Total orders and revenue
    const summaryRows = await queryInternalDatabase(
      `SELECT COUNT(*)::int AS total_orders, COALESCE(SUM(total_pence), 0)::int AS total_revenue_pence
       FROM orders WHERE ${dateFilter}`
    ) as unknown as Array<{ total_orders: number; total_revenue_pence: number }>;

    const summary = summaryRows[0] ?? { total_orders: 0, total_revenue_pence: 0 };

    // Orders by status
    const statusRows = await queryInternalDatabase(
      `SELECT status, COUNT(*)::int AS count
       FROM orders WHERE ${dateFilter}
       GROUP BY status`
    ) as unknown as Array<{ status: string; count: number }>;

    const orders_by_status: Record<string, number> = {};
    for (const row of statusRows) {
      orders_by_status[row.status] = row.count;
    }

    // Orders by delivery method
    const deliveryRows = await queryInternalDatabase(
      `SELECT delivery_method, COUNT(*)::int AS count
       FROM orders WHERE ${dateFilter}
       GROUP BY delivery_method`
    ) as unknown as Array<{ delivery_method: string; count: number }>;

    const orders_by_delivery: Record<string, number> = {};
    for (const row of deliveryRows) {
      orders_by_delivery[row.delivery_method] = row.count;
    }

    // Orders by payment method
    const paymentRows = await queryInternalDatabase(
      `SELECT payment_method, COUNT(*)::int AS count
       FROM orders WHERE ${dateFilter}
       GROUP BY payment_method`
    ) as unknown as Array<{ payment_method: string; count: number }>;

    const orders_by_payment: Record<string, number> = {};
    for (const row of paymentRows) {
      orders_by_payment[row.payment_method] = row.count;
    }

    // Popular items (top 5)
    const popularRows = await queryInternalDatabase(
      `SELECT oi.item_name, SUM(oi.quantity)::int AS total_quantity
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE ${dateFilter.replace('created_at', 'o.created_at')}
       GROUP BY oi.item_name
       ORDER BY total_quantity DESC
       LIMIT 5`
    ) as unknown as Array<{ item_name: string; total_quantity: number }>;

    // Orders by hour
    const hourRows = await queryInternalDatabase(
      `SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*)::int AS count
       FROM orders WHERE ${dateFilter}
       GROUP BY hour
       ORDER BY hour`
    ) as unknown as Array<{ hour: number; count: number }>;

    // Daily trend data (for week/month views)
    let orders_by_day: Array<{ date: string; count: number; revenue: number }> = [];
    if (range === 'week' || range === 'month') {
      const dayRows = await queryInternalDatabase(
        `SELECT DATE(created_at) AS date, COUNT(*)::int AS count, COALESCE(SUM(total_pence), 0)::int AS revenue
         FROM orders WHERE ${dateFilter}
         GROUP BY DATE(created_at)
         ORDER BY date`
      ) as unknown as Array<{ date: string; count: number; revenue: number }>;
      orders_by_day = dayRows;
    }

    const stats: OrderStats & { orders_by_day?: Array<{ date: string; count: number; revenue: number }> } = {
      total_orders: summary.total_orders,
      total_revenue_pence: summary.total_revenue_pence,
      orders_by_status,
      orders_by_delivery,
      orders_by_payment,
      popular_items: popularRows,
      orders_by_hour: hourRows,
      orders_by_day,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch order stats:', error);
    return NextResponse.json({ error: 'Failed to fetch order stats' }, { status: 500 });
  }
}
