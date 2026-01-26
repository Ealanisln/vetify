# Weekly E2E Smoke Tests

This directory contains smoke tests that run weekly to detect regressions in critical user flows before they affect production users.

## Tag Convention

Tests are tagged by priority and schedule:

| Tag | Description | Failure Response |
|-----|-------------|------------------|
| `@weekly` | Included in weekly test run | - |
| `@p0` | **Critical** - Must pass | Immediate investigation |
| `@p1` | **Important** - Should pass | Review within 24-48h |
| `@p2` | **Optional** - Nice to have | Address during maintenance |
| `@mobile` | Mobile-specific tests | Runs with mobile viewport |

## Running Tests

### Locally

```bash
# Run full weekly suite
pnpm test:e2e:weekly

# Run only critical (P0) tests
pnpm test:e2e:weekly:p0

# View the HTML report
pnpm test:e2e:weekly:report

# Run with specific tag
pnpm exec playwright test --config playwright.weekly.config.ts --grep '@p1'
```

### With Authentication

Some tests require authentication. To run authenticated tests:

```bash
TEST_AUTH_ENABLED=true pnpm test:e2e:weekly
```

## CI/CD

Weekly tests run automatically:

- **Schedule**: Every Monday at 6:00 AM UTC
- **Manual trigger**: Available via GitHub Actions workflow dispatch

### Viewing Results

1. Go to GitHub Actions > Weekly E2E Tests
2. Click on the latest run
3. Download the `weekly-test-report` artifact
4. Open `playwright-report-weekly/index.html`

## Test Categories

### P0 - Critical (Must Pass)

These tests validate core platform functionality:

- Landing page loads
- Health/version API endpoints
- Dashboard accessibility (auth redirect)
- Core static pages (privacy, terms)

### P1 - Important (Should Pass)

These tests cover important but non-blocking functionality:

- Public pages (updates, team)
- Navigation links
- API error handling
- Protected routes

### P2 - Optional (Nice to Have)

These tests are informational:

- Blog (requires Storyblok)
- Mobile responsiveness
- Performance indicators
- Console error monitoring

## Failure Triage Process

### When P0 Tests Fail

1. **Immediate action required**
2. Check if it's a test issue or real regression
3. Create urgent ticket in Plane
4. Notify team via Slack (if configured)
5. Investigate and fix ASAP

### When P1 Tests Fail

1. Review within 24-48 hours
2. Determine if it's blocking users
3. Create normal priority ticket
4. Schedule fix for current sprint

### When P2 Tests Fail

1. Log the failure
2. Create low-priority ticket
3. Address during maintenance window
4. Consider if test needs updating

## Adding New Tests

When adding new smoke tests:

1. Add to `weekly.smoke.spec.ts`
2. Include appropriate tags (`@weekly`, `@p0`/`@p1`/`@p2`)
3. Keep tests focused and independent
4. Avoid tests that require specific data state
5. Prefer checking "can it load" over "does specific data exist"

### Example

```typescript
test('New feature page loads @weekly @p1', async ({ page }) => {
  await page.goto('/new-feature')
  await expect(page.locator('h1')).toBeVisible()
})
```

## Configuration

- **Config file**: `playwright.weekly.config.ts`
- **Test directory**: `tests/e2e/weekly/`
- **Report output**: `playwright-report-weekly/`
- **JSON results**: `test-results/weekly-results.json`

### Key Configuration Differences

The weekly config differs from the main Playwright config:

| Setting | Main Config | Weekly Config |
|---------|-------------|---------------|
| Workers | Auto | 1 (single) |
| Retries | 1 (CI) | 2 |
| Timeout | 30s | 60s |
| Parallel | Yes | No |
| Focus | All tests | Smoke tests only |

## Troubleshooting

### Tests Pass Locally but Fail in CI

1. Check if test needs auth (set `TEST_AUTH_ENABLED=true`)
2. Verify CI has required env vars
3. Check if external service (Storyblok) is needed
4. Review the trace/screenshot artifacts

### Flaky Tests

1. Check for timing issues
2. Add appropriate waits (`waitForLoadState`, `waitForTimeout`)
3. Increase test timeout if needed
4. Consider if test is suitable for weekly suite

### Report Not Generating

1. Verify test ran: `pnpm test:e2e:weekly`
2. Check `playwright-report-weekly/` exists
3. Run: `pnpm exec playwright show-report playwright-report-weekly`
