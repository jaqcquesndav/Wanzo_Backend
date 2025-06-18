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
    '^@wanzo/shared/(.*)$': '<rootDir>/../../../packages/shared/$1',
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Utilisez un environnement node standard pour les tests
  // car nous utilisons PostgreSQL via TypeORM, pas MongoDB
  // preset: '@shelf/jest-mongodb',
};
