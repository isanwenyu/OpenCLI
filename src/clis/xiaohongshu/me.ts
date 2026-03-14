/**
 * Xiaohongshu me — read self profile info from Pinia user store.
 */
import { cli, Strategy } from '../../registry.js';

cli({
  site: 'xiaohongshu',
  name: 'me',
  description: '我的小红书个人信息',
  domain: 'www.xiaohongshu.com',
  strategy: Strategy.COOKIE,
  args: [],
  columns: ['nickname', 'red_id', 'fans', 'follows', 'notes', 'likes_collected'],
  func: async (page) => {
    await page.goto('https://www.xiaohongshu.com/user/profile/self');
    await page.wait(3);

    const data = await page.evaluate(`
      (() => {
        const app = document.querySelector('#app')?.__vue_app__;
        const pinia = app?.config?.globalProperties?.$pinia;
        if (!pinia?._s) return { error: 'Page not ready' };
        const userStore = pinia._s.get('user');
        if (!userStore) return { error: 'User store not found' };
        const state = userStore.$state || {};
        const u = state.selfInfo || state.currentUserInfo || state.userInfo || {};
        return {
          nickname: u.nickname || u.name || '',
          red_id: u.red_id || u.redId || '',
          fans: u.fans || u.fansCount || 0,
          follows: u.follows || u.followsCount || 0,
          notes: u.notes || u.noteCount || 0,
          likes_collected: u.collected || u.likedAndCollected || 0,
        };
      })()
    `);

    if (!data || data.error) return [];
    return [data];
  },
});
