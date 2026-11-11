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
5. **Positioning**: this coach-facing site may use automate / automation /
   automatic language (founder ruling 2026-10-21, Standing Decision
   superseding the 2026-07-17 "never automation" rule). Copy that clients
   read inside the app still frames the AI as more access to their coach.
   Automation claims must be true as written (review is the default, every
   program week needs coach approval) or go to counsel. No specific
   interview duration in marketing copy.
6. **Never claim the AI reproduces the coach** (counsel, 2026-10-21): no
   "much like you would", "like you", "sounds like you" or similar for replies or
   program drafts. Say what it is configured from: "based on how you coach".
   The Safety section's limitation ("may not identify every concern") is
   never removed or weakened without counsel.

Pull exact current wording from Notion "Standing Decisions" before relying on
the summaries above — they compress, they do not replace, the record.

## Repo mechanics

```
Dev       npm run dev
Build     npm run build
Preview   npm run preview
```

Astro 6, deployed on Vercel. There are no GitHub Actions workflows (no
`.github/workflows`). A ruleset on `main` requires the Vercel status check, so a PR cannot merge until Vercel builds it successfully. That is a build check, not a test suite: nothing checks copy, counsel text or links automatically (ruleset confirmed with gh api by the W904 session). PRs merge under the project's merge tiers: docs, copy and config merge after the builder self-verifies and says so in the PR body. Any PR touching Privacy Policy, CHDP or other legal copy still needs the counsel reference in rule 1, checked by a human before merge. An automated check for rule 1 (or a different
enforcement point for it) is W226/W246's scope, not assumed done.

### Counsel lock check

- `scripts/counsel_lock_check.py` checks, in the BUILT HTML, that every counsel-locked sentence on the Trainerize alternatives page and the personal training pricing guide is present verbatim and every sentence counsel removed is absent.
- After `npm run build`: `python3 -I scripts/counsel_lock_check.py dist/client/compare/trainerize-alternatives/index.html dist/client/guides/how-much-to-charge-for-personal-training/index.html --checked "<Month D, YYYY>"`, where the date is the Trainerize page's "Information checked" date. Use `python` instead of `python3` on Windows. Pass `-` in place of a page you are not checking.
- It exits 0 only if every check passes. A failure is a finding to report, never a reason to edit the page or the script. Changing an expected string in the script needs a counsel reference.

### IndexNow

- After a PR that adds or changes a page is merged and the change is live, run: `npm run indexnow -- <the changed page URLs>`
- Run it once per deploy at most. Run it with no arguments only when many pages changed at once.
- The verification file in public/ (a 32 character hex name ending in .txt) must never be renamed or deleted. Renaming it breaks verification.

## Where state lives

This file holds repo practice only. Current state, open decisions, and
Standing Decisions live in Notion (Coaching Platform workspace) — read there,
not from memory, before treating anything above as still current.
