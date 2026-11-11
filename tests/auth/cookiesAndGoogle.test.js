import { POST as registerPost } from '../../src/app/api/auth/register/route';
import { POST as registerDoctorPost } from '../../src/app/api/auth/register/doctor/route';
import { POST as loginPost } from '../../src/app/api/auth/login/route';
import { GET as googleStart } from '../../src/app/api/auth/google/route';
import { GET as googleCallback } from '../../src/app/api/auth/google/callback/route';
import { getTokens } from '../../src/app/lib/googleCalendar';
import { clearDb, closeDb, getDb } from '../helpers/db';
import { createTestUser, makeRequest } from '../helpers/http';

jest.mock('next/headers', () => require('../helpers/headersMock'));
// Never talk to Google: only the token exchange is mocked, everything else is the real library.
jest.mock('../../src/app/lib/googleCalendar', () => ({
  ...jest.requireActual('../../src/app/lib/googleCalendar'),
  getTokens: jest.fn(),
}));

let ipCounter = 0;
const ip = () => ({ 'x-forwarded-for': `198.18.0.${(ipCounter += 1)}` });
let errorSpy;
beforeEach(async () => {
  await clearDb();
  getTokens.mockReset();
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  errorSpy.mockRestore();
  console.log.mockRestore();
});
afterAll(closeDb);

function expectSessionCookieFlags(res) {
  const cookie = res.cookies.get('token');
  expect(cookie.value).toBeTruthy();
  expect(cookie.httpOnly).toBe(true);
  expect(cookie.secure).toBe(true);
  expect(cookie.sameSite).toBe('strict');
  expect(cookie.path).toBe('/');
  expect(cookie.maxAge).toBe(60 * 60 * 24 * 7);
}

describe('session cookie flags are the same on login, register and register/doctor', () => {
  it('login', async () => {
    const u = await createTestUser();
    expectSessionCookieFlags(await loginPost(makeRequest('/api/auth/login', {
      method: 'POST', json: { email: u.user.email, password: u.password }, headers: ip(),
    })));
  });

  it('register (patient)', async () => {
    const res = await registerPost(makeRequest('/api/auth/register', {
      method: 'POST', json: { name: 'New Patient', email: 'new-patient@example.com', password: 'Password123!' }, headers: ip(),
    }));
    expect(res.status).toBe(200);
    expectSessionCookieFlags(res);
  });

  it('register/doctor', async () => {
    const res = await registerDoctorPost(makeRequest('/api/auth/register/doctor', {
      method: 'POST', headers: ip(),
      json: { name: 'Dr New', email: 'new-doctor@example.com', password: 'Password123!', specialty: 'Psychiatrist', credentials: 'MD', licenseNumber: 'LIC-1', phone: '123' },
    }));
    expect(res.status).toBe(200);
    expectSessionCookieFlags(res);
  });
});

describe('GET /api/auth/google (start OAuth)', () => {
  it('a logged-in user is sent to Google, not bounced to /login', async () => {
    const u = await createTestUser();
    const res = await googleStart(makeRequest('/api/auth/google?redirect=/appointments', { cookies: { token: u.token } }));
    expect([302, 307]).toContain(res.status);
    const location = new URL(res.headers.get('location'));
    expect(location.origin).toBe('https://accounts.google.com');
    expect(location.searchParams.get('client_id')).toBe('test-google-client-id');

    const db = await getDb();
    const state = await db.collection('oauthState').findOne({});
    expect(String(state.userId)).toBe(u.id);
    expect(state.redirectAfterAuth).toBe('/appointments');
  });

  it('a visitor without a session is sent to /login and nothing is stored', async () => {
    const res = await googleStart(makeRequest('/api/auth/google'));
    const location = new URL(res.headers.get('location'));
    expect(location.pathname).toBe('/login');
    expect(await (await getDb()).collection('oauthState').countDocuments()).toBe(0);
  });
});

describe('GET /api/auth/google/callback', () => {
  it('a logged-in user: tokens are stored, state is cleaned up, user is redirected back', async () => {
    const u = await createTestUser();
    const db = await getDb();
    await db.collection('oauthState').insertOne({ userId: u.id, redirectAfterAuth: '/appointments/new', createdAt: new Date() });
    getTokens.mockResolvedValue({ access_token: 'access-1', refresh_token: 'refresh-1', expires_in: 3600 });

    const res = await googleCallback(makeRequest('/api/auth/google/callback?code=abc', { cookies: { token: u.token } }));

    expect(getTokens).toHaveBeenCalledWith('abc');
    expect(new URL(res.headers.get('location')).pathname).toBe('/appointments/new');
    const stored = await db.collection('googleTokens').findOne({});
    expect(String(stored.userId)).toBe(u.id);
    expect(stored.accessToken).toBe('access-1');
    expect(await db.collection('oauthState').countDocuments()).toBe(0);
  });

  it('a visitor without a session: no token exchange, nothing stored, redirected to /login', async () => {
    const res = await googleCallback(makeRequest('/api/auth/google/callback?code=abc'));
    expect(new URL(res.headers.get('location')).pathname).toBe('/login');
    expect(getTokens).not.toHaveBeenCalled();
    expect(await (await getDb()).collection('googleTokens').countDocuments()).toBe(0);
  });

  it('a logged-in user without a code gets 400', async () => {
    const u = await createTestUser();
    const res = await googleCallback(makeRequest('/api/auth/google/callback', { cookies: { token: u.token } }));
    expect(res.status).toBe(400);
  });

  it('a failed token exchange stores nothing', async () => {
    const u = await createTestUser();
    getTokens.mockResolvedValue({});
    const res = await googleCallback(makeRequest('/api/auth/google/callback?code=abc', { cookies: { token: u.token } }));
    expect(res.status).toBe(500);
    expect(await (await getDb()).collection('googleTokens').countDocuments()).toBe(0);
  });
});
