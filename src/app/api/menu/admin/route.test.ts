import { GET, POST } from './route';

const mockQueryInternalDatabase = jest.fn();
jest.mock('@/server-lib/internal-db-query', () => ({
  queryInternalDatabase: (...args: unknown[]) => mockQueryInternalDatabase(...args),
}));

describe('GET /api/menu/admin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns all menu items ordered by sort_order', async () => {
    const mockItems = [
      { id: '1', name: 'Toast', price_pence: 100, category: 'Light', available: true, sort_order: 1 },
      { id: '2', name: 'Coffee', price_pence: 150, category: 'Drinks', available: false, sort_order: 2 },
    ];
    mockQueryInternalDatabase.mockResolvedValue(mockItems);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(mockItems);
    expect(mockQueryInternalDatabase).toHaveBeenCalledWith(
      'SELECT * FROM menu_items ORDER BY sort_order ASC'
    );
  });

  test('returns 500 on database error', async () => {
    mockQueryInternalDatabase.mockRejectedValue(new Error('DB error'));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Failed to fetch menu items');
  });
});

describe('POST /api/menu/admin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRequest(body: unknown): Request {
    return new Request('http://localhost/api/menu/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  test('creates a new menu item with valid data', async () => {
    const newItem = {
      id: 'new-id',
      name: 'Pancakes',
      description: 'Fluffy pancakes',
      price_pence: 350,
      category: 'Hot',
      image_url: null,
      available: true,
      sort_order: 5,
    };
    mockQueryInternalDatabase.mockResolvedValue([newItem]);

    const res = await POST(
      makeRequest({
        name: 'Pancakes',
        description: 'Fluffy pancakes',
        price_pence: 350,
        category: 'Hot',
        available: true,
        sort_order: 5,
      })
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.name).toBe('Pancakes');
  });

  test('returns 400 when name is missing', async () => {
    const res = await POST(
      makeRequest({ price_pence: 100, category: 'Hot' })
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Name is required');
  });

  test('returns 400 when name is empty string', async () => {
    const res = await POST(
      makeRequest({ name: '  ', price_pence: 100, category: 'Hot' })
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Name is required');
  });

  test('returns 400 when price_pence is 0', async () => {
    const res = await POST(
      makeRequest({ name: 'Test', price_pence: 0, category: 'Hot' })
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Price must be greater than 0');
  });

  test('returns 400 when price_pence is negative', async () => {
    const res = await POST(
      makeRequest({ name: 'Test', price_pence: -50, category: 'Hot' })
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Price must be greater than 0');
  });

  test('returns 400 for invalid category', async () => {
    const res = await POST(
      makeRequest({ name: 'Test', price_pence: 100, category: 'Dessert' })
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('Category must be one of');
  });

  test('defaults available to true and sort_order to 0', async () => {
    const newItem = {
      id: 'new-id',
      name: 'Test',
      description: null,
      price_pence: 100,
      category: 'Hot',
      image_url: null,
      available: true,
      sort_order: 0,
    };
    mockQueryInternalDatabase.mockResolvedValue([newItem]);

    await POST(
      makeRequest({ name: 'Test', price_pence: 100, category: 'Hot' })
    );

    expect(mockQueryInternalDatabase).toHaveBeenCalledWith(
      expect.any(String),
      ['Test', null, 100, 'Hot', null, true, 0]
    );
  });
});
