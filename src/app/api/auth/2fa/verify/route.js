// app/api/auth/2fa/verify/route.js
// Second step of login. Requires the httpOnly "2fa-pending" cookie that /api/auth/login sets after
// the password was checked; the user comes from that signed cookie, NEVER from the request body.
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/db';
import { verifyTOTPToken, hashRecoveryCode } from '../../../../lib/twoFactorAuth';
import { generateToken } from '../../../../lib/auth';
import { PENDING_COOKIE, pendingCookieOptions, verifyPendingToken } from '../../../../lib/twoFactorPending';
import { ObjectId } from 'mongodb';

const MAX_CODE_LENGTH = 32;

export async function POST(request) {
  try {
    const pending = verifyPendingToken(request.cookies.get(PENDING_COOKIE)?.value);
    if (!pending || !ObjectId.isValid(pending.userId)) {
      return NextResponse.json(
        { error: 'Your sign-in session expired. Please log in again.', sessionExpired: true },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    const code = typeof body?.code === 'string' ? body.code.trim() : '';
    if (!code || code.length > MAX_CODE_LENGTH) {
      return NextResponse.json({ error: 'A verification code is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const userObjId = new ObjectId(pending.userId);

    const user = await db.collection('users').findOne({ _id: userObjId });
    if (!user) {
      return NextResponse.json(
        { error: 'Your sign-in session expired. Please log in again.', sessionExpired: true },
        { status: 401 }
      );
    }

    const tfa = user.twoFactorAuth;
    if (!tfa?.enabled || !tfa?.secret) {
      return NextResponse.json({ error: '2FA is not enabled for this account' }, { status: 400 });
    }

    let accepted = await verifyTOTPToken(code, tfa.secret);

    if (!accepted) {
      // Recovery code: verifying and consuming it is ONE atomic update, so two parallel
      // requests with the same code cannot both succeed.
      const usedHash = hashRecoveryCode(code);
      const result = await db.collection('users').updateOne(
        { _id: userObjId, 'twoFactorAuth.recoveryCodesHashed': usedHash },
        { $pull: { 'twoFactorAuth.recoveryCodesHashed': usedHash } }
      );
      accepted = result.modifiedCount === 1;
    }

    if (!accepted) {
      return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 401 });
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

    // The pending cookie has done its job: clear it (same name + path as when it was set)
    response.cookies.set({ ...pendingCookieOptions(0), value: '' });

    return response;
  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
