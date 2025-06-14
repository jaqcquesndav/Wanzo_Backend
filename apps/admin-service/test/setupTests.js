// Configuration globale pour les tests
process.env.NODE_ENV = 'test';

// Désactiver les logs pendant les tests
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock pour les services externes
jest.mock('@nestjs/axios', () => {
  return {
    HttpService: jest.fn().mockImplementation(() => ({
      get: jest.fn().mockResolvedValue({ data: {} }),
      post: jest.fn().mockResolvedValue({ data: {} }),
      put: jest.fn().mockResolvedValue({ data: {} }),
      delete: jest.fn().mockResolvedValue({ data: {} }),
    })),
  };
});

// Configuration pour les tests de base de données
global.beforeAll(async () => {
  console.log('Starting test setup...');
  // Connexion à la base de données de test
});

global.afterAll(async () => {
  console.log('Cleaning up after tests...');
  // Nettoyage de la base de données de test
});
