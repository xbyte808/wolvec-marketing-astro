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
];
