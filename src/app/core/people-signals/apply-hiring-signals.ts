import { QueryPayload, PlatformCapabilities } from '../../models/platform.model';
import { HiringSignalId } from './hiring-signals.model';
import { HIRING_SIGNALS_CATALOG } from './hiring-signals.catalog';

/**
 * Explanation of hiring signals application for transparency in preview
 */
export interface HiringSignalsExplanation {
  /** Whether hiring signals were enabled */
  enabled: boolean;
  /** IDs of signals that were applied */
  appliedSignals: HiringSignalId[];
  /** Include phrases that were injected into the query */
  injectedIncludes: string[];
  /** Exclude phrases that were added to exclusions */
  injectedExcludes: string[];
  /** Any warnings about the signal configuration */
  warnings: string[];
}

/**
 * Result of applying hiring signals transformation
 */
export interface HiringSignalsResult {
  /** Transformed payload (never mutates original) */
  payload: QueryPayload;
  /** Explanation for transparency */
  explanation: HiringSignalsExplanation;
}

/**
 * Empty explanation for when signals are disabled
 */
const EMPTY_EXPLANATION: HiringSignalsExplanation = {
  enabled: false,
  appliedSignals: [],
  injectedIncludes: [],
  injectedExcludes: [],
  warnings: []
};

/**
 * Apply hiring signals transformation to a query payload.
 *
 * This is a pure function that:
 * - Never mutates the original payload
 * - Returns explanation for transparency
 * - Runs AFTER emotional mode and BEFORE platform adapter
 * - Only applies to 'people' search type
 *
 * Signal include phrases are ANDed with the main query (titles AND skills AND signals)
 * Signal exclude phrases are added to the exclude list
 *
 * @param payload - Query payload (possibly already transformed by emotional mode)
 * @param platformCapabilities - Platform capabilities for warnings
 * @returns Transformed payload with explanation
 */
export function applyHiringSignals(
  payload: QueryPayload,
  platformCapabilities: PlatformCapabilities
): HiringSignalsResult {
  // If hiring signals disabled, not enabled, or not people search, return unchanged
  if (
    !payload.hiringSignals?.enabled ||
    payload.searchType !== 'people' ||
    payload.hiringSignals.selected.length === 0
  ) {
    return {
      payload,
      explanation: { ...EMPTY_EXPLANATION }
    };
  }

  // Clone payload to avoid mutation
  const adjusted: QueryPayload = {
    ...payload,
    titles: [...(payload.titles || [])],
    skills: [...(payload.skills || [])],
    exclude: [...(payload.exclude || [])]
  };

  const explanation: HiringSignalsExplanation = {
    enabled: true,
    appliedSignals: [],
    injectedIncludes: [],
    injectedExcludes: [],
    warnings: []
  };

  // Collect phrases from selected signals
  const selectedIds = payload.hiringSignals.selected;
  let allIncludes: string[] = [];
  let allExcludes: string[] = [];

  for (const signalId of selectedIds) {
    const signal = HIRING_SIGNALS_CATALOG.find(s => s.id === signalId);
    if (signal) {
      explanation.appliedSignals.push(signalId);
      allIncludes.push(...signal.includePhrases);
      allExcludes.push(...signal.excludePhrases);
    }
  }

  // Deduplicate
  allIncludes = [...new Set(allIncludes)];
  allExcludes = [...new Set(allExcludes)];

  // Store in explanation
  explanation.injectedIncludes = allIncludes;
  explanation.injectedExcludes = allExcludes;

  // Store includes in signalIncludes field for query builder to handle
  if (allIncludes.length > 0) {
    adjusted.signalIncludes = allIncludes;
  }

  // Merge excludes with existing (dedup against existing)
  if (allExcludes.length > 0) {
    const existingExcludesLower = new Set(
      adjusted.exclude.map(e => e.toLowerCase())
    );
    for (const ex of allExcludes) {
      if (!existingExcludesLower.has(ex.toLowerCase())) {
        adjusted.exclude.push(ex);
      }
    }
  }

  // Add warnings
  const totalPhrases = allIncludes.length + allExcludes.length;
  if (totalPhrases > 10) {
    explanation.warnings.push('Many signal phrases may reduce results');
  }

  // Platform warning for non-LinkedIn platforms
  const isLinkedInPlatform = platformCapabilities.region === 'global' &&
    platformCapabilities.booleanLevel === 'good';
  if (!isLinkedInPlatform) {
    explanation.warnings.push('Hiring signals work best on LinkedIn/Sales Navigator');
  }

  return {
    payload: adjusted,
    explanation
  };
}

/**
 * Get a summary description of applied hiring signals
 */
export function getHiringSignalsSummary(explanation: HiringSignalsExplanation): string {
  if (!explanation.enabled || explanation.appliedSignals.length === 0) {
    return '';
  }

  const count = explanation.appliedSignals.length;
  return `${count} hiring signal${count === 1 ? '' : 's'} applied`;
}
