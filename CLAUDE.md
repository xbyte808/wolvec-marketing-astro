# Wolvec Marketing Site

Astro site on Vercel, served at wolvec.ai. Separate repo and separate deploy from
the coaching app at app.wolvec.ai. Nothing here talks to the product database.

## Session rules

1. **PRs only, CI green before merge.** Doc-only changes may go direct to main.
2. **Copy is supplied, never authored.** Marketing and legal copy comes from the
   founder or from counsel and is used verbatim. Do not improve, tighten, or
   rewrite it. Do not invent statistics, testimonials, pricing tiers, or feature
   claims — fabricated claims have been caught here before shipping.
3. **Every claim must be product-accurate.** If copy describes something the
   product does not do, stop and report it rather than shipping it.
4. **Commit at checkpoints and push, then verify the push landed.**
5. **End with a structured summary**: decisions-needed, done-verified, blocked,
   next.

## Secrets

A PreToolUse hook and a deny list block reads of `.env*` files. They do not
cover what you print. Never emit a full secret into the transcript, never grep a
broad prefix that could match a credential, and never pass a token as a visible
CLI argument.

## Working directory

**This repo is not the coaching platform.** If your session's primary repo is
`coaching-platform`, `EnterWorktree` will create the worktree in the wrong place.
Create the worktree manually and pass its absolute path on every Read, Write,
Edit, Glob, and Grep call for the rest of the session.

Coaching-platform rules do not apply here and should not be carried across.

## Legal entity

The entity named on every public surface is "Wolvec L.L.C., a Wyoming limited
liability company." Veccor is the parent brand.

## Do not

- Publish or edit a privacy policy, terms, or health-data disclosure without
  founder sign-off. These are counsel-supplied and version-controlled for
  evidentiary reasons.
- Add analytics, tracking pixels, or third-party scripts.
- Link to app.wolvec.ai surfaces that require authentication as if they were
  public.
