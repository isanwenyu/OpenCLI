import { cli, Strategy } from '@jackwener/opencli/registry';
import { getSlockContext, resolveChannelId } from './utils.js';

cli({
  site: 'slock',
  name: 'messages',
  description: '读取 Slock 频道消息',
  domain: 'app.slock.ai',
  strategy: Strategy.COOKIE,
  browser: true,
  args: [
    { name: 'channel', type: 'str', required: true, positional: true, help: '频道名称（如 general）或频道 ID' },
    { name: 'server', type: 'str', required: false, help: '工作空间 slug（默认用上次使用的）' },
    { name: 'limit', type: 'int', default: 20, help: '消息数量' },
  ],
  columns: ['time', 'author', 'content'],
  func: async (page, kwargs) => {
    await page.goto('https://app.slock.ai');

    const ctx = await getSlockContext(page, kwargs.server || null);
    if ('error' in ctx) return [ctx];

    const channelId = await resolveChannelId(page, kwargs.channel, ctx.h);
    if (typeof channelId !== 'string') return [channelId];

    const msgs = await page.evaluate(`(async () => {
      const h = ${JSON.stringify(ctx.h)};
      const res = await fetch('https://api.slock.ai/api/messages/channel/' + ${JSON.stringify(channelId)} + '?limit=' + ${JSON.stringify(kwargs.limit)}, { headers: h });
      return res.json();
    })()`);

    if ((msgs as any)?.error) return [msgs];
    return ((msgs as any).messages || []).map((m: any) => ({
      time: m.createdAt?.substring(0, 16).replace('T', ' '),
      author: m.author?.displayName || m.author?.name || m.authorId,
      content: (m.content || '').replace(/\n/g, ' ').substring(0, 120),
    }));
  },
});
