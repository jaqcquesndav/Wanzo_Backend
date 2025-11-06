import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnterpriseIdentificationForm } from '../entities/enterprise-identification-form.entity';
import { Customer } from '../entities/customer.entity';
import {
  CreateExtendedIdentificationDto,
  UpdateExtendedIdentificationDto,
  ExtendedCompanyResponseDto,
  ValidationResultDto,
  CompletionStatusDto
} from '../dto/extended-company.dto';

@Injectable()
export class ExtendedIdentificationService {
  constructor(
    @InjectRepository(EnterpriseIdentificationForm)
    private readonly identificationRepository: Repository<EnterpriseIdentificationForm>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>
  ) {}

  /**
   * Récupérer le formulaire d'identification étendu par customer ID
   */
  async getByCustomerId(customerId: string): Promise<ExtendedCompanyResponseDto> {
    // Vérifier que le customer existe
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
      relations: ['extendedIdentification']
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (!customer.extendedIdentification) {
      throw new NotFoundException('Extended identification form not found');
    }

    return this.mapToDto(customer.extendedIdentification);
  }

  /**
   * Créer un nouveau formulaire d'identification étendu
   */
  async create(
    customerId: string,
    createData: CreateExtendedIdentificationDto
  ): Promise<ExtendedCompanyResponseDto> {
    // Vérifier que le customer existe
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
      relations: ['extendedIdentification']
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Vérifier qu'il n'y a pas déjà un formulaire
    if (customer.extendedIdentification) {
      throw new BadRequestException('Extended identification form already exists for this customer');
    }

    // Créer le formulaire
    const identification = this.identificationRepository.create({
      customerId,
      generalInfo: this.convertDtoToEntity(createData.generalInfo),
      legalInfo: this.convertDtoToEntity(createData.legalInfo),
      patrimonyAndMeans: this.convertDtoToEntity(createData.patrimonyAndMeans),
      specificities: this.convertDtoToEntity(createData.specificities),
      performance: this.convertDtoToEntity(createData.performance)
    });

    const savedIdentification = await this.identificationRepository.save(identification);

    return this.mapToDto(savedIdentification);
  }

  /**
   * Mettre à jour le formulaire d'identification étendu
   */
  async update(
    customerId: string,
    updateData: UpdateExtendedIdentificationDto
  ): Promise<ExtendedCompanyResponseDto> {
    const identification = await this.identificationRepository.findOne({
      where: { customerId }
    });

    if (!identification) {
      throw new NotFoundException('Extended identification form not found');
    }

    // Mettre à jour les sections fournies
    if (updateData.generalInfo) {
      identification.generalInfo = {
        ...identification.generalInfo,
        ...this.convertDtoToEntity(updateData.generalInfo)
      };
    }

    if (updateData.legalInfo) {
      identification.legalInfo = {
        ...identification.legalInfo,
        ...this.convertDtoToEntity(updateData.legalInfo)
      };
    }

    if (updateData.patrimonyAndMeans) {
      identification.patrimonyAndMeans = {
        ...identification.patrimonyAndMeans,
        ...this.convertDtoToEntity(updateData.patrimonyAndMeans)
      };
    }

    if (updateData.specificities) {
      identification.specificities = {
        ...identification.specificities,
        ...this.convertDtoToEntity(updateData.specificities)
      };
    }

    if (updateData.performance) {
      identification.performance = {
        ...identification.performance,
        ...this.convertDtoToEntity(updateData.performance)
      };
    }

    const updatedIdentification = await this.identificationRepository.save(identification);

    return this.mapToDto(updatedIdentification);
  }

  /**
   * Mettre à jour une section spécifique
   */
  async updateSection(
    customerId: string,
    section: 'generalInfo' | 'legalInfo' | 'patrimonyAndMeans' | 'specificities' | 'performance',
    sectionData: any
  ): Promise<void> {
    const identification = await this.identificationRepository.findOne({
      where: { customerId }
    });

    if (!identification) {
      throw new NotFoundException('Extended identification form not found');
    }

    // Mettre à jour la section spécifiée
    identification[section] = {
      ...identification[section],
      ...this.convertDtoToEntity(sectionData)
    };

    await this.identificationRepository.save(identification);
  }

