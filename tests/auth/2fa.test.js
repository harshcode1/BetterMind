import jwt from 'jsonwebtoken';
import { POST as loginPost } from '../../src/app/api/auth/login/route';
import { POST as verifyPost } from '../../src/app/api/auth/2fa/verify/route';
import { GET as setupGet, POST as setupPost } from '../../src/app/api/auth/2fa/setup/route';
import { POST as disablePost } from '../../src/app/api/auth/2fa/disable/route';
import { signPendingToken, PENDING_COOKIE } from '../../src/app/lib/twoFactorPending';
import { hashRecoveryCode } from '../../src/app/lib/twoFactorAuth';
import { clearDb, closeDb } from '../helpers/db';
import { createTestUser, makeRequest } from '../helpers/http';
import { createUserWith2FA, getStoredUser, newSecret, totpNow, wrongCodeFor } from '../helpers/twofa';

let errorSpy;
beforeEach(async () => {
  await clearDb();
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => errorSpy.mockRestore());
afterAll(closeDb);

const login = (email, password) =>
  loginPost(makeRequest('/api/auth/login', { method: 'POST', json: { email, password }, headers: { 'x-forwarded-for': `203.0.113.${(ipCounter += 1)}` } }));
// Every call comes from its own IP so the per-IP rate limit (covered in rateLimit.test.js) never interferes here.
let ipCounter = 0;
const verify = (json, pending) =>
  verifyPost(makeRequest('/api/auth/2fa/verify', {
    method: 'POST', json, cookies: pending ? { [PENDING_COOKIE]: pending } : {},
    headers: { 'x-forwarded-for': `192.0.2.${(ipCounter += 1)}` },
  }));
const session = (token) => (token ? { token } : {});

describe('login with 2FA enabled', () => {
  it('returns requires2FA and a pending cookie — no session cookie, no userId in the body', async () => {
    const u = await createUserWith2FA();
    const res = await login(u.user.email, u.password);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.requires2FA).toBe(true);
    expect(body.userId).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain(u.id);
    expect(res.cookies.get('token')).toBeUndefined(); // JWT is NOT issued before 2FA completes

    const pending = res.cookies.get(PENDING_COOKIE);
    expect(pending.value).toBeTruthy();
    expect(pending.httpOnly).toBe(true);
    expect(pending.secure).toBe(true);
    expect(pending.sameSite).toBe('strict');
    expect(pending.path).toBe('/api/auth/2fa');
    expect(pending.maxAge).toBe(300);
  });

  it('the pending token is a short-lived 5-minute token bound to the user and marked 2fa-pending', async () => {
    const u = await createUserWith2FA();
    const res = await login(u.user.email, u.password);
    const decoded = jwt.decode(res.cookies.get(PENDING_COOKIE).value);
    expect(decoded.sub).toBe(u.id);
    expect(decoded.purpose).toBe('2fa-pending');
    expect(decoded.exp - decoded.iat).toBe(300);
  });

  it('a wrong password gets no pending cookie', async () => {
    const u = await createUserWith2FA();
    const res = await login(u.user.email, 'wrong-password');
    expect(res.status).toBe(401);
    expect(res.cookies.get(PENDING_COOKIE)).toBeUndefined();
  });

  it('a user without 2FA still gets a normal session cookie and no pending cookie', async () => {
    const u = await createTestUser();
    const res = await login(u.user.email, u.password);
    expect(res.status).toBe(200);
    expect(res.cookies.get('token').value).toBeTruthy();
    expect(res.cookies.get(PENDING_COOKIE)).toBeUndefined();
  });
});

