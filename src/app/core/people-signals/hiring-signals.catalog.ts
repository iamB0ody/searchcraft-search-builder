import { HiringSignalDefinition } from './hiring-signals.model';

/**
 * Catalog of all available hiring signals
 *
 * Each signal defines phrases that get injected into the Boolean query
 * to help find candidates who match specific availability patterns.
 */
export const HIRING_SIGNALS_CATALOG: HiringSignalDefinition[] = [
  {
    id: 'openToOpportunities',
    title: 'Open to Opportunities',
    description: 'Find candidates who indicate openness in their profile',
    category: 'include',
    includePhrases: [
      '"open to work"',
      '"open to opportunities"',
      '"seeking new opportunities"',
      '"looking for opportunities"'
    ],
    excludePhrases: []
  },
  {
    id: 'recruiterFriendlyBio',
    title: 'Recruiter-Friendly Bio',
    description: 'Profiles with professional descriptions',
    category: 'include',
    includePhrases: [
      '"experience in"',
      '"specializing in"',
      '"background in"'
    ],
    excludePhrases: []
  },
  {
    id: 'excludeStudentsInterns',
    title: 'Exclude Students/Interns',
    description: 'Filter out entry-level and student profiles',
    category: 'exclude',
    includePhrases: [],
    excludePhrases: [
      'student',
      'intern',
      'internship',
      'undergraduate',
      '"graduate student"',
      'bootcamp'
    ]
  },
  {
    id: 'excludeFreelanceOnly',
    title: 'Exclude Freelance-Only',
    description: 'Filter out contractors and freelancers',
    category: 'exclude',
    includePhrases: [],
    excludePhrases: [
      '"freelance only"',
      'freelancer',
      '"self employed"',
      'contractor'
    ]
  },
  {
    id: 'growthPlateau',
    title: 'Growth Plateau',
    description: 'Candidates in role for 3+ years may seek change',
    category: 'advanced',
    includePhrases: [
      '"since 2019"',
      '"since 2020"',
      '"since 2021"'
    ],
    excludePhrases: [],
    isExperimental: true
  }
];

/**
 * Get a signal definition by ID
 */
export function getSignalById(id: string): HiringSignalDefinition | undefined {
  return HIRING_SIGNALS_CATALOG.find(signal => signal.id === id);
}

/**
 * Get signals by category
 */
export function getSignalsByCategory(category: HiringSignalDefinition['category']): HiringSignalDefinition[] {
  return HIRING_SIGNALS_CATALOG.filter(signal => signal.category === category);
}
