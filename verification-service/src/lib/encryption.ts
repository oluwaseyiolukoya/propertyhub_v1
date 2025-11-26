import crypto from 'crypto';
import { config } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = config.security.encryptionKey;

/**
 * Encrypt sensitive data (NIN, passport numbers, etc.)
 * Uses AES-256-GCM for authenticated encryption
 */
export const encrypt = (text: string): string => {
  if (!text) return '';

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt sensitive data
 */
export const decrypt = (encryptedText: string): string => {
  if (!encryptedText) return '';

  try {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash data for comparison (one-way)
 */
export const hash = (text: string): string => {
  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex');
};

/**
 * Generate secure random string
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Sanitize payload for logging (remove sensitive fields)
 */
export const sanitizePayload = (payload: any): any => {
  if (!payload) return null;

  const sanitized = JSON.parse(JSON.stringify(payload));

  // List of sensitive fields to redact
  const sensitiveFields = [
    'nin',
    'passport',
    'passportNumber',
    'licenseNumber',
    'vin',
    'documentNumber',
    'apiKey',
    'password',
    'token',
    'secret',
    'authorization',
  ];

  const redactSensitiveData = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;

    for (const key in obj) {
      const lowerKey = key.toLowerCase();

      // Check if key matches sensitive field
      if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
        obj[key] = '***REDACTED***';
      } else if (typeof obj[key] === 'object') {
        obj[key] = redactSensitiveData(obj[key]);
      }
    }

    return obj;
  };

  return redactSensitiveData(sanitized);
};

