import type { DimensionScores, UserPreferences, WeightSettings, MatchResult } from '../data/types';

function checkSalaryMatch(score: number, expectedSalary: string): 'match' | 'partial' | 'mismatch' {
  const ranges: Record<string, number> = { '10-20万': 3.0, '20-30万': 3.2, '30-50万': 3.5, '50-80万': 4.0, '80-100万': 4.3, '100万以上': 4.5 };
  const threshold = ranges[expectedSalary] ?? 3.0;
  if (score >= threshold) return 'match';
  if (score >= threshold - 0.5) return 'partial';
  return 'mismatch';
}

function checkIntensityMatch(score: number, tolerance: string): 'match' | 'partial' | 'mismatch' {
  const map: Record<string, number> = { '不接受': 4.0, '偶尔(月均<10h)': 3.5, '适度(月均10-20h)': 3.0, '经常(月均20h+)': 2.0, '高强度无所谓': 1.0 };
  const threshold = map[tolerance] ?? 3.0;
  if (score >= threshold) return 'match';
  if (score >= threshold - 0.5) return 'partial';
  return 'mismatch';
}

function checkGenericMatch(score: number): 'match' | 'partial' | 'mismatch' {
  if (score >= 3.8) return 'match';
  if (score >= 3.2) return 'partial';
  return 'mismatch';
}

export function calculateMatchScore(scores: DimensionScores, preferences: UserPreferences, weights: WeightSettings): MatchResult {
  const dimensions: MatchResult['dimensions'] = [
    { key: 'salary', label: '薪酬', match: checkSalaryMatch(scores.salary, preferences.expectedSalary), description: scores.salary >= 4.0 ? `口碑薪资优秀，满足${preferences.expectedSalary}期望` : scores.salary >= 3.5 ? `期望${preferences.expectedSalary}，口碑均值接近` : `口碑薪资低于${preferences.expectedSalary}期望水平` },
    { key: 'intensity', label: '加班', match: checkIntensityMatch(scores.intensity, preferences.overtimeTolerance), description: scores.intensity >= 3.5 ? '工作节奏可控，在你可接受范围内' : scores.intensity >= 3.0 ? '实际强度略高于可接受范围' : '加班强度明显高于你的承受范围' },
    { key: 'culture', label: '管理', match: checkGenericMatch(scores.culture), description: scores.culture >= 3.8 ? '管理风格评价整体正面' : scores.culture >= 3.2 ? '管理风格评价一般' : '管理风格存在较多负面评价' },
    { key: 'growth', label: '发展', match: checkGenericMatch(scores.growth), description: scores.growth >= 3.8 ? '晋升通道和成长空间评价良好' : scores.growth >= 3.2 ? '发展空间评价一般' : '职业发展空间有限' },
  ];
  const totalScore = dimensions.reduce((sum, d) => sum + (d.match === 'match' ? 1.0 : d.match === 'partial' ? 0.6 : 0.0) * (weights[d.key] / 100), 0);
  const score = Math.round(totalScore * 100);
  return { score, label: score >= 70 ? '匹配' : score >= 50 ? '部分匹配' : '不匹配', dimensions };
}

export function adjustWeights(current: WeightSettings, changedKey: keyof WeightSettings, newValue: number): WeightSettings {
  const delta = newValue - current[changedKey];
  const otherKeys = (Object.keys(current) as (keyof WeightSettings)[]).filter((k) => k !== changedKey);
  const otherSum = otherKeys.reduce((s, k) => s + current[k], 0);
  const newWeights = { ...current, [changedKey]: newValue };
  otherKeys.forEach((k) => { newWeights[k] = Math.max(0, Math.round(current[k] - (delta * current[k]) / otherSum)); });
  const total = Object.values(newWeights).reduce((s, v) => s + v, 0);
  if (total > 0) { (Object.keys(newWeights) as (keyof WeightSettings)[]).forEach((k) => { newWeights[k] = Math.round((newWeights[k] / total) * 100); }); }
  return newWeights;
}
