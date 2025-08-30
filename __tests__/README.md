# Vetify Testing Infrastructure

This directory contains the comprehensive testing suite for the Vetify platform, designed to ensure code quality, security, and performance before production deployment.

## 🏗️ Testing Architecture

### Test Structure
```
__tests__/
├── mocks/                 # Mock implementations and test data
│   ├── prisma.ts         # Database mocking
│   ├── dom.ts            # DOM environment setup
│   ├── msw.ts            # API mocking setup
│   └── handlers.ts       # API endpoint mocks
├── unit/                  # Unit tests for individual functions/components
│   ├── components/        # React component tests
│   ├── lib/              # Utility function tests
│   ├── security/         # Security validation tests
│   └── performance/      # Performance and optimization tests
├── integration/           # Integration tests for API endpoints
│   └── api/              # API route testing
└── utils/                 # Test utilities and helpers
    └── test-utils.tsx    # Common testing functions
```

### Test Categories

#### 1. **Unit Tests** (`__tests__/unit/`)
- **Components**: React component rendering, interactions, and state management
- **Security**: Input validation, SQL injection prevention, XSS protection
- **Performance**: Database query optimization, memory usage, response times
- **Lib Functions**: Utility functions, business logic, data transformations

#### 2. **Integration Tests** (`__tests__/integration/`)
- **API Endpoints**: Full request/response cycle testing
- **Database Operations**: Multi-table operations and transactions
- **External Services**: Stripe, WhatsApp, email integrations
- **Authentication**: User sessions and permissions

#### 3. **E2E Tests** (`tests/e2e/`)
- **User Flows**: Complete user journeys (appointment booking, etc.)
- **Critical Paths**: Business-critical functionality validation
- **Cross-browser**: Browser compatibility testing

## 🚀 Getting Started

### Prerequisites
```bash
# Install dependencies
pnpm install

# Ensure test environment is configured
pnpm env:localhost
```

### Running Tests

#### Quick Start
```bash
# Run all tests
pnpm test:all

# Run tests in watch mode
pnpm test:watch
```

#### Specific Test Suites
```bash
# Unit tests only
pnpm test:unit

# Integration tests only
pnpm test:integration

# Security tests
pnpm test:security

# Performance tests
pnpm test:performance

# Component tests
pnpm test:components

# E2E tests
pnpm test:e2e
```

#### Coverage Reports
```bash
# Generate coverage report
pnpm test:coverage

# Watch mode with coverage
pnpm test:coverage:watch

# Generate detailed coverage analysis
pnpm test:coverage:report
```

## 🧪 Writing Tests

### Component Testing Example
```tsx
import { render, screen, fireEvent } from '../../utils/test-utils';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interactions', () => {
    const mockOnClick = jest.fn();
    render(<MyComponent onClick={mockOnClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalled();
  });
});
```

### API Integration Testing Example
```tsx
import { prismaMock } from '../../mocks/prisma';
import { createTestUser } from '../../utils/test-utils';

describe('User API', () => {
  it('should create a new user', async () => {
    const userData = createTestUser();
    prismaMock.user.create.mockResolvedValue(userData);
    
    // Test API endpoint logic
    const result = await createUser(userData);
    expect(result).toEqual(userData);
  });
});
```

### Security Testing Example
```tsx
describe('Security Tests', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    
    // Test that input is properly sanitized
    const sanitized = sanitizeInput(maliciousInput);
    expect(sanitized).not.toContain('DROP TABLE');
  });
});
```

## 🔧 Test Configuration

### Jest Configuration
- **Unit Tests**: `jest.config.ts` - React components, utilities
- **Integration Tests**: `jest.integration.config.ts` - API endpoints, database
- **Coverage**: 70% minimum threshold for all metrics

### Environment Setup
- **Test Environment**: `jsdom` for React components
- **Database**: Mocked with `jest-mock-extended`
- **API**: Mocked with `msw` (Mock Service Worker)
- **External Services**: All external calls are mocked

### Mock Data
```tsx
// Use test data factories
import { createTestUser, createTestAppointment } from '../../utils/test-utils';

const user = createTestUser({ role: 'ADMIN' });
const appointment = createTestAppointment({ status: 'SCHEDULED' });
```

## 📊 Coverage Requirements

### Minimum Coverage Targets
- **Overall**: 70% (lines, branches, functions, statements)
- **Core Business Logic**: 80% (lib directory)
- **Components**: 70% (UI components)
- **API Endpoints**: 80% (critical business functions)

### Coverage Exclusions
- Configuration files
- Build scripts
- Type definitions
- Health check endpoints
- Test files themselves

## 🚨 Critical Test Areas

### 1. **Security Testing** (High Priority)
- [x] SQL injection prevention
- [x] XSS protection
- [x] CSRF token validation
- [x] Input sanitization
- [x] Rate limiting
- [x] Multi-tenant isolation

### 2. **API Testing** (High Priority)
- [x] Authentication and authorization
- [x] Input validation
- [x] Error handling
- [x] Response formatting
- [x] Rate limiting enforcement

### 3. **Component Testing** (Medium Priority)
- [x] Rendering and display
- [x] User interactions
- [x] State management
- [x] Accessibility features
- [x] Error boundaries

### 4. **Performance Testing** (Medium Priority)
- [x] Database query optimization
- [x] Memory usage monitoring
- [x] Response time benchmarks
- [x] Concurrent request handling

## 🐛 Troubleshooting

### Common Issues

#### 1. **Test Environment Setup**
```bash
# Clear Jest cache
pnpm jest --clearCache

# Reset environment
pnpm env:localhost
```

#### 2. **Mock Issues**
```bash
# Check mock implementations
cat __tests__/mocks/prisma.ts

# Verify MSW setup
cat __tests__/mocks/msw.ts
```

#### 3. **Coverage Issues**
```bash
# Generate fresh coverage
pnpm test:coverage:report

# Check coverage thresholds
cat jest.config.ts
```

### Debug Mode
```bash
# Run tests with verbose output
pnpm test --verbose

# Debug specific test file
pnpm test --testNamePattern="MyComponent"
```

## 📈 Continuous Improvement

### Test Quality Metrics
- **Test Reliability**: Tests should be deterministic and repeatable
- **Test Performance**: Unit tests should complete in <1s, integration <5s
- **Test Coverage**: Aim for 80%+ coverage in critical areas
- **Test Maintenance**: Tests should be easy to update and maintain

### Regular Maintenance
- **Weekly**: Review test failures and fix flaky tests
- **Monthly**: Update test data and mock implementations
- **Quarterly**: Review coverage targets and adjust thresholds
- **Release**: Full test suite validation before deployment

## 🔗 Related Documentation

- [Testing Best Practices](../docs/development/testing.md)
- [Security Testing Guide](../docs/security/testing.md)
- [Performance Testing Strategy](../docs/performance/testing.md)
- [Component Testing Guidelines](../docs/development/components.md)

## 📞 Support

For testing-related questions or issues:
1. Check this README for common solutions
2. Review existing test implementations
3. Consult the testing utilities in `__tests__/utils/`
4. Create an issue with the `testing` label

---

*Last updated: ${new Date().toLocaleDateString()}*
*Testing infrastructure version: 2.0*
