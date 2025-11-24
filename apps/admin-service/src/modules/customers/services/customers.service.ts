import { Injectable, NotFoundException, BadRequestException, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, MoreThan } from 'typeorm';
import {
  Customer,
  CustomerStatus,
  CustomerType,
  AccountType
} from '../entities/customer.entity';
import {
  CustomerDocument,
  DocumentType,
  DocumentStatus
} from '../entities/document.entity';
import { CustomerActivity } from '../entities/activity.entity';
import { ValidationProcess, ValidationStep, ValidationStepStatus } from '../entities/validation.entity';
import { CustomerDetailedProfile, ProfileType, AdminStatus, ComplianceRating } from '../entities/customer-detailed-profile.entity';
import {
  AdminCustomerProfileDto,
  AdminCustomerProfileListDto,
  AdminCustomerProfileDetailsDto,
  AdminDashboardStatsDto,
  CustomerDetailedProfileDto,
  CustomerDetailedProfileListDto,
  ProfileQueryParamsDto,
  UpdateProfileStatusDto,
  ProfileStatisticsDto,
  CustomerDocumentDto,
  CustomerActivityDto,
  CustomerStatisticsDto,
  CustomerDto
} from '../dtos';
import { EventsService } from '../../events/events.service';
import { documentMethods } from './customers-document.methods';
import { CustomerDocumentMethods } from '../interfaces';

