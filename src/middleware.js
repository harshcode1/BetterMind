import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

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
  
  // Check if the route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  );
  
  // Check if the route is for non-authenticated users only
  const isAuthRoute = authRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  );

  // Check if the route is an API that requires authentication
  const isProtectedApi = path.startsWith('/api/') && 
    !path.startsWith('/api/auth/') &&
    path !== '/api/auth/check';

  // Verify authentication - simpler method without MongoDB
  let authenticated = false;
  
  if (token) {
    try {
      // Use jose for JWT verification in Edge Runtime
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_for_development_only');
      await jwtVerify(token, secret);
      authenticated = true;
    } catch (error) {
      // Token is invalid or expired
      authenticated = false;
    }
  }

  // Handle protected routes - redirect to login if not authenticated
  if ((isProtectedRoute || isProtectedApi) && !authenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // Handle auth routes - redirect to home if already authenticated
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