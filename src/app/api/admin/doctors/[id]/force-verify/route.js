// app/api/admin/doctors/[id]/force-verify/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/db';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    // Get doctor ID from URL parameters
    const doctorId = params.id;
    
    // Validate doctor ID
    if (!doctorId || !ObjectId.isValid(doctorId)) {
      return NextResponse.json({ error: 'Invalid doctor ID' }, { status: 400 });
    }
    
    // Connect to database
    const client = await clientPromise;
    const db = client.db();
    
    // Find the doctor
    const doctor = await db.collection('doctors').findOne({ _id: new ObjectId(doctorId) });
    
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }
    
    // Log the doctor record for debugging
    console.log('Doctor record:', doctor);
    
    // Update doctor verification status
    const updateDoctorResult = await db.collection('doctors').updateOne(
      { _id: new ObjectId(doctorId) },
      { 
        $set: { 
          verified: true,
          verifiedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    );
    
    // Log the update result for debugging
    console.log('Doctor update result:', updateDoctorResult);
    
    // Update user verification status
    const updateUserResult = await db.collection('users').updateOne(
      { _id: doctor.userId },
      { 
        $set: { 
          verified: true,
          updatedAt: new Date()
        } 
      }
    );
    
    // Log the update result for debugging
    console.log('User update result:', updateUserResult);
    
    // Get the updated doctor record
    const updatedDoctor = await db.collection('doctors').findOne({ _id: new ObjectId(doctorId) });
    
    // Get the updated user record
    const updatedUser = await db.collection('users').findOne({ _id: doctor.userId });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Doctor verification status updated successfully',
      doctor: {
        ...updatedDoctor,
        _id: updatedDoctor._id.toString(),
        userId: updatedDoctor.userId.toString()
      },
      user: {
        ...updatedUser,
        _id: updatedUser._id.toString()
      }
    });
  } catch (error) {
    console.error('Error updating doctor verification status:', error);
    return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
  }
}