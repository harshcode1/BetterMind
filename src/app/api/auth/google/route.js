// app/api/auth/google/route.js
import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../lib/authServer';
import { getAuthUrl } from '../../../lib/googleCalendar';
import clientPromise from '../../../lib/db';

// Initiate Google OAuth flow
export async function GET(request) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request);
    
    // Get the current URL to use as redirect after login
    const url = new URL(request.url);
    const redirectAfterAuth = url.searchParams.get('redirect') || '/appointments';
    
    if (!auth.authenticated) {
      // Redirect to login page with the current URL as the redirect parameter
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', `/api/auth/google?redirect=${encodeURIComponent(redirectAfterAuth)}`);
      return NextResponse.redirect(loginUrl);
    }
    
    // Get the user ID from the authenticated user
    const userId = auth.user.id;
    
    // We already have the redirect URL from above, no need to get it again
    
    // Store the redirect URL in the database for later use
    const client = await clientPromise;
    const db = client.db();
    
    await db.collection('oauthState').insertOne({
      userId,
      redirectAfterAuth,
      createdAt: new Date()
    });
    
    // Generate the Google OAuth URL
    const authUrl = getAuthUrl();
    
    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}