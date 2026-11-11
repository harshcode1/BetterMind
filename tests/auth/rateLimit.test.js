import { POST as loginPost } from '../../src/app/api/auth/login/route';
import { POST as verifyPost } from '../../src/app/api/auth/2fa/verify/route';
import { GET as setupGet, POST as setupPost } from '../../src/app/api/auth/2fa/setup/route';
import { POST as disablePost } from '../../src/app/api/auth/2fa/disable/route';
import { signPendingToken, PENDING_COOKIE } from '../../src/app/lib/twoFactorPending';
import { clearDb, closeDb } from '../helpers/db';
import { createTestUser, makeRequest } from '../helpers/http';
import { createUserWith2FA, totpNow, wrongCodeFor } from '../helpers/twofa';

let ipCounter = 0;
const freshIp = () => `198.51.100.${(ipCounter += 1)}`;
let emailCounter = 0;
const freshEmail = () => `ratelimit-${(emailCounter += 1)}@example.com`;

let errorSpy;
let nowSpy;
beforeEach(async () => {
  await clearDb();
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  errorSpy.mockRestore();
  nowSpy?.mockRestore();
  nowSpy = null;
});
afterAll(closeDb);

const login = (email, password, ip) =>
  loginPost(makeRequest('/api/auth/login', { method: 'POST', json: { email, password }, headers: { 'x-forwarded-for': ip } }));
const verify = (code, userId, ip) =>
  verifyPost(makeRequest('/api/auth/2fa/verify', {
    method: 'POST', json: { code }, cookies: { [PENDING_COOKIE]: signPendingToken(userId) }, headers: { 'x-forwarded-for': ip },
  }));

