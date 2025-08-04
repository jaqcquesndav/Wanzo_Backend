import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppModule } from '../../src/app.module';
import { ExternalUserEventsConsumer } from '../../src/modules/events/consumers/external-user-events.consumer';
import { UserService } from '../../src/modules/system-users/services/user.service';
import { CustomerService } from '../../src/modules/customers/services/customer.service';
import { 
  UserCreatedEvent, 
  EventUserType,
  UserStatusChangedEvent,
  UserRoleChangedEvent,
  SharedUserStatus 
} from '../../../../packages/shared/events/kafka-config';

describe('External User Events Integration Tests', () => {
  let app: INestApplication;
  let consumer: ExternalUserEventsConsumer;
  let userService: UserService;
  let customerService: CustomerService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('TEST_DB_HOST', 'localhost'),
            port: configService.get('TEST_DB_PORT', 5432),
            username: configService.get('TEST_DB_USERNAME', 'postgres'),
            password: configService.get('TEST_DB_PASSWORD', 'postgres'),
            database: configService.get('TEST_DB_DATABASE', 'customer_service_test'),
            entities: [__dirname + '/../../src/**/*.entity{.ts,.js}'],
            synchronize: true,
            dropSchema: true,
          }),
          inject: [ConfigService],
        }),
        ClientsModule.register([
          {
            name: 'KAFKA_CLIENT',
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: 'test-kafka-client',
                brokers: ['localhost:9092'],
              },
              consumer: {
                groupId: 'test-group',
              },
            },
          },
        ]),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    consumer = moduleFixture.get<ExternalUserEventsConsumer>(ExternalUserEventsConsumer);
    userService = moduleFixture.get<UserService>(UserService);
    customerService = moduleFixture.get<CustomerService>(CustomerService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('External User Creation Events', () => {
    let testCustomer: any;

    beforeEach(async () => {
      // Create a test customer for user association
      testCustomer = await customerService.create({
        name: 'Test Company',
        type: 'SME',
        email: 'test@company.com',
        phone: '+243123456789',
        address: {
          street: '123 Test Street',
          city: 'Kinshasa',
          province: 'Kinshasa',
          country: 'RDC'
        }
      });
    });

    it('should create SME user from external event', async () => {
      const userCreatedEvent: UserCreatedEvent = {
        userId: 'auth0|sme_user_test',
        name: 'John SME User',
        email: 'john.sme@example.com',
        role: 'user',
        userType: EventUserType.SME_USER,
        customerAccountId: testCustomer.id,
        customerName: testCustomer.name,
        timestamp: new Date().toISOString(),
      };

      // Process the event
      await consumer.handleExternalUserCreated(userCreatedEvent);

      // Verify user was created
      const createdUser = await userService.findUserEntityByAuth0Id('auth0|sme_user_test');
      
      expect(createdUser).toBeDefined();
      expect(createdUser?.name).toBe('John SME User');
      expect(createdUser?.email).toBe('john.sme@example.com');
      expect(createdUser?.role).toBe('CUSTOMER_USER');
      expect(createdUser?.userType).toBe('SME');
      expect(createdUser?.customerId).toBe(testCustomer.id);
      expect(createdUser?.isCompanyOwner).toBe(false);
    });

    it('should create SME owner from external event', async () => {
      const userCreatedEvent: UserCreatedEvent = {
        userId: 'auth0|sme_owner_test',
        name: 'Jane SME Owner',
        email: 'jane.owner@example.com',
        role: 'admin',
        userType: EventUserType.SME_OWNER,
        customerAccountId: testCustomer.id,
        customerName: testCustomer.name,
        timestamp: new Date().toISOString(),
      };

      await consumer.handleExternalUserCreated(userCreatedEvent);

      const createdUser = await userService.findUserEntityByAuth0Id('auth0|sme_owner_test');
      
      expect(createdUser).toBeDefined();
      expect(createdUser?.name).toBe('Jane SME Owner');
      expect(createdUser?.role).toBe('CUSTOMER_ADMIN');
      expect(createdUser?.userType).toBe('SME');
      expect(createdUser?.isCompanyOwner).toBe(true);
    });

    it('should create institution user from external event', async () => {
      // Create financial institution customer
      const institutionCustomer = await customerService.create({
        name: 'Test Bank',
        type: 'FINANCIAL_INSTITUTION',
        email: 'contact@testbank.cd',
        phone: '+243987654321',
        address: {
          street: '456 Bank Street',
          city: 'Kinshasa',
          province: 'Kinshasa',
          country: 'RDC'
        }
      });

      const userCreatedEvent: UserCreatedEvent = {
        userId: 'auth0|institution_user_test',
        name: 'Bob Institution User',
        email: 'bob.institution@testbank.cd',
        role: 'user',
        userType: EventUserType.INSTITUTION_USER,
        customerAccountId: institutionCustomer.id,
        customerName: institutionCustomer.name,
        timestamp: new Date().toISOString(),
      };

      await consumer.handleExternalUserCreated(userCreatedEvent);

      const createdUser = await userService.findUserEntityByAuth0Id('auth0|institution_user_test');
      
      expect(createdUser).toBeDefined();
      expect(createdUser?.name).toBe('Bob Institution User');
      expect(createdUser?.role).toBe('CUSTOMER_USER');
      expect(createdUser?.userType).toBe('FINANCIAL_INSTITUTION');
      expect(createdUser?.isCompanyOwner).toBe(false);
    });

    it('should not create duplicate user for existing auth0Id', async () => {
      const userCreatedEvent: UserCreatedEvent = {
        userId: 'auth0|duplicate_test',
        name: 'Duplicate User',
        email: 'duplicate@example.com',
        role: 'user',
        userType: EventUserType.SME_USER,
        customerAccountId: testCustomer.id,
        customerName: testCustomer.name,
        timestamp: new Date().toISOString(),
      };

      // First creation
      await consumer.handleExternalUserCreated(userCreatedEvent);
      const firstUser = await userService.findUserEntityByAuth0Id('auth0|duplicate_test');
      
      // Second creation attempt (should be skipped)
      await consumer.handleExternalUserCreated(userCreatedEvent);
      const secondUser = await userService.findUserEntityByAuth0Id('auth0|duplicate_test');
      
      expect(firstUser).toBeDefined();
      expect(secondUser).toBeDefined();
      expect(firstUser?.id).toBe(secondUser?.id);
    });

    it('should skip creation when customer is not found', async () => {
      const userCreatedEvent: UserCreatedEvent = {
        userId: 'auth0|no_customer_test',
        name: 'No Customer User',
        email: 'nocustomer@example.com',
        role: 'user',
        userType: EventUserType.SME_USER,
        customerAccountId: 'non-existent-customer-id',
        customerName: 'Non Existent Company',
        timestamp: new Date().toISOString(),
      };

      await consumer.handleExternalUserCreated(userCreatedEvent);

      const user = await userService.findUserEntityByAuth0Id('auth0|no_customer_test');
      expect(user).toBeNull();
    });
  });

  describe('User Status Change Events', () => {
    let testUser: any;

    beforeEach(async () => {
      // Create test customer
      const testCustomer = await customerService.create({
        name: 'Status Test Company',
        type: 'SME',
        email: 'status@company.com',
        phone: '+243123456789',
        address: {
          street: '123 Status Street',
          city: 'Kinshasa',
          province: 'Kinshasa',
          country: 'RDC'
        }
      });

      // Create test user
      testUser = await userService.createFromExternalEvent({
        name: 'Status Test User',
        email: 'status@example.com',
        auth0Id: 'auth0|status_test',
        role: 'CUSTOMER_USER',
        userType: 'SME',
        customerId: testCustomer.id,
        companyId: testCustomer.id,
        isCompanyOwner: false,
        status: 'ACTIVE',
        createdAt: new Date(),
      });
    });

    it('should update user status from external event', async () => {
      const statusChangedEvent: UserStatusChangedEvent = {
        userId: 'auth0|status_test',
        previousStatus: SharedUserStatus.ACTIVE,
        newStatus: SharedUserStatus.SUSPENDED,
        userType: EventUserType.SME_USER,
        changedBy: 'admin-user-1',
        timestamp: new Date().toISOString(),
      };

      await consumer.handleExternalUserStatusChanged(statusChangedEvent);

      const updatedUser = await userService.findUserEntityByAuth0Id('auth0|status_test');
      expect(updatedUser?.status).toBe('SUSPENDED');
    });
  });

  describe('User Role Change Events', () => {
    let testUser: any;

    beforeEach(async () => {
      // Create test customer
      const testCustomer = await customerService.create({
        name: 'Role Test Company',
        type: 'SME',
        email: 'role@company.com',
        phone: '+243123456789',
        address: {
          street: '123 Role Street',
          city: 'Kinshasa',
          province: 'Kinshasa',
          country: 'RDC'
        }
      });

      // Create test user
      testUser = await userService.createFromExternalEvent({
        name: 'Role Test User',
        email: 'role@example.com',
        auth0Id: 'auth0|role_test',
        role: 'CUSTOMER_USER',
        userType: 'SME',
        customerId: testCustomer.id,
        companyId: testCustomer.id,
        isCompanyOwner: false,
        status: 'ACTIVE',
        createdAt: new Date(),
      });
    });

    it('should update user role from external event', async () => {
      const roleChangedEvent: UserRoleChangedEvent = {
        userId: 'auth0|role_test',
        previousRole: 'user',
        newRole: 'admin',
        userType: EventUserType.SME_USER,
        changedBy: 'admin-user-1',
        timestamp: new Date().toISOString(),
      };

      await consumer.handleExternalUserRoleChanged(roleChangedEvent);

      const updatedUser = await userService.findUserEntityByAuth0Id('auth0|role_test');
      expect(updatedUser?.role).toBe('CUSTOMER_ADMIN');
    });

    it('should map manager role correctly', async () => {
      const roleChangedEvent: UserRoleChangedEvent = {
        userId: 'auth0|role_test',
        previousRole: 'user',
        newRole: 'manager',
        userType: EventUserType.SME_USER,
        changedBy: 'admin-user-1',
        timestamp: new Date().toISOString(),
      };

      await consumer.handleExternalUserRoleChanged(roleChangedEvent);

      const updatedUser = await userService.findUserEntityByAuth0Id('auth0|role_test');
      expect(updatedUser?.role).toBe('MANAGER');
    });
  });
});
