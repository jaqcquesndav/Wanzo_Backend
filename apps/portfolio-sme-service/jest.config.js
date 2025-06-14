const path = require('path'); // Added

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@wanzo/shared/(.*)$': path.resolve(__dirname, '../../packages/shared/$1'), // Changed
  },
  // Configuration pour les tests avec base de données
  // preset: '@shelf/jest-mongodb',
  // Ignorer certains fichiers lors des tests
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
