import { Test, TestingModule } from '@nestjs/testing';
import { ClientKafka } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { AdhaAIIntegrationService } from './adha-ai-integration.service';
import { ADHA_AI_KAFKA_SERVICE } from './adha-ai-integration.module';

// Mock du client Kafka pour les tests
const mockClientKafka = {
  connect: jest.fn().mockResolvedValue(true),
  emit: jest.fn().mockReturnValue({
    toPromise: jest.fn().mockResolvedValue(true)
  }),
  subscribeToResponseOf: jest.fn(),
};

describe('AdhaAIIntegration Kafka Communication Test', () => {
  let service: AdhaAIIntegrationService;
  let kafkaClient: ClientKafka;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        AdhaAIIntegrationService,
        {
          provide: ADHA_AI_KAFKA_SERVICE,
          useValue: mockClientKafka,
        },
      ],
    }).compile();

    service = module.get<AdhaAIIntegrationService>(AdhaAIIntegrationService);
    kafkaClient = module.get<ClientKafka>(ADHA_AI_KAFKA_SERVICE);
  });

  describe('Kafka communication', () => {
    it('should connect to Kafka broker on initialization', async () => {
      await service.onModuleInit();
      expect(kafkaClient.connect).toHaveBeenCalled();
    });

    it('should send portfolio analysis request', async () => {
      const portfolioId = 'test-portfolio-id';
      const institutionId = 'test-institution-id';
      const userId = 'test-user-id';
      const userRole = 'admin';
      const portfolioType = 'credit';

      await service.requestPortfolioAnalysis(
        portfolioId,
        institutionId,
        userId,
        userRole,
        portfolioType,
      );

      expect(kafkaClient.emit).toHaveBeenCalledWith(
        expect.any(String), // Le topic Kafka
        expect.objectContaining({
          portfolioId,
          institutionId,
          userId,
          userRole,
          contextInfo: expect.objectContaining({
            source: 'portfolio_institution',
            portfolioType,
          }),
        }),
      );
    });

    it('should send chat message', async () => {
      const chatId = 'test-chat-id';
      const userId = 'test-user-id';
      const userRole = 'user';
      const content = 'Test message content';

      await service.sendChatMessage(
        chatId,
        userId,
        userRole,
        content,
      );

      expect(kafkaClient.emit).toHaveBeenCalledWith(
        expect.any(String), // Le topic Kafka
        expect.objectContaining({
          chatId,
          userId,
          userRole,
          content,
          contextInfo: expect.objectContaining({
            source: 'portfolio_institution',
          }),
        }),
      );
    });
  });
});
