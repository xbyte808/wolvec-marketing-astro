export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { name, email, yearsCoaching, clientCount, currentPlatform } = body as {
    name?: string;
    email?: string;
    yearsCoaching?: string;
    clientCount?: string;
    currentPlatform?: string;
  };

  if (!name || !email || !yearsCoaching || !clientCount) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const submittedAt = new Date().toISOString();

  const record = {
    name,
    email,
    yearsCoaching,
    clientCount,
    currentPlatform: currentPlatform ?? '',
    submittedAt,
  };

  try {
    const { kv } = await import('@vercel/kv');
    const key = `early-access:${Date.now()}:${email.replace('@', '_at_')}`;
    await kv.set(key, JSON.stringify(record));
  } catch (err) {
    console.error('[early-access] KV write failed:', err);
    return new Response(JSON.stringify({ error: 'Storage error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // KV write succeeded — send notification email. Failure must not affect client response.
  try {
    await resend.emails.send({
      from: 'Wolvec <noreply@ermstack.dev>',
      to: 'ellard@wolvec.ai',
      subject: `New early access application — ${name}`,
      html: `<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a2e;">New early access application</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 40%;">Name</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td>
    </tr>
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Years coaching online</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${yearsCoaching}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Current client count</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${clientCount}</td>
    </tr>
    <tr>
      <td style="padding: 8px; font-weight: bold;">Current platform</td>
      <td style="padding: 8px;">${record.currentPlatform}</td>
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

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
