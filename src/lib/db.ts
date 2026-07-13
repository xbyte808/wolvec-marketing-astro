import { neon } from '@neondatabase/serverless';

/**
 * Neon serverless SQL client for the dedicated marketing database.
 *
 * DATABASE_URL is the pooled Neon connection string, set as an env var on the
 * marketing Vercel project (Production + Preview). Reads via process.env at
 * runtime (Vercel serverless) and falls back to import.meta.env for local dev,
 * mirroring the pattern in lib/turnstile.ts.
 */
export function getSql() {
  const url = process.env.DATABASE_URL ?? import.meta.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not configured');
  }
  return neon(url);
}
