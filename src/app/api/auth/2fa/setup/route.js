// app/api/auth/2fa/setup/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { verifyAuth } from '../../../../lib/authServer';
import { createTwoFactorSetup, verifyTOTPToken, generateRecoveryCodes, hashRecoveryCode } from '../../../../lib/twoFactorAuth';
import clientPromise from '../../../../lib/db';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// GET — generate a new TOTP secret and QR code (does not enable 2FA yet)
export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);

    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const setup = createTwoFactorSetup(auth.user.id, auth.user.email);

    // Store the pending secret temporarily (not yet activated)
    const client = await clientPromise;
    const db = client.db();
    await db.collection('users').updateOne(
      { _id: new ObjectId(auth.user.id) },
      { $set: { 'twoFactorAuth.pendingSecret': setup.secret, updatedAt: new Date() } }
    );

    return NextResponse.json({
      qrCodeUrl: setup.qrCodeUrl,
      secret: setup.secret,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — confirm the TOTP code and activate 2FA
export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);

    if (!auth.authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection('users').findOne({ _id: new ObjectId(auth.user.id) });
    const pendingSecret = user?.twoFactorAuth?.pendingSecret;

    if (!pendingSecret) {
      return NextResponse.json({ error: 'No pending 2FA setup found. Please start setup again.' }, { status: 400 });
    }

    const isValid = verifyTOTPToken(code, pendingSecret);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code. Please try again.' }, { status: 400 });
    }

    // Generate recovery codes
    const recoveryCodes = generateRecoveryCodes(10);
    const hashedRecoveryCodes = recoveryCodes.map(hashRecoveryCode);

    // Activate 2FA
    await db.collection('users').updateOne(
      { _id: new ObjectId(auth.user.id) },
      {
        $set: {
          'twoFactorAuth.enabled': true,
          'twoFactorAuth.method': 'totp',
          'twoFactorAuth.secret': pendingSecret,
          'twoFactorAuth.setupComplete': true,
          'twoFactorAuth.recoveryCodesHashed': hashedRecoveryCodes,
          'twoFactorAuth.pendingSecret': null,
          updatedAt: new Date(),
        },
      }
    );

    // Return plaintext recovery codes once (they won't be shown again)
    return NextResponse.json({
      message: '2FA enabled successfully',
      recoveryCodes,
    });
  } catch (error) {
    console.error('2FA confirm error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
