// app/api/doctors/[id]/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../lib/authServer';
import clientPromise from '../../../lib/db';
import { ObjectId } from 'mongodb';
import { getAvailableTimeSlots } from '../../../lib/googleCalendar';

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
      
      try {
        const availableSlots = await getAvailableTimeSlots(id, dateObj);
        
        // Transform MongoDB document to include id property for frontend
        return NextResponse.json({
          ...doctor,
          id: doctor._id.toString(), // Add id property that maps to _id
          availableSlots
        });
      } catch (error) {
        console.error(`Failed to get availability for doctor ${id}:`, error);
        // Transform MongoDB document to include id property for frontend
        return NextResponse.json({
          ...doctor,
          id: doctor._id.toString(), // Add id property that maps to _id
          availableSlots: [],
          availabilityError: 'Failed to get availability'
        });
      }
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