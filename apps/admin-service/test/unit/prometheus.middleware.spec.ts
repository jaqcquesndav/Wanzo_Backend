import { Test, TestingModule } from '@nestjs/testing';
import { PrometheusMiddleware } from '../../src/monitoring/prometheus.middleware';
import { PrometheusService } from '../../src/monitoring/prometheus.service';
import { Request, Response } from 'express';

describe('PrometheusMiddleware', () => {
  let middleware: PrometheusMiddleware;
  let prometheusService: PrometheusService;

  beforeEach(async () => {
    // Mock du PrometheusService
    const mockPrometheusService = {
      measureHttpRequest: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrometheusMiddleware,
        {
          provide: PrometheusService,
          useValue: mockPrometheusService,
        },
      ],
    }).compile();

    middleware = module.get<PrometheusMiddleware>(PrometheusMiddleware);
    prometheusService = module.get<PrometheusService>(PrometheusService);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should measure HTTP request duration', () => {
    // Espionner Date.now pour simuler le passage du temps
    const originalDateNow = Date.now;
    const mockStartTime = 1000000;
    const mockEndTime = mockStartTime + 500; // 0.5 secondes plus tard

    try {
      // Premier appel pour startTime
      Date.now = jest.fn().mockReturnValueOnce(mockStartTime);

      // Création de mocks pour Request et Response
      const mockRequest = {
        path: '/api/users',
        method: 'GET',
      } as Request;

      const mockResponse = {
        statusCode: 200,
        on: jest.fn(),
      } as unknown as Response;

      // Mock de la méthode on pour simuler l'événement 'finish'
      mockResponse.on = jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          // Deuxième appel pour endTime (lors de l'événement 'finish')
          Date.now = jest.fn().mockReturnValueOnce(mockEndTime);
          callback();
        }
        return mockResponse;
      });

      const mockNext = jest.fn();

      // Appel du middleware
      middleware.use(mockRequest, mockResponse, mockNext);

      // Vérification que next a été appelé
      expect(mockNext).toHaveBeenCalled();

      // Vérification que l'événement 'finish' a été écouté
      expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));

      // Vérification que la méthode de mesure a été appelée correctement
      expect(prometheusService.measureHttpRequest).toHaveBeenCalledWith(
        'GET',
        '/api/users',
        200,
        0.5 // Durée en secondes
      );
    } finally {
      // Restauration de la fonction Date.now
      Date.now = originalDateNow;
    }
  });
});
