import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../data/AppContext';
import { calculateMatchScore, adjustWeights } from '../utils/matchCalculator';
import type { WeightSettings } from '../data/types';

const WEIGHT_KEYS: (keyof WeightSettings)[] = ['salary', 'intensity', 'culture', 'growth'];
const WEIGHT_LABELS: Record<keyof WeightSettings, string> = { salary: '薪酬', intensity: '加班', culture: '管理', growth: '发展' };

export default function MatchPage() {
  const navigate = useNavigate();
  const { searchedCompanies, userPreferences, setUserPreferences, weightSettings, setWeightSettings, reportData } = useApp();
  const [analyzed, setAnalyzed] = useState(false);
  const primaryReport = reportData || searchedCompanies[0];

  const matchResult = useMemo(() => {
    if (!primaryReport) return null;
    return calculateMatchScore(primaryReport.scores, userPreferences, weightSettings);
  }, [primaryReport, userPreferences, weightSettings]);

  const companyComparisons = useMemo(() => {
    return searchedCompanies.map((c) => {
      const result = calculateMatchScore(c.scores, userPreferences, weightSettings);
      return { companyName: c.companyName, overallScore: c.scores.overall, matchScore: result.score, scores: c.scores };
    });
  }, [searchedCompanies, userPreferences, weightSettings]);

  const handleWeightChange = (key: keyof WeightSettings, newValue: number) => setWeightSettings(adjustWeights(weightSettings, key, newValue));
  const getMatchTagClass = (m: 'match' | 'partial' | 'mismatch') => m === 'match' ? 'ds-tag--success' : m === 'partial' ? 'ds-tag--warning' : 'ds-tag--danger';
  const getMatchLabel = (m: 'match' | 'partial' | 'mismatch') => m === 'match' ? '匹配' : m === 'partial' ? '部分匹配' : '不匹配';
  const getScoreColor = (s: number) => s >= 70 ? 'var(--status-success-default)' : s >= 50 ? 'var(--status-alert-default)' : 'var(--status-error-default)';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base-default)' }}>
      <header className="flex items-center justify-between px-8 py-3" style={{ borderBottom: '1px solid var(--border-neutral-l1)' }}>
        <span style={{ fontWeight: 600, fontSize: 18 }}>求职排雷器</span>
        <nav className="flex items-center gap-2" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          <span className="cursor-pointer" onClick={() => navigate('/')}>搜索</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          <span className="cursor-pointer" onClick={() => navigate(`/report/${encodeURIComponent(primaryReport?.companyName || '')}`)}>{primaryReport?.companyName}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          <span style={{ color: 'var(--text-default)', fontWeight: 500 }}>匹配度分析</span>
        </nav>
        <button className="ds-btn ds-btn--secondary" onClick={() => navigate(-1)}>返回报告</button>
      </header>

      <div className="px-8 py-6 mx-auto" style={{ maxWidth: 1200, width: '100%' }}>
        <section className="ds-card">
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px 0' }}>个人偏好</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>设置你的求职偏好和各维度权重，系统将基于已有口碑数据计算匹配度</p>
          <div className="grid gap-6 items-end mt-5" style={{ gridTemplateColumns: '1fr 1fr auto' }}>
            <div>
              <label className="block mb-2" style={{ fontSize: 14, fontWeight: 500 }}>期望年薪</label>
              <select className="ds-select" value={userPreferences.expectedSalary} onChange={(e) => setUserPreferences({ ...userPreferences, expectedSalary: e.target.value })}>
                <option>10-20万</option><option>20-30万</option><option>30-50万</option><option>50-80万</option><option>80-100万</option><option>100万以上</option>
              </select>
            </div>
            <div>
              <label className="block mb-2" style={{ fontSize: 14, fontWeight: 500 }}>可接受加班</label>
              <select className="ds-select" value={userPreferences.overtimeTolerance} onChange={(e) => setUserPreferences({ ...userPreferences, overtimeTolerance: e.target.value })}>
                <option>不接受</option><option>偶尔(月均<10h)</option><option>适度(月均10-20h)</option><option>经常(月均20h+)</option><option>高强度无所谓</option>
              </select>
            </div>
            <button className="ds-btn ds-btn--brand ds-btn--lg" onClick={() => setAnalyzed(true)}>分析匹配度</button>
          </div>

          <div style={{ borderTop: '1px solid var(--border-neutral-l1)', marginTop: 20, paddingTop: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 500, margin: '0 0 12px 0' }}>维度权重</h3>
            <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {WEIGHT_KEYS.map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <span style={{ fontSize: 14, fontWeight: 500, width: 40 }}>{WEIGHT_LABELS[key]}</span>
                  <input type="range" min={0} max={60} value={weightSettings[key]} onChange={(e) => handleWeightChange(key, Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--bg-brand)' }} />
                  <span style={{ fontFamily: 'var(--font-family-metric)', fontSize: 13, fontWeight: 600, color: 'var(--bg-brand)', width: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{weightSettings[key]}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {analyzed && matchResult && (
          <section className="grid gap-6 mt-8" style={{ gridTemplateColumns: '300px 1fr' }}>
            <div className="ds-card flex flex-col">
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>综合匹配度</p>
              <div className="flex items-baseline gap-1 mb-3">
                <span style={{ fontFamily: 'var(--font-family-metric)', fontSize: 40, fontWeight: 600, lineHeight: '48px', color: getScoreColor(matchResult.score) }}>{matchResult.score}</span>
                <span style={{ fontSize: 18, color: 'var(--text-tertiary)' }}>/ 100</span>
              </div>
              <div className="mb-5"><span className={`ds-tag ${matchResult.score >= 70 ? 'ds-tag--success' : matchResult.score >= 50 ? 'ds-tag--warning' : 'ds-tag--danger'}`}>{matchResult.label}</span></div>
              <div style={{ borderTop: '1px solid var(--border-neutral-l1)', margin: '0 0 16px 0' }} />
              <div className="flex flex-col gap-4">
                {matchResult.dimensions.map((dim) => (
                  <div key={dim.key}>
                    <div className="flex items-center justify-between gap-3">
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{dim.label}</span>
                      <span className={`ds-tag ${getMatchTagClass(dim.match)} shrink-0`}>{getMatchLabel(dim.match)}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>{dim.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="ds-card">
              <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 16px 0' }}>多公司对比</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="ds-table">
                  <thead><tr><th>公司名</th><th className="num">综合评分</th><th className="num">匹配度</th><th className="num">薪酬</th><th className="num">加班</th><th className="num">管理</th><th className="num">发展</th></tr></thead>
                  <tbody>
                    {companyComparisons.map((c) => (
                      <tr key={c.companyName}>
                        <td>{c.companyName}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-family-metric)' }}>{c.overallScore.toFixed(1)}</td>
                        <td className="num"><span className="inline-flex items-center gap-1"><span style={{ width: 6, height: 6, borderRadius: '50%', background: getScoreColor(c.matchScore) }} /><span style={{ fontFamily: 'var(--font-family-metric)', color: getScoreColor(c.matchScore) }}>{c.matchScore}</span><span style={{ color: 'var(--text-tertiary)' }}>分</span></span></td>
                        <td className="num" style={{ fontFamily: 'var(--font-family-metric)' }}>{c.scores.salary.toFixed(1)}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-family-metric)' }}>{c.scores.intensity.toFixed(1)}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-family-metric)' }}>{c.scores.culture.toFixed(1)}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-family-metric)' }}>{c.scores.growth.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        <p className="text-center mt-6" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>偏好数据保存在浏览器本地，关闭页面后需重新查询公司</p>
      </div>
    </div>
  );
}
