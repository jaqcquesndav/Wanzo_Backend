import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractService, CreateContractFromRequestParams } from './contract.service';
import { Contract, ContractStatus, AmortizationType } from '../entities/contract.entity';
import { FundingRequest } from '../entities/funding-request.entity';
import { PaymentSchedule } from '../entities/payment-schedule.entity';
import { PaymentScheduleService } from './payment-schedule.service';
import { EventsService } from '../../events/events.service';
import { EventsServiceMock } from '../../events/mocks/events.service.mock';

describe('ContractService', () => {
  let service: ContractService;
  let contractRepository: Repository<Contract>;
  let fundingRequestRepository: Repository<FundingRequest>;
  let eventsService: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractService,
        {
          provide: getRepositoryToken(Contract),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              innerJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
            }),
          },
        },
        {
          provide: getRepositoryToken(FundingRequest),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PaymentSchedule),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: PaymentScheduleService,
          useValue: {
            generateSchedule: jest.fn(),
          },
        },
        {
          provide: EventsService,
          useClass: EventsServiceMock,
        },
      ],
    }).compile();

    service = module.get<ContractService>(ContractService);
    contractRepository = module.get<Repository<Contract>>(getRepositoryToken(Contract));
    fundingRequestRepository = module.get<Repository<FundingRequest>>(getRepositoryToken(FundingRequest));
    eventsService = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFromFundingRequest', () => {
    it('should create a contract from funding request', async () => {
      // Arrange
      const fundingRequestId = 'fr-123';
      const userId = 'user-123';
      
      const contractParams = {
        fundingRequestId,
        startDate: new Date(),
        interestRate: 5,
        frequency: 'monthly' as const,
        amortizationType: 'constant' as AmortizationType,
      };
      
      const mockFundingRequest = {
        id: fundingRequestId,
        client_id: 'client-123',
        portfolio_id: 'portfolio-123',
        amount: 10000,
        product: {
          id: 'product-123',
          interest_rate: 5,
          term: 12,
          term_unit: 'months',
        },
      };
      
      const mockContract = {
        id: 'contract-123',
        contract_number: 'C-123456',
        funding_request_id: fundingRequestId,
        client_id: 'client-123',
        portfolio_id: 'portfolio-123',
        principal_amount: 10000,
        interest_rate: 5,
        term: 12,
        term_unit: 'months',
        status: 'pending',
      };
      
      jest.spyOn(fundingRequestRepository, 'findOne').mockResolvedValue(mockFundingRequest as any);
      jest.spyOn(contractRepository, 'create').mockReturnValue(mockContract as any);
      jest.spyOn(contractRepository, 'save').mockResolvedValue(mockContract as any);
      jest.spyOn(eventsService, 'publishContractCreated').mockResolvedValue();
      
      // Act
      const result = await service.createFromFundingRequest(contractParams, userId);
      
      // Assert
      expect(fundingRequestRepository.findOne).toHaveBeenCalledWith({
        where: { id: fundingRequestId },
        relations: ['product'],
      });
      expect(contractRepository.create).toHaveBeenCalled();
      expect(contractRepository.save).toHaveBeenCalled();
      expect(eventsService.publishContractCreated).toHaveBeenCalled();
      expect(result).toEqual(mockContract);
    });
  });
});
