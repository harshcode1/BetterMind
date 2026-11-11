// "2FA pending" token: proof that the password step succeeded, valid ONLY for the 2FA challenge.
// Login hands it out in an httpOnly cookie instead of a session; /api/auth/2fa/verify requires it.
//   - short-lived (5 minutes)
//   - bound to one user (`sub`) and marked with purpose "2fa-pending"
//   - signed with a key derived from JWT_SECRET but different from the session key, so a pending
//     token can never be accepted as a session token (and a session token never as a pending one)
import jwt from 'jsonwebtoken';
import { getJwtSecret } from './secrets';

export const PENDING_COOKIE = 'twofa_pending';
export const PENDING_PATH = '/api/auth/2fa';
export const PENDING_TTL_SECONDS = 5 * 60;
const PURPOSE = '2fa-pending';

function pendingKey() {
  return `${getJwtSecret()}::2fa-pending`;
}

// `expiresIn` (seconds) is a parameter only so tests can mint an already-expired token.
export function signPendingToken(userId, expiresIn = PENDING_TTL_SECONDS) {
  return jwt.sign({ sub: String(userId), purpose: PURPOSE }, pendingKey(), { algorithm: 'HS256', expiresIn });
}

// Returns { userId } for a valid pending token, otherwise null.
export function verifyPendingToken(token) {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, pendingKey(), { algorithms: ['HS256'] });
    if (decoded.purpose !== PURPOSE || !decoded.sub) return null;
    return { userId: decoded.sub };
  } catch {
    return null;
  }
}

// Cookie options shared by "set" (login) and "clear" (successful verify) so the path always matches.
export function pendingCookieOptions(maxAge = PENDING_TTL_SECONDS) {
  return {
    name: PENDING_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    path: PENDING_PATH,
    maxAge,
  };
}
