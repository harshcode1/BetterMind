import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../lib/authServer';
import clientPromise from '../../../lib/db';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    // Extract token from cookies
    const token = request.cookies.get('token')?.value;
    const { authenticated, user, error } = await verifyAuth(token);
    
    if (!authenticated) {
      return NextResponse.json({ 
        authenticated: false, 
        error: error || 'Not authenticated' 
      });
    }
    
    // Get additional user information from database if needed
    try {
      const client = await clientPromise;
      const db = client.db();
      
      // Get the full user record
      const userId = new ObjectId(user.id);
      const fullUser = await db.collection('users').findOne({ _id: userId });
      
      if (!fullUser) {
        return NextResponse.json({ 
          authenticated: false, 
          error: 'User not found' 
        });
      }
      
      // Get doctor information if user is a doctor
      let doctorInfo = null;
      if (fullUser.role === 'doctor') {
        doctorInfo = await db.collection('doctors').findOne({ userId });
      }
      
      // Return user information with role and verification status
      return NextResponse.json({ 
        authenticated: true, 
        user: {
          id: fullUser._id.toString(),
          name: fullUser.name,
          email: fullUser.email,
          role: fullUser.role || 'patient', // Default to patient if no role
          verified: fullUser.verified || false, // Default to false if not verified
          ...(doctorInfo && { doctorId: doctorInfo._id.toString() }) // Include doctorId if user is a doctor
        }
      });
    } catch (dbError) {
      console.error('Database error during auth check:', dbError);
      
      // Still return basic user info if database lookup fails
      return NextResponse.json({ 
        authenticated: true, 
        user
      });
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ 
      authenticated: false, 
      error: 'Server error during authentication check' 
    }, { status: 500 });
  }
}