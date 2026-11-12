import { after } from 'next/server';

/**
 * Runs non-critical work (emails, notifications, analytics) after the response
 * is sent, without making the request wait for it.
 *
 * Never fire an un-awaited promise from a route handler instead: on Vercel the
 * function is frozen as soon as the response goes out, so the promise can be
 * dropped mid-flight. after() keeps the function alive until the task settles.
 *
 * Errors are logged with `errorMessage` and never reach the request.
 */
export function runAfterResponse(
  task: () => Promise<unknown>,
  errorMessage: string
): void {
  const run = async () => {
    try {
      await task();
    } catch (error) {
      console.error(errorMessage, error);
    }
  };

  try {
    after(run);
  } catch {
    // Outside a request scope (scripts, tests without Next's runtime) there is
    // nothing to keep alive, so run it detached.
    void run();
  }
}
