import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from '../entities/institution.entity'; // Removed InstitutionType import as it's not directly used here
import { InstitutionDocument, DocumentType } from '../entities/institution-document.entity';
import { InstitutionUser, UserRole } from '../entities/institution-user.entity';
import { CreateInstitutionDto, UpdateInstitutionDto } from '../dtos/institution.dto';
import {
  UserCreatedEventData,
  SubscriptionStatusType,
  SubscriptionPlanType,
  EventUserType,
  InstitutionEventTopics,
  InstitutionCreatedEventData,
  InstitutionProfileUpdatedEventData,
  InstitutionStatusChangedEventData,
  InstitutionStatusType // Added import for InstitutionStatusType
} from '@wanzobe/shared';
import { PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE } from '../../events/events.module'; // Import the constant

@Injectable()
export class InstitutionService {
  private readonly logger = new Logger(InstitutionService.name);

  constructor(
    @InjectRepository(Institution)
    private institutionRepository: Repository<Institution>,
    @InjectRepository(InstitutionDocument)
    private documentRepository: Repository<InstitutionDocument>,
    @InjectRepository(InstitutionUser)
    private institutionUserRepository: Repository<InstitutionUser>,
    @Inject(PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE) private readonly kafkaClient: ClientKafka, // Use the imported constant
  ) {}

