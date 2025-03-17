// app/api/doctors/route.js
import { NextResponse } from 'next/server';
import clientPromise from '../../lib/db';
import { verifyAuth } from '../../lib/auth';
import { useState } from 'react';






// Get all doctors
export async function GET(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    
    const doctors = await db.collection('doctors').find({}).toArray();

    return NextResponse.json({
      doctors: doctors.map(doc => ({
        id: doc._id.toString(),
        name: doc.name,
        specialty: doc.specialty,
        location: doc.location,
        price: doc.price,
        availability: doc.availability,
        bio: doc.bio,
        image: doc.image || null
      }))
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
