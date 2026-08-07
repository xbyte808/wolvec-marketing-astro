# Uncommitted-item review: .gitignore diff + orphan HTML file

Date: 2026-07-22
Scope: read-only investigation, no files modified/staged/committed.

## DECISIONS NEEDED

No decisions needed on the .gitignore change — it is a safe, protective
addition with no security implication.

One decision remains open: what to do with
`src/Wolvec Landing 09JUL.html` (untracked, 1.6MB). Recommendation below:
**safe to delete**, but flagging as a decision since it is a piece of
content the founder may want to glance at before it's discarded.

---

## Task 1 — `.gitignore` diff

Full diff (verbatim):

```diff
diff --git a/.gitignore b/.gitignore
index 2ebdbd5..3fa8d20 100644
--- a/.gitignore
+++ b/.gitignore
@@ -26,3 +26,5 @@ pnpm-debug.log*
 .vercel

 .vercel
+.env*
+!.env.example
```

**What changed:** Two lines were *added* at the end of the file:
`.env*` (ignore every dotenv-style file) and `!.env.example` (negation —
explicitly un-ignore `.env.example` so it stays trackable). **Nothing was
removed.** The diff is purely additive.

**Was any removed pattern protecting something sensitive?**
No. There is no removal in this diff at all — every line in the hunk is a
`+` line. The pre-existing entries `.env`, `.env.local`, and
`.env.production` (already present higher up in the file, untouched by
this diff) continue to be ignored exactly as before.

**Security implication: none negative.** This change is a *hardening*,
not a weakening — `.env*` is a broader catch-all than the three explicit
names it sits alongside, so it would also catch variants like
`.env.staging` or `.env.local.verify` that the old explicit list would
have missed. This matches the kind of gap called out in this project's
own security assessment history (a stray `.env.preview.local.verify` file
was found and removed in a past marketing-site audit).

**Would any added pattern silently un-track a currently-tracked file?**
Checked via `git ls-files | grep -i "\.env"`: the only tracked file
matching is `.env.example`. The added `!.env.example` negation exists
specifically to keep it tracked and un-ignored, so this is intentional
and correct, not an accident. No other tracked file matches `.env*`.

**Does anything currently untracked match a removed pattern?**
Not applicable — no pattern was removed. For completeness,
`git status --porcelain --ignored` shows the working tree's ignored
files are `.astro/`, `.env.local`, `.vercel/`, `dist/`, `node_modules/`
— `.env.local` is correctly still ignored (it was already ignored by the
pre-existing explicit line, and now also by the new `.env*` line).

**Verdict:** Safe. No action needed beyond eventually committing it
through the normal PR flow (it's a functional-ish repo config change, not
a doc-only change, so it should go through review rather than a direct
commit, per this project's own process discipline conventions).

---

## Task 2 — `src/Wolvec Landing 09JUL.html`

**Size / timestamp:** 1,618,173 bytes (~1.6 MB), 199 lines, last modified
2026-07-09 13:02 (local). Untracked (`??` in `git status`).

**What it is:** A self-contained "bundled" single-file HTML export, not
hand-written markup and not a plain saved webpage. The `<title>` is
literally `Bundled Page`. It opens with an "Unpacking..." loading
indicator and an inline SVG placeholder logo, then a `<script>` that
reconstructs the real page client-side from an embedded asset map. Line
189 alone is ~1.56 MB and consists of a JSON object keyed by UUIDs, each
holding a `mime`/`data` pair with base64-encoded image bytes (JPEGs) —
i.e., every image asset is inlined as base64 rather than linked. Line 197
(~39.7 KB) holds the actual page HTML as an escaped JS string
(`/`-style escapes), injected into the DOM at unpack time. This
pattern — self-decompressing bundle, inline base64 assets, "Unpacking..."
UI — is characteristic of a one-click "export/download as HTML" from a
design or AI website-building tool, not something authored by hand or by
this codebase's tooling.

**Does it duplicate the tracked landing page?**
Yes, substantially — this is essentially a snapshot of the site that
already exists in `src/`. Spot-checks of copy embedded in the bundle
match `src/components/*.astro` verbatim:

| Bundle text (line 197) | Tracked source |
|---|---|
| `The AI version<br>of you.` (h1) | `src/components/Hero.astro:25` — `The AI version<br />of <span class="text-azure">you</span>.` |
| `The AI version of you.` (footer tagline) | `src/components/Footer.astro:12` — identical |
| `replying to a client · now` | `src/components/Hero.astro:40` — identical |

Section references found in the bundle (`Your control`, `roadmap` nav
link) also correspond to existing tracked sections/routes
(`YourControl.astro`, `src/pages/roadmap.astro`). No trace of
`More than the AI` / a chat-demo section — the one homepage section that
is currently staged-but-unshipped (see PR #23, held per prior decision) —
appears anywhere in the bundle, so it doesn't leak or preview unreleased
work either.

**Earlier or later version?** The repo's *initial* Astro scaffold commit
(`7b4a2d1`, 2026-05-23) predates this file's 2026-07-09 timestamp by
~6.5 weeks, and the hero/footer copy in the bundle matches the *current*
tracked copy, not an older draft. So this is not a pre-Astro prototype —
it's a later point-in-time export/snapshot of the already-built site,
most likely pulled from a design tool for a design review, handoff, or
personal reference around July 9, after the real implementation already
existed.

**Anything unique — copy, layout, or design decisions found nowhere
else?** No. Every distinct piece of copy checked against tracked source
matched exactly. No unique sections, no unshipped content, no design
direction not already reflected in the live `.astro` components.

**Secrets / keys / tokens / analytics IDs / form endpoints / emails?**
None found. Searched for `action=`, `mailto:`, generic
`api[_-]?key|secret|token`, Google Analytics measurement IDs
(`G-XXXXXXX`), `gtag(`, Formspree/webhook URLs, and any embedded email
address pattern — all came back empty except one incidental match of the
literal substring `TOKEN` inside an unrelated JS variable name
(`MIME_TOKEN`, part of the unpacker's own MIME-type regex, not a secret).

**Referenced or imported anywhere in the build?**
No. Grepped the full tracked source tree (`.astro`, `.ts`, `.js`, `.json`,
`.md`) for the filename and for the substring `Wolvec Landing 09JUL` —
zero matches. It sits in `src/` next to real Astro source but is not
part of the Astro build graph (Astro only picks up `.astro`/route files
under `src/pages`; a loose `.html` file under `src/` at the top level is
inert and not compiled).

**Recommendation: safe to delete.** It is a large (1.6 MB), inert,
non-authoritative export whose content is a strict subset of what's
already tracked in `src/components` and `src/pages`, contains no secrets
or unique design decisions, and is wired into nothing. If there's any
sentimental/reference value in having a visual snapshot from that date,
export a screenshot or PDF instead of keeping a 1.6 MB duplicate HTML
blob in the repo — but that's optional, not a requirement.

---

## Summary

- `.gitignore`: additive only, hardens `.env*` coverage, correctly
  preserves `.env.example` tracking. No security concern.
- `Wolvec Landing 09JUL.html`: a design-tool export snapshot that
  duplicates already-tracked homepage content, no secrets, not referenced
  by the build. Safe to delete; no unique content would be lost.

No files were modified, staged, or deleted as part of this investigation.
