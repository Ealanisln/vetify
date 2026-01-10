import type { Config } from 'jest';

const config: Config = {
  displayName: 'integration',
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
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
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

