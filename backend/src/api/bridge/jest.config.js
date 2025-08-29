module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/api/bridge'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/api/bridge/**/*.{ts,tsx}',
    '!src/api/bridge/**/*.d.ts',
    '!src/api/bridge/**/index.ts',
    '!src/api/bridge/server.ts',
    '!src/api/bridge/**/__tests__/**',
    '!src/api/bridge/**/tests/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  coverageDirectory: '<rootDir>/coverage/api-bridge',
  coverageReporters: ['json', 'lcov', 'text', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/api/bridge/tests/setup.ts'],
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  moduleNameMapper: {
    '^@bridge/(.*)$': '<rootDir>/src/api/bridge/$1',
    '^@config$': '<rootDir>/src/api/bridge/config',
    '^@services/(.*)$': '<rootDir>/src/api/bridge/v1/services/$1',
    '^@middleware/(.*)$': '<rootDir>/src/api/bridge/v1/middleware/$1',
    '^@controllers/(.*)$': '<rootDir>/src/api/bridge/v1/controllers/$1',
    '^@routes/(.*)$': '<rootDir>/src/api/bridge/v1/routes/$1'
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }
  }
};