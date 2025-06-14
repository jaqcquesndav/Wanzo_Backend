import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MockEventsService } from '../../src/modules/events/mock-events-service';
import { Logger } from '@nestjs/common';

describe('MockEventsService', () => {
  let service: MockEventsService;
  let logSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MockEventsService,
      ],
    }).compile();

    service = module.get<MockEventsService>(MockEventsService);
    
    // Espionner la méthode log du Logger
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log a message when publishing user status changed', async () => {
    const mockEvent = { 
      userId: '123', 
      status: 'ACTIVE',
      timestamp: new Date().toISOString()
    };
    
    await service.publishUserStatusChanged(mockEvent);
    
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Would publish user status changed event'),
      expect.any(String)
    );
  });

  it('should log a message when publishing user role changed', async () => {
    const mockEvent = { 
      userId: '123', 
      role: 'ADMIN',
      timestamp: new Date().toISOString()
    };
    
    await service.publishUserRoleChanged(mockEvent);
    
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Would publish user role changed event'),
      expect.any(String)
    );
  });

  it('should log a message when publishing subscription changed', async () => {
    const mockEvent = { 
      userId: '123', 
      subscriptionId: 'sub-123',
      status: 'ACTIVE',
      timestamp: new Date().toISOString()
    };
    
    await service.publishSubscriptionChanged(mockEvent);
    
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Would publish subscription changed event'),
      expect.any(String)
    );
  });

  it('should log a message when publishing subscription expired', async () => {
    const mockEvent = { 
      userId: '123', 
      subscriptionId: 'sub-123',
      status: 'EXPIRED',
      timestamp: new Date().toISOString()
    };
    
    await service.publishSubscriptionExpired(mockEvent);
    
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Would publish subscription expired event'),
      expect.any(String)
    );
  });

  it('should log a message when publishing token purchase', async () => {
    const mockEvent = { 
      userId: '123', 
      amount: 100,
      tokenType: 'STANDARD',
      timestamp: new Date().toISOString()
    };
    
    await service.publishTokenPurchase(mockEvent);
    
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Would publish token purchase event'),
      expect.any(String)
    );
  });

  it('should log a message when publishing token usage', async () => {
    const mockEvent = { 
      userId: '123', 
      amount: 5,
      tokenType: 'STANDARD',
      purpose: 'API_CALL',
      timestamp: new Date().toISOString()
    };
    
    await service.publishTokenUsage(mockEvent);
    
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Would publish token usage event'),
      expect.any(String)
    );
  });

  it('should log a message when publishing token alert', async () => {
    const mockEvent = { 
      userId: '123', 
      alertType: 'LOW_BALANCE',
      threshold: 10,
      currentBalance: 5,
      timestamp: new Date().toISOString()
    };
    
    await service.publishTokenAlert(mockEvent);
    
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Would publish token alert event'),
      expect.any(String)
    );
  });
});
