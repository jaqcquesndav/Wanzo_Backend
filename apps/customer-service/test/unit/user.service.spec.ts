import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { UserService } from '../../src/modules/users/services/user.service';
import { User, UserRole, UserStatus, UserType } from '../../src/modules/users/entities/user.entity';
import { UserActivity } from '../../src/modules/users/entities/user-activity.entity';
import { Customer } from '../../src/modules/customers/entities/customer.entity';
import { Sme } from '../../src/modules/customers/entities/sme.entity';
import { SmeSpecificData } from '../../src/modules/customers/entities/sme-specific-data.entity';
import { CustomerEventsProducer } from '../../src/modules/kafka/producers/customer-events.producer';
import { CloudinaryService } from '../../src/modules/cloudinary/cloudinary.service';
import { SyncUserDto } from '../../src/modules/users/dto/sync-user.dto';
import { UpdateUserDto } from '../../src/modules/users/dto/user.dto';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;
  let customerRepository: Repository<Customer>;
  let customerEventsProducer: CustomerEventsProducer;
  let connection: Connection;

  const mockUser: any = {
    id: 'user-123',
    auth0Id: 'auth0|test123',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.CUSTOMER_USER,
    userType: UserType.CUSTOMER,
    status: UserStatus.ACTIVE,
    createdAt: new Date('2025-08-04T13:25:29.743Z'),
    updatedAt: new Date('2025-08-04T13:25:29.801Z'),
    birthdate: undefined,
    phone: undefined,
    picture: undefined,
    lastLogin: new Date('2025-08-04T13:25:29.801Z'),
    customerId: 'customer-123',
    companyId: 'customer-123',
    isCompanyOwner: true,
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
    emitSmeCreated: jest.fn(),
  };    const mockUserActivityRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const mockSmeRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const mockSmeDataRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const mockConnection = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          save: jest.fn(),
          create: jest.fn(),
        },
      }),
    };

    const mockCloudinaryService = {
      uploadImage: jest.fn(),
      deleteImage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserActivity),
          useValue: mockUserActivityRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getRepositoryToken(Sme),
          useValue: mockSmeRepository,
        },
        {
          provide: getRepositoryToken(SmeSpecificData),
          useValue: mockSmeDataRepository,
        },
        {
          provide: CustomerEventsProducer,
          useValue: mockCustomerEventsProducer,
        },
        {
          provide: Connection,
          useValue: mockConnection,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    customerRepository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
    customerEventsProducer = module.get<CustomerEventsProducer>(CustomerEventsProducer);
    connection = module.get<Connection>(Connection);
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
      
      const mockSavedUser = { ...mockUser };
      const mockSavedCustomer = { ...mockCustomer };
      const mockSmeData = { id: 'sme-data-123' };

      const queryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          create: jest.fn()
            .mockReturnValueOnce(mockSavedUser) // User
            .mockReturnValueOnce(mockSavedCustomer) // Customer 
            .mockReturnValueOnce(mockSmeData) // SmeSpecificData
            .mockReturnValueOnce({ id: 'sme-123' }), // Sme
          save: jest.fn()
            .mockResolvedValueOnce(mockSavedCustomer) // Customer (first save)
            .mockResolvedValueOnce(mockSmeData) // SmeSpecificData
            .mockResolvedValueOnce({ ...mockSavedCustomer, smeData: mockSmeData }) // Customer with smeData
            .mockResolvedValueOnce({ id: 'sme-123' }) // Sme
            .mockResolvedValueOnce(mockSavedUser) // User (savedUser) - this is what goes to emitUserCreated
        }
      };

      (connection.createQueryRunner as jest.Mock).mockReturnValue(queryRunner);

      const result = await service.syncUser(syncUserDto);
      
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(customerEventsProducer.emitUserCreated).toHaveBeenCalledWith(mockSavedUser);
      expect(result).toEqual({
        address: undefined,
        bio: undefined,
        birthdate: undefined,
        companyId: mockSavedUser.companyId,
        createdAt: mockSavedUser.createdAt,
        email: mockSavedUser.email,
        emailVerified: false,
        familyName: undefined,
        financialInstitutionId: undefined,
        givenName: undefined,
        id: mockSavedUser.id,
        idNumber: undefined,
        idStatus: undefined,
        idType: undefined,
        isCompanyOwner: mockSavedUser.isCompanyOwner,
        language: undefined,
        name: mockSavedUser.name,
        permissions: undefined,
        phone: undefined,
        phoneVerified: false,
        picture: mockSavedUser.picture,
        plan: undefined,
        role: mockSavedUser.role,
        settings: undefined,
        tokenBalance: undefined,
        tokenTotal: undefined,
        updatedAt: mockSavedUser.updatedAt,
        userType: mockSavedUser.userType,
      });
    });

    it('should return existing user when user already exists', async () => {
      const syncUserDto: SyncUserDto = {
        auth0Id: 'auth0|test123',
        email: 'test@example.com',
        name: 'Test User',
      };

      // Mock: user exists - créons un objet User complet avec toutes les propriétés définies
      const existingUser = {
        id: 'user-123',
        auth0Id: 'auth0|test123', 
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.CUSTOMER_USER,
        userType: UserType.CUSTOMER,
        status: UserStatus.ACTIVE,
        createdAt: new Date('2025-08-04T13:25:29.743Z'),
        updatedAt: new Date('2025-08-04T13:25:29.801Z'),
        lastLogin: new Date('2025-08-04T13:25:29.801Z'),
        customerId: 'customer-123',
        companyId: 'customer-123',
        isCompanyOwner: true,
        phone: undefined,
        picture: undefined,
        birthdate: undefined,
        givenName: undefined,
        familyName: undefined,
        emailVerified: false,
        phoneVerified: false,
        address: undefined,
        settings: undefined,
        language: undefined,
        plan: undefined,
        permissions: undefined,
        tokenBalance: undefined,
        tokenTotal: undefined,
        financialInstitutionId: undefined,
        idType: undefined,
        idNumber: undefined,
        idStatus: undefined,
        bio: undefined,
        customer: undefined,
      };
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(existingUser as any);
      jest.spyOn(userRepository, 'save').mockResolvedValue(existingUser as any);

      const result = await service.syncUser(syncUserDto);

      expect(userRepository.create).not.toHaveBeenCalled();
      expect(customerRepository.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        address: undefined,
        bio: undefined,
        birthdate: undefined,
        companyId: existingUser.companyId,
        createdAt: existingUser.createdAt,
        email: existingUser.email,
        emailVerified: false,
        familyName: undefined,
        financialInstitutionId: undefined,
        givenName: undefined,
        id: existingUser.id,
        idNumber: undefined,
        idStatus: undefined,
        idType: undefined,
        isCompanyOwner: existingUser.isCompanyOwner,
        language: undefined,
        name: existingUser.name,
        permissions: undefined,
        phone: undefined,
        phoneVerified: false,
        picture: existingUser.picture,
        plan: undefined,
        role: existingUser.role,
        settings: undefined,
        tokenBalance: undefined,
        tokenTotal: undefined,
        updatedAt: existingUser.updatedAt,
        userType: existingUser.userType,
      });
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
      expect(result).toEqual({
        address: undefined,
        bio: undefined,
        birthdate: undefined,
        companyId: mockUser.companyId,
        createdAt: mockUser.createdAt,
        email: mockUser.email,
        emailVerified: false,
        familyName: undefined,
        financialInstitutionId: undefined,
        givenName: undefined,
        id: mockUser.id,
        idNumber: undefined,
        idStatus: undefined,
        idType: undefined,
        isCompanyOwner: mockUser.isCompanyOwner,
        language: undefined,
        name: mockUser.name,
        permissions: undefined,
        phone: undefined,
        phoneVerified: false,
        picture: mockUser.picture,
        plan: undefined,
        role: mockUser.role,
        settings: undefined,
        tokenBalance: undefined,
        tokenTotal: undefined,
        updatedAt: mockUser.updatedAt,
        userType: mockUser.userType,
      });
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
      expect(result).toEqual({
        address: undefined,
        bio: undefined,
        birthdate: undefined,
        companyId: mockUser.companyId,
        createdAt: mockUser.createdAt,
        email: mockUser.email,
        emailVerified: false,
        familyName: undefined,
        financialInstitutionId: undefined,
        givenName: undefined,
        id: mockUser.id,
        idNumber: undefined,
        idStatus: undefined,
        idType: undefined,
        isCompanyOwner: mockUser.isCompanyOwner,
        language: undefined,
        name: 'Updated Name',
        permissions: undefined,
        phone: '+243123456789',
        phoneVerified: false,
        picture: mockUser.picture,
        plan: undefined,
        role: mockUser.role,
        settings: undefined,
        tokenBalance: undefined,
        tokenTotal: undefined,
        updatedAt: expect.any(Date),
        userType: mockUser.userType,
      });
    });

    it('should throw error when user not found', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.update('nonexistent', updateUserDto)).rejects.toThrow(
        'Utilisateur non trouvé'
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

    it('should throw error when user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        'Utilisateur non trouvé'
      );
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
        address: undefined,
        bio: undefined,
        birthdate: undefined,
        companyId: mockUser.companyId,
        createdAt: mockUser.createdAt,
        email: mockUser.email,
        emailVerified: false,
        familyName: undefined,
        financialInstitutionId: undefined,
        givenName: undefined,
        id: mockUser.id,
        idNumber: undefined,
        idStatus: undefined,
        idType: undefined,
        isCompanyOwner: mockUser.isCompanyOwner,
        language: undefined,
        name: mockUser.name,
        permissions: undefined,
        phone: mockUser.phone,
        phoneVerified: false,
        picture: mockUser.picture,
        plan: undefined,
        role: mockUser.role,
        settings: undefined,
        tokenBalance: undefined,
        tokenTotal: undefined,
        updatedAt: expect.any(Date),
        userType: UserType.SME,
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
        address: undefined,
        bio: undefined,
        birthdate: undefined,
        companyId: mockUser.companyId,
        createdAt: mockUser.createdAt,
        email: mockUser.email,
        emailVerified: false,
        familyName: undefined,
        financialInstitutionId: undefined,
        givenName: undefined,
        id: mockUser.id,
        idNumber: undefined,
        idStatus: undefined,
        idType: undefined,
        isCompanyOwner: mockUser.isCompanyOwner,
        language: undefined,
        name: mockUser.name,
        permissions: undefined,
        phone: mockUser.phone,
        phoneVerified: false,
        picture: mockUser.picture,
        plan: undefined,
        role: mockUser.role,
        settings: undefined,
        tokenBalance: undefined,
        tokenTotal: undefined,
        updatedAt: expect.any(Date),
        userType: UserType.FINANCIAL_INSTITUTION,
      });
    });

    it('should throw error for invalid user type', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);

      await expect(service.changeUserType('user-123', 'invalid')).rejects.toThrow(
        'Type d\'utilisateur non pris en charge'
      );
    });

    it('should throw error when user not found', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.changeUserType('nonexistent', 'sme')).rejects.toThrow(
        'Utilisateur non trouvé'
      );
    });
  });
});
