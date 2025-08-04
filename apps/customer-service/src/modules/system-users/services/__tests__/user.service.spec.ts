import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Connection, EntityTarget, DeepPartial } from 'typeorm';
import { UserService } from '../user.service';
import { User, UserStatus, UserRole, UserType, IdStatus } from '../../entities/user.entity';
import { UserActivity } from '../../entities/user-activity.entity';
import { Customer, CustomerStatus, CustomerType } from '../../../customers/entities/customer.entity';
import { Sme } from '../../../customers/entities/sme.entity';
import { SmeSpecificData } from '../../../customers/entities/sme-specific-data.entity';
import { CustomerEventsProducer } from '../../../kafka/producers/customer-events.producer';
import { CloudinaryService } from '../../../cloudinary/cloudinary.service';
import { CreateUserDto, UpdateUserDto } from '../../dto/user.dto';
import { SyncUserDto } from '../../dto/sync-user.dto';
import { NotFoundException } from '@nestjs/common';
import { jest } from '@jest/globals';

const mockUserRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn()
  }))
});

const mockUserActivityRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn()
});

const mockCustomerRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn()
});

const mockSmeRepository = () => ({
  create: jest.fn(),
  save: jest.fn()
});

const mockSmeDataRepository = () => ({
  create: jest.fn(),
  save: jest.fn()
});

const mockCustomerEventsProducer = () => ({
  emitUserCreated: jest.fn(),
  emitUserUpdated: jest.fn(),
  emitUserStatusChanged: jest.fn(),
  emitSmeCreated: jest.fn(),
  emitUserDocumentUploaded: jest.fn()
});

const mockCloudinaryService = () => ({
  uploadImage: jest.fn()
});

