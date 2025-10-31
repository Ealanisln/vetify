/**
 * Jest Integration Test Setup
 *
 * This file is loaded before integration tests run to ensure:
 * - Database is properly configured
 * - Test timeout is sufficient for DB operations
 * - Environment variables are validated
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file first (created by env-config.mjs)
config({ path: resolve(process.cwd(), '.env.local') });
// Load .env as fallback
config({ path: resolve(process.cwd(), '.env') });

// Set test timeout for database operations (30 seconds)
jest.setTimeout(30000);

// Ensure test environment is configured
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must be set for integration tests. ' +
    'Run: pnpm env:localhost before running integration tests.'
  );
}

// Log test environment info (helpful for debugging CI/CD)
console.log('Integration Test Environment:');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('- Test Timeout:', 30000, 'ms');
