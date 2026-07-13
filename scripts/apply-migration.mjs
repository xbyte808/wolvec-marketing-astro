// Applies migrations/*.sql to the marketing Neon database in filename order.
// Idempotent: every migration uses IF NOT EXISTS, so re-running is safe.
//
// Usage:  node scripts/apply-migration.mjs
// Requires: DATABASE_URL (marketing Neon connection string) in env or .env.local
import { readFileSync, readdirSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { loadEnv, requireEnv } from './_env.mjs';

loadEnv();
const sql = neon(requireEnv('DATABASE_URL'));

const files = readdirSync('migrations')
  .filter((f) => f.endsWith('.sql'))
  .sort();

for (const file of files) {
  const ddl = readFileSync(`migrations/${file}`, 'utf8');
  // neon()'s HTTP transport runs one statement per call, so split on ';'.
  const statements = ddl
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.split('\n').every((l) => l.trim().startsWith('--')));
  for (const stmt of statements) {
    await sql.query(stmt);
  }
  console.log(`applied ${file} (${statements.length} statements)`);
}

const [{ count }] = await sql`SELECT count(*)::int AS count FROM early_access_submission`;
console.log(`early_access_submission row count: ${count}`);
