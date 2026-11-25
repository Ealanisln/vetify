/**
 * Worker cap shared by the Jest and Playwright configs.
 *
 * Jest defaults to (cores - 1) workers and Playwright to half the cores. That
 * is fine for one run, but several coding agents running suites at the same
 * time (one per worktree) multiply it and exhaust the machine's memory.
 *
 * - TEST_MAX_WORKERS=<n | n%> always wins.
 * - Runs started from Claude Code (CLAUDECODE is set) are capped at 2.
 * - Anything else keeps the runner's default.
 */
const AGENT_MAX_WORKERS = 2

function maxTestWorkers() {
  const explicit = process.env.TEST_MAX_WORKERS
  if (explicit) {
    return /^\d+$/.test(explicit) ? Number(explicit) : explicit
  }
  return process.env.CLAUDECODE ? AGENT_MAX_WORKERS : undefined
}

module.exports = { maxTestWorkers }
