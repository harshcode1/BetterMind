import { clearDb, closeDb, getDb } from './helpers/db';
import { createTestUser, makeRequest } from './helpers/http';

afterAll(closeDb);
beforeEach(clearDb);

describe('test tooling', () => {
  it('uses the in-memory database (never the real one)', async () => {
    expect(process.env.MONGODB_URI).toMatch(/^mongodb:\/\/127\.0\.0\.1:\d+\/bm_test_/);
    const db = await getDb();
    await db.collection('smoke').insertOne({ ok: true });
    expect(await db.collection('smoke').countDocuments()).toBe(1);
  });

  it('clears data between tests', async () => {
    const db = await getDb();
    expect(await db.collection('smoke').countDocuments()).toBe(0);
  });

  it('creates users with a usable JWT and builds requests with cookies', async () => {
    const { token, id } = await createTestUser({ role: 'admin' });
    const req = makeRequest('/api/x', { method: 'POST', json: { a: 1 }, cookies: { token } });
    expect(req.cookies.get('token').value).toBe(token);
    expect(await req.json()).toEqual({ a: 1 });
    expect(id).toHaveLength(24);
  });

  it('does not read a real AI key in tests', () => {
    expect(process.env.LLM_API_KEY).toBeUndefined();
    expect(process.env.OPENAI_API_KEY).toBeUndefined();
  });
});
