import { neon } from '@neondatabase/serverless';

/**
 * Neon serverless SQL client for the dedicated marketing database.
 *
 * DATABASE_URL is the pooled Neon connection string, set as an env var on the
 * marketing Vercel project (Production + Preview). Read via process.env only —
 * an import.meta.env fallback here would get statically inlined as a plaintext
 * connection string into the compiled server bundle at build time.
 */
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not configured');
  }
  return neon(url);
}
