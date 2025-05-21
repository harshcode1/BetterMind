// app/api/resources/saved/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/db';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '../../../lib/authServer';

// GET /api/resources/saved - Get user's saved resources
export async function GET(request) {
  try {
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
    
    // Get user's saved resources
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { savedResources: 1 } }
    );
    
    const savedResources = user?.savedResources || [];
    
    return NextResponse.json({ 
      success: true, 
      resources: savedResources 
    });
  } catch (error) {
    console.error('Error fetching saved resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved resources' },
      { status: 500 }
    );
  }
}

// POST /api/resources/saved - Save a resource
export async function POST(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);
    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = auth.user.id;
    
    // Get resource ID from request body
    const body = await request.json();
    const { resourceId } = body;
    
    if (!resourceId) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      );
    }
    
    // Connect to database
    const client = await clientPromise;
    const db = client.db();
    
    // Add resource to user's saved resources if not already saved
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $addToSet: { savedResources: resourceId },
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
      message: 'Resource saved successfully',
      saved: result.modifiedCount > 0
    });
  } catch (error) {
    console.error('Error saving resource:', error);
    return NextResponse.json(
      { error: 'Failed to save resource' },
      { status: 500 }
    );
  }
}

// DELETE /api/resources/saved/:id - Remove a saved resource
export async function DELETE(request, { params }) {
  try {
    // Get resource ID from URL
    const url = new URL(request.url);
    const resourceId = url.pathname.split('/').pop();
    
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