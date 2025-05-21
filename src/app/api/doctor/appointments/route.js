import { verifyAuth } from '../../../lib/authServer';
import clientPromise from '../../../lib/db';
import { ObjectId } from 'mongodb';

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);
    
    if (!auth.authenticated) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user is a doctor
    if (auth.user.role !== 'doctor') {
      return Response.json({ error: 'Access denied. Doctor role required.' }, { status: 403 });
    }

    const doctorId = auth.user._id;
    const client = await clientPromise;
    const db = client.db();

    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');
    const past = url.searchParams.get('past') === 'true';

    // Build query
    const query = {
      doctorId: new ObjectId(doctorId)
    };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by past or upcoming
    if (past) {
      query.dateTime = { $lt: new Date().toISOString() };
    } else {
      query.dateTime = { $gte: new Date().toISOString() };
    }

    // Get appointments
    const appointments = await db.collection('appointments')
      .aggregate([
        { $match: query },
        { $sort: { dateTime: past ? -1 : 1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'patient'
          }
        },
        {
          $addFields: {
            patientName: { $arrayElemAt: ['$patient.name', 0] },
            patientEmail: { $arrayElemAt: ['$patient.email', 0] }
          }
        },
        {
          $project: {
            _id: 1,
            patientName: 1,
            patientEmail: 1,
            dateTime: 1,
            status: 1,
            notes: 1,
            googleEventId: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      ])
      .toArray();

    // Transform MongoDB documents to include id property for frontend
    const transformedAppointments = appointments.map(appointment => ({
      ...appointment,
      id: appointment._id.toString() // Add id property that maps to _id
    }));

    return Response.json(transformedAppointments);
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    return Response.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}