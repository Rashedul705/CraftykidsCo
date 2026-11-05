/**
 * Centralized Security & Authentication Configuration (Frontend / Next.js API)
 * Enforces strict JWT secret and environment variable requirements:
 * 1. Missing JWT_SECRET -> crashes on startup with clear error
 * 2. JWT_SECRET length < 32 -> crashes with clear error
 * 3. Contains insecure placeholders -> crashes with clear error
 * 4. Never prints secret value in any log or error
 * 5. Validates required server runtime variables
 */

const INSECURE_PLACEHOLDERS = [
  'dev-secret',
  'change-in-production',
  'replace-with-a-long-random-string',
  'your_secure_random_jwt_secret_key',
  '12345678901234567890123456789012',
];

export function validateJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || typeof secret !== 'string' || secret.trim().length === 0) {
    throw new Error(
      '[FATAL SECURITY CONFIGURATION ERROR] Missing required environment variable: JWT_SECRET. Server startup aborted.'
    );
  }

  if (secret.length < 32) {
    throw new Error(
      `[FATAL SECURITY CONFIGURATION ERROR] JWT_SECRET is too short. It must be at least 32 characters long (provided length: ${secret.length}). Server startup aborted.`
    );
  }

  const lowerSecret = secret.toLowerCase();
  for (const placeholder of INSECURE_PLACEHOLDERS) {
    if (lowerSecret.includes(placeholder)) {
      throw new Error(
        `[FATAL SECURITY CONFIGURATION ERROR] Insecure placeholder pattern detected in JWT_SECRET ("${placeholder}"). Please supply a cryptographically strong value. Server startup aborted.`
      );
    }
  }

  return secret;
}

/**
 * Validates all required server runtime environment variables on startup.
 * Fails with a clear message naming the missing variable.
 */
export function validateServerSecurityEnv(): void {
  // 1. Validate JWT_SECRET
  validateJwtSecret();

  // 2. Validate MONGODB_URI
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri || mongoUri.trim().length === 0) {
    throw new Error(
      '[FATAL SECURITY CONFIGURATION ERROR] Missing required environment variable: MONGODB_URI. Server startup aborted.'
    );
  }
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
