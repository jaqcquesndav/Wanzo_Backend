import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../../src/modules/users/services/user.service';
import { User, UserRole, UserStatus, UserType } from '../../src/modules/users/entities/user.entity';
import { Customer } from '../../src/modules/customers/entities/customer.entity';
import { CustomerEventsProducer } from '../../src/modules/kafka/producers/customer-events.producer';
import { SyncUserDto } from '../../src/modules/users/dto/sync-user.dto';
import { UpdateUserDto } from '../../src/modules/users/dto/user.dto';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;
  let customerRepository: Repository<Customer>;
  let customerEventsProducer: CustomerEventsProducer;

  const mockUser: Partial<User> = {
    id: 'user-123',
    auth0Id: 'auth0|test123',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.CUSTOMER_USER,
    userType: UserType.CUSTOMER,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCustomer: Partial<Customer> = {
    id: 'customer-123',
    name: 'Test Customer',
    email: 'test@example.com',
  };

  beforeEach(async () => {
    const mockUserRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    const mockCustomerRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const mockCustomerEventsProducer = {
      emitUserCreated: jest.fn(),
      emitUserUpdated: jest.fn(),
      emitUserStatusChanged: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: CustomerEventsProducer,
          useValue: mockCustomerEventsProducer,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    customerRepository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
    customerEventsProducer = module.get<CustomerEventsProducer>(CustomerEventsProducer);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncUser', () => {
    it('should create a new user when user does not exist', async () => {
      const syncUserDto: SyncUserDto = {
        auth0Id: 'auth0|test123',
        email: 'test@example.com',
        name: 'Test User',
      };

      // Mock: user doesn't exist
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      
      // Mock: customer creation
      jest.spyOn(customerRepository, 'create').mockReturnValue(mockCustomer as Customer);
      jest.spyOn(customerRepository, 'save').mockResolvedValue(mockCustomer as Customer);
      
      // Mock: user creation
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser as User);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser as User);

      const result = await service.syncUser(syncUserDto);

      expect(customerRepository.create).toHaveBeenCalled();
      expect(customerRepository.save).toHaveBeenCalled();
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(customerEventsProducer.emitUserCreated).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should return existing user when user already exists', async () => {
      const syncUserDto: SyncUserDto = {
        auth0Id: 'auth0|test123',
        email: 'test@example.com',
        name: 'Test User',
      };

      // Mock: user exists
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);

      const result = await service.syncUser(syncUserDto);

      expect(userRepository.create).not.toHaveBeenCalled();
      expect(customerRepository.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  describe('findByAuth0Id', () => {
    it('should return user when found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);

      const result = await service.findByAuth0Id('auth0|test123');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { auth0Id: 'auth0|test123' },
        relations: ['customer'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findByAuth0Id('auth0|nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
        phone: '+243123456789',
      };

      const updatedUser = { ...mockUser, ...updateUserDto };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(userRepository, 'save').mockResolvedValue(updatedUser as User);

      const result = await service.update('user-123', updateUserDto);

      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        ...updateUserDto,
      });
      expect(customerEventsProducer.emitUserUpdated).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual(updatedUser);
    });

    it('should throw error when user not found', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.update('nonexistent', updateUserDto)).rejects.toThrow(
        'User with ID nonexistent not found'
      );
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);

      const result = await service.findById('user-123');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        relations: ['customer'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('changeUserType', () => {
    it('should change user type to SME', async () => {
      const updatedUser = { ...mockUser, userType: UserType.SME };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(userRepository, 'save').mockResolvedValue(updatedUser as User);

      const result = await service.changeUserType('user-123', 'sme');

      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        userType: UserType.SME,
      });
      expect(result).toEqual({
        id: 'user-123',
        userType: UserType.SME,
        message: 'Type d\'utilisateur mis à jour avec succès'
      });
    });

    it('should change user type to FINANCIAL_INSTITUTION', async () => {
      const updatedUser = { ...mockUser, userType: UserType.FINANCIAL_INSTITUTION };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest.spyOn(userRepository, 'save').mockResolvedValue(updatedUser as User);

      const result = await service.changeUserType('user-123', 'financial_institution');

      expect(userRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        userType: UserType.FINANCIAL_INSTITUTION,
      });
      expect(result).toEqual({
        id: 'user-123',
        userType: UserType.FINANCIAL_INSTITUTION,
        message: 'Type d\'utilisateur mis à jour avec succès'
      });
    });

    it('should throw error for invalid user type', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);

      await expect(service.changeUserType('user-123', 'invalid')).rejects.toThrow(
        'Type d\'utilisateur invalide: invalid'
      );
    });

    it('should throw error when user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.changeUserType('nonexistent', 'sme')).rejects.toThrow(
        'Utilisateur avec l\'ID nonexistent non trouvé'
      );
    });
  });
});
