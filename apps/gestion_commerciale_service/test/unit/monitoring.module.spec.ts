import { Test, TestingModule } from '@nestjs/testing';
import { MonitoringModule } from '../../src/monitoring/monitoring.module';
import { PrometheusService } from '../../src/monitoring/prometheus.service';
import { ConfigService } from '@nestjs/config';

// Mock du module prom-client
jest.mock('prom-client', () => {
  return {
    collectDefaultMetrics: jest.fn(),
    register: {
      contentType: 'text/plain',
      metrics: jest.fn().mockResolvedValue('metrics_data'),
      clear: jest.fn()
    },
    Counter: jest.fn().mockImplementation(() => ({
      inc: jest.fn(),
    })),
    Histogram: jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
    })),
    Gauge: jest.fn().mockImplementation(() => ({
      set: jest.fn(),
    })),
  };
});

// Mock du module HTTP pour éviter de créer un vrai serveur pendant le test
jest.mock('http', () => ({
  createServer: jest.fn().mockReturnValue({
    listen: jest.fn(),
  }),
}));

describe('MonitoringModule', () => {
  let module: TestingModule;
  let prometheusService: PrometheusService;

  beforeEach(async () => {
    // Créer un module de test avec les dépendances nécessaires
    module = await Test.createTestingModule({
      imports: [MonitoringModule],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'PROMETHEUS_PORT') return 9466;
              if (key === 'service.name') return 'gestion-commerciale-service';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    // Récupérer le service Prometheus pour les tests
    prometheusService = module.get<PrometheusService>(PrometheusService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide PrometheusService', () => {
    expect(prometheusService).toBeDefined();
    expect(prometheusService).toBeInstanceOf(PrometheusService);
  });

  it('should initialize metrics in PrometheusService', () => {
    // Vérifier que les métriques sont initialisées
    expect(prometheusService.httpRequestsTotal).toBeDefined();
    expect(prometheusService.httpRequestDuration).toBeDefined();
    expect(prometheusService.activeUsers).toBeDefined();
    expect(prometheusService.databaseQueryDuration).toBeDefined();
    
    // Vérifier les métriques spécifiques au mobile
    expect(prometheusService.appSessions).toBeDefined();
    expect(prometheusService.mobileApiCalls).toBeDefined();
    expect(prometheusService.pushNotificationsSent).toBeDefined();
    expect(prometheusService.syncOperationsTotal).toBeDefined();
    expect(prometheusService.deviceConnections).toBeDefined();
    expect(prometheusService.operationLatency).toBeDefined();
  });
});
