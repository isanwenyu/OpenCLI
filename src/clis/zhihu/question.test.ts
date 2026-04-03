import { describe, expect, it, vi } from 'vitest';
import { getRegistry } from '../../registry.js';
import { AuthRequiredError } from '../../errors.js';
import './question.js';

describe('zhihu question', () => {
  it('returns answers even when the unused question detail request fails', async () => {
    const cmd = getRegistry().get('zhihu/question');
    expect(cmd?.func).toBeTypeOf('function');

    const goto = vi.fn().mockResolvedValue(undefined);
    const evaluate = vi.fn().mockImplementation(async (js: string) => {
      expect(js).toContain('questions/2021881398772981878/answers?limit=3');
      expect(js).toContain("credentials: 'include'");
      return {
        ok: true,
        answers: [
          {
            author: { name: 'alice' },
            voteup_count: 12,
            content: '<p>Hello <b>Zhihu</b></p>',
          },
        ],
      };
    });

    const page = {
      goto,
      evaluate,
    } as any;

    await expect(
      cmd!.func!(page, { id: '2021881398772981878', limit: 3 }),
    ).resolves.toEqual([
      {
        rank: 1,
        author: 'alice',
        votes: 12,
        content: 'Hello Zhihu',
      },
    ]);

    expect(goto).toHaveBeenCalledWith('https://www.zhihu.com/question/2021881398772981878');
    expect(evaluate).toHaveBeenCalledTimes(1);
  });

  it('maps auth-like answer failures to AuthRequiredError', async () => {
    const cmd = getRegistry().get('zhihu/question');
    expect(cmd?.func).toBeTypeOf('function');

    const page = {
      goto: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue({ ok: false, status: 403 }),
    } as any;

    await expect(
      cmd!.func!(page, { id: '2021881398772981878', limit: 3 }),
    ).rejects.toBeInstanceOf(AuthRequiredError);
  });

  it('preserves non-auth fetch failures as CliError instead of login errors', async () => {
    const cmd = getRegistry().get('zhihu/question');
    expect(cmd?.func).toBeTypeOf('function');

    const page = {
      goto: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    } as any;

    await expect(
      cmd!.func!(page, { id: '2021881398772981878', limit: 3 }),
    ).rejects.toMatchObject({
      code: 'FETCH_ERROR',
      message: 'Zhihu question answers request failed with HTTP 500',
    });
  });

  it('surfaces browser-side fetch exceptions instead of HTTP unknown', async () => {
    const cmd = getRegistry().get('zhihu/question');
    expect(cmd?.func).toBeTypeOf('function');

    const page = {
      goto: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue({ ok: false, status: 0, error: 'Failed to fetch' }),
    } as any;

    await expect(
      cmd!.func!(page, { id: '2021881398772981878', limit: 3 }),
    ).rejects.toMatchObject({
      code: 'FETCH_ERROR',
      message: 'Zhihu question answers request failed: Failed to fetch',
    });
  });

  it('uses string-based evaluate compatible with the browser runtime', async () => {
    const cmd = getRegistry().get('zhihu/question');
    expect(cmd?.func).toBeTypeOf('function');

    const page = {
      goto: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue({ ok: true, answers: [] }),
    } as any;

    await cmd!.func!(page, { id: '2021881398772981878', limit: 1 });

    expect(page.evaluate).toHaveBeenCalledWith(expect.any(String));
    expect(page.evaluate).not.toHaveBeenCalledWith(expect.any(Function), expect.anything());
  });
});
