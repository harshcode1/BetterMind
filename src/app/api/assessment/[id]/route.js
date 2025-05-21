// app/api/assessment/[id]/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/db';
import { verifyAuth } from '../../../lib/authServer';
import { ObjectId } from 'mongodb';

// Get a specific assessment by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid assessment ID' },
        { status: 400 }
      );
    }
    
    // Get token from cookies
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);
    
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    
    const assessment = await db.collection('assessments').findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(auth.user.id) // Ensure user can only access their own assessments
    });

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      assessment: {
        id: assessment._id.toString(),
        phq9Score: assessment.phq9Score,
        gad7Score: assessment.gad7Score,
        depressionSeverity: assessment.depressionSeverity,
        anxietySeverity: assessment.anxietySeverity,
        phq9Answers: assessment.phq9Answers,
        gad7Answers: assessment.gad7Answers,
        date: assessment.createdAt || assessment.date
      }
    });
  } catch (error) {
    console.error('Get assessment details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a specific assessment
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid assessment ID' },
        { status: 400 }
      );
    }
    
    // Get token from cookies
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);
    
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    
    // First check if the assessment exists and belongs to the user
    const assessment = await db.collection('assessments').findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(auth.user.id)
    });

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }
    
    // Delete the assessment
    const result = await db.collection('assessments').deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(auth.user.id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to delete assessment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Assessment deleted successfully'
    });
  } catch (error) {
    console.error('Delete assessment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}