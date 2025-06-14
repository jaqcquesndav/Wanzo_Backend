import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { DatabaseMetricsInterceptor } from '../../src/modules/test/interceptors/database-metrics.interceptor';
import { PrometheusService } from '../../src/monitoring/prometheus.service';

describe('DatabaseMetricsInterceptor', () => {
  let interceptor: DatabaseMetricsInterceptor;
  let prometheusService: PrometheusService;

  beforeEach(async () => {
    // Mock du PrometheusService
    const mockPrometheusService = {
      measureDatabaseQuery: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseMetricsInterceptor,
        {
          provide: PrometheusService,
          useValue: mockPrometheusService,
        },
      ],
    }).compile();

    interceptor = module.get<DatabaseMetricsInterceptor>(DatabaseMetricsInterceptor);
    prometheusService = module.get<PrometheusService>(PrometheusService);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should measure database query duration', (done) => {
    // Création d'un mock pour ExecutionContext
    const mockExecutionContext: ExecutionContext = {
      getClass: jest.fn().mockReturnValue({ name: 'UserService' }),
      getHandler: jest.fn().mockReturnValue({ name: 'findById' }),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToHttp: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    };

    // Création d'un mock pour CallHandler
    const mockCallHandler = {
      handle: jest.fn().mockImplementation(() => of('test result')),
    };

    // Espionner Date.now pour simuler le passage du temps
    const originalDateNow = Date.now;
    const mockStartTime = 1000000;
    const mockEndTime = mockStartTime + 1500; // 1.5 secondes plus tard

    try {
      // Premier appel pour startTime
      Date.now = jest.fn().mockReturnValueOnce(mockStartTime);
      
      // Interception de l'appel
      const result$: Observable<any> = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      
      // Deuxième appel pour endTime (lors de l'exécution du tap)
      Date.now = jest.fn().mockReturnValueOnce(mockEndTime);
      
      // Souscription au résultat
      result$.subscribe({
        next: (value) => {
          expect(value).toBe('test result');
          
          // Vérification que la méthode de mesure a été appelée correctement
          expect(prometheusService.measureDatabaseQuery).toHaveBeenCalledWith(
            'UserService.findById',
            'user',
            1.5 // Durée en secondes
          );
          done();
        },
        error: (error) => done(error),
      });
    } finally {
      // Restauration de la fonction Date.now
      Date.now = originalDateNow;
    }
  });
});
