const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Transform ESM-only modules (nanoid, etc.)
  transformIgnorePatterns: [
    '/node_modules/(?!(nanoid)/)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/tests/contracts/',
    '<rootDir>/tests/performance/',
    '<rootDir>/tests/visual/',
    '<rootDir>/__tests__/integration/',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/app/layout.tsx',
    '!src/app/providers.tsx',
    '!src/app/globals.css',
  ],
  coverageThreshold: {
    global: {
      // Baseline established as part of QA audit (Phase 5)
      // Target: increase quarterly toward 70-80%
      branches: 15,
      functions: 20,
      lines: 17,
      statements: 17,
    },
    './src/lib/security/': {
      branches: 60,
      functions: 65,
      lines: 65,
      statements: 65,
    },
    './src/lib/': {
      branches: 35,
      functions: 40,
      lines: 38,
      statements: 38,
    },
    './src/hooks/': {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40,
    },
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)',
  ],
}

module.exports = createJestConfig(customJestConfig)
