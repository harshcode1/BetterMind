// app/lib/authServer.js
// SERVER COMPONENTS AND API ROUTES ONLY (not for Edge Runtime)
// This file should NEVER be imported in middleware.js

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import clientPromise from './db';
import { ObjectId } from 'mongodb';

// Never use a hardcoded secret in production
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';

// Simple in-memory cache for auth results
// Key: token, Value: { result, timestamp }
const authCache = new Map();
// Cache expiration time (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

if (!JWT_SECRET) {
  console.error('WARNING: JWT_SECRET is not defined in environment variables. Authentication will not work correctly.');
}

// Server-side authentication verification
export async function verifyAuth(token) {
  // If no token is provided, try to get it from cookies
  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get('token')?.value;
    } catch (error) {
      // Handle case where cookies() is called in middleware
      console.error('Cookie access error (likely in middleware):', error);
      return { authenticated: false, error: 'Cookie access error' };
    }
  }
  
  if (!token) {
    return { authenticated: false, error: 'No token provided' };
  }

  // Check cache first
  const now = Date.now();
  const cachedResult = authCache.get(token);
  if (cachedResult && (now - cachedResult.timestamp < CACHE_TTL)) {
    return cachedResult.result;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify that the user still exists in the database
    try {
      const client = await clientPromise;
      const db = client.db();
      
      // Convert string ID to MongoDB ObjectId if needed
      const userId = typeof decoded.id === 'string' ? new ObjectId(decoded.id) : decoded.id;
      
      const user = await db.collection('users').findOne({ _id: userId });
      
      if (!user) {
        const result = { authenticated: false, error: 'User not found' };
        authCache.set(token, { result, timestamp: now });
        return result;
      }
      
      // Get doctor information if user is a doctor
      let doctorInfo = null;
      if (user.role === 'doctor') {
        doctorInfo = await db.collection('doctors').findOne({ userId: user._id });
      }
      
      const result = { 
        authenticated: true, 
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role || 'patient', // Default to patient if no role
          verified: user.verified || false, // Default to false if not verified
          ...(doctorInfo && { doctorId: doctorInfo._id.toString() }) // Include doctorId if user is a doctor
        }
      };
      
      // Cache the successful result
      authCache.set(token, { result, timestamp: now });
      
      return result;
    } catch (dbError) {
      console.error('Database error during auth verification:', dbError);
      return { authenticated: false, error: 'Error verifying user' };
    }
  } catch (error) {
    // Token expired or invalid
    if (error.name === 'TokenExpiredError') {
      return { authenticated: false, error: 'Token expired', expired: true };
    }
    return { authenticated: false, error: error.message };
  }
}

// SERVER ONLY: Create a user
export async function createUser(userData) {
  try {
    const { name, email, password, role = 'patient', verified = false } = userData;
    
    const client = await clientPromise;
    const db = client.db();
    
    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return { success: false, error: 'User already exists' };
    }
    
    // Create user
    const result = await db.collection('users').insertOne({
      name,
      email,
      password, // Assume password is already hashed
      role, // Default to 'patient' if not provided
      verified, // Default to false if not provided
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const newUser = await db.collection('users').findOne({ _id: result.insertedId });
    
    return { 
      success: true, 
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        verified: newUser.verified
      }
    };
  } catch (error) {
    console.error('Create user error:', error);
    return { success: false, error: 'Database error' };
  }
}

// SERVER ONLY: Authenticate a user
export async function authenticateUser(credentials) {
  try {
    const { email, password } = credentials;
    
    const client = await clientPromise;
    const db = client.db();
    
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Use bcrypt to compare passwords
    const bcrypt = require('bcryptjs');
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return { success: false, error: 'Invalid password' };
    }
    
    // Get doctor information if user is a doctor
    let doctorInfo = null;
    if (user.role === 'doctor') {
      doctorInfo = await db.collection('doctors').findOne({ userId: user._id });
    }
    
    return { 
      success: true, 
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role || 'patient', // Default to patient if no role
        verified: user.verified || false, // Default to false if not verified
        ...(doctorInfo && { doctorId: doctorInfo._id.toString() }) // Include doctorId if user is a doctor
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Database error' };
  }
} 