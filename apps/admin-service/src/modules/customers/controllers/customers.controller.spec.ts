import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from '../services/customers.service';
import { JwtBlacklistGuard } from '@/modules/auth/guards/jwt-blacklist.guard';
import { CustomerQueryParamsDto, CreateCustomerDto, UpdateCustomerDto, CustomerDto, CustomerListResponseDto } from '../dtos';

const mockCustomersService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  validateCustomer: jest.fn(),
  suspendCustomer: jest.fn(),
  reactivateCustomer: jest.fn(),
};

describe('CustomersController', () => {
  let controller: CustomersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CustomersService,
          useValue: mockCustomersService,
        },
      ],
    })
    .overrideGuard(JwtBlacklistGuard).useValue({ canActivate: () => true })
    .compile();

    controller = module.get<CustomersController>(CustomersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call customersService.findAll with query params', async () => {
      const queryParams = new CustomerQueryParamsDto();
      const result: CustomerListResponseDto = { customers: [], totalCount: 0, page: 1, totalPages: 1 };
      mockCustomersService.findAll.mockResolvedValue(result);

      await controller.findAll(queryParams);

      expect(mockCustomersService.findAll).toHaveBeenCalledWith(queryParams);
    });
  });

  describe('findOne', () => {
    it('should call customersService.findOne with customerId', async () => {
      const customerId = 'some-uuid';
      const result = { id: customerId, name: 'Test Customer' };
      mockCustomersService.findOne.mockResolvedValue(result);

      await controller.findOne(customerId);

      expect(mockCustomersService.findOne).toHaveBeenCalledWith(customerId);
    });
  });

  describe('create', () => {
    it('should call customersService.create with createDto', async () => {
      const createDto = new CreateCustomerDto();
      const result: Partial<CustomerDto> = { id: '1', name: 'test' };
      mockCustomersService.create.mockResolvedValue(result);

      await controller.create(createDto);

      expect(mockCustomersService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should call customersService.update with customerId and updateDto', async () => {
      const customerId = 'some-uuid';
      const updateDto = new UpdateCustomerDto();
      const result: Partial<CustomerDto> = { id: customerId, name: 'updated' };
      mockCustomersService.update.mockResolvedValue(result);

      await controller.update(customerId, updateDto);

      expect(mockCustomersService.update).toHaveBeenCalledWith(customerId, updateDto);
    });
  });
});
