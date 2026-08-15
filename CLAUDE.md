# wolvec-marketing-astro

Canonical marketing site for wolvec.ai (Astro, deployed via Vercel). This repo
carries **COUNSEL-GOVERNED legal copy** — `docs/legal-versions/` holds
superseded Privacy Policy and Consumer Health Data drafts, and the live
Privacy Policy and CHDP pages reflect outside counsel's final wording, not a
marketer's paraphrase.

## Governing rules

1. **Never modify counsel-tagged or legal text without a counsel reference.**
   A 2026-08-13 merge silently overwrote counsel's reviewed safety-hold
   wording with an author's earlier draft; production served pre-counsel
   copy until a verification pass caught it. Founder ruling 2026-08-15 (W226)
   directs a CI check for this — **not built yet, and cannot be a CI check
   here until this repo has CI** (see Repo mechanics). Until then, any PR
   touching Privacy Policy, CHDP, or other legal copy needs an explicit
   counsel reference in the PR body, checked by a human before merge.
2. **User-facing terminology is locked**: "early access" / "trial", "your
   AI", never "pilot", "voice", or "clone" (Standing Decision, 2026-04-30,
   *durable*). Applies to marketing copy and outreach; verified clean on this
   site 2026-07-19.
3. **No fabricated testimonials, cohort claims, or performance numbers.**
   A prior copy export shipped a fake "trusted by cohort" line, an
   unsubstantiated "3x" claim, and an invented testimonial — cut before
   ship on FTC false-endorsement grounds (Daily Log decision, 2026-07-06/07).
   Real testimonials and metrics wait for real design partners. Product
   facts (e.g. response-time figures) may stay if not framed as social proof.
4. **All email senders are `wolvec.ai` only** — `ermstack.dev` is never a
   sender; it is not a verified Resend domain and sends from it silently
   fail (Standing Decision, 2026-06-09, *durable*).
5. **Positioning guardrail**: the AI is "more access to your coach," never
   automation or a bot replacing them — clients detect and resent
   bot-flavored messaging. No specific interview duration in marketing copy
   (Standing Decision, 2026-07-17, *durable*).

Pull exact current wording from Notion "Standing Decisions" before relying on
the summaries above — they compress, they do not replace, the record.

## Repo mechanics

```
Dev       npm run dev
Build     npm run build
Preview   npm run preview
```

Astro 6, deployed on Vercel. **No CI exists in this repo** — no
`.github/workflows`, confirmed 2026-08-15. PRs are merged by the founder by
hand; nothing here is CI-gated. Fixing that (or choosing a different
enforcement point for rule 1) is W226/W246's scope, not assumed done.

## Where state lives

This file holds repo practice only. Current state, open decisions, and
Standing Decisions live in Notion (Coaching Platform workspace) — read there,
not from memory, before treating anything above as still current.
