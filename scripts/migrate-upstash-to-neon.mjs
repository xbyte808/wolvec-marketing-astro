// One-time migration: copy early-access lead PII out of Upstash (Vercel KV)
// into the marketing Neon database. Read-only against Upstash; it never
// deletes source data (the founder decommissions the KV store from the
// dashboard afterward).
//
// Idempotent: existing (email, submitted_at) pairs already in Neon are skipped,
// so re-running does not duplicate rows.
//
// Usage:
//   node scripts/migrate-upstash-to-neon.mjs --dry-run   # preview, no writes
//   node scripts/migrate-upstash-to-neon.mjs             # perform migration
//
// Requires in env or .env.local:
//   KV_REST_API_URL, KV_REST_API_TOKEN  (production Upstash creds)
//   DATABASE_URL                        (marketing Neon connection string)
import { neon } from '@neondatabase/serverless';
import { loadEnv, requireEnv } from './_env.mjs';

const DRY_RUN = process.argv.includes('--dry-run');

// Known historical test rows: migrate NOT as real leads, but report their
// presence rather than silently dropping them.
const TEST_EMAILS = new Set(['test@test.com', 'ellard.morales@gmail.com', 'ellard@wolvec.ai']);

// Delimiter for (email, submittedAt) dedupe keys. Neither an email nor an ISO
// timestamp contains a pipe, so it is a safe, plain-text separator.
const SEP = '|';

loadEnv();
const KV_URL = requireEnv('KV_REST_API_URL');
const KV_TOKEN = requireEnv('KV_REST_API_TOKEN');
const sql = neon(requireEnv('DATABASE_URL'));

async function kv(cmd) {
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  if (!res.ok) throw new Error(`KV ${cmd[0]} failed: ${res.status} ${await res.text()}`);
  return (await res.json()).result;
}

// 1. Enumerate lead record keys (exclude rate-limit keys).
let cursor = '0';
const keys = [];
do {
  const [next, batch] = await kv(['SCAN', cursor, 'MATCH', 'early-access:*', 'COUNT', '200']);
  cursor = next;
  keys.push(...batch);
} while (cursor !== '0');

const leadKeys = keys.filter((k) => !k.startsWith('early-access:rl:'));

// 2. Fetch and parse each record.
const real = [];
const test = [];
const malformed = [];
for (const key of leadKeys) {
  const raw = await kv(['GET', key]);
  let rec;
  try {
    rec = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    malformed.push({ key, reason: 'unparseable JSON' });
    continue;
  }
  const email = String(rec?.email ?? '').trim();
  const name = String(rec?.name ?? '').trim();
  if (!email || !name) {
    malformed.push({ key, reason: 'missing name or email' });
    continue;
  }
  const entry = {
    key,
    name,
    email,
    yearsCoaching: String(rec.yearsCoaching ?? '').trim(),
    clientCount: String(rec.clientCount ?? '').trim(),
    currentPlatform: String(rec.currentPlatform ?? '').trim(),
    submittedAt: String(rec.submittedAt ?? '').trim(),
  };
  if (TEST_EMAILS.has(email.toLowerCase())) test.push(entry);
  else real.push(entry);
}

// 3. Load existing (email, submitted_at) pairs to make re-runs idempotent.
const existingRows = await sql`SELECT email, submitted_at FROM early_access_submission`;
const existing = new Set(
  existingRows.map((r) => `${r.email}${SEP}${new Date(r.submitted_at).toISOString()}`)
);
const dedupeKey = (e) =>
  `${e.email}${SEP}${e.submittedAt ? new Date(e.submittedAt).toISOString() : ''}`;

const toInsert = real.filter((e) => !existing.has(dedupeKey(e)));
const alreadyPresent = real.length - toInsert.length;

// 4. Insert.
let inserted = 0;
if (!DRY_RUN) {
  for (const e of toInsert) {
    const submittedAt = e.submittedAt || new Date().toISOString();
    await sql`
      INSERT INTO early_access_submission
        (name, email, years_coaching, client_count, current_platform, submitted_at)
      VALUES
        (${e.name}, ${e.email}, ${e.yearsCoaching}, ${e.clientCount}, ${e.currentPlatform}, ${submittedAt})
    `;
    inserted++;
  }
}

// 5. Report.
console.log('==== Upstash -> Neon early-access migration ====');
console.log(DRY_RUN ? '(DRY RUN — no rows written)\n' : '');
console.log(`Total KV keys scanned:        ${keys.length}`);
console.log(`Lead record keys:             ${leadKeys.length}`);
console.log(`  Real leads:                 ${real.length}`);
console.log(`  Known test rows (excluded): ${test.length}`);
console.log(`  Malformed (skipped):        ${malformed.length}`);
console.log('');
console.log(`Real leads already in Neon:   ${alreadyPresent}`);
console.log(`Real leads ${DRY_RUN ? 'that WOULD be inserted' : 'inserted'}: ${DRY_RUN ? toInsert.length : inserted}`);
console.log('');
if (test.length) {
  console.log('Excluded test rows (reported, not migrated):');
  for (const e of test) console.log(`  - ${e.email}  submitted=${e.submittedAt || 'unknown'}  key=${e.key}`);
  console.log('');
}
if (malformed.length) {
  console.log('Malformed records (need manual review):');
  for (const m of malformed) console.log(`  - key=${m.key}  reason=${m.reason}`);
  console.log('');
}
console.log('Real leads (email / submittedAt):');
for (const e of real) console.log(`  - ${e.email}  ${e.submittedAt || 'unknown'}`);

const [{ count }] = await sql`SELECT count(*)::int AS count FROM early_access_submission`;
console.log(`\nearly_access_submission total rows now: ${count}`);
