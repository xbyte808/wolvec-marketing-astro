// Cards on /resources. Each title and description is the linked page's own H1 and meta
// description, word for word; when a page's H1 or DESCRIPTION changes, change it here too.
export interface ResourceLink {
  href: string;
  title: string;
  description: string;
}

export const GUIDES: ResourceLink[] = [
  {
    href: '/guides/how-to-become-an-online-fitness-coach',
    title: 'How to become an online fitness coach',
    description:
      'How to become an online fitness coach, step by step: certification, scope, your niche and offer, business basics, your coaching system and first clients.',
  },
  {
    href: '/guides/how-to-get-clients-as-a-personal-trainer',
    title: 'How to get clients as a personal trainer',
    description:
      'How personal trainers get clients, in person or online: a clear offer, your network, referrals, local partners, Google Business Profile and follow-up.',
  },
];

export const TOOLS: ResourceLink[] = [
  {
    href: '/tools/rpe-calculator',
    title: 'RPE calculator and RPE chart',
    description:
      'RPE calculator and RPE chart for lifting. Enter a recent set to estimate a target weight, and see what each RPE scale rating means in reps in reserve.',
  },
  {
    href: '/tools/one-rep-max-calculator',
    title: 'One rep max calculator',
    description:
      'One rep max calculator. Estimate your one-rep max (1RM) and five-rep max (5RM) from a recent 1 to 9 rep set you already performed to failure.',
  },
  {
    href: '/tools/bench-press-calculator',
    title: 'Bench press calculator',
    description:
      'Bench press 1RM calculator. Estimate your bench press 1RM and five-rep max from a recent 1 to 9 rep set you already performed to failure.',
  },
  {
    href: '/tools/squat-max-calculator',
    title: 'Squat max calculator',
    description:
      'Squat max calculator. Estimate your squat 1RM and five-rep max from a recent 1 to 9 rep set you already performed to failure.',
  },
  {
    href: '/tools/deadlift-calculator',
    title: 'Deadlift calculator',
    description:
      'Deadlift calculator. Estimate your deadlift 1RM and five-rep max from a recent 1 to 9 rep set you already performed to failure.',
  },
  {
    href: '/tools/dots-calculator',
    title: 'DOTS score calculator',
    description:
      'DOTS score calculator for powerlifting. Enter a total and body weight in lb or kg to see the DOTS score, with the Wilks score alongside for comparison.',
  },
  {
    href: '/tools/wilks-calculator',
    title: 'Wilks calculator',
    description:
      'Wilks calculator for powerlifting. Enter a total and body weight in lb or kg to see the Wilks score from the original formula, with the DOTS score alongside.',
  },
  {
    href: '/tools/plate-calculator',
    title: 'Plate calculator',
    description:
      'Barbell plate calculator. Enter a target weight in lb or kg, choose your bar and the plates you have, and see which weight plates go on each side.',
  },
];
