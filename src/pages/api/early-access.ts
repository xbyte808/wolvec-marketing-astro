export const prerender = false;

import type { APIRoute } from 'astro';

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

  const record = {
    name,
    email,
    yearsCoaching,
    clientCount,
    currentPlatform: currentPlatform ?? '',
    submittedAt: new Date().toISOString(),
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

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
