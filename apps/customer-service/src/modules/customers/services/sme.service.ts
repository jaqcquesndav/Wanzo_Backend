import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';
import { Customer, CustomerStatus, CustomerType } from '../entities/customer.entity';
import { Sme } from '../entities/sme.entity';
import { SmeSpecificData } from '../entities/sme-specific-data.entity';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { 
  CreateCompanyDto, 
  UpdateCompanyDto, 
  CompanyResponseDto, 
  LocationDto, 
  AssociateDto 
} from '../dto/company.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SmeService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Sme)
    private readonly smeRepository: Repository<Sme>,
    @InjectRepository(SmeSpecificData)
    private readonly smeDataRepository: Repository<SmeSpecificData>,
    private readonly customerEventsProducer: CustomerEventsProducer,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async findAll(
    page = 1, 
    limit = 10, 
    filters?: { industry?: string; size?: string; search?: string },
    sort?: string,
    order?: 'ASC' | 'DESC'
  ): Promise<[CompanyResponseDto[], number]> {
    const where: FindOptionsWhere<Sme> = {};
    
    if (filters?.industry) {
      where.industry = Like(`%${filters.industry}%`);
    }
    
    if (filters?.size) {
      where.size = Like(`%${filters.size}%`);
    }

    if (filters?.search) {
      where.name = Like(`%${filters.search}%`);
    }
    
    const orderOptions: any = {};
    if (sort) {
      orderOptions[sort] = order || 'ASC';
    } else {
      orderOptions.createdAt = 'DESC';
    }
    
    const [smes, total] = await this.smeRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: orderOptions,
      relations: ['customer', 'customer.users', 'customer.subscriptions', 'customer.smeData'],
    });
    
    // Map Sme entities to CompanyResponseDto
    const companies = smes.map(sme => this.mapSmeToCompanyResponse(sme));
    
    return [companies, total];
  }

  async findById(id: string): Promise<CompanyResponseDto> {
    const sme = await this.smeRepository.findOne({
      where: { customerId: id },
      relations: ['customer', 'customer.users', 'customer.subscriptions', 'customer.smeData'],
    });

    if (!sme) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return this.mapSmeToCompanyResponse(sme);
  }

  async create(createCompanyDto: CreateCompanyDto, auth0Id: string): Promise<CompanyResponseDto> {
    // Create base customer entity
    const customer = this.customerRepository.create({
      type: CustomerType.SME,
      status: CustomerStatus.PENDING,
      createdBy: auth0Id,
    });
    
    const savedCustomerResult = await this.customerRepository.save(customer);
    const savedCustomer = Array.isArray(savedCustomerResult) ? savedCustomerResult[0] : savedCustomerResult;
    
    // Create SME specific entity
    const sme = this.smeRepository.create({
      name: createCompanyDto.name,
      legalForm: createCompanyDto.legalForm,
      industry: createCompanyDto.industry,
      size: createCompanyDto.size,
      customerId: savedCustomer.id,
      // Add other fields from createCompanyDto
    });
    
    const savedSmeResult = await this.smeRepository.save(sme);
    const savedSme = Array.isArray(savedSmeResult) ? savedSmeResult[0] : savedSmeResult;
    
    // Create SME specific data
    const smeData = this.smeDataRepository.create({
      // Map from createCompanyDto to SmeSpecificData fields
      address: createCompanyDto.address,
      contacts: createCompanyDto.contacts,
      owner: createCompanyDto.owner,
    });
    
    const savedSmeDataResult = await this.smeDataRepository.save(smeData);
    const savedSmeData = Array.isArray(savedSmeDataResult) ? savedSmeDataResult[0] : savedSmeDataResult;
    
    // Update customer with SME data reference
    savedCustomer.smeData = savedSmeData;
    await this.customerRepository.save(savedCustomer);
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitSmeCreated({
      customer: savedCustomer,
      sme: savedSme,
    });
    
    return this.mapSmeToCompanyResponse({
      ...savedSme,
      customer: {
        ...savedCustomer,
        smeData: savedSmeData
      }
    });
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<CompanyResponseDto> {
    const smeEntity = await this.smeRepository.findOne({
      where: { customerId: id },
      relations: ['customer', 'customer.users', 'customer.smeData', 'customer.subscriptions'],
    });
    
    if (!smeEntity) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    
    // Update SME fields
    if (updateCompanyDto.description) smeEntity.description = updateCompanyDto.description;
    if (updateCompanyDto.website) smeEntity.website = updateCompanyDto.website;
    if (updateCompanyDto.facebookPage) smeEntity.facebookPage = updateCompanyDto.facebookPage;
    if (updateCompanyDto.rccm) smeEntity.rccm = updateCompanyDto.rccm;
    if (updateCompanyDto.taxId) smeEntity.taxId = updateCompanyDto.taxId;
    
    // Update SME specific data if needed
    if (smeEntity.customer?.smeData) {
      const smeData = smeEntity.customer.smeData;
      
      // Update activities, capital, financials, affiliations if provided
      if (updateCompanyDto.activities) smeData.activities = updateCompanyDto.activities;
      if (updateCompanyDto.capital) smeData.capital = updateCompanyDto.capital;
      if (updateCompanyDto.financials) smeData.financials = updateCompanyDto.financials;
      if (updateCompanyDto.affiliations) smeData.affiliations = updateCompanyDto.affiliations;
      
      // Save the updated SME data
      await this.smeDataRepository.save(smeData);
    }
    
    // Save the updated SME entity
    const savedSme = await this.smeRepository.save(smeEntity);
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitSmeUpdated({
      sme: savedSme,
    });
    
    // Fetch the updated entity with all relations
    const updatedSme = await this.smeRepository.findOne({
      where: { customerId: id },
      relations: ['customer', 'customer.users', 'customer.smeData', 'customer.subscriptions'],
    });
    
    if (!updatedSme) {
      throw new NotFoundException(`Company with ID ${id} not found after update`);
    }
    
    return this.mapSmeToCompanyResponse(updatedSme);
  }

  async updateLogo(id: string, file: any): Promise<string> {
    const smeEntity = await this.smeRepository.findOne({
      where: { customerId: id },
    });
    
    if (!smeEntity) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    
    // Upload logo to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImage(
      file,
      `companies/${id}/logo`
    );
    
    // Update logo URL in the database
    smeEntity.logoUrl = uploadResult.url;
    const savedSme = await this.smeRepository.save(smeEntity);
    
    // Emit event
    await this.customerEventsProducer.emitSmeUpdated({
      sme: savedSme
    });
    
    return uploadResult.url;
  }
  
  async updateOwnerCV(id: string, file: any): Promise<string> {
    const smeEntity = await this.smeRepository.findOne({
      where: { customerId: id },
      relations: ['customer', 'customer.smeData'],
    });
    
    if (!smeEntity || !smeEntity.customer?.smeData) {
      throw new NotFoundException(`Company with ID ${id} not found or missing data`);
    }
    
    // Upload CV to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImage(
      file,
      `companies/${id}/owner`
    );
    
    // Update owner CV URL in the database
    const smeData = smeEntity.customer.smeData;
    if (smeData.owner) {
      smeData.owner.cvUrl = uploadResult.url;
    } else {
      smeData.owner = { cvUrl: uploadResult.url };
    }
    
    await this.smeDataRepository.save(smeData);
    
    return uploadResult.url;
  }

  async addLocation(id: string, locationDto: LocationDto): Promise<LocationDto> {
    const smeEntity = await this.smeRepository.findOne({
      where: { customerId: id },
      relations: ['customer', 'customer.smeData'],
    });
    
    if (!smeEntity || !smeEntity.customer?.smeData) {
      throw new NotFoundException(`Company with ID ${id} not found or missing data`);
    }
    
    const smeData = smeEntity.customer.smeData;
    
    // Initialize locations array if it doesn't exist
    if (!smeData.locations) {
      smeData.locations = [];
    }
    
    // Add locationId to the location
    const newLocation = {
      ...locationDto,
      id: uuidv4(), // Generate a unique ID for the location
    };
    
    // Add the new location
    smeData.locations.push(newLocation);
    
    // Save the updated SME data
    await this.smeDataRepository.save(smeData);
    
    return newLocation;
  }
  
  async removeLocation(id: string, locationId: string): Promise<void> {
    const smeEntity = await this.smeRepository.findOne({
      where: { customerId: id },
      relations: ['customer', 'customer.smeData'],
    });
    
    if (!smeEntity || !smeEntity.customer?.smeData) {
      throw new NotFoundException(`Company with ID ${id} not found or missing data`);
    }
    
    const smeData = smeEntity.customer.smeData;
    
    // Check if locations array exists
    if (!smeData.locations || smeData.locations.length === 0) {
      throw new NotFoundException(`No locations found for company with ID ${id}`);
    }
    
    // Find the location by ID
    const locationIndex = smeData.locations.findIndex(loc => loc.id === locationId);
    
    if (locationIndex === -1) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }
    
    // Remove the location
    smeData.locations.splice(locationIndex, 1);
    
    // Save the updated SME data
    await this.smeDataRepository.save(smeData);
  }
  
  async addAssociate(id: string, associateDto: AssociateDto): Promise<AssociateDto> {
    const smeEntity = await this.smeRepository.findOne({
      where: { customerId: id },
      relations: ['customer', 'customer.smeData'],
    });
    
    if (!smeEntity || !smeEntity.customer?.smeData) {
      throw new NotFoundException(`Company with ID ${id} not found or missing data`);
    }
    
    const smeData = smeEntity.customer.smeData;
    
    // Initialize associates array if it doesn't exist
    if (!smeData.associates) {
      smeData.associates = [];
    }
    
    // Add associateId to the associate
    const newAssociate = {
      ...associateDto,
      id: uuidv4(), // Generate a unique ID for the associate
    };
    
    // Add the new associate
    smeData.associates.push(newAssociate);
    
    // Save the updated SME data
    await this.smeDataRepository.save(smeData);
    
    return newAssociate;
  }
  
  async removeAssociate(id: string, associateId: string): Promise<void> {
    const smeEntity = await this.smeRepository.findOne({
      where: { customerId: id },
      relations: ['customer', 'customer.smeData'],
    });
    
    if (!smeEntity || !smeEntity.customer?.smeData) {
      throw new NotFoundException(`Company with ID ${id} not found or missing data`);
    }
    
    const smeData = smeEntity.customer.smeData;
    
    // Check if associates array exists
    if (!smeData.associates || smeData.associates.length === 0) {
      throw new NotFoundException(`No associates found for company with ID ${id}`);
    }
    
    // Find the associate by ID
    const associateIndex = smeData.associates.findIndex(assoc => assoc.id === associateId);
    
    if (associateIndex === -1) {
      throw new NotFoundException(`Associate with ID ${associateId} not found`);
    }
    
    // Remove the associate
    smeData.associates.splice(associateIndex, 1);
    
    // Save the updated SME data
    await this.smeDataRepository.save(smeData);
  }

  async isCompanyOwner(companyId: string, auth0Id: string): Promise<boolean> {
    const smeEntity = await this.smeRepository.findOne({
      where: { customerId: companyId },
      relations: ['customer', 'customer.users'],
    });
    
    if (!smeEntity) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }
    
    // Check if the auth0Id matches the company's creator or is an owner user
    const isCreator = smeEntity.customer.createdBy === auth0Id;
    
    if (isCreator) {
      return true;
    }
    
    // Check if the user is in the company's users list and is an owner
    const isOwnerUser = smeEntity.customer.users?.some(
      user => user.auth0Id === auth0Id && user.accountType === 'OWNER'
    );
    
    return !!isOwnerUser;
  }
  
  // Helper method to map Sme entity to CompanyResponseDto
  private mapSmeToCompanyResponse(sme: Sme): CompanyResponseDto {
    const customer = sme.customer;
    const smeData = customer?.smeData;
    
    const response: CompanyResponseDto = {
      id: customer?.id,
      name: sme.name,
      logo: sme.logoUrl,
      description: sme.description,
      legalForm: sme.legalForm,
      industry: sme.industry,
      size: sme.size,
      website: sme.website,
      facebookPage: sme.facebookPage,
      rccm: sme.rccm,
      taxId: sme.taxId,
      natId: sme.natId,
      createdAt: customer?.createdAt,
      updatedAt: customer?.updatedAt,
      createdBy: customer?.createdBy,
    };
    
    // Add SME specific data if available
    if (smeData) {
      response.address = smeData.address;
      response.locations = smeData.locations;
      response.contacts = smeData.contacts;
      response.owner = smeData.owner;
      response.associates = smeData.associates;
      response.activities = smeData.activities;
      response.capital = smeData.capital;
      response.financials = smeData.financials;
      response.affiliations = smeData.affiliations;
    }
    
    // Add subscription information if available
    if (customer?.subscriptions?.length > 0) {
      const latestSubscription = customer.subscriptions[0];
      response.subscription = {
        plan: {
          name: latestSubscription.plan?.name || 'Unknown Plan',
        },
        status: latestSubscription.status,
        currentPeriodEnd: latestSubscription.endDate,
      };
    }
    
    return response;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const sme = await this.smeRepository.findOne({
      where: { customerId: id },
      relations: ['customer'],
    });
    
    if (!sme) {
      throw new NotFoundException(`SME with ID ${id} not found`);
    }
    
    // Set status to inactive or perform soft delete
    if (sme.customer) {
      sme.customer.status = CustomerStatus.INACTIVE;
      await this.customerRepository.save(sme.customer);
    }
    
    // Publish event to Kafka if needed
    await this.customerEventsProducer.emitSmeUpdated({
      sme: {
        customerId: id,
        updatedAt: new Date()
      },
      customer: sme.customer
    });
    
    return { success: true, message: 'SME deleted successfully' };
  }

  async validate(id: string, validatedBy: string): Promise<{ success: boolean; message: string }> {
    const sme = await this.smeRepository.findOne({
      where: { customerId: id },
      relations: ['customer'],
    });
    
    if (!sme) {
      throw new NotFoundException(`SME with ID ${id} not found`);
    }
    
    if (sme.customer) {
      sme.customer.status = CustomerStatus.ACTIVE;
      sme.customer.validatedAt = new Date();
      sme.customer.validatedBy = validatedBy;
      await this.customerRepository.save(sme.customer);
    }
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitSmeUpdated({
      sme: {
        customerId: id,
        updatedAt: new Date()
      },
      customer: sme.customer
    });
    
    return { success: true, message: 'SME validated successfully' };
  }

  async suspend(id: string, suspendedBy: string, reason: string): Promise<{ success: boolean; message: string }> {
    const sme = await this.smeRepository.findOne({
      where: { customerId: id },
      relations: ['customer'],
    });
    
    if (!sme) {
      throw new NotFoundException(`SME with ID ${id} not found`);
    }
    
    if (sme.customer) {
      sme.customer.status = CustomerStatus.SUSPENDED;
      sme.customer.suspensionReason = reason;
      sme.customer.suspendedAt = new Date();
      sme.customer.suspendedBy = suspendedBy;
      await this.customerRepository.save(sme.customer);
    }
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitSmeUpdated({
      sme: {
        customerId: id,
        updatedAt: new Date()
      },
      customer: sme.customer
    });
    
    return { success: true, message: 'SME suspended successfully' };
  }

  async reject(id: string, rejectedBy: string, reason: string): Promise<{ success: boolean; message: string }> {
    const sme = await this.smeRepository.findOne({
      where: { customerId: id },
      relations: ['customer'],
    });
    
    if (!sme) {
      throw new NotFoundException(`SME with ID ${id} not found`);
    }
    
    if (sme.customer) {
      sme.customer.status = CustomerStatus.INACTIVE;
      sme.customer.suspensionReason = reason;
      sme.customer.rejectedAt = new Date();
      sme.customer.rejectedBy = rejectedBy;
      await this.customerRepository.save(sme.customer);
    }
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitSmeUpdated({
      sme: {
        customerId: id,
        updatedAt: new Date(),
        status: CustomerStatus.INACTIVE
      },
      customer: sme.customer
    });
    
    return { success: true, message: 'SME rejected successfully' };
  }

  async getBusinessData(id: string): Promise<any> {
    const sme = await this.smeRepository.findOne({
      where: { customerId: id },
      relations: ['customer', 'customer.smeData'],
    });
    
    if (!sme) {
      throw new NotFoundException(`SME with ID ${id} not found`);
    }
    
    if (!sme.customer?.smeData) {
      throw new NotFoundException(`Business data for SME with ID ${id} not found`);
    }
    
    // Return the business data
    return {
      id: sme.customerId,
      name: sme.name,
      industry: sme.industry,
      size: sme.size,
      activities: sme.customer.smeData.activities,
      financials: sme.customer.smeData.financials,
      // Include any other business data fields that actually exist in SmeSpecificData
      capital: sme.customer.smeData.capital,
      affiliations: sme.customer.smeData.affiliations
    };
  }
}
