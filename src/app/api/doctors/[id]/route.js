// app/api/doctors/[id]/route.js
import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/db';
import { verifyAuth } from '../../../lib/auth';
import { ObjectId } from 'mongodb';

// Get doctor by ID
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
    
    const doctor = await db.collection('doctors').findOne({ _id: new ObjectId(id) });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Get doctor's available time slots
    const now = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(now.getDate() + 14);

    // Format date to YYYY-MM-DD
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };

    const bookedSlots = await db.collection('appointments').find({
      doctorId: new ObjectId(id),
      status: { $ne: 'cancelled' },
      date: { 
        $gte: formatDate(now),
        $lte: formatDate(twoWeeksFromNow)
      }
    }).toArray();

    // Calculate available slots
    const availableSlots = {};
    const workingDays = doctor.availability.split(', ');
    
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(now.getDate() + i);
      const dayName = date.toLocaleString('en-US', { weekday: 'short' });
      
      if (workingDays.includes(dayName)) {
        const dateString = formatDate(date);
        availableSlots[dateString] = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
      }
    }

    // Remove booked slots
    bookedSlots.forEach(slot => {
      if (availableSlots[slot.date]) {
        const index = availableSlots[slot.date].indexOf(slot.time);
        if (index > -1) {
          availableSlots[slot.date].splice(index, 1);
        }
      }
    });

    return NextResponse.json({
      id: doctor._id.toString(),
      name: doctor.name,
      specialty: doctor.specialty,
      location: doctor.location,
      price: doctor.price,
      availability: doctor.availability,
      bio: doctor.bio,
      image: doctor.image || null,
      availableSlots
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}