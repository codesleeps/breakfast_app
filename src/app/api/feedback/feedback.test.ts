import { NextResponse } from 'next/server';

const mockQueryInternalDatabase = jest.fn();
jest.mock('@/server-lib/internal-db-query', () => ({
  queryInternalDatabase: (...args: unknown[]) => mockQueryInternalDatabase(...args),
}));

import { POST, GET } from './route';

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('submits feedback successfully', async () => {
    mockQueryInternalDatabase
      .mockResolvedValueOnce([{ id: 'order-1' }]) // order exists
      .mockResolvedValueOnce([]) // no existing feedback
      .mockResolvedValueOnce([{ id: 'fb-1', order_id: 'order-1', rating: 5, comment: 'Great!', created_at: '2026-02-22T10:00:00Z' }]);

    const response = await POST(makeRequest({ order_id: 'order-1', rating: 5, comment: 'Great!' }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.rating).toBe(5);
    expect(data.comment).toBe('Great!');
  });

  test('rejects missing order_id', async () => {
    const response = await POST(makeRequest({ rating: 5 }));
    expect(response.status).toBe(400);
  });

  test('rejects invalid rating (0)', async () => {
    const response = await POST(makeRequest({ order_id: 'order-1', rating: 0 }));
    expect(response.status).toBe(400);
  });

  test('rejects invalid rating (6)', async () => {
    const response = await POST(makeRequest({ order_id: 'order-1', rating: 6 }));
    expect(response.status).toBe(400);
  });

  test('rejects non-integer rating', async () => {
    const response = await POST(makeRequest({ order_id: 'order-1', rating: 3.5 }));
    expect(response.status).toBe(400);
  });

  test('returns 404 when order not found', async () => {
    mockQueryInternalDatabase.mockResolvedValueOnce([]); // order not found

    const response = await POST(makeRequest({ order_id: 'nonexistent', rating: 4 }));
    expect(response.status).toBe(404);
  });

  test('returns 409 when feedback already exists', async () => {
    mockQueryInternalDatabase
      .mockResolvedValueOnce([{ id: 'order-1' }]) // order exists
      .mockResolvedValueOnce([{ id: 'existing-fb' }]); // feedback already exists

    const response = await POST(makeRequest({ order_id: 'order-1', rating: 3 }));
    expect(response.status).toBe(409);
  });

  test('submits feedback without comment', async () => {
    mockQueryInternalDatabase
      .mockResolvedValueOnce([{ id: 'order-1' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'fb-2', order_id: 'order-1', rating: 4, comment: '', created_at: '2026-02-22T10:00:00Z' }]);

    const response = await POST(makeRequest({ order_id: 'order-1', rating: 4 }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.comment).toBe('');
  });

  test('handles database error gracefully', async () => {
    mockQueryInternalDatabase.mockRejectedValueOnce(new Error('DB error'));

    const response = await POST(makeRequest({ order_id: 'order-1', rating: 5 }));
    expect(response.status).toBe(500);
  });
});

describe('GET /api/feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns feedback stats', async () => {
    mockQueryInternalDatabase
      .mockResolvedValueOnce([{ total_feedback: 10, average_rating: 4.2 }])
      .mockResolvedValueOnce([
        { rating: 5, count: 5 },
        { rating: 4, count: 3 },
        { rating: 3, count: 2 },
      ])
      .mockResolvedValueOnce([
        { id: 'fb-1', order_id: 'o-1', rating: 5, comment: 'Lovely', created_at: '2026-02-22T10:00:00Z', resident_name: 'Jane', items: '1× Full English' },
      ]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.total_feedback).toBe(10);
    expect(data.average_rating).toBe(4.2);
    expect(data.rating_distribution[5]).toBe(5);
    expect(data.rating_distribution[4]).toBe(3);
    expect(data.rating_distribution[1]).toBe(0);
    expect(data.recent_feedback).toHaveLength(1);
  });

  test('returns empty stats when no feedback', async () => {
    mockQueryInternalDatabase
      .mockResolvedValueOnce([{ total_feedback: 0, average_rating: 0 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const response = await GET();
    const data = await response.json();

    expect(data.total_feedback).toBe(0);
    expect(data.average_rating).toBe(0);
    expect(data.recent_feedback).toHaveLength(0);
  });

  test('handles database error gracefully', async () => {
    mockQueryInternalDatabase.mockRejectedValueOnce(new Error('DB error'));

    const response = await GET();
    expect(response.status).toBe(500);
  });
});
