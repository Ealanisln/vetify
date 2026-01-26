# Weekly E2E Smoke Tests

## Overview

The weekly smoke tests are lightweight health checks that verify critical business workflows are functioning. They run automatically every week and catch regressions before users do.

## Test Coverage

### Total: 65 tests
- **20 public tests** (no authentication required)
- **45 authenticated tests** (require `TEST_AUTH_ENABLED=true`)
- **15 CRUD tests** (tagged `@crud`)

### Priority Levels

| Priority | Meaning | Action on Failure |
|----------|---------|-------------------|
| **P0** | Critical - Must pass | Immediate investigation required |
| **P1** | Important - Should pass | Review within 24-48 hours |
| **P2** | Optional - Nice to have | Address during maintenance |

### Test Modules

#### Page Load Tests (P0/P1)

| Module | Priority | Tests | Verifies |
|--------|----------|-------|----------|
| Mascotas | P0 | 5 | List, search, create button, detail, limits |
| Clientes | P0 | 4 | List, search, create button, stats |
| Citas | P1 | 5 | Calendar, stats, today's appointments, new button |
| Inventario | P1 | 6 | Products, stats, search, categories, low stock |
| Punto de Venta | P1 | 5 | Customer/product search, cart, register status |
| Caja | P1 | 4 | Tabs, open/closed status, actions |

#### CRUD Tests (Demo-Critical)

| Module | Priority | Tests | Operations |
|--------|----------|-------|------------|
| Clientes | P0 | 3 | Create, Edit, Search |
| Mascotas | P0 | 3 | Create, Edit, View Detail |
| Citas | P1 | 3 | Create, Edit, Quick Actions |
| Inventario | P1 | 3 | Create, Edit, Stock Adjust |
| Ventas | P1 | 3 | Add to Cart, Select Customer, Register Status |

---

## Commands

### Run All Weekly Tests (Public Only)
```bash
pnpm test:e2e:weekly
```

### Run All Tests Including Authenticated
```bash
TEST_AUTH_ENABLED=true pnpm test:e2e:weekly
```

### Run P0 Critical Tests Only (Recommended Before Demos)
```bash
TEST_AUTH_ENABLED=true pnpm test:e2e:weekly:p0
```

### Run CRUD Tests Only
```bash
TEST_AUTH_ENABLED=true pnpm test:e2e:weekly -- --grep '@crud'
```

### View HTML Report
```bash
pnpm test:e2e:weekly:report
```

---

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/weekly-tests.yml`) runs automatically:

- **Schedule**: Every Sunday at 6:00 AM UTC
- **On Push**: To `development` or `main` branches (public tests only)
- **Manual**: Via workflow_dispatch

---

## Quality Gate Checklist

Before merging to main, verify:

| Check | Command | Expected |
|-------|---------|----------|
| Lint | `pnpm lint` | No errors (warnings OK) |
| TypeScript | `pnpm typecheck` | Pass |
| Unit Tests | `pnpm test` | All pass |
| Build | `pnpm build` | Success |
| Security | `pnpm audit --audit-level=high` | No high/critical |
| Weekly E2E | `pnpm test:e2e:weekly` | 20/20 public pass |

---

## Troubleshooting

### Tests Skipped
If you see tests being skipped, they require authentication:
```bash
# Enable authenticated tests
TEST_AUTH_ENABLED=true pnpm test:e2e:weekly
```

### Test Failures
1. Check the HTML report: `pnpm test:e2e:weekly:report`
2. Look for screenshots in `playwright-report-weekly/`
3. P0 failures require immediate attention
4. P1 failures should be addressed within 24-48 hours

### Demo Preparation
Before any demo, run:
```bash
TEST_AUTH_ENABLED=true pnpm test:e2e:weekly:p0
```
This verifies Clientes and Mascotas CRUD operations work correctly.

---

## File Structure

```
tests/e2e/weekly/
├── weekly.smoke.spec.ts    # Main test suite (65 tests)
└── README.md               # Quick reference

playwright.weekly.config.ts  # Playwright configuration
.github/workflows/weekly-tests.yml  # CI workflow
```

---

## Adding New Tests

When adding tests, follow this pattern:

```typescript
test.describe('P0 - Module Name @weekly @p0', () => {
  test.skip(!isAuthTestEnabled, 'Requires TEST_AUTH_ENABLED=true')

  test('Test description @weekly @p0', async ({ page }) => {
    await page.goto('/dashboard/module')
    await page.waitForLoadState('networkidle')
    // ... assertions
  })
})
```

For CRUD tests, add the `@crud` tag:
```typescript
test('Create item @weekly @p0 @crud', async ({ page }) => {
  // ... test implementation
})
```
