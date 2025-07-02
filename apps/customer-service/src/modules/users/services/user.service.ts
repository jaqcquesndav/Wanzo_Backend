import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { User, UserStatus, UserRole, UserType } from '../entities/user.entity';
import { UserActivity, ActivityType } from '../entities/user-activity.entity';
import { CreateUserDto, UpdateUserDto, UserActivityDto } from '../dto/user.dto';
import { SyncUserDto } from '../dto/sync-user.dto';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';
import { Customer, CustomerStatus, CustomerType } from '../../customers/entities/customer.entity';
import { Sme } from '../../customers/entities/sme.entity';
import { SmeSpecificData } from '../../customers/entities/sme-specific-data.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserActivity)
    private readonly userActivityRepository: Repository<UserActivity>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Sme)
    private readonly smeRepository: Repository<Sme>,
    @InjectRepository(SmeSpecificData)
    private readonly smeDataRepository: Repository<SmeSpecificData>,
    private readonly customerEventsProducer: CustomerEventsProducer,
    private readonly connection: Connection,
  ) {}

  /**
   * Synchronize user from Auth0 - handles first login as signup
   */
  async syncUser(syncUserDto: SyncUserDto): Promise<User> {
    // Check if user already exists by auth0Id
    let user = await this.userRepository.findOne({ 
      where: { auth0Id: syncUserDto.auth0Id },
      relations: ['customer']
    });
    
    // If user exists, just update profile information
    if (user) {
      // Update basic user information from Auth0
      user.name = syncUserDto.name || `${syncUserDto.firstName || ''} ${syncUserDto.lastName || ''}`.trim();
      user.email = syncUserDto.email || user.email;
      user.avatar = syncUserDto.picture || user.avatar;
      user.lastLogin = new Date();
      user.updatedAt = new Date();
      
      const updatedUser = await this.userRepository.save(user);
      await this.customerEventsProducer.emitUserUpdated(updatedUser);
      
      return updatedUser;
    }
    
    // First login - create a new user and SME customer
    // Use transaction to ensure both user and customer are created or none
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Create default SME customer
      const customerName = syncUserDto.name || `${syncUserDto.firstName || ''} ${syncUserDto.lastName || ''}`.trim();
      const newCustomer = queryRunner.manager.create(Customer, {
        name: `${customerName}'s Business`,
        email: syncUserDto.email,
        phone: '',
        address: '',
        type: CustomerType.SME,
        status: CustomerStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const savedCustomer = await queryRunner.manager.save(Customer, newCustomer);
      
      // Create SME-specific data
      const smeData = queryRunner.manager.create(SmeSpecificData, {
        registrationNumber: '',
        taxId: '',
        legalForm: 'Not specified',
        sector: 'Other',
        yearFounded: new Date().getFullYear(),
        employeeCount: 1,
        annualRevenue: 0,
        websiteUrl: '',
        description: 'Created during first login',
      });
      
      const savedSmeData = await queryRunner.manager.save(SmeSpecificData, smeData);
      
      // Update customer with SME data reference
      savedCustomer.smeData = savedSmeData;
      await queryRunner.manager.save(Customer, savedCustomer);
      
      // Create SME entity
      const sme = queryRunner.manager.create(Sme, {
        customerId: savedCustomer.id,
        businessName: `${customerName}'s Business`,
        registrationNumber: '',
        legalForm: 'Not specified',
        industry: 'Other',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      await queryRunner.manager.save(Sme, sme);
      
      // Create user with admin role for this SME
      const newUser = queryRunner.manager.create(User, {
        name: customerName,
        email: syncUserDto.email,
        auth0Id: syncUserDto.auth0Id,
        role: UserRole.CUSTOMER_ADMIN,
        userType: UserType.CUSTOMER,
        customerId: savedCustomer.id,
        status: UserStatus.ACTIVE,
        avatar: syncUserDto.picture,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      });
      
      const savedUser = await queryRunner.manager.save(User, newUser);
      
      // Commit transaction
      await queryRunner.commitTransaction();
      
      // Emit events
      await this.customerEventsProducer.emitSmeCreated({
        customer: savedCustomer,
        sme,
      });
      
      await this.customerEventsProducer.emitUserCreated(savedUser);
      
      return savedUser;
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  /**
   * Find user by Auth0 ID
   */
  async findByAuth0Id(auth0Id: string): Promise<User | null> {
    return this.userRepository.findOne({ 
      where: { auth0Id },
      relations: ['customer']
    });
  }

  /**
   * Crée un nouvel utilisateur
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.userRepository.findOne({ 
      where: { email: createUserDto.email } 
    });
    
    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }
    
    // Créer le nouvel utilisateur
    const user = this.userRepository.create({
      ...createUserDto,
      status: UserStatus.PENDING, // Par défaut en attente de validation
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    const savedUser = await this.userRepository.save(user);
    
    // Publier un événement Kafka pour la création d'utilisateur
    await this.customerEventsProducer.emitUserCreated(savedUser);
    
    return savedUser;
  }

  /**
   * Récupère tous les utilisateurs (avec pagination)
   */
  async findAll(page = 1, limit = 10, customerId?: string): Promise<[User[], number]> {
    const query = this.userRepository.createQueryBuilder('user');
    
    if (customerId) {
      query.where('user.customerId = :customerId', { customerId });
    }
    
    return query
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
  }

  /**
   * Récupère un utilisateur par son ID
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ 
      where: { id },
      relations: ['customer']
    });
    
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }
    
    return user;
  }

  /**
   * Récupère un utilisateur par son ID. Alias pour findOne.
   */
  async findById(id: string): Promise<User> {
    return this.findOne(id);
  }

  /**
   * Met à jour les préférences d'un utilisateur
   */
  async updateUserPreferences(userId: string, preferences: Record<string, any>): Promise<User> {
    const user = await this.findOne(userId);
    user.preferences = { ...(user.preferences || {}), ...preferences };
    user.updatedAt = new Date();
    const updatedUser = await this.userRepository.save(user);
    await this.customerEventsProducer.emitUserUpdated(updatedUser);
    return updatedUser;
  }

  /**
   * Enregistre un nouvel appareil pour un utilisateur
   */
  async registerUserDevice(userId: string, deviceInfo: Record<string, any>): Promise<User> {
    const user = await this.findOne(userId);
    if (!user.devices) {
      user.devices = [];
    }
    user.devices.push({
      deviceId: deviceInfo.id || 'unknown-device-' + Date.now(),
      lastLogin: new Date(),
      deviceInfo,
    });
    user.updatedAt = new Date();
    const updatedUser = await this.userRepository.save(user);
    await this.customerEventsProducer.emitUserUpdated(updatedUser);
    return updatedUser;
  }

  /**
   * Met à jour un utilisateur
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    
    // Mettre à jour les propriétés
    Object.assign(user, {
      ...updateUserDto,
      updatedAt: new Date(),
    });
    
    const updatedUser = await this.userRepository.save(user);
    
    // Publier un événement Kafka pour la mise à jour d'utilisateur
    await this.customerEventsProducer.emitUserUpdated(updatedUser);
    
    return updatedUser;
  }

  /**
   * Désactive un utilisateur
   */
  async deactivate(id: string): Promise<User> {
    const user = await this.findOne(id);
    
    user.status = UserStatus.INACTIVE;
    user.updatedAt = new Date();
    
    const deactivatedUser = await this.userRepository.save(user);
    
    // Publier un événement Kafka pour la désactivation d'utilisateur
    await this.customerEventsProducer.emitUserStatusChanged(deactivatedUser);
    
    return deactivatedUser;
  }

  /**
   * Active un utilisateur
   */
  async activate(id: string): Promise<User> {
    const user = await this.findOne(id);
    
    user.status = UserStatus.ACTIVE;
    user.updatedAt = new Date();
    
    const activatedUser = await this.userRepository.save(user);
    
    // Publier un événement Kafka pour l'activation d'utilisateur
    await this.customerEventsProducer.emitUserStatusChanged(activatedUser);
    
    return activatedUser;
  }

  /**
   * Enregistre une activité utilisateur
   */
  async recordUserActivity(activityDto: UserActivityDto): Promise<UserActivity> {
    try {
      // Vérifier si l'utilisateur existe
      await this.findOne(activityDto.userId);
      
      // Créer l'activité
      const activity = this.userActivityRepository.create({
        userId: activityDto.userId,
        activityType: activityDto.activityType as ActivityType,
        details: activityDto.details || {},
        ipAddress: activityDto.ipAddress,
        userAgent: activityDto.userAgent,
        timestamp: activityDto.timestamp || new Date(),
      });
      
      return this.userActivityRepository.save(activity);
    } catch (error) {
      console.error('Error recording user activity:', error);
      throw error;
    }
  }

  /**
   * Récupère les activités d'un utilisateur
   */
  async getUserActivities(userId: string, page = 1, limit = 20): Promise<[UserActivity[], number]> {
    return this.userActivityRepository.findAndCount({
      where: { userId },
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
