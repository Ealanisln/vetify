import type { Config } from 'jest';
import { maxTestWorkers } from './test-workers.cjs';

const workers = maxTestWorkers();

const config: Config = {
  displayName: 'integration',
  ...(workers === undefined ? {} : { maxWorkers: workers }),
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.integration.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock nanoid ESM-only module
    '^nanoid$': '<rootDir>/__tests__/mocks/nanoid.ts',
  },
  testMatch: [
    '**/__tests__/integration/**/*.test.ts',
  ],
  transform: {
    // .js too: src/lib/security/content-security-policy.js is plain ESM so
    // next.config.js can import it without a TypeScript loader.
    '^.+\\.[tj]sx?$': ['ts-jest', {
      tsconfig: {
        allowJs: true,
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testTimeout: 30000,
};

export default config;

