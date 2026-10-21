require('dotenv').config();
const jwt = require('jsonwebtoken');

/**
 * Startup Validation for JWT_SECRET
 * - Crashes if missing
 * - Crashes if shorter than 32 characters
 * - Crashes if contains "dev-secret", "change-in-production", "secret", or "123456"
 * - Never prints the secret value in any log or error message
 */
function validateJwtSecret() {
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

  const forbiddenWords = ['dev-secret', 'change-in-production', 'secret', '123456'];
  const lowerSecret = secret.toLowerCase();
  for (const word of forbiddenWords) {
    if (lowerSecret.includes(word)) {
      throw new Error(
        `[FATAL SECURITY CONFIGURATION ERROR] JWT_SECRET contains an insecure, disallowed pattern ("${word}"). Please supply a cryptographically strong value. Server startup aborted.`
      );
    }
  }

  return secret;
}

/**
 * Startup Validation for CORS Origins
 * - Configurable through CORS_ORIGINS or CORS_ORIGIN
 * - Disallows wildcard (*) in production
 * - Crashes if missing in production
 */
function parseCorsOrigins(isProduction) {
  const envOrigins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN;

  if (isProduction) {
    if (!envOrigins || envOrigins.trim().length === 0) {
      throw new Error(
        '[FATAL SECURITY CONFIGURATION ERROR] CORS_ORIGINS environment variable is required in production. Wildcard origins and empty configurations are not permitted.'
      );
    }

    const origins = envOrigins
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    if (origins.includes('*')) {
      throw new Error(
        '[FATAL SECURITY CONFIGURATION ERROR] Wildcard CORS origin (*) is strictly prohibited in production environments.'
      );
    }

    return origins;
  }

  if (envOrigins) {
    return envOrigins
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }

  // Safe local development fallbacks
  return ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'];
}

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = validateJwtSecret();
const corsOrigins = parseCorsOrigins(isProduction);

/**
 * Centralized Token Signing
 * - Uses validated JWT_SECRET
 * - Explicitly enforces HS256 algorithm
 * - Sets default 7d expiry
 */
function signToken(payload, options = {}) {
  const { expiresIn = '7d', ...restOptions } = options;
  return jwt.sign(payload, jwtSecret, {
    algorithm: 'HS256',
    expiresIn,
    ...restOptions,
  });
}

/**
 * Centralized Token Verification
 * - Uses validated JWT_SECRET
 * - Explicitly enforces HS256 algorithm
 */
function verifyToken(token) {
  if (!token) throw new Error('Token is required for verification');
  return jwt.verify(token, jwtSecret, {
    algorithms: ['HS256'],
  });
}

module.exports = {
  isProduction,
  PORT: process.env.PORT || 5000,
  HOST: process.env.HOST || (isProduction ? '0.0.0.0' : 'localhost'),
  jwtSecret,
  corsOrigins,
  signToken,
  verifyToken,
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
  IMGBB_API_KEY: process.env.IMGBB_API_KEY,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
};
