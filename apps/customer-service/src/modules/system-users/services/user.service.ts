import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { User, UserRole, UserStatus, UserType, IdStatus, IdType } from '../entities/user.entity';
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

// Define CreateFromExternalEventDto interface
interface CreateFromExternalEventDto {
  name: string;
  email: string;
  auth0Id: string;
  role: string;
  userType: string;
  customerId: string;
  companyId: string;
  isCompanyOwner: boolean;
}

// Define DeviceInfo interface
interface DeviceInfo {
  deviceId: string;
  deviceType: string;
  platform: string;
  appVersion?: string;
  osVersion?: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Sme)
    private readonly smeRepository: Repository<Sme>,
    @InjectRepository(SmeSpecificData)
    private readonly smeDataRepository: Repository<SmeSpecificData>,
    @InjectRepository(UserActivity)
    private readonly userActivityRepository: Repository<UserActivity>,
    private readonly connection: Connection,
    private readonly customerEventsProducer: CustomerEventsProducer,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Synchronize user from Auth0 - handles first login as signup
   * IMPORTANT: This method should NOT create companies automatically
   * Companies are created later via company/institution endpoints after user profile completion
   */
  async syncUser(syncUserDto: SyncUserDto): Promise<UserResponseDto> {
    const { auth0Id, email, name, firstName, lastName, picture, companyId, financialInstitutionId, userType, metadata } = syncUserDto;
    
    console.log('🔄 [UserService] Starting syncUser for:', { auth0Id, email, companyId, financialInstitutionId, userType });

    // Check if user already exists by auth0Id
    let user = await this.userRepository.findOne({ 
      where: { auth0Id },
      relations: ['customer']
    });
    
    // If user exists, just update profile information
    if (user) {
      console.log('✅ [UserService] User already exists:', user.id);
      
      // Update basic user information from Auth0
      user.name = name || `${firstName || ''} ${lastName || ''}`.trim();
      user.email = email || user.email;
      user.picture = picture || user.picture;
      user.lastLogin = new Date();
      user.updatedAt = new Date();
      
      // Update association fields if provided
      if (companyId && !user.companyId) {
        user.companyId = companyId;
        user.customerId = companyId;
      }
      if (financialInstitutionId && !user.financialInstitutionId) {
        user.financialInstitutionId = financialInstitutionId;
      }
      
      const updatedUser = await this.userRepository.save(user);
      
      // Emit events for existing user login
      await this.customerEventsProducer.emitUserUpdated(updatedUser);
      await this.customerEventsProducer.emitUserLogin(updatedUser, { 
        isFirstLogin: false 
      });
      
      // Record login activity
      await this.recordUserActivity({
        userId: updatedUser.id,
        activityType: ActivityType.LOGIN,
        details: { source: 'auth0_sync', isFirstLogin: false },
      });
      
      return this.mapUserToResponseDto(updatedUser);
    }
    
    // First login - create a new user WITHOUT automatically creating company
    console.log('🆕 [UserService] Creating new user (without auto-creating company)');
    
    const customerName = name || `${firstName || ''} ${lastName || ''}`.trim();
    let savedCustomer: Customer | null = null;
    
    // Only associate with existing company if companyId is provided AND company exists
    if (companyId) {
      console.log('🔍 [UserService] Checking if company exists:', companyId);
      
      savedCustomer = await this.customerRepository.findOne({
        where: { id: companyId }
      });
      
      if (savedCustomer) {
        console.log('✅ [UserService] Found existing company, associating user');
      } else {
        console.log('⚠️ [UserService] Company not found - user will be created without company association');
        console.log('ℹ️ [UserService] Company will be created later via company/institution endpoint');
      }
    }
    
    // Create user
    const newUser = this.userRepository.create({
      name: customerName,
      email: email,
      auth0Id: auth0Id,
      role: UserRole.CUSTOMER_ADMIN, // Default role, can be updated later
      userType: userType === 'financial_institution' ? UserType.FINANCIAL_INSTITUTION : UserType.SME,
      customerId: savedCustomer?.id || null, // Only set if company exists
      companyId: savedCustomer?.id || companyId || null, // Set companyId even if customer doesn't exist yet
      financialInstitutionId: financialInstitutionId || null, // Set financialInstitutionId if provided
      status: UserStatus.ACTIVE,
      picture: picture,
      isCompanyOwner: savedCustomer ? false : true, // Will be owner when company is created later
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date(),
    } as Partial<User>);
    
    const savedUser = await this.userRepository.save(newUser);
    console.log('✅ [UserService] Created User:', savedUser.id);
    
    // Emit user creation events
    await this.customerEventsProducer.emitUserCreated(savedUser);
    await this.customerEventsProducer.emitUserLogin(savedUser, { 
      isFirstLogin: true 
    });
    
    // Record first login activity
    await this.recordUserActivity({
      userId: savedUser.id,
      activityType: ActivityType.LOGIN,
      details: { 
        source: 'auth0_sync', 
        isFirstLogin: true, 
        accountCreated: true,
        companyAssociated: !!savedCustomer
      },
    });
    
    return this.mapUserToResponseDto(savedUser);
  }

  /**
   * Find user by Auth0 ID and return DTO
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
   * Find user with associated company or financial institution
   */
  async findUserWithAssociation(auth0Id: string): Promise<any> {
    const user = await this.userRepository.findOne({ 
      where: { auth0Id },
      relations: ['customer']
    });
    
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const userProfile = this.mapUserToResponseDto(user);
    let company: any = null;
    let financialInstitution: any = null;

    // Si l'utilisateur a un customerId et que c'est un SME
    if (user.customerId && user.userType === UserType.SME) {
      const sme = await this.smeRepository.findOne({
        where: { customerId: user.customerId },
        relations: ['customer']
      });
      
      if (sme) {
        const smeData = await this.smeDataRepository.findOne({
          where: { id: user.customerId }
        });
        
        company = {
          id: sme.customerId,
          name: sme.name,
          logo: sme.logoUrl,
          industry: smeData?.industry || 'Other',
          legalForm: smeData?.legalForm || 'Not specified',
          yearFounded: smeData?.yearFounded || null,
          registrationNumber: sme.rccm,
          status: sme.customer?.status || 'active',
        };
      }
    }
    // Si c'est une institution financière
    else if (user.financialInstitutionId && user.userType === UserType.FINANCIAL_INSTITUTION) {
      // TODO: Implement financial institution logic when entity is available
      financialInstitution = {};
    }

    return {
      user: userProfile,
      company: company || {},
      financialInstitution: financialInstitution || {},
      hasAssociation: !!(company || financialInstitution)
    };
  }

  /**
   * Find user entity by Auth0 ID (for internal use)
   */
  async findUserEntityByAuth0Id(auth0Id: string): Promise<User | null> {
    return await this.userRepository.findOne({ 
      where: { auth0Id },
      relations: ['customer']
    });
  }

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    // Déterminer le type d'utilisateur basé sur le customerId
    const customer = await this.customerRepository.findOne({
      where: { id: createUserDto.customerId }
    });

    if (!customer) {
      throw new NotFoundException('Customer introuvable');
    }

    const newUser = this.userRepository.create({
      ...createUserDto,
      userType: customer.type === CustomerType.SME ? UserType.SME : UserType.FINANCIAL_INSTITUTION,
      companyId: createUserDto.customerId,
      status: UserStatus.PENDING, // Par défaut en attente de validation
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Partial<User>);

    const savedUser = await this.userRepository.save(newUser);

    // Émettre un événement de création d'utilisateur
    await this.customerEventsProducer.emitUserCreated(savedUser);

    // Enregistrer l'activité de création
    await this.recordUserActivity({
      userId: savedUser.id,
      activityType: ActivityType.PROFILE_UPDATED,
      details: { createdBy: 'system', customerType: customer.type },
    });

    return this.mapUserToResponseDto(savedUser);
  }

  /**
   * Update user
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findById(id);
    
    Object.assign(user, updateUserDto);
    user.updatedAt = new Date();
    
    const updatedUser = await this.userRepository.save(user);
    
    // Émettre un événement de mise à jour
    await this.customerEventsProducer.emitUserUpdated(updatedUser);
    
    return this.mapUserToResponseDto(updatedUser);
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['customer']
    });
    
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    
    return user;
  }

  /**
   * Upload user profile picture
   */
  async uploadProfilePicture(userId: string, file: MulterFile): Promise<UserResponseDto> {
    const user = await this.findById(userId);
    
    // Upload to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImage(file, 'user-profiles');
    
    // Update user picture URL
    user.picture = uploadResult.url;
    user.updatedAt = new Date();
    
    const updatedUser = await this.userRepository.save(user);
    
    // Emit update event
    await this.customerEventsProducer.emitUserUpdated(updatedUser);
    
    return this.mapUserToResponseDto(updatedUser);
  }

  /**
   * Deactivate user
   */
  async deactivate(id: string): Promise<UserResponseDto> {
    const user = await this.findById(id);
    
    user.status = UserStatus.INACTIVE;
    user.updatedAt = new Date();
    
    const updatedUser = await this.userRepository.save(user);
    
    // Record deactivation activity
    await this.recordUserActivity({
      userId: user.id,
      activityType: ActivityType.PROFILE_UPDATED,
    });
    
    return this.mapUserToResponseDto(updatedUser);
  }

  /**
   * Activate user
   */
  async activate(id: string): Promise<UserResponseDto> {
    const user = await this.findById(id);
    
    user.status = UserStatus.ACTIVE;
    user.updatedAt = new Date();
    
    const updatedUser = await this.userRepository.save(user);
    
    // Record activation activity
    await this.recordUserActivity({
      userId: user.id,
      activityType: ActivityType.PROFILE_UPDATED,
    });
    
    return this.mapUserToResponseDto(updatedUser);
  }

  /**
   * Find users by customer ID
   */
  async findByCustomerId(customerId: string): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find({
      where: { 
        customerId,
        status: UserStatus.ACTIVE
      },
      relations: ['customer']
    });
    
    return users.map(user => this.mapUserToResponseDto(user));
  }

  /**
   * Create user from external event
   */
  async createFromExternalEvent(eventDto: CreateFromExternalEventDto): Promise<UserResponseDto> {
    const newUser = this.userRepository.create({
      name: eventDto.name,
      email: eventDto.email,
      auth0Id: eventDto.auth0Id,
      role: eventDto.role as UserRole,
      userType: eventDto.userType === 'FINANCIAL_INSTITUTION' ? UserType.FINANCIAL_INSTITUTION : UserType.SME,
      customerId: eventDto.customerId,
      companyId: eventDto.companyId,
      isCompanyOwner: eventDto.isCompanyOwner,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Partial<User>);

    const savedUser = await this.userRepository.save(newUser);
    
    // Emit creation event
    await this.customerEventsProducer.emitUserCreated(savedUser);
    
    return this.mapUserToResponseDto(savedUser);
  }

  /**
   * Update user status
   */
  async updateStatus(userId: string, newStatus: string): Promise<UserResponseDto> {
    const user = await this.findById(userId);
    
    // Map string status to UserStatus enum
    let status: UserStatus;
    switch (newStatus.toLowerCase()) {
      case 'active':
        status = UserStatus.ACTIVE;
        break;
      case 'inactive':
        status = UserStatus.INACTIVE;
        break;
      case 'pending':
        status = UserStatus.PENDING;
        break;
      default:
        status = UserStatus.PENDING;
    }
    
    user.status = status;
    user.updatedAt = new Date();
    
    const updatedUser = await this.userRepository.save(user);
    
    // Record status change activity
    await this.recordUserActivity({
      userId: user.id,
      activityType: ActivityType.PROFILE_UPDATED,
      details: { statusChanged: { from: user.status, to: status } },
    });
    
    return this.mapUserToResponseDto(updatedUser);
  }

  /**
   * Update user role
   */
  async updateRole(userId: string, newRole: string): Promise<UserResponseDto> {
    const user = await this.findById(userId);
    
    const oldRole = user.role;
    user.role = newRole as UserRole;
    user.updatedAt = new Date();
    
    const updatedUser = await this.userRepository.save(user);
    
    // Record role change activity
    await this.recordUserActivity({
      userId: user.id,
      activityType: ActivityType.PROFILE_UPDATED,
      details: { roleChanged: { from: oldRole, to: newRole } },
    });
    
    return this.mapUserToResponseDto(updatedUser);
  }

  /**
   * Register user device
   */
  async registerUserDevice(userId: string, deviceInfo: DeviceInfo): Promise<void> {
    const user = await this.findById(userId);
    
    // Record device registration activity
    await this.recordUserActivity({
      userId: user.id,
      activityType: ActivityType.LOGIN,
      details: { 
        deviceRegistered: {
          deviceId: deviceInfo.deviceId,
          deviceType: deviceInfo.deviceType,
          platform: deviceInfo.platform,
          appVersion: deviceInfo.appVersion,
          osVersion: deviceInfo.osVersion,
        }
      },
    });
  }

  /**
   * Record user activity (made public for external consumers)
   */
  async recordUserActivity(activityDto: UserActivityDto): Promise<void> {
    try {
      const activity = this.userActivityRepository.create({
        userId: activityDto.userId,
        activityType: activityDto.activityType,
        details: activityDto.details || {},
        ipAddress: activityDto.ipAddress,
        userAgent: activityDto.userAgent,
      } as Partial<UserActivity>);
      
      // Set timestamp manually if provided
      if (activityDto.timestamp) {
        activity.timestamp = activityDto.timestamp;
      }
      
      await this.userActivityRepository.save(activity);
    } catch (error) {
      console.error('Error recording user activity:', error);
      // Don't throw - activity recording shouldn't break main flow
    }
  }

  /**
   * Map User entity to UserResponseDto
   */
  private mapUserToResponseDto(user: User): UserResponseDto {
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
      birthdate: user.birthdate?.toISOString(),
      bio: user.bio,
      userType: user.userType,
      companyId: user.companyId,
      financialInstitutionId: user.financialInstitutionId,
      isCompanyOwner: user.isCompanyOwner,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Find all users with pagination (for admin)
   */
  async findAll(page: number = 1, limit: number = 10, customerId?: string): Promise<[UserResponseDto[], number]> {
    const whereCondition: any = {};
    if (customerId) {
      whereCondition.customerId = customerId;
    }

    const [users, total] = await this.userRepository.findAndCount({
      where: whereCondition,
      relations: ['customer'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    return [users.map(user => this.mapUserToResponseDto(user)), total];
  }

  /**
   * Find one user by ID (for admin/user controllers)
   */
  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.findById(id);
    return this.mapUserToResponseDto(user);
  }

  /**
   * Remove/delete user
   */
  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    
    // Soft delete by setting status to inactive
    user.status = UserStatus.INACTIVE;
    user.updatedAt = new Date();
    
    await this.userRepository.save(user);
    
    // Record deletion activity
    await this.recordUserActivity({
      userId: user.id,
      activityType: ActivityType.PROFILE_UPDATED,
      details: { userDeleted: true },
    });
  }

  /**
   * Get user activities
   */
  async getUserActivities(userId: string, page: number = 1, limit: number = 10): Promise<[UserActivity[], number]> {
    const user = await this.findById(userId); // Validate user exists
    
    return await this.userActivityRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      order: { timestamp: 'DESC' }
    });
  }

  /**
   * Upload identity document
   */
  async uploadIdentityDocument(userId: string, file: MulterFile, documentType: string): Promise<UserResponseDto> {
    const user = await this.findById(userId);
    
    // Upload to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImage(file, 'identity-documents');
    
    // Update user with identity document info
    user.idType = documentType as IdType;
    user.idStatus = IdStatus.PENDING; // Pending verification
    // Store document URL in user metadata or create separate document entity
    user.updatedAt = new Date();
    
    const updatedUser = await this.userRepository.save(user);
    
    // Record document upload activity
    await this.recordUserActivity({
      userId: user.id,
      activityType: ActivityType.DOCUMENT_UPLOAD,
      details: { documentType, documentUrl: uploadResult.url },
    });
    
    return this.mapUserToResponseDto(updatedUser);
  }

  /**
   * Associate user to company (with validation)
   */
  async associateUserToCompany(userId: string, companyId: string): Promise<UserResponseDto> {
    const user = await this.findById(userId);
    
    // Verify company exists
    const company = await this.customerRepository.findOne({ where: { id: companyId } });
    if (!company) {
      // If company doesn't exist, we should NOT create it here
      // The company must be created through the proper flow with an owner
      throw new NotFoundException(`Company not found: ${companyId}. A company must be created with a valid owner/admin user first.`);
    }
    
    user.customerId = companyId;
    user.companyId = companyId;
    user.userType = company.type === CustomerType.SME ? UserType.SME : UserType.FINANCIAL_INSTITUTION;
    user.updatedAt = new Date();
    
    const updatedUser = await this.userRepository.save(user);
    
    // Record association activity
    await this.recordUserActivity({
      userId: user.id,
      activityType: ActivityType.PROFILE_UPDATED,
      details: { associatedToCompany: companyId },
    });
    
    return this.mapUserToResponseDto(updatedUser);
  }

  /**
   * Change user type
   */
  async changeUserType(userId: string, newUserType: UserType): Promise<UserResponseDto> {
    const user = await this.findById(userId);
    
    const oldUserType = user.userType;
    user.userType = newUserType;
    user.updatedAt = new Date();
    
    const updatedUser = await this.userRepository.save(user);
    
    // Record user type change activity
    await this.recordUserActivity({
      userId: user.id,
      activityType: ActivityType.PROFILE_UPDATED,
      details: { userTypeChanged: { from: oldUserType, to: newUserType } },
    });
    
    return this.mapUserToResponseDto(updatedUser);
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: Record<string, any>): Promise<UserResponseDto> {
    const user = await this.findById(userId);
    
    // Store preferences in user metadata or separate preferences entity
    // For now, we'll store in user entity - you might want to create a separate preferences entity
    user.updatedAt = new Date();
    
    const updatedUser = await this.userRepository.save(user);
    
    // Record preferences update activity
    await this.recordUserActivity({
      userId: user.id,
      activityType: ActivityType.PROFILE_UPDATED,
      details: { preferencesUpdated: preferences },
    });
    
    return this.mapUserToResponseDto(updatedUser);
  }

  /**
   * Upload profile photo (alias for uploadProfilePicture)
   */
  async uploadProfilePhoto(userId: string, file: MulterFile): Promise<UserResponseDto> {
    return this.uploadProfilePicture(userId, file);
  }

  /**
   * Get companies associated with a user
   */
  async getUserCompanies(userId: string): Promise<any[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['customer']
    });

    if (!user || !user.customer) {
      return [];
    }

    // Si l'utilisateur a un customer associé, récupérer les informations de l'entreprise
    if (user.customer.type === CustomerType.SME) {
      const sme = await this.connection.getRepository('Sme').findOne({
        where: { customerId: user.customer.id },
        relations: ['customer']
      });

      if (sme) {
        return [{
          id: user.customer.id,
          name: sme.name,
          type: user.customer.type,
          status: user.customer.status,
          industry: sme.industry,
          size: sme.size,
          createdAt: user.customer.createdAt,
          updatedAt: user.customer.updatedAt
        }];
      }
    }

    // Pour les institutions financières, implémenter selon le besoin
    if (user.customer.type === CustomerType.FINANCIAL) {
      const institution = await this.connection.getRepository('Institution').findOne({
        where: { customerId: user.customer.id },
        relations: ['customer']
      });

      if (institution) {
        return [{
          id: user.customer.id,
          name: institution.name,
          type: user.customer.type,
          status: user.customer.status,
          createdAt: user.customer.createdAt,
          updatedAt: user.customer.updatedAt
        }];
      }
    }

    return [];
  }
}
