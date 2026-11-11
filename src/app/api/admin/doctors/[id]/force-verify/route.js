// app/api/admin/doctors/[id]/force-verify/route.js
// Admin-only: mark a doctor (and their user account) as verified without the approve/reject flow.
// It changes data, so it is a POST (never a GET) and requires an authenticated admin.
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import clientPromise from '../../../../../lib/db';
import { verifyAuth } from '../../../../../lib/authServer';
import { ObjectId } from 'mongodb';

export async function POST(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);

    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (auth.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const doctorId = params.id;
    if (!doctorId || !ObjectId.isValid(doctorId)) {
      return NextResponse.json({ error: 'Invalid doctor ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const doctor = await db.collection('doctors').findOne({ _id: new ObjectId(doctorId) });
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    await db.collection('doctors').updateOne(
      { _id: doctor._id },
      { $set: { verified: true, verifiedAt: new Date(), updatedAt: new Date() } }
    );

    await db.collection('users').updateOne(
      { _id: doctor.userId },
      { $set: { verified: true, updatedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: 'Doctor verification status updated successfully',
      doctor: { id: doctor._id.toString(), verified: true },
    });
  } catch (error) {
    console.error('Error updating doctor verification status:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
