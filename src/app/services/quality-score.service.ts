import { Injectable } from '@angular/core';
import {
  QualityLevel,
  QualityReason,
  QualityScoreInput,
  QualityScoreResult
} from '../models/quality-score.model';

/**
 * Service for calculating quality scores for search queries.
 * Provides a deterministic, rules-based scoring system with actionable feedback.
 */
@Injectable({ providedIn: 'root' })
export class QualityScoreService {

  /**
   * Calculate a quality score (0-100) for a search query input.
   * Returns score, level, reasons, and optional tips.
   * @param input - The search query input to score
   * @param platformId - Optional platform ID for platform-specific scoring
   */
  calculateScore(input: QualityScoreInput, platformId?: string): QualityScoreResult {
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

    // Rule 2: Operator count penalties
    if (input.operatorCount > 20) {
      score -= 15;
      reasons.push({ type: 'warning', message: 'Query has many operators, may be complex' });
    } else if (input.operatorCount > 15) {
      score -= 10;
      reasons.push({ type: 'info', message: 'Consider simplifying the query' });
    }

    // Rule 3: Too many ANDs (restrictive)
    const andCount = (input.booleanQuery.match(/\bAND\b/g) || []).length;
    if (andCount > 8) {
      score -= 10;
      reasons.push({ type: 'warning', message: 'Many AND terms may be too restrictive' });
      tips.push('Try using OR between similar skills');
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
      const andCount = (input.booleanQuery.match(/\bAND\b/g) || []).length;
      if (andCount > 3) {
        score -= 10;
        reasons.push({ type: 'info', message: 'Consider using OR instead of AND for broader results' });
      }
    }

    // Rule 7: Balanced search bonus (titles + skills)
    if (input.titles.length >= 1 && input.skills.length >= 1) {
      score += 5;
    }

    // Rule 8: Suggestion for no exclusions
    if (input.exclude.length === 0 && (input.titles.length + input.skills.length) > 2) {
      tips.push('Consider adding exclusions to refine results');
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
