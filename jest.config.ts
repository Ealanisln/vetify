import type { Config } from 'jest';

const config: Config = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Module name mapping for path aliases
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    // Mock CSS and asset files
    '\\.(css|less|scss|sass)$': '<rootDir>/__tests__/mocks/fileMock.js',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__tests__/mocks/fileMock.js',
  },

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/__tests__/mocks/dom.ts'
  ],

  // Test file patterns
  testMatch: [
    '<rootDir>/__tests__/unit/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.test.{ts,tsx}'
  ],

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      jsx: 'react-jsx'
    }]
  },

  // Extensions to treat as ES modules
  extensionsToTreatAsEsm: ['.ts', '.tsx'],

  // Ignore patterns for transformation
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],

  // Coverage configuration - temporarily disabled
  collectCoverage: false,
  // collectCoverageFrom: [
  //   'src/**/*.{ts,tsx}',
  //   '!src/**/*.d.ts',
  //   '!src/**/*.stories.{ts,tsx}',
  //   '!src/**/*.test.{ts,tsx}',
  //   '!src/**/*.spec.{ts,tsx}',
  //   '!src/**/index.ts',
  //   '!src/**/index.tsx',
  //   '!src/app/**/page.tsx',
  //   '!src/app/**/layout.tsx',
  //   '!src/app/**/loading.tsx',
  //   '!src/app/**/error.tsx',
  //   '!src/app/**/not-found.tsx'
  // ],
  // coverageDirectory: 'coverage',
  // coverageReporters: ['text', 'lcov', 'json-summary'],
  // coverageThreshold: {
  //   global: {
  //     branches: 70,
  //     functions: 70,
  //     lines: 70,
  //     statements: 70
  //   }
  // },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true
};

export default config;
