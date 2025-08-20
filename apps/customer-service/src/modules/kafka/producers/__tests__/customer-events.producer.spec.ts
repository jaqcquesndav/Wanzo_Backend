import { Test, TestingModule } from '@nestjs/testing';
import { CustomerEventsProducer } from '../customer-events.producer';
import { ClientKafka } from '@nestjs/microservices';
import { User, UserStatus, UserRole } from '../../../system-users/entities/user.entity';
import { Customer, CustomerType, CustomerStatus } from '../../../customers/entities/customer.entity';
import { Logger } from '@nestjs/common';
import { jest } from '@jest/globals';

describe('CustomerEventsProducer', () => {
  let producer: CustomerEventsProducer;
  let kafkaClient: jest.Mocked<ClientKafka>;

  beforeEach(async () => {
    const mockEmit = jest.fn(() => Promise.resolve(true));
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerEventsProducer,
        {
          provide: 'KAFKA_SERVICE',
          useValue: {
            emit: mockEmit,
          },
        },
      ],
    }).compile();

    producer = module.get<CustomerEventsProducer>(CustomerEventsProducer);
    kafkaClient = module.get<ClientKafka>('KAFKA_SERVICE') as jest.Mocked<ClientKafka>;
    
    // Mock logger
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(producer).toBeDefined();
  });

  describe('emitUserCreated', () => {
    it('should emit user.created event', async () => {
      const mockUser = {
        id: 'user-id',
        customerId: 'customer-id',
        email: 'test@example.com',
        role: UserRole.CUSTOMER_ADMIN,
        createdAt: new Date('2023-01-01'),
      } as User;

      await producer.emitUserCreated(mockUser);

      expect(kafkaClient.emit).toHaveBeenCalledWith('user.created', {
        userId: mockUser.id,
        customerId: mockUser.customerId,
        email: mockUser.email,
        role: mockUser.role,
        createdAt: mockUser.createdAt.toISOString(),
      });
    });

    it('should handle errors', async () => {
      const mockUser = {
        id: 'user-id',
        customerId: 'customer-id',
        email: 'test@example.com',
        role: UserRole.CUSTOMER_ADMIN,
        createdAt: new Date('2023-01-01'),
      } as User;

      const error = new Error('Kafka error');
      jest.spyOn(kafkaClient, 'emit').mockImplementation(() => {
        throw error;
      });

      await expect(producer.emitUserCreated(mockUser)).rejects.toThrow('Kafka error');
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('emitUserUpdated', () => {
    it('should emit user.updated event', async () => {
      const mockUser = {
        id: 'user-id',
        customerId: 'customer-id',
        email: 'test@example.com',
        role: UserRole.CUSTOMER_ADMIN,
        updatedAt: new Date('2023-01-01'),
      } as User;

      await producer.emitUserUpdated(mockUser);

      expect(kafkaClient.emit).toHaveBeenCalledWith('user.updated', {
        userId: mockUser.id,
        customerId: mockUser.customerId,
        email: mockUser.email,
        role: mockUser.role,
        updatedAt: mockUser.updatedAt.toISOString(),
      });
    });
  });

  describe('emitUserStatusChanged', () => {
    it('should emit user.status.changed event', async () => {
      const mockUser = {
        id: 'user-id',
        customerId: 'customer-id',
        email: 'test@example.com',
        status: UserStatus.ACTIVE,
        updatedAt: new Date('2023-01-01'),
      } as User;

      await producer.emitUserStatusChanged(mockUser);

      expect(kafkaClient.emit).toHaveBeenCalledWith('user.status.changed', {
        userId: mockUser.id,
        customerId: mockUser.customerId,
        email: mockUser.email,
        status: mockUser.status,
        updatedAt: mockUser.updatedAt.toISOString(),
      });
    });
  });

  describe('emitUserDocumentUploaded', () => {
    it('should emit user.document.uploaded event', async () => {
      const documentData = {
        userId: 'user-id',
        documentType: 'PASSPORT',
        documentUrl: 'https://example.com/doc.jpg',
        status: 'pending',
        timestamp: '2023-01-01T12:00:00.000Z',
      };

      await producer.emitUserDocumentUploaded(documentData);

      expect(kafkaClient.emit).toHaveBeenCalledWith('user.document.uploaded', documentData);
    });
  });

  describe('publishCustomerCreated', () => {
    it('should emit customer.created event', async () => {
      const customerData = {
        customerId: 'customer-id',
        name: 'Test Company',
        type: 'SME',
        createdBy: 'user-id',
        createdAt: '2023-01-01T12:00:00.000Z',
      };

      await producer.publishCustomerCreated(customerData);

      expect(kafkaClient.emit).toHaveBeenCalledWith('customer.created', customerData);
    });
  });

  describe('emitSmeCreated', () => {
    it('should emit sme.created event', async () => {
      const mockData = {
        customer: {
          id: 'customer-id',
          name: 'Test Company',
          type: CustomerType.SME,
          status: CustomerStatus.ACTIVE,
          createdAt: new Date('2023-01-01') // Added createdAt
        } as Customer,
        sme: {
          id: 'sme-id',
          customerId: 'customer-id',
          businessName: 'Test Business',
        }
      };

      await producer.emitSmeCreated(mockData);

      expect(kafkaClient.emit).toHaveBeenCalledWith('customer.sme.created', expect.objectContaining({
        customerId: mockData.customer.id,
        name: mockData.customer.name,
        type: mockData.customer.type,
      }));
    });
  });

  // Ajoutez plus de tests pour les autres méthodes du ProductiveurEventsProducer selon besoin
});
