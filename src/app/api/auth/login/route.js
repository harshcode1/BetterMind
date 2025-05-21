// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/db';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../../lib/auth';
import { authenticateUser } from '../../../lib/authServer';

// Simple in-memory rate limiting (move to Redis or another solution for production)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

export async function POST(request) {
  try {
    // Get IP for rate limiting (in production, use a proper rate limiting solution)
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check if this IP is currently blocked
    const ipAttempts = loginAttempts.get(ip) || { count: 0, timestamp: Date.now() };
    if (ipAttempts.count >= MAX_ATTEMPTS) {
      const timeSinceBlock = Date.now() - ipAttempts.timestamp;
      if (timeSinceBlock < BLOCK_DURATION) {
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again later.' },
          { status: 429 }
        );
      } else {
        // Reset attempts after block duration
        loginAttempts.set(ip, { count: 0, timestamp: Date.now() });
      }
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
    
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      // Increment failed attempts for missing fields
      loginAttempts.set(ip, { 
        count: ipAttempts.count + 1, 
        timestamp: Date.now() 
      });
      
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      loginAttempts.set(ip, { 
        count: ipAttempts.count + 1, 
        timestamp: Date.now() 
      });
      
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Connect to database and authenticate user
    try {
      const client = await clientPromise;
      const db = client.db();
      const user = await db.collection('users').findOne({ email: email.toLowerCase() });

      // Invalid credentials - user not found or password doesn't match
      if (!user || !(await bcrypt.compare(password, user.password))) {
        // Increment failed attempts
        loginAttempts.set(ip, { 
          count: ipAttempts.count + 1, 
          timestamp: Date.now() 
        });
        
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
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
      
      // Reset login attempts on successful login
      loginAttempts.delete(ip);
      
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