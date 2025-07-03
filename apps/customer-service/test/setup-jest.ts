import { jest } from '@jest/globals';
import type { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

// Configuration globale pour les tests
beforeAll(() => {
  // Mock global pour TypeORM pour éviter les connexions réelles à la base de données
  jest.mock('typeorm', () => {
    return {
      getRepository: jest.fn(),
      createConnection: jest.fn(),
      getConnection: jest.fn(),
      getManager: jest.fn(),
      PrimaryGeneratedColumn: jest.fn(),
      Column: jest.fn(),
      CreateDateColumn: jest.fn(),
      UpdateDateColumn: jest.fn(),
      Entity: jest.fn(),
      ManyToOne: jest.fn(),
      JoinColumn: jest.fn(),
      OneToOne: jest.fn(),
      OneToMany: jest.fn(),
    };
  });

  // Mock pour Kafka pour éviter les connexions réelles
  jest.mock('@nestjs/microservices', () => {
    return {
      ClientKafka: jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockImplementation(() => Promise.resolve()),
        emit: jest.fn(),
        send: jest.fn(),
        close: jest.fn().mockImplementation(() => Promise.resolve()),
      })),
    };
  });

  // Mock pour Cloudinary pour éviter les uploads réels
  jest.mock('cloudinary', () => ({
    v2: {
      config: jest.fn(),
      uploader: {
        upload_stream: jest.fn(
          (
            _options: any,
            callback?: (error?: UploadApiErrorResponse, result?: UploadApiResponse) => void,
          ) => {
            if (callback) {
              callback(undefined, {
                secure_url: 'http://mock-url.com/image.jpg',
                public_id: 'mock_public_id',
              } as UploadApiResponse);
            }
            return {
              end: jest.fn(),
            };
          },
        ),
      },
    },
  }));
});

// Nettoyer les mocks après chaque test
afterEach(() => {
  jest.clearAllMocks();
});
