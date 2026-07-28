import axios from 'axios';
import type { CleanedReview, ReportData, DimensionScores, Review, AnalysisSummary } from './types';
import { withRetry } from './antiScrape';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

const ANALYSIS_PROMPT = `你是一位职场口碑分析专家。请分析以下关于"{companyName}"的搜索结果摘要，完成以下任务：

1. 将每条摘要归类到以下维度（允许一条属于多个维度）：
   - salary: 薪酬福利
   - intensity: 工作强度
   - culture: 管理文化
   - growth: 职业发展

2. 对每个维度的内容打分（1-5 分，1分最差，5分最好）

3. 提取 5-8 条典型评价原文（正面、中性、负面各至少 1 条）

4. 生成一段综合分析（3-5 句话）和一段建议（2-3 句话）

搜索结果（JSON 格式）：
{reviews}

请严格按以下 JSON 格式输出，不要包含任何其他文字：
{
  "scores": {
    "salary": 分数,
    "intensity": 分数,
    "culture": 分数,
    "growth": 分数,
    "overall": 综合分数
  },
  "reviews": [
    {
      "content": "评价原文",
      "dimension": "salary|intensity|culture|growth",
      "polarity": "正面|中性|负面",
      "source": "来源"
    }
  ],
  "summary": {
    "overall": "综合分析",
    "suggestions": "建议"
  }
}`;

function validateScores(scores: any): DimensionScores {
  const clamp = (n: number) => Math.max(1, Math.min(5, Math.round(n)));
  return {
    salary: clamp(scores?.salary ?? 3),
    intensity: clamp(scores?.intensity ?? 3),
    culture: clamp(scores?.culture ?? 3),
    growth: clamp(scores?.growth ?? 3),
    overall: clamp(scores?.overall ?? 3),
  };
}

function validateReviews(reviews: any[]): Review[] {
  if (!Array.isArray(reviews)) return [];
  const validDimensions = ['salary', 'intensity', 'culture', 'growth'] as const;
  const validPolarities = ['正面', '中性', '负面'] as const;

  return reviews
    .filter(r => r && typeof r.content === 'string' && r.content.length >= 5)
    .slice(0, 10)
    .map(r => ({
      content: r.content.slice(0, 300),
      dimension: validDimensions.includes(r.dimension) ? r.dimension : 'culture',
      polarity: validPolarities.includes(r.polarity) ? r.polarity : '中性',
      source: typeof r.source === 'string' ? r.source.slice(0, 50) : '网络',
    }));
}

function validateSummary(summary: any): AnalysisSummary {
  return {
    overall: typeof summary?.overall === 'string' ? summary.overall.slice(0, 500) : '暂无详细分析',
    suggestions: typeof summary?.suggestions === 'string' ? summary.suggestions.slice(0, 500) : '建议多了解公司实际情况',
  };
}

export async function analyzeReviews(
  companyName: string,
  reviews: CleanedReview[],
  apiKey: string
): Promise<ReportData> {
  if (!apiKey) {
    throw new Error('apiKey is required');
  }

  const prompt = ANALYSIS_PROMPT
    .replace('{companyName}', companyName)
    .replace('{reviews}', JSON.stringify(reviews, null, 2));

  const response = await withRetry(async () => {
    const res = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一个专业的职场口碑分析助手，擅长从网络信息中提取和评估公司口碑。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 3000,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );
    return res.data;
  }, 2);

  const content = response.choices?.[0]?.message?.content || '';

  let parsed: any;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      parsed = JSON.parse(content);
    }
  } catch (err) {
    console.error('[analyzer] failed to parse JSON:', content.slice(0, 500));
    throw new Error('AI 返回格式错误，请重试');
  }

  return {
    companyName,
    scores: validateScores(parsed.scores),
    reviews: validateReviews(parsed.reviews),
    summary: validateSummary(parsed.summary),
  };
}
