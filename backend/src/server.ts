import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import type { SearchState } from './types';
import { searchCompany } from './search';
import { cleanReviews } from './cleaner';
import { analyzeReviews } from './analyzer';
import { RateLimiter } from './antiScrape';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const searchStates = new Map<string, SearchState>();
const limiter = new RateLimiter(3);

const STAGE_MESSAGES: Record<number, string> = {
  1: '正在初始化搜索任务...',
  2: '正在全网搜集公司口碑信息...',
  3: '正在清洗和整理数据...',
  4: 'AI 正在分析评价内容...',
  5: '分析完成',
};

function updateState(searchId: string, update: Partial<SearchState>) {
  const state = searchStates.get(searchId);
  if (state) {
    Object.assign(state, update);
  }
}

app.post('/api/search', async (req, res) => {
  const { companyName, apiKey } = req.body;
  if (!companyName || typeof companyName !== 'string') {
    return res.status(400).json({ error: 'companyName is required' });
  }
  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(400).json({ error: 'apiKey is required' });
  }

  const searchId = randomUUID();
  searchStates.set(searchId, {
    stage: 1,
    percentage: 5,
    companyName,
  });

  (async () => {
    try {
      await limiter.acquire();

      updateState(searchId, { stage: 2, percentage: 15 });
      const rawResults = await searchCompany(companyName);
      console.log(`[search] ${companyName}: got ${rawResults.length} raw results`);

      updateState(searchId, { stage: 3, percentage: 40 });
      const reviews = cleanReviews(rawResults);
      console.log(`[clean] ${companyName}: ${reviews.length} reviews after cleaning`);

      if (reviews.length === 0) {
        updateState(searchId, {
          stage: 5,
          percentage: 100,
          error: '未找到足够的评价信息，请尝试搜索其他公司',
        });
        return;
      }

      updateState(searchId, { stage: 4, percentage: 60 });
      const report = await analyzeReviews(companyName, reviews, apiKey);
      console.log(`[analyze] ${companyName}: analysis complete`);

      updateState(searchId, {
        stage: 5,
        percentage: 100,
        report,
      });
    } catch (err) {
      console.error(`[search] ${companyName} error:`, (err as Error).message);
      updateState(searchId, {
        stage: 5,
        percentage: 100,
        error: (err as Error).message || '搜索失败，请稍后重试',
      });
    } finally {
      limiter.release();
    }
  })();

  res.json({ searchId });
});

app.get('/api/progress/:id', (req, res) => {
  const state = searchStates.get(req.params.id);
  if (!state) {
    return res.status(404).json({ error: '搜索任务不存在' });
  }

  res.json({
    stage: state.stage,
    percentage: state.percentage,
    message: STAGE_MESSAGES[state.stage] || '处理中...',
    error: state.error,
  });
});

app.get('/api/report/:id', (req, res) => {
  const state = searchStates.get(req.params.id);
  if (!state) {
    return res.status(404).json({ error: '搜索任务不存在' });
  }

  if (state.stage !== 5) {
    return res.status(400).json({ error: '报告尚未生成' });
  }

  if (state.error) {
    return res.status(500).json({ error: state.error });
  }

  res.json(state.report);

  setTimeout(() => {
    searchStates.delete(req.params.id);
  }, 300000);
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[server] running on port ${PORT}`);
  console.log(`[env] DEEPSEEK_API_KEY: ${process.env.DEEPSEEK_API_KEY ? '已配置' : '未配置'}`);
});
