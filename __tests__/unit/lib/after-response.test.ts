/**
 * @jest-environment node
 *
 * runAfterResponse must hand background work to Next's after() so the
 * serverless function stays alive until it finishes. Vercel freezes the
 * function once the response is sent, which silently dropped un-awaited
 * email sends in production.
 */

const mockAfter = jest.fn();

jest.mock('next/server', () => ({
  after: (...args: unknown[]) => mockAfter(...args),
}));

import { runAfterResponse } from '@/lib/after-response';

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('runAfterResponse', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockAfter.mockReset();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('schedules the task with after() instead of starting it immediately', async () => {
    const task = jest.fn().mockResolvedValue(undefined);

    runAfterResponse(task, '[TEST] failed');
    await flushPromises();

    expect(mockAfter).toHaveBeenCalledTimes(1);
    expect(task).not.toHaveBeenCalled();

    const scheduled = mockAfter.mock.calls[0][0] as () => Promise<void>;
    await scheduled();

    expect(task).toHaveBeenCalledTimes(1);
  });

  it('logs a rejected task instead of propagating the error', async () => {
    const error = new Error('resend down');
    const task = jest.fn().mockRejectedValue(error);

    runAfterResponse(task, '[TEST] failed to send');
    const scheduled = mockAfter.mock.calls[0][0] as () => Promise<void>;

    await expect(scheduled()).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalledWith('[TEST] failed to send', error);
  });

  it('runs the task directly when called outside a request scope', async () => {
    mockAfter.mockImplementation(() => {
      throw new Error('`after` was called outside a request scope');
    });
    const task = jest.fn().mockResolvedValue(undefined);

    expect(() => runAfterResponse(task, '[TEST] failed')).not.toThrow();
    await flushPromises();

    expect(task).toHaveBeenCalledTimes(1);
  });
});
