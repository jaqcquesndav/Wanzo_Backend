import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrometheusService } from '../../src/monitoring/prometheus.service';

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

describe('PrometheusService', () => {
  let service: PrometheusService;
  let mockConfigService: Partial<ConfigService>;
  let mockHttpServer;

  beforeEach(async () => {
    mockHttpServer = {
      listen: jest.fn(),
    };

    // Mock pour http.createServer
    jest.spyOn(require('http'), 'createServer').mockImplementation((handler) => {
      // Stocker le handler pour le tester
      mockHttpServer.handler = handler;
      return mockHttpServer;
    });
    
    // Réinitialiser le registre Prometheus entre les tests
    require('prom-client').register.clear();

    // Mock pour le ConfigService
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'PROMETHEUS_PORT') return 9466;
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrometheusService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PrometheusService>(PrometheusService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize Prometheus server on module init', () => {
    // Act
    service.onModuleInit();

    // Assert
    expect(require('http').createServer).toHaveBeenCalled();
    expect(mockHttpServer.listen).toHaveBeenCalledWith(9466, expect.any(Function));
  });

  it('should measure HTTP requests correctly', () => {
    // Arrange
    const incSpy = jest.spyOn(service.httpRequestsTotal, 'inc');
    const observeSpy = jest.spyOn(service.httpRequestDuration, 'observe');
    const method = 'GET';
    const path = '/api/operations';
    const status = 200;
    const duration = 0.152;

    // Act
    service.measureHttpRequest(method, path, status, duration);

    // Assert
    expect(incSpy).toHaveBeenCalledWith({ method, path, status });
    expect(observeSpy).toHaveBeenCalledWith({ method, path, status }, duration);
  });

  it('should measure database queries correctly', () => {
    // Arrange
    const observeSpy = jest.spyOn(service.databaseQueryDuration, 'observe');
    const query = 'SELECT';
    const table = 'business_operations';
    const duration = 0.075;

    // Act
    service.measureDatabaseQuery(query, table, duration);

    // Assert
    expect(observeSpy).toHaveBeenCalledWith({ query, table }, duration);
  });

  it('should set active users count', () => {
    // Arrange
    const setSpy = jest.spyOn(service.activeUsers, 'set');
    const count = 42;

    // Act
    service.setActiveUsers(count);

    // Assert
    expect(setSpy).toHaveBeenCalledWith(count);
  });

  it('should record mobile API calls', () => {
    // Arrange
    const incSpy = jest.spyOn(service.mobileApiCalls, 'inc');
    const apiName = 'getOperations';
    const appVersion = '1.2.0';
    const osType = 'android';

    // Act
    service.recordMobileApiCall(apiName, appVersion, osType);

    // Assert
    expect(incSpy).toHaveBeenCalledWith({ 
      api_name: apiName, 
      app_version: appVersion, 
      os_type: osType 
    });
  });

  it('should record push notifications', () => {
    // Arrange
    const incSpy = jest.spyOn(service.pushNotificationsSent, 'inc');
    const notificationType = 'transaction';
    const priority = 'high';
    const result = 'delivered';

    // Act
    service.recordPushNotification(notificationType, priority, result);

    // Assert
    expect(incSpy).toHaveBeenCalledWith({ 
      notification_type: notificationType, 
      priority, 
      result 
    });
  });

  it('should record sync operations', () => {
    // Arrange
    const incSpy = jest.spyOn(service.syncOperationsTotal, 'inc');
    const syncType = 'full';
    const status = 'success';
    const dataType = 'operations';

    // Act
    service.recordSyncOperation(syncType, status, dataType);

    // Assert
    expect(incSpy).toHaveBeenCalledWith({ 
      sync_type: syncType, 
      status, 
      data_type: dataType 
    });
  });

  it('should update device connections count', () => {
    // Arrange
    const setSpy = jest.spyOn(service.deviceConnections, 'set');
    const osType = 'ios';
    const appVersion = '2.0.1';
    const count = 15;

    // Act
    service.deviceConnections.set({ os_type: osType, app_version: appVersion }, count);

    // Assert
    expect(setSpy).toHaveBeenCalledWith({ 
      os_type: osType, 
      app_version: appVersion 
    }, count);
  });
});
