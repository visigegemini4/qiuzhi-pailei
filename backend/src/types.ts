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

export interface SearchResult {
  title: string;
  snippet: string;
  link: string;
  source: string;
}

export interface CleanedReview {
  content: string;
  source: string;
  url: string;
}

export interface SearchState {
  stage: number;
  percentage: number;
  companyName: string;
  error?: string;
  report?: ReportData;
}

export interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}
