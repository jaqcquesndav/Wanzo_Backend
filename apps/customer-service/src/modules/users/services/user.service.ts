import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { User, UserStatus, UserRole, UserType, IdStatus } from '../entities/user.entity';
import { UserActivity, ActivityType } from '../entities/user-activity.entity';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '../dto/user.dto';
import { SyncUserDto } from '../dto/sync-user.dto';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';
import { Customer, CustomerStatus, CustomerType } from '../../customers/entities/customer.entity';
import { Sme } from '../../customers/entities/sme.entity';
import { CloudinaryService, MulterFile } from '../../cloudinary/cloudinary.service';
import { SmeSpecificData } from '../../customers/entities/sme-specific-data.entity';

// Define a UserActivityDto interface for internal use
interface UserActivityDto {
  userId: string;
  activityType: ActivityType;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
}

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
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Synchronize user from Auth0 - handles first login as signup
   */
  async syncUser(syncUserDto: SyncUserDto): Promise<UserResponseDto> {
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
      user.picture = syncUserDto.picture || user.picture;
      user.lastLogin = new Date();
      user.updatedAt = new Date();
      
      const updatedUser = await this.userRepository.save(user);
      await this.customerEventsProducer.emitUserUpdated(updatedUser);
      
      return this.mapUserToResponseDto(updatedUser);
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
        address: {},
        type: CustomerType.SME,
        status: CustomerStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const savedCustomer = await queryRunner.manager.save(Customer, newCustomer);
      
      // Create SME-specific data
      const smeData = queryRunner.manager.create(SmeSpecificData, {
        legalForm: 'Not specified',
        industry: 'Other',
        yearFounded: new Date().getFullYear(),
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
        userType: UserType.SME,
        customerId: savedCustomer.id,
        companyId: savedCustomer.id,
        status: UserStatus.ACTIVE,
        picture: syncUserDto.picture,
        isCompanyOwner: true,
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
      
      return this.mapUserToResponseDto(savedUser);
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
  async findByAuth0Id(auth0Id: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.findOne({ 
      where: { auth0Id },
      relations: ['customer']
    });
    
    if (!user) return null;
    
    return this.mapUserToResponseDto(user);
  }

  /**
   * Change user type (SME, FINANCIAL_INSTITUTION)
   */
  async changeUserType(userId: string, newType: string): Promise<UserResponseDto> {
    const user = await this.findById(userId);
    
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    
    if (newType === 'sme') {
      user.userType = UserType.SME;
    } else if (newType === 'financial_institution') {
      user.userType = UserType.FINANCIAL_INSTITUTION;
    } else {
      throw new Error('Type d\'utilisateur non pris en charge');
    }
    
    user.updatedAt = new Date();
    const updatedUser = await this.userRepository.save(user);
    
    await this.customerEventsProducer.emitUserUpdated(updatedUser);
    
    return this.mapUserToResponseDto(updatedUser);
  }

  /**
   * Crée un nouvel utilisateur
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
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
    
    return this.mapUserToResponseDto(savedUser);
  }

  /**
   * Récupère tous les utilisateurs (avec pagination)
   */
  async findAll(page = 1, limit = 10, customerId?: string): Promise<[UserResponseDto[], number]> {
    const query = this.userRepository.createQueryBuilder('user');
    
    if (customerId) {
      query.where('user.customerId = :customerId', { customerId });
    }
    
    const [users, count] = await query
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
      
    return [users.map(user => this.mapUserToResponseDto(user)), count];
  }

  /**
   * Récupère un utilisateur par son ID
   */
  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ 
      where: { id },
      relations: ['customer']
    });
    
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    
    return this.mapUserToResponseDto(user);
  }

  /**
   * Récupère un utilisateur par son ID. Alias pour findOne.
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ 
      where: { id },
      relations: ['customer']
    });
    
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    
    return user;
  }

  /**
   * Met à jour les préférences d'un utilisateur
   */
  async updateUserPreferences(userId: string, preferences: Record<string, any>): Promise<UserResponseDto> {
    const user = await this.findById(userId);
    if (!user.settings) {
      user.settings = {};
    }
    if (!user.settings.preferences) {
      user.settings.preferences = {};
    }
    user.settings.preferences = { ...user.settings.preferences, ...preferences };
    user.updatedAt = new Date();
    const updatedUser = await this.userRepository.save(user);
    await this.customerEventsProducer.emitUserUpdated(updatedUser);
    return this.mapUserToResponseDto(updatedUser);
  }

  /**
   * Enregistre un nouvel appareil pour un utilisateur
   */
  async registerUserDevice(userId: string, deviceInfo: Record<string, any>): Promise<UserResponseDto> {
    const user = await this.findById(userId);
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
    return this.mapUserToResponseDto(updatedUser);
  }

  /**
   * Met à jour un utilisateur
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findById(id);
    
    // Mettre à jour les propriétés
    Object.assign(user, {
      ...updateUserDto,
      updatedAt: new Date(),
    });
    
    const updatedUser = await this.userRepository.save(user);
    
    // Publier un événement Kafka pour la mise à jour d'utilisateur
    await this.customerEventsProducer.emitUserUpdated(updatedUser);
    
    return this.mapUserToResponseDto(updatedUser);
  }

  /**
   * Désactive un utilisateur
   */
  async deactivate(id: string): Promise<UserResponseDto> {
    const user = await this.findById(id);
    
    user.status = UserStatus.INACTIVE;
    user.updatedAt = new Date();
    
    const deactivatedUser = await this.userRepository.save(user);
    
    // Publier un événement Kafka pour la désactivation d'utilisateur
    await this.customerEventsProducer.emitUserStatusChanged(deactivatedUser);
    
    return this.mapUserToResponseDto(deactivatedUser);
  }

  /**
   * Active un utilisateur
   */
  async activate(id: string): Promise<UserResponseDto> {
    const user = await this.findById(id);
    
    user.status = UserStatus.ACTIVE;
    user.updatedAt = new Date();
    
    const activatedUser = await this.userRepository.save(user);
    
    // Publier un événement Kafka pour l'activation d'utilisateur
    await this.customerEventsProducer.emitUserStatusChanged(activatedUser);
    
    return this.mapUserToResponseDto(activatedUser);
  }

  /**
   * Supprime un utilisateur
   */
  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
    // Notifier la suppression de l'utilisateur
    await this.customerEventsProducer.emitUserUpdated({
      ...user,
      status: UserStatus.INACTIVE
    });
  }

  /**
   * Enregistre une activité utilisateur
   */
  async recordUserActivity(activityDto: UserActivityDto): Promise<UserActivity> {
    try {
      // Vérifier si l'utilisateur existe
      await this.findById(activityDto.userId);
      
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

  /**
   * Convertit un objet User en UserResponseDto
   */
  private mapUserToResponseDto(user: User): UserResponseDto {
    const birthdate = user.birthdate ? user.birthdate.toISOString().split('T')[0] : undefined;
    
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified || false,
      name: user.name,
      givenName: user.givenName,
      familyName: user.familyName,
      picture: user.picture,
      phone: user.phone,
      phoneVerified: user.phoneVerified || false,
      address: user.address,
      idNumber: user.idNumber,
      idType: user.idType,
      idStatus: user.idStatus,
      role: user.role,
      birthdate: birthdate,
      bio: user.bio,
      userType: user.userType,
      companyId: user.companyId,
      financialInstitutionId: user.financialInstitutionId,
      isCompanyOwner: user.isCompanyOwner || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      settings: user.settings,
      language: user.language,
      permissions: this.extractPermissions(user.permissions),
      plan: user.plan,
      tokenBalance: user.tokenBalance,
      tokenTotal: user.tokenTotal
    };
  }

  /**
   * Extrait les permissions d'un utilisateur dans un format cohérent
   */
  private extractPermissions(permissions?: string[] | { applicationId: string; permissions: string[] }[]): string[] | undefined {
    if (!permissions) return undefined;
    
    // Si c'est déjà un tableau de chaînes, on le retourne
    if (Array.isArray(permissions) && (permissions.length === 0 || typeof permissions[0] === 'string')) {
      return permissions as string[];
    }
    
    // Sinon, on extrait les permissions des objets
    const permArray = permissions as { applicationId: string; permissions: string[] }[];
    const allPermissions: string[] = [];
    
    permArray.forEach(perm => {
      if (Array.isArray(perm.permissions)) {
        allPermissions.push(...perm.permissions);
      }
    });
    
    return allPermissions.length > 0 ? allPermissions : undefined;
  }

  /**
   * Upload and process an identity document for the user
   * @param userId - The ID of the user
   * @param file - The uploaded file
   * @param idType - The type of identity document
   * @returns Promise with upload status
   */
  async uploadIdentityDocument(userId: string, file: MulterFile, idType: string): Promise<{ idType: string, idStatus: string, documentUrl: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    
    // Upload the file to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImage(file, 'identity-documents');
    
    // Update the user with the document information
    user.identityDocumentType = idType;
    user.identityDocumentUrl = uploadResult.url;
    user.identityDocumentStatus = IdStatus.PENDING;
    user.identityDocumentUpdatedAt = new Date();
    
    await this.userRepository.save(user);
    
    // Log this activity
    await this.recordUserActivity({
      userId: user.id, 
      activityType: ActivityType.DOCUMENT_UPLOAD, 
      details: {
        documentType: idType,
        documentUrl: uploadResult.url
      }
    });
    
    // Emit an event for identity document upload
    await this.customerEventsProducer.emitUserDocumentUploaded({
      userId: user.id,
      documentType: idType,
      documentUrl: uploadResult.url,
      status: 'pending',
      timestamp: new Date().toISOString()
    });
    
    return {
      idType,
      idStatus: IdStatus.PENDING,
      documentUrl: uploadResult.url
    };
  }
}
