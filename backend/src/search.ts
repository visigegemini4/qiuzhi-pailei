import axios from 'axios';
import type { SearchResult } from './types';
import { getRandomUA, randomBetween, delay, withRetry } from './antiScrape';

function extractSource(link: string): string {
  try {
    const host = new URL(link).hostname;
    if (host.includes('zhihu.com')) return '知乎';
    if (host.includes('maimai.cn')) return '脉脉';
    if (host.includes('kanzhun.com')) return '看准网';
    if (host.includes('jobui.com')) return '职友集';
    if (host.includes('lagou.com')) return '拉勾';
    if (host.includes('boss')) return 'Boss直聘';
    if (host.includes('51job')) return '前程无忧';
    if (host.includes('zhipin')) return 'Boss直聘';
    if (host.includes('douban')) return '豆瓣';
    if (host.includes('xiaohongshu')) return '小红书';
    if (host.includes('weibo')) return '微博';
    if (host.includes('bilibili')) return 'B站';
    if (host.includes('csdn')) return 'CSDN';
    if (host.includes('jianshu')) return '简书';
    if (host.includes('wenku.baidu')) return '百度文库';
    if (host.includes('zhihu')) return '知乎';
    return host.replace(/^www\./, '').split('.')[0] || '网络';
  } catch {
    return '网络';
  }
}

async function searchBaidu(query: string): Promise<SearchResult[]> {
  await delay(randomBetween(1000, 2500));

  return withRetry(async () => {
    const response = await axios.get('https://www.baidu.com/s', {
      params: {
        wd: query,
        rn: 20,
      },
      headers: {
        'User-Agent': getRandomUA(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'max-age=0',
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    const html: string = response.data;
    const results: SearchResult[] = [];

    const sDataRegex = /<!--s-data:(\{[\s\S]*?\})-->/g;
    let match;
    while ((match = sDataRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        if (data.mainItem) {
          const { title, summary, urlParams } = data.mainItem;
          const link = urlParams?.tcUrl || '';
          if (title && summary && link && summary.length >= 10) {
            results.push({
              title: title.replace(/<[^>]+>/g, '').trim(),
              snippet: summary.replace(/<[^>]+>/g, '').trim(),
              link,
              source: extractSource(link),
            });
          }
        }
        if (data.docList && Array.isArray(data.docList)) {
          for (const doc of data.docList) {
            if (doc.title && doc.summary && doc.urlParams?.tcUrl) {
              const link = doc.urlParams.tcUrl;
              if (doc.summary.length >= 10) {
                results.push({
                  title: doc.title.replace(/<[^>]+>/g, '').trim(),
                  snippet: doc.summary.replace(/<[^>]+>/g, '').trim(),
                  link,
                  source: extractSource(link),
                });
              }
            }
          }
        }
      } catch {
        continue;
      }
    }

    const aTagRegex = /<a[^>]*class="cosc-title-a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    while ((match = aTagRegex.exec(html)) !== null) {
      const link = match[1];
      const title = match[2].replace(/<[^>]+>/g, '').trim();
      if (title && link && !results.some(r => r.title === title)) {
        results.push({
          title,
          snippet: title,
          link,
          source: extractSource(link),
        });
      }
    }

    const contentLeftMatch = html.match(/<div[^>]*id="content_left"[^>]*>([\s\S]*?)<\/div>/);
    if (contentLeftMatch) {
      const contentLeft = contentLeftMatch[1];
      const abstractRegex = /<p[^>]*class="([^"]*c-abstract[^"]*)"[^>]*>([\s\S]*?)<\/p>/g;
      while ((match = abstractRegex.exec(contentLeft)) !== null) {
        const snippet = match[2].replace(/<[^>]+>/g, '').trim();
        if (snippet.length >= 10) {
          results.push({
            title: snippet.slice(0, 50),
            snippet,
            link: '',
            source: '百度搜索',
          });
        }
      }
    }

    console.log(`[search] query="${query}", results=${results.length}`);
    return results.slice(0, 30);
  }, 2);
}

export async function searchCompany(companyName: string): Promise<SearchResult[]> {
  const queries = [
    `${companyName} 工作体验 评价`,
    `${companyName} 加班 996 工作强度`,
    `${companyName} 薪资 待遇 福利`,
    `${companyName} 公司口碑 怎么样`,
    `${companyName} 知乎 评价`,
  ];

  const allResults: SearchResult[] = [];
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    try {
      const results = await searchBaidu(query);
      allResults.push(...results);
      if (i < queries.length - 1) {
        await delay(randomBetween(1500, 3000));
      }
    } catch (err) {
      console.error(`[search] failed for query "${query}":`, (err as Error).message);
    }
  }

  return allResults;
}