@Injectable()
export class CustomersService implements CustomerDocumentMethods {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(CustomerDocument)
    private documentsRepository: Repository<CustomerDocument>,
    @InjectRepository(CustomerActivity)
    private activitiesRepository: Repository<CustomerActivity>,
    @InjectRepository(ValidationProcess)
    private validationProcessRepository: Repository<ValidationProcess>,
    @InjectRepository(CustomerDetailedProfile)
    private detailedProfilesRepository: Repository<CustomerDetailedProfile>,
    private readonly eventsService: EventsService,
  ) {
    this.logger = new Logger(CustomersService.name);
    
    // Add document methods to this class
    Object.assign(this, documentMethods);
  }

  private logger: Logger;

  // These methods are added dynamically from documentMethods
  approveDocument!: CustomerDocumentMethods['approveDocument'];
  rejectDocument!: CustomerDocumentMethods['rejectDocument'];

  /**
   * Get all customers with pagination and filtering
   * OPTIMISÉ : Utilise CustomerDetailedProfile comme source unique de vérité
   */
  async findAll(queryParams: any): Promise<AdminCustomerProfileListDto> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      type,
      status,
      search
    } = queryParams;

    // Utiliser CustomerDetailedProfile au lieu de Customer
    const queryBuilder = this.detailedProfilesRepository.createQueryBuilder('profile');

    // Filtres optimisés
    if (type) {
      queryBuilder.andWhere('profile.customerType = :type', { 
        type: type === 'pme' ? 'PME' : 'FINANCIAL_INSTITUTION' 
      });
    }
    if (status) {
      queryBuilder.andWhere('profile.status = :status', { status });
    }
    if (search) {
      queryBuilder.andWhere(
        '(profile.name ILIKE :search OR profile.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Pagination et tri
    queryBuilder
      .orderBy(`profile.${sortBy}`, sortOrder.toUpperCase() as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [profiles, totalCount] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(totalCount / limit);

    return {
      items: profiles.map(profile => this.mapDetailedProfileToAdminDto(profile)),
      total: totalCount,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Get a single customer by ID with details
   * OPTIMISÉ : Utilise CustomerDetailedProfile comme source unique de données
   */
  async findOne(id: string): Promise<AdminCustomerProfileDetailsDto> {
    // D'abord essayer de récupérer depuis CustomerDetailedProfile
    const detailedProfile = await this.detailedProfilesRepository.findOne({
      where: { customerId: id }
    });

    if (detailedProfile) {
      // Récupérer les documents et activités séparément
      const [documents, activities] = await Promise.all([
        this.documentsRepository.find({ where: { customerId: id } }),
        this.activitiesRepository.find({ where: { customerId: id } })
      ]);

      return {
        profile: this.mapDetailedProfileToAdminDto(detailedProfile),
        statistics: {
          documentsCount: documents?.length || 0,
          activitiesCount: activities?.length || 0,
          lastActivity: activities?.[0]?.timestamp?.toISOString(),
          subscriptionsCount: 0
        },
        recentActivities: (activities || []).slice(0, 10).map(activity => ({
          id: activity.id,
          type: activity.type,
          action: activity.action || '',
          description: activity.description || '',
          performedAt: activity.timestamp,
          performedBy: activity.performedBy
        })),
        documents: (documents || []).map(doc => ({
          id: doc.id,
          type: doc.type,
          fileName: doc.fileName,
          status: doc.status,
          uploadedAt: doc.uploadedAt
        }))
      };
    }

    // Si pas trouvé dans CustomerDetailedProfile, le customer n'existe pas
    throw new NotFoundException(`Customer with ID ${id} not found`);
  }



  /**
   * Validate a customer (change status to active)
   */
  async validateCustomer(id: string): Promise<AdminCustomerProfileDto> {
    const detailedProfile = await this.detailedProfilesRepository.findOne({
      where: { customerId: id }
    });

    if (!detailedProfile) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    if (detailedProfile.adminStatus === AdminStatus.VALIDATED) {
      throw new BadRequestException('Customer is already validated');
    }

    const previousStatus = detailedProfile.adminStatus;
    
    // Update admin status and validation information
    detailedProfile.adminStatus = AdminStatus.VALIDATED;
    detailedProfile.complianceRating = ComplianceRating.HIGH;
    detailedProfile.lastReviewedAt = new Date();
    detailedProfile.reviewedBy = 'current-admin-id'; // In real implementation, get from the authenticated user
    detailedProfile.validationStatus = {
      ...detailedProfile.validationStatus,
      validatedBy: 'current-admin-id',
      validationDate: new Date().toISOString(),
      identificationComplete: true
    };

    const validatedProfile = await this.detailedProfilesRepository.save(detailedProfile);

    // Publish admin status change event
    await this.eventsService.publishCustomerStatusChanged({
      customerId: validatedProfile.customerId,
      previousStatus: previousStatus,
      newStatus: validatedProfile.adminStatus,
      changedBy: 'current-admin-id', // In real implementation, get from the authenticated user
      timestamp: new Date().toISOString()
    });

    // Publish specific validation event
    await this.eventsService.publishCustomerValidated({
      customerId: validatedProfile.customerId,
      validatedBy: 'current-admin-id', // In real implementation, get from the authenticated user
      timestamp: new Date().toISOString()
    });
    
    // Create activity record for validation
    await this.createActivity(
      validatedProfile.customerId, 
      'validation', 
      'validated', 
      'Customer account validated and activated'
    );

    return this.mapDetailedProfileToAdminDto(validatedProfile);
  }

  /**
   * Suspend a customer
   */
  async suspendCustomer(id: string, reason: string): Promise<AdminCustomerProfileDto> {
    const detailedProfile = await this.detailedProfilesRepository.findOne({
      where: { customerId: id }
    });

    if (!detailedProfile) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const previousStatus = detailedProfile.adminStatus;
    
    detailedProfile.adminStatus = AdminStatus.SUSPENDED;
    detailedProfile.complianceRating = ComplianceRating.CRITICAL;
    detailedProfile.lastReviewedAt = new Date();
    detailedProfile.reviewedBy = 'current-admin-id'; // In real implementation, get from the authenticated user
    detailedProfile.adminNotes = reason;
    detailedProfile.requiresAttention = true;

    const suspendedProfile = await this.detailedProfilesRepository.save(detailedProfile);

    // Publish admin status change event
    await this.eventsService.publishCustomerStatusChanged({
      customerId: suspendedProfile.customerId,
      previousStatus: previousStatus,
      newStatus: suspendedProfile.adminStatus,
      changedBy: 'current-admin-id', // In real implementation, get from the authenticated user
      reason: reason,
      timestamp: new Date().toISOString()
    });

    // Publish specific suspension event
    await this.eventsService.publishCustomerSuspended({
      customerId: suspendedProfile.customerId,
      suspendedBy: 'current-admin-id', // In real implementation, get from the authenticated user
      reason: reason,
      timestamp: new Date().toISOString()
    });

    // Create activity record for suspension
    await this.createActivity(
      suspendedProfile.customerId, 
      'account', 
      'suspended', 
      `Customer account suspended. Reason: ${reason}`
    );

    return this.mapDetailedProfileToAdminDto(suspendedProfile);
  }

  /**
   * Reactivate a suspended customer
   */
  async reactivateCustomer(id: string): Promise<AdminCustomerProfileDto> {
    const detailedProfile = await this.detailedProfilesRepository.findOne({
      where: { customerId: id }
    });

    if (!detailedProfile) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    if (detailedProfile.adminStatus !== AdminStatus.SUSPENDED) {
      throw new BadRequestException('Customer is not in a suspended state');
    }

    const previousStatus = detailedProfile.adminStatus;
    
    detailedProfile.adminStatus = AdminStatus.VALIDATED;
    detailedProfile.complianceRating = ComplianceRating.MEDIUM;
    detailedProfile.lastReviewedAt = new Date();
    detailedProfile.reviewedBy = 'current-admin-id'; // In real implementation, get from the authenticated user
    detailedProfile.adminNotes = 'Customer reactivated';
    detailedProfile.requiresAttention = false;

    const reactivatedProfile = await this.detailedProfilesRepository.save(detailedProfile);

    // Publish admin status change event
    await this.eventsService.publishCustomerStatusChanged({
      customerId: reactivatedProfile.customerId,
      previousStatus: previousStatus,
      newStatus: reactivatedProfile.adminStatus,
      changedBy: 'current-admin-id', // In real implementation, get from the authenticated user
      timestamp: new Date().toISOString()
    });

    // Publish specific reactivation event
    await this.eventsService.publishCustomerReactivated({
      customerId: reactivatedProfile.customerId,
      reactivatedBy: 'current-admin-id', // In real implementation, get from the authenticated user
      timestamp: new Date().toISOString()
    });

    // Create activity record for reactivation
    await this.createActivity(
      reactivatedProfile.customerId, 
      'account', 
      'reactivated', 
      'Customer account reactivated'
    );

    return this.mapDetailedProfileToAdminDto(reactivatedProfile);
  }

  /**
   * Archive/Remove a customer profile (admin-service only manages admin data)
   */
  async remove(id: string): Promise<void> {
    const detailedProfile = await this.detailedProfilesRepository.findOne({
      where: { customerId: id }
    });

    if (!detailedProfile) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Archive instead of hard delete - better for audit trails
    detailedProfile.adminStatus = AdminStatus.ARCHIVED;
    detailedProfile.lastReviewedAt = new Date();
    detailedProfile.reviewedBy = 'current-admin-id';
    detailedProfile.adminNotes = 'Customer profile archived by admin';

    await this.detailedProfilesRepository.save(detailedProfile);

    await this.eventsService.publishCustomerDeleted({
      customerId: detailedProfile.customerId,
      deletedBy: 'admin', // Placeholder
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get customer documents
   */
  async getDocuments(customerId: string): Promise<CustomerDocumentDto[]> {
    const detailedProfile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (!detailedProfile) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const documents = await this.documentsRepository.find({
      where: { customerId }
    });

    return documents.map(doc => this.mapDocumentToDto(doc));
  }

  /**
   * Upload a document for a customer
   */
  async uploadDocument(
    customerId: string,
    type: DocumentType,
    fileName: string,
    fileUrl: string,
    originalFileName: string
  ): Promise<CustomerDocumentDto> {
    const detailedProfile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (!detailedProfile) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const document = this.documentsRepository.create({
      customerId,
      type,
      fileName,
      fileUrl,
      status: DocumentStatus.PENDING,
      uploadedBy: 'current-user-id' // In real implementation, get from the authenticated user
    });

    const savedDocument = await this.documentsRepository.save(document);

    // Create activity record for document upload
    await this.createActivity(
      customerId,
      'document',
      'uploaded',
      `Document ${originalFileName} uploaded`,
      {
        documentId: savedDocument.id,
        documentType: type
      }
    );

    return this.mapDocumentToDto(savedDocument);
  }

  // The approveDocument and rejectDocument methods are now imported from customers-document.methods.ts

  /**
   * Get customer activities
   */
  async getActivities(customerId: string, options: { page: number; limit: number }): Promise<CustomerActivityDto[]> {
    const detailedProfile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (!detailedProfile) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const { page = 1, limit = 10 } = options;

    const activities = await this.activitiesRepository.find({
      where: { customerId },
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    return activities.map(activity => this.mapActivityToDto(activity));
  }

  /**
   * Create activity record
   */
  private async createActivity(
    customerId: string,
    type: string,
    action: string,
    description: string,
    details?: Record<string, unknown>
  ): Promise<CustomerActivity> {
    const activity = this.activitiesRepository.create({
      customerId,
      type,
      action,
      description,
      performedBy: 'current-user-id', // In real implementation, get from the authenticated user
      performedByName: 'Admin User', // In real implementation, get from the authenticated user
      details
    });

    return this.activitiesRepository.save(activity);
  }

  /**
   * Get aggregated customer statistics
   * OPTIMISÉ : Utilise CustomerDetailedProfile comme source principale
   */
  async getStatistics(): Promise<CustomerStatisticsDto> {
    const [
      total,
      active,
      inactive,
      pending,
      suspended,
      pmeCount,
      financialCount,
      freemiumCount,
      standardCount,
      premiumCount,
      enterpriseCount
    ] = await Promise.all([
      this.detailedProfilesRepository.count(),
      this.detailedProfilesRepository.count({ where: { status: 'active' } }),
      this.detailedProfilesRepository.count({ where: { status: 'inactive' } }),
      this.detailedProfilesRepository.count({ where: { status: 'pending' } }),
      this.detailedProfilesRepository.count({ where: { status: 'suspended' } }),
      this.detailedProfilesRepository.count({ where: { customerType: 'PME' } }),
      this.detailedProfilesRepository.count({ where: { customerType: 'FINANCIAL_INSTITUTION' } }),
      this.detailedProfilesRepository.count({ where: { accountType: 'freemium' } }),
      this.detailedProfilesRepository.count({ where: { accountType: 'standard' } }),
      this.detailedProfilesRepository.count({ where: { accountType: 'premium' } }),
      this.detailedProfilesRepository.count({ where: { accountType: 'enterprise' } }),
    ]);

    return {
      total,
      totalCustomers: total,
      active,
      inactive,
      pending,
      suspended,
      byType: {
        pme: pmeCount,
        financial: financialCount
      },
      customersByType: {
        pme: pmeCount,
        financial: financialCount
      },
      customersByStatus: {
        active,
        inactive,
        pending,
        suspended,
        flagged: 0, // TODO: Implement flagged status counting
        archived: 0 // TODO: Implement archived status counting
      },
      byAccountType: {
        freemium: freemiumCount,
        standard: standardCount,
        premium: premiumCount,
        enterprise: enterpriseCount
      },
      customersRequiringAttention: 0, // TODO: Implement attention counting
      complianceDistribution: {
        high: 0, // TODO: Implement compliance distribution
        medium: 0,
        low: 0,
        critical: 0
      },
      averageCompleteness: 0, // TODO: Implement average completeness
      urgentReviews: 0, // TODO: Implement urgent reviews counting
      profilesNeedingResync: 0, // TODO: Implement resync counting
      recentlyUpdated: 0, // TODO: Implement recent updates counting
      avgSyncLatency: 0, // TODO: Implement sync latency tracking
      pendingActions: 0, // TODO: Implement pending actions counting
      systemAlerts: 0 // TODO: Implement system alerts counting
    };
  }

  /**
   * Get customer statistics
   */
  private async getCustomerStatistics(customerId: string): Promise<{
    tokensUsed: number;
    lastActivity: Date;
    activeSubscriptions: number;
    totalSpent: number;
    documentsCount: number;
    activitiesCount: number;
  }> {
    // In a real implementation, we would query various services for this data
    // For this example, we'll return mock data
    const activities = await this.activitiesRepository.find({
      where: { customerId },
      order: { timestamp: 'DESC' },
      take: 1
    });

    return {
      tokensUsed: 250, // Mock data
      lastActivity: activities.length > 0 ? activities[0].timestamp : new Date(),
      activeSubscriptions: 1, // Mock data
      totalSpent: 500, // Mock data
      documentsCount: 0, // TODO: Count actual documents
      activitiesCount: activities.length
    };
  }

  /**
   * Helper method to map Customer entity to CustomerDto
   * @deprecated Utiliser mapDetailedProfileToDto pour les nouvelles fonctionnalités
   */
  /**
   * OPTIMISÉ : Mapper pour CustomerDetailedProfile (source unique de vérité)
   */
  private mapDetailedProfileToCustomerDto(profile: CustomerDetailedProfile): CustomerDto {
    return {
      id: profile.customerId,
      name: profile.name,
      type: profile.customerType === 'PME' ? 'pme' : 'financial' as any,
      email: profile.email,
      phone: profile.phone || '',
      address: profile.address?.street || '',
      city: profile.address?.city || '',
      country: profile.address?.country || '',
      status: profile.status as any,
      // Champs manquants dans CustomerDetailedProfile - utiliser valeurs par défaut
      billingContactName: '',
      billingContactEmail: '',
      tokenAllocation: 0,
      accountType: profile.accountType as any,
      ownerId: '',
      ownerEmail: '',
      validatedAt: profile.validationStatus?.validationDate ? new Date(profile.validationStatus.validationDate) : undefined,
      validatedBy: profile.validationStatus?.validatedBy || '',
      suspendedAt: profile.adminStatus === 'suspended' ? profile.updatedAt : undefined,
      suspendedBy: profile.reviewedBy || undefined,
      suspensionReason: profile.adminNotes || undefined,
      reactivatedAt: undefined,
      reactivatedBy: undefined,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };
  }

  /**
   * Helper method to map CustomerDocument entity to CustomerDocumentDto
   */
  private mapDocumentToDto(document: CustomerDocument): CustomerDocumentDto {
    return {
      id: document.id,
      type: document.type,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      uploadedAt: document.uploadedAt,
      uploadedBy: document.uploadedBy,
      status: document.status,
      reviewedAt: document.reviewedAt,
      reviewedBy: document.reviewedBy,
      reviewComments: document.reviewComments
    };
  }

  /**   * Helper method to map CustomerActivity entity to CustomerActivityDto
   */
  private mapActivityToDto(activity: CustomerActivity): CustomerActivityDto {
    return {
      id: activity.id,
      customerId: activity.customerId,
      type: activity.type,
      action: activity.action,
      description: activity.description,
      performedBy: activity.performedBy,
      performedByName: activity.performedByName,
      timestamp: activity.timestamp.toISOString(), // Convert Date to ISO string
      performedAt: activity.timestamp, // Add performedAt alias
      details: activity.details
    };
  }

  /**
   * Helper method to map CustomerDetailedProfile entity to CustomerDetailedProfileDto
   */
  private mapDetailedProfileToDto(profile: CustomerDetailedProfile): CustomerDetailedProfileDto {
    return {
      id: profile.id,
      customerId: profile.customerId,
      profileType: profile.profileType,
      profileData: profile.profileData,
      profileCompleteness: profile.profileCompleteness,
      adminStatus: profile.adminStatus,
      complianceRating: profile.complianceRating,
      adminNotes: profile.adminNotes,
      riskFlags: profile.riskFlags,
      needsResync: profile.needsResync,
      lastSyncAt: profile.lastSyncAt,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      lastReviewedAt: profile.lastReviewedAt,
      reviewedBy: profile.reviewedBy
    };
  }

  /**
   * Helper method to map CustomerDetailedProfile entity to AdminCustomerProfileDto
   */
  private mapDetailedProfileToAdminDto(profile: CustomerDetailedProfile): AdminCustomerProfileDto {
    return {
      id: profile.id,
      customerId: profile.customerId,
      name: profile.name || 'Unknown',
      email: profile.email || 'unknown@example.com',
      phone: profile.phone,
      customerType: profile.customerType as any,
      profileType: profile.profileType,
      logo: profile.logo,
      status: profile.status || 'pending',
      accountType: profile.accountType,
      address: profile.address,
      companyProfile: profile.companyProfile,
      institutionProfile: profile.institutionProfile,
      extendedProfile: profile.extendedProfile,
      regulatoryProfile: profile.regulatoryProfile,
      patrimoine: profile.patrimoine,
      adminStatus: profile.adminStatus,
      complianceRating: profile.complianceRating,
      profileCompleteness: profile.profileCompleteness,
      adminNotes: profile.adminNotes,
      riskFlags: profile.riskFlags,
      reviewPriority: (profile.reviewPriority || 'medium') as any,
      requiresAttention: profile.requiresAttention || false,
      needsResync: profile.needsResync,
      lastSyncAt: profile.lastSyncAt,
      lastReviewedAt: profile.lastReviewedAt,
      reviewedBy: profile.reviewedBy,
      tokenConsumption: profile.tokenConsumption,
      subscriptions: profile.subscriptions,
      users: profile.users as any,
      platformUsage: profile.platformUsage,
      financialMetrics: profile.financialMetrics,
      inventoryMetrics: profile.inventoryMetrics,
      alerts: profile.alerts,
      validationStatus: profile.validationStatus,
      riskProfile: profile.riskProfile,
      insights: profile.insights,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };
  }

  // =====================================================
  // MÉTHODES POUR GESTION DES PROFILS DÉTAILLÉS
  // =====================================================

  /**
   * Créer ou mettre à jour un profil client détaillé (appelé par Kafka)
   */
  async createOrUpdateCustomerProfile(profileData: {
    customerId: string;
    customerType: 'PME' | 'FINANCIAL';
    basicInfo: {
      name: string;
      email: string;
      phone?: string;
      logo?: string;
      address?: any;
      status: CustomerStatus;
      accountType?: AccountType;
    };
    detailedProfile: {
      companyProfile?: any;
      institutionProfile?: any;
      extendedProfile?: any;
      regulatoryProfile?: any;
      patrimoine?: any;
    };
    metadata: {
      profileCompleteness: any;
      lastSyncFromCustomerService: string;
      dataSource: string;
    };
  }): Promise<CustomerDetailedProfile> {
    let detailedProfile = await this.detailedProfilesRepository.findOne({
      where: { customerId: profileData.customerId }
    });

    if (detailedProfile) {
      // Mise à jour du profil existant
      Object.assign(detailedProfile, {
        customerType: profileData.customerType === 'FINANCIAL' ? 'FINANCIAL_INSTITUTION' : 'PME',
        profileType: profileData.customerType === 'FINANCIAL' ? 'institution' : 'company',
        profileData: profileData.detailedProfile,
        profileCompleteness: profileData.metadata.profileCompleteness?.percentage || 0,
        complianceRating: this.calculateComplianceRating(profileData),
        lastSyncAt: new Date(),
        name: profileData.basicInfo.name,
        email: profileData.basicInfo.email,
        phone: profileData.basicInfo.phone,
        logo: profileData.basicInfo.logo,
        address: profileData.basicInfo.address,
        status: profileData.basicInfo.status,
        accountType: profileData.basicInfo.accountType,
        companyProfile: profileData.detailedProfile.companyProfile,
        institutionProfile: profileData.detailedProfile.institutionProfile,
        extendedProfile: profileData.detailedProfile.extendedProfile,
        regulatoryProfile: profileData.detailedProfile.regulatoryProfile,
        patrimoine: profileData.detailedProfile.patrimoine,
        profileCompletenessDetails: profileData.metadata.profileCompleteness,
        syncMetadata: {
          ...detailedProfile.syncMetadata,
          lastSyncFromCustomerService: profileData.metadata.lastSyncFromCustomerService,
          dataSource: profileData.metadata.dataSource,
        },
        syncStatus: 'synced' as const,
      });
    } else {
      // Création d'un nouveau profil
      detailedProfile = this.detailedProfilesRepository.create();
      detailedProfile.customerId = profileData.customerId;
      detailedProfile.customerType = profileData.customerType === 'FINANCIAL' ? 'FINANCIAL_INSTITUTION' : 'PME';
      detailedProfile.profileType = profileData.customerType === 'FINANCIAL' ? ProfileType.INSTITUTION : ProfileType.COMPANY;
      detailedProfile.profileData = profileData.detailedProfile;
      detailedProfile.profileCompleteness = profileData.metadata.profileCompleteness?.percentage || 0;
      detailedProfile.complianceRating = this.calculateComplianceRating(profileData);
      detailedProfile.adminStatus = AdminStatus.UNDER_REVIEW;
      detailedProfile.riskFlags = [];
      detailedProfile.needsResync = false;
      detailedProfile.lastSyncAt = new Date();
      detailedProfile.name = profileData.basicInfo.name;
      detailedProfile.email = profileData.basicInfo.email;
      detailedProfile.phone = profileData.basicInfo.phone;
      detailedProfile.logo = profileData.basicInfo.logo;
      detailedProfile.address = profileData.basicInfo.address;
      detailedProfile.status = profileData.basicInfo.status;
      detailedProfile.accountType = profileData.basicInfo.accountType;
      detailedProfile.companyProfile = profileData.detailedProfile.companyProfile;
      detailedProfile.institutionProfile = profileData.detailedProfile.institutionProfile;
      detailedProfile.extendedProfile = profileData.detailedProfile.extendedProfile;
      detailedProfile.regulatoryProfile = profileData.detailedProfile.regulatoryProfile;
      detailedProfile.patrimoine = profileData.detailedProfile.patrimoine;
      detailedProfile.profileCompletenessDetails = profileData.metadata.profileCompleteness;
      detailedProfile.syncMetadata = {
        lastSyncFromCustomerService: profileData.metadata.lastSyncFromCustomerService,
        dataSource: profileData.metadata.dataSource,
      };
      detailedProfile.syncStatus = 'synced';
    }

    const savedProfile = await this.detailedProfilesRepository.save(detailedProfile);

    // Log de l'activité
    await this.logActivity({
      customerId: profileData.customerId,
      type: 'profile_sync',
      action: detailedProfile.id ? 'profile_updated' : 'profile_created',
      description: `Profil ${detailedProfile.id ? 'mis à jour' : 'créé'} depuis customer-service`,
      performedBy: 'system',
      performedByName: 'Customer Service Sync',
      details: {
        profileCompleteness: profileData.metadata.profileCompleteness.percentage,
        dataSource: profileData.metadata.dataSource,
      }
    });

    return savedProfile;
  }

  /**
   * Marquer un client pour resynchronisation
   */
  async markCustomerForResync(customerId: string, updateInfo: {
    lastUpdateNotified: string;
    updatedFields: string[];
    updateContext: any;
  }): Promise<void> {
    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (profile) {
      profile.syncStatus = 'pending_sync';
      profile.syncMetadata = {
        ...profile.syncMetadata,
        lastUpdateNotified: updateInfo.lastUpdateNotified,
        updatedFields: updateInfo.updatedFields,
        updateContext: updateInfo.updateContext,
      };

      await this.detailedProfilesRepository.save(profile);

      this.logger.log(`Marked customer ${customerId} for resync due to profile updates`);
    }
  }

  /**
   * Demander une synchronisation de profil immédiate
   */
  async requestCustomerProfileSync(customerId: string, syncRequest: {
    requestedData: string[];
    requestId: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
  }): Promise<void> {
    // TODO: Implémenter l'envoi d'une demande Kafka vers customer-service
    // pour demander une synchronisation immédiate
    
    this.logger.log(`Requesting immediate profile sync for customer ${customerId} (${syncRequest.priority} priority)`);
    
    // Marquer le profil comme ayant une synchronisation en attente
    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (profile) {
      profile.syncStatus = 'pending_sync';
      await this.detailedProfilesRepository.save(profile);
    }
  }

  /**
   * Programmer une synchronisation de profil
   */
  async scheduleCustomerProfileSync(customerId: string, syncRequest: {
    requestedData: string[];
    requestId: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    scheduledFor: Date;
  }): Promise<void> {
    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (profile) {
      profile.syncStatus = 'sync_scheduled';
      profile.nextScheduledSync = syncRequest.scheduledFor;
      await this.detailedProfilesRepository.save(profile);

      this.logger.log(`Scheduled profile sync for customer ${customerId} at ${syncRequest.scheduledFor.toISOString()}`);
    }
  }

  /**
   * Récupérer le profil détaillé d'un client pour les admins
   */
  async getCustomerDetailedProfile(customerId: string): Promise<CustomerDetailedProfile | null> {
    return await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });
  }

  /**
   * Lister tous les profils clients avec filtres pour l'interface admin
   */
  async getCustomerDetailedProfiles(filters: {
    customerType?: 'PME' | 'FINANCIAL_INSTITUTION';
    adminStatus?: string;
    reviewPriority?: string;
    syncStatus?: string;
    minCompleteness?: number;
    requiresAttention?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<{
    profiles: CustomerDetailedProfile[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.detailedProfilesRepository.createQueryBuilder('profile');

    // Filtres
    if (filters.customerType) {
      queryBuilder.andWhere('profile.customerType = :customerType', { customerType: filters.customerType });
    }

    if (filters.adminStatus) {
      queryBuilder.andWhere('profile.adminStatus = :adminStatus', { adminStatus: filters.adminStatus });
    }

    if (filters.reviewPriority) {
      queryBuilder.andWhere('profile.reviewPriority = :reviewPriority', { reviewPriority: filters.reviewPriority });
    }

    if (filters.syncStatus) {
      queryBuilder.andWhere('profile.syncStatus = :syncStatus', { syncStatus: filters.syncStatus });
    }

    if (filters.minCompleteness !== undefined) {
      queryBuilder.andWhere("CAST(profile.profileCompleteness->>'percentage' AS INTEGER) >= :minCompleteness", { 
        minCompleteness: filters.minCompleteness 
      });
    }

    if (filters.requiresAttention) {
      queryBuilder.andWhere(
        "(profile.adminStatus IN ('requires_attention', 'flagged') OR profile.reviewPriority IN ('high', 'urgent') OR CAST(profile.profileCompleteness->>'percentage' AS INTEGER) < 70)"
      );
    }

    if (filters.search) {
      queryBuilder.andWhere(
        "(profile.name ILIKE :search OR profile.email ILIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    // Tri par priorité de révision et date de mise à jour
    queryBuilder.orderBy('profile.reviewPriority', 'DESC');
    queryBuilder.addOrderBy('profile.updatedAt', 'DESC');

    // Pagination
    queryBuilder.skip(skip).take(limit);

    const [profiles, total] = await queryBuilder.getManyAndCount();

    return {
      profiles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Mettre à jour le statut administratif d'un profil
   */
  async updateProfileAdminStatus(customerId: string, updates: {
    adminStatus?: AdminStatus;
    adminNotes?: string;
    adminId: string;
    adminName: string;
    reason?: string;
  }): Promise<CustomerDetailedProfile> {
    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (!profile) {
      throw new NotFoundException(`Profil détaillé non trouvé pour le client ${customerId}`);
    }

    // Mettre à jour les champs administratifs
    if (updates.adminStatus) profile.adminStatus = updates.adminStatus;
    if (updates.adminNotes !== undefined) profile.adminNotes = updates.adminNotes;

    // Mettre à jour les champs de suivi
    profile.lastReviewedAt = new Date();
    profile.reviewedBy = updates.adminId;

    const savedProfile = await this.detailedProfilesRepository.save(profile);

    // Log de l'activité
    await this.logActivity({
      customerId,
      type: 'admin_action',
      action: 'profile_status_updated',
      description: `Statut administratif mis à jour: ${updates.adminStatus || 'non modifié'}`,
      performedBy: updates.adminId,
      performedByName: updates.adminName,
      details: {
        previousStatus: profile.adminStatus,
        newStatus: updates.adminStatus,
        reason: updates.reason,
      }
    });

    return savedProfile;
  }

  // === DETAILED CUSTOMER PROFILES ENDPOINTS METHODS ===

  /**
   * Obtenir tous les profils détaillés avec filtrage
   */
  async getDetailedProfiles(queryParams: ProfileQueryParamsDto): Promise<CustomerDetailedProfileListDto> {
    try {
      const {
        page = 1,
        limit = 10,
        profileType,
        adminStatus,
        complianceRating,
        needsResync,
        minCompleteness,
        maxCompleteness,
        search
      } = queryParams;

      const queryBuilder = this.detailedProfilesRepository.createQueryBuilder('profile');

      // Filtres
      if (profileType) {
        queryBuilder.andWhere('profile.profileType = :profileType', { profileType });
      }

      if (adminStatus) {
        queryBuilder.andWhere('profile.adminStatus = :adminStatus', { adminStatus });
      }

      if (complianceRating) {
        queryBuilder.andWhere('profile.complianceRating = :complianceRating', { complianceRating });
      }

      if (needsResync !== undefined) {
        queryBuilder.andWhere('profile.needsResync = :needsResync', { needsResync });
      }

      if (minCompleteness !== undefined) {
        queryBuilder.andWhere('profile.profileCompleteness >= :minCompleteness', { minCompleteness });
      }

      if (maxCompleteness !== undefined) {
        queryBuilder.andWhere('profile.profileCompleteness <= :maxCompleteness', { maxCompleteness });
      }

      if (search) {
        queryBuilder.andWhere(
          '(profile.profileData::text ILIKE :search OR profile.adminNotes ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      // Pagination
      const offset = (page - 1) * limit;
      queryBuilder.offset(offset).limit(limit);

      // Ordre par défaut
      queryBuilder.orderBy('profile.updatedAt', 'DESC');

      const [profiles, total] = await queryBuilder.getManyAndCount();

      return {
        profiles: profiles.map(profile => this.mapDetailedProfileToDto(profile)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      this.logger.error(`Failed to get detailed profiles: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get detailed profiles');
    }
  }

  /**
   * Obtenir les statistiques des profils détaillés
   */
  async getProfileStatistics(): Promise<ProfileStatisticsDto> {
    try {
      const totalProfiles = await this.detailedProfilesRepository.count();

      const profilesByType = await this.detailedProfilesRepository
        .createQueryBuilder('profile')
        .select('profile.profileType, COUNT(*) as count')
        .groupBy('profile.profileType')
        .getRawMany();

      const profilesByAdminStatus = await this.detailedProfilesRepository
        .createQueryBuilder('profile')
        .select('profile.adminStatus, COUNT(*) as count')
        .groupBy('profile.adminStatus')
        .getRawMany();

      const profilesByComplianceRating = await this.detailedProfilesRepository
        .createQueryBuilder('profile')
        .select('profile.complianceRating, COUNT(*) as count')
        .groupBy('profile.complianceRating')
        .getRawMany();

      const avgCompleteness = await this.detailedProfilesRepository
        .createQueryBuilder('profile')
        .select('AVG(profile.profileCompleteness)', 'average')
        .getRawOne();

      const profilesNeedingResync = await this.detailedProfilesRepository.count({
        where: { needsResync: true }
      });

      const recentlyUpdated = await this.detailedProfilesRepository.count({
        where: {
          updatedAt: MoreThan(new Date(Date.now() - 24 * 60 * 60 * 1000)) // Dernières 24h
        }
      });

      return {
        totalProfiles,
        profilesByType: {
          company: profilesByType.find(p => p.profileType === 'company')?.count || 0,
          institution: profilesByType.find(p => p.profileType === 'institution')?.count || 0
        },
        profilesByAdminStatus: {
          under_review: profilesByAdminStatus.find(p => p.adminStatus === 'under_review')?.count || 0,
          validated: profilesByAdminStatus.find(p => p.adminStatus === 'validated')?.count || 0,
          flagged: profilesByAdminStatus.find(p => p.adminStatus === 'flagged')?.count || 0,
          suspended: profilesByAdminStatus.find(p => p.adminStatus === 'suspended')?.count || 0,
          archived: profilesByAdminStatus.find(p => p.adminStatus === 'archived')?.count || 0
        },
        profilesByComplianceRating: {
          high: profilesByComplianceRating.find(p => p.complianceRating === 'high')?.count || 0,
          medium: profilesByComplianceRating.find(p => p.complianceRating === 'medium')?.count || 0,
          low: profilesByComplianceRating.find(p => p.complianceRating === 'low')?.count || 0,
          critical: profilesByComplianceRating.find(p => p.complianceRating === 'critical')?.count || 0
        },
        averageCompleteness: parseFloat(avgCompleteness?.average || 0),
        profilesNeedingResync,
        recentlyUpdated
      };
    } catch (error: any) {
      this.logger.error(`Failed to get profile statistics: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get profile statistics');
    }
  }

  /**
   * Obtenir un profil détaillé spécifique
   */
  async getDetailedProfile(profileId: string): Promise<CustomerDetailedProfileDto> {
    const profile = await this.detailedProfilesRepository.findOne({
      where: { id: profileId }
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${profileId} not found`);
    }

    return this.mapDetailedProfileToDto(profile);
  }

  /**
   * Obtenir un profil détaillé par ID client original
   */
  async getDetailedProfileByCustomerId(customerId: string): Promise<CustomerDetailedProfileDto> {
    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (!profile) {
      throw new NotFoundException(`Profile for customer ID ${customerId} not found`);
    }

    return this.mapDetailedProfileToDto(profile);
  }

  /**
   * Mettre à jour le statut d'un profil
   */
  async updateProfileStatus(profileId: string, updateData: UpdateProfileStatusDto, reviewerId: string): Promise<CustomerDetailedProfileDto> {
    try {
      const profile = await this.detailedProfilesRepository.findOne({
        where: { id: profileId }
      });

      if (!profile) {
        throw new NotFoundException(`Profile with ID ${profileId} not found`);
      }

      // Mettre à jour les champs
      if (updateData.adminStatus) profile.adminStatus = updateData.adminStatus;
      if (updateData.complianceRating) profile.complianceRating = updateData.complianceRating;
      if (updateData.adminNotes !== undefined) profile.adminNotes = updateData.adminNotes;
      if (updateData.riskFlags) profile.riskFlags = updateData.riskFlags;

      profile.lastReviewedAt = new Date();
      profile.reviewedBy = reviewerId;

      const savedProfile = await this.detailedProfilesRepository.save(profile);

      // Log de l'activité
      await this.logActivity({
        customerId: profile.customerId,
        type: 'admin_action',
        action: 'profile_status_updated',
        description: `Profile status updated - Admin: ${updateData.adminStatus}, Compliance: ${updateData.complianceRating}`,
        performedBy: reviewerId,
        details: updateData
      });

      return this.mapDetailedProfileToDto(savedProfile);
    } catch (error: any) {
      this.logger.error(`Failed to update profile status: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update profile status');
    }
  }

  /**
   * Demander une resynchronisation de profil
   */
  async requestProfileResync(profileId: string, reason: string = '', requestedBy: string): Promise<CustomerDetailedProfile> {
    try {
      const profile = await this.detailedProfilesRepository.findOne({
        where: { id: profileId }
      });

      if (!profile) {
        throw new NotFoundException(`Profile with ID ${profileId} not found`);
      }

      profile.needsResync = true;
      profile.lastReviewedAt = new Date();
      profile.reviewedBy = requestedBy;

      if (reason) {
        profile.adminNotes = profile.adminNotes 
          ? `${profile.adminNotes}\n\n[RESYNC REQUEST] ${reason}`
          : `[RESYNC REQUEST] ${reason}`;
      }

      const savedProfile = await this.detailedProfilesRepository.save(profile);

      // Publier un événement pour demander la resynchronisation
      await this.eventsService.publishCustomerSyncRequested({
        customerId: profile.customerId,
        profileType: profile.profileType,
        reason,
        requestedBy,
        timestamp: new Date().toISOString()
      });

      // Log de l'activité
      await this.logActivity({
        customerId: profile.customerId,
        type: 'admin_action',
        action: 'resync_requested',
        description: `Profile resync requested - Reason: ${reason}`,
        performedBy: requestedBy,
        details: { reason, profileType: profile.profileType }
      });

      return savedProfile;
    } catch (error: any) {
      this.logger.error(`Failed to request profile resync: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to request profile resync');
    }
  }

  /**
   * Archiver un profil
   */
  async archiveProfile(profileId: string, archivedBy: string): Promise<CustomerDetailedProfile> {
    try {
      const profile = await this.detailedProfilesRepository.findOne({
        where: { id: profileId }
      });

      if (!profile) {
        throw new NotFoundException(`Profile with ID ${profileId} not found`);
      }

      profile.adminStatus = AdminStatus.ARCHIVED;
      profile.lastReviewedAt = new Date();
      profile.reviewedBy = archivedBy;

      const savedProfile = await this.detailedProfilesRepository.save(profile);

      // Log de l'activité
      await this.logActivity({
        customerId: profile.customerId,
        type: 'admin_action',
        action: 'profile_archived',
        description: 'Profile archived by admin',
        performedBy: archivedBy,
        details: { profileType: profile.profileType }
      });

      return savedProfile;
    } catch (error: any) {
      this.logger.error(`Failed to archive profile: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to archive profile');
    }
  }

  /**
   * Obtenir tous les profils signalés
   */
  async getFlaggedProfiles(queryParams: any): Promise<any> {
    try {
      const {
        page = 1,
        limit = 10,
        profileType,
        complianceRating
      } = queryParams;

      const queryBuilder = this.detailedProfilesRepository.createQueryBuilder('profile')
        .where('profile.adminStatus = :adminStatus', { adminStatus: 'flagged' });

      if (profileType) {
        queryBuilder.andWhere('profile.profileType = :profileType', { profileType });
      }

      if (complianceRating) {
        queryBuilder.andWhere('profile.complianceRating = :complianceRating', { complianceRating });
      }

      const offset = (page - 1) * limit;
      queryBuilder.offset(offset).limit(limit);
      queryBuilder.orderBy('profile.updatedAt', 'DESC');

      const [profiles, total] = await queryBuilder.getManyAndCount();

      return {
        profiles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      this.logger.error(`Failed to get flagged profiles: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get flagged profiles');
    }
  }

  /**
   * Obtenir tous les profils nécessitant une resynchronisation
   */
  async getProfilesNeedingResync(queryParams: any): Promise<any> {
    try {
      const {
        page = 1,
        limit = 10,
        profileType
      } = queryParams;

      const queryBuilder = this.detailedProfilesRepository.createQueryBuilder('profile')
        .where('profile.needsResync = :needsResync', { needsResync: true });

      if (profileType) {
        queryBuilder.andWhere('profile.profileType = :profileType', { profileType });
      }

      const offset = (page - 1) * limit;
      queryBuilder.offset(offset).limit(limit);
      queryBuilder.orderBy('profile.updatedAt', 'DESC');

      const [profiles, total] = await queryBuilder.getManyAndCount();

      return {
        profiles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error: any) {
      this.logger.error(`Failed to get profiles needing resync: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get profiles needing resync');
    }
  }

  /**
   * Calcule le rating de compliance basé sur les données du profil
   */
  private calculateComplianceRating(profileData: any): ComplianceRating {
    const completeness = profileData.metadata.profileCompleteness?.percentage || 0;
    const hasRequiredDocs = profileData.basicInfo.status === 'validated';
    const isRegulated = profileData.customerType === 'FINANCIAL';

    if (completeness >= 90 && hasRequiredDocs) {
      return ComplianceRating.HIGH;
    } else if (completeness >= 70 && hasRequiredDocs) {
      return ComplianceRating.MEDIUM;
    } else if (completeness >= 50) {
      return ComplianceRating.LOW;
    } else {
      return ComplianceRating.CRITICAL;
    }
  }

  /**
   * Enregistre une activité dans le système de logs
   */
  private async logActivity(activityData: {
    customerId: string;
    type: string;
    action: string;
    description: string;
    performedBy: string;
    performedByName?: string;
    details?: any;
  }): Promise<void> {
    try {
      // Log simple pour l'instant - pourrait être étendu avec une vraie entité Activity
      this.logger.log(`Activity logged: ${activityData.action} for customer ${activityData.customerId} by ${activityData.performedByName || activityData.performedBy}`, {
        ...activityData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error('Failed to log activity', error);
    }
  }

  // =====================================================
  // NOUVELLES MÉTHODES POUR TRAITEMENT DES DONNÉES V2.1
  // =====================================================

  /**
   * Met à jour les données spécialisées d'un client (v2.1)
   */
  async updateCustomerSpecificData(customerId: string, data: {
    dataType: string;
    specificData: any;
    version: string;
    receivedAt: string;
  }): Promise<void> {
    let profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (!profile) {
      // Créer un nouveau profil si nécessaire
      profile = this.detailedProfilesRepository.create({
        customerId,
        profileType: data.dataType.includes('FINANCIAL') ? ProfileType.INSTITUTION : ProfileType.COMPANY,
        customerType: data.dataType.includes('FINANCIAL') ? 'FINANCIAL_INSTITUTION' : 'PME',
        profileData: {},
        adminStatus: AdminStatus.UNDER_REVIEW,
        complianceRating: ComplianceRating.MEDIUM,
        profileCompleteness: 0,
        riskFlags: [],
        needsResync: false,
        syncStatus: 'synced',
      });
    }

    // Mettre à jour avec les données spécialisées
    profile.specificData = {
      ...profile.specificData,
      [data.dataType]: data.specificData,
    };
    profile.dataVersion = data.version;
    profile.lastSyncAt = new Date(data.receivedAt);
    profile.syncStatus = 'synced';

    await this.detailedProfilesRepository.save(profile);
  }

  /**
   * Met à jour les métriques de complétude d'un client
   */
  async updateCustomerCompleteness(customerId: string, completeness: {
    overallPercentage: number;
    sections: any;
    missingCriticalFields: string[];
    lastCalculated: string;
  }): Promise<void> {
    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (profile) {
      profile.profileCompleteness = completeness.overallPercentage;
      profile.profileCompletenessDetails = {
        percentage: completeness.overallPercentage,
        missingFields: completeness.missingCriticalFields,
        completedSections: Object.keys(completeness.sections).filter(key => completeness.sections[key]),
        sections: completeness.sections,
        missingCriticalFields: completeness.missingCriticalFields,
        lastCalculated: completeness.lastCalculated,
      };
      
      await this.detailedProfilesRepository.save(profile);
    }
  }

  /**
   * Met à jour les données de patrimoine d'un client
   */
  async updateCustomerAssets(customerId: string, assetData: {
    assets: any[];
    summary: any;
    version: string;
    receivedAt: string;
  }): Promise<void> {
    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (profile) {
      profile.patrimoine = {
        assets: assetData.assets,
        stocks: profile.patrimoine?.stocks || [],
        assetsSummary: {
          ...assetData.summary,
          lastAssetsUpdate: assetData.receivedAt,
        },
        stocksSummary: profile.patrimoine?.stocksSummary || {
          totalValue: 0,
          currency: 'CDF',
          totalItems: 0,
          lowStockItemsCount: 0,
          outOfStockItemsCount: 0,
          lastStockUpdate: new Date().toISOString(),
        },
        totalAssetsValue: assetData.summary.totalValue,
        totalStocksValue: profile.patrimoine?.totalStocksValue || 0,
        totalPatrimoineValue: assetData.summary.totalValue + (profile.patrimoine?.totalStocksValue || 0),
        lastValuationDate: new Date().toISOString(),
      };
      
      await this.detailedProfilesRepository.save(profile);
    }
  }

  /**
   * Met à jour les métriques financières d'un client
   */
  async updateFinancialMetrics(customerId: string, metrics: {
    totalAssetsValue: number;
    assetsCount: number;
    depreciationRate: number;
    lastAssetsUpdate: string;
  }): Promise<void> {
    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (profile) {
      profile.inventoryMetrics = {
        ...profile.inventoryMetrics,
        totalAssetsValue: metrics.totalAssetsValue,
        assetsCount: metrics.assetsCount,
        depreciationRate: metrics.depreciationRate,
        lastAssetsUpdate: metrics.lastAssetsUpdate,
      };
      
      await this.detailedProfilesRepository.save(profile);
    }
  }

  /**
   * Met à jour les données de stock d'un client
   */
  async updateCustomerStocks(customerId: string, stockData: {
    stocks: any[];
    summary: any;
    version: string;
    receivedAt: string;
  }): Promise<void> {
    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (profile) {
      profile.patrimoine = {
        assets: profile.patrimoine?.assets || [],
        stocks: stockData.stocks,
        assetsSummary: profile.patrimoine?.assetsSummary || {
          totalValue: 0,
          currency: 'CDF',
          count: 0,
          byCategory: {},
          depreciationRate: 0,
          lastAssetsUpdate: new Date().toISOString(),
        },
        stocksSummary: {
          ...stockData.summary,
          lastStockUpdate: stockData.receivedAt,
        },
        totalAssetsValue: profile.patrimoine?.totalAssetsValue || 0,
        totalStocksValue: stockData.summary.totalValue,
        totalPatrimoineValue: (profile.patrimoine?.totalAssetsValue || 0) + stockData.summary.totalValue,
        lastValuationDate: new Date().toISOString(),
      };
      
      await this.detailedProfilesRepository.save(profile);
    }
  }

  /**
   * Crée des alertes de stock pour un client
   */
  async createStockAlerts(customerId: string, alertData: {
    lowStockItems: any[];
    alertLevel: string;
    createdAt: string;
  }): Promise<void> {
    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (profile) {
      if (!profile.alerts) profile.alerts = [];
      
      profile.alerts.push({
        type: 'stock_alert',
        level: alertData.alertLevel,
        message: `${alertData.lowStockItems.length} articles en stock faible`,
        data: alertData.lowStockItems,
        createdAt: alertData.createdAt,
        acknowledged: false,
      });
      
      await this.detailedProfilesRepository.save(profile);
    }
  }

  /**
   * Met à jour les métriques d'inventaire d'un client
   */
  async updateInventoryMetrics(customerId: string, metrics: {
    totalStockValue: number;
    totalItems: number;
    lowStockItemsCount: number;
    lastStockUpdate: string;
    rotationMetrics: any;
  }): Promise<void> {
    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (profile) {
      profile.inventoryMetrics = {
        ...profile.inventoryMetrics,
        totalStockValue: metrics.totalStockValue,
        totalItems: metrics.totalItems,
        lowStockItemsCount: metrics.lowStockItemsCount,
        lastStockUpdate: metrics.lastStockUpdate,
        rotationMetrics: metrics.rotationMetrics,
      };
      
      await this.detailedProfilesRepository.save(profile);
    }
  }

  /**
   * Met à jour l'identification étendue d'un client
   */
  async updateCustomerExtendedIdentification(customerId: string, data: {
    identification: any;
    version: string;
    receivedAt: string;
  }): Promise<void> {
    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (profile) {
      profile.extendedProfile = {
        ...profile.extendedProfile,
        identification: data.identification,
        lastIdentificationUpdate: data.receivedAt,
      };
      
      await this.detailedProfilesRepository.save(profile);
    }
  }

  /**
   * Met à jour le statut de validation d'un client
   */
  async updateCustomerValidationStatus(customerId: string, status: {
    identificationComplete: boolean;
    validatedBy: string;
    validationDate?: string;
    completionPercentage: number;
  }): Promise<void> {
    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (profile) {
      profile.validationStatus = {
        ...profile.validationStatus,
        identificationComplete: status.identificationComplete,
        validatedBy: status.validatedBy,
        validationDate: status.validationDate,
        completionPercentage: status.completionPercentage,
      };
      
      if (status.identificationComplete) {
        profile.adminStatus = AdminStatus.VALIDATED;
      }
      
      await this.detailedProfilesRepository.save(profile);
    }
  }

  /**
   * Met à jour le profil de risque d'un client
   */
  async updateCustomerRiskProfile(customerId: string, riskAssessment: {
    overallRiskScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    recommendations: string[];
  }): Promise<void> {
    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (profile) {
      profile.riskProfile = {
        ...profile.riskProfile,
        overallRiskScore: riskAssessment.overallRiskScore,
        riskLevel: riskAssessment.riskLevel,
        riskFactors: riskAssessment.riskFactors,
        recommendations: riskAssessment.recommendations,
        lastAssessment: new Date().toISOString(),
      };

      // Mettre à jour les flags de risque si nécessaire
      if (riskAssessment.riskLevel === 'high') {
        profile.riskFlags = [...(profile.riskFlags || []), 'high_risk_assessment'];
        profile.adminStatus = AdminStatus.FLAGGED;
      }
      
      await this.detailedProfilesRepository.save(profile);
    }
  }

  /**
   * Traite un profil complet v2.1
   */
  async processCompleteProfileV21(customerId: string, profileData: {
    basicInfo: any;
    customerType: string;
    specificData: any;
    extendedData: any;
    metadata: any;
  }): Promise<CustomerDetailedProfile> {
    let profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (!profile) {
      profile = this.detailedProfilesRepository.create();
      profile.customerId = customerId;
      profile.profileType = profileData.customerType === 'FINANCIAL_INSTITUTION' ? ProfileType.INSTITUTION : ProfileType.COMPANY;
      profile.customerType = profileData.customerType as 'PME' | 'FINANCIAL_INSTITUTION';
      profile.adminStatus = AdminStatus.UNDER_REVIEW;
      profile.complianceRating = ComplianceRating.MEDIUM;
      profile.profileCompleteness = 0;
      profile.riskFlags = [];
      profile.needsResync = false;
      profile.syncStatus = 'synced';
      profile.profileData = {};
      profile.reviewPriority = 'medium';
      profile.requiresAttention = false;
      profile.name = 'Unknown';
      profile.email = 'unknown@example.com';
      profile.status = 'pending';
      profile.syncMetadata = {
        lastSyncFromCustomerService: new Date().toISOString(),
        dataSource: 'customer-service-kafka-v2.1',
      };
      profile.lastSyncAt = new Date();
    }

    // Mise à jour complète du profil
    Object.assign(profile, {
      name: profileData.basicInfo.name,
      email: profileData.basicInfo.email,
      phone: profileData.basicInfo.phone,
      logo: profileData.basicInfo.logo,
      address: profileData.basicInfo.address,
      status: profileData.basicInfo.status,
      accountType: profileData.basicInfo.accountType,
      
      // Données spécialisées selon le type
      ...(profileData.customerType === 'FINANCIAL_INSTITUTION' ? {
        institutionProfile: profileData.specificData,
      } : {
        companyProfile: profileData.specificData,
      }),
      
      // Données étendues
      extendedProfile: profileData.extendedData.identification,
      patrimoine: profileData.extendedData.patrimoine,
      complianceData: profileData.extendedData.compliance,
      performanceMetrics: profileData.extendedData.performance,
      
      // Métadonnées
      dataVersion: profileData.metadata.dataVersion,
      profileCompleteness: profileData.metadata.profileCompleteness.percentage,
      profileCompletenessDetails: profileData.metadata.profileCompleteness,
      lastSyncAt: new Date(),
      syncStatus: 'synced',
      syncMetadata: {
        ...profile.syncMetadata,
        lastSyncFromCustomerService: profileData.metadata.lastSyncFromCustomerService,
        dataSource: profileData.metadata.dataSource,
      },
    });

    return await this.detailedProfilesRepository.save(profile);
  }

  /**
   * Met à jour les insights d'un client
   */
  async updateCustomerInsights(customerId: string, insights: {
    insights: string[];
    recommendations: string[];
    opportunitiesIdentified: string[];
    alertsTriggered: string[];
  }): Promise<void> {
    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (profile) {
      profile.insights = {
        ...profile.insights,
        insights: insights.insights,
        recommendations: insights.recommendations,
        opportunities: insights.opportunitiesIdentified,
        alerts: insights.alertsTriggered,
        lastGenerated: new Date().toISOString(),
      };
      
      await this.detailedProfilesRepository.save(profile);
    }
  }

  /**
   * Traite les changements à fort impact
   */
  async processHighImpactChanges(customerId: string, data: {
    changes: any[];
    syncType: string;
    requiresApproval?: boolean;
    requestId: string;
  }): Promise<void> {
    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (profile) {
      // Créer une entrée pour les changements critiques
      if (!profile.criticalChanges) profile.criticalChanges = [];
      
      profile.criticalChanges.push({
        requestId: data.requestId,
        changes: data.changes,
        syncType: data.syncType,
        requiresApproval: data.requiresApproval,
        status: data.requiresApproval ? 'pending_approval' : 'applied',
        createdAt: new Date().toISOString(),
      });

      // Si approbation requise, marquer le profil comme nécessitant attention
      if (data.requiresApproval) {
        profile.adminStatus = AdminStatus.REQUIRES_ATTENTION;
        profile.riskFlags = [...(profile.riskFlags || []), 'requires_approval'];
      }
      
      await this.detailedProfilesRepository.save(profile);
    }
  }

  /**
   * Applique les changements de synchronisation
   */
  async applySyncChanges(customerId: string, data: {
    changes: any[];
    syncType: string;
    priority: string;
    source: string;
    appliedAt: string;
  }): Promise<void> {
    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (profile) {
      // Appliquer les changements selon leur type
      for (const change of data.changes) {
        if (change.field.startsWith('profileData.')) {
          const fieldPath = change.field.replace('profileData.', '');
          this.setNestedProperty(profile.profileData, fieldPath, change.newValue);
        } else if (change.field in profile) {
          (profile as any)[change.field] = change.newValue;
        }
      }

      // Mettre à jour les métadonnées de synchronisation
      profile.lastSyncAt = new Date(data.appliedAt);
      profile.syncStatus = 'synced';
      profile.syncMetadata = {
        ...profile.syncMetadata,
        syncVersion: data.syncType,
        dataSource: data.source,
        updateContext: { changesApplied: data.changes.length },
      };
      
      await this.detailedProfilesRepository.save(profile);
    }
  }

  /**
   * Programme une revalidation de profil
   */
  async scheduleProfileRevalidation(customerId: string, data: {
    reason: string;
    priority: string;
    requestId: string;
  }): Promise<void> {
    const profile = await this.detailedProfilesRepository.findOne({
      where: { customerId }
    });

    if (profile) {
      profile.revalidationScheduled = {
        reason: data.reason,
        priority: data.priority,
        requestId: data.requestId,
        scheduledAt: new Date().toISOString(),
        status: 'scheduled',
      };

      // Mettre le profil en revue si priorité élevée
      if (data.priority === 'high') {
        profile.adminStatus = AdminStatus.UNDER_REVIEW;
      }
      
      await this.detailedProfilesRepository.save(profile);
    }
  }

  /**
   * Utilitaire pour définir une propriété imbriquée
   */
  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }
}
