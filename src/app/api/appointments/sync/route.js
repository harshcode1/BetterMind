// app/api/appointments/sync/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../lib/authServer';
import clientPromise from '../../../lib/db';
import { ObjectId } from 'mongodb';
import { 
  createCalendarClient, 
  createAppointment as createGoogleAppointment,
  updateAppointment as updateGoogleAppointment,
  cancelAppointment as cancelGoogleAppointment
} from '../../../lib/googleCalendar';

// Sync appointments with Google Calendar
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
    
    // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    
    // Get the user's Google tokens
    const tokens = await db.collection('googleTokens').findOne({ userId: new ObjectId(userId) });
    
    if (!tokens) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }
    
    // Create a calendar client
    const calendar = createCalendarClient(tokens);
    
    // Get all appointments for the user
    const appointments = await db.collection('appointments')
      .find({ userId: new ObjectId(userId) })
      .toArray();
    
    // Sync each appointment with Google Calendar
    const results = await Promise.allSettled(
      appointments.map(async (appointment) => {
        try {
          // Skip cancelled appointments that are already synced
          if (appointment.status === 'cancelled' && appointment.googleEventId) {
            return {
              appointmentId: appointment._id,
              id: appointment._id.toString(), // Add id property that maps to _id
              status: 'skipped',
              message: 'Appointment already cancelled'
            };
          }
          
          // Get the doctor
          const doctor = await db.collection('doctors').findOne({ _id: appointment.doctorId });
          
          if (!doctor) {
            return {
              appointmentId: appointment._id,
              id: appointment._id.toString(), // Add id property that maps to _id
              status: 'error',
              message: 'Doctor not found'
            };
          }
          
          // Prepare the event data
          const eventData = {
            summary: `Appointment with Dr. ${doctor.name}`,
            description: appointment.notes || 'No additional notes',
            startTime: new Date(appointment.dateTime),
            endTime: new Date(new Date(appointment.dateTime).getTime() + 60 * 60 * 1000), // 1 hour appointment
            doctorEmail: doctor.email
          };
          
          // If the appointment is already in Google Calendar, update it
          if (appointment.googleEventId) {
            if (appointment.status === 'cancelled') {
              // Cancel the appointment in Google Calendar
              await cancelGoogleAppointment(calendar, appointment.googleEventId);
              
              return {
                appointmentId: appointment._id,
                id: appointment._id.toString(), // Add id property that maps to _id
                status: 'cancelled',
                message: 'Appointment cancelled in Google Calendar'
              };
            } else {
              // Update the appointment in Google Calendar
              await updateGoogleAppointment(calendar, appointment.googleEventId, eventData);
              
              return {
                appointmentId: appointment._id,
                id: appointment._id.toString(), // Add id property that maps to _id
                status: 'updated',
                message: 'Appointment updated in Google Calendar'
              };
            }
          } else {
            // Create the appointment in Google Calendar
            const event = await createGoogleAppointment(calendar, eventData);
            
            // Update the appointment with the Google Calendar event ID
            await db.collection('appointments').updateOne(
              { _id: appointment._id },
              { 
                $set: {
                  googleEventId: event.id,
                  updatedAt: new Date()
                }
              }
            );
            
            return {
              appointmentId: appointment._id,
              id: appointment._id.toString(), // Add id property that maps to _id
              status: 'created',
              message: 'Appointment created in Google Calendar'
            };
          }
        } catch (error) {
          console.error(`Failed to sync appointment ${appointment._id}:`, error);
          return {
            appointmentId: appointment._id,
            id: appointment._id.toString(), // Add id property that maps to _id
            status: 'error',
            message: error.message || 'Failed to sync appointment'
          };
        }
      })
    );
    
    // Count the results
    const counts = results.reduce((acc, result) => {
      if (result.status === 'fulfilled') {
        acc[result.value.status] = (acc[result.value.status] || 0) + 1;
      } else {
        acc.error = (acc.error || 0) + 1;
      }
      return acc;
    }, {});
    
    // Return the results
    return NextResponse.json({
      message: 'Appointments synced with Google Calendar',
      counts,
      results: results.map(result => 
        result.status === 'fulfilled' ? result.value : { 
          status: 'error', 
          message: result.reason.message,
          id: result.reason.appointmentId?.toString() // Add id property if available
        }
      )
    });
  } catch (error) {
    console.error('Sync appointments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}