import { describe, expect, it, vi } from 'vitest';
import { AuthRequiredError } from '@jackwener/opencli/errors';
import { getRegistry } from '@jackwener/opencli/registry';
import type { IPage } from '@jackwener/opencli/types';
import { __test__ } from './search.js';

function createPageMock(evaluateResults: unknown[]): IPage {
  const evaluate = vi.fn();
  for (const result of evaluateResults) evaluate.mockResolvedValueOnce(result);

  return {
    goto: vi.fn().mockResolvedValue(undefined),
    evaluate,
    snapshot: vi.fn().mockResolvedValue(undefined),
    click: vi.fn().mockResolvedValue(undefined),
    typeText: vi.fn().mockResolvedValue(undefined),
    pressKey: vi.fn().mockResolvedValue(undefined),
    scrollTo: vi.fn().mockResolvedValue(undefined),
    getFormState: vi.fn().mockResolvedValue({ forms: [], orphanFields: [] }),
    wait: vi.fn().mockResolvedValue(undefined),
    tabs: vi.fn().mockResolvedValue([]),
    selectTab: vi.fn().mockResolvedValue(undefined),
    networkRequests: vi.fn().mockResolvedValue([]),
    consoleMessages: vi.fn().mockResolvedValue([]),
    scroll: vi.fn().mockResolvedValue(undefined),
    autoScroll: vi.fn().mockResolvedValue(undefined),
    installInterceptor: vi.fn().mockResolvedValue(undefined),
    getInterceptedRequests: vi.fn().mockResolvedValue([]),
    getCookies: vi.fn().mockResolvedValue([]),
    screenshot: vi.fn().mockResolvedValue(''),
    waitForCapture: vi.fn().mockResolvedValue(undefined),
  };
}

describe('jianyu search helpers', () => {
  it('builds supsearch URL with required query params', () => {
    const url = __test__.buildSearchUrl('procurement');
    expect(url).toContain('keywords=procurement');
    expect(url).toContain('selectType=title');
    expect(url).toContain('searchGroup=1');
  });

  it('normalizes common date formats', () => {
    expect(__test__.normalizeDate('2026-4-7')).toBe('2026-04-07');
    expect(__test__.normalizeDate('2026年4月7日')).toBe('2026-04-07');
    expect(__test__.normalizeDate('发布时间: 2026/04/07 09:00')).toBe('2026-04-07');
  });

  it('deduplicates by title and url', () => {
    const deduped = __test__.dedupeCandidates([
      { title: 'A', url: 'https://example.com/1', date: '2026-04-07' },
      { title: 'A', url: 'https://example.com/1', date: '2026-04-07' },
      { title: 'A', url: 'https://example.com/2', date: '2026-04-07' },
    ]);
    expect(deduped).toHaveLength(2);
  });
});

describe('jianyu search command', () => {
  it('throws AuthRequiredError when Jianyu requires login or verification', async () => {
    const cmd = getRegistry().get('jianyu/search');
    expect(cmd?.func).toBeTypeOf('function');

    const page = createPageMock([
      { rows: [], authRequired: true },
    ]);

    await expect(cmd!.func!(page, { query: 'procurement', limit: 5 })).rejects.toBeInstanceOf(AuthRequiredError);
  });

  it('returns ranked normalized results from extracted rows', async () => {
    const cmd = getRegistry().get('jianyu/search');
    expect(cmd?.func).toBeTypeOf('function');

    const page = createPageMock([
      {
        authRequired: false,
        rows: [
          { title: '  招标 公告 A ', url: 'https://example.com/a', date: '发布时间: 2026/04/07 09:00' },
          { title: '  招标 公告 A ', url: 'https://example.com/a', date: '2026-04-07' },
          { title: '中标公告 B', url: 'https://example.com/b', date: '2026年4月8日' },
        ],
      },
    ]);

    const result = await cmd!.func!(page, { query: 'procurement', limit: 5 });

    expect(page.goto).toHaveBeenCalledWith(expect.stringContaining('keywords=procurement'));
    expect(result).toEqual([
      { rank: 1, title: '招标 公告 A', date: '2026-04-07', url: 'https://example.com/a' },
      { rank: 2, title: '中标公告 B', date: '2026-04-08', url: 'https://example.com/b' },
    ]);
  });

  it('rejects empty query after trimming', async () => {
    const cmd = getRegistry().get('jianyu/search');
    expect(cmd?.func).toBeTypeOf('function');

    const page = createPageMock([]);

    await expect(cmd!.func!(page, { query: '   ', limit: 5 })).rejects.toThrow('Search keyword cannot be empty');
    expect(page.goto).not.toHaveBeenCalled();
  });
});
