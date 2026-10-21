/**
 * Centralized Security & Authentication Configuration (Frontend / Next.js API)
 * Enforces strict JWT secret requirements:
 * 1. Missing -> crashes on startup with clear error
 * 2. Length < 32 -> crashes with clear error
 * 3. Contains forbidden words ('dev-secret', 'change-in-production', 'secret', '123456') -> crashes with clear error
 * 4. Never prints secret value in any log or error
 */

const FORBIDDEN_WORDS = ['dev-secret', 'change-in-production', 'secret', '123456'];

export function validateJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || typeof secret !== 'string' || secret.trim().length === 0) {
    throw new Error(
      '[FATAL SECURITY CONFIGURATION ERROR] JWT_SECRET environment variable is missing. Server startup aborted.'
    );
  }

  if (secret.length < 32) {
    throw new Error(
      `[FATAL SECURITY CONFIGURATION ERROR] JWT_SECRET is too short. It must be at least 32 characters long (provided length: ${secret.length}). Server startup aborted.`
    );
  }

  const lowerSecret = secret.toLowerCase();
  for (const word of FORBIDDEN_WORDS) {
    if (lowerSecret.includes(word)) {
      throw new Error(
        `[FATAL SECURITY CONFIGURATION ERROR] JWT_SECRET contains an insecure, disallowed pattern ("${word}"). Please supply a cryptographically strong value. Server startup aborted.`
      );
    }
  }

  return secret;
}

let cachedSecretKey: Uint8Array | null = null;
let cachedSecretString: string | null = null;

export function getJwtSecret(): string {
  if (!cachedSecretString) {
    cachedSecretString = validateJwtSecret();
  }
  return cachedSecretString;
}

export function getJwtSecretKey(): Uint8Array {
  if (!cachedSecretKey) {
    const secret = getJwtSecret();
    cachedSecretKey = new TextEncoder().encode(secret);
  }
  return cachedSecretKey;
}

export const isProduction = process.env.NODE_ENV === 'production';
