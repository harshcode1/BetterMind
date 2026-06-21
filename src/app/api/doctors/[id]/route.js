// app/api/doctors/[id]/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../lib/authServer';
import clientPromise from '../../../lib/db';
import { ObjectId } from 'mongodb';
import { generateSlots } from '../../../lib/slotGenerator';

// Get a specific doctor with availability
export async function GET(request, { params }) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);
    
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get the doctor ID from the URL
    const { id } = params;
    
    // Validate the doctor ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid doctor ID' }, { status: 400 });
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    
    // Get the doctor
    const doctor = await db.collection('doctors').findOne({ _id: new ObjectId(id) });
    
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }
    
    // If a date is provided, get availability
    if (date) {
      const dateObj = new Date(date);
      
      // Validate the date
      if (isNaN(dateObj.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
      
      // Fetch existing confirmed/pending appointments for this doctor on this date
      const dayStart = new Date(dateObj); dayStart.setHours(0, 0, 0, 0);
      const dayEnd   = new Date(dateObj); dayEnd.setHours(23, 59, 59, 999);
      const booked = await db.collection('appointments').find({
        doctorId: new ObjectId(id),
        dateTime: { $gte: dayStart, $lte: dayEnd },
        status: { $in: ['confirmed', 'pending'] },
      }).toArray();

      const availableSlots = generateSlots(doctor, dateObj, booked);
      return NextResponse.json({
        ...doctor,
        id: doctor._id.toString(),
        availableSlots,
      });
    }
    
    // Transform MongoDB document to include id property for frontend
    const transformedDoctor = {
      ...doctor,
      id: doctor._id.toString() // Add id property that maps to _id
    };
    
    // Return the doctor without availability
    return NextResponse.json(transformedDoctor);
  } catch (error) {
    console.error('Get doctor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update a doctor (admin only)
export async function PUT(request, { params }) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);
    
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Check if the user is an admin
    if (auth.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    // Get the doctor ID from the URL
    const { id } = params;
    
    // Validate the doctor ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid doctor ID' }, { status: 400 });
    }
    
    // Parse the request body
    const body = await request.json();
    const { name, email, specialty, description, workingHours, calendarId } = body;
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    
    // Get the doctor
    const doctor = await db.collection('doctors').findOne({ _id: new ObjectId(id) });
    
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }
    
    // Check if email is being changed and if it already exists
    if (email && email !== doctor.email) {
      const existingDoctor = await db.collection('doctors').findOne({ email });
      
      if (existingDoctor) {
        return NextResponse.json({ error: 'A doctor with this email already exists' }, { status: 409 });
      }
    }
    
    // Prepare the update
    const update = {
      updatedAt: new Date()
    };
    
    // Update fields if provided
    if (name) update.name = name;
    if (email) update.email = email;
    if (specialty) update.specialty = specialty;
    if (description !== undefined) update.description = description;
    if (workingHours) update.workingHours = workingHours;
    if (calendarId !== undefined) update.calendarId = calendarId;
    
    // Update the doctor
    await db.collection('doctors').updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );
    
    // Get the updated doctor
    const updatedDoctor = await db.collection('doctors').findOne({ _id: new ObjectId(id) });
    
    // Transform MongoDB document to include id property for frontend
    const transformedDoctor = {
      ...updatedDoctor,
      id: updatedDoctor._id.toString() // Add id property that maps to _id
    };
    
    // Return the updated doctor
    return NextResponse.json({
      message: 'Doctor updated successfully',
      doctor: transformedDoctor
    });
  } catch (error) {
    console.error('Update doctor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Submit a review for a doctor (patient only)
export async function POST(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);

    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (auth.user.role !== 'patient') {
      return NextResponse.json({ error: 'Only patients can leave reviews' }, { status: 403 });
    }

    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid doctor ID' }, { status: 400 });
    }

    const { rating, comment } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const doctor = await db.collection('doctors').findOne({ _id: new ObjectId(id) });
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Verify patient has a completed appointment with this doctor
    const completedAppointment = await db.collection('appointments').findOne({
      userId: auth.user.id,
      doctorId: new ObjectId(id),
      status: { $in: ['confirmed', 'completed'] },
    });

    if (!completedAppointment) {
      return NextResponse.json({ error: 'You can only review doctors after a confirmed appointment' }, { status: 403 });
    }

    // One review per patient per doctor — upsert based on patientId
    const existingReviewIndex = (doctor.reviews || []).findIndex(
      r => r.patientId === auth.user.id
    );

    const review = {
      patientId: auth.user.id,
      patientName: auth.user.name,
      rating: Number(rating),
      comment: comment?.trim() || '',
      date: new Date(),
    };

    let updateQuery;
    if (existingReviewIndex >= 0) {
      updateQuery = { $set: { [`reviews.${existingReviewIndex}`]: review } };
    } else {
      updateQuery = { $push: { reviews: review } };
    }

    await db.collection('doctors').updateOne({ _id: new ObjectId(id) }, updateQuery);

    // Recalculate average rating
    const updatedDoctor = await db.collection('doctors').findOne({ _id: new ObjectId(id) });
    const reviews = updatedDoctor.reviews || [];
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    await db.collection('doctors').updateOne(
      { _id: new ObjectId(id) },
      { $set: { averageRating: Math.round(averageRating * 10) / 10, updatedAt: new Date() } }
    );

    return NextResponse.json({ message: 'Review submitted successfully', averageRating });
  } catch (error) {
    console.error('Submit review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete a doctor (admin only)
export async function DELETE(request, { params }) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);
    
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Check if the user is an admin
    if (auth.user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    // Get the doctor ID from the URL
    const { id } = params;
    
    // Validate the doctor ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid doctor ID' }, { status: 400 });
    }
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    
    // Check if the doctor exists
    const doctor = await db.collection('doctors').findOne({ _id: new ObjectId(id) });
    
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }
    
    // Check if the doctor has any appointments
    const appointments = await db.collection('appointments').findOne({
      doctorId: new ObjectId(id),
      status: { $in: ['confirmed', 'pending'] }
    });
    
    if (appointments) {
      return NextResponse.json({ error: 'Cannot delete a doctor with active appointments' }, { status: 400 });
    }
    
    // Delete the doctor
    await db.collection('doctors').deleteOne({ _id: new ObjectId(id) });
    
    // Return success message
    return NextResponse.json({
      message: 'Doctor deleted successfully'
    });
  } catch (error) {
    console.error('Delete doctor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}