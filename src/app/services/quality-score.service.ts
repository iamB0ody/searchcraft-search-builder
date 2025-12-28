import { Injectable, inject } from '@angular/core';
import {
  QualityLevel,
  QualityReason,
  QualityScoreInput,
  QualityScoreResult
} from '../models/quality-score.model';
import { PlatformRegistryService } from './platforms/platform-registry.service';
import { BooleanLevel } from '../models/platform.model';
import { EmotionalSearchMode } from '../models/emotional-mode.model';
import { HiringSignalsExplanation } from '../core/people-signals/apply-hiring-signals';

/**
 * Service for calculating quality scores for search queries.
 * Provides a deterministic, rules-based scoring system with actionable feedback.
 */
@Injectable({ providedIn: 'root' })
export class QualityScoreService {
  private readonly platformRegistry = inject(PlatformRegistryService);

  /**
   * Calculate a quality score (0-100) for a search query input.
   * Returns score, level, reasons, and optional tips.
   * @param input - The search query input to score
   * @param platformId - Optional platform ID for platform-specific scoring
   * @param emotionalMode - Optional emotional mode for mode-specific adjustments
   * @param hiringSignalsExplanation - Optional hiring signals explanation for signal-specific warnings
   */
  calculateScore(
    input: QualityScoreInput,
    platformId?: string,
    emotionalMode: EmotionalSearchMode = 'normal',
    hiringSignalsExplanation?: HiringSignalsExplanation | null
  ): QualityScoreResult {
    let score = 100;
    const reasons: QualityReason[] = [];
    const tips: string[] = [];

    // Rule 1: Empty search (terminal case)
    if (input.titles.length === 0 && input.skills.length === 0) {
      if (input.exclude.length > 0) {
        return {
          score: 10,
          level: 'risky',
          reasons: [{ type: 'warning', message: 'Search has only exclusions, no positive criteria' }],
          tips: ['Add job titles or skills to find relevant results']
        };
      }
      return {
        score: 0,
        level: 'risky',
        reasons: [{ type: 'warning', message: 'Add job titles or skills to get results' }],
        tips: ['Start by adding at least one job title or skill']
      };
    }

    // Emotional mode adjustments for operator count thresholds
    const operatorPenaltyThreshold = emotionalMode === 'urgent' ? 25 : 20;
    const operatorWarningThreshold = emotionalMode === 'urgent' ? 20 : 15;

    // Rule 2: Operator count penalties (adjusted by emotional mode)
    if (input.operatorCount > operatorPenaltyThreshold) {
      score -= emotionalMode === 'urgent' ? 10 : 15;
      reasons.push({ type: 'warning', message: 'Query has many operators, may be complex' });
    } else if (input.operatorCount > operatorWarningThreshold) {
      score -= emotionalMode === 'urgent' ? 5 : 10;
      reasons.push({ type: 'info', message: 'Consider simplifying the query' });
    }

    // Rule 3: Too many ANDs (restrictive) - more lenient in chill mode, more strict in urgent mode
    const andCount = (input.booleanQuery.match(/\bAND\b/g) || []).length;
    const andThreshold = emotionalMode === 'urgent' ? 4 : (emotionalMode === 'chill' ? 12 : 8);
    if (andCount > andThreshold) {
      const penalty = emotionalMode === 'chill' ? 5 : 10;
      score -= penalty;
      if (emotionalMode === 'chill') {
        reasons.push({ type: 'info', message: 'Many AND terms may limit results' });
      } else {
        reasons.push({ type: 'warning', message: 'Many AND terms may be too restrictive' });
        tips.push('Try using OR between similar skills');
      }
    }

    // Rule 4: Query length
    if (input.booleanQuery.length >= 400) {
      score -= 10;
      reasons.push({ type: 'warning', message: 'Query exceeds recommended length' });
    } else if (input.booleanQuery.length >= 250) {
      score -= 5;
      reasons.push({ type: 'info', message: 'Query is long, some platforms may truncate' });
    }

    // Rule 5: Unsupported characters warning from BooleanBuilderService
    const hasUnsupportedWarning = input.warnings.some(w =>
      w.toLowerCase().includes('unsupported') || w.toLowerCase().includes('character')
    );
    if (hasUnsupportedWarning) {
      score -= 10;
      reasons.push({ type: 'warning', message: 'Query contains unsupported characters' });
    }

    // Rule 6: Platform-specific adjustments for Google Jobs
    if (platformId === 'google-jobs') {
      // Penalize complexity more aggressively for Google Jobs
      if (input.operatorCount > 10) {
        score -= 15;
        reasons.push({ type: 'warning', message: 'Google Jobs prefers simpler queries' });
        tips.push('Try reducing the number of search terms');
      }

      // Penalize long queries for Google Jobs
      if (input.booleanQuery.length > 150) {
        score -= 10;
        reasons.push({ type: 'info', message: 'Consider shortening your query for Google Jobs' });
      }

      // Penalize many ANDs (Google Jobs works better with OR)
      if (andCount > 3) {
        score -= 10;
        reasons.push({ type: 'info', message: 'Consider using OR instead of AND for broader results' });
      }
    }

    // Rule 7: Platform-aware penalties for limited Boolean platforms
    if (platformId) {
      const platform = this.platformRegistry.getPlatformById(platformId);
      if (platform) {
        const booleanLevel: BooleanLevel = platform.getCapabilities().booleanLevel;

        if (booleanLevel === 'partial' || booleanLevel === 'none') {
          // Penalize complexity more for limited platforms
          if (input.operatorCount > 5) {
            score -= 15;
            reasons.push({ type: 'warning', message: 'This platform prefers simpler queries' });
            tips.push('Try using fewer search terms');
          }

          // Penalize parentheses on limited platforms
          if (input.booleanQuery.includes('(')) {
            score -= 10;
            reasons.push({ type: 'info', message: 'Nested groups may not be supported' });
          }

          // Extra penalty for 'none' level platforms
          if (booleanLevel === 'none' && input.operatorCount > 3) {
            score -= 10;
            reasons.push({ type: 'warning', message: 'Boolean operators are not supported on this platform' });
            tips.push('Query will be converted to simple keywords');
          }
        }
      }
    }

    // Rule 8: Balanced search bonus (titles + skills)
    if (input.titles.length >= 1 && input.skills.length >= 1) {
      score += 5;
    }

    // Rule 9: Suggestion for no exclusions
    if (input.exclude.length === 0 && (input.titles.length + input.skills.length) > 2) {
      tips.push('Consider adding exclusions to refine results');
    }

    // Rule 10: Hiring signals warnings
    if (hiringSignalsExplanation?.enabled) {
      const totalPhrases =
        (hiringSignalsExplanation.injectedIncludes?.length || 0) +
        (hiringSignalsExplanation.injectedExcludes?.length || 0);

      if (totalPhrases > 10) {
        score -= 10;
        reasons.push({
          type: 'warning',
          message: 'Many hiring signal phrases may limit results'
        });
        tips.push('Consider using fewer signals for broader results');
      }

      if (input.operatorCount > 20 && hiringSignalsExplanation.enabled) {
        reasons.push({
          type: 'info',
          message: 'Hiring signals added to an already complex query'
        });
      }

      // Add warnings from the hiring signals explanation
      if (hiringSignalsExplanation.warnings?.length > 0) {
        for (const warning of hiringSignalsExplanation.warnings) {
          reasons.push({
            type: 'info',
            message: warning
          });
        }
      }
    }

    // Clamp score to 0-100
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      level: this.getLevel(score),
      reasons,
      tips: tips.length > 0 ? tips : undefined
    };
  }

  /**
   * Determine quality level from numeric score.
   */
  private getLevel(score: number): QualityLevel {
    if (score >= 70) return 'good';
    if (score >= 40) return 'ok';
    return 'risky';
  }
}
