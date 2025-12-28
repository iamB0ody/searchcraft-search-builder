/**
 * Hiring Signals Model
 *
 * Types and defaults for the Hiring Signals feature that helps recruiters
 * build smarter Boolean queries by injecting deterministic, text-based phrases
 * that commonly indicate candidate availability.
 */

/**
 * Available hiring signal identifiers
 */
export type HiringSignalId =
  | 'openToOpportunities'
  | 'recruiterFriendlyBio'
  | 'excludeStudentsInterns'
  | 'excludeFreelanceOnly'
  | 'growthPlateau';

/**
 * State of hiring signals for a search
 */
export interface HiringSignalsState {
  enabled: boolean;
  selected: HiringSignalId[];
}

/**
 * Category of a hiring signal
 * - include: Adds phrases to search FOR
 * - exclude: Adds phrases to exclude
 * - advanced: Experimental signals
 */
export type HiringSignalCategory = 'include' | 'exclude' | 'advanced';

/**
 * Definition of a single hiring signal
 */
export interface HiringSignalDefinition {
  id: HiringSignalId;
  title: string;
  description: string;
  category: HiringSignalCategory;
  includePhrases: string[];
  excludePhrases: string[];
  isExperimental?: boolean;
}

/**
 * Default hiring signals state (disabled)
 */
export const DEFAULT_HIRING_SIGNALS: HiringSignalsState = {
  enabled: false,
  selected: []
};

/**
 * Default signals to preselect when user first enables the feature
 */
export const DEFAULT_SELECTED_SIGNALS: HiringSignalId[] = [
  'openToOpportunities',
  'excludeStudentsInterns'
];
