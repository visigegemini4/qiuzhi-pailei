export interface DimensionScores {
  salary: number;
  intensity: number;
  culture: number;
  growth: number;
  overall: number;
}

export interface Review {
  content: string;
  dimension: 'salary' | 'intensity' | 'culture' | 'growth';
  polarity: '正面' | '中性' | '负面';
  source: string;
  date?: string;
}

export interface AnalysisSummary {
  overall: string;
  suggestions: string;
}

export interface ReportData {
  companyName: string;
  industry?: string;
  employeeCount?: string;
  location?: string;
  scores: DimensionScores;
  reviews: Review[];
  summary: AnalysisSummary;
}

export interface ProgressData {
  stage: number;
  percentage: number;
  message: string;
  error?: string;
}

export interface UserPreferences {
  expectedSalary: string;
  overtimeTolerance: string;
}

export interface WeightSettings {
  salary: number;
  intensity: number;
  culture: number;
  growth: number;
}

export interface MatchResult {
  score: number;
  label: string;
  dimensions: {
    key: keyof DimensionScores;
    label: string;
    match: 'match' | 'partial' | 'mismatch';
    description: string;
  }[];
}
