import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerStatus, CustomerType } from '../entities/customer.entity';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';
import { FinancialInstitutionSpecificData, InstitutionType, InstitutionCategory } from '../entities/financial-institution-specific-data.entity';
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

  async create(createDto: CreateFinancialInstitutionDto): Promise<FinancialInstitutionResponseDto> {
    // Create financial data entity
    const financialData = this.financialDataRepository.create({
      type: createDto.type as InstitutionType,
      category: createDto.category as InstitutionCategory,
      licenseNumber: createDto.licenseNumber,
      establishedDate: createDto.establishedDate ? new Date(createDto.establishedDate) : undefined,
      contacts: createDto.contacts,
      leadership: createDto.leadership,
    });
    
    const savedFinancialData = await this.financialDataRepository.save(financialData);
    
    // Create base customer entity
    const customer = this.customerRepository.create({
      name: createDto.name,
      type: CustomerType.FINANCIAL,
      status: CustomerStatus.PENDING,
      email: createDto.contacts?.general?.email || 'no-email@example.com',
      phone: createDto.contacts?.general?.phone || 'N/A',
      address: createDto.address?.headquarters,
      financialData: savedFinancialData,
    });
    
    const savedCustomer = await this.customerRepository.save(customer);
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitInstitutionCreated({
      customer: savedCustomer,
      institution: {
        customerId: savedFinancialData.id,
        institutionType: savedFinancialData.type
      }
    });
    
    return this.mapToFinancialInstitutionDto(savedCustomer);
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
    if (updateDto.website) customer.website = updateDto.website;
    if (updateDto.facebookPage) customer.facebookPage = updateDto.facebookPage;
    if (updateDto.linkedinPage) customer.linkedinPage = updateDto.linkedinPage;
    
    // Update financial data fields
    if (customer.financialData) {
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
    // Implementation details would go here
    return {
      id: customer.id,
      name: customer.name,
      description: customer.description,
      type: customer.financialData?.type || InstitutionType.BANK,
      category: customer.financialData?.category || InstitutionCategory.COMMERCIAL,
      status: customer.status,
      // Add other fields as needed
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    } as FinancialInstitutionResponseDto;
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

  async validate(id: string): Promise<{ success: boolean; message: string }> {
    const customer = await this.customerRepository.findOne({
      where: { id, type: CustomerType.FINANCIAL },
      relations: ['financialData'],
    });
    
    if (!customer) {
      throw new NotFoundException(`Financial institution with ID ${id} not found`);
    }
    
    customer.status = CustomerStatus.ACTIVE;
    await this.customerRepository.save(customer);
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitInstitutionUpdated({
      customer,
      institution: {
        customerId: customer.financialData?.id,
        institutionType: customer.financialData?.type
      }
    });
    
    return { success: true, message: 'Financial institution validated successfully' };
  }

  async suspend(id: string, reason: string): Promise<{ success: boolean; message: string }> {
    const customer = await this.customerRepository.findOne({
      where: { id, type: CustomerType.FINANCIAL },
      relations: ['financialData'],
    });
    
    if (!customer) {
      throw new NotFoundException(`Financial institution with ID ${id} not found`);
    }
    
    customer.status = CustomerStatus.SUSPENDED;
    customer.suspensionReason = reason;
    await this.customerRepository.save(customer);
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitInstitutionUpdated({
      customer,
      institution: {
        customerId: customer.financialData?.id,
        institutionType: customer.financialData?.type
      }
    });
    
    return { success: true, message: 'Financial institution suspended successfully' };
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
