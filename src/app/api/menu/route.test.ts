import { GET } from './route';

jest.mock('@/server-lib/internal-db-query', () => ({
  queryInternalDatabase: jest.fn(),
}));

import { queryInternalDatabase } from '@/server-lib/internal-db-query';

const mockQuery = queryInternalDatabase as jest.MockedFunction<typeof queryInternalDatabase>;

describe('GET /api/menu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns available menu items sorted by sort_order', async () => {
    const mockItems = [
      { id: '1', name: 'Full English', description: 'Eggs, bacon', price_pence: 350, category: 'Hot', image_url: null, available: true, sort_order: 1 },
      { id: '2', name: 'Tea', description: 'Builders brew', price_pence: 80, category: 'Drinks', image_url: null, available: true, sort_order: 10 },
    ];
    mockQuery.mockResolvedValue(mockItems);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockItems);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE available = true ORDER BY sort_order ASC')
    );
  });

  test('returns empty array when no items available', async () => {
    mockQuery.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  test('returns 500 on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB connection failed'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch menu items');
  });
});
