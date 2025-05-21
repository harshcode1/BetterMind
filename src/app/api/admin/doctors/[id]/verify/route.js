// app/api/admin/doctors/[id]/verify/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../../../lib/authServer';
import clientPromise from '../../../../../lib/db';
import { ObjectId } from 'mongodb';

export async function POST(request, { params }) {
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
    
    // Get doctor ID from URL parameters
    const doctorId = params.id;
    
    // Validate doctor ID
    if (!doctorId || !ObjectId.isValid(doctorId)) {
      return NextResponse.json({ error: 'Invalid doctor ID' }, { status: 400 });
    }
    
    // Parse request body
    const body = await request.json();
    const { verified, rejected = false, rejectionReason = '' } = body;
    
    // Validate required fields
    if (typeof verified !== 'boolean') {
      return NextResponse.json({ error: 'Verified status is required' }, { status: 400 });
    }
    
    // If rejecting, require a reason
    if (rejected && !rejectionReason.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }
    
    // Connect to database
    const client = await clientPromise;
    const db = client.db();
    
    // Find the doctor
    const doctor = await db.collection('doctors').findOne({ _id: new ObjectId(doctorId) });
    
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }
    
    // Find the user associated with the doctor
    const doctorUser = await db.collection('users').findOne({ _id: doctor.userId });
    
    if (!doctorUser) {
      return NextResponse.json({ error: 'Doctor user not found' }, { status: 404 });
    }
    
    // Update doctor verification status
    const updateResult = await db.collection('doctors').updateOne(
      { _id: new ObjectId(doctorId) },
      { 
        $set: { 
          verified,
          rejected,
          rejectionReason: rejected ? rejectionReason : '',
          verifiedAt: verified ? new Date() : null,
          updatedAt: new Date()
        } 
      }
    );
    
    // Update user verification status
    await db.collection('users').updateOne(
      { _id: doctor.userId },
      { 
        $set: { 
          verified,
          updatedAt: new Date()
        } 
      }
    );
    
    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({ error: 'Failed to update doctor status' }, { status: 500 });
    }
    
    // TODO: Send notification email to doctor
    // This would be implemented with an email service in a production environment
    
    return NextResponse.json({ 
      success: true, 
      message: verified ? 'Doctor approved successfully' : 'Doctor rejected successfully' 
    });
  } catch (error) {
    console.error('Error updating doctor verification status:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}