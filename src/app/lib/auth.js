// app/lib/auth.js
// CLIENT-SIDE AUTHENTICATION FUNCTIONS (avoid MongoDB usage)
import jwt from 'jsonwebtoken';
import { getJwtSecret } from './secrets';

// Generate token for client (throws if JWT_SECRET is not configured)
export function generateToken(user) {
  return jwt.sign(
    { 
      id: user._id.toString(), 
      email: user.email,
      name: user.name,
      role: user.role || 'patient', // Default to patient if no role
      verified: user.verified || false // Default to false if not verified
    }, 
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

// Function to refresh token
export function refreshToken(user) {
  return generateToken(user);
}

// Client-side token verification (without DB check)
export function verifyTokenClient(token) {
  if (!token) {
    return { authenticated: false, error: 'No token provided' };
  }
  
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return { authenticated: true, user: decoded };
  } catch (error) {
    // Token expired or invalid
    if (error.name === 'TokenExpiredError') {
      return { authenticated: false, error: 'Token expired', expired: true };
    }
    return { authenticated: false, error: error.message };
  }
}