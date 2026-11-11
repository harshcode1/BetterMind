import { NextResponse } from 'next/server';

// Shared in-memory rate limiter (fixed window).
// Known limitation: the counters live in this server instance's memory, so on serverless hosting
// (e.g. Vercel) they reset on a cold start and are not shared between instances. A shared store
// such as Redis would fix that; it is deliberately not added here.
const stores = new Map();

export function createRateLimiter({ windowMs, max, keyPrefix = '' }) {
  const key = keyPrefix || Math.random().toString(36);
  if (!stores.has(key)) stores.set(key, new Map());
  const store = stores.get(key);

  function rateLimit(identifier) {
    const now = Date.now();
    const record = store.get(identifier) || { count: 0, resetAt: now + windowMs };

    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }

    record.count += 1;
    store.set(identifier, record);

    const remaining = Math.max(0, max - record.count);
    const limited = record.count > max;

    return {
      limited,
      remaining,
      resetAt: record.resetAt,
      retryAfter: limited ? Math.ceil((record.resetAt - now) / 1000) : 0,
    };
  }

  // Forget one identifier, e.g. after a successful login.
  rateLimit.reset = (identifier) => {
    store.delete(identifier);
  };

  return rateLimit;
}

// Client IP for per-IP limits: the first address in x-forwarded-for (the original client).
export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded ? forwarded.split(',')[0].trim() : '';
  return first || 'unknown';
}

// Standard 429 response with a Retry-After header.
export function tooManyRequests(message, limit) {
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
  );
}

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Login: 5 attempts per account and 20 per IP per 15 minutes. Every attempt counts; a successful
// login clears only the account counter. Per account stops guessing one user's password from many
// IPs; per IP stops one machine trying many accounts (the higher number leaves room for shared
// networks such as an office or campus).
export const loginAccountLimiter = createRateLimiter({
  windowMs: FIFTEEN_MINUTES,
  max: 5,
  keyPrefix: 'login-account',
});

export const loginIpLimiter = createRateLimiter({
  windowMs: FIFTEEN_MINUTES,
  max: 20,
  keyPrefix: 'login-ip',
});

// 2FA code checks (verify, recovery codes, setup confirm, disable): same numbers, keyed by user id
// so that logging in again cannot reset the counter.
export const twoFactorUserLimiter = createRateLimiter({
  windowMs: FIFTEEN_MINUTES,
  max: 5,
  keyPrefix: 'twofa-user',
});

export const twoFactorIpLimiter = createRateLimiter({
  windowMs: FIFTEEN_MINUTES,
  max: 20,
  keyPrefix: 'twofa-ip',
});

export const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyPrefix: 'register',
});

export const chatLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  keyPrefix: 'chat',
});
