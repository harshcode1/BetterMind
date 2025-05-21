// app/api/mood/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import clientPromise from '../../lib/db';
import { verifyAuth } from '../../lib/authServer';
import { ObjectId } from 'mongodb';
import { encryptDocument, decryptDocument } from '../../lib/encryption';

// Record mood
export async function POST(request) {
  try {
    const { mood, notes, activities } = await request.json();
    
    // Get token from cookies
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);

    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401}
      );
    }

    if (!mood || mood < 1 || mood > 10) {
      return NextResponse.json(
        { error: 'Mood must be a number between 1 and 10' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    
    // Create mood document
    const moodDoc = {
      userId: new ObjectId(auth.user.id),
      mood,
      notes,
      activities: activities || [],
      createdAt: new Date()
    };
    
    // Encrypt sensitive fields (notes)
    const encryptedMoodDoc = encryptDocument(auth.user.id, moodDoc, 'mood');
    
    const result = await db.collection('moods').insertOne(encryptedMoodDoc);

    return NextResponse.json({
      id: result.insertedId.toString(),
      message: 'Mood recorded successfully'
    });
  } catch (error) {
    console.error('Record mood error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get mood history
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
    const days = parseInt(url.searchParams.get('days') || '30');
    
    const client = await clientPromise;
    const db = client.db();
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const moods = await db.collection('moods')
      .find({
        userId: new ObjectId(auth.user.id),
        createdAt: { $gte: startDate }
      })
      .sort({ createdAt: 1 })
      .toArray();
    
    // Decrypt sensitive fields in each mood entry
    const decryptedMoods = moods.map(mood => decryptDocument(auth.user.id, mood));

    return NextResponse.json({
      moods: decryptedMoods.map(mood => ({
        id: mood._id.toString(),
        mood: mood.mood,
        notes: mood.notes,
        activities: mood.activities,
        createdAt: mood.createdAt
      }))
    });
  } catch (error) {
    console.error('Get mood history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}