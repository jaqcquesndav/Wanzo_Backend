// Configuration globale pour les tests
process.env.NODE_ENV = 'test';

// Mock pour éviter les erreurs de connexion Kafka pendant les tests
jest.mock('@nestjs/microservices', () => {
  return {
    ClientKafka: jest.fn().mockImplementation(() => ({
      emit: jest.fn().mockResolvedValue({}),
      send: jest.fn().mockResolvedValue({}),
      connect: jest.fn().mockResolvedValue({}),
      close: jest.fn().mockResolvedValue({}),
    })),
    Transport: {
      KAFKA: 'KAFKA',
    },
  };
});

// Mock pour les services externes qui pourraient causer des problèmes
jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    getConnection: jest.fn(),
    createConnection: jest.fn(),
  };
});
