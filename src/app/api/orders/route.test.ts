import { GET, POST } from './route';

jest.mock('@/server-lib/internal-db-query', () => ({
  queryInternalDatabase: jest.fn(),
}));

import { queryInternalDatabase } from '@/server-lib/internal-db-query';

const mockQuery = queryInternalDatabase as jest.MockedFunction<typeof queryInternalDatabase>;

// Mock settings that indicate kitchen is open (current day + current hour in range)
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const currentDay = DAY_NAMES[new Date().getDay()] ?? 'sunday';
const currentHour = new Date().getHours();

function mockKitchenOpen() {
  mockQuery.mockResolvedValueOnce([
    { key: 'service_days', value: JSON.stringify([currentDay]) },
    { key: 'service_start_hour', value: String(currentHour) },
    { key: 'service_end_hour', value: String(currentHour + 1) },
  ] as never[]);
}

function makeRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(url = 'http://localhost:3000/api/orders'): Request {
  return new Request(url, { method: 'GET' });
}

describe('GET /api/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns empty array when no orders today', async () => {
    mockQuery.mockResolvedValue([]);

    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  test('returns orders with items', async () => {
    const mockOrders = [
      {
        id: 'order-1',
        resident_name: 'John',
        flat_number: '12',
        delivery_method: 'delivery',
        notes: null,
        status: 'pending',
        payment_method: 'cash',
        total_pence: 430,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
    const mockItems = [
      {
        id: 'item-1',
        order_id: 'order-1',
        menu_item_id: 'menu-1',
        quantity: 1,
        item_name: 'Full English',
        item_price_pence: 350,
      },
      {
        id: 'item-2',
        order_id: 'order-1',
        menu_item_id: 'menu-2',
        quantity: 1,
        item_name: 'Tea',
        item_price_pence: 80,
      },
    ];

    mockQuery
      .mockResolvedValueOnce(mockOrders)
      .mockResolvedValueOnce(mockItems);

    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].items).toHaveLength(2);
    expect(data[0].resident_name).toBe('John');
  });

  test('filters by status when query param provided', async () => {
    mockQuery.mockResolvedValue([]);

    await GET(makeGetRequest('http://localhost:3000/api/orders?status=pending'));

    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('AND status = ANY($1)'),
      [['pending']]
    );
  });

  test('returns 500 on database error', async () => {
    mockQuery.mockRejectedValue(new Error('DB error'));

    const response = await GET(makeGetRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch orders');
  });
});

describe('POST /api/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validBody = {
    resident_name: 'Jane Doe',
    flat_number: '5A',
    delivery_method: 'delivery',
    payment_method: 'cash',
    items: [{ menu_item_id: 'menu-1', quantity: 2 }],
  };

  test('creates order successfully', async () => {
    mockKitchenOpen();
    const mockMenuItems = [
      { id: 'menu-1', name: 'Full English', price_pence: 350, available: true },
    ];
    const mockOrder = {
      id: 'new-order-id',
      resident_name: 'Jane Doe',
      flat_number: '5A',
      delivery_method: 'delivery',
      notes: null,
      status: 'pending',
      payment_method: 'cash',
      total_pence: 700,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const mockOrderItem = {
      id: 'oi-1',
      order_id: 'new-order-id',
      menu_item_id: 'menu-1',
      quantity: 2,
      item_name: 'Full English',
      item_price_pence: 350,
    };

    mockQuery
      .mockResolvedValueOnce(mockMenuItems as never[])   // menu item lookup
      .mockResolvedValueOnce([mockOrder] as never[])      // order insert
      .mockResolvedValueOnce([mockOrderItem] as never[]); // order item insert

    const response = await POST(makeRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.resident_name).toBe('Jane Doe');
    expect(data.total_pence).toBe(700);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].quantity).toBe(2);
  });

  test('rejects missing resident_name', async () => {
    mockKitchenOpen();
    const response = await POST(makeRequest({ ...validBody, resident_name: '' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Resident name is required');
  });

  test('rejects invalid delivery_method', async () => {
    mockKitchenOpen();
    const response = await POST(makeRequest({ ...validBody, delivery_method: 'drone' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid delivery method');
  });

  test('rejects invalid payment_method', async () => {
    mockKitchenOpen();
    const response = await POST(makeRequest({ ...validBody, payment_method: 'bitcoin' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid payment method');
  });

  test('rejects empty items array', async () => {
    mockKitchenOpen();
    const response = await POST(makeRequest({ ...validBody, items: [] }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('At least one item is required');
  });

  test('rejects items with invalid quantity', async () => {
    mockKitchenOpen();
    const response = await POST(
      makeRequest({ ...validBody, items: [{ menu_item_id: 'x', quantity: 0 }] })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid item in order');
  });

  test('rejects non-existent menu item', async () => {
    mockKitchenOpen();
    mockQuery.mockResolvedValueOnce([]); // no menu items found

    const response = await POST(makeRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Menu item not found');
  });

  test('rejects unavailable menu item', async () => {
    mockKitchenOpen();
    mockQuery.mockResolvedValueOnce([
      { id: 'menu-1', name: 'Full English', price_pence: 350, available: false },
    ] as never[]);

    const response = await POST(makeRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('not available');
  });

  test('returns 403 when kitchen is closed', async () => {
    // Mock settings showing kitchen closed (hour out of range)
    mockQuery.mockResolvedValueOnce([
      { key: 'service_days', value: JSON.stringify([currentDay]) },
      { key: 'service_start_hour', value: '3' },
      { key: 'service_end_hour', value: '4' },
    ] as never[]);

    const response = await POST(makeRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('kitchen is only open');
  });

  test('handles database error gracefully', async () => {
    mockKitchenOpen();
    mockQuery.mockRejectedValue(new Error('DB error'));

    const response = await POST(makeRequest(validBody));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create order');
  });
});