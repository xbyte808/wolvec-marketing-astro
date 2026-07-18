export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { escapeHtml } from '../../lib/escape';
import { verifyTurnstile } from '../../lib/turnstile';
import { checkRateLimit } from '../../lib/rateLimit';
import { getSql } from '../../lib/db';

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

const MAX_NAME = 200;
const MAX_EMAIL = 254;
const MAX_SELECT = 50;
const MAX_PLATFORM = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Must match the <option> values in components/EarlyAccessCTA.tsx exactly.
const YEARS_COACHING_OPTIONS = new Set([
  'Less than 6 months',
  '6–12 months',
  '1–2 years',
  '2+ years',
]);
const CLIENT_COUNT_OPTIONS = new Set(['0–5', '6–15', '16–30', '30+']);

const RATE_LIMIT_WINDOW_MS = 600_000;
const RATE_LIMIT_MAX = 5;

function json(status: number, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function readIp(request: Request): string {
  // x-real-ip is set by Vercel's edge from the actual connecting client and
  // cannot be spoofed by the request. x-forwarded-for is client-suppliable
  // and must not be used to key rate limiting. Matches the resolution logic
  // in @vercel/functions' ipAddress().
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const str = (v: unknown, max: number): string =>
    typeof v === 'string' ? v.trim().slice(0, max) : '';

  const name = str(body.name, MAX_NAME);
  const email = str(body.email, MAX_EMAIL);
  const yearsCoaching = str(body.yearsCoaching, MAX_SELECT);
  const clientCount = str(body.clientCount, MAX_SELECT);
  const currentPlatform = str(body.currentPlatform, MAX_PLATFORM);
  const turnstileToken =
    typeof body.turnstileToken === 'string' ? body.turnstileToken.slice(0, 2048) : '';

  if (!name || !email || !yearsCoaching || !clientCount) {
    return json(400, { error: 'Missing required fields' });
  }
  if (!EMAIL_RE.test(email)) {
    return json(400, { error: 'Invalid email address' });
  }
  if (!YEARS_COACHING_OPTIONS.has(yearsCoaching) || !CLIENT_COUNT_OPTIONS.has(clientCount)) {
    return json(400, { error: 'Invalid selection' });
  }

  const ip = readIp(request);

  let turnstileOk = false;
  try {
    turnstileOk = await verifyTurnstile(turnstileToken, ip);
  } catch (err) {
    console.error('[early-access] turnstile verification error:', err);
    return json(500, { error: 'Verification unavailable' });
  }
  if (!turnstileOk) {
    return json(403, { error: 'Verification failed. Please try again.' });
  }

  // In-memory, best-effort rate limit (see lib/rateLimit.ts). Turnstile above is
  // the primary abuse gate; this is a coarse per-instance throttle that replaces
  // the removed KV-backed limiter.
  const rl = checkRateLimit(`early-access:${ip}`, {
    windowMs: RATE_LIMIT_WINDOW_MS,
    maxRequests: RATE_LIMIT_MAX,
  });
  if (!rl.allowed) {
    return json(429, { error: 'Too many submissions. Please try again later.' });
  }

  const submittedAt = new Date().toISOString();

  try {
    const sql = getSql();
    await sql`
      INSERT INTO early_access_submission
        (name, email, years_coaching, client_count, current_platform, submitted_at)
      VALUES
        (${name}, ${email}, ${yearsCoaching}, ${clientCount}, ${currentPlatform}, ${submittedAt})
    `;
  } catch (err) {
    console.error('[early-access] Neon write failed:', err);
    return json(500, { error: 'Storage error' });
  }

  // DB write succeeded. Send notification email; failure must not affect client response.
  try {
    const resend = getResend();
    if (!resend) throw new Error('RESEND_API_KEY is not configured');
    const subjectName = name.replace(/[\r\n]+/g, ' ').slice(0, 80);
    await resend.emails.send({
      from: 'Wolvec <noreply@wolvec.ai>',
      to: 'ellard@wolvec.ai',
      subject: `New early access application: ${subjectName}`,
      html: `<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a2e;">New early access application</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 40%;">Name</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(name)}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
    </tr>
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Years coaching online</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(yearsCoaching)}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Current client count</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(clientCount)}</td>
    </tr>
    <tr>
      <td style="padding: 8px; font-weight: bold;">Current platform</td>
      <td style="padding: 8px;">${escapeHtml(currentPlatform)}</td>
    </tr>
  </table>
  <p style="color: #868e96; font-size: 13px; margin-top: 24px;">
    Submitted: ${submittedAt}<br>
    Stored in the marketing Neon database (early_access_submission).
  </p>
</body>
</html>`,
    });
  } catch (error) {
    console.error('Resend failed:', error);
  }

  return json(200, { ok: true });
};
