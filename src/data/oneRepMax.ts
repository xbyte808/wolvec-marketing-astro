// Shared copy for the one rep max calculator pages (W821). Counsel approved the method and
// copy 2026-10-29 (Standing Decision "ONE-REP-MAX CALCULATOR PAGES ON WOLVEC.AI"). Do not
// reword a string here without checking it against that ruling.

export const ORG_ID = 'https://wolvec.ai/#organization';
export const PUBLISHED = '2026-10-29';

export const SOURCES = {
  brzycki: {
    href: 'https://brzycki.scholar.princeton.edu/publications/strength-testing-%E2%80%93-predicting-one-rep-max-reps-fatigue',
    text: 'Brzycki M. Strength testing: predicting a one-rep max from reps-to-fatigue. Journal of Physical Education, Recreation and Dance, 1993; 64(1):88 to 90.',
  },
  mayhew: {
    href: 'https://doi.org/10.1519/JSC.0b013e31817b02ad',
    text: 'Mayhew JL and colleagues. Accuracy of prediction equations for determining one repetition maximum bench press in women before and after resistance training. Journal of Strength and Conditioning Research, 2008; 22(5):1570 to 1577.',
  },
  lesuer: {
    href: 'https://doi.org/10.1519/00124278-199711000-00001',
    text: 'LeSuer DA, McCormick JH, Mayhew JL, Wasserstein RL, Arnold MD. The accuracy of prediction equations for estimating 1-RM performance in the bench press, squat, and deadlift. Journal of Strength and Conditioning Research, 1997; 11(4):211 to 213.',
  },
} as const;

export interface ToolLink { href: string; label: string }
export const ORM_TOOLS: ToolLink[] = [
  { href: '/tools/one-rep-max-calculator', label: 'One rep max calculator' },
  { href: '/tools/bench-press-calculator', label: 'Bench press calculator' },
  { href: '/tools/squat-max-calculator', label: 'Squat max calculator' },
  { href: '/tools/deadlift-calculator', label: 'Deadlift calculator' },
  { href: '/tools/rpe-calculator', label: 'RPE calculator and RPE chart' },
];

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
