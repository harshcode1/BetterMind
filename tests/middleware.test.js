import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { middleware } from '../src/middleware';
import { generateToken } from '../src/app/lib/auth';

const user = { _id: { toString: () => '64b7f0f0f0f0f0f0f0f0f0a1' }, email: 'a@example.com', name: 'A', role: 'patient' };

function req(path, token) {
  return new NextRequest(`http://localhost:3000${path}`, token ? { headers: { cookie: `token=${token}` } } : {});
}

const base64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');

describe('edge middleware: JWT check on API routes', () => {
  it('rejects a missing token with 401 JSON (not a redirect)', async () => {
    const res = await middleware(req('/api/mood'));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Not authenticated' });
  });

  it('rejects a garbage token', async () => {
    const res = await middleware(req('/api/mood', 'not-a-jwt'));
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const forged = jwt.sign({ id: 'x', role: 'admin' }, 'some-other-secret');
    const res = await middleware(req('/api/mood', forged));
    expect(res.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const expired = jwt.sign({ id: 'x' }, process.env.JWT_SECRET, { expiresIn: -10 });
    const res = await middleware(req('/api/mood', expired));
    expect(res.status).toBe(401);
  });

  it('rejects an unsigned (alg=none) token', async () => {
    const unsigned = `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url({ id: 'x', role: 'admin' })}.`;
    const res = await middleware(req('/api/mood', unsigned));
    expect(res.status).toBe(401);
  });

  it('accepts a valid token issued by generateToken (jsonwebtoken <-> jose interop)', async () => {
    const res = await middleware(req('/api/mood', generateToken(user)));
    expect(res.status).toBe(200);
    expect(res.headers.get('x-middleware-next')).toBe('1'); // passed through to the route
  });

  it('protects every /api route except /api/auth/*', async () => {
    for (const path of ['/api/chat', '/api/admin/doctors', '/api/appointments', '/api/user/profile']) {
      expect((await middleware(req(path))).status).toBe(401);
    }
    for (const path of ['/api/auth/login', '/api/auth/register', '/api/auth/2fa/verify']) {
      const res = await middleware(req(path));
      expect(res.headers.get('x-middleware-next')).toBe('1'); // public at the edge; routes check themselves
    }
  });

  it('lets guests load page routes (guest mode is the default)', async () => {
    const res = await middleware(req('/dashboard'));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('redirects signed-in users away from /login and /signup', async () => {
    const token = generateToken(user);
    for (const path of ['/login', '/signup']) {
      const res = await middleware(req(path, token));
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get('location')).pathname).toBe('/');
    }
  });

  it('sets security headers', async () => {
    const res = await middleware(req('/'));
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('fails loudly (throws) when JWT_SECRET is missing and a token is presented', async () => {
    const token = generateToken(user);
    const original = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    try {
      await expect(middleware(req('/api/mood', token))).rejects.toThrow(/JWT_SECRET is not set/);
    } finally {
      process.env.JWT_SECRET = original;
    }
  });
});
