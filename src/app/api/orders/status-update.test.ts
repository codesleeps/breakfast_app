import { PATCH } from './[id]/status/route';

jest.mock('@/server-lib/internal-db-query', () => ({
  queryInternalDatabase: jest.fn(),
}));

import { queryInternalDatabase } from '@/server-lib/internal-db-query';

const mockQuery = queryInternalDatabase as jest.MockedFunction<typeof queryInternalDatabase>;

function makeRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/orders/test-id/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe('PATCH /api/orders/[id]/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('updates order status successfully', async () => {
    mockQuery.mockResolvedValue([{ id: 'test-id' }]);

    const response = await PATCH(makeRequest({ status: 'preparing' }), makeParams('test-id'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE orders SET status = $1'),
      ['preparing', 'test-id']
    );
  });

  test('rejects invalid status', async () => {
    const response = await PATCH(makeRequest({ status: 'flying' }), makeParams('test-id'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid status');
  });

  test('rejects missing status', async () => {
    const response = await PATCH(makeRequest({}), makeParams('test-id'));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid status');
  });

  test('returns 404 for non-existent order', async () => {
    mockQuery.mockResolvedValue([]);

    const response = await PATCH(makeRequest({ status: 'ready' }), makeParams('nonexistent'));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Order not found');
  });

  test('handles database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const response = await PATCH(makeRequest({ status: 'ready' }), makeParams('test-id'));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to update order status');
  });

  test.each(['pending', 'preparing', 'ready', 'delivered', 'cancelled'])(
    'accepts valid status: %s',
    async (status) => {
      mockQuery.mockResolvedValue([{ id: 'test-id' }]);

      const response = await PATCH(makeRequest({ status }), makeParams('test-id'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    }
  );
});
