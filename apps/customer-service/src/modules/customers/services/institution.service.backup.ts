import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Customer, CustomerStatus, CustomerType } from '../entities/customer.entity';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';
import { FinancialInstitutionSpecificData, InstitutionType, InstitutionCategory, RegulatoryStatus, CurrencyType } from '../entities/financial-institution-specific-data.entity';
import { User, UserType, AccountType } from '../../system-users/entities/user.entity';
import { 
  CreateFinancialInstitutionDto, 
  UpdateFinancialInstitutionDto, 
  FinancialInstitutionResponseDto,
  BranchDto,
  ExecutiveTeamMemberDto,
  BoardMemberDto,
  HeadquartersAddressDto,
  AddressDto
} from '../dto/financial-institution.dto';
import * as crypto from 'crypto';
import { CloudinaryService } from '../../cloudinary';
import { BaseCustomerService, MulterFile, FileUploadResponseDto } from '../shared';

@Injectable()
export class InstitutionService extends BaseCustomerService<FinancialInstitutionResponseDto> {
  constructor(
    @InjectRepository(Customer)
    customerRepository: Repository<Customer>,
    @InjectRepository(FinancialInstitutionSpecificData)
    private readonly financialDataRepository: Repository<FinancialInstitutionSpecificData>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    customerEventsProducer: CustomerEventsProducer,
    cloudinaryService: CloudinaryService,
  ) {
    super(customerRepository, customerEventsProducer, cloudinaryService);
  }

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

  async create(createDto: CreateFinancialInstitutionDto, auth0Id: string): Promise<FinancialInstitutionResponseDto> {
    try {
      // Find the creating user
      const creatingUser = await this.userRepository.findOne({
        where: { auth0Id },
      });

      if (!creatingUser) {
        throw new NotFoundException('Utilisateur non trouvé');
      }

      // Validate input data
      this.validateCreateDto(createDto);
      
      // Check name uniqueness
      await this.checkInstitutionNameUniqueness(createDto.name);

      // Transform leadership data with proper structure
      const leadership = {
        executiveTeam: createDto.executiveTeam?.map(member => ({
          id: crypto.randomUUID(),
          firstName: member.firstName,
          lastName: member.lastName,
          position: member.position,
          department: member.department,
          yearsOfExperience: member.yearsOfExperience,
          education: member.education,
          profileImageUrl: member.profileImageUrl,
          bio: member.bio,
          phone: member.phone,
          email: member.email,
          startDate: member.startDate ? new Date(member.startDate) : undefined,
          isActive: member.isActive ?? true,
          permissions: member.permissions || [],
          responsibilities: member.responsibilities || [],
        })) || [],
        boardMembers: createDto.boardMembers?.map(member => ({
          id: crypto.randomUUID(),
          firstName: member.firstName,
          lastName: member.lastName,
          position: member.position,
          isIndependent: member.isIndependent ?? false,
          appointmentDate: member.appointmentDate ? new Date(member.appointmentDate) : undefined,
          termEndDate: member.termEndDate ? new Date(member.termEndDate) : undefined,
          bio: member.bio,
          expertise: member.expertise || [],
          otherBoardPositions: member.otherBoardPositions || [],
          profileImageUrl: member.profileImageUrl,
          isActive: member.isActive ?? true,
        })) || [],
      };

      // Create financial data entity with proper type casting
      const financialData = this.financialDataRepository.create({
        type: createDto.type || InstitutionType.OTHER,
        category: createDto.category || InstitutionCategory.PRIVATE,
        licenseNumber: createDto.licenseNumber,
        establishedDate: createDto.establishedDate ? new Date(createDto.establishedDate) : undefined,
        regulatoryInfo: createDto.regulatoryStatus ? {
          regulatoryStatus: createDto.regulatoryStatus as RegulatoryStatus,
          licenseExpiryDate: createDto.licenseExpiryDate ? new Date(createDto.licenseExpiryDate) : undefined,
        } : undefined,
        brandColors: createDto.brandColors,
        contacts: createDto.contacts,
        leadership: leadership,
      });
      
      const savedFinancialData = await this.financialDataRepository.save(financialData);
      
      // Create base customer entity with owner information
      const customer = this.customerRepository.create({
        name: createDto.name,
        type: CustomerType.FINANCIAL,
        status: CustomerStatus.PENDING,
        email: createDto.contacts?.general?.email,
        phone: createDto.contacts?.general?.phone,
        address: createDto.address?.street || '',
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

      // Update user associations
      creatingUser.customerId = savedCustomer.id;
      creatingUser.financialInstitutionId = savedCustomer.id;
      await this.userRepository.save(creatingUser);

      // Emit creation event
      await this.customerEventsProducer.publishCustomerCreated({
        customerId: savedCustomer.id,
        customer: savedCustomer,
        financialInstitution: {
          customerId: savedFinancialData.id,
          institutionType: savedFinancialData.type
        },
        metadata: {
          createdBy: auth0Id,
          createdAt: new Date(),
        }
      });

      await this.customerEventsProducer.publishInstitutionCreated({
        customer: savedCustomer,
        financialData: savedFinancialData,
        createdBy: auth0Id,
      });

      // Also emit financial institution specific event
      await this.customerEventsProducer.publishFinancialInstitutionProfileCompleted({
        customerId: savedCustomer.id,
        institutionData: savedFinancialData,
        completedBy: auth0Id,
        completedAt: new Date(),
      });

      return this.mapToFinancialInstitutionDto(savedCustomer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Erreur lors de la création de l'institution financière: ${errorMessage}`);
    }
  }

  async findOne(id: string): Promise<FinancialInstitutionResponseDto> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { 
          id, 
          type: CustomerType.FINANCIAL 
        },
        relations: ['financialData'],
      });

      if (!customer) {
        throw new NotFoundException(`Institution financière avec l'ID ${id} non trouvée`);
      }

      return this.mapToFinancialInstitutionDto(customer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Erreur lors de la récupération de l'institution: ${errorMessage}`);
    }
  }

