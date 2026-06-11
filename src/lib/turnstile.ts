const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY ?? import.meta.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (import.meta.env.PROD || process.env.NODE_ENV === 'production') {
      throw new Error('TURNSTILE_SECRET_KEY is not configured');
    }
    console.warn('[turnstile] TURNSTILE_SECRET_KEY not set, skipping verification in dev');
    return true;
  }

  if (!token) return false;

  const res = await fetch(VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });

  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}
