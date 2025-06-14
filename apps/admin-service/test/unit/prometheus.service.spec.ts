import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrometheusService } from '../../src/monitoring/prometheus.service';

describe('PrometheusService', () => {
  let service: PrometheusService;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(async () => {
    // Mock du ConfigService
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'PROMETHEUS_PORT') return 9999; // Port de test
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
    
    // Mock pour le serveur HTTP
    const mockListen = jest.fn();
    jest.spyOn(require('http'), 'createServer').mockImplementation(() => ({
      listen: mockListen,
    }));
    
    // Initialisation du module
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should measure HTTP requests', () => {
    // Espionner la méthode inc du compteur
    const incSpy = jest.spyOn(service.httpRequestsTotal, 'inc');
    const observeSpy = jest.spyOn(service.httpRequestDuration, 'observe');
    
    // Appeler la méthode
    service.measureHttpRequest('GET', '/api/test', 200, 0.123);
    
    // Vérifier que les méthodes ont été appelées avec les bons paramètres
    expect(incSpy).toHaveBeenCalledWith({ method: 'GET', path: '/api/test', status: 200 });
    expect(observeSpy).toHaveBeenCalledWith({ method: 'GET', path: '/api/test', status: 200 }, 0.123);
  });

  it('should measure database queries', () => {
    // Espionner la méthode observe de l'histogramme
    const observeSpy = jest.spyOn(service.databaseQueryDuration, 'observe');
    
    // Appeler la méthode
    service.measureDatabaseQuery('SELECT', 'users', 0.045);
    
    // Vérifier que la méthode a été appelée avec les bons paramètres
    expect(observeSpy).toHaveBeenCalledWith({ query: 'SELECT', table: 'users' }, 0.045);
  });

  it('should update active users count', () => {
    // Espionner la méthode set de la jauge
    const setSpy = jest.spyOn(service.activeUsers, 'set');
    
    // Appeler la méthode
    service.setActiveUsers(42);
    
    // Vérifier que la méthode a été appelée avec le bon paramètre
    expect(setSpy).toHaveBeenCalledWith(42);
  });
});
