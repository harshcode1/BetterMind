// app/api/appointments/sync/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../lib/authServer';
import clientPromise from '../../../lib/db';
import { ObjectId } from 'mongodb';
import {
  createAppointment as createGoogleAppointment,
  updateAppointment as updateGoogleAppointment,
  cancelAppointment as cancelGoogleAppointment,
  refreshTokensIfNeeded
} from '../../../lib/googleCalendar';

// Map MongoDB token document fields to the format googleapis expects
function toGoogleTokens(doc) {
  return {
    access_token: doc.accessToken,
    refresh_token: doc.refreshToken,
    expiry_date: doc.expiryDate ? new Date(doc.expiryDate).getTime() : undefined,
  };
}

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);

    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = auth.user.id;
    const client = await clientPromise;
    const db = client.db();

    // Get user's stored Google tokens
    const tokenDoc = await db.collection('googleTokens').findOne({ userId });

    if (!tokenDoc) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    // Convert to googleapis token format and refresh if needed
    let tokens = toGoogleTokens(tokenDoc);
    const refreshed = await refreshTokensIfNeeded(tokens);
    if (!refreshed) {
      return NextResponse.json({ error: 'Google Calendar token is invalid or expired. Please reconnect.' }, { status: 401 });
    }

    // If tokens were refreshed, persist them
    if (refreshed !== tokens) {
      await db.collection('googleTokens').updateOne(
        { userId },
        {
          $set: {
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token || tokenDoc.refreshToken,
            expiryDate: refreshed.expiry_date ? new Date(refreshed.expiry_date) : tokenDoc.expiryDate,
            updatedAt: new Date(),
          },
        }
      );
      tokens = refreshed;
    }

    const userEmail = auth.user.email;

    const appointments = await db.collection('appointments')
      .find({ userId })
      .toArray();

    const results = await Promise.allSettled(
      appointments.map(async (appointment) => {
        try {
          if (appointment.status === 'cancelled' && appointment.googleEventId) {
            return { id: appointment._id.toString(), status: 'skipped', message: 'Already cancelled' };
          }

          const doctor = await db.collection('doctors').findOne({ _id: appointment.doctorId });

          if (!doctor) {
            return { id: appointment._id.toString(), status: 'error', message: 'Doctor not found' };
          }

          const doctorCalendarId = doctor.email;
          const startTime = new Date(appointment.dateTime).toISOString();
          const endTime = new Date(new Date(appointment.dateTime).getTime() + 60 * 60 * 1000).toISOString();

          const eventData = {
            patientName: auth.user.name,
            reason: appointment.notes || 'Mental health consultation',
            startTime,
            endTime,
          };

          if (appointment.googleEventId) {
            if (appointment.status === 'cancelled') {
              await cancelGoogleAppointment(doctorCalendarId, appointment.googleEventId, tokens);
              return { id: appointment._id.toString(), status: 'cancelled', message: 'Cancelled in Google Calendar' };
            } else {
              await updateGoogleAppointment(doctorCalendarId, appointment.googleEventId, eventData, tokens);
              return { id: appointment._id.toString(), status: 'updated', message: 'Updated in Google Calendar' };
            }
          } else {
            const event = await createGoogleAppointment(doctorCalendarId, userEmail, eventData, tokens);
            await db.collection('appointments').updateOne(
              { _id: appointment._id },
              { $set: { googleEventId: event.id, updatedAt: new Date() } }
            );
            return { id: appointment._id.toString(), status: 'created', message: 'Created in Google Calendar' };
          }
        } catch (err) {
          console.error(`Failed to sync appointment ${appointment._id}:`, err);
          return { id: appointment._id.toString(), status: 'error', message: err.message || 'Sync failed' };
        }
      })
    );

    const counts = results.reduce((acc, r) => {
      const s = r.status === 'fulfilled' ? r.value.status : 'error';
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      message: 'Appointments synced with Google Calendar',
      counts,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { status: 'error', message: r.reason?.message }),
    });
  } catch (error) {
    console.error('Sync appointments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
