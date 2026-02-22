import { queryInternalDatabase } from '@/server-lib/internal-db-query';
import { NextResponse } from 'next/server';
import type { OrderFeedback, FeedbackStats } from '@/shared/models/breakfast';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, rating, comment } = body;

    // Validate required fields
    if (!order_id || typeof order_id !== 'string') {
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    // Check order exists
    const orderRows = await queryInternalDatabase(
      'SELECT id FROM orders WHERE id = $1',
      [order_id]
    ) as unknown as Array<{ id: string }>;

    if (orderRows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if feedback already exists for this order
    const existingRows = await queryInternalDatabase(
      'SELECT id FROM order_feedback WHERE order_id = $1',
      [order_id]
    ) as unknown as Array<{ id: string }>;

    if (existingRows.length > 0) {
      return NextResponse.json({ error: 'Feedback already submitted for this order' }, { status: 409 });
    }

    // Insert feedback
    const insertedRows = await queryInternalDatabase(
      `INSERT INTO order_feedback (id, order_id, rating, comment, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())
       RETURNING id, order_id, rating, comment, created_at`,
      [order_id, rating, (comment ?? '').toString().trim()]
    ) as unknown as OrderFeedback[];

    const feedback = insertedRows[0];
    if (!feedback) {
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
    }

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Total feedback count and average rating for today
    const summaryRows = await queryInternalDatabase(
      `SELECT COUNT(*)::int AS total_feedback, COALESCE(AVG(rating), 0)::float AS average_rating
       FROM order_feedback
       WHERE created_at >= CURRENT_DATE`
    ) as unknown as Array<{ total_feedback: number; average_rating: number }>;

    const summary = summaryRows[0] ?? { total_feedback: 0, average_rating: 0 };

    // Rating distribution
    const distRows = await queryInternalDatabase(
      `SELECT rating, COUNT(*)::int AS count
       FROM order_feedback
       WHERE created_at >= CURRENT_DATE
       GROUP BY rating
       ORDER BY rating`
    ) as unknown as Array<{ rating: number; count: number }>;

    const rating_distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of distRows) {
      rating_distribution[row.rating] = row.count;
    }

    // Recent feedback (last 20) joined with order info
    const recentRows = await queryInternalDatabase(
      `SELECT
         f.id, f.order_id, f.rating, f.comment, f.created_at,
         o.resident_name,
         COALESCE(
           STRING_AGG(oi.quantity || '× ' || oi.item_name, ', ' ORDER BY oi.item_name),
           ''
         ) AS items
       FROM order_feedback f
       JOIN orders o ON o.id = f.order_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE f.created_at >= CURRENT_DATE
       GROUP BY f.id, f.order_id, f.rating, f.comment, f.created_at, o.resident_name
       ORDER BY f.created_at DESC
       LIMIT 20`
    ) as unknown as Array<OrderFeedback & { resident_name: string; items: string }>;

    const stats: FeedbackStats = {
      total_feedback: summary.total_feedback,
      average_rating: Math.round(summary.average_rating * 10) / 10,
      rating_distribution,
      recent_feedback: recentRows,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch feedback stats:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback stats' }, { status: 500 });
  }
}
