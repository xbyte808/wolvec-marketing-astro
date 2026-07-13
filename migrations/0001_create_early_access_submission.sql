-- Marketing early-access lead capture.
-- Dedicated marketing Neon database (separate project from the coaching
-- platform). This table replaces the Upstash KV early-access:* records that
-- previously held applicant PII with no encryption at rest.
--
-- Idempotent: safe to run more than once.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS early_access_submission (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  email            text        NOT NULL,
  years_coaching   text        NOT NULL,
  client_count     text        NOT NULL,
  current_platform text        NOT NULL DEFAULT '',
  submitted_at     timestamptz NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Leads may legitimately submit more than once (the prior KV keys were
-- timestamped, not deduped), so email is intentionally NOT unique. Index for
-- lookup only.
CREATE INDEX IF NOT EXISTS early_access_submission_email_idx
  ON early_access_submission (email);

CREATE INDEX IF NOT EXISTS early_access_submission_submitted_at_idx
  ON early_access_submission (submitted_at);
