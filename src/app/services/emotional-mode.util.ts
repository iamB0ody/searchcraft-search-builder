import { QueryPayload } from '../models/platform.model';
import { EmotionalSearchMode, ESSENTIAL_EXCLUDES } from '../models/emotional-mode.model';

/**
 * Result of applying emotional mode transformation
 */
export interface EmotionalModeResult {
  /** Transformed payload (never mutates original) */
  payload: QueryPayload;
  /** List of adjustments made for transparency */
  adjustments: string[];
  /** Flag indicating if skills should use OR instead of AND */
  useOrForSkills: boolean;
}

/**
 * Configuration for urgent mode limits
 */
const URGENT_MODE_LIMITS = {
  maxTitles: 3,
  maxSkills: 2,
  maxExcludes: 4
};

/**
 * Apply emotional mode transformation to a query payload.
 *
 * This is a pure function that:
 * - Never mutates the original payload
 * - Returns adjustments for transparency
 * - Runs BEFORE platform-specific adaptation
 *
 * @param payload - Original query payload
 * @param mode - Emotional search mode
 * @returns Transformed payload with adjustments list
 */
export function applyEmotionalMode(
  payload: QueryPayload,
  mode: EmotionalSearchMode = 'normal'
): EmotionalModeResult {
  // Normal mode: return original payload unchanged
  if (mode === 'normal') {
    return {
      payload,
      adjustments: [],
      useOrForSkills: false
    };
  }

  // Clone payload to avoid mutation
  const adjusted: QueryPayload = {
    ...payload,
    titles: [...(payload.titles || [])],
    skills: [...(payload.skills || [])],
    exclude: [...(payload.exclude || [])]
  };
  const adjustments: string[] = [];
  let useOrForSkills = false;

  if (mode === 'urgent') {
    // URGENT MODE: Broader, faster results
    // Accept noise, prioritize speed over precision

    // Limit titles to max 3
    if (adjusted.titles.length > URGENT_MODE_LIMITS.maxTitles) {
      const removed = adjusted.titles.length - URGENT_MODE_LIMITS.maxTitles;
      adjusted.titles = adjusted.titles.slice(0, URGENT_MODE_LIMITS.maxTitles);
      adjustments.push(`Reduced titles from ${removed + URGENT_MODE_LIMITS.maxTitles} to ${URGENT_MODE_LIMITS.maxTitles}`);
    }

    // Limit skills to max 2 and use OR joining
    if (adjusted.skills.length > URGENT_MODE_LIMITS.maxSkills) {
      const removed = adjusted.skills.length - URGENT_MODE_LIMITS.maxSkills;
      adjusted.skills = adjusted.skills.slice(0, URGENT_MODE_LIMITS.maxSkills);
      adjustments.push(`Reduced skills from ${removed + URGENT_MODE_LIMITS.maxSkills} to ${URGENT_MODE_LIMITS.maxSkills}`);
    }

    // Use OR for skills in urgent mode (broader results)
    if (adjusted.skills.length > 1) {
      useOrForSkills = true;
      adjustments.push('Using OR between skills for broader results');
    }

    // Filter excludes to only essential ones
    if (adjusted.exclude.length > 0) {
      const originalCount = adjusted.exclude.length;
      adjusted.exclude = adjusted.exclude.filter(term =>
        ESSENTIAL_EXCLUDES.some(essential =>
          term.toLowerCase().includes(essential.toLowerCase())
        )
      );

      // If no essential excludes found, keep top few
      if (adjusted.exclude.length === 0 && originalCount > 0) {
        adjusted.exclude = payload.exclude.slice(0, Math.min(2, originalCount));
      }

      // Limit total excludes
      if (adjusted.exclude.length > URGENT_MODE_LIMITS.maxExcludes) {
        adjusted.exclude = adjusted.exclude.slice(0, URGENT_MODE_LIMITS.maxExcludes);
      }

      if (adjusted.exclude.length < originalCount) {
        adjustments.push(`Reduced exclusions from ${originalCount} to ${adjusted.exclude.length}`);
      }
    }
  }

  if (mode === 'chill') {
    // CHILL MODE: Quality-focused, precise results
    // Keep everything, prefer stricter matching

    // Keep all titles (no limit)
    // Keep all skills (no limit)
    // Keep all excludes (no limit)

    // No adjustments needed - chill mode preserves the full query
    // The main difference is in quality score interpretation
    adjustments.push('Quality mode: full query preserved for precise results');
  }

  return {
    payload: adjusted,
    adjustments,
    useOrForSkills
  };
}

/**
 * Get a human-readable description of the emotional mode effect
 */
export function getEmotionalModeDescription(mode: EmotionalSearchMode): string {
  switch (mode) {
    case 'urgent':
      return 'Query broadened for faster results';
    case 'chill':
      return 'Query focused on quality and precision';
    case 'normal':
    default:
      return 'Balanced search';
  }
}
