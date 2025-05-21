// app/api/auth/google/callback/route.js
import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/authServer';
import { getTokens } from '../../../../lib/googleCalendar';
import clientPromise from '../../../../lib/db';

// Handle Google OAuth callback
export async function GET(request) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request);
    
    // Get the authorization code from query parameters
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    
    if (!auth.authenticated) {
      // Redirect to login page with the current URL as the redirect parameter
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Get the user ID from the authenticated user
    const userId = auth.user.id;
    
    // We already have the authorization code from above
    
    if (!code) {
      return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
    }
    
    // Exchange the code for tokens
    const tokens = await getTokens(code);
    
    if (!tokens || !tokens.access_token) {
      return NextResponse.json({ error: 'Failed to get tokens' }, { status: 500 });
    }
    
    // Get the client and database
    const client = await clientPromise;
    const db = client.db();
    
    // Store the tokens in the database
    await db.collection('googleTokens').updateOne(
      { userId },
      { 
        $set: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiryDate: new Date(Date.now() + tokens.expires_in * 1000),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    // Get the redirect URL from the database
    const oauthState = await db.collection('oauthState').findOne({ userId });
    const redirectUrl = oauthState?.redirectAfterAuth || '/appointments';
    
    // Clean up the OAuth state
    await db.collection('oauthState').deleteOne({ userId });
    
    // Redirect back to the application
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}