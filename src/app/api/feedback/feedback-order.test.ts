import { GET } from './[orderId]/route';

jest.mock('@/server-lib/internal-db-query', () => ({
  queryInternalDatabase: jest.fn(),
}));

import { queryInternalDatabase } from '@/server-lib/internal-db-query';

const mockQuery = queryInternalDatabase as jest.MockedFunction<typeof queryInternalDatabase>;

function makeGetRequest(orderId: string): [Request, { params: Promise<{ orderId: string }> }] {
  return [
    new Request(`http://localhost:3000/api/feedback/${orderId}`, { method: 'GET' }),
    { params: Promise.resolve({ orderId }) },
  ];
}

describe('GET /api/feedback/[orderId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns exists: true when feedback exists', async () => {
    const mockFeedback = {
      id: 'fb-1',
      order_id: 'order-1',
      rating: 4,
      comment: 'Good!',
      created_at: new Date().toISOString(),
    };

    mockQuery.mockResolvedValueOnce([mockFeedback] as never[]);

    const [request, context] = makeGetRequest('order-1');
    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.exists).toBe(true);
    expect(data.feedback.rating).toBe(4);
    expect(data.feedback.comment).toBe('Good!');
  });

  test('returns exists: false when no feedback', async () => {
    mockQuery.mockResolvedValueOnce([] as never[]);

    const [request, context] = makeGetRequest('order-2');
    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.exists).toBe(false);
    expect(data.feedback).toBeUndefined();
  });

  test('queries with correct order ID', async () => {
    mockQuery.mockResolvedValueOnce([] as never[]);

    const [request, context] = makeGetRequest('my-order-id');
    await GET(request, context);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE order_id = $1'),
      ['my-order-id']
    );
  });

  test('returns 500 on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const [request, context] = makeGetRequest('order-1');
    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to check feedback');
  });
});
