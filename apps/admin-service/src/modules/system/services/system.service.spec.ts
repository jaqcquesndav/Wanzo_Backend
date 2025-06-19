import { Test, TestingModule } from '@nestjs/testing';
import { SystemService } from './system.service';
import {
  GetSystemLogsQueryDto,
  GetSystemAlertsQueryDto,
  GetApiPerformanceQueryDto,
  SetMaintenanceModeDto,
  UpdateAiModelConfigDto
} from '../dtos/system.dto';

describe('SystemService', () => {
  let service: SystemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SystemService],
    }).compile();

    service = module.get<SystemService>(SystemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSystemHealth', () => {
    it('should return system health data', async () => {
      const result = await service.getSystemHealth();
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      expect(result.services).toBeDefined();
      expect(result.services.api).toBeDefined();
      expect(result.services.database).toBeDefined();
      expect(result.memory).toBeDefined();
      expect(result.cpu).toBeDefined();
    });
  });

  describe('getSystemLogs', () => {
    it('should return system logs with pagination', async () => {
      const query: GetSystemLogsQueryDto = {
        level: 'error',
        service: 'api',
        startDate: '2024-06-01',
        endDate: '2024-06-19',
        page: 1,
        limit: 10,
        search: 'connection'
      };
      const result = await service.getSystemLogs(query);
      expect(result).toBeDefined();
      expect(result.logs).toBeInstanceOf(Array);
      expect(result.totalCount).toBeDefined();
      expect(result.page).toBeDefined();
      expect(result.totalPages).toBeDefined();
    });
  });

  describe('getSystemAlerts', () => {
    it('should return system alerts with pagination', async () => {      const query: GetSystemAlertsQueryDto = {
        level: 'warning',
        service: 'system',
        status: 'active',
        page: 1,
        limit: 10
      };
      const result = await service.getSystemAlerts(query);
      expect(result).toBeDefined();
      expect(result.alerts).toBeInstanceOf(Array);
      expect(result.totalCount).toBeDefined();
      expect(result.page).toBeDefined();
      expect(result.totalPages).toBeDefined();
    });
  });

  describe('resolveSystemAlert', () => {
    it('should mark an alert as resolved with resolution notes', async () => {
      const alertId = 'alert_456';
      const resolutionNotes = 'Fixed by restarting the service';
      const result = await service.resolveSystemAlert(alertId, resolutionNotes);
      expect(result).toBeDefined();
      expect(result.id).toEqual(alertId);
      expect(result.isResolved).toBe(true);
      expect(result.resolvedAt).toBeDefined();
      expect(result.resolvedBy).toBeDefined();
      expect(result.resolutionNotes).toEqual(resolutionNotes);
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
      const result = await service.getApiPerformanceMetrics(query);
      expect(result).toBeDefined();
      expect(result.metrics).toBeInstanceOf(Array);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalRequests).toBeDefined();
      expect(result.summary.overallErrorRate).toBeDefined();
    });
  });

  describe('getDatabaseMetrics', () => {
    it('should return database metrics', async () => {
      const result = await service.getDatabaseMetrics();
      expect(result).toBeDefined();
      expect(result.databases).toBeInstanceOf(Array);
      if (result.databases.length > 0) {
        expect(result.databases[0].name).toBeDefined();
        expect(result.databases[0].type).toBeDefined();
        expect(result.databases[0].status).toBeDefined();
      }
    });
  });

  describe('getAiModelConfigs', () => {
    it('should return AI model configurations', async () => {
      const result = await service.getAiModelConfigs();
      expect(result).toBeDefined();
      expect(result.models).toBeInstanceOf(Array);
      if (result.models.length > 0) {
        expect(result.models[0].id).toBeDefined();
        expect(result.models[0].name).toBeDefined();
        expect(result.models[0].type).toBeDefined();
        expect(result.models[0].isActive).toBeDefined();
      }
    });
  });

  describe('updateAiModelConfig', () => {
    it('should update an AI model configuration', async () => {
      const modelId = 'model_text_gpt4';
      const updateDto: UpdateAiModelConfigDto = {
        isActive: true,
        temperature: 0.8,
        maxTokens: 4000
      };
      const result = await service.updateAiModelConfig(modelId, updateDto);
      expect(result).toBeDefined();
      expect(result.id).toEqual(modelId);
      expect(result.temperature).toEqual(updateDto.temperature);
      expect(result.maxTokens).toEqual(updateDto.maxTokens);
      expect(result.isActive).toEqual(updateDto.isActive);
    });
  });

  describe('getSystemStatus', () => {
    it('should return system status information', async () => {
      const result = await service.getSystemStatus();
      expect(result).toBeDefined();
      expect(result.status).toBeDefined();
      expect(result.version).toBeDefined();
      expect(result.uptime).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.services).toBeDefined();
    });
  });

  describe('getMaintenanceStatus', () => {
    it('should return maintenance status', async () => {
      const result = await service.getMaintenanceStatus();
      expect(result).toBeDefined();
      expect(result.inMaintenance).toBeDefined();
      // Ces propriétés peuvent être null
      expect('estimatedEndTime' in result).toBe(true);
      expect('message' in result).toBe(true);
    });
  });

  describe('setMaintenanceMode', () => {
    it('should set maintenance mode', async () => {
      const dto: SetMaintenanceModeDto = {
        enable: true,
        estimatedEndTime: '2024-06-20T08:00:00Z',
        message: 'Scheduled maintenance for system upgrades'
      };
      const result = await service.setMaintenanceMode(dto);
      expect(result).toBeDefined();
      expect(result.inMaintenance).toEqual(dto.enable);
      expect(result.estimatedEndTime).toEqual(dto.estimatedEndTime);
      expect(result.message).toEqual(dto.message);
      expect(result.enabledBy).toBeDefined();
      expect(result.enabledAt).toBeDefined();
    });

    it('should handle minimal parameters', async () => {
      const dto: SetMaintenanceModeDto = {
        enable: false
      };
      const result = await service.setMaintenanceMode(dto);
      expect(result).toBeDefined();
      expect(result.inMaintenance).toBe(false);
      expect(result.estimatedEndTime).toBeNull();
      expect(result.message).toBeNull();
    });
  });
});
