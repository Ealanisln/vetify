# Testing Guide for Vetify

## Table of Contents

- [Overview](#overview)
- [Testing Philosophy](#testing-philosophy)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Coverage Goals](#coverage-goals)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Overview

Vetify uses a comprehensive testing strategy that includes:
- **Unit Tests**: Testing individual functions and components in isolation
- **Integration Tests**: Testing interactions between modules and services
- **E2E Tests**: Testing complete user workflows with Playwright

**Total Test Count**: 238+ tests across all suites

## Testing Philosophy

### Core Principles

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
2. **Isolation**: Tests should be independent and not rely on external state
3. **Fast Feedback**: Unit tests should run quickly; integration tests can be slower
4. **Realistic Scenarios**: E2E tests should mirror real user interactions
5. **Type Safety**: Leverage TypeScript to catch errors at compile time

### Testing Pyramid

```
       /\     E2E Tests (Playwright)
      /  \    - Complete user workflows
     /____\   - Critical business paths
    /      \  Integration Tests
   /        \ - API routes
  /          \- Database operations
 /____________\ Unit Tests
                - Pure functions
                - Components
                - Utilities
```

## Test Types

### Unit Tests

**Location**: `__tests__/unit/`

Unit tests focus on testing individual functions, components, and utilities in isolation.

**What to Test**:
- Pure functions and utilities
- React components with mock dependencies
- Business logic and validation rules
- Security functions
- Serialization/formatting utilities

**Example**:
```typescript
// __tests__/unit/utils/format.test.ts
import { formatWeight } from '@/utils/format';

describe('formatWeight', () => {
  it('should format valid weight with unit', () => {
    expect(formatWeight(5.3, 'kg')).toBe('5.3 kg');
  });

  it('should return fallback for null weight', () => {
    expect(formatWeight(null)).toBe('No registrado');
  });
});
```

### Integration Tests

**Location**: `__tests__/integration/`

Integration tests verify that multiple components work together correctly.

**What to Test**:
- API route handlers with database
- Authentication flows
- Multi-tenant data isolation
- Subscription and trial logic
- Complex business workflows

**Example**:
```typescript
// __tests__/integration/api/pets.test.ts
describe('Pet API', () => {
  it('should create pet and associate with customer', async () => {
    const customer = await createTestCustomer();
    const pet = await createPet(customer.id);

    expect(pet.customerId).toBe(customer.id);
    expect(pet.tenantId).toBe(customer.tenantId);
  });
});
```

### E2E Tests

**Location**: `tests/e2e/`

End-to-end tests use Playwright to test complete user workflows in a real browser.

**What to Test**:
- User registration and onboarding
- Subscription upgrade/downgrade flows
- Feature access with different plans
- Critical business paths (appointments, medical records)
- Multi-step forms and wizards

**Example**:
```typescript
// tests/e2e/subscription/upgrade-flows.spec.ts
test('user can upgrade from trial to paid plan', async ({ page }) => {
  await loginAsTrialUser(page);
  await page.goto('/dashboard/settings?tab=subscription');
  await page.getByTestId('upgrade-to-basico').click();
  await fillStripeCheckout(page);
  await expect(page.getByText('Plan: Básico')).toBeVisible();
});
```

## Running Tests

### Quick Commands

```bash
# Run all unit tests (fastest)
pnpm test:unit

# Run specific test file
pnpm test src/utils/format.test.ts

# Run tests in watch mode (auto-rerun on file changes)
pnpm test:watch

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI mode (recommended for debugging)
pnpm test:e2e:ui

# Run all tests (unit + integration + E2E)
pnpm test:all

# Run tests with coverage report
pnpm test:coverage
```

### Specialized Test Suites

```bash
# Security tests only
pnpm test:security

# Performance tests only
pnpm test:performance

# Component tests only
pnpm test:components

# Critical tests before deployment
pnpm test:critical
```

## Test Structure

### Directory Organization

```
vetify/
├── __tests__/
│   ├── unit/
│   │   ├── components/       # React component tests
│   │   ├── lib/              # Utility and library tests
│   │   ├── security/         # Security-related tests
│   │   └── performance/      # Performance tests
│   └── integration/
│       ├── api/              # API route tests
│       ├── auth/             # Authentication flow tests
│       ├── multi-tenancy/    # Tenant isolation tests
│       └── subscription/     # Subscription logic tests
├── tests/
│   └── e2e/                  # Playwright E2E tests
│       ├── subscription/
│       └── features/
├── jest.config.ts            # Jest configuration
├── jest.integration.config.ts # Integration test config
└── playwright.config.ts      # Playwright configuration
```

### Test File Naming

- Unit tests: `<module-name>.test.ts`
- Integration tests: `<feature-name>.test.ts`
- E2E tests: `<user-flow>.spec.ts`

## Writing Tests

### Unit Test Template

```typescript
import { describe, it, expect } from '@jest/globals';
import { functionToTest } from '@/path/to/module';

describe('ModuleName', () => {
  describe('functionToTest', () => {
    it('should handle normal case', () => {
      const result = functionToTest('input');
      expect(result).toBe('expected');
    });

    it('should handle edge case', () => {
      const result = functionToTest(null);
      expect(result).toBeNull();
    });

    it('should throw error for invalid input', () => {
      expect(() => functionToTest('invalid')).toThrow();
    });
  });
});
```

### Integration Test Template

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '@/lib/prisma';

describe('Feature Integration', () => {
  beforeAll(async () => {
    // Setup test data
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.$disconnect();
  });

  it('should perform complete workflow', async () => {
    // Arrange
    const testData = await createTestData();

    // Act
    const result = await performOperation(testData);

    // Assert
    expect(result).toMatchObject({
      // expected shape
    });
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Flow', () => {
  test('should complete main user flow', async ({ page }) => {
    // Navigate
    await page.goto('/path');

    // Interact
    await page.getByTestId('submit-button').click();

    // Assert
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Pull requests to `main` or `development` branches
- Pushes to `main` or `development` branches
- Manual workflow dispatch

### Test Pipeline

1. **Unit Tests** (parallel)
   - Fast feedback on code changes
   - Must pass before integration tests

2. **Integration Tests** (parallel)
   - Verify component interactions
   - Database operations

3. **E2E Tests** (parallel)
   - Complete user workflows
   - Critical business paths

4. **Coverage Report**
   - Generated and uploaded as artifact
   - Coverage threshold: 70%

### Pre-deployment Checks

```bash
# Run before creating a PR
pnpm test:all

# Run before deploying
pnpm test:pre-deploy
```

## Coverage Goals

### Target Coverage

- **Overall**: 70%+
- **Critical paths**: 90%+
  - Authentication
  - Payment processing
  - Multi-tenant isolation
  - Security functions

### Viewing Coverage

```bash
# Generate coverage report
pnpm test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

### Coverage Report Location

- **HTML Report**: `coverage/lcov-report/index.html`
- **JSON Report**: `coverage/coverage-final.json`
- **LCOV Report**: `coverage/lcov.info`

## Common Patterns

### Mocking Prisma

```typescript
import { prismaMock } from '../../../__mocks__/prisma';

it('should query database', async () => {
  prismaMock.pet.findUnique.mockResolvedValue({
    id: '1',
    name: 'Fluffy',
    // ... other fields
  });

  const result = await getPet('1');
  expect(result.name).toBe('Fluffy');
});
```

### Testing Auth

```typescript
import { mockSession } from '../../../__mocks__/auth';

it('should require authentication', async () => {
  mockSession(null); // No user logged in
  const response = await GET(mockRequest);
  expect(response.status).toBe(401);
});
```

### Testing Multi-Tenancy

```typescript
it('should isolate tenant data', async () => {
  const tenant1Data = await queryDataForTenant('tenant1');
  const tenant2Data = await queryDataForTenant('tenant2');

  expect(tenant1Data).not.toContainEqual(
    expect.objectContaining({ tenantId: 'tenant2' })
  );
});
```

### Testing Subscriptions

```typescript
import { mockSubscriptionStatus } from '../../../__mocks__/subscription';

it('should gate premium feature', async () => {
  mockSubscriptionStatus({ plan: 'basico', isActive: true });

  const hasAccess = await checkFeatureAccess('inventory');
  expect(hasAccess).toBe(false);
});
```

## Troubleshooting

### Common Issues

#### Tests Fail Locally But Pass in CI

**Cause**: Environment variables not set correctly
**Solution**: Run `pnpm env:localhost` before testing

#### Integration Tests Timeout

**Cause**: Database connection issues
**Solution**:
1. Verify `DATABASE_URL` in `.env`
2. Increase test timeout in `jest.config.ts`
3. Check Supabase connection

#### E2E Tests Fail

**Cause**: Timing issues or selectors
**Solution**:
1. Run with UI mode: `pnpm test:e2e:ui`
2. Add explicit waits: `await page.waitForSelector()`
3. Use `data-testid` attributes instead of text selectors

#### Coverage Not Generated

**Cause**: Coverage thresholds not met
**Solution**:
1. Check which files lack coverage
2. Add tests for untested code paths
3. Adjust thresholds if appropriate

### Debug Mode

```bash
# Run single test file with verbose output
pnpm test path/to/test.test.ts --verbose

# Run E2E tests in debug mode
DEBUG=pw:api pnpm test:e2e

# Open Playwright trace viewer
npx playwright show-trace trace.zip
```

## Best Practices

### Do's

✅ Write tests before fixing bugs (TDD)
✅ Use descriptive test names
✅ Test edge cases and error conditions
✅ Keep tests isolated and independent
✅ Use `data-testid` for E2E selectors
✅ Mock external dependencies
✅ Clean up test data in `afterAll`/`afterEach`

### Don'ts

❌ Don't test implementation details
❌ Don't share state between tests
❌ Don't use hard-coded IDs from production
❌ Don't skip tests without a good reason
❌ Don't test third-party library code
❌ Don't forget to update tests when refactoring

## Related Documentation

- [CLAUDE.md](./CLAUDE.md) - Project architecture and conventions
- [README.md](./README.md) - Project setup and overview
- [Playwright Docs](https://playwright.dev) - E2E testing framework
- [Jest Docs](https://jestjs.io) - Unit testing framework

---

**Last Updated**: 2025-01-31
**Test Count**: 238+ tests
**Coverage**: 70%+
