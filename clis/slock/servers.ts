import { cli, Strategy } from '@jackwener/opencli/registry';

cli({
  site: 'slock',
  name: 'servers',
  description: '列出我的 Slock 工作空间',
  domain: 'app.slock.ai',
  strategy: Strategy.COOKIE,
  browser: true,
  args: [],
  columns: ['name', 'slug', 'role', 'plan', 'createdAt'],
  func: async (page, _kwargs) => {
    await page.goto('https://app.slock.ai');
    const data = await page.evaluate(`(async () => {
      const token = localStorage.getItem('slock_access_token');
      if (!token) return { error: 'Not logged in', help: 'Open https://app.slock.ai and log in, then retry' };
      const res = await fetch('https://api.slock.ai/api/servers', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      return res.json();
    })()`);
    if ((data as any)?.error) return [data];
    return (data as any[]).map(s => ({
      name: s.name,
      slug: s.slug,
      role: s.role,
      plan: s.plan,
      createdAt: s.createdAt?.substring(0, 10),
    }));
  },
});
