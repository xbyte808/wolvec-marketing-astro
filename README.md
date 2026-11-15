# wolvec-marketing-astro

The marketing site for wolvec.ai, built with Astro and deployed on Vercel.

## Commands

```
npm ci            install exact dependencies
npm run dev       local dev server
npm run build     static build into dist/
npm run preview   serve the build locally
```

## Before you change anything

Read CLAUDE.md. Parts of this site carry counsel-approved legal and marketing copy that is not edited without a counsel reference.

## Checks

- `scripts/counsel_lock_check.py` checks the counsel-locked text on the Trainerize alternatives page and the personal training pricing guide in a built site. Usage is in CLAUDE.md.
- `scripts/indexnow-submit.mjs` (`npm run indexnow`) tells IndexNow about changed pages after a deploy. Usage is in CLAUDE.md.
