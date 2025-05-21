// app/api/admin/doctors/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../lib/authServer';
import clientPromise from '../../../lib/db';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    // Verify authentication and admin role
    const { authenticated, user, error } = await verifyAuth();
    
    if (!authenticated) {
      return NextResponse.json({ error: error || 'Not authenticated' }, { status: 401 });
    }
    
    // Check if user is an admin
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }
    
    // Get status filter from query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    
    // Connect to database
    const client = await clientPromise;
    const db = client.db();
    
    // Build query based on status
    let query = {};
    
    if (status === 'pending') {
      query = { verified: false, rejected: { $ne: true } };
    } else if (status === 'verified') {
      query = { verified: true };
    } else if (status === 'rejected') {
      query = { rejected: true };
    }
    
    // Fetch doctors with user information
    const doctors = await db.collection('doctors').aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          email: '$user.email',
          specialty: 1,
          credentials: 1,
          licenseNumber: 1,
          bio: 1,
          address: 1,
          phone: 1,
          verified: 1,
          rejected: 1,
          rejectionReason: 1,
          createdAt: 1,
          updatedAt: 1
        }
      },
      { $sort: { createdAt: -1 } }
    ]).toArray();
    
    return NextResponse.json({ doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}