  /**
   * Valider le formulaire d'identification
   */
  async validateForm(customerId: string): Promise<ValidationResultDto> {
    const identification = await this.identificationRepository.findOne({
      where: { customerId }
    });

    if (!identification) {
      throw new NotFoundException('Extended identification form not found');
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validation des informations générales
    this.validateGeneralInfo(identification.generalInfo, errors, warnings, suggestions);

    // Validation des informations légales
    if (identification.legalInfo) {
      this.validateLegalInfo(identification.legalInfo, errors, warnings, suggestions);
    }

    // Validation du patrimoine et moyens
    if (identification.patrimonyAndMeans) {
      this.validatePatrimonyAndMeans(identification.patrimonyAndMeans, errors, warnings, suggestions);
    }

    // Validation des spécificités
    if (identification.specificities) {
      this.validateSpecificities(identification.specificities, errors, warnings, suggestions);
    }

    // Validation des performances
    if (identification.performance) {
      this.validatePerformance(identification.performance, errors, warnings, suggestions);
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  /**
   * Obtenir le statut de completion du formulaire
   */
  async getCompletionStatus(customerId: string): Promise<{
    overallCompletion: number;
    sections: {
      generalInfo: { completed: boolean; percentage: number };
      legalInfo: { completed: boolean; percentage: number };
      patrimonyAndMeans: { completed: boolean; percentage: number };
      specificities: { completed: boolean; percentage: number };
      performance: { completed: boolean; percentage: number };
    };
  }> {
    const identification = await this.identificationRepository.findOne({
      where: { customerId }
    });

    if (!identification) {
      return {
        overallCompletion: 0,
        sections: {
          generalInfo: { completed: false, percentage: 0 },
          legalInfo: { completed: false, percentage: 0 },
          patrimonyAndMeans: { completed: false, percentage: 0 },
          specificities: { completed: false, percentage: 0 },
          performance: { completed: false, percentage: 0 }
        }
      };
    }

    const sections = {
      generalInfo: this.calculateSectionCompletion(identification.generalInfo, 'generalInfo'),
      legalInfo: this.calculateSectionCompletion(identification.legalInfo, 'legalInfo'),
      patrimonyAndMeans: this.calculateSectionCompletion(identification.patrimonyAndMeans, 'patrimonyAndMeans'),
      specificities: this.calculateSectionCompletion(identification.specificities, 'specificities'),
      performance: this.calculateSectionCompletion(identification.performance, 'performance')
    };

    // Calculer la completion globale
    const overallCompletion = Object.values(sections).reduce((acc, section) => acc + section.percentage, 0) / 5;

    return {
      overallCompletion: Math.round(overallCompletion),
      sections
    };
  }

  /**
   * Supprimer le formulaire d'identification étendu
   */
  async delete(customerId: string): Promise<void> {
    const identification = await this.identificationRepository.findOne({
      where: { customerId }
    });

    if (!identification) {
      throw new NotFoundException('Extended identification form not found');
    }

    await this.identificationRepository.remove(identification);
  }

  /**
   * Exporter le formulaire au format JSON
   */
  async exportForm(customerId: string): Promise<{
    customerId: string;
    exportedAt: string;
    form: ExtendedCompanyResponseDto;
  }> {
    const form = await this.getByCustomerId(customerId);

    return {
      customerId,
      exportedAt: new Date().toISOString(),
      form
    };
  }

  // ===== MÉTHODES PRIVÉES =====

  /**
   * Convertir GeneralInfo vers GeneralInfoDto
   */
  private convertGeneralInfoToDto(generalInfo: any): any {
    if (!generalInfo) return undefined;

    return {
      ...generalInfo,
      foundingDate: generalInfo.foundingDate instanceof Date 
        ? generalInfo.foundingDate.toISOString().split('T')[0] 
        : generalInfo.foundingDate
    };
  }

  /**
   * Convertir LegalInfo vers LegalInfoDto
   */
  private convertLegalInfoToDto(legalInfo: any): any {
    if (!legalInfo) return undefined;

    const converted = { ...legalInfo };

    if (converted.businessLicense && converted.businessLicense.issuedDate instanceof Date) {
      converted.businessLicense = {
        ...converted.businessLicense,
        issuedDate: converted.businessLicense.issuedDate.toISOString().split('T')[0],
        expiryDate: converted.businessLicense.expiryDate instanceof Date 
          ? converted.businessLicense.expiryDate.toISOString().split('T')[0]
          : converted.businessLicense.expiryDate
      };
    }

    if (converted.operatingLicenses) {
      converted.operatingLicenses = converted.operatingLicenses.map((license: any) => ({
        ...license,
        issuedDate: license.issuedDate instanceof Date 
          ? license.issuedDate.toISOString().split('T')[0]
          : license.issuedDate,
        expiryDate: license.expiryDate instanceof Date 
          ? license.expiryDate.toISOString().split('T')[0]
          : license.expiryDate
      }));
    }

    return converted;
  }

  /**
   * Convertir PatrimonyAndMeans vers PatrimonyAndMeansDto
   */
  private convertPatrimonyAndMeansToDto(patrimony: any): any {
    if (!patrimony) return undefined;

    const converted = { ...patrimony };

    if (converted.equipment) {
      converted.equipment = converted.equipment.map((item: any) => ({
        ...item,
        acquisitionDate: item.acquisitionDate instanceof Date 
          ? item.acquisitionDate.toISOString().split('T')[0]
          : item.acquisitionDate
      }));
    }

    return converted;
  }

  /**
   * Convertir Specificities vers SpecificitiesDto
   */
  private convertSpecificitiesToDto(specificities: any): any {
    if (!specificities) return undefined;

    const converted = { ...specificities };

    if (converted.startup?.fundraising?.investors) {
      converted.startup.fundraising.investors = converted.startup.fundraising.investors.map((investor: any) => ({
        ...investor,
        date: investor.date instanceof Date 
          ? investor.date.toISOString().split('T')[0]
          : investor.date
      }));
    }

    return converted;
  }

  /**
   * Convertir Performance vers PerformanceDto
   */
  private convertPerformanceToDto(performance: any): any {
    if (!performance) return undefined;

    const converted = { ...performance };

    if (converted.financial?.financingNeeds?.previousApplications) {
      converted.financial.financingNeeds.previousApplications = 
        converted.financial.financingNeeds.previousApplications.map((app: any) => ({
          ...app,
          date: app.date instanceof Date 
            ? app.date.toISOString().split('T')[0]
            : app.date
        }));
    }

    return converted;
  }

  /**
   * Convertir DTO vers entité avec conversion des dates
   */
  private convertDtoToEntity(dto: any): any {
    if (!dto) return undefined;

    const converted = JSON.parse(JSON.stringify(dto));

    // Convertir les dates string en Date objects récursivement
    this.convertStringDatesToDateObjects(converted);

    return converted;
  }

  /**
   * Convertir récursivement les dates string en Date objects
   */
  private convertStringDatesToDateObjects(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

    const dateFields = [
      'foundingDate', 'issuedDate', 'expiryDate', 'acquisitionDate', 'date'
    ];

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (dateFields.includes(key) && typeof obj[key] === 'string' && obj[key]) {
          obj[key] = new Date(obj[key]);
        } else if (Array.isArray(obj[key])) {
          obj[key].forEach((item: any) => this.convertStringDatesToDateObjects(item));
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          this.convertStringDatesToDateObjects(obj[key]);
        }
      }
    }
  }

  /**
   * Mapper l'entité vers un DTO
   */
  private mapToDto(identification: EnterpriseIdentificationForm): ExtendedCompanyResponseDto {
    const completionStatus = this.calculateCompletionStatusFromEntity(identification);

    return {
      id: identification.id,
      customerId: identification.customerId,
      generalInfo: this.convertGeneralInfoToDto(identification.generalInfo),
      legalInfo: identification.legalInfo ? this.convertLegalInfoToDto(identification.legalInfo) : undefined,
      patrimonyAndMeans: identification.patrimonyAndMeans ? this.convertPatrimonyAndMeansToDto(identification.patrimonyAndMeans) : undefined,
      specificities: identification.specificities ? this.convertSpecificitiesToDto(identification.specificities) : undefined,
      performance: identification.performance ? this.convertPerformanceToDto(identification.performance) : undefined,
      completionPercentage: completionStatus.overallCompletion,
      completionStatus: {
        overallCompletion: completionStatus.overallCompletion,
        generalInfo: !!identification.generalInfo,
        legalInfo: !!identification.legalInfo,
        patrimonyAndMeans: !!identification.patrimonyAndMeans,
        specificities: !!identification.specificities,
        performance: !!identification.performance
      },
      createdAt: identification.createdAt.toISOString(),
      updatedAt: identification.updatedAt.toISOString()
    };
  }

  /**
   * Calculer la completion d'une section
   */
  private calculateSectionCompletion(
    sectionData: any,
    sectionType: string
  ): { completed: boolean; percentage: number } {
    if (!sectionData) {
      return { completed: false, percentage: 0 };
    }

    let totalFields = 0;
    let completedFields = 0;

    // Définir les champs requis pour chaque section
    const requiredFields = this.getRequiredFieldsForSection(sectionType);

    // Compter les champs complétés récursivement
    const countFields = (obj: any, fields: string[]) => {
      fields.forEach(field => {
        totalFields++;
        const value = this.getNestedValue(obj, field);
        if (this.isFieldCompleted(value)) {
          completedFields++;
        }
      });
    };

    countFields(sectionData, requiredFields);

    const percentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    const completed = percentage >= 80; // Considérer comme complété si 80% des champs sont remplis

    return { completed, percentage };
  }

  /**
   * Obtenir les champs requis pour une section
   */
  private getRequiredFieldsForSection(sectionType: string): string[] {
    const requiredFields: Record<string, string[]> = {
      generalInfo: [
        'companyName',
        'legalForm',
        'companyType',
        'sector',
        'headquarters.address',
        'headquarters.city',
        'headquarters.country',
        'mainContact.name',
        'mainContact.email',
        'mainContact.phone'
      ],
      legalInfo: [
        'taxCompliance.isUpToDate',
        'legalStatus.hasLegalIssues',
        'legalStatus.hasGovernmentContracts'
      ],
      patrimonyAndMeans: [
        'shareCapital.authorizedCapital',
        'shareCapital.paidUpCapital',
        'shareCapital.currency',
        'humanResources.totalEmployees'
      ],
      specificities: [],
      performance: [
        'financial.revenue',
        'operational.productivity'
      ]
    };

    return requiredFields[sectionType] || [];
  }

  /**
   * Obtenir une valeur nested dans un objet
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Vérifier si un champ est complété
   */
  private isFieldCompleted(value: any): boolean {
    if (value === null || value === undefined || value === '') {
      return false;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }

    return true;
  }

  /**
   * Calculer le statut de completion à partir de l'entité
   */
  private calculateCompletionStatusFromEntity(identification: EnterpriseIdentificationForm): {
    overallCompletion: number;
  } {
    const sections = [
      identification.generalInfo,
      identification.legalInfo,
      identification.patrimonyAndMeans,
      identification.specificities,
      identification.performance
    ];

    const completedSections = sections.filter(section => !!section).length;
    const overallCompletion = Math.round((completedSections / sections.length) * 100);

    return { overallCompletion };
  }

  // ===== MÉTHODES DE VALIDATION =====

  private validateGeneralInfo(generalInfo: any, errors: string[], warnings: string[], suggestions: string[]): void {
    if (!generalInfo) {
      errors.push('General information is required');
      return;
    }

    if (!generalInfo.companyName) {
      errors.push('Company name is required');
    }

    if (!generalInfo.headquarters?.address) {
      errors.push('Company headquarters address is required');
    }

    if (!generalInfo.mainContact?.email) {
      errors.push('Main contact email is required');
    } else if (!this.isValidEmail(generalInfo.mainContact.email)) {
      errors.push('Main contact email format is invalid');
    }

    if (!generalInfo.mainContact?.phone) {
      warnings.push('Main contact phone number is recommended');
    }
  }

  private validateLegalInfo(legalInfo: any, errors: string[], warnings: string[], suggestions: string[]): void {
    if (!legalInfo.taxCompliance?.isUpToDate) {
      warnings.push('Tax compliance status should be up to date');
    }

    if (legalInfo.legalStatus?.hasLegalIssues === true && !legalInfo.legalStatus?.issues?.length) {
      errors.push('Please specify the legal issues');
    }
  }

  private validatePatrimonyAndMeans(patrimony: any, errors: string[], warnings: string[], suggestions: string[]): void {
    if (!patrimony.shareCapital) {
      errors.push('Share capital information is required');
      return;
    }

    if (patrimony.shareCapital.paidUpCapital > patrimony.shareCapital.authorizedCapital) {
      errors.push('Paid up capital cannot exceed authorized capital');
    }

    if (!patrimony.humanResources?.totalEmployees) {
      warnings.push('Number of employees information is recommended');
    }
  }

  private validateSpecificities(specificities: any, errors: string[], warnings: string[], suggestions: string[]): void {
    if (!specificities.startup && !specificities.traditional) {
      warnings.push('Please specify if this is a startup or traditional company');
    }
  }

  private validatePerformance(performance: any, errors: string[], warnings: string[], suggestions: string[]): void {
    if (!performance.financial?.revenue?.length) {
      warnings.push('Financial performance data is recommended');
    }

    if (performance.financial?.revenue) {
      const revenues = performance.financial.revenue;
      const currentYear = new Date().getFullYear();
      const hasCurrentYearData = revenues.some((r: any) => r.year === currentYear);
      
      if (!hasCurrentYearData) {
        suggestions.push('Consider adding current year financial data');
      }
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}