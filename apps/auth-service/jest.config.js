const path = require('path'); // Added
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\\.ts$': 'ts-jest', // Only process .ts files with ts-jest
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@wanzo/shared/(.*)$': path.resolve(__dirname, '../../packages/shared/$1'), // Changed
  },
  // preset: '@shelf/jest-mongodb', // commenté car non nécessaire pour PostgreSQL
};
