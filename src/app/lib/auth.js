// app/lib/auth.js
// CLIENT-SIDE AUTHENTICATION FUNCTIONS (avoid MongoDB usage)
import jwt from 'jsonwebtoken';

// Never use a hardcoded secret in production
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

if (!JWT_SECRET) {
  console.error('WARNING: JWT_SECRET is not defined in environment variables. Authentication will not work correctly.');
}

// Generate token for client
export function generateToken(user) {
  if (!JWT_SECRET) {
    console.error('Cannot generate token: JWT_SECRET is not defined');
    throw new Error('Server configuration error');
  }
  
  return jwt.sign(
    { 
      id: user._id.toString(), 
      email: user.email,
      name: user.name,
      role: user.role || 'patient', // Default to patient if no role
      verified: user.verified || false // Default to false if not verified
    }, 
    JWT_SECRET, 
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
    const decoded = jwt.verify(token, JWT_SECRET);
    return { authenticated: true, user: decoded };
  } catch (error) {
    // Token expired or invalid
    if (error.name === 'TokenExpiredError') {
      return { authenticated: false, error: 'Token expired', expired: true };
    }
    return { authenticated: false, error: error.message };
  }
}