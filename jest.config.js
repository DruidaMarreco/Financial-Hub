module.exports = {
  projects: [
    {
      displayName: 'api',
      testEnvironment: 'node',
      rootDir: 'apps/api',
      testMatch: ['<rootDir>/src/**/*.spec.ts'],
      transform: {
        '^.+\.tsx?$': ['ts-jest', {
          tsconfig: {
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
          },
        }],
      },
      moduleNameMapper: {
        '^@financial-hub/(.*)$': '<rootDir>/../../libs/$1/src',
      },
      collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.spec.ts',
        '!src/main.ts',
        '!src/**/*.module.ts',
      ],
      coverageThreshold: {
        global: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60,
        },
        './src/integrations/': {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    {
      displayName: 'web',
      testEnvironment: 'jsdom',
      rootDir: 'apps/web',
      testMatch: ['<rootDir>/src/**/*.test.tsx', '<rootDir>/src/**/*.test.ts'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      transform: {
        '^.+\.(tsx?|jsx?)$': ['@swc/jest'],
      },
      moduleNameMapper: {
        '^@financial-hub/(.*)$': '<rootDir>/../../libs/$1/src',
        '\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.test.{ts,tsx}',
        '!src/**/*.spec.{ts,tsx}',
        '!src/pages/_*.tsx',
        '!src/**/*.d.ts',
      ],
      coverageThreshold: {
        './src/components/BankConnectionModal.tsx': {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75,
        },
        './src/pages/integrations/revolut/callback.tsx': {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75,
        },
      },
    },
  ],
};
