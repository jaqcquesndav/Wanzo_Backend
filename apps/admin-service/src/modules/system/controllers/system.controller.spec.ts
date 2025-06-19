import { Test, TestingModule } from '@nestjs/testing';
import { SystemController } from './system.controller';
import { SystemService } from '../services/system.service';
import {
  SystemHealthDto,
  SystemLogsResponseDto,
  SystemAlertsResponseDto,
  SystemAlertDto,
  ApiPerformanceResponseDto,
  DatabaseMetricsResponseDto,
  AiModelsResponseDto,
  AiModelConfigDto,
  MaintenanceStatusResponseDto,
  SetMaintenanceModeResponseDto,
  SystemStatusResponseDto,
  GetSystemLogsQueryDto,
  GetSystemAlertsQueryDto,
  GetApiPerformanceQueryDto,
  SetMaintenanceModeDto,
  ResolveSystemAlertDto,
  UpdateAiModelConfigDto
} from '../dtos/system.dto';

describe('SystemController', () => {
  let controller: SystemController;
  let service: SystemService;

  // Mock data
  const mockSystemHealth: SystemHealthDto = {
    status: 'healthy',
    uptime: 1209600,
    services: {
      api: { status: 'operational', responseTime: 45, errorRate: 0.02 },
      database: { status: 'operational', connections: 12, queryTime: 5 },
      cache: { status: 'operational', hitRate: 89.5, memoryUsage: 512 },
      storage: { status: 'operational', capacity: 1000, used: 350, available: 650 },
      ai: { status: 'operational', responseTime: 250, errorRate: 0.5 },
    },
    memory: {
      total: 16384,
      used: 8192,
      free: 8192,
    },
    cpu: {
      usage: 35,
      cores: 8,
    },
  };

  const mockSystemLog = {
    id: 'log_123',
    timestamp: new Date().toISOString(),
    level: 'error',
    service: 'api',
    message: 'Database connection failed',
    details: { errorCode: 'ECONNREFUSED', database: 'main' },
    correlationId: 'req_abc123',
    ipAddress: '10.0.0.2'
  };

  const mockSystemAlert = {
    id: 'alert_456',
    timestamp: new Date().toISOString(),
    level: 'warning',
    title: 'High CPU Usage',
    message: 'Server CPU usage exceeded 80% for more than 10 minutes',
    service: 'system',
    isResolved: false,
  };

  const mockApiPerformance = {
    metrics: [
      {
        endpoint: '/api/users',
        method: 'GET',
        averageResponseTime: 45,
        p95ResponseTime: 120,
        requestCount: 1250,
        errorCount: 5,
        errorRate: 0.4,
        timestamp: new Date().toISOString(),
      }
    ],
    summary: { 
      totalRequests: 15240, 
      totalErrors: 87, 
      overallErrorRate: 0.57, 
      averageResponseTime: 75 
    }
  };

  const mockDatabaseMetrics = {
    databases: [
      {
        name: 'main-postgres',
        type: 'postgres',
        status: 'operational',
        size: 1240,
        connections: 15,
        queryCount: 58720,
        averageQueryTime: 4.2,
        slowQueries: 12,
      }
    ]
  };

  const mockAiModel = {
    id: 'model_text_gpt4',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    type: 'text',
    isActive: true,
    tokensPerRequest: 4000,
    costPerToken: 0.00001,
    maxTokens: 8000,
    temperature: 0.7,
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    apiVersion: '2023-05-15',
  };

  const mockSystemStatus = {
    status: 'operational',
    version: '1.5.2',
    uptime: 1209600,
    timestamp: new Date().toISOString(),
    services: {
      api: 'operational',
      database: 'operational',
      ai: 'operational',
      payments: 'operational',
    },
  };
  const mockMaintenanceStatus = {
    inMaintenance: false,
    estimatedEndTime: null as string | null,
    message: null as string | null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemController],
      providers: [
        {
          provide: SystemService,
          useValue: {
            getSystemHealth: jest.fn().mockResolvedValue(mockSystemHealth),
            getSystemLogs: jest.fn().mockResolvedValue({
              logs: [mockSystemLog],
              totalCount: 1,
              page: 1,
              totalPages: 1
            }),
            getSystemAlerts: jest.fn().mockResolvedValue({
              alerts: [mockSystemAlert],
              totalCount: 1,
              page: 1,
              totalPages: 1
            }),
            resolveSystemAlert: jest.fn().mockImplementation((alertId, notes) => Promise.resolve({
              ...mockSystemAlert,
              id: alertId,
              isResolved: true,
              resolvedAt: new Date().toISOString(),
              resolvedBy: 'admin_123',
              resolutionNotes: notes,
            })),
            getApiPerformanceMetrics: jest.fn().mockResolvedValue(mockApiPerformance),
            getDatabaseMetrics: jest.fn().mockResolvedValue(mockDatabaseMetrics),
            getAiModelConfigs: jest.fn().mockResolvedValue({ models: [mockAiModel] }),
            updateAiModelConfig: jest.fn().mockImplementation((modelId, data) => Promise.resolve({
              ...mockAiModel,
              id: modelId,
              ...data
            })),
            getSystemStatus: jest.fn().mockResolvedValue(mockSystemStatus),
            getMaintenanceStatus: jest.fn().mockResolvedValue(mockMaintenanceStatus),
            setMaintenanceMode: jest.fn().mockImplementation((data) => Promise.resolve({
              inMaintenance: data.enable,
              estimatedEndTime: data.estimatedEndTime,
              message: data.message,
              enabledBy: 'admin_123',
              enabledAt: new Date().toISOString(),
            })),
          },
        },
      ],
    }).compile();

    controller = module.get<SystemController>(SystemController);
    service = module.get<SystemService>(SystemService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSystemHealth', () => {
    it('should return system health status', async () => {
      const result = await controller.getSystemHealth();
      expect(result).toEqual(mockSystemHealth);
      expect(service.getSystemHealth).toHaveBeenCalled();
    });
  });

  describe('getSystemLogs', () => {
    it('should return system logs', async () => {
      const query: GetSystemLogsQueryDto = {
        level: 'error',
        service: 'api',
        startDate: '2024-06-01',
        endDate: '2024-06-19',
        page: 1,
        limit: 10,
        search: 'connection'
      };
      const result = await controller.getSystemLogs(query);
      expect(result.logs).toHaveLength(1);
      expect(result.logs[0]).toEqual(mockSystemLog);
      expect(service.getSystemLogs).toHaveBeenCalledWith(query);
    });
  });

  describe('getSystemAlerts', () => {
    it('should return system alerts', async () => {      const query: GetSystemAlertsQueryDto = {
        level: 'warning',
        service: 'system',
        status: 'active',
        page: 1,
        limit: 10
      };
      const result = await controller.getSystemAlerts(query);
      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0]).toEqual(mockSystemAlert);
      expect(service.getSystemAlerts).toHaveBeenCalledWith(query);
    });
  });

  describe('resolveSystemAlert', () => {
    it('should resolve a system alert', async () => {
      const alertId = 'alert_456';
      const dto: ResolveSystemAlertDto = { resolutionNotes: 'Fixed by restarting the service' };
      const result = await controller.resolveSystemAlert(alertId, dto);
      expect(result.id).toEqual(alertId);
      expect(result.isResolved).toBe(true);
      expect(result.resolutionNotes).toEqual(dto.resolutionNotes);
      expect(service.resolveSystemAlert).toHaveBeenCalledWith(alertId, dto.resolutionNotes);
    });
  });

  describe('getApiPerformanceMetrics', () => {
    it('should return API performance metrics', async () => {
      const query: GetApiPerformanceQueryDto = {
        startDate: '2024-06-01',
        endDate: '2024-06-19',
        method: 'GET',
        endpoint: '/api/users'
      };
      const result = await controller.getApiPerformanceMetrics(query);
      expect(result).toEqual(mockApiPerformance);
      expect(service.getApiPerformanceMetrics).toHaveBeenCalledWith(query);
    });
  });

  describe('getDatabaseMetrics', () => {
    it('should return database metrics', async () => {
      const result = await controller.getDatabaseMetrics();
      expect(result).toEqual(mockDatabaseMetrics);
      expect(service.getDatabaseMetrics).toHaveBeenCalled();
    });
  });

  describe('getAiModelConfigs', () => {
    it('should return AI model configurations', async () => {
      const result = await controller.getAiModelConfigs();
      expect(result.models).toHaveLength(1);
      expect(result.models[0]).toEqual(mockAiModel);
      expect(service.getAiModelConfigs).toHaveBeenCalled();
    });
  });

  describe('updateAiModelConfig', () => {
    it('should update an AI model configuration', async () => {
      const modelId = 'model_text_gpt4';
      const dto: UpdateAiModelConfigDto = {
        isActive: true,
        temperature: 0.8,
        maxTokens: 4000
      };
      const result = await controller.updateAiModelConfig(modelId, dto);
      expect(result.id).toEqual(modelId);
      expect(result.temperature).toEqual(dto.temperature);
      expect(result.maxTokens).toEqual(dto.maxTokens);
      expect(service.updateAiModelConfig).toHaveBeenCalledWith(modelId, dto);
    });
  });

  describe('getSystemStatus', () => {
    it('should return system status', async () => {
      const result = await controller.getSystemStatus();
      expect(result).toEqual(mockSystemStatus);
      expect(service.getSystemStatus).toHaveBeenCalled();
    });
  });

  describe('getMaintenanceStatus', () => {
    it('should return maintenance status', async () => {
      const result = await controller.getMaintenanceStatus();
      expect(result).toEqual(mockMaintenanceStatus);
      expect(service.getMaintenanceStatus).toHaveBeenCalled();
    });
  });

  describe('setMaintenanceMode', () => {
    it('should set maintenance mode', async () => {
      const dto: SetMaintenanceModeDto = {
        enable: true,
        estimatedEndTime: '2024-06-20T08:00:00Z',
        message: 'Scheduled maintenance for system upgrades'
      };
      const result = await controller.setMaintenanceMode(dto);
      expect(result.inMaintenance).toEqual(dto.enable);
      expect(result.estimatedEndTime).toEqual(dto.estimatedEndTime);
      expect(result.message).toEqual(dto.message);
      expect(service.setMaintenanceMode).toHaveBeenCalledWith(dto);
    });
  });
});
