// app/api/auth/2fa/verify/route.js
// Used during login to verify TOTP code before issuing JWT
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/db';
import { verifyTOTPToken, verifyRecoveryCode, hashRecoveryCode } from '../../../../lib/twoFactorAuth';
import { generateToken } from '../../../../lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const { userId, code } = await request.json();

    if (!userId || !code) {
      return NextResponse.json({ error: 'userId and code are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    let userObjId;
    try {
      userObjId = new ObjectId(userId);
    } catch {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    const user = await db.collection('users').findOne({ _id: userObjId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tfa = user.twoFactorAuth;
    if (!tfa?.enabled || !tfa?.secret) {
      return NextResponse.json({ error: '2FA is not enabled for this account' }, { status: 400 });
    }

    const isValidTOTP = verifyTOTPToken(code, tfa.secret);
    const isValidRecovery = !isValidTOTP && verifyRecoveryCode(code, tfa.recoveryCodesHashed || []);

    if (!isValidTOTP && !isValidRecovery) {
      return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 401 });
    }

    // If a recovery code was used, remove it so it can't be reused
    if (isValidRecovery) {
      const usedHash = hashRecoveryCode(code);
      const updatedCodes = (tfa.recoveryCodesHashed || []).filter(h => h !== usedHash);
      await db.collection('users').updateOne(
        { _id: userObjId },
        { $set: { 'twoFactorAuth.recoveryCodesHashed': updatedCodes } }
      );
    }

    // Get doctor info if applicable
    let doctorInfo = null;
    if (user.role === 'doctor') {
      doctorInfo = await db.collection('doctors').findOne({ userId: user._id });
    }

    const token = generateToken({
      ...user,
      role: user.role || 'patient',
      verified: user.verified || false,
    });

    const response = NextResponse.json({
      message: '2FA verified successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role || 'patient',
        verified: user.verified || false,
        ...(doctorInfo && { doctorId: doctorInfo._id.toString() }),
      },
    });

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
