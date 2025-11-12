import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, IsNull } from 'typeorm';
import { Customer, CustomerStatus, CustomerType } from '../entities/customer.entity';
import { Sme } from '../entities/sme.entity';
import { SmeSpecificData } from '../entities/sme-specific-data.entity';
import { User, UserType, AccountType } from '../../system-users/entities/user.entity';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { 
  CreateCompanyDto, 
  UpdateCompanyDto, 
  CompanyResponseDto, 
  AssociateDto 
} from '../dto/company.dto';
import { LocationDto } from '../shared';
import { 
  CreateExtendedIdentificationDto, 
  UpdateExtendedIdentificationDto, 
  ExtendedCompanyResponseDto, 
  ValidationResultDto, 
  CompletionStatusDto 
} from '../dto/extended-company.dto';
import { EnterpriseIdentificationForm } from '../entities/enterprise-identification-form.entity';
import { AssetData } from '../entities/asset-data.entity';
import { StockData } from '../entities/stock-data.entity';
import { BaseCustomerService, MulterFile, FileUploadResponseDto } from '../shared';

// Helper function to generate UUID-like ID
const generateId = () => {
  return 'id-' + Math.random().toString(36).substr(2, 16);
};

@Injectable()
export class SmeService extends BaseCustomerService<CompanyResponseDto> {
  constructor(
    @InjectRepository(Customer)
    customerRepository: Repository<Customer>,
    @InjectRepository(Sme)
    private readonly smeRepository: Repository<Sme>,
    @InjectRepository(SmeSpecificData)
    private readonly smeDataRepository: Repository<SmeSpecificData>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(EnterpriseIdentificationForm)
    private readonly enterpriseIdentificationFormRepository: Repository<EnterpriseIdentificationForm>,
    @InjectRepository(AssetData)
    private readonly assetRepository: Repository<AssetData>,
    @InjectRepository(StockData)
    private readonly stockRepository: Repository<StockData>,
    customerEventsProducer: CustomerEventsProducer,
    cloudinaryService: CloudinaryService,
  ) {
    super(customerRepository, customerEventsProducer, cloudinaryService);
  }

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
    // Validate required fields
    if (!createCompanyDto.contacts?.email) {
      throw new BadRequestException('Email de contact requis');
    }
    if (!createCompanyDto.contacts?.phone) {
      throw new BadRequestException('Téléphone de contact requis');
    }
    if (!auth0Id) {
      throw new BadRequestException('Un utilisateur authentifié est requis pour créer une entreprise');
    }

    // Verify that the creating user exists in our system
    const creatingUser = await this.userRepository.findOne({ where: { auth0Id } });
    if (!creatingUser) {
      throw new BadRequestException(`L'utilisateur avec l'ID Auth0 ${auth0Id} n'existe pas dans le système`);
    }

    // Ensure owner information is provided or use creating user
    const ownerInfo = createCompanyDto.owner || {
      name: creatingUser.name,
      email: creatingUser.email,
      id: creatingUser.id
    };

    // Create base customer entity
    const customer = this.customerRepository.create({
      name: createCompanyDto.name, // Add the required name field
      email: createCompanyDto.contacts.email, // Add the required email field
      phone: createCompanyDto.contacts.phone, // Add the required phone field
      type: CustomerType.SME,
      status: CustomerStatus.PENDING,
      createdBy: auth0Id,
      ownerId: creatingUser.id, // Ensure owner is set
      ownerEmail: creatingUser.email,
      owner: ownerInfo,
    });
    
    const savedCustomerResult = await this.customerRepository.save(customer);
    const savedCustomer = Array.isArray(savedCustomerResult) ? savedCustomerResult[0] : savedCustomerResult;
    
    // Create SME specific entity
    const sme = this.smeRepository.create({
      name: createCompanyDto.name,
      logoUrl: createCompanyDto.logo,
      legalForm: createCompanyDto.legalForm,
      industry: createCompanyDto.industry,
      size: createCompanyDto.size,
      website: createCompanyDto.website,
      rccm: createCompanyDto.rccm,
      taxId: createCompanyDto.taxId,
      natId: createCompanyDto.natId,
      customerId: savedCustomer.id,
    });
    
    const savedSmeResult = await this.smeRepository.save(sme);
    const savedSme = Array.isArray(savedSmeResult) ? savedSmeResult[0] : savedSmeResult;
    
