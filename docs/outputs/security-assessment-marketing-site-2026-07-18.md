# Marketing Site Security Assessment — wolvec-marketing-astro

**Date:** 2026-07-18
**Target:** `xbyte808/wolvec-marketing-astro` @ `C:\dev\wolvec-marketing-astro`, branch `main` (`fede8a5`)
**Mode:** READ-ONLY. Findings only, no fixes applied, production not attacked.
**Prompt:** Cross-check the three patterns found in the main coaching app (hardcoded CAPTCHA
bypass token, spoofable `X-Forwarded-For` rate limiting, fail-open-when-secret-unset guard) plus a
full endpoint/secrets/headers review of the public, indexed marketing surface.

## Architecture in one paragraph

Astro `output: 'static'` site on Vercel. Exactly **one** server (non-prerendered) endpoint:
`POST /api/early-access`. It validates the signup form, verifies a Cloudflare Turnstile token,
rate-limits per IP via Vercel KV (Upstash), stores the submission in KV, and emails a notification
via Resend. Everything else (`/`, `/privacy`, `/roadmap`, `/blog`, `/changelog`) is static
prerendered HTML. Secrets used: `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, Vercel KV REST token
(injected by the KV integration), and the **public** `PUBLIC_TURNSTILE_SITE_KEY`.

**Headline:** The three specific main-app weaknesses are **mostly absent here** — the Turnstile
guard fails **closed** in production (the opposite of the main app's fail-open guard), there is **no
CAPTCHA bypass token**, and no readback endpoint. The one shared pattern that *does* recur is the
spoofable `X-Forwarded-For` rate-limit key. The most notable new finding is that build-time secret
inlining bakes the Resend and Turnstile **secret** keys into the server function bundle.

---

## Ranked findings

### 1. [MEDIUM] Production secrets baked as plaintext into the server build artifacts

`src/lib/turnstile.ts:4` and `src/pages/api/early-access.ts:9` read secrets as:

```ts
const secret = process.env.TURNSTILE_SECRET_KEY ?? import.meta.env.TURNSTILE_SECRET_KEY;
const key    = process.env.RESEND_API_KEY      ?? import.meta.env.RESEND_API_KEY;
```

Vite/Astro **statically replaces** `import.meta.env.<NAME>` with the literal build-time value. As a
result the compiled serverless bundle
(`.vercel/output/_functions/chunks/early-access_*.mjs`) contains the real keys as hardcoded string
fallbacks:

```
const secret = process.env.TURNSTILE_SECRET_KEY ?? "0x4AAAA…<redacted turnstile secret>";
const key    = process.env.RESEND_API_KEY      ?? "re_iG6…<redacted resend key>";
```

**Exposure boundary (verified):**
- **NOT** in the client bundle. `dist/client/**` and `.vercel/output/static/**` contain only the
  *public* Turnstile **site** key (`0x4AAAAAADwa5a…`, public by design) — no `re_…`, no Turnstile
  secret, no KV token, no connection strings. No source maps are shipped.
- **NOT** in git. No `.env*` file was ever committed; history has no `re_…` secret.
- **IS** in the server function bundle, which Vercel does not serve over HTTP.

So this is **not remotely reachable by an anonymous visitor today**. The risk is secret material at
rest: every Vercel build re-bakes these keys into deployment artifacts, so they leak through the
many ordinary channels that expose build output — CI/build logs, a shared or downloaded deployment
artifact, an accidental commit of `.vercel/`, or any deploy misconfig that serves function source.
The `import.meta.env` fallback is also unnecessary: server code already has `process.env` at
runtime on Vercel.

**Fix direction (not applied):** drop the `?? import.meta.env.<SECRET>` fallback and read server
secrets from `process.env` only, so nothing is inlined. Rotate `RESEND_API_KEY` and
`TURNSTILE_SECRET_KEY` as a precaution — partial fragments of both surfaced in this assessment
session's transcript during the grep that located them.

### 2. [MEDIUM] Per-IP rate limit is keyed on a spoofable `X-Forwarded-For` (same pattern as main app)

`src/pages/api/early-access.ts:29`:

```ts
function readIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();   // <-- first element is client-controlled
  return request.headers.get('x-real-ip') ?? 'unknown';
}
```

The rate-limit key is `early-access:rl:${ip}` with a cap of 5 per 600s. Because Vercel appends the
real client IP to any inbound `X-Forwarded-For`, `split(',')[0]` returns the attacker-supplied
value. Rotating the header per request yields a fresh bucket every time, defeating the limiter as
designed — identical to the main-app finding.

**Mitigating factor (why MEDIUM, not high):** Turnstile is required *before* the rate check and
fails **closed** in production, and Turnstile tokens are single-use and validated by Cloudflare. So
sustained flooding still needs a freshly solved CAPTCHA per request, which sharply raises attacker
cost. The header spoof alone does not open the floodgates; it removes the secondary safety net.

**Fix direction:** derive the client IP from a trusted source (Vercel's `x-real-ip` / the last hop
of `x-forwarded-for` / the platform-provided request IP), not the first XFF element.

### 3. [LOW] No server-side allowlist validation on the select/enum fields

`yearsCoaching`, `clientCount`, and `currentPlatform` are accepted as arbitrary strings (only
trimmed and length-capped at `src/pages/api/early-access.ts:47-51`). The client renders them as
fixed `<select>` options, but the server never re-validates against the allowed set. An attacker
posting directly to `/api/early-access` can store arbitrary (bounded-length) text in these fields.
Impact is limited to junk/spam data in KV and in the notification email — the email interpolates
every field through `escapeHtml()` (`src/lib/escape.ts`) and strips CRLF from the subject, so there
is **no** HTML or header injection. Data-quality issue, not a breach.

### 4. [LOW] Rate-limit fail-open on KV error + no per-email dedup

If Vercel KV errors during the rate-limit check, the code logs and continues
(`early-access.ts:85-88`) — a deliberate, documented availability choice. There is also no
uniqueness constraint, so the same email may apply repeatedly (each write gets a distinct
`Date.now()`-based key). Combined with finding #2, a KV degradation window would remove rate
limiting entirely, though Turnstile still gates every request. Low.

### 5. [LOW/INFO] CSP allows `'unsafe-inline'` for scripts and styles

`vercel.json` ships an otherwise strong CSP but includes `'unsafe-inline'` in `script-src` and
`style-src`. On a static marketing site with all dynamic output HTML-escaped this is low risk, but
it weakens XSS defense-in-depth. Consider nonces/hashes if inline scripts can be eliminated.

---

## Coverage — checked and found clean

| Area | Result |
|---|---|
| **CAPTCHA bypass token / test-mode / prod skip** | **None.** No hardcoded bypass token, no test mode. `verifyTurnstile` **throws in production** if the secret is unset (fail-closed); the skip path is dev-only, gated on `!import.meta.env.PROD && NODE_ENV !== 'production'`. Better than the main app. |
| **Fail-open-when-secret-unset guard (the main-app pattern)** | **Not present.** Turnstile guard fails **closed** in prod. KV storage write fails **closed** (returns 500). Only the rate-limit check fails open (finding #4), by design. |
| **Email HTML / header injection** | Clean. All fields escaped via `escapeHtml`; subject strips `\r\n` and truncates. |
| **Datastore injection / key overwrite** | Clean. KV (not SQL); values `JSON.stringify`'d. Storage key = `early-access:${Date.now()}:${validatedEmail}`; the numeric timestamp segment cannot collide with the `rl` rate-limit keyspace, so no key-overwrite of limiter state. |
| **Readback of submissions** | Clean. Only a `POST` handler exists; no GET/list/admin endpoint. An anonymous visitor cannot read stored entries; they live in KV, viewed via the Upstash dashboard only. |
| **Client bundle / source-map secret leak** | Clean. `dist/client/**` contains only the public Turnstile **site** key. No `re_…`, no Turnstile secret, no KV token, no connection strings. No `.map` files shipped. |
| **Git history secrets** | Clean. No `.env*` ever committed; no `re_…` secret in history. |
| **Endpoint enumeration** | One server endpoint only: `POST /api/early-access`. All other routes are static prerendered HTML. No admin/debug/preview/serverless route reachable anonymously. |
| **DB / KV credential exposure** | Clean. `@vercel/kv` reads its REST URL/token from server-only env; nothing in the client bundle. |
| **Response & security headers** | Strong. Site-wide (`/(.*)`) CSP, HSTS (2yr + includeSubDomains), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`. (See finding #5 re `unsafe-inline`.) |
| **Public assets / caching** | Clean. `public/` holds only favicons, `og-default.png`, `robots.txt`, sitemaps. No per-user or sensitive data is served or cacheable. |

## Comparison to the three main-app patterns

1. **Hardcoded CAPTCHA bypass token accepted in prod** — **absent here.** No bypass token; Turnstile
   fails closed in production.
2. **Spoofable forwarded-for defeating per-IP rate limiting** — **present** (finding #2), but
   mitigated by mandatory fail-closed, single-use Turnstile.
3. **Guard that fails OPEN when its secret is unset** — **absent/inverted here.** The Turnstile
   guard fails **closed** when its secret is unset in production.
