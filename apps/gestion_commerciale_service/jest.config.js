module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: './',
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
    '^@wanzo/shared/(.*)$': '<rootDir>/../../packages/shared/$1',
  },
  // Configuration pour les tests d'API mobile
  testTimeout: 10000,
  // Ignorer les fichiers de configuration spécifiques aux plateformes mobiles
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '\\.ios\\.', '\\.android\\.'],
};
