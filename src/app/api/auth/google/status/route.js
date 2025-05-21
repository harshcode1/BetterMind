// app/api/auth/google/status/route.js
// Use dynamic = 'auto' for better caching with revalidation
export const revalidate = 60; // Revalidate every 60 seconds

import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/authServer';
import clientPromise from '../../../../lib/db';
import { ObjectId } from 'mongodb';
import { refreshTokensIfNeeded } from '../../../../lib/googleCalendar';

// Check if Google Calendar is connected
export async function GET(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);
    
    if (!auth.authenticated) {
      // Redirect to login page with the current URL as the redirect parameter
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Get the user ID from the authenticated user
    const userId = auth.user.id;
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    
    // Get the user's Google tokens
    const tokens = await db.collection('googleTokens').findOne({ userId: new ObjectId(userId) });
    
    if (!tokens) {
      return NextResponse.json({ connected: false });
    }
    
    // Check if tokens are valid and refresh if needed
    try {
      const refreshedTokens = await refreshTokensIfNeeded(tokens);
      
      // If tokens were refreshed, update them in the database
      if (refreshedTokens && refreshedTokens !== tokens) {
        await db.collection('googleTokens').updateOne(
          { userId: new ObjectId(userId) },
          { 
            $set: {
              accessToken: refreshedTokens.access_token,
              refreshToken: refreshedTokens.refresh_token || tokens.refreshToken,
              expiryDate: new Date(Date.now() + refreshedTokens.expires_in * 1000),
              updatedAt: new Date()
            }
          }
        );
      }
      
      return NextResponse.json({ connected: true });
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
      
      // If tokens are invalid, remove them from the database
      await db.collection('googleTokens').deleteOne({ userId: new ObjectId(userId) });
      
      return NextResponse.json({ connected: false, error: 'Invalid tokens' });
    }
  } catch (error) {
    console.error('Check Google Calendar connection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}