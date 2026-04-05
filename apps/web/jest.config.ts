import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@travel-companion/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
  testMatch: ['**/__tests__/**/*.{ts,tsx}', '**/*.{spec,test}.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/e2e/'],
  roots: ['<rootDir>', '<rootDir>/../../packages/shared/src'],
};

export default createJestConfig(config);
