// Shared data for the DOTS, Wilks and plate calculator pages (W840).
//
// DOTS and Wilks: formulas, coefficients and body weight ranges as defined in the OpenPowerlifting
// source code, crates/coefficients/src/dots.rs and wilks.rs (Wilks is the original formula, not the
// 2020 revision). Each coefficient is kept as its decimal text, so the coefficient tables on the
// pages and the calculator read the same values. Do not edit a coefficient without checking it
// against those files.

export const ORG_ID = 'https://wolvec.ai/#organization';
export const PUBLISHED = '2026-10-30';

/** Kilograms per pound, exact by definition. */
export const LB_TO_KG = 0.45359237;

export type Category = 'men' | 'women';
export interface Term { name: string; power: number; text: string }
export interface Formula {
  /** Body weight range in kg; a body weight outside it is moved to the nearest end before the formula runs. */
  min: number;
  max: number;
  terms: Term[];
}

/** DOTS: score = total * 500 / (A bw^4 + B bw^3 + C bw^2 + D bw + E), total and bw in kg. */
export const DOTS: Record<Category, Formula> = {
  men: {
    min: 40,
    max: 210,
    terms: [
      { name: 'A', power: 4, text: '-0.0000010930' },
      { name: 'B', power: 3, text: '0.0007391293' },
      { name: 'C', power: 2, text: '-0.1918759221' },
      { name: 'D', power: 1, text: '24.0900756' },
      { name: 'E', power: 0, text: '-307.75076' },
    ],
  },
  women: {
    min: 40,
    max: 150,
    terms: [
      { name: 'A', power: 4, text: '-0.0000010706' },
      { name: 'B', power: 3, text: '0.0005158568' },
      { name: 'C', power: 2, text: '-0.1126655495' },
      { name: 'D', power: 1, text: '13.6175032' },
      { name: 'E', power: 0, text: '-57.96288' },
    ],
  },
};

/** Wilks (original): score = total * 500 / (a + b bw + c bw^2 + d bw^3 + e bw^4 + f bw^5), total and bw in kg. */
export const WILKS: Record<Category, Formula> = {
  men: {
    min: 40,
    max: 201.9,
    terms: [
      { name: 'a', power: 0, text: '-216.0475144' },
      { name: 'b', power: 1, text: '16.2606339' },
      { name: 'c', power: 2, text: '-0.002388645' },
      { name: 'd', power: 3, text: '-0.00113732' },
      { name: 'e', power: 4, text: '0.00000701863' },
      { name: 'f', power: 5, text: '-0.00000001291' },
    ],
  },
  women: {
    min: 26.51,
    max: 154.53,
    terms: [
      { name: 'a', power: 0, text: '594.31747775582' },
      { name: 'b', power: 1, text: '-27.23842536447' },
      { name: 'c', power: 2, text: '0.82112226871' },
      { name: 'd', power: 3, text: '-0.00930733913' },
      { name: 'e', power: 4, text: '0.00004731582' },
      { name: 'f', power: 5, text: '-0.00000009054' },
    ],
  },
};

// Coefficients as numbers, highest power first, read once per formula.
const COEFS = new Map<Formula, number[]>();
const coefs = (f: Formula) => {
  let c = COEFS.get(f);
  if (!c) {
    c = [...f.terms].sort((p, q) => q.power - p.power).map((t) => Number(t.text));
    COEFS.set(f, c);
  }
  return c;
};

/** The formula's polynomial at x (kg), by Horner's method from the highest power down. */
export const poly = (f: Formula, x: number) => coefs(f).reduce((acc, k) => acc * x + k, 0);

/** Score for a total and body weight in kg. outside is true when the body weight was moved into range. */
export const scoreOf = (f: Formula, totalKg: number, bodyKg: number) => {
  const x = Math.min(Math.max(bodyKg, f.min), f.max);
  return { value: (totalKg * 500) / poly(f, x), outside: bodyKg < f.min || bodyKg > f.max, used: x };
};

/**
 * Two decimals, rounded half up. toFixed(6) first removes floating-point noise, so an exact half
 * computed as 0.12499999999999999 rounds up, as on the other calculators.
 */
export const round2 = (x: number) => (Math.round(Number((x * 100).toFixed(6))) / 100).toFixed(2);

/** Bars and plates offered on the plate calculator, heaviest first. */
export const PLATES = {
  lb: { bars: [45, 35, 15], plates: [45, 35, 25, 10, 5, 2.5] },
  kg: { bars: [20, 15, 10], plates: [25, 20, 15, 10, 5, 2.5, 1.25] },
} as const;

export const SOURCES = {
  oplDots: {
    href: 'https://github.com/sstangl/openpowerlifting/blob/main/crates/coefficients/src/dots.rs',
    text: 'OpenPowerlifting source code: dots.rs, the DOTS formula and coefficients.',
  },
  oplWilks: {
    href: 'https://github.com/sstangl/openpowerlifting/blob/main/crates/coefficients/src/wilks.rs',
    text: 'OpenPowerlifting source code: wilks.rs, the original Wilks formula and coefficients.',
  },
  oplWilks2020: {
    href: 'https://github.com/sstangl/openpowerlifting/blob/main/crates/coefficients/src/wilks2020.rs',
    text: 'OpenPowerlifting source code: wilks2020.rs, the 2020 update to the Wilks formula.',
  },
  wikiWilks: {
    href: 'https://en.wikipedia.org/wiki/Wilks_coefficient',
    text: 'Wikipedia: Wilks coefficient.',
  },
  ipfGl: {
    href: 'https://www.powerlifting.sport/rules/codes/info/ipf-formula',
    text: 'International Powerlifting Federation: IPF GL Formula.',
  },
} as const;

export const articleLd = (headline: string, description: string, url: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline,
  description,
  datePublished: PUBLISHED,
  dateModified: PUBLISHED,
  url,
  mainEntityOfPage: url,
  author: { '@type': 'Organization', '@id': ORG_ID, name: 'Wolvec' },
  publisher: { '@type': 'Organization', '@id': ORG_ID, name: 'Wolvec' },
});
