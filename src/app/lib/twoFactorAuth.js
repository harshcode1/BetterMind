import crypto from 'crypto';
import { TOTP, NobleCryptoPlugin, ScureBase32Plugin, generateSecret, generateURI } from 'otplib';

const PLUGINS = {
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
};

function makeTOTP(secret) {
  return new TOTP({ ...PLUGINS, secret });
}

export function generateTOTPSecret(userId, email) {
  const secret = generateSecret(PLUGINS);
  const qrCodeUrl = generateURI({
    type: 'totp',
    issuer: 'BetterMind',
    label: email,
    secret,
  });
  return { secret, qrCodeUrl };
}

export async function verifyTOTPToken(token, secret) {
  try {
    const totp = makeTOTP(secret);
    const result = await totp.verify(String(token));
    return result?.valid === true;
  } catch {
    return false;
  }
}

export function generateRecoveryCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase();
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  return codes;
}

export function hashRecoveryCode(code) {
  return crypto.createHash('sha256').update(code.replace(/-/g, '')).digest('hex');
}

export function verifyRecoveryCode(code, hashedCodes) {
  const hash = hashRecoveryCode(code);
  return (hashedCodes || []).includes(hash);
}

export function createTwoFactorSetup(userId, email) {
  const { secret, qrCodeUrl } = generateTOTPSecret(userId, email);
  const recoveryCodes = generateRecoveryCodes();
  const hashedRecoveryCodes = recoveryCodes.map(hashRecoveryCode);
  return { secret, qrCodeUrl, recoveryCodes, hashedRecoveryCodes };
}

export function getTwoFactorStatus(user) {
  if (!user?.twoFactorAuth) {
    return { enabled: false, method: null, setupComplete: false };
  }
  return {
    enabled: user.twoFactorAuth.enabled || false,
    method: user.twoFactorAuth.method || null,
    setupComplete: user.twoFactorAuth.setupComplete || false,
  };
}