    // Create SME specific data
    const smeData = this.smeDataRepository.create({
      // Map from createCompanyDto to SmeSpecificData fields
      address: createCompanyDto.address,
      contacts: createCompanyDto.contacts,
      owner: ownerInfo, // Use the validated owner info
    });
    
    const savedSmeDataResult = await this.smeDataRepository.save(smeData);
    const savedSmeData = Array.isArray(savedSmeDataResult) ? savedSmeDataResult[0] : savedSmeDataResult;
    
    // Update customer with SME data reference
    savedCustomer.smeData = savedSmeData;
    await this.customerRepository.save(savedCustomer);

    // Associate the creating user with the company as OWNER
    creatingUser.customerId = savedCustomer.id;
    creatingUser.companyId = savedCustomer.id;
    creatingUser.userType = UserType.SME;
    creatingUser.isCompanyOwner = true;
    creatingUser.accountType = AccountType.OWNER;
    await this.userRepository.save(creatingUser);
    
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

  /**
   * Validation method to ensure all companies have valid owners
   */
  async validateCompanyOwnership(): Promise<{ valid: boolean, issues: string[] }> {
    const issues: string[] = [];
    
    // Find all companies without ownerId
    const companiesWithoutOwner = await this.customerRepository.find({
      where: { 
        type: CustomerType.SME, 
        ownerId: IsNull() 
      }
    });
    
    companiesWithoutOwner.forEach(company => {
      issues.push(`Company "${company.name}" (ID: ${company.id}) has no owner assigned`);
    });
    
    // Find all companies where ownerId doesn't correspond to an existing user
    const companiesWithInvalidOwner = await this.customerRepository
      .createQueryBuilder('customer')
      .leftJoin('users', 'user', 'user.id = customer.ownerId')
      .where('customer.type = :type', { type: CustomerType.SME })
      .andWhere('customer.ownerId IS NOT NULL')
      .andWhere('user.id IS NULL')
      .getMany();
    
    companiesWithInvalidOwner.forEach(company => {
      issues.push(`Company "${company.name}" (ID: ${company.id}) has invalid owner ID: ${company.ownerId}`);
    });
    
    return {
      valid: issues.length === 0,
      issues
    };
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

  async updateLogo(id: string, file: MulterFile): Promise<string> {
    const smeEntity = await this.smeRepository.findOne({
      where: { customerId: id },
    });
    
    if (!smeEntity) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    
    // Upload logo using inherited method
    const uploadResult = await this.uploadImage(id, file, 'companies/logos');
    
    // Update logo URL in the database
    smeEntity.logoUrl = uploadResult.url;
    const savedSme = await this.smeRepository.save(smeEntity);
    
    // Emit event
    await this.customerEventsProducer.emitSmeUpdated({
      sme: savedSme
    });
    
    return uploadResult.url;
  }
  
  async updateOwnerCV(id: string, file: MulterFile): Promise<string> {
    const smeEntity = await this.smeRepository.findOne({
      where: { customerId: id },
      relations: ['customer', 'customer.smeData'],
    });
    
    if (!smeEntity || !smeEntity.customer?.smeData) {
      throw new NotFoundException(`Company with ID ${id} not found or missing data`);
    }
    
    // Upload CV using inherited document upload method
    const uploadResult = await this.uploadDocument(id, file, 'companies/owner-cv');
    
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
      id: generateId(), // Generate a unique ID for the location
      address: locationDto.address || '', // Ensure address is defined
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
      id: generateId(), // Generate a unique ID for the associate
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
    // Use inherited method from BaseCustomerService
    return this.isCustomerOwner(companyId, auth0Id);
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
      response.locations = smeData.locations?.map(loc => ({
        id: loc.id || '',
        name: loc.name,
        type: loc.type,
        address: loc.address,
        coordinates: loc.coordinates
      }));
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

  // Méthode validate héritée de BaseCustomerService

  // Méthodes suspend et reject héritées de BaseCustomerService

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

  // =====================================================
  // NOUVELLES MÉTHODES POUR L'IDENTIFICATION ÉTENDUE
  // =====================================================

  async createOrUpdateExtendedIdentification(
    companyId: string,
    extendedIdentificationDto: CreateExtendedIdentificationDto
  ): Promise<ExtendedCompanyResponseDto> {
    // Vérifier que l'entreprise existe
    const customer = await this.customerRepository.findOne({
      where: { id: companyId },
      relations: ['extendedIdentification']
    });

    if (!customer) {
      throw new NotFoundException(`Entreprise avec l'ID ${companyId} non trouvée`);
    }

    let extendedIdentification: EnterpriseIdentificationForm;

    if (customer.extendedIdentification) {
      // Mise à jour du formulaire existant
      Object.assign(customer.extendedIdentification, extendedIdentificationDto);
      extendedIdentification = await this.enterpriseIdentificationFormRepository.save(
        customer.extendedIdentification
      );
    } else {
      // Création d'un nouveau formulaire
      extendedIdentification = this.enterpriseIdentificationFormRepository.create({
        customerId: customer.id,
        generalInfo: extendedIdentificationDto.generalInfo as any,
        legalInfo: extendedIdentificationDto.legalInfo as any,
        patrimonyAndMeans: extendedIdentificationDto.patrimonyAndMeans as any,
        specificities: extendedIdentificationDto.specificities as any,
        performance: extendedIdentificationDto.performance as any
      });
      extendedIdentification = await this.enterpriseIdentificationFormRepository.save(
        extendedIdentification
      );
      
      // Associer le formulaire au customer
      customer.extendedIdentification = extendedIdentification;
      await this.customerRepository.save(customer);
    }

    // Publier le profil complet pour l'admin-service
    const smeData = await this.smeDataRepository.findOne({ where: { id: customer.smeData?.id } });
    const assets = await this.assetRepository.find({ where: { customer: { id: companyId } } });
    const stocks = await this.stockRepository.find({ where: { customer: { id: companyId } } });
    
    await this.customerEventsProducer.emitCompanyProfileShare({
      customer,
      smeData: smeData || null,
      extendedIdentification,
      assets,
      stocks,
      financialData: {
        totalAssetsValue: assets.reduce((sum, asset) => sum + (asset.valeurActuelle || 0), 0),
        lastValuationDate: new Date().toISOString(),
      }
    });

    // Notifier la mise à jour du profil
    await this.customerEventsProducer.emitCustomerProfileUpdated({
      customerId: companyId,
      customerType: 'COMPANY',
      updatedFields: ['extended_identification', 'completion_percentage'],
      updateContext: {
        updateSource: 'form_submission',
        formType: 'extended_identification'
      }
    });

    return this.transformToExtendedCompanyResponse(extendedIdentification);
  }

  async getExtendedIdentification(companyId: string): Promise<ExtendedCompanyResponseDto | null> {
    const customer = await this.customerRepository.findOne({
      where: { id: companyId },
      relations: ['extendedIdentification']
    });

    if (!customer) {
      throw new NotFoundException(`Entreprise avec l'ID ${companyId} non trouvée`);
    }

    if (!customer.extendedIdentification) {
      return null;
    }

    return this.transformToExtendedCompanyResponse(customer.extendedIdentification);
  }

  async updateExtendedIdentification(
    companyId: string,
    updateDto: UpdateExtendedIdentificationDto
  ): Promise<ExtendedCompanyResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { id: companyId },
      relations: ['extendedIdentification']
    });

