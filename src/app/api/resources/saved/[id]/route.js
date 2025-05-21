// app/api/resources/saved/[id]/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/db';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '../../../../lib/authServer';

// DELETE /api/resources/saved/:id - Remove a specific saved resource
export async function DELETE(request, { params }) {
  try {
    // Get resource ID from URL params
    const resourceId = params.id;
    
    if (!resourceId) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      );
    }
    
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = auth.user.id;
    
    // Connect to database
    const client = await clientPromise;
    const db = client.db();
    
    // Remove resource from user's saved resources
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $pull: { savedResources: resourceId },
        $set: { updatedAt: new Date() }
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Resource removed from saved',
      removed: result.modifiedCount > 0
    });
  } catch (error) {
    console.error('Error removing saved resource:', error);
    return NextResponse.json(
      { error: 'Failed to remove saved resource' },
      { status: 500 }
    );
  }
}