  async update(id: string, updateDto: UpdateFinancialInstitutionDto, auth0Id: string): Promise<FinancialInstitutionResponseDto> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id, type: CustomerType.FINANCIAL },
        relations: ['financialData'],
      });

      if (!customer || !customer.financialData) {
        throw new NotFoundException('Institution financière non trouvée');
      }

      // Check name uniqueness if name is being updated
      if (updateDto.institution?.name && updateDto.institution.name !== customer.name) {
        await this.checkInstitutionNameUniqueness(updateDto.institution.name);
      }

      // Update customer base data
      if (updateDto.institution) {
        Object.assign(customer, {
          name: updateDto.institution.name || customer.name,
          email: updateDto.institution.contacts?.general?.email || customer.email,
          phone: updateDto.institution.contacts?.general?.phone || customer.phone,
          address: updateDto.institution.address?.street || customer.address,
          updatedAt: new Date(),
        });
      }

      // Update financial data
      if (updateDto.institution) {
        Object.assign(customer.financialData, {
          type: updateDto.institution.type || customer.financialData.type,
          category: updateDto.institution.category || customer.financialData.category,
          licenseNumber: updateDto.institution.licenseNumber || customer.financialData.licenseNumber,
          establishedDate: updateDto.institution.establishedDate ? new Date(updateDto.institution.establishedDate) : customer.financialData.establishedDate,
          regulatoryInfo: updateDto.institution.regulatoryStatus ? {
            ...customer.financialData.regulatoryInfo,
            regulatoryStatus: updateDto.institution.regulatoryStatus as RegulatoryStatus,
            licenseExpiryDate: updateDto.institution.licenseExpiryDate ? new Date(updateDto.institution.licenseExpiryDate) : customer.financialData.regulatoryInfo?.licenseExpiryDate,
          } : customer.financialData.regulatoryInfo,
          brandColors: updateDto.institution.brandColors || customer.financialData.brandColors,
          contacts: updateDto.institution.contacts || customer.financialData.contacts,
          leadership: updateDto.institution.executiveTeam || updateDto.institution.boardMembers ? {
            executiveTeam: updateDto.institution.executiveTeam?.map(member => ({
              id: member.id || crypto.randomUUID(),
              firstName: member.firstName,
              lastName: member.lastName,
              position: member.position,
              department: member.department,
              yearsOfExperience: member.yearsOfExperience,
              education: member.education,
              profileImageUrl: member.profileImageUrl,
              bio: member.bio,
              phone: member.phone,
              email: member.email,
              startDate: member.startDate ? new Date(member.startDate) : undefined,
              isActive: member.isActive ?? true,
              permissions: member.permissions || [],
              responsibilities: member.responsibilities || [],
            })) || customer.financialData.leadership?.executiveTeam || [],
            boardMembers: updateDto.institution.boardMembers?.map(member => ({
              id: member.id || crypto.randomUUID(),
              firstName: member.firstName,
              lastName: member.lastName,
              position: member.position,
              isIndependent: member.isIndependent ?? false,
              appointmentDate: member.appointmentDate ? new Date(member.appointmentDate) : undefined,
              termEndDate: member.termEndDate ? new Date(member.termEndDate) : undefined,
              bio: member.bio,
              expertise: member.expertise || [],
              otherBoardPositions: member.otherBoardPositions || [],
              profileImageUrl: member.profileImageUrl,
              isActive: member.isActive ?? true,
            })) || customer.financialData.leadership?.boardMembers || [],
          } : customer.financialData.leadership,
        });
      }

      // Save updated entities
      await this.financialDataRepository.save(customer.financialData);
      const updatedCustomer = await this.customerRepository.save(customer);

      // Emit update event
      await this.customerEventsProducer.publishCustomerUpdated({
        customerId: id,
        customer: updatedCustomer,
        updatedBy: auth0Id,
        updatedAt: new Date(),
      });

      return this.mapToFinancialInstitutionDto(updatedCustomer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Erreur lors de la mise à jour de l'institution: ${errorMessage}`);
    }
  }

  async delete(id: string, auth0Id: string): Promise<void> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id, type: CustomerType.FINANCIAL },
        relations: ['financialData'],
      });

      if (!customer) {
        throw new NotFoundException('Institution financière non trouvée');
      }

      // Soft delete by updating status
      customer.status = CustomerStatus.INACTIVE;
      customer.updatedAt = new Date();
      
      await this.customerRepository.save(customer);

      // Emit deletion event
      await this.customerEventsProducer.publishCustomerDeleted({
        customerId: id,
        deletedBy: auth0Id,
        deletedAt: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Erreur lors de la suppression de l'institution: ${errorMessage}`);
    }
  }

  async findByType(type: InstitutionType, page = 1, limit = 10): Promise<[FinancialInstitutionResponseDto[], number]> {
    try {
      const [customers, count] = await this.customerRepository.findAndCount({
        where: { 
          type: CustomerType.FINANCIAL,
          financialData: { type }
        },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
        relations: ['financialData'],
      });

      const institutions = customers.map(customer => this.mapToFinancialInstitutionDto(customer));
      return [institutions, count];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new BadRequestException(`Erreur lors de la recherche par type: ${errorMessage}`);
    }
  }

  async addBranch(institutionId: string, branchDto: BranchDto, auth0Id: string): Promise<FinancialInstitutionResponseDto> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id: institutionId, type: CustomerType.FINANCIAL },
        relations: ['financialData'],
      });

      if (!customer || !customer.financialData) {
        throw new NotFoundException('Institution financière non trouvée');
      }

      // Add branch to branches array
      const currentBranches = customer.financialData.branches || [];
      const newBranch = {
        ...branchDto,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };

      customer.financialData.branches = [...currentBranches, newBranch];
      await this.financialDataRepository.save(customer.financialData);

      // Emit branch addition event
      await this.customerEventsProducer.publishInstitutionBranchAdded({
        institutionId,
        branch: newBranch,
        addedBy: auth0Id,
      });

      return this.mapToFinancialInstitutionDto(customer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Erreur lors de l'ajout de la succursale: ${errorMessage}`);
    }
  }

  async removeBranch(institutionId: string, branchId: string, auth0Id: string): Promise<FinancialInstitutionResponseDto> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id: institutionId, type: CustomerType.FINANCIAL },
        relations: ['financialData'],
      });

      if (!customer || !customer.financialData) {
        throw new NotFoundException('Institution financière non trouvée');
      }

      const branches = customer.financialData.branches || [];
      const branchIndex = branches.findIndex(branch => branch.id === branchId);

      if (branchIndex === -1) {
        throw new NotFoundException('Succursale non trouvée');
      }

      // Remove branch
      customer.financialData.branches = branches.filter(branch => branch.id !== branchId);
      await this.financialDataRepository.save(customer.financialData);

      // Emit branch removal event
      await this.customerEventsProducer.publishInstitutionBranchRemoved({
        institutionId,
        branchId,
        removedBy: auth0Id,
      });

      return this.mapToFinancialInstitutionDto(customer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Erreur lors de la suppression de la succursale: ${errorMessage}`);
    }
  }

  async search(query: string, filters?: { type?: InstitutionType; category?: InstitutionCategory }, page = 1, limit = 10): Promise<[FinancialInstitutionResponseDto[], number]> {
    try {
      const queryBuilder = this.customerRepository.createQueryBuilder('customer')
        .leftJoinAndSelect('customer.financialData', 'financialData')
        .where('customer.type = :type', { type: CustomerType.FINANCIAL })
        .andWhere('customer.name ILIKE :query', { query: `%${query}%` });

      if (filters?.type) {
        queryBuilder.andWhere('financialData.type = :institutionType', { institutionType: filters.type });
      }

      if (filters?.category) {
        queryBuilder.andWhere('financialData.category = :category', { category: filters.category });
      }

      const [customers, count] = await queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .orderBy('customer.createdAt', 'DESC')
        .getManyAndCount();

      const institutions = customers.map(customer => this.mapToFinancialInstitutionDto(customer));
      return [institutions, count];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new BadRequestException(`Erreur lors de la recherche: ${errorMessage}`);
    }
  }

  // Private helper methods
  private async checkInstitutionNameUniqueness(name: string): Promise<void> {
    const existingInstitution = await this.customerRepository.findOne({
      where: { 
        name,
        type: CustomerType.FINANCIAL,
      },
    });

    if (existingInstitution) {
      throw new BadRequestException(`Une institution avec le nom "${name}" existe déjà`);
    }
  }

  private validateCreateDto(createDto: CreateFinancialInstitutionDto): void {
    if (!createDto.name) {
      throw new BadRequestException('Le nom de l\'institution est requis');
    }
    if (!createDto.type) {
      throw new BadRequestException('Le type d\'institution est requis');
    }
    if (!createDto.contacts?.general?.email) {
      throw new BadRequestException('L\'email de contact général est requis');
    }
  }

  protected mapToFinancialInstitutionDto(customer: Customer): FinancialInstitutionResponseDto {
    const financialData = customer.financialData;
    
    return {
      id: customer.id,
      name: customer.name,
      type: financialData?.type || InstitutionType.OTHER,
      category: financialData?.category || InstitutionCategory.PRIVATE,
      licenseNumber: financialData?.licenseNumber,
      status: customer.status,
      establishedDate: financialData?.establishedDate?.toISOString(),
      regulatoryStatus: financialData?.regulatoryInfo?.regulatoryStatus as RegulatoryStatus || 'active' as RegulatoryStatus,
      licenseExpiryDate: financialData?.regulatoryInfo?.licenseExpiryDate?.toISOString(),
      
      // Contact information
      contacts: financialData?.contacts || {
        general: {
          email: customer.email || '',
          phone: customer.phone || '',
        },
      },
      
      // Address information
      address: customer.address ? {
        street: customer.address,
      } as AddressDto : undefined,
      
      // Branches
      branches: financialData?.branches || [],
      
      // Leadership
      executiveTeam: financialData?.leadership?.executiveTeam || [],
      boardMembers: financialData?.leadership?.boardMembers || [],
      
      // Brand information
      brandColors: financialData?.brandColors,
      
      // Financial capabilities
      capaciteFinanciere: financialData?.capaciteFinanciere ? {
        capitalSocial: financialData.capaciteFinanciere.capitalSocial,
        fondsPropresDeclares: financialData.capaciteFinanciere.fondsPropresDeclares,
        limitesOperationnelles: financialData.capaciteFinanciere.limitesOperationnelles,
        monnaieReference: financialData.capaciteFinanciere.monnaieReference as CurrencyType,
      } : undefined,
      
      // Location information  
      localisationGeographique: financialData?.localisationGeographique ? {
        headquarters: {
          street: customer.address,
        } as AddressDto
      } : undefined,
      
      // Timestamps
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      
      // Owner information
      ownerId: customer.ownerId,
      ownerEmail: customer.ownerEmail,
      owner: customer.owner,
    };
  }
}