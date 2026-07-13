// Minimal .env loader for the migration scripts. Reads .env.local then .env
// from the repo root and sets any keys not already present in process.env.
// Values are never printed. Real creds live only in gitignored .env* files or
// the shell environment.
import { readFileSync, existsSync } from 'node:fs';

export function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      const key = m[1];
      if (process.env[key] !== undefined) continue;
      process.env[key] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

export function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}
