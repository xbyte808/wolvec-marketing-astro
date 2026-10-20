// Hero picture panels (W734). Each image is a crop of a real product capture
// from the example coach account; the crop rectangles, measured on the
// untouched originals, are listed in the PR that added them. Nothing inside
// an image is edited. The only thing drawn over a screen is the outlines in
// `highlights`, which mark the words "floor session" so the eye can follow
// the same rule from the interview, to the draft, to the client's workout.
//
// The three panels are separate true moments, not one record moving through
// the product: panel 2 and panel 3 come from two different program
// generations. Nothing here may claim panel 2 becomes panel 3.
import type { ImageMetadata } from 'astro';
import interview from '../assets/hero/panel-1-A04-interview-floor-session.png';
import draft from '../assets/hero/panel-2-B14b-week1-draft-floor-session.png';
import draftApprovalBar from '../assets/hero/panel-2-phone-a-B14b-approval-bar.png';
import draftFloorSessionNote from '../assets/hero/panel-2-phone-b-B14b-floor-session-note.png';
import workout from '../assets/hero/panel-3-F34-floor-session-in-workout.png';

// All values are in the cropped image's own pixels, so the outline scales
// with the image and its geometry against the text never changes. x, y,
// width and height are the INNER edge of the outline, measured clear of the
// glyphs. `stroke` grows outward from that edge, and a dark ring of 0.4 x
// stroke sits outside it. Each stroke is sized to draw about 2px at 1440px
// wide, and each stroke plus ring fits the measured gap to the nearest other
// glyph; the comments give the gap. Re-measure if a crop changes.
export interface Highlight {
  x: number;
  y: number;
  width: number;
  height: number;
  stroke: number;
}

export interface HeroShot {
  image: ImageMetadata;
  alt: string;
  // Rendered widths requested from the image pipeline, in pixels.
  widths: number[];
  highlights: Highlight[];
}

export interface HeroPanel {
  label: string;
  shot: HeroShot;
  // Shown instead of `shot` at 640px and below, each in its own frame.
  narrowShots?: HeroShot[];
  // Column width at 1440px, in pixels; columns keep these proportions.
  column: number;
  // Narrow-screen cap, so the tall phone capture does not fill the viewport.
  maxWidthStacked?: string;
}

export const heroPanels: HeroPanel[] = [
  {
    label: 'You explain how you coach',
    column: 500,
    shot: {
      image: interview,
      alt: 'Wolvec coaching interview screen. The AI asks what training week the coach would build for a client who can train four days and is drained by Thursday. The coach answers that Thursday is a floor session: thirty minutes, a few easy sets of the main lift and then a walk, and the rule is never zero. The AI replies that the floor session idea protects consistency, then asks about stalled progress.',
      widths: [480, 960, 1228],
      // The coach's own "floor session:", colon included. Only 7px are free
      // between the colon (ends x 355) and "thirty" (starts x 363), which
      // stroke 5 plus ring 2 fill exactly. The AI's later "That floor session
      // idea" is not outlined: its word gaps are narrower still.
      highlights: [{ x: 211, y: 202, width: 145, height: 23, stroke: 5 }],
    },
  },
  {
    label: 'Your AI drafts the week from it. You approve it.',
    column: 492,
    shot: {
      image: draft,
      alt: 'Wolvec program review screen for the coach. A bar reads Week 1 is awaiting your approval before the client can see it, next to an Approve week 1 button. Day 3, Floor Session, is selected and shows barbell full squat, 2 sets of 3 at RPE 6, with a client-facing coaching note that says the session has one job: keep the habit alive.',
      widths: [640, 1280, 1732],
      // Heading glyphs x 124 to 320; "Day 3" ends at 100, "Edit label"
      // starts at 344, so 23px are free on each side.
      highlights: [{ x: 120, y: 301, width: 205, height: 33, stroke: 7 }],
    },
    // Two crops of the same screen. One rectangle cannot keep "Approve
    // week 1" and drop the row of exercise buttons: they share columns.
    narrowShots: [
      {
        image: draftApprovalBar,
        alt: 'From the Wolvec program review screen: a bar reads Week 1 is awaiting your approval before the client can see it, next to an Approve week 1 button.',
        widths: [640, 1280, 1732],
        highlights: [],
      },
      {
        image: draftFloorSessionNote,
        alt: 'From the same draft: Day 3, Floor Session, with barbell full squat, 2 sets of 3 at RPE 6, and a client-facing coaching note that says the session has one job: keep the habit alive.',
        widths: [640, 1203],
        highlights: [{ x: 120, y: 30, width: 205, height: 33, stroke: 7 }],
      },
    ],
  },
  {
    label: 'Your client trains from what you approved',
    column: 320,
    maxWidthStacked: '280px',
    shot: {
      image: workout,
      alt: 'Wolvec client workout screen on a phone: Week 1, Day 3, Floor Session. The barbell full squat card shows the plan, 2 sets of 3 at RPE 5, and a coaching note that ends: The point is never zero on this day.',
      widths: [320, 640, 960],
      // Heading glyphs x 36 to 704, y 148 to 235; "Week 1 · Day 3" ends at
      // y 101, so 46px are free above.
      highlights: [{ x: 30, y: 141, width: 681, height: 101, stroke: 8.6 }],
    },
  },
];

export const heroPictureFootnote =
  'Real Wolvec screens from an example coach account, shortened to fit.';
