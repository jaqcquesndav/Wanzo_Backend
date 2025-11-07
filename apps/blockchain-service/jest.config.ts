import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.test.json' }
    ],
  },
  moduleNameMapper: {
    '^@nestjs/passport$': '<rootDir>/test/__mocks__/@nestjs/passport.ts',
    '^passport-jwt$': '<rootDir>/test/__mocks__/passport-jwt.ts',
    '^jwks-rsa$': '<rootDir>/test/__mocks__/jwks-rsa.ts',
  },
  testMatch: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts', '!src/swagger.ts', '!src/auth/**'],
  coverageDirectory: 'coverage',
};

export default config;
