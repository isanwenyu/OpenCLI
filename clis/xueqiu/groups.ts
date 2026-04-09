import { cli } from '@jackwener/opencli/registry';
import { fetchXueqiuJson } from './utils.js';

cli({
  site: 'xueqiu',
  name: 'groups',
  description: '获取雪球自选股分组列表（含模拟组合）',
  domain: 'xueqiu.com',
  browser: true,
  columns: ['pid', 'name', 'count'],
  func: async (page, _kwargs) => {
    await page.goto('https://xueqiu.com');
    const d = await fetchXueqiuJson(page, 'https://stock.xueqiu.com/v5/stock/portfolio/list.json?category=1&size=20');
    if ('error' in d) return [d];
    if (!d.data?.stocks) return [{ error: '获取失败', help: '请确认已登录雪球（https://xueqiu.com）' }];
    return ((d.data.stocks || []) as any[]).map((g: any) => ({
      pid: String(g.id),
      name: g.name,
      count: g.symbol_count || 0,
    }));
  },
});
