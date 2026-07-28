import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../data/AppContext';
import { searchCompany, getProgress, getReport } from '../data/api';
import type { ProgressData, ReportData } from '../data/types';

const POLL_INTERVAL = 2000;

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const { setReportData, setCurrentCompany, addSearchedCompany, apiKey, setApiKey } = useApp();

  const handleSearch = useCallback(async () => {
    const companyName = query.trim();
    if (!companyName) return;
    const effectiveKey = keyInput.trim() || apiKey;
    if (!effectiveKey) {
      return;
    }
    if (keyInput.trim()) {
      setApiKey(keyInput.trim());
    }
    setSearching(true);
    setProgress({ stage: 1, percentage: 5, message: '正在初始化搜索任务...' });

    try {
      const { searchId } = await searchCompany(companyName, effectiveKey);

      const report = await new Promise<ReportData>((resolve, reject) => {
        intervalRef.current = setInterval(async () => {
          try {
            const p = await getProgress(searchId);
            setProgress(p);

            if (p.stage === 5) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              if (p.error) {
                reject(new Error(p.error));
              } else {
                const r = await getReport(searchId);
                resolve(r);
              }
            }
          } catch (err) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            reject(err);
          }
        }, POLL_INTERVAL);
      });

      report.companyName = companyName;
      setReportData(report);
      setCurrentCompany(companyName);
      addSearchedCompany(report);
      setSearching(false);
      setTimeout(() => navigate(`/report/${encodeURIComponent(companyName)}`), 500);
    } catch (err) {
      setProgress({
        stage: 5,
        percentage: 100,
        message: '搜索失败',
        error: err instanceof Error ? err.message : '搜索失败',
      });
      setSearching(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [query, navigate, setReportData, setCurrentCompany, addSearchedCompany, apiKey, keyInput, setApiKey]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center px-8 py-4" style={{ borderBottom: '1px solid var(--border-neutral-l1)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center" style={{ width: 20, height: 20, background: 'var(--bg-brand)', borderRadius: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
          </div>
          <span style={{ fontFamily: 'var(--font-family-heading)', fontSize: 16, fontWeight: 600 }}>求职排雷器</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-8" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <div className="w-full flex flex-col items-center" style={{ maxWidth: 680 }}>
          <h1 style={{ fontFamily: 'var(--font-family-heading)', fontSize: 22, fontWeight: 600, lineHeight: 30, textAlign: 'center', marginBottom: 16 }}>查一查，这家公司值不值得去</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 48 }}>输入公司名称，AI 实时聚合多源口碑，生成结构化分析报告</p>

          <div className="w-full flex items-center gap-3">
            <div className="ds-input flex-1" style={{ minHeight: 40, padding: '0 12px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--icon-secondary)" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              <input type="text" placeholder="请输入公司全称，如「字节跳动」" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} style={{ height: 40, fontSize: 14 }} disabled={searching} />
            </div>
            <button className="ds-btn ds-btn--brand" style={{ height: 40, padding: '0 20px', fontSize: 14, fontWeight: 500 }} onClick={handleSearch} disabled={searching || !query.trim() || (!keyInput.trim() && !apiKey)}>
              {searching ? '搜索中...' : '搜索'}
            </button>
          </div>

          <div className="w-full ds-card" style={{ marginTop: 24, padding: 20 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>API Key 设置</span>
              {apiKey && (
                <button onClick={() => { setApiKey(''); setKeyInput(''); }} style={{ fontSize: 12, color: 'var(--status-error-default)', border: 'none', background: 'none', cursor: 'pointer' }}>清除已保存的 Key</button>
              )}
            </div>
            <div className="ds-input flex-1" style={{ minHeight: 36, padding: '0 12px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--icon-secondary)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              <input type="text" placeholder={apiKey ? `已配置（${apiKey.slice(0, 6)}...${apiKey.slice(-4)}），可输入新 Key 覆盖` : '请输入 DeepSeek API Key'} value={keyInput} onChange={(e) => setKeyInput(e.target.value)} style={{ height: 36, fontSize: 13 }} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
              {apiKey
                ? <>已保存 Key 仅在当前设备生效。若与他人共用此设备，请先<a onClick={() => { setApiKey(''); setKeyInput(''); }} style={{ color: 'var(--text-brand)', cursor: 'pointer' }}>清除</a>。&nbsp;</>
                : <>首次使用需配置，Key 仅保存在浏览器本地。&nbsp;</>
              }
              获取地址：<a href="https://platform.deepseek.com" target="_blank" rel="noopener" style={{ color: 'var(--text-brand)' }}>deepseek.com</a>
            </p>
          </div>

          {progress && (
            <div className="w-full ds-card" style={{ marginTop: 48, padding: 24 }}>
              {progress.error ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--status-error-default)" strokeWidth="2" style={{ margin: '0 auto 12px' }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-default)', marginBottom: 8 }}>分析失败</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 20px', wordBreak: 'break-word' }}>{progress.error}</p>
                  <button className="ds-btn ds-btn--brand" style={{ height: 36, padding: '0 20px', fontSize: 13 }} onClick={() => { setProgress(null); setQuery(''); }}>重新搜索</button>
                </div>
              ) : (
                <>
                  <ProgressStage label="正在搜索数据源..." status={progress.stage >= 2 ? 'done' : 'active'} />
                  <Divider />
                  <ProgressStage label="正在爬取评价..." status={progress.stage >= 4 ? 'done' : progress.stage >= 2 ? 'active' : 'waiting'} />
                  {progress.stage >= 2 && progress.stage < 4 && (
                    <div className="flex items-center gap-6" style={{ paddingLeft: 32, marginTop: 8, marginBottom: 8 }}>
                      <SourceIndicator label="多源聚合" status={progress.stage >= 3 ? 'done' : 'active'} />
                      <SourceIndicator label="数据处理" status={progress.stage >= 3 ? 'active' : 'waiting'} />
                    </div>
                  )}
                  <Divider />
                  <ProgressStage label="AI 正在分析评价内容..." status={progress.stage >= 4 ? 'done' : 'waiting'} />
                  <Divider />
                  <ProgressStage label="报告生成完成" status={progress.stage >= 5 ? 'done' : 'waiting'} />
                  <div className="flex items-center gap-4" style={{ marginTop: 24 }}>
                    <div className="ds-progress ds-progress--brand flex-1"><div className="ds-progress__bar" style={{ width: `${progress.percentage}%` }} /></div>
                    <span style={{ fontFamily: 'var(--font-family-metric)', fontSize: 14, fontWeight: 600, color: 'var(--bg-brand)', fontVariantNumeric: 'tabular-nums' }}>{progress.percentage}%</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="flex justify-center px-8 pb-6">
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>数据来源于公开平台，仅供参考。不存储任何数据。</p>
      </footer>
    </div>
  );
}

function ProgressStage({ label, status }: { label: string; status: 'done' | 'active' | 'waiting' }) {
  return (
    <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
      {status === 'done' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--status-success-default)" strokeWidth="2.5" style={{ flexShrink: 0 }}><path d="M20 6 9 17l-5-5" /></svg>}
      {status === 'active' && <span className="ds-skeleton" style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0 }} />}
      {status === 'waiting' && <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--bg-overlay-l2)', flexShrink: 0 }} />}
      <span style={{ fontSize: 14, color: status === 'waiting' ? 'var(--text-tertiary)' : 'var(--text-default)' }}>{label}</span>
      {status === 'done' && <span className="ds-tag ds-tag--success" style={{ marginLeft: 'auto' }}>已完成</span>}
      {status === 'active' && <span className="ds-tag ds-tag--brand" style={{ marginLeft: 'auto' }}>进行中</span>}
    </div>
  );
}

function SourceIndicator({ label, status }: { label: string; status: 'done' | 'active' | 'waiting' }) {
  return (
    <div className="flex items-center gap-2">
      {status === 'done' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--status-success-default)" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>}
      {status === 'active' && <span className="ds-skeleton" style={{ width: 12, height: 12, borderRadius: '50%' }} />}
      {status === 'waiting' && <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--bg-overlay-l2)' }} />}
      <span style={{ fontSize: 11, color: status === 'active' ? 'var(--text-brand)' : status === 'done' ? 'var(--status-success-default)' : 'var(--text-tertiary)' }}>{label}</span>
    </div>
  );
}

function Divider() { return <div style={{ height: 1, background: 'var(--border-neutral-l1)', marginBottom: 16 }} />; }
