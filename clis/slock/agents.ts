import { cli, Strategy } from '@jackwener/opencli/registry';
import { getSlockContext } from './utils.js';

cli({
  site: 'slock',
  name: 'agents',
  description: '列出 Slock 工作空间的 AI agents',
  domain: 'app.slock.ai',
  strategy: Strategy.COOKIE,
  browser: true,
  args: [
    { name: 'server', type: 'str', required: false, help: '工作空间 slug（默认用上次使用的）' },
    { name: 'all', type: 'bool', default: false, help: '包含已删除的 agents' },
  ],
  columns: ['name', 'displayName', 'model', 'runtime', 'status', 'activity'],
  func: async (page, kwargs) => {
    await page.goto('https://app.slock.ai');

    const ctx = await getSlockContext(page, kwargs.server || null);
    if ('error' in ctx) return [ctx];

    const data = await page.evaluate(`(async () => {
      const h = ${JSON.stringify(ctx.h)};
      const res = await fetch('https://api.slock.ai/api/agents', { headers: h });
      return res.json();
    })()`);

    if ((data as any)?.error) return [data];
    return (data as any[])
      .filter(a => kwargs.all || !a.deletedAt)
      .map(a => ({
        name: a.name,
        displayName: a.displayName,
        model: a.model,
        runtime: a.runtime,
        status: a.status,
        activity: a.activity,
      }));
  },
});