  async create(createInstitutionDto: CreateInstitutionDto, userId: string): Promise<Institution> {
    const kiotaId = `KIOTA-INS-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;

    // Create institution
    const { documents, ...institutionData } = createInstitutionDto;
    const institution = this.institutionRepository.create({
      ...institutionData,
      kiotaId,
      createdBy: userId,
      metadata: { initiatedBy: userId }, // Added initial metadata
      // active: true, // Institutions are active by default on creation by admin <-- Removed
      status: InstitutionStatusType.PENDING_VERIFICATION, // Set initial status
      active: false, // Set active to false as status is PENDING_VERIFICATION
    });

    const savedInstitution = await this.institutionRepository.save(institution) as unknown as Institution;

    // Emit INSTITUTION_CREATED event
    const eventData: InstitutionCreatedEventData = {
      institutionId: savedInstitution.id,
      name: savedInstitution.name,
      kiotaId: savedInstitution.kiotaId,
      type: savedInstitution.type,
      createdByUserId: userId,
      timestamp: new Date(),
      metadata: savedInstitution.metadata,
    };
    this.kafkaClient.emit(InstitutionEventTopics.INSTITUTION_CREATED, JSON.stringify(eventData));
    this.logger.log(`Emitted ${InstitutionEventTopics.INSTITUTION_CREATED} for institution ${savedInstitution.id}`);

    // Create associated documents
    if (createInstitutionDto.documents) {
      const docs = createInstitutionDto.documents.map(doc => 
        this.documentRepository.create({
          institutionId: savedInstitution.id,
          name: doc.name,
          type: doc.type as DocumentType,
          cloudinaryUrl: doc.url,
          createdBy: userId,
        })
      );

    await this.documentRepository.save(docs);
    }

    return await this.findById(savedInstitution.id);
  }

  async findById(id: string): Promise<Institution> {
    const institution = await this.institutionRepository.findOneOrFail({
      where: { id },
      relations: ['documents', 'users'],
    }).catch(() => {
      throw new NotFoundException(`Institution with ID ${id} not found`);
    });

    return institution;
  }

  async update(id: string, updateInstitutionDto: UpdateInstitutionDto, updatedByUserId: string): Promise<Institution> { // Added updatedByUserId
    const institution = await this.findById(id);
    const originalInstitutionJson = JSON.stringify(institution); // Store a snapshot for comparison

    Object.assign(institution, updateInstitutionDto);
    const savedInstitution = await this.institutionRepository.save(institution);

    const updatedFields: (keyof UpdateInstitutionDto)[] = [];
    for (const key in updateInstitutionDto) {
      if (Object.prototype.hasOwnProperty.call(updateInstitutionDto, key)) {
        // Compare with the original values before assignment
        const originalValue = JSON.parse(originalInstitutionJson)[key];
        const newValue = updateInstitutionDto[key as keyof UpdateInstitutionDto];
        if (JSON.stringify(originalValue) !== JSON.stringify(newValue)) {
          updatedFields.push(key as keyof UpdateInstitutionDto);
        }
      }
    }

    if (updatedFields.length > 0) {
      const eventData: InstitutionProfileUpdatedEventData = {
        institutionId: savedInstitution.id,
        updatedByUserId: updatedByUserId,
        updatedFields: updatedFields as string[], // Cast to string[] for the event
        timestamp: new Date(),
      };
      this.kafkaClient.emit(InstitutionEventTopics.INSTITUTION_PROFILE_UPDATED, JSON.stringify(eventData));
      this.logger.log(`Emitted ${InstitutionEventTopics.INSTITUTION_PROFILE_UPDATED} for institution ${savedInstitution.id}, fields: ${updatedFields.join(', ')}`);
    }

    return savedInstitution;
  }

  async addDocument(
    id: string,
    document: {
      name: string;
      type: string;
      cloudinaryUrl: string;
      description?: string;
      validUntil?: Date;
    },
    userId: string,
  ): Promise<InstitutionDocument> {
    const institution = await this.findById(id);

    const newDocument = this.documentRepository.create({
      institutionId: institution.id,
      name: document.name,
      type: document.type as DocumentType,
      cloudinaryUrl: document.cloudinaryUrl,
      description: document.description,
      validUntil: document.validUntil,
      createdBy: userId,
    });

    return await this.documentRepository.save(newDocument);
  }

  async getDocuments(id: string): Promise<InstitutionDocument[]> {
    const institution = await this.findById(id);
    return await this.documentRepository.find({
      where: { institutionId: institution.id },
      order: { createdAt: 'DESC' },
    });
  }

  // Updated method to create/update an institution user profile from a UserCreatedEvent
  public async createOrUpdateInstitutionUserProfileFromEvent(event: UserCreatedEventData, explicitInstitutionId?: string): Promise<void> {
    this.logger.log(`Processing UserCreatedEvent for authUserId: ${event.userId}, email: ${event.email}, userType: ${event.userType}`);

    if (!event.userId) {
      this.logger.error('UserCreatedEvent is missing userId. Cannot process profile.');
      return;
    }

    let institutionToLink: Institution | null = null;
    // Correction : UserCreatedEventData n'a pas organizationDetails, firstName, lastName, phoneNumber
    // Utiliser uniquement les propriétés existantes : userId, email, name, role, userType, customerAccountId, customerName, timestamp
    const providedOrgId = explicitInstitutionId; // event.organizationDetails?.id n'existe pas
    const providedOrgName = undefined; // event.organizationDetails?.name n'existe pas

    if (event.userType === EventUserType.INSTITUTION_ADMIN) {
      let createdViaEvent = false;
      if (providedOrgId) {
        institutionToLink = await this.institutionRepository.findOne({ where: { id: providedOrgId } });
        if (!institutionToLink && providedOrgName) {
          this.logger.log(`Institution with ID ${providedOrgId} not found. Creating new institution with this ID and name: ${providedOrgName}.`);
          try {
            const newInstitution = this.institutionRepository.create({
              id: providedOrgId,
              name: providedOrgName,
              kiotaId: `KIOTA-INS-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`,
              // active: true, <-- Removed
              status: InstitutionStatusType.PENDING_VERIFICATION, // Set initial status
              active: false, // Set active to false
              metadata: { createdByEvent: event.userId, eventTimestamp: event.timestamp, sourceEvent: 'UserCreatedEvent' },
            });
            institutionToLink = await this.institutionRepository.save(newInstitution);
            createdViaEvent = true;
            this.logger.log(`New institution ${institutionToLink.id} created for admin ${event.userId}`);
          } catch (error) {
            this.logger.error(`Failed to create institution with provided ID ${providedOrgId}. Trying without ID. Error: ${error}`);
            if (providedOrgName) {
                const newInstitutionNoId = this.institutionRepository.create({
                    name: providedOrgName,
                    kiotaId: `KIOTA-INS-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`,
                    // active: true, <-- Removed
                    status: InstitutionStatusType.PENDING_VERIFICATION, // Set initial status
                    active: false, // Set active to false
                    metadata: { createdByEvent: event.userId, eventTimestamp: event.timestamp, sourceEvent: 'UserCreatedEvent' },
                });
                institutionToLink = await this.institutionRepository.save(newInstitutionNoId);
                createdViaEvent = true;
                this.logger.log(`New institution ${institutionToLink.id} created with auto-generated ID for admin ${event.userId}`);
            } else {
                 this.logger.error('Cannot create institution for admin as name is also missing after ID creation failed.');
                 return;
            }
          }
        } else if (institutionToLink) {
          this.logger.log(`Found existing institution ${institutionToLink.id} for admin ${event.userId}`);
        }
      } else if (providedOrgName) {
        this.logger.log(`No institution ID provided for admin ${event.userId}. Creating new institution based on name: ${providedOrgName}.`);
        const newInstitution = this.institutionRepository.create({
          name: providedOrgName,
          kiotaId: `KIOTA-INS-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`,
          // active: true, <-- Removed
          status: InstitutionStatusType.PENDING_VERIFICATION, // Set initial status
          active: false, // Set active to false
          metadata: { createdByEvent: event.userId, eventTimestamp: event.timestamp, sourceEvent: 'UserCreatedEvent' },
        });
        institutionToLink = await this.institutionRepository.save(newInstitution);
        createdViaEvent = true;
        this.logger.log(`New institution ${institutionToLink.id} created for admin ${event.userId}`);
      } else {
        this.logger.error(`INSTITUTION_ADMIN user event (userId: ${event.userId}) lacks organization ID and name. Cannot create or link institution.`);
        return;
      }

      // Emit INSTITUTION_CREATED event if a new institution was created
      if (createdViaEvent && institutionToLink) {
        const eventData: InstitutionCreatedEventData = {
          institutionId: institutionToLink.id,
          name: institutionToLink.name,
          kiotaId: institutionToLink.kiotaId,
          type: institutionToLink.type, // May be undefined initially
          createdByUserId: event.userId, // The user who triggered this via UserCreatedEvent
          timestamp: new Date(),
          metadata: institutionToLink.metadata,
        };
        this.kafkaClient.emit(InstitutionEventTopics.INSTITUTION_CREATED, JSON.stringify(eventData));
        this.logger.log(`Emitted ${InstitutionEventTopics.INSTITUTION_CREATED} for institution ${institutionToLink.id} (triggered by UserCreatedEvent)`);
      }
    } else if (event.userType === EventUserType.INSTITUTION_USER) {
      if (!providedOrgId) {
        this.logger.error(`INSTITUTION_USER event (userId: ${event.userId}) lacks organization ID. Cannot link user.`);
        return;
      }
      institutionToLink = await this.institutionRepository.findOne({ where: { id: providedOrgId } });
      if (!institutionToLink) {
        this.logger.error(`Institution with ID ${providedOrgId} not found for INSTITUTION_USER (userId: ${event.userId}).`);
        return;
      }
      this.logger.log(`Found institution ${institutionToLink.id} for user ${event.userId}`);
    } else {
      this.logger.log(`User event (userId: ${event.userId}, type: ${event.userType}) is not an institutional admin or user. Skipping institution linking.`);
      // For non-institutional user types, we might still create a local user profile if this service handles other user types,
      // but without institution linkage. For now, the focus is on institutional users.
      // If this service should ONLY handle institutional users, we could return here.
    }

    if (!institutionToLink && (event.userType === EventUserType.INSTITUTION_ADMIN || event.userType === EventUserType.INSTITUTION_USER)) {
      this.logger.error(`Failed to find or create an institution for institutional user ${event.userId}. Aborting profile creation.`);
      return;
    }

    let user = await this.institutionUserRepository.findOne({ where: { authUserId: event.userId } });

    if (user) {
      this.logger.log(`Found existing InstitutionUser with authUserId: ${event.userId}. Updating...`);
      user.name = event.name;
      user.email = event.email;
      // user.phone = event.phoneNumber || user.phone; // phoneNumber n'existe pas
      // If user exists and institutionToLink is identified, ensure they are correctly linked.
      // This handles cases where user profile was created before institution was confirmed.
      if (institutionToLink && user.institutionId !== institutionToLink.id) {
        this.logger.warn(`User ${user.authUserId} was linked to ${user.institutionId}, now linking to ${institutionToLink.id}`);
        user.institutionId = institutionToLink.id;
      }
    } else {
      if (!institutionToLink) {
        // This check is somewhat redundant due to the earlier check, but good for safety.
        this.logger.error(`Cannot create new InstitutionUser for ${event.userId} as no institution is linked.`);
        return;
      }
      this.logger.log(`Creating new InstitutionUser for authUserId: ${event.userId} and institution ${institutionToLink.id}.`);
      
      let role = UserRole.ANALYST; // Default for INSTITUTION_USER
      if (event.userType === EventUserType.INSTITUTION_ADMIN) {
        role = UserRole.ADMIN;
      }

      user = this.institutionUserRepository.create({
        authUserId: event.userId,
        name: event.name,
        email: event.email,
        // phone: event.phoneNumber || '', // phoneNumber n'existe pas
        institutionId: institutionToLink.id,
        kiotaId: `KIOTA-IU-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        role: role,
        active: true,
        status: 'pending_verification',
        emailVerified: false,
      });
    }

    try {
      await this.institutionUserRepository.save(user);
      this.logger.log(`Successfully saved InstitutionUser profile for authUserId: ${event.userId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      this.logger.log(`Error saving InstitutionUser profile for authUserId: ${event.userId}: ${errorMessage}`);
      throw error;
    }
  }

  // Updated method to handle user status changes
  public async updateUserStatus(authUserId: string, newStatus: string, reason?: string): Promise<void> {
    this.logger.log(`Updating status for authUserId ${authUserId} to ${newStatus}. Reason: ${reason || 'N/A'}`);

    const user = await this.institutionUserRepository.findOne({ where: { authUserId } });

    if (!user) {
      this.logger.warn(`InstitutionUser with authUserId ${authUserId} not found for status update.`);
      return;
    }

    user.status = newStatus;
    // Map descriptive status to boolean 'active' and 'emailVerified' and 'suspended' fields
    if (newStatus.toLowerCase() === 'active' || newStatus.toLowerCase() === 'email_verified') {
      user.active = true;
      if (newStatus.toLowerCase() === 'email_verified') {
          user.emailVerified = true;
      }
    } else if (newStatus.toLowerCase() === 'suspended' || newStatus.toLowerCase() === 'deactivated' || newStatus.toLowerCase() === 'inactive') {
      user.active = false;
    } else if (newStatus.toLowerCase() === 'pending_verification' || newStatus.toLowerCase() === 'pending') {
        user.active = false; 
        user.emailVerified = false;
    }

    try {
      await this.institutionUserRepository.save(user);
      this.logger.log(`Successfully updated status for InstitutionUser authUserId: ${authUserId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      this.logger.error(`Error updating status for InstitutionUser authUserId: ${authUserId}: ${errorMessage}`);
      throw error;
    }
  }

  // Updated method to handle subscription changes for institutions
  public async updateInstitutionSubscription(
    institutionId: string,
    plan: SubscriptionPlanType,
    status: SubscriptionStatusType,
    subscriptionEndDate?: Date,
  ): Promise<void> {
    this.logger.log(`Attempting to update subscription for institution ${institutionId}: Plan ${plan}, Status ${status}, EndDate ${subscriptionEndDate}`);
    const institution = await this.institutionRepository.findOne({ where: { id: institutionId } });

    if (!institution) {
      this.logger.error(`Institution with ID ${institutionId} not found. Cannot update subscription.`);
      throw new NotFoundException(`Institution with ID ${institutionId} not found.`);
    }

    institution.subscriptionPlan = plan;
    institution.subscriptionStatus = status;
    institution.subscriptionEndDate = subscriptionEndDate || null;
    institution.lastSubscriptionChangeAt = new Date();

    try {
      await this.institutionRepository.save(institution);
      this.logger.log(`Successfully updated subscription for institution ${institutionId}.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      this.logger.error(`Error updating subscription for institution ${institutionId}: ${errorMessage}`);
      throw error;
    }
  }

  // Placeholder for a method that might change an institution's status
  async updateInstitutionStatus(institutionId: string, newStatus: InstitutionStatusType, changedBy: string, reason?: string): Promise<Institution | null> {
    const institution = await this.institutionRepository.findOne({ where: { id: institutionId } });
    if (!institution) {
      this.logger.error(`Institution with ID ${institutionId} not found. Cannot update status.`);
      throw new NotFoundException(`Institution with ID ${institutionId} not found.`);
    }

    const previousStatus = institution.status; // Now InstitutionStatusType
    let statusChanged = false;

    if (institution.status !== newStatus) {
      institution.status = newStatus;
      // Keep 'active' field consistent with 'status'
      // Assuming active is true only when status is InstitutionStatusType.ACTIVE
      institution.active = (newStatus === InstitutionStatusType.ACTIVE);
      statusChanged = true;
    }
    
    if (statusChanged) {
      const savedInstitution = await this.institutionRepository.save(institution);
      const eventData: InstitutionStatusChangedEventData = {
        institutionId: savedInstitution.id,
        changedBy: changedBy,
        previousStatus: previousStatus, // previousStatus is InstitutionStatusType
        newStatus: newStatus, // newStatus is InstitutionStatusType
        reason: reason,
        timestamp: new Date(),
      };
      this.kafkaClient.emit(InstitutionEventTopics.INSTITUTION_STATUS_CHANGED, JSON.stringify(eventData));
      this.logger.log(`Emitted ${InstitutionEventTopics.INSTITUTION_STATUS_CHANGED} for institution ${savedInstitution.id}. New status: ${newStatus}`);
      return savedInstitution;
    } else {
      this.logger.log(`Institution ${institutionId} already in status ${newStatus}. No status change event emitted.`);
      return institution;
    }
  }

  /**
   * Trouve une institution par son ID (version safe qui retourne null si non trouvée)
   */
  async findByIdSafe(id: string): Promise<Institution | null> {
    return await this.institutionRepository.findOneBy({ id });
  }

  /**
   * Trouve une institution par son ID (alias pour compatibilité)
   */
  async findByInstitutionId(institutionId: string): Promise<Institution | null> {
    return this.findByIdSafe(institutionId);
  }

  /**
   * Créer ou mettre à jour une institution à partir d'un événement Kafka
   */
  async createOrUpdate(institutionData: any): Promise<Institution> {
    const existingInstitution = await this.findByIdSafe(institutionData.id);
    
    if (existingInstitution) {
      // Mettre à jour l'institution existante
      await this.institutionRepository.update(institutionData.id, {
        ...institutionData,
        updatedAt: new Date()
      });
      
      // Récupérer l'institution mise à jour
      const updatedInstitution = await this.findById(institutionData.id);
      return updatedInstitution;
    } else {
      // Créer une nouvelle institution
      const result = await this.institutionRepository.insert({
        ...institutionData,
        createdAt: institutionData.createdAt || new Date(),
        updatedAt: new Date()
      });
      
      // Récupérer l'institution créée
      const newInstitution = await this.findById(institutionData.id);
      return newInstitution;
    }
  }

  /**
   * Mettre à jour une institution à partir d'un événement de mise à jour
   */
  async updateFromEvent(institutionId: string, updatedFields: Record<string, any>): Promise<Institution> {
    const institution = await this.findById(institutionId);
    if (!institution) {
      throw new NotFoundException(`Institution with ID ${institutionId} not found`);
    }
    
    Object.assign(institution, updatedFields, { updatedAt: new Date() });
    return await this.institutionRepository.save(institution);
  }

  /**
   * Gérer la connexion d'un utilisateur (événement user.login)
   * Assure que l'utilisateur institution est synchronisé localement
   */
  async handleUserLogin(loginData: {
    userId: string;
    auth0Id: string;
    email: string;
    financialInstitutionId?: string;
    userType?: string;
    role?: string;
    loginTime: string;
    isFirstLogin: boolean;
  }): Promise<void> {
    this.logger.log(`Processing user login for institutional user: ${loginData.userId} (${loginData.email})`);

    try {
      // 1. Vérifier si l'utilisateur existe déjà dans notre base locale
      let institutionUser = await this.institutionUserRepository.findOne({
        where: { authUserId: loginData.auth0Id },
        relations: ['institution']
      });

      // 2. Si l'utilisateur n'existe pas localement, le créer
      if (!institutionUser) {
        this.logger.log(`Creating local user profile for ${loginData.auth0Id}`);
        
        // Déterminer l'institution associée
        let institution: Institution | null = null;
        if (loginData.financialInstitutionId) {
          institution = await this.institutionRepository.findOne({
            where: { id: loginData.financialInstitutionId }
          });
        }

        // Créer l'utilisateur local avec les champs requis
        institutionUser = this.institutionUserRepository.create({
          authUserId: loginData.auth0Id,
          kiotaId: `KIOTA-USR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          email: loginData.email,
          name: loginData.email.split('@')[0], // Utiliser la partie avant @ comme nom temporaire
          phone: '', // Champ requis, sera rempli plus tard
          role: this.mapUserRole(loginData.role),
          institutionId: institution?.id || '',
          permissions: [], // Permissions par défaut
          active: true,
          metadata: {
            auth0Id: loginData.auth0Id,
            lastLoginAt: loginData.loginTime,
            isFirstLogin: loginData.isFirstLogin,
            createdFromEvent: true
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await this.institutionUserRepository.save(institutionUser);
        this.logger.log(`Local user profile created for ${loginData.auth0Id}`);
      } else {
        // 3. Mettre à jour les informations de dernière connexion
        institutionUser.metadata = {
          ...institutionUser.metadata,
          lastLoginAt: loginData.loginTime,
          lastLogin: new Date().toISOString()
        };
        institutionUser.updatedAt = new Date();
        
        // Mettre à jour l'association institution si nécessaire
        if (loginData.financialInstitutionId && !institutionUser.institutionId) {
          const institution = await this.institutionRepository.findOne({
            where: { id: loginData.financialInstitutionId }
          });
          if (institution) {
            institutionUser.institutionId = institution.id;
            this.logger.log(`Updated institution association for user ${loginData.auth0Id}`);
          }
        }

        await this.institutionUserRepository.save(institutionUser);
        this.logger.log(`Updated login timestamp for user ${loginData.auth0Id}`);
      }

      // 4. Si c'est la première connexion, enregistrer des métriques ou déclencher d'autres actions
      if (loginData.isFirstLogin) {
        this.logger.log(`First login detected for institutional user ${loginData.auth0Id}`);
        // TODO: Ajouter des actions spécifiques pour la première connexion
        // Par exemple : envoi d'email de bienvenue, initialisation du dashboard, etc.
      }

    } catch (error) {
      this.logger.error(`Error handling user login for ${loginData.auth0Id}:`, error);
      throw error;
    }
  }

  /**
   * Mapper les rôles Auth0 vers les rôles internes
   */
  private mapUserRole(auth0Role?: string): UserRole {
    switch (auth0Role?.toLowerCase()) {
      case 'admin':
      case 'superadmin':
        return UserRole.ADMIN;
      case 'manager':
        return UserRole.MANAGER;
      case 'analyst':
        return UserRole.ANALYST;
      case 'viewer':
        return UserRole.VIEWER;
      default:
        return UserRole.VIEWER; // Rôle par défaut
    }
  }

}