describe('login rate limit (shared factory: 5 / account and 20 / IP per 15 min)', () => {
  it('the 6th wrong password for one account gets 429 with Retry-After, even from a new IP', async () => {
    const u = await createTestUser({ email: freshEmail() });
    for (let i = 0; i < 5; i++) {
      expect((await login(u.user.email, 'wrong-password', freshIp())).status).toBe(401);
    }
    const sixth = await login(u.user.email, 'wrong-password', freshIp());
    expect(sixth.status).toBe(429);
    expect(Number(sixth.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(sixth.cookies.get('token')).toBeUndefined();
  });

  it('while an account is locked even the correct password is refused', async () => {
    const u = await createTestUser({ email: freshEmail() });
    for (let i = 0; i < 5; i++) await login(u.user.email, 'wrong-password', freshIp());
    const res = await login(u.user.email, u.password, freshIp());
    expect(res.status).toBe(429);
    expect(res.cookies.get('token')).toBeUndefined();
  });

  it('the account key is case-insensitive', async () => {
    const u = await createTestUser({ email: freshEmail() });
    for (let i = 0; i < 5; i++) await login(i % 2 ? u.user.email.toUpperCase() : u.user.email, 'wrong', freshIp());
    expect((await login(u.user.email, 'wrong', freshIp())).status).toBe(429);
  });

  it('a successful login resets the account counter (but not the IP counter)', async () => {
    const u = await createTestUser({ email: freshEmail() });
    const ip = freshIp();
    for (let i = 0; i < 4; i++) await login(u.user.email, 'wrong-password', ip);
    expect((await login(u.user.email, u.password, ip)).status).toBe(200);
    for (let i = 0; i < 5; i++) expect((await login(u.user.email, 'wrong-password', ip)).status).toBe(401);
    expect((await login(u.user.email, 'wrong-password', ip)).status).toBe(429);
  });

  it('the 21st request from one IP gets 429 even across different accounts; other IPs are unaffected', async () => {
    const ip = freshIp();
    for (let i = 0; i < 20; i++) {
      expect((await login(freshEmail(), 'wrong-password', ip)).status).toBe(401);
    }
    expect((await login(freshEmail(), 'wrong-password', ip)).status).toBe(429);
    expect((await login(freshEmail(), 'wrong-password', freshIp())).status).toBe(401);
  });

  it('one account being locked does not affect other accounts', async () => {
    const a = await createTestUser({ email: freshEmail() });
    const b = await createTestUser({ email: freshEmail() });
    for (let i = 0; i < 6; i++) await login(a.user.email, 'wrong', freshIp());
    expect((await login(b.user.email, b.password, freshIp())).status).toBe(200);
  });

  it('the limit resets after the 15-minute window', async () => {
    const u = await createTestUser({ email: freshEmail() });
    const base = Date.now();
    for (let i = 0; i < 6; i++) await login(u.user.email, 'wrong', freshIp());
    expect((await login(u.user.email, u.password, freshIp())).status).toBe(429);

    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(base + 15 * 60 * 1000 + 5000);
    expect((await login(u.user.email, u.password, freshIp())).status).toBe(200);
  });
});

describe('2FA verify rate limit (5 / user and 20 / IP per 15 min, recovery codes included)', () => {
  it('the 6th wrong code within the window gets 429', async () => {
    const u = await createUserWith2FA();
    const wrong = await wrongCodeFor(u.secret);
    const ip = freshIp();
    for (let i = 0; i < 5; i++) expect((await verify(wrong, u.id, ip)).status).toBe(401);
    const sixth = await verify(wrong, u.id, ip);
    expect(sixth.status).toBe(429);
    expect(Number(sixth.headers.get('Retry-After'))).toBeGreaterThan(0);
  });

  it('after the limit, even the CORRECT code is refused (no guessing through the lock)', async () => {
    const u = await createUserWith2FA();
    const wrong = await wrongCodeFor(u.secret);
    for (let i = 0; i < 5; i++) await verify(wrong, u.id, freshIp());
    const res = await verify(await totpNow(u.secret), u.id, freshIp());
    expect(res.status).toBe(429);
    expect(res.cookies.get('token')).toBeUndefined();
  });

  it('is per user, not per pending token: logging in again does not reset the counter', async () => {
    const u = await createUserWith2FA();
    const wrong = await wrongCodeFor(u.secret);
    for (let i = 0; i < 5; i++) await verify(wrong, u.id, freshIp()); // each call mints its own pending token
    expect((await verify(wrong, u.id, freshIp())).status).toBe(429);
  });

  it('recovery-code guesses count towards the same limit', async () => {
    const u = await createUserWith2FA();
    for (let i = 0; i < 5; i++) await verify('AAAAA-BBBBB', u.id, freshIp());
    expect((await verify(u.recoveryCodes[0], u.id, freshIp())).status).toBe(429);
  });

  it('another user is unaffected by the first user being locked', async () => {
    const a = await createUserWith2FA();
    const b = await createUserWith2FA();
    for (let i = 0; i < 6; i++) await verify(await wrongCodeFor(a.secret), a.id, freshIp());
    expect((await verify(await totpNow(b.secret), b.id, freshIp())).status).toBe(200);
  });

  it('a successful verify resets the user counter', async () => {
    const u = await createUserWith2FA();
    const wrong = await wrongCodeFor(u.secret);
    for (let i = 0; i < 4; i++) await verify(wrong, u.id, freshIp());
    expect((await verify(await totpNow(u.secret), u.id, freshIp())).status).toBe(200);
    for (let i = 0; i < 5; i++) expect((await verify(wrong, u.id, freshIp())).status).toBe(401);
    expect((await verify(wrong, u.id, freshIp())).status).toBe(429);
  });

  it('the 21st attempt from one IP gets 429 even across different users', async () => {
    const ip = freshIp();
    for (let i = 0; i < 20; i++) {
      const u = await createUserWith2FA();
      expect((await verify(await wrongCodeFor(u.secret), u.id, ip)).status).toBe(401);
    }
    const u = await createUserWith2FA();
    expect((await verify(await totpNow(u.secret), u.id, ip)).status).toBe(429);
  });

  it('the limit resets after the window', async () => {
    const u = await createUserWith2FA();
    const wrong = await wrongCodeFor(u.secret);
    const base = Date.now();
    for (let i = 0; i < 6; i++) await verify(wrong, u.id, freshIp());
    expect((await verify(await totpNow(u.secret), u.id, freshIp())).status).toBe(429);

    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(base + 15 * 60 * 1000 + 5000);
    expect((await verify(await totpNow(u.secret), u.id, freshIp())).status).toBe(200);
  });

  it('requests without a valid pending cookie still count against the IP limit', async () => {
    const ip = freshIp();
    for (let i = 0; i < 20; i++) {
      const res = await verifyPost(makeRequest('/api/auth/2fa/verify', { method: 'POST', json: { code: '123456' }, headers: { 'x-forwarded-for': ip } }));
      expect(res.status).toBe(401);
    }
    const res = await verifyPost(makeRequest('/api/auth/2fa/verify', { method: 'POST', json: { code: '123456' }, headers: { 'x-forwarded-for': ip } }));
    expect(res.status).toBe(429);
  });
});

describe('the authenticated 2FA endpoints share the per-user limit (no side door to brute-force a code)', () => {
  it('disable: the 6th wrong code gets 429 and 2FA stays enabled', async () => {
    const u = await createUserWith2FA();
    const wrong = await wrongCodeFor(u.secret);
    const call = (code) => disablePost(makeRequest('/api/auth/2fa/disable', { method: 'POST', json: { code }, cookies: { token: u.token } }));
    for (let i = 0; i < 5; i++) expect((await call(wrong)).status).toBe(401);
    expect((await call(await totpNow(u.secret))).status).toBe(429);
  });

  it('setup confirm: the 6th wrong code gets 429', async () => {
    const u = await createTestUser();
    const { secret } = await (await setupGet(makeRequest('/api/auth/2fa/setup', { cookies: { token: u.token } }))).json();
    const wrong = await wrongCodeFor(secret);
    const call = (code) => setupPost(makeRequest('/api/auth/2fa/setup', { method: 'POST', json: { code }, cookies: { token: u.token } }));
    for (let i = 0; i < 5; i++) expect((await call(wrong)).status).toBe(400);
    expect((await call(await totpNow(secret))).status).toBe(429);
  });
});
