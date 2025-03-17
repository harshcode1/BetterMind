// app/lib/auth.js
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function verifyAuth(req) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    return { authenticated: false, error: 'No token provided' };
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { authenticated: true, user: decoded };
  } catch (error) {
    return { authenticated: false, error: error.message };
  }
}

export function generateToken(user) {
  return jwt.sign(
    { 
      id: user._id.toString(), 
      email: user.email,
      name: user.name
    }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
}