import { createRateLimiter, getClientIp } from '../../src/app/lib/rateLimit';

const WINDOW = 15 * 60 * 1000;
let now;
let nowSpy;

beforeEach(() => {
  now = 1_700_000_000_000;
  nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);
});
afterEach(() => nowSpy.mockRestore());

describe('createRateLimiter', () => {
  it('allows `max` attempts and limits the next one', () => {
    const limiter = createRateLimiter({ windowMs: WINDOW, max: 5, keyPrefix: 'unit-a' });
    for (let i = 1; i <= 5; i++) {
      const r = limiter('user-1');
      expect(r.limited).toBe(false);
      expect(r.remaining).toBe(5 - i);
    }
    const sixth = limiter('user-1');
    expect(sixth.limited).toBe(true);
    expect(sixth.remaining).toBe(0);
    expect(sixth.retryAfter).toBe(15 * 60);
  });

  it('keeps counting separately per identifier', () => {
    const limiter = createRateLimiter({ windowMs: WINDOW, max: 2, keyPrefix: 'unit-b' });
    limiter('a'); limiter('a');
    expect(limiter('a').limited).toBe(true);
    expect(limiter('b').limited).toBe(false);
  });

  it('the window resets after windowMs', () => {
    const limiter = createRateLimiter({ windowMs: WINDOW, max: 2, keyPrefix: 'unit-c' });
    limiter('a'); limiter('a');
    expect(limiter('a').limited).toBe(true);
    now += WINDOW - 1000;
    expect(limiter('a').limited).toBe(true); // still inside the window
    now += 2000; // past the window
    expect(limiter('a').limited).toBe(false);
  });

  it('retryAfter counts down as the window passes', () => {
    const limiter = createRateLimiter({ windowMs: WINDOW, max: 1, keyPrefix: 'unit-d' });
    limiter('a');
    now += 5 * 60 * 1000;
    expect(limiter('a').retryAfter).toBe(10 * 60);
  });

  it('reset(identifier) clears just that identifier', () => {
    const limiter = createRateLimiter({ windowMs: WINDOW, max: 1, keyPrefix: 'unit-e' });
    limiter('a'); limiter('b');
    expect(limiter('a').limited).toBe(true);
    expect(limiter('b').limited).toBe(true);
    limiter.reset('a');
    expect(limiter('a').limited).toBe(false);
    expect(limiter('b').limited).toBe(true);
  });

  it('limiters with different prefixes do not share counters', () => {
    const one = createRateLimiter({ windowMs: WINDOW, max: 1, keyPrefix: 'unit-f1' });
    const two = createRateLimiter({ windowMs: WINDOW, max: 1, keyPrefix: 'unit-f2' });
    one('a');
    expect(one('a').limited).toBe(true);
    expect(two('a').limited).toBe(false);
  });
});

describe('getClientIp', () => {
  const req = (value) => ({ headers: { get: (name) => (name.toLowerCase() === 'x-forwarded-for' ? value : null) } });

  it('uses the first address in x-forwarded-for', () => {
    expect(getClientIp(req('203.0.113.7, 10.0.0.1, 10.0.0.2'))).toBe('203.0.113.7');
  });
  it('trims whitespace', () => {
    expect(getClientIp(req('  203.0.113.7  '))).toBe('203.0.113.7');
  });
  it("falls back to 'unknown' when the header is missing", () => {
    expect(getClientIp(req(null))).toBe('unknown');
    expect(getClientIp(req(''))).toBe('unknown');
  });
});
