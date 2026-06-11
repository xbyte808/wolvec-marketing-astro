export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { escapeHtml } from '../../lib/escape';
import { verifyTurnstile } from '../../lib/turnstile';

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY ?? import.meta.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

const MAX_NAME = 200;
const MAX_EMAIL = 254;
const MAX_SELECT = 50;
const MAX_PLATFORM = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RATE_LIMIT_WINDOW_SECONDS = 600;
const RATE_LIMIT_MAX = 5;

function json(status: number, payload: Record<string, unknown>): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function readIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
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

  try {
    const { kv } = await import('@vercel/kv');
    const rlKey = `early-access:rl:${ip}`;
    const count = await kv.incr(rlKey);
    if (count === 1) {
      await kv.expire(rlKey, RATE_LIMIT_WINDOW_SECONDS);
    }
    if (count > RATE_LIMIT_MAX) {
      return json(429, { error: 'Too many submissions. Please try again later.' });
    }
  } catch (err) {
    // Rate limiting must not take the form down if KV hiccups; storage below will surface real KV outages.
    console.error('[early-access] rate limit check failed:', err);
  }

  const submittedAt = new Date().toISOString();

  const record = {
    name,
    email,
    yearsCoaching,
    clientCount,
    currentPlatform,
    submittedAt,
  };

  try {
    const { kv } = await import('@vercel/kv');
    const key = `early-access:${Date.now()}:${email.replace('@', '_at_')}`;
    await kv.set(key, JSON.stringify(record));
  } catch (err) {
    console.error('[early-access] KV write failed:', err);
    return json(500, { error: 'Storage error' });
  }

  // KV write succeeded. Send notification email; failure must not affect client response.
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
    View all submissions in Upstash dashboard.
  </p>
</body>
</html>`,
    });
  } catch (error) {
    console.error('Resend failed:', error);
  }

  return json(200, { ok: true });
};
