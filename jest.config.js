module.exports = {
  projects: [
    {
      displayName: '@financial-hub/api',
      rootDir: '<rootDir>/apps/api',
      testEnvironment: 'node',
      testMatch: ['**/*.spec.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: {
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
          },
        }],
      },
      moduleNameMapper: {
        '^@financial-hub/data$': '<rootDir>/../../libs/data/src',
        '^@financial-hub/core$': '<rootDir>/../../libs/core/src',
        '^@financial-hub/common$': '<rootDir>/../../libs/common/src',
      },
      collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.spec.ts',
        '!src/main.ts',
        '!src/**/*.module.ts',
      ],
      coveragePathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
      ],
      coverageThreshold: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60,
        },
      },
    },
    {
      displayName: '@financial-hub/web',
      rootDir: '<rootDir>/apps/web',
      testEnvironment: 'jsdom',
      testMatch: ['**/*.spec.ts', '**/*.spec.tsx'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: {
            jsx: 'react',
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
          },
        }],
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@financial-hub/common$': '<rootDir>/../../libs/common/src',
      },
      collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.spec.{ts,tsx}',
        '!src/pages/**',
        '!src/**/*.d.ts',
      ],
      coveragePathIgnorePatterns: [
        '/node_modules/',
        '/.next/',
      ],
    },
  ],
  testTimeout: 10000,
  verbose: true,
};
