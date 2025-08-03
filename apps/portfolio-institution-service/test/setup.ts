import { jest } from '@jest/globals';

// Global test configuration
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.DATABASE_URL = 'sqlite::memory:';
});

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

// Global test teardown
afterEach(() => {
  // Restore all mocks after each test
  jest.restoreAllMocks();
});

// Extend Jest matchers for better assertions
expect.extend({
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },
  
  toBeValidDate(received) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid Date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid Date`,
        pass: false,
      };
    }
  },
  
  toHaveValidPagination(received) {
    const hasRequiredFields = received && 
      typeof received.total === 'number' &&
      typeof received.page === 'number' &&
      typeof received.limit === 'number' &&
      typeof received.totalPages === 'number';
    
    const hasValidValues = received.total >= 0 &&
      received.page >= 1 &&
      received.limit >= 1 &&
      received.totalPages >= 1;
    
    const pass = hasRequiredFields && hasValidValues;
    
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to have valid pagination`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to have valid pagination with total, page, limit, totalPages`,
        pass: false,
      };
    }
  },
});

// Global error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in test environment
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment below to silence console.log in tests
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.createMockRepository = (entityClass) => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getManyAndCount: jest.fn(),
  })),
});

global.createMockJwtService = () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({ userId: 'test-user-id', role: 'admin' })),
  decode: jest.fn(() => ({ userId: 'test-user-id', role: 'admin' })),
});

global.createMockConfigService = () => ({
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      'JWT_SECRET': 'test-jwt-secret',
      'DATABASE_URL': 'sqlite::memory:',
      'NODE_ENV': 'test',
    };
    return config[key];
  }),
});

// Mock external dependencies
jest.mock('@nestjs/passport', () => ({
  AuthGuard: jest.fn((strategy?: string) => {
    return class MockAuthGuard {
      canActivate = jest.fn(() => true);
    };
  }),
  PassportStrategy: jest.fn((strategy?: any) => {
    return class MockPassportStrategy {
      constructor(...args: any[]) {}
      validate = jest.fn(() => ({ userId: 'test-user-id', role: 'admin' }));
    };
  }),
  PassportModule: {
    register: jest.fn(() => ({
      module: 'MockPassportModule',
      providers: [],
      exports: [],
    })),
    registerAsync: jest.fn(() => ({
      module: 'MockPassportModule',
      providers: [],
      exports: [],
    })),
  },
}));

jest.mock('passport-jwt', () => ({
  Strategy: jest.fn(),
  ExtractJwt: {
    fromAuthHeaderAsBearerToken: jest.fn(() => 'mock-extract-jwt'),
  },
}));

jest.mock('jwks-rsa', () => ({
  passportJwtSecret: jest.fn(() => 'mock-secret'),
}));

export {};
