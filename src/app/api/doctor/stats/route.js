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

    // Get upcoming appointments count
    const upcomingAppointments = await db.collection('appointments').countDocuments({
      doctorId: new ObjectId(doctorId),
      dateTime: { $gte: new Date().toISOString() },
      status: { $ne: 'cancelled' }
    });

    // Get total unique patients
    const uniquePatientsResult = await db.collection('appointments').aggregate([
      { $match: { doctorId: new ObjectId(doctorId) } },
      { $group: { _id: '$userId' } },
      { $count: 'totalPatients' }
    ]).toArray();
    
    const totalPatients = uniquePatientsResult.length > 0 ? uniquePatientsResult[0].totalPatients : 0;

    // Get pending reviews count (appointments without reviews)
    const completedAppointments = await db.collection('appointments').countDocuments({
      doctorId: new ObjectId(doctorId),
      dateTime: { $lt: new Date().toISOString() },
      status: 'confirmed'
    });

    const reviewsCount = await db.collection('reviews').countDocuments({
      doctorId: new ObjectId(doctorId)
    });

    const pendingReviews = Math.max(0, completedAppointments - reviewsCount);

    // Get average rating
    const reviewsResult = await db.collection('reviews').aggregate([
      { $match: { doctorId: new ObjectId(doctorId) } },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } }
    ]).toArray();
    
    const averageRating = reviewsResult.length > 0 ? reviewsResult[0].averageRating : 0;

    // Return stats
    return Response.json({
      upcomingAppointments,
      totalPatients,
      pendingReviews,
      averageRating
    });
  } catch (error) {
    console.error('Error fetching doctor stats:', error);
    return Response.json({ error: 'Failed to fetch doctor stats' }, { status: 500 });
  }
}