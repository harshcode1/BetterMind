// Shared in-memory rate limiter (use Redis in production for multi-instance deployments)
const stores = new Map();

export function createRateLimiter({ windowMs, max, keyPrefix = '' }) {
  const key = keyPrefix || Math.random().toString(36);
  if (!stores.has(key)) stores.set(key, new Map());
  const store = stores.get(key);

  return function rateLimit(identifier) {
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
  };
}

export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: 'login',
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

export const assessmentLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyPrefix: 'assessment',
});
