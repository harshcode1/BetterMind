// app/api/appointments/[id]/route.js (continued)
import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../lib/auth';
import clientPromise from '../../../lib/db';
import { ObjectId } from 'mongodb';

// Get single appointment
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const auth = await verifyAuth(request);

    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    
    const appointment = await db.collection('appointments').aggregate([
      { 
        $match: { 
          _id: new ObjectId(id),
          userId: new ObjectId(auth.user.id)
        } 
      },
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      {
        $unwind: '$doctor'
      }
    ]).toArray();

    if (!appointment.length) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    const apt = appointment[0];
    return NextResponse.json({
      id: apt._id.toString(),
      doctor: {
        id: apt.doctor._id.toString(),
        name: apt.doctor.name,
        specialty: apt.doctor.specialty
      },
      date: apt.date,
      time: apt.time,
      reason: apt.reason,
      status: apt.status,
      createdAt: apt.createdAt
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update appointment
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { date, time, reason, status } = await request.json();
    const auth = await verifyAuth(request);

    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Verify the appointment belongs to the user
    const existingAppointment = await db.collection('appointments').findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(auth.user.id)
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // If date or time is changing, check for conflicts
    if ((date && date !== existingAppointment.date) || (time && time !== existingAppointment.time)) {
      const conflictingAppointment = await db.collection('appointments').findOne({
        doctorId: existingAppointment.doctorId,
        date: date || existingAppointment.date,
        time: time || existingAppointment.time,
        _id: { $ne: new ObjectId(id) },
        status: { $ne: 'cancelled' }
      });

      if (conflictingAppointment) {
        return NextResponse.json(
          { error: 'This time slot is already booked' },
          { status: 400 }
        );
      }
    }

    // Update the appointment
    const result = await db.collection('appointments').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...(date && { date }),
          ...(time && { time }),
          ...(reason && { reason }),
          ...(status && { status }),
          updatedAt: new Date()
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Appointment updated successfully'
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Cancel appointment
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const auth = await verifyAuth(request);

    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Verify the appointment belongs to the user
    const existingAppointment = await db.collection('appointments').findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(auth.user.id)
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Cancel the appointment instead of deleting it
    const result = await db.collection('appointments').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'cancelled',
          updatedAt: new Date()
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to cancel appointment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}