const mockConnection = () => ({
  createQueryRunner: jest.fn().mockReturnValue({
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn(),
      save: jest.fn()
    }
  })
});

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Repository<User>>;
  let userActivityRepository: jest.Mocked<Repository<UserActivity>>;
  let customerRepository: jest.Mocked<Repository<Customer>>;
  let smeRepository: jest.Mocked<Repository<Sme>>;
  let smeDataRepository: jest.Mocked<Repository<SmeSpecificData>>;
  let customerEventsProducer: jest.Mocked<CustomerEventsProducer>;
  let cloudinaryService: jest.Mocked<CloudinaryService>;
  let connection: jest.Mocked<Connection>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
        { provide: getRepositoryToken(UserActivity), useFactory: mockUserActivityRepository },
        { provide: getRepositoryToken(Customer), useFactory: mockCustomerRepository },
        { provide: getRepositoryToken(Sme), useFactory: mockSmeRepository },
        { provide: getRepositoryToken(SmeSpecificData), useFactory: mockSmeDataRepository },
        { provide: CustomerEventsProducer, useFactory: mockCustomerEventsProducer },
        { provide: Connection, useFactory: mockConnection },
        { provide: CloudinaryService, useFactory: mockCloudinaryService }
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User)) as jest.Mocked<Repository<User>>;
    userActivityRepository = module.get(getRepositoryToken(UserActivity)) as jest.Mocked<Repository<UserActivity>>;
    customerRepository = module.get(getRepositoryToken(Customer)) as jest.Mocked<Repository<Customer>>;
    smeRepository = module.get(getRepositoryToken(Sme)) as jest.Mocked<Repository<Sme>>;
    smeDataRepository = module.get(getRepositoryToken(SmeSpecificData)) as jest.Mocked<Repository<SmeSpecificData>>;
    customerEventsProducer = module.get(CustomerEventsProducer) as jest.Mocked<CustomerEventsProducer>;
    cloudinaryService = module.get(CloudinaryService) as jest.Mocked<CloudinaryService>;
    connection = module.get(Connection) as jest.Mocked<Connection>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncUser', () => {
    it('should update user if exists', async () => {
      const mockUser = {
        id: 'test-id',
        auth0Id: 'auth0|123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/pic.jpg',
        lastLogin: new Date(),
        updatedAt: new Date(),
        customer: { id: 'cust-id' }
      };

      const syncUserDto: SyncUserDto = {
        auth0Id: 'auth0|123',
        email: 'test@example.com',
        name: 'Updated Name',
        picture: 'https://example.com/updated.jpg'
      };

      userRepository.findOne.mockResolvedValue(mockUser as any);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        name: 'Updated Name',
        picture: 'https://example.com/updated.jpg'
      } as any);

      await service.syncUser(syncUserDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { auth0Id: 'auth0|123' },
        relations: ['customer']
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(customerEventsProducer.emitUserUpdated).toHaveBeenCalled();
    });

    it('should create new user and SME if user does not exist', async () => {
      const syncUserDto: SyncUserDto = {
        auth0Id: 'auth0|123',
        email: 'test@example.com',
        name: 'New User'
      };

      userRepository.findOne.mockResolvedValue(null);
      const queryRunner = connection.createQueryRunner();
      
      // Mock customer creation and return
      (queryRunner.manager.create as jest.Mock).mockImplementation((entity: any, data: any) => {
        if (entity === Customer) {
          return { id: 'new-cust-id', ...data };
        } else if (entity === SmeSpecificData) {
          return { id: 'sme-data-id', ...data };
        } else if (entity === Sme) {
          return { id: 'sme-id', ...data };
        } else if (entity === User) {
          return { id: 'new-user-id', ...data };
        }
        return data;
      });

      (queryRunner.manager.save as jest.Mock).mockImplementation((data: any) => {
        return Promise.resolve({ ...data });
      });

      const result = await service.syncUser(syncUserDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { auth0Id: 'auth0|123' },
        relations: ['customer']
      });
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.create).toHaveBeenCalledTimes(4);
      // The implementation actually calls save 5 times:
      // 1. Initial customer save
      // 2. Save SME data
      // 3. Save updated customer with SME data reference
      // 4. Save SME entity
      // 5. Save user
      expect(queryRunner.manager.save).toHaveBeenCalledTimes(5);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(customerEventsProducer.emitSmeCreated).toHaveBeenCalled();
      expect(customerEventsProducer.emitUserCreated).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findByAuth0Id', () => {
    it('should find user by Auth0 ID', async () => {
      const mockUser = {
        id: 'test-id',
        auth0Id: 'auth0|123',
        email: 'test@example.com',
        customer: { id: 'cust-id' }
      };

      userRepository.findOne.mockResolvedValue(mockUser as any);

      const result = await service.findByAuth0Id('auth0|123');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { auth0Id: 'auth0|123' },
        relations: ['customer']
      });
      expect(result).toBeDefined();
    });

    it('should return null if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findByAuth0Id('auth0|123');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { auth0Id: 'auth0|123' },
        relations: ['customer']
      });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'new@example.com',
        name: 'New User',
        role: UserRole.CUSTOMER_ADMIN
      };

      const mockUser = {
        id: 'new-user-id',
        ...createUserDto,
        status: UserStatus.PENDING,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      };

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser as any);
      userRepository.save.mockResolvedValue(mockUser as any);

      const result = await service.create(createUserDto);

      expect(userRepository.findOne).toHaveBeenCalled();
      expect(userRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        status: UserStatus.PENDING,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(customerEventsProducer.emitUserCreated).toHaveBeenCalledWith(mockUser);
      expect(result).toBeDefined();
    });

    it('should throw error if user with email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        name: 'New User',
        role: UserRole.CUSTOMER_ADMIN
      };

      userRepository.findOne.mockResolvedValue({ id: 'existing-id' } as any);

      await expect(service.create(createUserDto)).rejects.toThrow('Un utilisateur avec cet email existe déjà');
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      const mockUser = {
        id: 'test-id',
        email: 'test@example.com',
        customer: { id: 'cust-id' }
      };

      userRepository.findOne.mockResolvedValue(mockUser as any);

      const result = await service.findOne('test-id');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        relations: ['customer']
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('test-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadIdentityDocument', () => {
    it('should upload identity document and update user', async () => {
      const userId = 'test-id';
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      };
      const idType = 'PASSPORT';

      const mockUser = {
        id: userId,
        email: 'test@example.com'
      };

      const uploadResult = {
        url: 'https://cloudinary.com/test.jpg',
        publicId: 'test-id'
      };

      userRepository.findOne.mockResolvedValue(mockUser as any);
      cloudinaryService.uploadImage.mockResolvedValue(uploadResult);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        identityDocumentType: idType,
        identityDocumentUrl: uploadResult.url,
        identityDocumentStatus: IdStatus.PENDING
      } as any);
      userActivityRepository.create.mockReturnValue({} as any);
      userActivityRepository.save.mockResolvedValue({} as any);

      const result = await service.uploadIdentityDocument(userId, mockFile, idType);

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(mockFile, 'identity-documents');
      expect(userRepository.save).toHaveBeenCalled();
      expect(customerEventsProducer.emitUserDocumentUploaded).toHaveBeenCalled();
      expect(result).toEqual({
        idType,
        idStatus: IdStatus.PENDING,
        documentUrl: uploadResult.url,
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'test-id';
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      };
      const idType = 'PASSPORT';

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.uploadIdentityDocument(userId, mockFile, idType)).rejects.toThrow(NotFoundException);
    });
  });
});
