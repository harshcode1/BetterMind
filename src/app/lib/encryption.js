/**
 * Encryption utility for sensitive health data
 * 
 * This module provides functions for encrypting and decrypting sensitive
 * health data using AES-GCM encryption with a unique key per user.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// Environment variables for encryption (should be set in production)
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'this-is-a-development-secret-key-change-in-production';
const ENCRYPTION_SALT = process.env.ENCRYPTION_SALT || 'development-salt';

/**
 * Generate a unique encryption key for a user
 * @param {string} userId - The user's ID
 * @returns {Buffer} - The derived encryption key
 */
function getUserEncryptionKey(userId) {
  // Derive a key using scrypt, which is a password-based key derivation function
  // This creates a unique key for each user based on the user ID and our secret
  return scryptSync(ENCRYPTION_SECRET, ENCRYPTION_SALT + userId, 32);
}

/**
 * Encrypt sensitive data
 * @param {string} userId - The user's ID
 * @param {object} data - The data to encrypt
 * @param {Array<string>} sensitiveFields - Array of field names to encrypt
 * @returns {object} - The data with sensitive fields encrypted
 */
export function encryptSensitiveData(userId, data, sensitiveFields) {
  if (!userId || !data) return data;
  
  // Create a copy of the data to avoid modifying the original
  const encryptedData = { ...data };
  
  // Get the user's encryption key
  const key = getUserEncryptionKey(userId);
  
  // Encrypt each sensitive field
  sensitiveFields.forEach(field => {
    if (encryptedData[field] !== undefined) {
      // Generate a random initialization vector for each encryption
      const iv = randomBytes(16);
      
      // Create cipher with AES-GCM mode (authenticated encryption)
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      
      // Encrypt the data
      let encrypted = cipher.update(String(encryptedData[field]), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get the authentication tag
      const authTag = cipher.getAuthTag().toString('hex');
      
      // Store the encrypted data with IV and auth tag
      encryptedData[field] = {
        encrypted: true,
        data: encrypted,
        iv: iv.toString('hex'),
        authTag
      };
    }
  });
  
  return encryptedData;
}

/**
 * Decrypt sensitive data
 * @param {string} userId - The user's ID
 * @param {object} data - The data with encrypted fields
 * @returns {object} - The data with sensitive fields decrypted
 */
export function decryptSensitiveData(userId, data) {
  if (!userId || !data) return data;
  
  // Create a copy of the data to avoid modifying the original
  const decryptedData = { ...data };
  
  // Get the user's encryption key
  const key = getUserEncryptionKey(userId);
  
  // Decrypt each encrypted field
  Object.keys(decryptedData).forEach(field => {
    const value = decryptedData[field];
    
    // Check if the field is encrypted
    if (value && typeof value === 'object' && value.encrypted === true) {
      try {
        // Convert IV and auth tag from hex to Buffer
        const iv = Buffer.from(value.iv, 'hex');
        const authTag = Buffer.from(value.authTag, 'hex');
        
        // Create decipher
        const decipher = createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        
        // Decrypt the data
        let decrypted = decipher.update(value.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        // Replace the encrypted object with the decrypted value
        decryptedData[field] = decrypted;
      } catch (error) {
        console.error(`Error decrypting field ${field}:`, error);
        // Keep the encrypted value if decryption fails
      }
    }
  });
  
  return decryptedData;
}

/**
 * List of sensitive fields that should be encrypted
 */
export const SENSITIVE_FIELDS = [
  'notes',              // Mood notes may contain sensitive information
  'phq9Answers',        // Individual question responses for depression assessment
  'gad7Answers',        // Individual question responses for anxiety assessment
  'medicalHistory',     // Medical history information
  'medications',        // Current medications
  'diagnosisDetails',   // Detailed diagnosis information
  'therapyNotes'        // Notes from therapy sessions
];

/**
 * Encrypt a document before saving to database
 * @param {string} userId - The user's ID
 * @param {object} document - The document to encrypt
 * @param {string} documentType - The type of document (mood, assessment, etc.)
 * @returns {object} - The document with sensitive fields encrypted
 */
export function encryptDocument(userId, document, documentType) {
  // Determine which fields to encrypt based on document type
  let fieldsToEncrypt = [];
  
  switch (documentType) {
    case 'mood':
      fieldsToEncrypt = ['notes'];
      break;
    case 'assessment':
      fieldsToEncrypt = ['phq9Answers', 'gad7Answers'];
      break;
    case 'medical':
      fieldsToEncrypt = ['medicalHistory', 'medications', 'diagnosisDetails'];
      break;
    case 'therapy':
      fieldsToEncrypt = ['therapyNotes'];
      break;
    default:
      fieldsToEncrypt = SENSITIVE_FIELDS;
  }
  
  return encryptSensitiveData(userId, document, fieldsToEncrypt);
}

/**
 * Decrypt a document retrieved from database
 * @param {string} userId - The user's ID
 * @param {object} document - The document with encrypted fields
 * @returns {object} - The document with sensitive fields decrypted
 */
export function decryptDocument(userId, document) {
  return decryptSensitiveData(userId, document);
}