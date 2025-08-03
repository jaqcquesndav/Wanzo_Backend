import { jest } from '@jest/globals';

// Integration test setup - NO global mocks to avoid breaking NestJS module system
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-integration';
  process.env.DATABASE_URL = 'sqlite::memory:';
  
  // Increase timeout for integration tests
  jest.setTimeout(60000);
});

// Clear mocks between tests but don't add global mocks
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// Global error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in test environment
});

// Only minimal console mocking for integration tests
global.console = {
  ...console,
  debug: jest.fn(),
  // Keep info, warn, error for debugging integration tests
};

export {};