describe('POST /api/auth/2fa/verify', () => {
  it('rejects a request with no pending cookie (401) and issues nothing', async () => {
    const u = await createUserWith2FA();
    const res = await verify({ userId: u.id, code: await totpNow(u.secret) });
    expect(res.status).toBe(401);
    expect(res.cookies.get('token')).toBeUndefined();
  });

  it('rejects a tampered pending token', async () => {
    const u = await createUserWith2FA();
    const good = signPendingToken(u.id);
    const [h, p, s] = good.split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ sub: u.id, purpose: '2fa-pending', exp: 9999999999 })).toString('base64url');
    for (const bad of [`${h}.${p}.${s.slice(0, -2)}xx`, `${h}.${forgedPayload}.${s}`, 'garbage']) {
      const res = await verify({ code: await totpNow(u.secret) }, bad);
      expect(res.status).toBe(401);
      expect(res.cookies.get('token')).toBeUndefined();
    }
  });

  it('rejects an expired pending token', async () => {
    const u = await createUserWith2FA();
    const expired = signPendingToken(u.id, -10);
    const res = await verify({ code: await totpNow(u.secret) }, expired);
    expect(res.status).toBe(401);
    expect(res.cookies.get('token')).toBeUndefined();
  });

  it('rejects a normal session token used as a pending token', async () => {
    const u = await createUserWith2FA();
    const res = await verify({ code: await totpNow(u.secret) }, u.token);
    expect(res.status).toBe(401);
  });

  it('rejects a pending token signed for a different purpose', async () => {
    const u = await createUserWith2FA();
    const other = jwt.sign({ sub: u.id, purpose: 'something-else' }, process.env.JWT_SECRET, { expiresIn: 300 });
    expect((await verify({ code: await totpNow(u.secret) }, other)).status).toBe(401);
  });

  it('a wrong code fails with 401 and issues no session', async () => {
    const u = await createUserWith2FA();
    const res = await verify({ code: await wrongCodeFor(u.secret) }, signPendingToken(u.id));
    expect(res.status).toBe(401);
    expect(res.cookies.get('token')).toBeUndefined();
  });

  it.each(['x', 'abcdef', ' ', '1', '000000000000', '123456 '])('the junk code %j fails', async (code) => {
    const u = await createUserWith2FA();
    const res = await verify({ code }, signPendingToken(u.id));
    expect([400, 401]).toContain(res.status);
    expect(res.cookies.get('token')).toBeUndefined();
  });

  it('non-string codes (number, object, array, null) are rejected without a server error', async () => {
    const u = await createUserWith2FA();
    for (const code of [123456, { a: 1 }, ['123456'], null, true]) {
      const res = await verify({ code }, signPendingToken(u.id));
      expect([400, 401]).toContain(res.status);
      expect(res.cookies.get('token')).toBeUndefined();
    }
  });

  it('a correct TOTP code issues the session cookie and clears the pending cookie', async () => {
    const u = await createUserWith2FA();
    const res = await verify({ code: await totpNow(u.secret) }, signPendingToken(u.id));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.user.id).toBe(u.id);
    const token = res.cookies.get('token');
    expect(token.httpOnly).toBe(true);
    expect(token.sameSite).toBe('strict');
    expect(jwt.verify(token.value, process.env.JWT_SECRET).id).toBe(u.id);

    const cleared = res.cookies.get(PENDING_COOKIE);
    expect(cleared.value).toBe('');
    expect(cleared.maxAge).toBe(0);
    expect(cleared.path).toBe('/api/auth/2fa');
  });

  it('ignores any userId in the body: the session is for the user named in the pending token', async () => {
    const victim = await createUserWith2FA();
    const attacker = await createUserWith2FA();
    // attacker holds a valid pending token + valid code for THEIR account, and names the victim in the body
    const res = await verify({ userId: victim.id, code: await totpNow(attacker.secret) }, signPendingToken(attacker.id));
    expect(res.status).toBe(200);
    expect((await res.json()).user.id).toBe(attacker.id);

    // and the victim's code does not work with the attacker's pending token
    const res2 = await verify({ userId: victim.id, code: await totpNow(victim.secret) }, signPendingToken(attacker.id));
    expect(res2.status).toBe(401);
  });

  it('fails for an account without 2FA enabled', async () => {
    const u = await createTestUser();
    const res = await verify({ code: '123456' }, signPendingToken(u.id));
    expect(res.status).toBe(400);
    expect(res.cookies.get('token')).toBeUndefined();
  });

  it('fails for a pending token whose user no longer exists', async () => {
    const res = await verify({ code: '123456' }, signPendingToken('64b7f0f0f0f0f0f0f0f0f0ff'));
    expect([401, 404]).toContain(res.status);
    expect(res.cookies.get('token')).toBeUndefined();
  });

  describe('recovery codes', () => {
    it('are stored hashed (SHA-256), never in plain text', async () => {
      const u = await createUserWith2FA();
      const stored = await getStoredUser(u.id);
      expect(stored.twoFactorAuth.recoveryCodesHashed).toHaveLength(10);
      for (const code of u.recoveryCodes) {
        expect(JSON.stringify(stored)).not.toContain(code);
        expect(JSON.stringify(stored)).not.toContain(code.replace('-', ''));
      }
      stored.twoFactorAuth.recoveryCodesHashed.forEach((h) => expect(h).toMatch(/^[0-9a-f]{64}$/));
    });

    it('work exactly once', async () => {
      const u = await createUserWith2FA();
      const code = u.recoveryCodes[0];

      const first = await verify({ code }, signPendingToken(u.id));
      expect(first.status).toBe(200);
      expect(first.cookies.get('token')).toBeTruthy();

      const second = await verify({ code }, signPendingToken(u.id));
      expect(second.status).toBe(401);
      expect(second.cookies.get('token')).toBeUndefined();

      const stored = await getStoredUser(u.id);
      expect(stored.twoFactorAuth.recoveryCodesHashed).toHaveLength(9);
      expect(stored.twoFactorAuth.recoveryCodesHashed).not.toContain(hashRecoveryCode(code));
    });

    it('cannot be used twice even when two requests race', async () => {
      const u = await createUserWith2FA();
      const code = u.recoveryCodes[1];
      const results = await Promise.all([
        verify({ code }, signPendingToken(u.id)),
        verify({ code }, signPendingToken(u.id)),
        verify({ code }, signPendingToken(u.id)),
      ]);
      expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    });

    it('a different, unused recovery code still works after one was consumed', async () => {
      const u = await createUserWith2FA();
      await verify({ code: u.recoveryCodes[0] }, signPendingToken(u.id));
      const res = await verify({ code: u.recoveryCodes[2] }, signPendingToken(u.id));
      expect(res.status).toBe(200);
    });
  });
});

