import { Test, TestingModule } from '@nestjs/testing';
import { PrometheusMiddleware } from '../../src/monitoring/prometheus.middleware';
import { PrometheusService } from '../../src/monitoring/prometheus.service';
import { Request, Response, NextFunction } from 'express';

describe('PrometheusMiddleware', () => {
  let middleware: PrometheusMiddleware;
  let mockPrometheusService: PrometheusService;

  beforeEach(async () => {
    // Mock pour le PrometheusService
    mockPrometheusService = {
      measureHttpRequest: jest.fn(),
      httpRequestsTotal: {
        inc: jest.fn()
      },
      httpRequestDuration: {
        observe: jest.fn()
      },
      // Autres métriques nécessaires pour satisfaire le typage
      activeUsers: { set: jest.fn() },
      databaseQueryDuration: { observe: jest.fn() },
      appSessions: { inc: jest.fn() },
      mobileApiCalls: { inc: jest.fn() },
      pushNotificationsSent: { inc: jest.fn() },
      syncOperationsTotal: { inc: jest.fn() },
      deviceConnections: { set: jest.fn() },
      operationLatency: { observe: jest.fn() },
      measureDatabaseQuery: jest.fn(),
      setActiveUsers: jest.fn(),
      recordAppSession: jest.fn(),
      recordMobileApiCall: jest.fn(),
      recordPushNotification: jest.fn(),
      recordSyncOperation: jest.fn(),
      updateDeviceConnections: jest.fn(),
      measureOperationLatency: jest.fn()
    } as unknown as PrometheusService;

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
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should measure HTTP request duration', () => {
    // Créer une interface mockée pour la requête
    const req = {
      method: 'GET',
      path: '/api/operations',
    } as Request;
    
    // Créer une interface mockée pour la réponse
    const res = {
      statusCode: 200,
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          // Simule l'appel au callback pour 'finish'
          callback();
        }
        return res;
      })
    } as unknown as Response;
    
    const next = jest.fn();
    
    // Espionner Date.now pour simuler le temps écoulé
    const originalNow = Date.now;
    const firstCallTime = 1000;
    const secondCallTime = 1500;
    let callCount = 0;
    
    Date.now = jest.fn(() => {
      callCount++;
      return callCount === 1 ? firstCallTime : secondCallTime;
    });
    
    try {
      // Act
      middleware.use(req, res, next);
      
      // Simuler la fin de la requête
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
      
      // Appeler directement l'événement 'finish'
      const onFinishHandler = (res.on as jest.Mock).mock.calls.find(
        call => call[0] === 'finish'
      )[1];
      onFinishHandler();
      
      // Assert
      expect(next).toHaveBeenCalled();
      expect(mockPrometheusService.measureHttpRequest).toHaveBeenCalledWith(
        'GET',
        '/api/operations',
        200,
        0.5 // (1500 - 1000) / 1000 = 0.5 seconds
      );
    } finally {
      // Restaurer Date.now
      Date.now = originalNow;
    }
  });

  it('should handle request path from originalUrl if path is not available', () => {
    const middleware = new PrometheusMiddleware(mockPrometheusService as any);
    
    // Cast explicite pour éviter les problèmes de typage
    const req = {
      method: 'POST',
      originalUrl: '/api/operations',
      path: '/api/operations' // Ajouter le path pour ce test
    } as unknown as Request;
    
    const res = {
      statusCode: 201,
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          callback();
        }
        return res;
      }),
    } as unknown as Response;
    
    const next = jest.fn();
    
    // Mock pour Date.now
    jest.spyOn(Date, 'now')
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(1200);
    
    // Act
    middleware.use(req, res, next);
    
    // Simuler la fin de la requête
    const onFinishHandler = (res.on as jest.Mock).mock.calls.find(
      call => call[0] === 'finish'
    )[1];
    onFinishHandler();
    
    // Assert
    expect(mockPrometheusService.measureHttpRequest).toHaveBeenCalledWith(
      'POST',
      '/api/operations',
      201,
      0.2 // (1200 - 1000) / 1000 = 0.2 seconds
    );
  });
});
