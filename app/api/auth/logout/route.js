// app/api/auth/logout/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  const response = NextResponse.json({
    message: 'Logged out successfully'
  });
  
  // Clear the token cookie
  response.cookies.set({
    name: 'token',
    value: '',
    httpOnly: true,
    expires: new Date(0),
    path: '/'
  });
  
  return response;
}