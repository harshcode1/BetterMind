// Helpers for 2FA tests: enrol a user straight in the DB and generate real TOTP codes.
import { TOTP, NobleCryptoPlugin, ScureBase32Plugin, generateSecret } from 'otplib';
import { getDb } from './db';
import { createTestUser } from './http';
import { generateRecoveryCodes, hashRecoveryCode } from '../../src/app/lib/twoFactorAuth';
import { ObjectId } from 'mongodb';

const PLUGINS = { crypto: new NobleCryptoPlugin(), base32: new ScureBase32Plugin() };

export function newSecret() {
  return generateSecret(PLUGINS);
}

export async function totpNow(secret) {
  return new TOTP({ ...PLUGINS, secret }).generate();
}

// A six-digit code that is guaranteed NOT to be the currently valid one.
export async function wrongCodeFor(secret) {
  const valid = await totpNow(secret);
  return valid === '000000' ? '111111' : '000000';
}

// A user with 2FA fully enabled. Returns the plaintext secret and recovery codes for the test.
export async function createUserWith2FA(overrides = {}) {
  const secret = newSecret();
  const recoveryCodes = generateRecoveryCodes(10);
  const created = await createTestUser({
    ...overrides,
    extra: {
      twoFactorAuth: {
        enabled: true,
        setupComplete: true,
        method: 'totp',
        secret,
        recoveryCodesHashed: recoveryCodes.map(hashRecoveryCode),
        pendingSecret: null,
      },
      ...(overrides.extra || {}),
    },
  });
  return { ...created, secret, recoveryCodes };
}

export async function getStoredUser(id) {
  const db = await getDb();
  return db.collection('users').findOne({ _id: new ObjectId(id) });
}
