// app/api/auth/login/route.js
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/db';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../../lib/auth';
import { authenticateUser } from '../../../lib/authServer';
import { signPendingToken, pendingCookieOptions } from '../../../lib/twoFactorPending';
import { normalizeEmail } from '../../../lib/email';
import { loginAccountLimiter, loginIpLimiter, getClientIp, tooManyRequests } from '../../../lib/rateLimit';

const TOO_MANY_MESSAGE = 'Too many login attempts. Please try again later.';

export async function POST(request) {
  try {
    // Limit per IP first (counts every attempt)
    const ipLimit = loginIpLimiter(getClientIp(request));
    if (ipLimit.limited) {
      return tooManyRequests(TOO_MANY_MESSAGE, ipLimit);
    }
    
    // Parse and validate input
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    const { password } = body || {};
    const email = normalizeEmail(body?.email);

    // Validate required fields
    if (!email || !password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Limit per account (counts every attempt, whether or not the account exists)
    const accountKey = email;
    const accountLimit = loginAccountLimiter(accountKey);
    if (accountLimit.limited) {
      return tooManyRequests(TOO_MANY_MESSAGE, accountLimit);
    }

    // Connect to database and authenticate user
    try {
      const client = await clientPromise;
      const db = client.db();
      const user = await db.collection('users').findOne({ email });

      // Invalid credentials - user not found or password doesn't match
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      // If 2FA is enabled, return a pending state instead of issuing JWT
      if (user.twoFactorAuth?.enabled && user.twoFactorAuth?.setupComplete) {
        loginAccountLimiter.reset(accountKey);
        const pendingResponse = NextResponse.json({
          requires2FA: true,
          message: 'Two-factor authentication required',
        });
        // Proof that the password step passed. httpOnly, so page scripts (XSS) cannot read it.
        pendingResponse.cookies.set({
          ...pendingCookieOptions(),
          value: signPendingToken(user._id.toString()),
        });
        return pendingResponse;
      }

      // Get doctor information if user is a doctor
      let doctorInfo = null;
      if (user.role === 'doctor') {
        doctorInfo = await db.collection('doctors').findOne({
          userId: user._id
        });
      }

      // Generate JWT token with role and verification status
      const token = generateToken({
        ...user,
        role: user.role || 'patient',
        verified: user.verified || false
      });
      
      // Reset the account counter on successful login (the IP counter keeps running)
      loginAccountLimiter.reset(accountKey);
      
      // Create and return response
      const response = NextResponse.json({
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role || 'patient', // Default to patient if no role
          verified: user.verified || false, // Default to false if not verified
          ...(doctorInfo && { doctorId: doctorInfo._id.toString() }) // Include doctorId if user is a doctor
        },
        message: 'Login successful'
      });
      
      // Set secure HTTP-only cookie
      response.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict', // Protect against CSRF
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/'
      });

      return response;
    } catch (dbError) {
      console.error('Database error during login:', dbError);
      return NextResponse.json(
        { error: 'Service unavailable. Please try again later.' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}