import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChatSession, ChatMessage, ChatAttachment, ChatTypingEvent, ChatSessionStatus } from '../entities';
import { Repository } from 'typeorm';
import { GetChatSessionsQueryDto } from '../dto';
import { UserRole, UserType } from '../../auth/dto';

describe('ChatService', () => {
  let service: ChatService;
  let sessionRepository: Repository<ChatSession>;

  const mockSessionRepository = {
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(ChatSession), useValue: mockSessionRepository },
        { provide: getRepositoryToken(ChatMessage), useValue: {} },
        { provide: getRepositoryToken(ChatAttachment), useValue: {} },
        { provide: getRepositoryToken(ChatTypingEvent), useValue: {} },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    sessionRepository = module.get<Repository<ChatSession>>(getRepositoryToken(ChatSession));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllChatSessions', () => {
    it('should return paginated chat sessions', async () => {
      const sessions = [{ id: '1', status: ChatSessionStatus.ACTIVE, startedAt: new Date() }] as ChatSession[];
      mockSessionRepository.findAndCount.mockResolvedValue([sessions, 1]);

      const query: GetChatSessionsQueryDto = { page: 1, limit: 10 };
      const user = { id: 'test-user', role: UserRole.COMPANY_USER, userType: UserType.EXTERNAL };

      const result = await service.getAllChatSessions(query, user);

      expect(result.totalCount).toEqual(1);
      expect(result.items.length).toEqual(1);
      expect(mockSessionRepository.findAndCount).toHaveBeenCalled();
    });
  });
});
