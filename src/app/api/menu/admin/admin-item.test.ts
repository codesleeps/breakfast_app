import { PATCH, DELETE } from './[id]/route';

const mockQueryInternalDatabase = jest.fn();
jest.mock('@/server-lib/internal-db-query', () => ({
  queryInternalDatabase: (...args: unknown[]) => mockQueryInternalDatabase(...args),
}));

function makeParams(id: string): Promise<{ id: string }> {
  return Promise.resolve({ id });
}

describe('PATCH /api/menu/admin/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRequest(body: unknown): Request {
    return new Request('http://localhost/api/menu/admin/test-id', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  test('updates a single field', async () => {
    const updatedItem = { id: 'test-id', name: 'Updated Toast', price_pence: 100 };
    mockQueryInternalDatabase.mockResolvedValue([updatedItem]);

    const res = await PATCH(
      makeRequest({ name: 'Updated Toast' }),
      { params: makeParams('test-id') }
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.name).toBe('Updated Toast');
    expect(mockQueryInternalDatabase).toHaveBeenCalledWith(
      'UPDATE menu_items SET name = $1 WHERE id = $2 RETURNING *',
      ['Updated Toast', 'test-id']
    );
  });

  test('updates multiple fields', async () => {
    const updatedItem = { id: 'test-id', name: 'Eggs', price_pence: 200, available: false };
    mockQueryInternalDatabase.mockResolvedValue([updatedItem]);

    const res = await PATCH(
      makeRequest({ name: 'Eggs', price_pence: 200, available: false }),
      { params: makeParams('test-id') }
    );

    expect(res.status).toBe(200);
    const callArgs = mockQueryInternalDatabase.mock.calls[0];
    expect(callArgs?.[0]).toContain('name = $1');
    expect(callArgs?.[0]).toContain('price_pence = ');
    expect(callArgs?.[0]).toContain('available = ');
  });

  test('returns 400 when no valid fields provided', async () => {
    const res = await PATCH(
      makeRequest({ unknown_field: 'value' }),
      { params: makeParams('test-id') }
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('No valid fields to update');
  });

  test('returns 400 when name is empty', async () => {
    const res = await PATCH(
      makeRequest({ name: '' }),
      { params: makeParams('test-id') }
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Name cannot be empty');
  });

  test('returns 400 when price_pence is 0', async () => {
    const res = await PATCH(
      makeRequest({ price_pence: 0 }),
      { params: makeParams('test-id') }
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Price must be greater than 0');
  });

  test('returns 400 for invalid category', async () => {
    const res = await PATCH(
      makeRequest({ category: 'Snacks' }),
      { params: makeParams('test-id') }
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('Category must be one of');
  });

  test('returns 404 when item not found', async () => {
    mockQueryInternalDatabase.mockResolvedValue([]);

    const res = await PATCH(
      makeRequest({ name: 'Test' }),
      { params: makeParams('nonexistent') }
    );
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Menu item not found');
  });

  test('toggles available field', async () => {
    const updatedItem = { id: 'test-id', available: false };
    mockQueryInternalDatabase.mockResolvedValue([updatedItem]);

    const res = await PATCH(
      makeRequest({ available: false }),
      { params: makeParams('test-id') }
    );

    expect(res.status).toBe(200);
    const callArgs = mockQueryInternalDatabase.mock.calls[0];
    expect(callArgs?.[0]).toContain('available = $1');
    expect(callArgs?.[1]).toEqual([false, 'test-id']);
  });
});

describe('DELETE /api/menu/admin/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deletes an existing item', async () => {
    mockQueryInternalDatabase.mockResolvedValue([{ id: 'test-id' }]);

    const req = new Request('http://localhost/api/menu/admin/test-id', { method: 'DELETE' });
    const res = await DELETE(req, { params: makeParams('test-id') });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockQueryInternalDatabase).toHaveBeenCalledWith(
      'DELETE FROM menu_items WHERE id = $1 RETURNING id',
      ['test-id']
    );
  });

  test('returns 404 when item not found', async () => {
    mockQueryInternalDatabase.mockResolvedValue([]);

    const req = new Request('http://localhost/api/menu/admin/nonexistent', { method: 'DELETE' });
    const res = await DELETE(req, { params: makeParams('nonexistent') });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Menu item not found');
  });

  test('returns 500 on database error', async () => {
    mockQueryInternalDatabase.mockRejectedValue(new Error('DB error'));

    const req = new Request('http://localhost/api/menu/admin/test-id', { method: 'DELETE' });
    const res = await DELETE(req, { params: makeParams('test-id') });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Failed to delete menu item');
  });
});
