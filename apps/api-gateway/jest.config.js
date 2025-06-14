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
  },
  // Configuration spécifique pour les tests d'API Gateway
  testTimeout: 15000, // Les tests d'API peuvent prendre plus de temps
  // Configuration des mocks pour les services externes
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
