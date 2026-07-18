const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

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

  if (!res.ok) {
    throw new Error(`Turnstile siteverify returned HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    success: boolean;
    hostname?: string;
    'error-codes'?: string[];
  };

  if (data.success !== true) {
    console.warn('[turnstile] verification rejected:', data['error-codes'] ?? []);
    return false;
  }

  // Defense in depth against an over-broad sitekey domain allowlist:
  // TURNSTILE_ALLOWED_HOSTNAMES is a comma-separated list of hostnames the
  // widget may have been solved on. Unset = accept any (current behavior).
  const allowed = process.env.TURNSTILE_ALLOWED_HOSTNAMES;
  if (allowed) {
    const hostnames = allowed.split(',').map((h: string) => h.trim().toLowerCase());
    if (!data.hostname || !hostnames.includes(data.hostname.toLowerCase())) {
      console.warn('[turnstile] token hostname not in allowlist:', data.hostname);
      return false;
    }
  }

  return true;
}
