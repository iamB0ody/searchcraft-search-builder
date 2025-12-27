export type QualityLevel = 'good' | 'ok' | 'risky';
export type ReasonType = 'info' | 'warning';

export interface QualityReason {
  type: ReasonType;
  message: string;
}

export interface QualityScoreResult {
  score: number;           // 0-100
  level: QualityLevel;     // Derived from score thresholds
  reasons: QualityReason[];
  tips?: string[];
}

export interface QualityScoreInput {
  titles: string[];
  skills: string[];
  exclude: string[];
  booleanQuery: string;
  operatorCount: number;
  warnings: string[];      // From BooleanBuilderService
}
