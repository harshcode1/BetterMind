// app/api/auth/2fa/disable/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/authServer';
import { verifyTOTPToken } from '../../../../lib/twoFactorAuth';
import clientPromise from '../../../../lib/db';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);

    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'Verification code required to disable 2FA' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection('users').findOne({ _id: new ObjectId(auth.user.id) });
    if (!user?.twoFactorAuth?.enabled || !user?.twoFactorAuth?.secret) {
      return NextResponse.json({ error: '2FA is not enabled' }, { status: 400 });
    }

    const isValid = verifyTOTPToken(code, user.twoFactorAuth.secret);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 401 });
    }

    await db.collection('users').updateOne(
      { _id: new ObjectId(auth.user.id) },
      {
        $set: {
          twoFactorAuth: { enabled: false, method: null, secret: null, setupComplete: false, recoveryCodesHashed: [] },
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