    if (!customer) {
      throw new NotFoundException(`Entreprise avec l'ID ${companyId} non trouvée`);
    }

    if (!customer.extendedIdentification) {
      throw new NotFoundException(`Formulaire d'identification étendu non trouvé pour l'entreprise ${companyId}`);
    }

    // Mise à jour partielle
    Object.assign(customer.extendedIdentification, updateDto);
    
    const updatedForm = await this.enterpriseIdentificationFormRepository.save(
      customer.extendedIdentification
    );

    // Émettre un événement Kafka (en commentaire car la méthode emit n'existe pas)
    // await this.customerEventsProducer.emit('customer.extended-identification.updated', {
    //   customerId: companyId,
    //   timestamp: new Date(),
    //   data: updatedForm
    // });

    return this.transformToExtendedCompanyResponse(updatedForm);
  }

  async deleteExtendedIdentification(companyId: string): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { id: companyId },
      relations: ['extendedIdentification']
    });

    if (!customer) {
      throw new NotFoundException(`Entreprise avec l'ID ${companyId} non trouvée`);
    }

    if (!customer.extendedIdentification) {
      throw new NotFoundException(`Formulaire d'identification étendu non trouvé pour l'entreprise ${companyId}`);
    }

    await this.enterpriseIdentificationFormRepository.remove(customer.extendedIdentification);

    // Émettre un événement Kafka (en commentaire car la méthode emit n'existe pas)
    // await this.customerEventsProducer.emit('customer.extended-identification.deleted', {
    //   customerId: companyId,
    //   timestamp: new Date()
    // });
  }

  async validateExtendedIdentification(companyId: string): Promise<ValidationResultDto> {
    const customer = await this.customerRepository.findOne({
      where: { id: companyId },
      relations: ['extendedIdentification']
    });

    if (!customer) {
      throw new NotFoundException(`Entreprise avec l'ID ${companyId} non trouvée`);
    }

    if (!customer.extendedIdentification) {
      throw new NotFoundException(`Formulaire d'identification étendu non trouvé pour l'entreprise ${companyId}`);
    }

    const form = customer.extendedIdentification;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation des informations générales
    if (!form.generalInfo?.companyName) {
      errors.push('Le nom de l\'entreprise est requis');
    }
    if (!form.generalInfo?.legalForm) {
      errors.push('La forme juridique est requise');
    }
    if (!form.generalInfo?.foundingDate) {
      errors.push('La date de création est requise');
    }

    // Validation des informations légales
    if (!form.legalInfo?.businessLicense) {
      errors.push('La licence d\'affaires est requise');
    }

    // Validation du patrimoine
    if (!form.patrimonyAndMeans) {
      warnings.push('Le patrimoine et moyens ne sont pas spécifiés');
    }

    // Validation des performances
    if (!form.performance?.financial) {
      warnings.push('Les informations financières ne sont pas spécifiées');
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings
    };
  }

  async getExtendedIdentificationCompletion(companyId: string): Promise<CompletionStatusDto> {
    const customer = await this.customerRepository.findOne({
      where: { id: companyId },
      relations: ['extendedIdentification']
    });

    if (!customer) {
      throw new NotFoundException(`Entreprise avec l'ID ${companyId} non trouvée`);
    }

    if (!customer.extendedIdentification) {
      return {
        overallCompletion: 0,
        generalInfo: false,
        legalInfo: false,
        patrimonyAndMeans: false,
        specificities: false,
        performance: false
      };
    }

    const form = customer.extendedIdentification;
    const generalInfoComplete = !!form.generalInfo?.companyName;
    const legalInfoComplete = !!form.legalInfo?.businessLicense;
    const patrimonyComplete = !!form.patrimonyAndMeans;
    const specificitiesComplete = !!form.specificities;
    const performanceComplete = !!form.performance;

    const completedSections = [
      generalInfoComplete,
      legalInfoComplete,
      patrimonyComplete,
      specificitiesComplete,
      performanceComplete
    ].filter(Boolean).length;

    const overallCompletion = Math.round((completedSections / 5) * 100);

    return {
      overallCompletion,
      generalInfo: generalInfoComplete,
      legalInfo: legalInfoComplete,
      patrimonyAndMeans: patrimonyComplete,
      specificities: specificitiesComplete,
      performance: performanceComplete
    };
  }

  private transformToExtendedCompanyResponse(form: EnterpriseIdentificationForm): ExtendedCompanyResponseDto {
    // Version très simplifiée pour éviter les erreurs de conversion de types
    return {
      id: form.id,
      customerId: form.customer?.id || '',
      generalInfo: {
        companyName: form.generalInfo?.companyName || '',
        tradeName: form.generalInfo?.tradeName,
        legalForm: form.generalInfo?.legalForm || 'SARL',
        companyType: form.generalInfo?.companyType || 'traditional',
        sector: form.generalInfo?.sector || '',
        foundingDate: form.generalInfo?.foundingDate?.toISOString(),
        headquarters: form.generalInfo?.headquarters || {
          address: '',
          city: '',
          province: '',
          country: ''
        },
        mainContact: form.generalInfo?.mainContact || {
          name: '',
          position: '',
          email: '',
          phone: ''
        },
        digitalPresence: form.generalInfo?.digitalPresence
      },
      legalInfo: form.legalInfo ? {
        businessLicense: form.legalInfo.businessLicense ? {
          number: form.legalInfo.businessLicense.number,
          issuedBy: form.legalInfo.businessLicense.issuedBy,
          issuedDate: form.legalInfo.businessLicense.issuedDate.toISOString(),
          expiryDate: form.legalInfo.businessLicense.expiryDate?.toISOString()
        } : undefined,
        taxCompliance: {
          isUpToDate: false,
          lastFilingDate: undefined,
          nextFilingDue: undefined
        },
        legalStatus: {
          hasLegalIssues: false,
          issues: [],
          hasGovernmentContracts: false,
          contractTypes: []
        }
      } : undefined,
      patrimonyAndMeans: undefined, // TODO: Implémenter la conversion complète
      specificities: undefined, // TODO: Implémenter la conversion complète
      performance: undefined, // TODO: Implémenter la conversion complète
      completionPercentage: this.calculateSimpleCompletion(form),
      completionStatus: {
        overallCompletion: this.calculateSimpleCompletion(form),
        generalInfo: !!form.generalInfo?.companyName,
        legalInfo: !!form.legalInfo?.businessLicense,
        patrimonyAndMeans: !!form.patrimonyAndMeans,
        specificities: !!form.specificities,
        performance: !!form.performance
      },
      createdAt: form.createdAt.toISOString(),
      updatedAt: form.updatedAt.toISOString()
    };
  }

  private calculateSimpleCompletion(form: EnterpriseIdentificationForm): number {
    const sections = [
      !!form.generalInfo?.companyName,
      !!form.legalInfo?.businessLicense,
      !!form.patrimonyAndMeans,
      !!form.specificities,
      !!form.performance
    ];
    
    const completedSections = sections.filter(Boolean).length;
    return Math.round((completedSections / 5) * 100);
  }

  private calculateCompletionPercentage(form: EnterpriseIdentificationForm): number {
    const sections = this.calculateSectionCompletion(form);
    return Math.round(Object.values(sections).reduce((sum, val) => sum + val, 0) / 5);
  }

  private calculateSectionCompletion(form: EnterpriseIdentificationForm): {
    generalInfo: number;
    legalInfo: number;
    patrimonyAndMeans: number;
    specificities: number;
    performance: number;
  } {
    const generalInfoCompletion = this.calculateFieldCompletion(form.generalInfo, [
      'companyName', 'legalForm', 'creationDate', 'headquartersAddress', 'businessSector'
    ]);

    const legalInfoCompletion = this.calculateFieldCompletion(form.legalInfo, [
      'rccm', 'taxId', 'companyRegistry', 'authorizations'
    ]);

    const patrimonyCompletion = this.calculateFieldCompletion(form.patrimonyAndMeans, [
      'capitalAmount', 'capitalCurrency', 'shareholders', 'financialStatements'
    ]);

    const specificitiesCompletion = this.calculateFieldCompletion(form.specificities, [
      'businessActivities', 'targetMarkets', 'competitiveAdvantages'
    ]);

    const performanceCompletion = this.calculateFieldCompletion(form.performance, [
      'annualRevenue', 'netProfit', 'employeeCount', 'growthRate'
    ]);

    return {
      generalInfo: generalInfoCompletion,
      legalInfo: legalInfoCompletion,
      patrimonyAndMeans: patrimonyCompletion,
      specificities: specificitiesCompletion,
      performance: performanceCompletion
    };
  }

  private calculateFieldCompletion(section: any, requiredFields: string[]): number {
    if (!section) return 0;
    
    const completedFields = requiredFields.filter(field => {
      const value = section[field];
      return value !== null && value !== undefined && value !== '';
    });

    return Math.round((completedFields.length / requiredFields.length) * 100);
  }

  private getMissingFields(form: EnterpriseIdentificationForm): string[] {
    const missing: string[] = [];

    if (!form.generalInfo?.companyName) missing.push('Nom de l\'entreprise');
    if (!form.generalInfo?.legalForm) missing.push('Forme juridique');
    if (!form.generalInfo?.foundingDate) missing.push('Date de création');
    if (!form.legalInfo?.businessLicense) missing.push('Licence d\'affaires');
    if (!form.patrimonyAndMeans) missing.push('Patrimoine et moyens');
    if (!form.performance) missing.push('Performances');

    return missing;
  }

  // =====================================================
  // NOUVEAUX MÉTHODES POUR GESTION PATRIMOINE 
  // =====================================================

  async getCompanyPatrimoine(companyId: string): Promise<any> {
    const customer = await this.customerRepository.findOne({
      where: { id: companyId },
      relations: ['assets', 'stocks']
    });

    if (!customer) {
      throw new NotFoundException(`Entreprise avec l'ID ${companyId} non trouvée`);
    }

    return {
      companyId: customer.id,
      companyName: customer.name,
      assets: customer.assets || [],
      stocks: customer.stocks || [],
      totalAssetValue: this.calculateTotalAssetValue(customer.assets || []),
      totalStockValue: this.calculateTotalStockValue(customer.stocks || [])
    };
  }

  async addCompanyAsset(companyId: string, assetData: any): Promise<any> {
    const customer = await this.customerRepository.findOne({
      where: { id: companyId },
      relations: ['assets']
    });

    if (!customer) {
      throw new NotFoundException(`Entreprise avec l'ID ${companyId} non trouvée`);
    }

    const newAsset = this.assetRepository.create({
      ...assetData,
      customer: customer
    });

    const savedAsset = await this.assetRepository.save(newAsset);

    // Notifier la mise à jour du patrimoine
    await this.customerEventsProducer.emitCustomerProfileUpdated({
      customerId: companyId,
      customerType: 'COMPANY',
      updatedFields: ['assets', 'patrimoine'],
      updateContext: {
        updateSource: 'form_submission',
        formType: 'asset_addition'
      }
    });

    return savedAsset;
  }

  async updateCompanyAsset(companyId: string, assetId: string, updateData: any): Promise<any> {
    const asset = await this.assetRepository.findOne({
      where: { id: assetId, customer: { id: companyId } }
    });

    if (!asset) {
      throw new NotFoundException(`Actif avec l'ID ${assetId} non trouvé pour cette entreprise`);
    }

    Object.assign(asset, updateData);
    return await this.assetRepository.save(asset);
  }

  async deleteCompanyAsset(companyId: string, assetId: string): Promise<void> {
    const asset = await this.assetRepository.findOne({
      where: { id: assetId, customer: { id: companyId } }
    });

    if (!asset) {
      throw new NotFoundException(`Actif avec l'ID ${assetId} non trouvé pour cette entreprise`);
    }

    await this.assetRepository.remove(asset);

    // Notifier la mise à jour du patrimoine
    await this.customerEventsProducer.emitCustomerProfileUpdated({
      customerId: companyId,
      customerType: 'COMPANY',
      updatedFields: ['assets', 'patrimoine'],
      updateContext: {
        updateSource: 'form_submission',
        formType: 'asset_deletion'
      }
    });
  }

  async addCompanyStock(companyId: string, stockData: any): Promise<any> {
    const customer = await this.customerRepository.findOne({
      where: { id: companyId },
      relations: ['stocks']
    });

    if (!customer) {
      throw new NotFoundException(`Entreprise avec l'ID ${companyId} non trouvée`);
    }

    const newStock = this.stockRepository.create({
      ...stockData,
      customer: customer
    });

    const savedStock = await this.stockRepository.save(newStock);
    return savedStock;
  }

  async updateCompanyStock(companyId: string, stockId: string, updateData: any): Promise<any> {
    const stock = await this.stockRepository.findOne({
      where: { id: stockId, customer: { id: companyId } }
    });

    if (!stock) {
      throw new NotFoundException(`Stock avec l'ID ${stockId} non trouvé pour cette entreprise`);
    }

    Object.assign(stock, updateData);
    return await this.stockRepository.save(stock);
  }

  async deleteCompanyStock(companyId: string, stockId: string): Promise<void> {
    const stock = await this.stockRepository.findOne({
      where: { id: stockId, customer: { id: companyId } }
    });

    if (!stock) {
      throw new NotFoundException(`Stock avec l'ID ${stockId} non trouvé pour cette entreprise`);
    }

    await this.stockRepository.remove(stock);
  }

  async calculatePatrimoineValorisation(companyId: string): Promise<any> {
    const customer = await this.customerRepository.findOne({
      where: { id: companyId },
      relations: ['assets', 'stocks']
    });

    if (!customer) {
      throw new NotFoundException(`Entreprise avec l'ID ${companyId} non trouvée`);
    }

    const totalAssetValue = this.calculateTotalAssetValue(customer.assets || []);
    const totalStockValue = this.calculateTotalStockValue(customer.stocks || []);
    const totalPatrimoine = totalAssetValue + totalStockValue;

    return {
      companyId: customer.id,
      companyName: customer.name,
      valorisation: {
        totalAssetValue,
        totalStockValue,
        totalPatrimoine,
        currency: 'USD',
        calculatedAt: new Date().toISOString()
      },
      breakdown: {
        assetCount: customer.assets?.length || 0,
        stockItemCount: customer.stocks?.length || 0
      }
    };
  }

  private calculateTotalAssetValue(assets: any[]): number {
    return assets.reduce((total, asset) => {
      return total + (asset.valeurActuelle || asset.prixAchat || 0);
    }, 0);
  }

  private calculateTotalStockValue(stocks: any[]): number {
    return stocks.reduce((total, stock) => {
      return total + (stock.valeurTotaleStock || 0);
    }, 0);
  }
}
