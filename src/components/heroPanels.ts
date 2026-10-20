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
import workout from '../assets/hero/panel-3-F34-floor-session-in-workout.png';

export interface HeroPanel {
  label: string;
  image: ImageMetadata;
  alt: string;
  // Rendered widths requested from the image pipeline, in pixels.
  widths: number[];
  // Outline rectangles in the cropped image's own pixel space, measured from
  // the text pixels plus a margin. The component converts them to
  // percentages so they track the image at every size.
  highlights: { x: number; y: number; width: number; height: number }[];
  // Narrow-screen cap, so the tall phone capture does not fill the viewport.
  maxWidthStacked?: string;
}

export const coachTeaches: HeroPanel = {
  label: 'You explain how you coach',
  image: interview,
  alt: 'Wolvec coaching interview screen. The AI asks what training week the coach would build for a client who can train four days and is drained by Thursday. The coach answers that Thursday is a floor session: thirty minutes, a few easy sets of the main lift and then a walk, and the rule is never zero. The AI replies that the floor session idea protects consistency, then asks about stalled progress.',
  widths: [480, 960, 1228],
  // The coach's own words. The box takes in her colon so its right edge
  // lands in the word gap before "thirty"; the AI's later "That floor
  // session idea" is not outlined because its word gaps are narrower than
  // the outline at phone width, and it would cover the "t" of "That".
  // Text runs x 213 to 354 with "thirty" starting at 363, so at 375px wide
  // the outline and its ring only just fit in that gap. Re-measure if the
  // outline weight or the crop changes.
  highlights: [{ x: 202, y: 198, width: 157, height: 34 }],
};

export const aiDraftsCoachApproves: HeroPanel = {
  label: 'Your AI drafts the week from it. You approve it.',
  image: draft,
  alt: 'Wolvec program review screen for the coach. A bar reads Week 1 is awaiting your approval before the client can see it, next to an Approve week 1 button. Day 3, Floor Session, is selected and shows barbell full squat, 2 sets of 3 at RPE 6, with a client-facing coaching note that says the session has one job: keep the habit alive.',
  widths: [640, 1280, 1732],
  highlights: [{ x: 116, y: 297, width: 212, height: 40 }],
};

export const clientTrains: HeroPanel = {
  label: 'Your client trains from what you approved',
  image: workout,
  alt: 'Wolvec client workout screen on a phone: Week 1, Day 3, Floor Session. The barbell full squat card shows the plan, 2 sets of 3 at RPE 5, and a coaching note that ends: The point is never zero on this day.',
  widths: [320, 640, 960],
  highlights: [{ x: 18, y: 130, width: 705, height: 124 }],
  maxWidthStacked: '280px',
};

export const heroPictureFootnote =
  'Real Wolvec screens from an example coach account, shortened to fit.';
