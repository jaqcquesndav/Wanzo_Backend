import { Test, TestingModule } from '@nestjs/testing';
import { ExternalUserEventsConsumer } from './external-user-events.consumer';
import { UserService } from '../../system-users/services/user.service';
import { CustomerService } from '../../customers/services/customer.service';
import { Logger } from '@nestjs/common';
import { 
  UserCreatedEvent, 
  EventUserType,
  UserStatusChangedEvent,
  UserRoleChangedEvent,
  SharedUserStatus
} from '@wanzobe/shared/events/kafka-config';

describe('ExternalUserEventsConsumer', () => {
  let consumer: ExternalUserEventsConsumer;
  let userService: jest.Mocked<UserService>;
  let customerService: jest.Mocked<CustomerService>;

  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    auth0Id: 'auth0|test123',
    role: 'CUSTOMER_USER',
    userType: 'SME',
    customerId: 'customer-1',
    companyId: 'customer-1',
    status: 'ACTIVE',
    isCompanyOwner: false,
  };

  const mockCustomer = {
    id: 'customer-1',
    name: 'Test Company',
    type: 'SME',
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    const mockUserService = {
      findUserEntityByAuth0Id: jest.fn(),
      createFromExternalEvent: jest.fn(),
      updateStatus: jest.fn(),
      updateRole: jest.fn(),
    };

    const mockCustomerService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalUserEventsConsumer,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: CustomerService,
          useValue: mockCustomerService,
        },
      ],
    }).compile();

    consumer = module.get<ExternalUserEventsConsumer>(ExternalUserEventsConsumer);
    userService = module.get(UserService);
    customerService = module.get(CustomerService);

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleExternalUserCreated', () => {
    const userCreatedEvent: UserCreatedEvent = {
      userId: 'auth0|test123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      userType: EventUserType.SME_USER,
      customerAccountId: 'customer-1',
      customerName: 'Test Company',
      timestamp: new Date().toISOString(),
    };

    it('should create a new user when user does not exist', async () => {
      userService.findUserEntityByAuth0Id.mockResolvedValue(null);
      customerService.findById.mockResolvedValue(mockCustomer as any);
      userService.createFromExternalEvent.mockResolvedValue(mockUser as any);

      await consumer.handleExternalUserCreated(userCreatedEvent);

      expect(userService.findUserEntityByAuth0Id).toHaveBeenCalledWith('auth0|test123');
      expect(customerService.findById).toHaveBeenCalledWith('customer-1');
      expect(userService.createFromExternalEvent).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        auth0Id: 'auth0|test123',
        role: 'CUSTOMER_USER',
        userType: 'SME',
        customerId: 'customer-1',
        companyId: 'customer-1',
        isCompanyOwner: false,
        status: 'ACTIVE',
        createdAt: new Date(userCreatedEvent.timestamp),
      });
    });

    it('should skip creation if user already exists', async () => {
      userService.findUserEntityByAuth0Id.mockResolvedValue(mockUser as any);

      await consumer.handleExternalUserCreated(userCreatedEvent);

      expect(userService.findUserEntityByAuth0Id).toHaveBeenCalledWith('auth0|test123');
      expect(customerService.findById).not.toHaveBeenCalled();
      expect(userService.createFromExternalEvent).not.toHaveBeenCalled();
    });

    it('should skip creation if customer is not found', async () => {
      userService.findUserEntityByAuth0Id.mockResolvedValue(null);
      customerService.findById.mockRejectedValue(new Error('Customer not found'));

      await consumer.handleExternalUserCreated(userCreatedEvent);

      expect(userService.findUserEntityByAuth0Id).toHaveBeenCalledWith('auth0|test123');
      expect(customerService.findById).toHaveBeenCalledWith('customer-1');
      expect(userService.createFromExternalEvent).not.toHaveBeenCalled();
    });

    it('should set correct role for SME_OWNER', async () => {
      const ownerEvent = { ...userCreatedEvent, userType: EventUserType.SME_OWNER };
      userService.findUserEntityByAuth0Id.mockResolvedValue(null);
      customerService.findById.mockResolvedValue(mockCustomer as any);
      userService.createFromExternalEvent.mockResolvedValue(mockUser as any);

      await consumer.handleExternalUserCreated(ownerEvent);

      expect(userService.createFromExternalEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'CUSTOMER_ADMIN',
          userType: 'SME',
          isCompanyOwner: true,
        })
      );
    });

    it('should set correct role for INSTITUTION_USER', async () => {
      const institutionEvent = { ...userCreatedEvent, userType: EventUserType.INSTITUTION_USER };
      userService.findUserEntityByAuth0Id.mockResolvedValue(null);
      customerService.findById.mockResolvedValue(mockCustomer as any);
      userService.createFromExternalEvent.mockResolvedValue(mockUser as any);

      await consumer.handleExternalUserCreated(institutionEvent);

      expect(userService.createFromExternalEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'CUSTOMER_USER',
          userType: 'FINANCIAL_INSTITUTION',
          isCompanyOwner: false,
        })
      );
    });

    it('should handle errors gracefully', async () => {
      userService.findUserEntityByAuth0Id.mockRejectedValue(new Error('Database error'));

      await expect(consumer.handleExternalUserCreated(userCreatedEvent)).resolves.toBeUndefined();
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('handleExternalUserStatusChanged', () => {
    const statusChangedEvent: UserStatusChangedEvent = {
      userId: 'auth0|test123',
      previousStatus: 'active' as SharedUserStatus,
      newStatus: 'suspended' as SharedUserStatus,
      userType: EventUserType.SME_USER,
      changedBy: 'admin-user-1',
      timestamp: new Date().toISOString(),
    };

    it('should update user status when user exists', async () => {
      userService.findUserEntityByAuth0Id.mockResolvedValue(mockUser as any);
      userService.updateStatus.mockResolvedValue({ ...mockUser, status: 'SUSPENDED' } as any);

      await consumer.handleExternalUserStatusChanged(statusChangedEvent);

      expect(userService.findUserEntityByAuth0Id).toHaveBeenCalledWith('auth0|test123');
      expect(userService.updateStatus).toHaveBeenCalledWith('user-1', 'suspended');
    });

    it('should skip update if user is not found', async () => {
      userService.findUserEntityByAuth0Id.mockResolvedValue(null);

      await consumer.handleExternalUserStatusChanged(statusChangedEvent);

      expect(userService.findUserEntityByAuth0Id).toHaveBeenCalledWith('auth0|test123');
      expect(userService.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('handleExternalUserRoleChanged', () => {
    const roleChangedEvent: UserRoleChangedEvent = {
      userId: 'auth0|test123',
      previousRole: 'user',
      newRole: 'admin',
      userType: EventUserType.SME_USER,
      changedBy: 'admin-user-1',
      timestamp: new Date().toISOString(),
    };

    it('should update user role when user exists', async () => {
      userService.findUserEntityByAuth0Id.mockResolvedValue(mockUser as any);
      userService.updateRole.mockResolvedValue({ ...mockUser, role: 'CUSTOMER_ADMIN' } as any);

      await consumer.handleExternalUserRoleChanged(roleChangedEvent);

      expect(userService.findUserEntityByAuth0Id).toHaveBeenCalledWith('auth0|test123');
      expect(userService.updateRole).toHaveBeenCalledWith('user-1', 'CUSTOMER_ADMIN');
    });

    it('should map roles correctly', async () => {
      userService.findUserEntityByAuth0Id.mockResolvedValue(mockUser as any);
      userService.updateRole.mockResolvedValue(mockUser as any);

      // Test admin role mapping
      await consumer.handleExternalUserRoleChanged({ ...roleChangedEvent, newRole: 'admin' });
      expect(userService.updateRole).toHaveBeenCalledWith('user-1', 'CUSTOMER_ADMIN');

      // Test manager role mapping
      await consumer.handleExternalUserRoleChanged({ ...roleChangedEvent, newRole: 'manager' });
      expect(userService.updateRole).toHaveBeenCalledWith('user-1', 'MANAGER');

      // Test unknown role mapping
      await consumer.handleExternalUserRoleChanged({ ...roleChangedEvent, newRole: 'unknown' });
      expect(userService.updateRole).toHaveBeenCalledWith('user-1', 'CUSTOMER_USER');
    });

    it('should skip update if user is not found', async () => {
      userService.findUserEntityByAuth0Id.mockResolvedValue(null);

      await consumer.handleExternalUserRoleChanged(roleChangedEvent);

      expect(userService.findUserEntityByAuth0Id).toHaveBeenCalledWith('auth0|test123');
      expect(userService.updateRole).not.toHaveBeenCalled();
    });
  });
});
