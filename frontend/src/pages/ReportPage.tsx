import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../data/AppContext';
import { DIMENSION_LABELS } from '../data/mockData';
import type { Review } from '../data/types';
import ReactECharts from 'echarts-for-react';

const DIMENSION_KEYS = ['salary', 'intensity', 'culture', 'growth'] as const;
type DimKey = (typeof DIMENSION_KEYS)[number];

const DIMENSION_ICONS: Record<DimKey, string> = {
  salary: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  intensity: 'M3 3v18h18M7 16l4-8 4 4 4-6',
  culture: 'M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z',
  growth: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM22 11h-6M19 8v6',
};

const DIMENSION_DESCRIPTIONS: Record<DimKey, string> = {
  salary: '薪资水平 · 福利待遇 · 调薪机制',
  intensity: '加班情况 · 工作节奏 · 压力程度',
  culture: '管理风格 · 团队氛围 · 组织扁平度',
  growth: '晋升通道 · 技能提升 · 平台价值',
};

const SCORE_LEVELS = [
  { score: 5, label: '很好', desc: '普遍好评', color: '#16a34a' },
  { score: 4, label: '不错', desc: '正面为主', color: '#65a30d' },
  { score: 3, label: '一般', desc: '褒贬不一', color: '#d97706' },
  { score: 2, label: '偏差', desc: '负面为主', color: '#dc2626' },
  { score: 1, label: '很差', desc: '普遍差评', color: '#991b1b' },
];

function getScoreColor(score: number): string {
  if (score >= 4.5) return SCORE_LEVELS[0].color;
  if (score >= 3.5) return SCORE_LEVELS[1].color;
  if (score >= 2.5) return SCORE_LEVELS[2].color;
  if (score >= 1.5) return SCORE_LEVELS[3].color;
  return SCORE_LEVELS[4].color;
}

function getScoreLabel(score: number): string {
  if (score >= 4.5) return SCORE_LEVELS[0].label;
  if (score >= 3.5) return SCORE_LEVELS[1].label;
  if (score >= 2.5) return SCORE_LEVELS[2].label;
  if (score >= 1.5) return SCORE_LEVELS[3].label;
  return SCORE_LEVELS[4].label;
}

