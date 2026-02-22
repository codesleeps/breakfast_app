import { GET, POST } from './route';

jest.mock('@/server-lib/internal-db-query', () => ({
  queryInternalDatabase: jest.fn(),
}));

import { queryInternalDatabase } from '@/server-lib/internal-db-query';

const mockQuery = queryInternalDatabase as jest.MockedFunction<typeof queryInternalDatabase>;

function makePostRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(): Request {
  return new Request('http://localhost:3000/api/feedback', { method: 'GET' });
}

describe('POST /api/feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('submits feedback successfully', async () => {
    const mockFeedback = {
      id: 'fb-1',
      order_id: 'order-1',
      rating: 5,
      comment: 'Great breakfast!',
      created_at: new Date().toISOString(),
    };

    mockQuery
      .mockResolvedValueOnce([{ id: 'order-1' }] as never[]) // order exists
      .mockResolvedValueOnce([] as never[])                    // no existing feedback
      .mockResolvedValueOnce([mockFeedback] as never[]);       // insert

    const response = await POST(makePostRequest({
      order_id: 'order-1',
      rating: 5,
      comment: 'Great breakfast!',
    }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.rating).toBe(5);
    expect(data.comment).toBe('Great breakfast!');
  });

  test('rejects missing order_id', async () => {
    const response = await POST(makePostRequest({ rating: 5 }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('order_id is required');
  });

  test('rejects non-string order_id', async () => {
    const response = await POST(makePostRequest({ order_id: 123, rating: 5 }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('order_id is required');
  });

  test('rejects rating below 1', async () => {
    const response = await POST(makePostRequest({ order_id: 'order-1', rating: 0 }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Rating must be an integer between 1 and 5');
  });

  test('rejects rating above 5', async () => {
    const response = await POST(makePostRequest({ order_id: 'order-1', rating: 6 }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Rating must be an integer between 1 and 5');
  });

  test('rejects non-integer rating', async () => {
    const response = await POST(makePostRequest({ order_id: 'order-1', rating: 3.5 }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Rating must be an integer between 1 and 5');
  });

  test('rejects missing rating', async () => {
    const response = await POST(makePostRequest({ order_id: 'order-1' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Rating must be an integer between 1 and 5');
  });

  test('returns 404 when order does not exist', async () => {
    mockQuery.mockResolvedValueOnce([] as never[]); // no order found

    const response = await POST(makePostRequest({ order_id: 'nonexistent', rating: 4 }));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Order not found');
  });

  test('returns 409 when feedback already exists', async () => {
    mockQuery
      .mockResolvedValueOnce([{ id: 'order-1' }] as never[]) // order exists
      .mockResolvedValueOnce([{ id: 'fb-existing' }] as never[]); // feedback exists

    const response = await POST(makePostRequest({ order_id: 'order-1', rating: 4 }));
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Feedback already submitted for this order');
  });

  test('handles empty comment gracefully', async () => {
    const mockFeedback = {
      id: 'fb-2',
      order_id: 'order-1',
      rating: 3,
      comment: '',
      created_at: new Date().toISOString(),
    };

    mockQuery
      .mockResolvedValueOnce([{ id: 'order-1' }] as never[])
      .mockResolvedValueOnce([] as never[])
      .mockResolvedValueOnce([mockFeedback] as never[]);

    const response = await POST(makePostRequest({ order_id: 'order-1', rating: 3 }));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.comment).toBe('');
  });

  test('returns 500 on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const response = await POST(makePostRequest({ order_id: 'order-1', rating: 4 }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to submit feedback');
  });

  test('returns 500 when insert returns no rows', async () => {
    mockQuery
      .mockResolvedValueOnce([{ id: 'order-1' }] as never[])
      .mockResolvedValueOnce([] as never[])
      .mockResolvedValueOnce([] as never[]); // insert returns nothing

    const response = await POST(makePostRequest({ order_id: 'order-1', rating: 4 }));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to submit feedback');
  });
});

describe('GET /api/feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns feedback stats successfully', async () => {
    mockQuery
      .mockResolvedValueOnce([{ total_feedback: 10, average_rating: 4.2 }] as never[]) // summary
      .mockResolvedValueOnce([                                                          // distribution
        { rating: 1, count: 1 },
        { rating: 3, count: 2 },
        { rating: 4, count: 3 },
        { rating: 5, count: 4 },
      ] as never[])
      .mockResolvedValueOnce([                                                          // recent
        {
          id: 'fb-1',
          order_id: 'order-1',
          rating: 5,
          comment: 'Lovely!',
          created_at: new Date().toISOString(),
          resident_name: 'Alice',
          items: '1× Full English, 1× Tea',
        },
      ] as never[]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.total_feedback).toBe(10);
    expect(data.average_rating).toBe(4.2);
    expect(data.rating_distribution).toEqual({ 1: 1, 2: 0, 3: 2, 4: 3, 5: 4 });
    expect(data.recent_feedback).toHaveLength(1);
    expect(data.recent_feedback[0].resident_name).toBe('Alice');
  });

  test('returns empty stats when no feedback', async () => {
    mockQuery
      .mockResolvedValueOnce([{ total_feedback: 0, average_rating: 0 }] as never[])
      .mockResolvedValueOnce([] as never[])
      .mockResolvedValueOnce([] as never[]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.total_feedback).toBe(0);
    expect(data.average_rating).toBe(0);
    expect(data.rating_distribution).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    expect(data.recent_feedback).toEqual([]);
  });

  test('handles missing summary row gracefully', async () => {
    mockQuery
      .mockResolvedValueOnce([] as never[]) // no summary row
      .mockResolvedValueOnce([] as never[])
      .mockResolvedValueOnce([] as never[]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.total_feedback).toBe(0);
    expect(data.average_rating).toBe(0);
  });

  test('returns 500 on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch feedback stats');
  });
});
