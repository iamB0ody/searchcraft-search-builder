import { SynonymEntry } from '../models/intelligence.model';

/**
 * Conservative synonym dictionary
 * Only includes well-established synonyms to avoid false suggestions
 */
export const SYNONYMS_DATA: SynonymEntry[] = [
  // Roles - common variations
  {
    term: 'Frontend Developer',
    synonyms: ['Front-End Developer', 'Front End Developer', 'UI Developer', 'Frontend Engineer'],
    category: 'role'
  },
  {
    term: 'Backend Developer',
    synonyms: ['Back-End Developer', 'Back End Developer', 'Server Developer', 'Backend Engineer'],
    category: 'role'
  },
  {
    term: 'Full Stack Developer',
    synonyms: ['Fullstack Developer', 'Full-Stack Developer', 'Full Stack Engineer'],
    category: 'role'
  },
  {
    term: 'Software Engineer',
    synonyms: ['Software Developer', 'SWE', 'Programmer'],
    category: 'role'
  },
  {
    term: 'DevOps Engineer',
    synonyms: ['DevOps', 'Site Reliability Engineer', 'SRE', 'Platform Engineer'],
    category: 'role'
  },
  {
    term: 'QA Engineer',
    synonyms: ['Quality Assurance Engineer', 'Test Engineer', 'SDET', 'QA Analyst'],
    category: 'role'
  },
  {
    term: 'Data Engineer',
    synonyms: ['Data Platform Engineer', 'ETL Developer', 'Data Infrastructure Engineer'],
    category: 'role'
  },
  {
    term: 'Data Scientist',
    synonyms: ['ML Engineer', 'Machine Learning Engineer', 'AI Engineer'],
    category: 'role'
  },
  {
    term: 'Product Manager',
    synonyms: ['PM', 'Product Owner', 'PO'],
    category: 'role'
  },
  {
    term: 'UX Designer',
    synonyms: ['User Experience Designer', 'UX/UI Designer', 'Product Designer'],
    category: 'role'
  },
  // Technologies - common abbreviations only
  {
    term: 'JavaScript',
    synonyms: ['JS', 'ECMAScript'],
    category: 'technology'
  },
  {
    term: 'TypeScript',
    synonyms: ['TS'],
    category: 'technology'
  },
  {
    term: 'React',
    synonyms: ['ReactJS', 'React.js'],
    category: 'technology'
  },
  {
    term: 'Angular',
    synonyms: ['AngularJS', 'Angular.js'],
    category: 'technology'
  },
  {
    term: 'Node.js',
    synonyms: ['NodeJS', 'Node'],
    category: 'technology'
  },
  {
    term: 'PostgreSQL',
    synonyms: ['Postgres', 'PG'],
    category: 'technology'
  },
  {
    term: 'Kubernetes',
    synonyms: ['K8s', 'K8'],
    category: 'technology'
  },
  {
    term: 'Amazon Web Services',
    synonyms: ['AWS'],
    category: 'technology'
  },
  {
    term: 'Google Cloud Platform',
    synonyms: ['GCP', 'Google Cloud'],
    category: 'technology'
  },
  {
    term: 'Microsoft Azure',
    synonyms: ['Azure'],
    category: 'technology'
  }
];
