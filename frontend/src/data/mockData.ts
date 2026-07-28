import type { ReportData, ProgressData } from './types';

export const MOCK_REPORT: ReportData = {
  companyName: '字节跳动',
  industry: '互联网科技',
  employeeCount: '10万+员工',
  location: '北京',
  scores: { salary: 4.2, intensity: 2.8, culture: 3.6, growth: 3.9, overall: 3.6 },
  reviews: [
    { content: '薪资在行业内算有竞争力的，特别是股票期权部分。应届生 package 也比较厚道。', dimension: 'salary', polarity: '正面', source: '脉脉', date: '2025-03' },
    { content: '薪资还可以但晋升涨薪比较慢，需要主动争取。年终奖看部门效益差别很大。', dimension: 'salary', polarity: '中性', source: '知乎', date: '2025-01' },
    { content: '同级别薪资比竞品低 15-20%，福利缩水严重，以前免费三餐现在也要收费了。', dimension: 'salary', polarity: '负面', source: '看准网', date: '2024-11' },
    { content: '加班常态，996 不稀奇，大小周也很多部门在执行。强度取决于具体团队。', dimension: 'intensity', polarity: '负面', source: '脉脉', date: '2025-02' },
    { content: '工作节奏快，但不是所有部门都 996，有些团队相对平衡。看 leader。', dimension: 'intensity', polarity: '中性', source: '知乎', date: '2025-04' },
    { content: '扁平化管理，OKR 驱动，有一定自由度但政治也不少。', dimension: 'culture', polarity: '中性', source: '知乎', date: '2025-02' },
    { content: '管理风格因部门差异很大，有些 leader 非常支持下属成长。', dimension: 'culture', polarity: '正面', source: '脉脉', date: '2025-03' },
    { content: '成长空间大，能接触到海量用户规模的业务，技术栈也领先。', dimension: 'growth', polarity: '正面', source: '脉脉', date: '2025-01' },
    { content: '晋升通道相对清晰，但竞争激烈，需要比较强的自我驱动力。', dimension: 'growth', polarity: '中性', source: '看准网', date: '2024-12' },
  ],
  summary: {
    overall: '字节跳动薪酬福利在互联网行业处于中上水平，特别是股票期权部分对员工有较大吸引力。然而近年来存在福利缩水趋势，免费餐饮等 perks 逐步取消。工作强度较大，但技术成长空间可观。',
    suggestions: '薪酬维度表现良好，但需关注福利变化趋势。建议在面试中明确询问薪酬结构中期权占比和 vesting 条件。对加班敏感的求职者需特别关注目标团队的工作节奏。',
  },
};

export const MOCK_COMPANIES: ReportData[] = [
  MOCK_REPORT,
  { companyName: '腾讯', industry: '互联网科技', employeeCount: '10万+员工', location: '深圳', scores: { salary: 4.0, intensity: 3.2, culture: 3.8, growth: 4.1, overall: 3.8 }, reviews: [], summary: { overall: '', suggestions: '' } },
  { companyName: '美团', industry: '互联网科技', employeeCount: '8万+员工', location: '北京', scores: { salary: 3.5, intensity: 2.3, culture: 3.1, growth: 3.4, overall: 3.2 }, reviews: [], summary: { overall: '', suggestions: '' } },
];

export const PROGRESS_STAGES: ProgressData[] = [
  { stage: 1, percentage: 0, message: '正在搜索数据源...' },
  { stage: 2, percentage: 10, message: '正在搜索数据源...' },
  { stage: 3, percentage: 40, message: '正在爬取评价...' },
  { stage: 4, percentage: 60, message: 'AI 正在分析评价内容...' },
  { stage: 5, percentage: 100, message: '报告生成完成' },
];

export const DIMENSION_LABELS: Record<string, string> = {
  salary: '薪酬福利',
  intensity: '工作强度',
  culture: '管理文化',
  growth: '职业发展',
};
