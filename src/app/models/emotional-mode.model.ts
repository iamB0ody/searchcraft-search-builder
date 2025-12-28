/**
 * Emotional Search Mode
 *
 * Adjusts query composition based on user's current mindset:
 * - urgent: Broader, faster results (accepts noise)
 * - normal: Balanced search (default)
 * - chill: Quality-focused, precise results
 */

export type EmotionalSearchMode = 'urgent' | 'normal' | 'chill';

export interface EmotionalModeConfig {
  icon: string;
  label: string;
  description: string;
}

export const EMOTIONAL_MODE_CONFIG: Record<EmotionalSearchMode, EmotionalModeConfig> = {
  urgent: {
    icon: '😤',
    label: 'Urgent',
    description: 'Broader search for faster results'
  },
  normal: {
    icon: '😐',
    label: 'Normal',
    description: 'Balanced search'
  },
  chill: {
    icon: '😎',
    label: 'Chill',
    description: 'Quality-focused, precise results'
  }
};

/**
 * Strong exclusion terms that are kept even in Urgent mode
 */
export const ESSENTIAL_EXCLUDES = [
  'intern',
  'internship',
  'junior',
  'entry',
  'trainee',
  'student',
  'graduate'
];
