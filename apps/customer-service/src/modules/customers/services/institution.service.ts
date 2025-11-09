import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Customer, CustomerStatus, CustomerType } from '../entities/customer.entity';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';
import { FinancialInstitutionSpecificData, InstitutionType, InstitutionCategory } from '../entities/financial-institution-specific-data.entity';
import { User, UserType, AccountType } from '../../system-users/entities/user.entity';
import { 
  CreateFinancialInstitutionDto, 
  UpdateFinancialInstitutionDto, 
  FinancialInstitutionResponseDto,
  BranchDto,
  ExecutiveTeamMemberDto,
  BoardMemberDto,
  AddressDto,
  HeadquartersAddressDto
} from '../dto/financial-institution.dto';
import * as crypto from 'crypto';
import { CloudinaryService } from '../../cloudinary';

// Define MulterFile interface for file uploads
interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
  fieldname?: string;
}

@Injectable()
export class InstitutionService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(FinancialInstitutionSpecificData)
    private readonly financialDataRepository: Repository<FinancialInstitutionSpecificData>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly customerEventsProducer: CustomerEventsProducer,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async findAll(page = 1, limit = 10): Promise<[FinancialInstitutionResponseDto[], number]> {
    const [customers, count] = await this.customerRepository.findAndCount({
      where: { type: CustomerType.FINANCIAL },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['financialData'],
    });

    const institutions = customers.map(customer => this.mapToFinancialInstitutionDto(customer));
    
    return [institutions, count];
  }

  async findById(id: string): Promise<FinancialInstitutionResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { id, type: CustomerType.FINANCIAL },
      relations: ['financialData', 'subscriptions'],
    });

    if (!customer) {
      throw new NotFoundException(`Financial institution with ID ${id} not found`);
    }

    return this.mapToFinancialInstitutionDto(customer);
  }

  async create(createDto: CreateFinancialInstitutionDto, auth0Id?: string): Promise<FinancialInstitutionResponseDto> {
    // Validate that an owner is provided
    if (!auth0Id) {
      throw new BadRequestException('Un utilisateur authentifié est requis pour créer une institution financière');
    }

    // Verify that the creating user exists in our system
    const creatingUser = await this.userRepository.findOne({ where: { auth0Id } });
    if (!creatingUser) {
      throw new BadRequestException(`L'utilisateur avec l'ID Auth0 ${auth0Id} n'existe pas dans le système`);
    }

    // Validate required fields
    if (!createDto.contacts?.general?.email) {
      throw new BadRequestException('Email de contact général requis');
    }
    if (!createDto.contacts?.general?.phone) {
      throw new BadRequestException('Téléphone de contact général requis');
    }

    // Ensure leadership information includes the creating user
    const leadership = createDto.leadership || {};
    if (!leadership.ceo && !leadership.executiveTeam?.length && !leadership.boardMembers?.length) {
      // Set the creating user as CEO by default
      leadership.ceo = {
        name: creatingUser.name,
        email: creatingUser.email,
        phone: creatingUser.phone,
        bio: `CEO et fondateur de ${createDto.name}`,
        title: 'Chief Executive Officer',
      };
    }

    // Create financial data entity
    const financialData = this.financialDataRepository.create({
      type: createDto.type as InstitutionType,
      category: createDto.category as InstitutionCategory,
      licenseNumber: createDto.licenseNumber,
      establishedDate: createDto.establishedDate ? new Date(createDto.establishedDate) : undefined,
      regulatoryInfo: createDto.regulatoryStatus ? {
        regulatoryStatus: createDto.regulatoryStatus,
        licenseExpiryDate: createDto.licenseExpiryDate ? new Date(createDto.licenseExpiryDate) : undefined,
      } : undefined,
      brandColors: createDto.brandColors,
      contacts: createDto.contacts,
      leadership: leadership, // Use the enhanced leadership
    });
    
    const savedFinancialData = await this.financialDataRepository.save(financialData);
    
    // Create base customer entity with owner information
    const customer = this.customerRepository.create({
      name: createDto.name,
      type: CustomerType.FINANCIAL,
      status: CustomerStatus.PENDING,
      email: createDto.contacts.general.email,
      phone: createDto.contacts.general.phone,
      address: createDto.address?.headquarters,
      financialData: savedFinancialData,
      createdBy: auth0Id,
      ownerId: creatingUser.id,
      ownerEmail: creatingUser.email,
      owner: {
        id: creatingUser.id,
        name: creatingUser.name,
        email: creatingUser.email,
        phone: creatingUser.phone,
      },
    });
    
    const savedCustomer = await this.customerRepository.save(customer);
    
    // Associate the creating user with the institution as OWNER
    creatingUser.customerId = savedCustomer.id;
    creatingUser.financialInstitutionId = savedCustomer.id;
    creatingUser.userType = UserType.FINANCIAL_INSTITUTION;
    creatingUser.isCompanyOwner = true;
    creatingUser.accountType = AccountType.OWNER;
    await this.userRepository.save(creatingUser);
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitInstitutionCreated({
      customer: savedCustomer,
      institution: {
        customerId: savedFinancialData.id,
        institutionType: savedFinancialData.type
      }
    });

    // Publier le profil complet pour l'admin-service
    await this.customerEventsProducer.emitInstitutionProfileShare({
      customer: savedCustomer,
      financialData: savedFinancialData,
      regulatoryData: {
        complianceStatus: 'pending',
        lastAuditDate: null,
        reportingRequirements: [],
        riskAssessment: 'not_assessed'
      },
      performanceMetrics: {
        totalCustomers: 0,
        totalAssets: 0,
        monthlyGrowth: 0,
        complianceScore: 0
      }
    });

    // Notifier la création du profil
    await this.customerEventsProducer.emitCustomerProfileUpdated({
      customerId: savedCustomer.id,
      customerType: 'FINANCIAL_INSTITUTION',
      updatedFields: ['institution_created', 'basic_profile'],
      updateContext: {
        updatedBy: auth0Id,
        updateSource: 'form_submission',
        formType: 'institution_creation'
      }
    });
    
    return this.mapToFinancialInstitutionDto(savedCustomer);
  }

  /**
   * Validation method to ensure all financial institutions have valid owners
   */
  async validateInstitutionOwnership(): Promise<{ valid: boolean, issues: string[] }> {
    const issues: string[] = [];
    
    // Find all financial institutions without ownerId
    const institutionsWithoutOwner = await this.customerRepository.find({
      where: { 
        type: CustomerType.FINANCIAL, 
        ownerId: IsNull() 
      }
    });
    
    institutionsWithoutOwner.forEach(institution => {
      issues.push(`Financial Institution "${institution.name}" (ID: ${institution.id}) has no owner assigned`);
    });
    
    // Find all institutions where ownerId doesn't correspond to an existing user
    const institutionsWithInvalidOwner = await this.customerRepository
      .createQueryBuilder('customer')
      .leftJoin('users', 'user', 'user.id = customer.ownerId')
      .where('customer.type = :type', { type: CustomerType.FINANCIAL })
      .andWhere('customer.ownerId IS NOT NULL')
      .andWhere('user.id IS NULL')
      .getMany();
    
    institutionsWithInvalidOwner.forEach(institution => {
      issues.push(`Financial Institution "${institution.name}" (ID: ${institution.id}) has invalid owner ID: ${institution.ownerId}`);
    });
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  async update(id: string, updateDto: UpdateFinancialInstitutionDto): Promise<FinancialInstitutionResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { id, type: CustomerType.FINANCIAL },
      relations: ['financialData'],
    });
    
    if (!customer) {
      throw new NotFoundException(`Financial institution with ID ${id} not found`);
    }
    
    // Update customer level fields
    if (updateDto.description) customer.description = updateDto.description;
    
    // Update financial data fields
    if (customer.financialData) {
      if (updateDto.website) customer.financialData.website = updateDto.website;
      if (updateDto.facebookPage) customer.financialData.facebookPage = updateDto.facebookPage;
      if (updateDto.linkedinPage) customer.financialData.linkedinPage = updateDto.linkedinPage;
      
      if (updateDto.regulatoryStatus || updateDto.licenseExpiryDate) {
        customer.financialData.regulatoryInfo = {
          ...customer.financialData.regulatoryInfo,
          ...(updateDto.regulatoryStatus && { regulatoryStatus: updateDto.regulatoryStatus }),
          ...(updateDto.licenseExpiryDate && { licenseExpiryDate: new Date(updateDto.licenseExpiryDate) })
        };
      }
      
      if (updateDto.brandColors) {
        customer.financialData.brandColors = updateDto.brandColors;
      }
      if (updateDto.leadership) customer.financialData.leadership = {
        ...customer.financialData.leadership,
        ...updateDto.leadership
      };
      
      if (updateDto.services) customer.financialData.services = {
        ...customer.financialData.services,
        ...updateDto.services
      };
      
      if (updateDto.financialInfo) customer.financialData.financialInfo = {
        ...customer.financialData.financialInfo,
        ...updateDto.financialInfo
      };
      
      if (updateDto.creditRating) {
        // Convert lastUpdated from string to Date if needed
        const creditRating = { ...updateDto.creditRating };
        
        // Create a properly formatted object for the database
        customer.financialData.creditRating = {
          agency: creditRating.agency,
          rating: creditRating.rating,
          outlook: creditRating.outlook,
          lastUpdated: creditRating.lastUpdated ? new Date(creditRating.lastUpdated) : undefined
        };
      }
      
      if (updateDto.digitalPresence) customer.financialData.digitalPresence = {
        ...customer.financialData.digitalPresence,
        ...updateDto.digitalPresence
      };
      
      await this.financialDataRepository.save(customer.financialData);
    }
    
    const savedCustomer = await this.customerRepository.save(customer);
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitInstitutionUpdated({
      customer: savedCustomer,
      institution: {
        customerId: customer.financialData?.id,
        institutionType: customer.financialData?.type
      }
    });

    // Publier le profil mis à jour pour l'admin-service
    await this.customerEventsProducer.emitInstitutionProfileShare({
      customer: savedCustomer,
      financialData: savedCustomer.financialData,
      regulatoryData: {
        complianceStatus: savedCustomer.financialData?.regulatoryInfo?.complianceRating || 'pending',
        lastAuditDate: savedCustomer.financialData?.regulatoryInfo?.lastInspectionDate,
        reportingRequirements: savedCustomer.financialData?.reportingRequirements || [],
        riskAssessment: 'updated'
      },
      performanceMetrics: {
        totalCustomers: savedCustomer.financialData?.financialInfo?.numberOfCustomers || 0,
        totalAssets: savedCustomer.financialData?.financialInfo?.assets || 0,
        monthlyGrowth: 0,
        complianceScore: 0
      }
    });

    // Notifier la mise à jour du profil
    const updatedFields = Object.keys(updateDto);
    await this.customerEventsProducer.emitCustomerProfileUpdated({
      customerId: savedCustomer.id,
      customerType: 'FINANCIAL_INSTITUTION',
      updatedFields,
      updateContext: {
        updateSource: 'form_submission',
        formType: 'institution_update'
      }
    });
    
    return this.mapToFinancialInstitutionDto(savedCustomer);
  }

  async uploadLogo(id: string, logoFile: MulterFile): Promise<string> {
    const customer = await this.customerRepository.findOne({
      where: { id, type: CustomerType.FINANCIAL }
    });
    
    if (!customer) {
      throw new NotFoundException(`Financial institution with ID ${id} not found`);
    }
    
    if (!logoFile) {
      throw new BadRequestException('Logo file is required');
    }
    
    // Upload to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImage(
      logoFile,
      `financial-institutions/${id}/logo`
    );
    
    // Update customer with logo URL
    customer.logo = uploadResult.url;
    await this.customerRepository.save(customer);
    
    return uploadResult.url;
  }

  async uploadCeoPhoto(id: string, photoFile: MulterFile): Promise<string> {
    const customer = await this.customerRepository.findOne({
      where: { id, type: CustomerType.FINANCIAL },
      relations: ['financialData']
    });
    
    if (!customer || !customer.financialData) {
      throw new NotFoundException(`Financial institution with ID ${id} not found`);
    }
    
    if (!photoFile) {
      throw new BadRequestException('Photo file is required');
    }
    
    // Upload to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImage(
      photoFile,
      `financial-institutions/${id}/ceo`
    );
    
    // Update financial data with CEO photo URL
    if (!customer.financialData.leadership) {
      customer.financialData.leadership = {};
    }
    
    if (!customer.financialData.leadership.ceo) {
      customer.financialData.leadership.ceo = {};
    }
    
    customer.financialData.leadership.ceo.photo = uploadResult.url;
    await this.financialDataRepository.save(customer.financialData);
    
    return uploadResult.url;
  }

  async addBranch(id: string, branchDto: BranchDto): Promise<BranchDto> {
    const customer = await this.customerRepository.findOne({
      where: { id, type: CustomerType.FINANCIAL },
      relations: ['financialData']
    });
    
    if (!customer || !customer.financialData) {
      throw new NotFoundException(`Financial institution with ID ${id} not found`);
    }
    
    if (!customer.financialData.branches) {
      customer.financialData.branches = [];
    }
    
    // Generate ID for the new branch
    const branchId = `branch-${crypto.randomBytes(4).toString('hex')}`;
    
    // Create a branch with the required structure
    const newBranch = {
      id: branchId,
      name: branchDto.name,
      address: {
        street: branchDto.address?.street || '',
        commune: branchDto.address?.commune || '',
        city: branchDto.address?.city || '',
        province: branchDto.address?.province || '',
        country: branchDto.address?.country || '',
      },
      coordinates: branchDto.coordinates,
      manager: branchDto.manager,
      phone: branchDto.phone,
      email: branchDto.email,
      openingHours: branchDto.openingHours,
    };
    
    customer.financialData.branches.push(newBranch);
    await this.financialDataRepository.save(customer.financialData);
    
    return newBranch;
  }

  async removeBranch(institutionId: string, branchId: string): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { id: institutionId, type: CustomerType.FINANCIAL },
      relations: ['financialData']
    });
    
    if (!customer || !customer.financialData) {
      throw new NotFoundException(`Financial institution with ID ${institutionId} not found`);
    }
    
    if (!customer.financialData.branches) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }
    
    const branchIndex = customer.financialData.branches.findIndex(branch => branch.id === branchId);
    
    if (branchIndex === -1) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }
    
    customer.financialData.branches.splice(branchIndex, 1);
    await this.financialDataRepository.save(customer.financialData);
  }

  async addExecutive(id: string, executiveDto: ExecutiveTeamMemberDto): Promise<ExecutiveTeamMemberDto> {
    const customer = await this.customerRepository.findOne({
      where: { id, type: CustomerType.FINANCIAL },
      relations: ['financialData']
    });
    
    if (!customer || !customer.financialData) {
      throw new NotFoundException(`Financial institution with ID ${id} not found`);
    }
    
    if (!customer.financialData.leadership) {
      customer.financialData.leadership = {};
    }
    
    if (!customer.financialData.leadership.executiveTeam) {
      customer.financialData.leadership.executiveTeam = [];
    }
    
    // Generate ID for the new executive
    const executiveId = `usr_${crypto.randomBytes(5).toString('hex')}`;
    
    const newExecutive = {
      id: executiveId,
      ...executiveDto
    };
    
    customer.financialData.leadership.executiveTeam.push(newExecutive);
    await this.financialDataRepository.save(customer.financialData);
    
    return newExecutive;
  }

  async removeExecutive(institutionId: string, executiveId: string): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { id: institutionId, type: CustomerType.FINANCIAL },
      relations: ['financialData']
    });
    
    if (!customer || !customer.financialData || !customer.financialData.leadership) {
      throw new NotFoundException(`Financial institution with ID ${institutionId} not found`);
    }
    
    if (!customer.financialData.leadership.executiveTeam) {
      throw new NotFoundException(`Executive with ID ${executiveId} not found`);
    }
    
    const executiveIndex = customer.financialData.leadership.executiveTeam.findIndex(
      exec => exec.id === executiveId
    );
    
    if (executiveIndex === -1) {
      throw new NotFoundException(`Executive with ID ${executiveId} not found`);
    }
    
    customer.financialData.leadership.executiveTeam.splice(executiveIndex, 1);
    await this.financialDataRepository.save(customer.financialData);
  }

  async addBoardMember(id: string, boardMemberDto: BoardMemberDto): Promise<BoardMemberDto> {
    const customer = await this.customerRepository.findOne({
      where: { id, type: CustomerType.FINANCIAL },
      relations: ['financialData']
    });
    
    if (!customer || !customer.financialData) {
      throw new NotFoundException(`Financial institution with ID ${id} not found`);
    }
    
    if (!customer.financialData.leadership) {
      customer.financialData.leadership = {};
    }
    
    if (!customer.financialData.leadership.boardMembers) {
      customer.financialData.leadership.boardMembers = [];
    }
    
    // Generate ID for the new board member
    const boardMemberId = `brd_${crypto.randomBytes(5).toString('hex')}`;
    
    const newBoardMember = {
      id: boardMemberId,
      name: boardMemberDto.name,
      position: boardMemberDto.position,
      organization: boardMemberDto.organization,
      // Add any other properties from boardMemberDto
    };
    
    customer.financialData.leadership.boardMembers.push(newBoardMember);
    await this.financialDataRepository.save(customer.financialData);
    
    return newBoardMember;
  }

  async removeBoardMember(institutionId: string, boardMemberId: string): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { id: institutionId, type: CustomerType.FINANCIAL },
      relations: ['financialData']
    });
    
    if (!customer || !customer.financialData || !customer.financialData.leadership) {
      throw new NotFoundException(`Financial institution with ID ${institutionId} not found`);
    }
    
    if (!customer.financialData.leadership.boardMembers) {
      throw new NotFoundException(`Board member with ID ${boardMemberId} not found`);
    }
    
    const boardMemberIndex = customer.financialData.leadership.boardMembers.findIndex(
      (member: any) => member.id === boardMemberId
    );
    
    if (boardMemberIndex === -1) {
      throw new NotFoundException(`Board member with ID ${boardMemberId} not found`);
    }
    
    customer.financialData.leadership.boardMembers.splice(boardMemberIndex, 1);
    await this.financialDataRepository.save(customer.financialData);
  }

  // Private helper method to map Customer entity to FinancialInstitutionResponseDto
  private mapToFinancialInstitutionDto(customer: Customer): FinancialInstitutionResponseDto {
    const financialData = customer.financialData;
    
    return {
      id: customer.id,
      name: customer.name,
      logo: customer.logo,
      description: customer.description,
      type: financialData?.type || InstitutionType.BANK,
      category: financialData?.category || InstitutionCategory.COMMERCIAL,
      licenseNumber: financialData?.licenseNumber,
      establishedDate: financialData?.establishedDate,
      regulatoryStatus: financialData?.regulatoryInfo?.regulatoryStatus || 'active',
      licenseExpiryDate: financialData?.regulatoryInfo?.licenseExpiryDate,
      brandColors: financialData?.brandColors,
      website: financialData?.website,
      facebookPage: financialData?.facebookPage,
      linkedinPage: financialData?.linkedinPage,
      
      // NOUVEAUX CHAMPS v2.1 - Conformité documentation
      denominationSociale: financialData?.denominationSociale,
      sigleLegalAbrege: financialData?.sigleLegalAbrege,
      typeInstitution: financialData?.typeInstitution,
      autorisationExploitation: financialData?.autorisationExploitation,
      dateOctroi: financialData?.dateOctroi,
      autoriteSupervision: financialData?.autoriteSupervision,
      dateAgrement: financialData?.dateAgrement,
      coordonneesGeographiques: financialData?.coordonneesGeographiques ? {
        lat: financialData.coordonneesGeographiques.latitude || 0,
        lng: financialData.coordonneesGeographiques.longitude || 0
      } : undefined,
      capaciteFinanciere: financialData?.capaciteFinanciere,
      zonesCouverture: financialData?.zonesCouverture,
      typeOperation: financialData?.typeOperation,
      statutOperationnel: financialData?.statutOperationnel || 'actif',
      address: customer.address ? {
        headquarters: customer.address
      } : undefined,
      branches: financialData?.branches || [],
      contacts: financialData?.contacts,
      leadership: financialData?.leadership,
      services: financialData?.services,
      financialInfo: financialData?.financialInfo,
      creditRating: financialData?.creditRating ? {
        ...financialData.creditRating,
        lastUpdated: financialData.creditRating.lastUpdated?.toISOString()
      } : undefined,
      digitalPresence: financialData?.digitalPresence,
      subscription: customer.subscriptions?.[0] ? {
        plan: { name: customer.subscriptions[0].plan?.name },
        status: customer.subscriptions[0].status,
        endDate: customer.subscriptions[0].endDate
      } : undefined,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      createdBy: customer.createdBy,
    };
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const customer = await this.customerRepository.findOne({
      where: { id, type: CustomerType.FINANCIAL },
      relations: ['financialData'],
    });
    
    if (!customer) {
      throw new NotFoundException(`Financial institution with ID ${id} not found`);
    }
    
    // Perform soft delete or set status to deleted
    customer.status = CustomerStatus.INACTIVE;
    await this.customerRepository.save(customer);
    
    // Publish event to Kafka if needed
    await this.customerEventsProducer.emitInstitutionUpdated({
      customer,
      institution: {
        customerId: customer.financialData?.id,
        institutionType: customer.financialData?.type
      }
    });
    
    return { success: true, message: 'Financial institution deleted successfully' };
  }

  async validate(id: string, validatedBy: string): Promise<{ success: boolean; message: string }> {
    const customer = await this.customerRepository.findOne({
      where: { id, type: CustomerType.FINANCIAL },
      relations: ['financialData'],
    });
    
    if (!customer) {
      throw new NotFoundException(`Financial institution with ID ${id} not found`);
    }
    
    customer.status = CustomerStatus.ACTIVE;
    customer.validatedAt = new Date();
    customer.validatedBy = validatedBy;
    await this.customerRepository.save(customer);
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitInstitutionUpdated({
      customer,
      institution: {
        customerId: customer.financialData?.id,
        institutionType: customer.financialData?.type,
        status: CustomerStatus.ACTIVE
      }
    });
    
    return { success: true, message: 'Financial institution validated successfully' };
  }

  async suspend(id: string, suspendedBy: string, reason: string): Promise<{ success: boolean; message: string }> {
    const customer = await this.customerRepository.findOne({
      where: { id, type: CustomerType.FINANCIAL },
      relations: ['financialData'],
    });
    
    if (!customer) {
      throw new NotFoundException(`Financial institution with ID ${id} not found`);
    }
    
    customer.status = CustomerStatus.SUSPENDED;
    customer.suspensionReason = reason;
    customer.suspendedAt = new Date();
    customer.suspendedBy = suspendedBy;
    await this.customerRepository.save(customer);
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitInstitutionUpdated({
      customer,
      institution: {
        customerId: customer.financialData?.id,
        institutionType: customer.financialData?.type,
        status: CustomerStatus.SUSPENDED
      }
    });
    
    return { success: true, message: 'Financial institution suspended successfully' };
  }

  async reject(id: string, rejectedBy: string, reason: string): Promise<{ success: boolean; message: string }> {
    const customer = await this.customerRepository.findOne({
      where: { id, type: CustomerType.FINANCIAL },
      relations: ['financialData'],
    });
    
    if (!customer) {
      throw new NotFoundException(`Financial institution with ID ${id} not found`);
    }
    
    customer.status = CustomerStatus.INACTIVE;
    customer.suspensionReason = reason;
    customer.rejectedAt = new Date();
    customer.rejectedBy = rejectedBy;
    await this.customerRepository.save(customer);
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitInstitutionUpdated({
      customer,
      institution: {
        customerId: customer.financialData?.id,
        institutionType: customer.financialData?.type,
        status: CustomerStatus.INACTIVE
      }
    });
    
    return { success: true, message: 'Financial institution rejected successfully' };
  }

  async getFinancialData(id: string): Promise<any> {
    const customer = await this.customerRepository.findOne({
      where: { id, type: CustomerType.FINANCIAL },
      relations: ['financialData'],
    });
    
    if (!customer) {
      throw new NotFoundException(`Financial institution with ID ${id} not found`);
    }
    
    if (!customer.financialData) {
      throw new NotFoundException(`Financial data for institution with ID ${id} not found`);
    }
    
    // Return the financial data
    return {
      id: customer.id,
      name: customer.name,
      type: customer.financialData.type,
      category: customer.financialData.category,
      licenseNumber: customer.financialData.licenseNumber,
      establishedDate: customer.financialData.establishedDate,
      services: customer.financialData.services,
      financialInfo: customer.financialData.financialInfo,
      creditRating: customer.financialData.creditRating,
      leadership: customer.financialData.leadership,
      // Include any other financial data fields
    };
  }
}
