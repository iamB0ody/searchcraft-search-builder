import { Injectable } from '@angular/core';
import { SearchFormModel, BooleanQueryResult } from '../models/search-form.model';

@Injectable({ providedIn: 'root' })
export class BooleanBuilderService {
  private readonly UNSUPPORTED_CHARS = ['*', '{', '}', '[', ']', '<', '>'];
  private readonly SALES_NAV_OPERATOR_LIMIT = 15;

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
        warnings.push(`"${value}" contains unsupported characters: ${unsupported.join(', ')}`);
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

    // Add mode-specific warnings
    if (form.mode === 'salesnav' && operatorCount > this.SALES_NAV_OPERATOR_LIMIT) {
      warnings.push(`Sales Navigator may limit queries with more than ${this.SALES_NAV_OPERATOR_LIMIT} operators. Current count: ${operatorCount}`);
    }

    if (form.mode === 'linkedin' && query.length > 500) {
      warnings.push('Long queries may be truncated in LinkedIn basic search');
    }

    return {
      query: this.normalizeQuery(query),
      warnings,
      operatorCount
    };
  }

  private buildTitlesClause(titles: string[]): string {
    if (titles.length === 0) return '';

    const formatted = titles.map(t => this.formatValue(t));
    if (formatted.length === 1) return formatted[0];

    return `(${formatted.join(' OR ')})`;
  }

  private buildSkillsClause(skills: string[]): string {
    if (skills.length === 0) return '';

    const formatted = skills.map(s => this.formatValue(s));
    if (formatted.length === 1) return formatted[0];

    return formatted.join(' AND ');
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
