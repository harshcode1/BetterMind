import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecret } from './app/lib/secrets';

// List of routes that require authentication
const protectedRoutes = [
  '/chat',
  '/appointments',
  '/doctors',
  '/profile',
];

// List of routes that are only accessible for non-authenticated users
const authRoutes = [
  '/login',
  '/signup',
];

// This middleware runs in Edge Runtime and cannot use Node.js modules like MongoDB
export async function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;
  
  // Routes only accessible to non-authenticated users
  const isAuthRoute = authRoutes.some(route =>
    path === route || path.startsWith(`${route}/`)
  );

  // API routes that require authentication (excludes /api/auth/* which are public)
  const isProtectedApi = path.startsWith('/api/') &&
    !path.startsWith('/api/auth/') &&
    path !== '/api/auth/check';

  // Verify JWT — Edge Runtime only (no DB access)
  let authenticated = false;
  if (token) {
    // Read outside the try/catch: a missing JWT_SECRET is a deployment error and must fail
    // loudly (500), not look like "invalid token".
    const secret = new TextEncoder().encode(getJwtSecret());
    try {
      await jwtVerify(token, secret);
      authenticated = true;
    } catch {
      authenticated = false;
    }
  }

  // Unauthenticated API calls → return 401 JSON (not a redirect, which breaks fetch())
  // Page routes are always accessible — guest mode is the default for non-signed-in visitors
  if (isProtectedApi && !authenticated) {
    return new NextResponse(
      JSON.stringify({ error: 'Not authenticated' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Prevent authenticated users from landing on login/signup
  if (isAuthRoute && authenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  return response;
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/* (image files)
     * - public/* (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|public/).*)',
  ],
}; 