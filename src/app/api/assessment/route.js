// app/api/assessment/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import clientPromise from '../../lib/db';
import { verifyAuth } from '../../lib/authServer';
import { ObjectId } from 'mongodb';
import { encryptDocument, decryptDocument } from '../../lib/encryption';

// Save assessment results
export async function POST(request) {
  try {
    const assessmentData = await request.json();
    
    // Get token from cookies
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);

    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!assessmentData.phq9Score || !assessmentData.gad7Score) {
      return NextResponse.json(
        { error: 'Assessment scores are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Add user ID and timestamp to assessment data
    const assessmentToSave = {
      ...assessmentData,
      userId: new ObjectId(auth.user.id),
      createdAt: new Date()
    };
    
    // Encrypt sensitive fields (phq9Answers, gad7Answers)
    const encryptedAssessment = encryptDocument(auth.user.id, assessmentToSave, 'assessment');
    
    const result = await db.collection('assessments').insertOne(encryptedAssessment);

    return NextResponse.json({
      id: result.insertedId.toString(),
      message: 'Assessment saved successfully'
    });
  } catch (error) {
    console.error('Save assessment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get assessment history
export async function GET(request) {
  try {
    // Get token from cookies
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);
    
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const includeAnswers = url.searchParams.get('includeAnswers') === 'true';
    
    const client = await clientPromise;
    const db = client.db();
    
    const assessments = await db.collection('assessments')
      .find({
        userId: new ObjectId(auth.user.id)
      })
      .sort({ createdAt: -1 }) // Most recent first
      .limit(limit)
      .toArray();
    
    // Decrypt sensitive fields in each assessment
    const decryptedAssessments = assessments.map(assessment => 
      decryptDocument(auth.user.id, assessment)
    );

    return NextResponse.json({
      assessments: decryptedAssessments.map(assessment => {
        // Basic assessment data that's always included
        const assessmentData = {
          id: assessment._id.toString(),
          phq9Score: assessment.phq9Score,
          gad7Score: assessment.gad7Score,
          depressionSeverity: assessment.depressionSeverity,
          anxietySeverity: assessment.anxietySeverity,
          date: assessment.createdAt || assessment.date
        };
        
        // Include detailed answers only if requested
        if (includeAnswers) {
          assessmentData.phq9Answers = assessment.phq9Answers;
          assessmentData.gad7Answers = assessment.gad7Answers;
        }
        
        return assessmentData;
      })
    });
  } catch (error) {
    console.error('Get assessment history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}