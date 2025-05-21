// app/api/doctors/route.js
// Use dynamic = 'auto' for better caching with revalidation
export const revalidate = 60; // Revalidate every 60 seconds

import { NextResponse } from 'next/server';
import { verifyAuth } from '../../lib/authServer';
import clientPromise from '../../lib/db';
import { getAvailableTimeSlots } from '../../lib/googleCalendar';

// Get all doctors with availability
export async function GET(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);
    
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const specialty = url.searchParams.get('specialty');
    const date = url.searchParams.get('date');
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    
    // Build the query
    const query = {};
    
    // Filter by specialty if provided
    if (specialty) {
      query.specialty = specialty;
    }
    
    // Get all doctors matching the query
    const doctors = await db.collection('doctors').find(query).toArray();
    
    // If a date is provided, get availability for each doctor
    if (date) {
      const dateObj = new Date(date);
      
      // Validate the date
      if (isNaN(dateObj.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
      
      // Get availability for each doctor
      const doctorsWithAvailability = await Promise.all(
        doctors.map(async (doctor) => {
          try {
            const availableSlots = await getAvailableTimeSlots(doctor._id.toString(), dateObj);
            return {
              ...doctor,
              id: doctor._id.toString(), // Add id property that maps to _id
              availableSlots
            };
          } catch (error) {
            console.error(`Failed to get availability for doctor ${doctor._id}:`, error);
            return {
              ...doctor,
              id: doctor._id.toString(), // Add id property that maps to _id
              availableSlots: [],
              availabilityError: 'Failed to get availability'
            };
          }
        })
      );
      
      return NextResponse.json({ doctors: doctorsWithAvailability });
    }
    
    // Transform MongoDB documents to include id property for frontend
    const transformedDoctors = doctors.map(doctor => ({
      ...doctor,
      id: doctor._id.toString() // Add id property that maps to _id
    }));
    
    // Return all doctors without availability in a consistent format
    return NextResponse.json({ doctors: transformedDoctors });
  } catch (error) {
    console.error('Get doctors error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new doctor (admin only)
export async function POST(request) {
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
    
    // Parse the request body
    const body = await request.json();
    const { name, email, specialty, description, workingHours, calendarId } = body;
    
    // Validate required fields
    if (!name || !email || !specialty) {
      return NextResponse.json({ error: 'Name, email, and specialty are required' }, { status: 400 });
    }
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    
    // Check if a doctor with the same email already exists
    const existingDoctor = await db.collection('doctors').findOne({ email });
    
    if (existingDoctor) {
      return NextResponse.json({ error: 'A doctor with this email already exists' }, { status: 409 });
    }
    
    // Create the doctor
    const doctor = {
      name,
      email,
      specialty,
      description: description || '',
      workingHours: workingHours || {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' }
      },
      calendarId: calendarId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('doctors').insertOne(doctor);
    
    // Return the created doctor with id property
    return NextResponse.json({
      message: 'Doctor created successfully',
      doctor: {
        ...doctor,
        _id: result.insertedId,
        id: result.insertedId.toString() // Add id property that maps to _id
      }
    });
  } catch (error) {
    console.error('Create doctor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}