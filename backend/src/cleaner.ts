import type { SearchResult, CleanedReview } from './types';

function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
}

function isSimilar(a: string, b: string): boolean {
  if (a.length < 20 || b.length < 20) return a === b;
  const aWords = new Set(a.slice(0, 50).split(''));
  const bWords = new Set(b.slice(0, 50).split(''));
  const intersection = [...aWords].filter(x => bWords.has(x));
  return intersection.length / Math.min(aWords.size, bWords.size) > 0.85;
}

function isPureEmoji(text: string): boolean {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]/gu;
  const emojis = text.match(emojiRegex);
  if (!emojis) return false;
  const textWithoutEmoji = text.replace(emojiRegex, '').trim();
  return textWithoutEmoji.length < 3;
}

function isRepeated(text: string): boolean {
  const seen = new Set<string>();
  for (let i = 0; i < text.length - 5; i++) {
    const chunk = text.slice(i, i + 6);
    if (seen.has(chunk)) return true;
    seen.add(chunk);
  }
  return false;
}

function isAdvertisement(text: string): boolean {
  const adKeywords = [
    '招聘', '诚聘', '急聘', '高薪', '包吃包住', '五险一金', '简历',
    '投递', '面试', '内推', '猎头', '联系我', '咨询', '免费',
    '点击查看', '立即申请', '报名', '课程', '培训',
  ];
  const lower = text.toLowerCase();
  return adKeywords.some(kw => lower.includes(kw));
}

export function cleanReviews(results: SearchResult[]): CleanedReview[] {
  const unique: SearchResult[] = [];
  for (const r of results) {
    const normalized = normalizeText(r.snippet);
    if (normalized.length < 15) continue;
    if (isPureEmoji(normalized)) continue;
    if (isRepeated(normalized)) continue;
    if (isAdvertisement(normalized)) continue;

    const isDup = unique.some(u => isSimilar(normalizeText(u.snippet), normalized));
    if (!isDup) {
      unique.push({ ...r, snippet: normalized });
    }
  }

  return unique.slice(0, 30).map(r => ({
    content: r.snippet,
    source: r.source,
    url: r.link,
  }));
}
