import { cli, Strategy } from '@jackwener/opencli/registry';
import { getSlockContext } from './utils.js';

cli({
  site: 'slock',
  name: 'channels',
  description: '列出 Slock 工作空间的频道',
  domain: 'app.slock.ai',
  strategy: Strategy.COOKIE,
  browser: true,
  args: [
    { name: 'server', type: 'str', required: false, help: '工作空间 slug（默认用上次使用的）' },
  ],
  columns: ['name', 'description', 'type', 'joined', 'id'],
  func: async (page, kwargs) => {
    await page.goto('https://app.slock.ai');

    const ctx = await getSlockContext(page, kwargs.server || null);
    if ('error' in ctx) return [ctx];

    const data = await page.evaluate(`(async () => {
      const h = ${JSON.stringify(ctx.h)};
      const res = await fetch('https://api.slock.ai/api/channels', { headers: h });
      return res.json();
    })()`);

    if ((data as any)?.error) return [data];
    return (data as any[])
      .filter(c => !c.deletedAt)
      .map(c => ({
        name: '#' + c.name,
        description: c.description || '',
        type: c.type,
        joined: c.joined ? '✓' : '',
        id: c.id,
      }));
  },
});
