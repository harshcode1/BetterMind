// app/api/appointments/[id]/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../lib/authServer';
import clientPromise from '../../../lib/db';
import { ObjectId } from 'mongodb';
import { 
  createCalendarClient, 
  getAvailableTimeSlots, 
  updateAppointment as updateGoogleAppointment,
  cancelAppointment as cancelGoogleAppointment
} from '../../../lib/googleCalendar';

// Get a specific appointment
export async function GET(request, { params }) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);
    
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get the user ID from the authenticated user
    const userId = auth.user.id;
    
    // Get the appointment ID from the URL
    const { id } = params;
    
    // Validate the appointment ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });
    }
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    
    // Get the appointment
    const appointment = await db.collection('appointments').findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(userId)
    });
    
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    
    // Get the doctor details
    const doctor = await db.collection('doctors').findOne({ _id: appointment.doctorId });
    
    // Transform doctor to include id property
    const transformedDoctor = doctor ? {
      ...doctor,
      id: doctor._id.toString() // Add id property that maps to _id
    } : null;
    
    // Return the appointment with doctor details and id property
    return NextResponse.json({
      ...appointment,
      id: appointment._id.toString(), // Add id property that maps to _id
      doctor: transformedDoctor
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update an appointment
export async function PUT(request, { params }) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);
    
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get the user ID from the authenticated user
    const userId = auth.user.id;
    
    // Get the appointment ID from the URL
    const { id } = params;
    
    // Validate the appointment ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });
    }
    
    // Parse the request body
    const body = await request.json();
    const { dateTime, notes, status } = body;
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    
    // Get the appointment
    const appointment = await db.collection('appointments').findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(userId)
    });
    
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    
    // Check if the appointment is already cancelled
    if (appointment.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot update a cancelled appointment' }, { status: 400 });
    }
    
    // Prepare the update
    const update = {
      updatedAt: new Date()
    };
    
    // If notes are provided, update them
    if (notes !== undefined) {
      update.notes = notes;
    }
    
    // If status is provided, update it
    if (status !== undefined) {
      update.status = status;
    }
    
    // If dateTime is provided, check availability and update
    if (dateTime !== undefined) {
      const newDateTime = new Date(dateTime);
      
      // Skip availability check if the time hasn't changed
      const currentDateTime = new Date(appointment.dateTime);
      const timeChanged = newDateTime.getTime() !== currentDateTime.getTime();
      
      if (timeChanged) {
        // Check if the new time slot is available
        const availableSlots = await getAvailableTimeSlots(
          appointment.doctorId.toString(),
          newDateTime
        );
        
        const isSlotAvailable = availableSlots.some(slot => {
          const slotTime = new Date(slot);
          return slotTime.getTime() === newDateTime.getTime();
        });
        
        if (!isSlotAvailable) {
          return NextResponse.json({ error: 'The selected time slot is not available' }, { status: 400 });
        }
        
        // Check for conflicts with existing appointments
        const existingAppointment = await db.collection('appointments').findOne({
          _id: { $ne: new ObjectId(id) },
          doctorId: appointment.doctorId,
          dateTime: newDateTime,
          status: { $in: ['confirmed', 'pending'] }
        });
        
        if (existingAppointment) {
          return NextResponse.json({ error: 'There is already an appointment at this time' }, { status: 409 });
        }
        
        update.dateTime = newDateTime;
      }
    }
    
    // Update the appointment in Google Calendar if needed
    if (appointment.googleEventId && (update.dateTime || update.status === 'cancelled')) {
      try {
        // Get the user's Google tokens
        const tokens = await db.collection('googleTokens').findOne({ userId: new ObjectId(userId) });
        
        if (tokens) {
          // Create a calendar client
          const calendar = createCalendarClient(tokens);
          
          if (update.status === 'cancelled') {
            // Cancel the appointment in Google Calendar
            await cancelGoogleAppointment(calendar, appointment.googleEventId);
          } else if (update.dateTime) {
            // Get the doctor
            const doctor = await db.collection('doctors').findOne({ _id: appointment.doctorId });
            
            // Update the appointment in Google Calendar
            await updateGoogleAppointment(
              calendar,
              appointment.googleEventId,
              {
                summary: `Appointment with Dr. ${doctor.name}`,
                description: update.notes || appointment.notes || 'No additional notes',
                startTime: update.dateTime,
                endTime: new Date(update.dateTime.getTime() + 60 * 60 * 1000), // 1 hour appointment
                doctorEmail: doctor.email
              }
            );
          }
        }
      } catch (error) {
        console.error('Failed to update Google Calendar event:', error);
        // Continue without Google Calendar integration
      }
    }
    
    // Update the appointment in the database
    await db.collection('appointments').updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );
    
    // Get the updated appointment
    const updatedAppointment = await db.collection('appointments').findOne({ _id: new ObjectId(id) });
    
    // Return the updated appointment with id property
    return NextResponse.json({
      message: 'Appointment updated successfully',
      appointment: {
        ...updatedAppointment,
        id: updatedAppointment._id.toString() // Add id property that maps to _id
      }
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Cancel an appointment
export async function DELETE(request, { params }) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);
    
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get the user ID from the authenticated user
    const userId = auth.user.id;
    
    // Get the appointment ID from the URL
    const { id } = params;
    
    // Validate the appointment ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });
    }
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    
    // Get the appointment
    const appointment = await db.collection('appointments').findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(userId)
    });
    
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }
    
    // Check if the appointment is already cancelled
    if (appointment.status === 'cancelled') {
      return NextResponse.json({ error: 'Appointment is already cancelled' }, { status: 400 });
    }
    
    // Cancel the appointment in Google Calendar if needed
    if (appointment.googleEventId) {
      try {
        // Get the user's Google tokens
        const tokens = await db.collection('googleTokens').findOne({ userId: new ObjectId(userId) });
        
        if (tokens) {
          // Create a calendar client
          const calendar = createCalendarClient(tokens);
          
          // Cancel the appointment in Google Calendar
          await cancelGoogleAppointment(calendar, appointment.googleEventId);
        }
      } catch (error) {
        console.error('Failed to cancel Google Calendar event:', error);
        // Continue without Google Calendar integration
      }
    }
    
    // Update the appointment status to cancelled
    await db.collection('appointments').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          status: 'cancelled',
          updatedAt: new Date()
        }
      }
    );
    
    // Return success message
    return NextResponse.json({
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}