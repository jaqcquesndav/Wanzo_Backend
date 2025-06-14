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
  // Configuration spécifique pour l'authentification
  testTimeout: 20000, // Les tests d'authentification peuvent prendre plus de temps
  // Mise en place de mocks pour Auth0
  setupFilesAfterEnv: ['<rootDir>/../test/setupTests.js'],
};
