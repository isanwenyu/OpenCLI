import type { IPage } from '@jackwener/opencli/types';

export interface XueqiuError { error: string; help: string; }

/**
 * Fetch a xueqiu JSON API from inside the browser context (credentials included).
 * Page must already be navigated to xueqiu.com before calling this function.
 * Returns { error, help } on HTTP errors; otherwise returns the parsed JSON.
 */
export async function fetchXueqiuJson(page: IPage, url: string): Promise<any | XueqiuError> {
  const result = await page.evaluate(`(async () => {
    const res = await fetch(${JSON.stringify(url)}, { credentials: 'include' });
    if (!res.ok) return { __xqErr: res.status };
    try {
      return await res.json();
    } catch {
      return { __xqErr: 'parse' };
    }
  })()`);

  const r = result as any;
  if (r?.__xqErr !== undefined) {
    const code = r.__xqErr;
    if (code === 401 || code === 403) {
      return { error: '未登录或登录已过期', help: '在浏览器中打开 https://xueqiu.com 并登录，然后重试' };
    }
    if (code === 'parse') {
      return { error: '响应不是有效 JSON', help: '可能触发了风控，请检查登录状态或稍后重试' };
    }
    return { error: `HTTP ${code}`, help: '请检查网络连接或登录状态' };
  }
  return result;
}
