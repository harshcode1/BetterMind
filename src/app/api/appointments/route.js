// app/api/appointments/route.js
// Use dynamic = 'auto' for better caching with revalidation
export const revalidate = 60; // Revalidate every 60 seconds

import { NextResponse } from 'next/server';
import { verifyAuth } from '../../lib/authServer';
import clientPromise from '../../lib/db';
import { ObjectId } from 'mongodb';
import { 
  createCalendarClient, 
  getAvailableTimeSlots, 
  createAppointment as createGoogleAppointment 
} from '../../lib/googleCalendar';

// Create a new appointment
export async function POST(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);
    
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get the user ID from the authenticated user
    const userId = auth.user.id;
    
    // Parse the request body
    const body = await request.json();
    const { doctorId, dateTime, notes, useGoogleCalendar } = body;
    
    // Validate required fields
    if (!doctorId || !dateTime) {
      return NextResponse.json({ error: 'Doctor ID and date/time are required' }, { status: 400 });
    }
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    
    // Get the doctor
    const doctor = await db.collection('doctors').findOne({ _id: new ObjectId(doctorId) });
    
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }
    
    // Parse the date/time
    const appointmentDateTime = new Date(dateTime);
    
    // Check if the time slot is available
    const availableSlots = await getAvailableTimeSlots(doctorId, appointmentDateTime);
    const isSlotAvailable = availableSlots.some(slot => {
      const slotTime = new Date(slot);
      return slotTime.getTime() === appointmentDateTime.getTime();
    });
    
    if (!isSlotAvailable) {
      return NextResponse.json({ error: 'The selected time slot is not available' }, { status: 400 });
    }
    
    // Check for conflicts with existing appointments
    const existingAppointment = await db.collection('appointments').findOne({
      doctorId: new ObjectId(doctorId),
      dateTime: appointmentDateTime,
      status: { $in: ['confirmed', 'pending'] }
    });
    
    if (existingAppointment) {
      return NextResponse.json({ error: 'There is already an appointment at this time' }, { status: 409 });
    }
    
    // Create the appointment in Google Calendar if requested
    let googleEventId = null;
    try {
      // Only create Google Calendar event if explicitly requested
      if (useGoogleCalendar) {
        // Get the user's Google tokens
        const tokens = await db.collection('googleTokens').findOne({ userId });
        
        if (tokens) {
          // Create a calendar client
          const calendar = createCalendarClient(tokens);
          
          // Create the appointment in Google Calendar
          const event = await createGoogleAppointment(
            calendar,
            {
              summary: `Appointment with Dr. ${doctor.name}`,
              description: notes || 'No additional notes',
              startTime: appointmentDateTime,
              endTime: new Date(appointmentDateTime.getTime() + 60 * 60 * 1000), // 1 hour appointment
              doctorEmail: doctor.email
            }
          );
          
          googleEventId = event.id;
        }
      }
    } catch (error) {
      console.error('Failed to create Google Calendar event:', error);
      // Continue without Google Calendar integration
    }
    
    // Create the appointment in the database
    const appointment = {
      userId: new ObjectId(userId),
      doctorId: new ObjectId(doctorId),
      doctorName: doctor.name,
      specialty: doctor.specialty,
      dateTime: appointmentDateTime,
      notes: notes || '',
      status: 'confirmed',
      googleEventId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('appointments').insertOne(appointment);
    
    // Return the created appointment with id property
    return NextResponse.json({
      message: 'Appointment created successfully',
      appointment: {
        ...appointment,
        _id: result.insertedId,
        id: result.insertedId.toString() // Add id property that maps to _id
      }
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get all appointments for the authenticated user
export async function GET(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);
    
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get the user ID from the authenticated user
    const userId = auth.user.id;
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    
    // Get all appointments for the user
    const appointments = await db.collection('appointments')
      .find({ userId: new ObjectId(userId) })
      .sort({ dateTime: -1 })
      .toArray();
    
    // Transform MongoDB documents to include id property for frontend
    const transformedAppointments = appointments.map(appointment => ({
      ...appointment,
      id: appointment._id.toString() // Add id property that maps to _id
    }));
    
    // Return the appointments
    return NextResponse.json(transformedAppointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}