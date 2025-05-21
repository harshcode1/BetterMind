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
    const skip = parseInt(url.searchParams.get('skip') || '0');
    const minRating = parseInt(url.searchParams.get('minRating') || '1');
    const maxRating = parseInt(url.searchParams.get('maxRating') || '5');

    // Get reviews
    const reviews = await db.collection('reviews')
      .aggregate([
        { 
          $match: { 
            doctorId: new ObjectId(doctorId),
            rating: { $gte: minRating, $lte: maxRating }
          } 
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
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
            patientName: { $arrayElemAt: ['$patient.name', 0] }
          }
        },
        {
          $project: {
            _id: 1,
            patientName: 1,
            rating: 1,
            comment: 1,
            appointmentId: 1,
            createdAt: 1,
            response: 1
          }
        }
      ])
      .toArray();

    // Transform MongoDB documents to include id property for frontend
    const transformedReviews = reviews.map(review => ({
      ...review,
      id: review._id.toString() // Add id property that maps to _id
    }));

    // Get total count for pagination
    const totalCount = await db.collection('reviews').countDocuments({
      doctorId: new ObjectId(doctorId),
      rating: { $gte: minRating, $lte: maxRating }
    });

    return Response.json({
      reviews: transformedReviews,
      totalCount,
      currentPage: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Error fetching doctor reviews:', error);
    return Response.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// Add endpoint to respond to reviews
export async function POST(request) {
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
    const { reviewId, response } = await request.json();

    if (!reviewId || !response) {
      return Response.json({ error: 'Review ID and response are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Verify the review belongs to this doctor
    const review = await db.collection('reviews').findOne({
      _id: new ObjectId(reviewId),
      doctorId: new ObjectId(doctorId)
    });

    if (!review) {
      return Response.json({ error: 'Review not found or does not belong to you' }, { status: 404 });
    }

    // Update the review with the doctor's response
    const result = await db.collection('reviews').updateOne(
      { _id: new ObjectId(reviewId) },
      { 
        $set: { 
          response,
          respondedAt: new Date().toISOString()
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return Response.json({ error: 'Failed to update review' }, { status: 500 });
    }

    return Response.json({ 
      success: true, 
      message: 'Response added successfully',
      review: {
        ...review,
        id: review._id.toString(), // Add id property that maps to _id
        response,
        respondedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error responding to review:', error);
    return Response.json({ error: 'Failed to respond to review' }, { status: 500 });
  }
}