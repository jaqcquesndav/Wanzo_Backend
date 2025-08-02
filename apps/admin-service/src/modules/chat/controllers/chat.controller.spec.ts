import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from './chat.controller';
import { ChatService } from '../services/chat.service';
import { GetChatSessionsQueryDto, ChatSessionsResponseDto } from '../dto';
import { UserRole, UserType } from '../../auth/dto';

describe('ChatController', () => {
  let controller: ChatController;
  let service: ChatService;

  const mockChatService = {
    getAllChatSessions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        { provide: ChatService, useValue: mockChatService },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllChatSessions', () => {
    it('should return an array of chat sessions', async () => {
      const result: ChatSessionsResponseDto = { items: [], totalCount: 0, page: 1, totalPages: 1 };
      mockChatService.getAllChatSessions.mockResolvedValue(result);

      const query: GetChatSessionsQueryDto = { page: 1, limit: 10 };
      const user = { id: 'test-user', role: UserRole.COMPANY_USER, userType: UserType.EXTERNAL };

      expect(await controller.getAllChatSessions(query, user)).toBe(result);
      expect(service.getAllChatSessions).toHaveBeenCalledWith(query, user);
    });
  });
});
