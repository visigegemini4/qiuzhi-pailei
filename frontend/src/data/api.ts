import type { ReportData, ProgressData } from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function searchCompany(companyName: string, apiKey: string): Promise<{ searchId: string }> {
  const res = await fetch(`${BASE_URL}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyName, apiKey }),
  });
  if (!res.ok) throw new Error('搜索请求失败');
  return res.json();
}

export async function getProgress(searchId: string): Promise<ProgressData> {
  const res = await fetch(`${BASE_URL}/api/progress/${searchId}`);
  if (!res.ok) throw new Error('获取进度失败');
  return res.json();
}

export async function getReport(searchId: string): Promise<ReportData> {
  const res = await fetch(`${BASE_URL}/api/report/${searchId}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '获取报告失败');
  }
  return res.json();
}