export default function ReportPage() {
  const { companyName } = useParams<{ companyName: string }>();
  const navigate = useNavigate();
  const { reportData } = useApp();
  const [activeDimension, setActiveDimension] = useState<DimKey>('salary');

  const report = reportData;
  if (!report) {
    return <div className="min-h-screen flex items-center justify-center"><p style={{ color: 'var(--text-tertiary)' }}>暂无报告数据，请先搜索公司</p></div>;
  }

  const scores = report.scores;
  const filteredReviews = report.reviews.filter((r: Review) => r.dimension === activeDimension);

  const radarOption = {
    radar: {
      indicator: DIMENSION_KEYS.map((k) => ({ name: DIMENSION_LABELS[k], max: 5 })),
      shape: 'polygon' as const,
      splitNumber: 5,
      axisName: {
        color: '#333333',
        fontSize: 13,
        fontWeight: 500 as const,
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.04)', 'rgba(0,0,0,0.06)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.1)'],
        },
      },
      splitLine: { lineStyle: { color: '#e0e0e0' } },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
    },
    series: [{
      type: 'radar' as const,
      data: [{
        value: DIMENSION_KEYS.map((k) => scores[k]),
        areaStyle: { color: 'rgba(75, 63, 227, 0.15)' },
        lineStyle: { color: '#4B3FE3', width: 2 },
        itemStyle: { color: '#4B3FE3' },
        label: {
          show: true,
          position: 'middle' as const,
          distance: 12,
          rich: {
            badge: {
              color: '#dc2626',
              fontSize: 13,
              fontWeight: 700 as const,
              backgroundColor: '#ffffff',
              padding: [3, 7],
              borderRadius: 6,
              borderColor: '#dc2626',
              borderWidth: 1,
            },
          },
          formatter: (params: { value: number[] | number }) => {
            const arr = Array.isArray(params.value) ? params.value : [params.value];
            const v = Math.round(arr[arr.length - 1] || 0);
            return `{badge|${v}}`;
          },
        },
      }],
    }],
  };

  const getTagClass = (p: string) => p === '正面' ? 'ds-tag--success' : p === '负面' ? 'ds-tag--danger' : 'ds-tag--info';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base-default)' }}>
      <header className="flex items-center justify-between px-8 py-3" style={{ borderBottom: '1px solid var(--border-neutral-l1)' }}>
        <span style={{ fontWeight: 600, fontSize: 18 }}>求职排雷器</span>
        <nav className="flex items-center gap-2" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          <span className="cursor-pointer" onClick={() => navigate('/')}>搜索</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          <span style={{ color: 'var(--text-default)', fontWeight: 500 }}>{companyName}</span>
        </nav>
        <button className="ds-btn ds-btn--secondary" onClick={() => navigate('/match')}>查看匹配度</button>
      </header>

      <section className="px-8 pt-6 pb-5" style={{ borderBottom: '1px solid var(--border-neutral-l1)' }}>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 style={{ fontFamily: 'var(--font-family-heading)', fontSize: 20, fontWeight: 600, margin: '0 0 8px 0' }}>{report.companyName}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              {report.industry && <span className="ds-tag">{report.industry}</span>}
              {report.employeeCount && <span className="ds-tag">{report.employeeCount}</span>}
              {report.location && <span className="ds-tag">{report.location}</span>}
            </div>
          </div>
          <div className="flex items-baseline gap-2 shrink-0">
            <span style={{ fontFamily: 'var(--font-family-metric)', fontSize: 40, fontWeight: 600, lineHeight: '48px', color: getScoreColor(scores.overall) }}>{scores.overall.toFixed(1)}</span>
            <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}> / 5.0</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: getScoreColor(scores.overall), marginLeft: 4 }}>{getScoreLabel(scores.overall)}</span>
          </div>
        </div>
      </section>

      <div className="flex-1 px-8 py-6 grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="flex flex-col gap-4">
          <div className="ds-card" style={{ padding: 16 }}>
            {DIMENSION_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-3 px-3 py-2 cursor-pointer" onClick={() => setActiveDimension(key)}
                style={{ background: activeDimension === key ? 'var(--bg-overlay-l1)' : 'transparent', borderRadius: 8, marginBottom: 4 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={activeDimension === key ? 'var(--bg-brand)' : 'var(--icon-secondary)'} strokeWidth="2" style={{ flexShrink: 0 }}><path d={DIMENSION_ICONS[key]} /></svg>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{DIMENSION_LABELS[key]}</span>
                    <span style={{ fontSize: 12, color: getScoreColor(scores[key]), fontWeight: 600 }}>{scores[key].toFixed(1)}分</span>
                    <span style={{ fontSize: 11, color: getScoreColor(scores[key]) }}>{getScoreLabel(scores[key])}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{DIMENSION_DESCRIPTIONS[key]}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="ds-card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px 0' }}>四维度雷达图</h3>
            <ReactECharts option={radarOption} style={{ height: 280 }} />
          </div>

          <div className="ds-card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px 0' }}>评分说明</h3>
            <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {SCORE_LEVELS.map((level) => (
                <div key={level.score} className="flex items-center gap-2">
                  <span style={{ width: 28, height: 28, borderRadius: 6, background: level.color, color: 'white', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{level.score}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{level.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{level.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <div className="ds-card" style={{ padding: 16 }}>
            <div className="flex items-baseline gap-3 mb-3">
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{DIMENSION_LABELS[activeDimension]}</h2>
              <span style={{ fontFamily: 'var(--font-family-metric)', fontSize: 22, fontWeight: 600, color: getScoreColor(scores[activeDimension]) }}>{scores[activeDimension].toFixed(1)}</span>
              <span style={{ fontSize: 12, color: getScoreColor(scores[activeDimension]) }}>{getScoreLabel(scores[activeDimension])}</span>
            </div>
            <div className="ds-progress ds-progress--brand mb-2"><div className="ds-progress__bar" style={{ width: `${(scores[activeDimension] / 5) * 100}%`, background: getScoreColor(scores[activeDimension]) }} /></div>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '0 0 16px 0' }}>{DIMENSION_DESCRIPTIONS[activeDimension]}</p>
            <h3 style={{ fontSize: 14, fontWeight: 500, margin: '0 0 12px 0' }}>典型评价</h3>
            <div className="flex flex-col gap-3">
              {filteredReviews.map((review, i) => (
                <div key={i} style={{ padding: 12, background: 'var(--bg-overlay-l1)', borderRadius: 8 }}>
                  <p style={{ fontSize: 14, lineHeight: '20px', color: 'var(--text-default)', margin: '0 0 10px 0' }}>{review.content}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="ds-tag">{review.source}</span>
                    {review.date && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{review.date}</span>}
                    <span className={`ds-tag ${getTagClass(review.polarity)}`}>{review.polarity}</span>
                  </div>
                </div>
              ))}
              {filteredReviews.length === 0 && <p style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>该维度暂无评价数据</p>}
            </div>
          </div>

          <div className="ds-card" style={{ padding: 20 }}>
            <div className="flex items-center gap-2 mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bg-brand)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>AI 总结</h2>
            </div>
            <p style={{ fontSize: 14, lineHeight: '20px', color: 'var(--text-secondary)', margin: 0 }}>{report.summary.overall}</p>
            <div style={{ borderTop: '1px solid var(--border-neutral-l1)', margin: '16px 0' }} />
            <h3 style={{ fontSize: 14, fontWeight: 500, margin: '0 0 8px 0' }}>综合建议</h3>
            <p style={{ fontSize: 14, lineHeight: '20px', color: 'var(--text-secondary)', margin: 0 }}>{report.summary.suggestions}</p>
          </div>
        </div>
      </div>

      <footer className="px-8 py-6 flex justify-center" style={{ borderTop: '1px solid var(--border-neutral-l1)' }}>
        <button onClick={() => navigate('/match')} className="ds-btn ds-btn--brand" style={{ height: 60, padding: '0 40px', fontSize: 22, fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <span style={{ lineHeight: 1.2, textAlign: 'center' }}>下一步</span>
          <span style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.2, textAlign: 'center' }}>查看匹配度分析</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </footer>
    </div>
  );
}
