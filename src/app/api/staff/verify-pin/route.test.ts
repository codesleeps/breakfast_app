import { POST } from './route';

describe('POST /api/staff/verify-pin', () => {
  function makeRequest(body: unknown): Request {
    return new Request('http://localhost/api/staff/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  test('returns success for correct PIN', async () => {
    const res = await POST(makeRequest({ pin: '2024' }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  test('returns 401 for incorrect PIN', async () => {
    const res = await POST(makeRequest({ pin: '1234' }));
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid PIN');
  });

  test('returns 400 when PIN is missing', async () => {
    const res = await POST(makeRequest({}));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('PIN is required');
  });

  test('returns 400 when PIN is not a string', async () => {
    const res = await POST(makeRequest({ pin: 2024 }));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
  });

  test('returns 401 for empty string PIN', async () => {
    const res = await POST(makeRequest({ pin: '' }));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
  });

  test('returns 401 for partial PIN', async () => {
    const res = await POST(makeRequest({ pin: '20' }));
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  test('returns 401 for PIN with extra digits', async () => {
    const res = await POST(makeRequest({ pin: '20240' }));
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });
});
