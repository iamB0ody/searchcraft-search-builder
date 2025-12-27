import { Injectable } from '@angular/core';
import { SearchFormModel, BooleanQueryResult, BadgeStatus, SearchMode } from '../models/search-form.model';

@Injectable({ providedIn: 'root' })
export class BooleanBuilderService {
  private readonly UNSUPPORTED_CHARS = ['*', '{', '}', '[', ']', '<', '>'];
  private readonly SALES_NAV_OPERATOR_LIMIT = 15;
  private readonly SALES_NAV_WARNING_THRESHOLD = 12;
  private readonly LINKEDIN_OPERATOR_WARNING = 10;
  private readonly LINKEDIN_LENGTH_WARNING = 250;

  buildQuery(form: SearchFormModel): BooleanQueryResult {
    const warnings: string[] = [];
    let operatorCount = 0;

    // Deduplicate and process each field
    const titles = this.deduplicateCaseInsensitive(form.titles);
    const skills = this.deduplicateCaseInsensitive(form.skills);
    const excludes = this.deduplicateCaseInsensitive(form.exclude);

    // Check for unsupported characters
    [...titles, ...skills, ...excludes].forEach(value => {
      const unsupported = this.detectUnsupportedChars(value);
      if (unsupported.length > 0) {
        warnings.push(`Unsupported characters detected in "${value}". LinkedIn may ignore them.`);
      }
    });

    // Build each clause
    const titlesClause = this.buildTitlesClause(titles);
    const skillsClause = this.buildSkillsClause(skills);
    const excludeClause = this.buildExcludeClause(excludes);

    // Count operators
    operatorCount += this.countOperators(titlesClause);
    operatorCount += this.countOperators(skillsClause);
    operatorCount += this.countOperators(excludeClause);

    // Combine clauses
    const parts: string[] = [];
    if (titlesClause) parts.push(titlesClause);
    if (skillsClause) parts.push(skillsClause);

    let query = parts.join(' AND ');
    if (excludeClause) {
      query = query ? `${query} ${excludeClause}` : excludeClause;
    }

    // Add AND count between main parts
    if (parts.length > 1) {
      operatorCount += parts.length - 1;
    }

    const normalizedQuery = this.normalizeQuery(query);

    // Add mode-specific warnings
    if (form.mode === 'salesnav' && operatorCount > this.SALES_NAV_OPERATOR_LIMIT) {
      warnings.push('Sales Navigator supports up to 15 Boolean operators. Please simplify your query.');
    }

    if (form.mode === 'linkedin' && (operatorCount >= this.LINKEDIN_OPERATOR_WARNING || normalizedQuery.length >= this.LINKEDIN_LENGTH_WARNING)) {
      warnings.push('LinkedIn search may limit very long Boolean queries. Consider simplifying.');
    }

    const badgeStatus = this.getBadgeStatus(form.mode, operatorCount, normalizedQuery.length);

    return {
      query: normalizedQuery,
      warnings,
      operatorCount,
      badgeStatus
    };
  }

  private getBadgeStatus(mode: SearchMode, operatorCount: number, queryLength: number): BadgeStatus {
    if (mode === 'salesnav') {
      if (operatorCount > this.SALES_NAV_OPERATOR_LIMIT) return 'danger';
      if (operatorCount >= this.SALES_NAV_WARNING_THRESHOLD) return 'warning';
    }
    if (mode === 'linkedin') {
      if (operatorCount >= this.LINKEDIN_OPERATOR_WARNING || queryLength >= this.LINKEDIN_LENGTH_WARNING) return 'warning';
    }
    // Recruiter mode: no operator limit warnings
    return 'safe';
  }

  private buildTitlesClause(titles: string[]): string {
    if (titles.length === 0) return '';

    const formatted = titles.map(t => this.formatValue(t));
    // Always wrap in parentheses for consistency
    return `(${formatted.join(' OR ')})`;
  }

  private buildSkillsClause(skills: string[]): string {
    if (skills.length === 0) return '';

    const formatted = skills.map(s => this.formatValue(s));
    // Always wrap in parentheses for consistency
    return `(${formatted.join(' AND ')})`;
  }

  private buildExcludeClause(excludes: string[]): string {
    if (excludes.length === 0) return '';

    return excludes.map(e => `NOT ${this.formatValue(e)}`).join(' ');
  }

  private formatValue(value: string): string {
    const trimmed = value.trim();
    // Quote if contains spaces or special characters that need quoting
    if (trimmed.includes(' ') || /[,()]/.test(trimmed)) {
      // Use straight double quotes only
      return `"${trimmed}"`;
    }
    return trimmed;
  }

  private deduplicateCaseInsensitive(items: string[]): string[] {
    const seen = new Map<string, string>();
    for (const item of items) {
      const trimmed = item.trim();
      if (trimmed) {
        const lower = trimmed.toLowerCase();
        // Keep the first occurrence (preserves original casing)
        if (!seen.has(lower)) {
          seen.set(lower, trimmed);
        }
      }
    }
    return Array.from(seen.values());
  }

  private detectUnsupportedChars(value: string): string[] {
    return this.UNSUPPORTED_CHARS.filter(char => value.includes(char));
  }

  private countOperators(clause: string): number {
    if (!clause) return 0;

    const andCount = (clause.match(/\bAND\b/g) || []).length;
    const orCount = (clause.match(/\bOR\b/g) || []).length;
    const notCount = (clause.match(/\bNOT\b/g) || []).length;

    return andCount + orCount + notCount;
  }

  private normalizeQuery(query: string): string {
    return query
      .trim()
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .replace(/^\s*AND\s+/, '') // Remove leading AND
      .replace(/\s+AND\s*$/, ''); // Remove trailing AND
  }
}