describe('/api/auth/2fa/setup', () => {
  it('requires authentication', async () => {
    expect((await setupGet(makeRequest('/api/auth/2fa/setup'))).status).toBe(401);
    expect((await setupPost(makeRequest('/api/auth/2fa/setup', { method: 'POST', json: { code: '123456' } }))).status).toBe(401);
  });

  it('GET generates a secret and a QR provisioning URI, and stores it only as pending', async () => {
    const u = await createTestUser();
    const res = await setupGet(makeRequest('/api/auth/2fa/setup', { cookies: session(u.token) }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.secret).toMatch(/^[A-Z2-7]{16,}$/); // base32
    expect(body.qrCodeUrl).toMatch(/^otpauth:\/\/totp\/BetterMind/);
    expect(body.qrCodeUrl).toContain(`secret=${body.secret}`);

    const stored = await getStoredUser(u.id);
    expect(stored.twoFactorAuth.pendingSecret).toBe(body.secret);
    expect(stored.twoFactorAuth.enabled).toBeFalsy(); // not active until a code is confirmed
  });

  it('POST with a wrong code does not enable 2FA', async () => {
    const u = await createTestUser();
    const { secret } = await (await setupGet(makeRequest('/api/auth/2fa/setup', { cookies: session(u.token) }))).json();
    const res = await setupPost(makeRequest('/api/auth/2fa/setup', { method: 'POST', json: { code: await wrongCodeFor(secret) }, cookies: session(u.token) }));
    expect(res.status).toBe(400);
    expect((await getStoredUser(u.id)).twoFactorAuth.enabled).toBeFalsy();
  });

  it.each(['x', 'abcdef', '1'])('POST with the junk code %j does not enable 2FA', async (code) => {
    const u = await createTestUser();
    await setupGet(makeRequest('/api/auth/2fa/setup', { cookies: session(u.token) }));
    const res = await setupPost(makeRequest('/api/auth/2fa/setup', { method: 'POST', json: { code }, cookies: session(u.token) }));
    expect(res.status).toBe(400);
    expect((await getStoredUser(u.id)).twoFactorAuth.enabled).toBeFalsy();
  });

  it('POST without a prior GET (no pending secret) fails', async () => {
    const u = await createTestUser();
    const res = await setupPost(makeRequest('/api/auth/2fa/setup', { method: 'POST', json: { code: '123456' }, cookies: session(u.token) }));
    expect(res.status).toBe(400);
  });

  it('POST with the correct code enables 2FA and returns 10 one-time recovery codes (stored hashed)', async () => {
    const u = await createTestUser();
    const { secret } = await (await setupGet(makeRequest('/api/auth/2fa/setup', { cookies: session(u.token) }))).json();
    const res = await setupPost(makeRequest('/api/auth/2fa/setup', { method: 'POST', json: { code: await totpNow(secret) }, cookies: session(u.token) }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.recoveryCodes).toHaveLength(10);
    const stored = await getStoredUser(u.id);
    expect(stored.twoFactorAuth.enabled).toBe(true);
    expect(stored.twoFactorAuth.secret).toBe(secret);
    expect(stored.twoFactorAuth.pendingSecret).toBeNull();
    for (const code of body.recoveryCodes) expect(JSON.stringify(stored)).not.toContain(code);
    expect(stored.twoFactorAuth.recoveryCodesHashed).toEqual(body.recoveryCodes.map(hashRecoveryCode));
  });

  it('cannot be restarted while 2FA is already enabled (that would let a stolen session swap the secret)', async () => {
    const u = await createUserWith2FA();
    const get = await setupGet(makeRequest('/api/auth/2fa/setup', { cookies: session(u.token) }));
    expect(get.status).toBe(400);
    const post = await setupPost(makeRequest('/api/auth/2fa/setup', { method: 'POST', json: { code: await totpNow(newSecret()) }, cookies: session(u.token) }));
    expect(post.status).toBe(400);
    expect((await getStoredUser(u.id)).twoFactorAuth.secret).toBe(u.secret);
  });
});

describe('POST /api/auth/2fa/disable', () => {
  const disable = (json, token) => disablePost(makeRequest('/api/auth/2fa/disable', { method: 'POST', json, cookies: session(token) }));

  it('requires authentication', async () => {
    const u = await createUserWith2FA();
    const res = await disable({ code: await totpNow(u.secret) }, null);
    expect(res.status).toBe(401);
    expect((await getStoredUser(u.id)).twoFactorAuth.enabled).toBe(true);
  });

  it('a wrong code does not disable 2FA', async () => {
    const u = await createUserWith2FA();
    const res = await disable({ code: await wrongCodeFor(u.secret) }, u.token);
    expect(res.status).toBe(401);
    expect((await getStoredUser(u.id)).twoFactorAuth.enabled).toBe(true);
  });

  it.each(['x', 'abcdef', '1'])('the junk code %j does not disable 2FA', async (code) => {
    const u = await createUserWith2FA();
    const res = await disable({ code }, u.token);
    expect(res.status).toBe(401);
    expect((await getStoredUser(u.id)).twoFactorAuth.enabled).toBe(true);
  });

  it('the correct code disables 2FA and wipes the secret and recovery codes', async () => {
    const u = await createUserWith2FA();
    const res = await disable({ code: await totpNow(u.secret) }, u.token);
    expect(res.status).toBe(200);
    const stored = await getStoredUser(u.id);
    expect(stored.twoFactorAuth.enabled).toBe(false);
    expect(stored.twoFactorAuth.secret).toBeNull();
    expect(stored.twoFactorAuth.recoveryCodesHashed).toEqual([]);
  });

  it('fails when 2FA is not enabled', async () => {
    const u = await createTestUser();
    expect((await disable({ code: '123456' }, u.token)).status).toBe(400);
  });
});
