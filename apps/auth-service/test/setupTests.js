// Setup pour les tests d'authentification
// Ce fichier est exécuté avant chaque test

// Mock des variables d'environnement pour Auth0
process.env.AUTH0_DOMAIN = 'test-domain.auth0.com';
process.env.AUTH0_CLIENT_ID = 'test-client-id';
process.env.AUTH0_CLIENT_SECRET = 'test-client-secret';
process.env.AUTH0_AUDIENCE = 'https://api.test.com';
process.env.AUTH0_CALLBACK_URL = 'http://localhost:3000/callback';

// Mock des modules externes si nécessaire
jest.mock('jwks-rsa', () => ({
  JwksClient: jest.fn().mockImplementation(() => ({
    getSigningKey: jest.fn().mockResolvedValue({
      getPublicKey: jest.fn().mockReturnValue('mock-public-key'),
    }),
  })),
}));

// Réinitialisation des mocks après chaque test
afterEach(() => {
  jest.clearAllMocks();
});
