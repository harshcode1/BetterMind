/**
 * Two-Factor Authentication Utility
 * 
 * This module provides functions for implementing two-factor authentication
 * using Time-based One-Time Passwords (TOTP) compatible with authenticator apps.
 */

import crypto from 'crypto';
import { authenticator } from 'otplib';

// Set TOTP options
authenticator.options = {
  digits: 6,
  step: 30, // 30-second window
  window: 1  // Allow 1 step before/after for clock drift
};

/**
 * Generate a new TOTP secret for a user
 * @returns {Object} Object containing secret and QR code URL
 */
export function generateTOTPSecret(userId, email) {
  // Generate a random secret
  const secret = authenticator.generateSecret();
  
  // Create a label for the authenticator app (service:user)
  const label = encodeURIComponent(`BetterMind:${email}`);
  
  // Generate the URL for the QR code
  const qrCodeUrl = authenticator.keyuri(email, 'BetterMind', secret);
  
  return {
    secret,
    qrCodeUrl
  };
}

/**
 * Verify a TOTP code against a secret
 * @param {string} token - The TOTP code to verify
 * @param {string} secret - The user's TOTP secret
 * @returns {boolean} Whether the code is valid
 */
export function verifyTOTPToken(token, secret) {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error('Error verifying TOTP token:', error);
    return false;
  }
}

/**
 * Generate backup recovery codes for a user
 * @param {number} count - Number of recovery codes to generate
 * @returns {Array<string>} Array of recovery codes
 */
export function generateRecoveryCodes(count = 10) {
  const codes = [];
  
  for (let i = 0; i < count; i++) {
    // Generate a random 10-character code
    const code = crypto.randomBytes(5).toString('hex').toUpperCase();
    
    // Format as XXXXX-XXXXX for readability
    const formattedCode = `${code.substring(0, 5)}-${code.substring(5)}`;
    
    codes.push(formattedCode);
  }
  
  return codes;
}

/**
 * Hash a recovery code for secure storage
 * @param {string} code - The recovery code to hash
 * @returns {string} The hashed recovery code
 */
export function hashRecoveryCode(code) {
  // Remove any formatting (dashes)
  const normalizedCode = code.replace(/-/g, '');
  
  // Create a SHA-256 hash
  return crypto.createHash('sha256').update(normalizedCode).digest('hex');
}

/**
 * Verify a recovery code against a list of hashed codes
 * @param {string} code - The recovery code to verify
 * @param {Array<string>} hashedCodes - Array of hashed recovery codes
 * @returns {boolean} Whether the code is valid
 */
export function verifyRecoveryCode(code, hashedCodes) {
  // Remove any formatting (dashes)
  const normalizedCode = code.replace(/-/g, '');
  
  // Hash the provided code
  const hashedCode = crypto.createHash('sha256').update(normalizedCode).digest('hex');
  
  // Check if the hashed code exists in the array
  return hashedCodes.includes(hashedCode);
}

/**
 * Create a new 2FA setup for a user
 * @param {string} userId - The user's ID
 * @param {string} email - The user's email
 * @returns {Object} 2FA setup information
 */
export function createTwoFactorSetup(userId, email) {
  // Generate TOTP secret and QR code URL
  const { secret, qrCodeUrl } = generateTOTPSecret(userId, email);
  
  // Generate recovery codes
  const recoveryCodes = generateRecoveryCodes();
  
  // Hash recovery codes for storage
  const hashedRecoveryCodes = recoveryCodes.map(hashRecoveryCode);
  
  return {
    secret,
    qrCodeUrl,
    recoveryCodes,
    hashedRecoveryCodes
  };
}

/**
 * Format a phone number for SMS delivery
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} The formatted phone number
 */
export function formatPhoneNumber(phoneNumber) {
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Ensure it has the country code
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`; // Assume US number if 10 digits
  }
  
  // If it already has a country code (starts with +)
  if (phoneNumber.startsWith('+')) {
    return digitsOnly;
  }
  
  // Default: add +1 (US) country code
  return `+1${digitsOnly}`;
}

/**
 * Generate a random SMS verification code
 * @returns {string} 6-digit verification code
 */
export function generateSMSCode() {
  // Generate a random 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Get the status of a user's 2FA setup
 * @param {Object} user - The user object
 * @returns {Object} 2FA status information
 */
export function getTwoFactorStatus(user) {
  if (!user || !user.twoFactorAuth) {
    return {
      enabled: false,
      method: null,
      setupComplete: false
    };
  }
  
  return {
    enabled: user.twoFactorAuth.enabled || false,
    method: user.twoFactorAuth.method || null,
    setupComplete: user.twoFactorAuth.setupComplete || false,
    phoneNumber: user.twoFactorAuth.phoneNumber 
      ? maskPhoneNumber(user.twoFactorAuth.phoneNumber) 
      : null
  };
}

/**
 * Mask a phone number for display
 * @param {string} phoneNumber - The phone number to mask
 * @returns {string} The masked phone number
 */
function maskPhoneNumber(phoneNumber) {
  // Keep only the last 4 digits visible
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  const lastFour = digitsOnly.slice(-4);
  
  return `******${lastFour}`;
}