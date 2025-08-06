import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { UpdateOrganizationDto } from '../dtos/update-organization.dto';
import { OrganizationProfileDto } from '../dtos/organization-profile.dto';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async getOrganizationProfile(id: string): Promise<OrganizationProfileDto> {
    const organization = await this.findById(id);
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    const { name, address, vatNumber, registrationNumber, industry, website, createdAt, updatedAt } = organization;

    return {
      id,
      name,
      address,
      vatNumber,
      registrationNumber,
      industry,
      website,
      createdAt,
      updatedAt,
    };
  }

  async findById(id: string): Promise<Organization | null> {
    return await this.organizationRepository.findOneBy({ id });
  }

  async findByCompanyId(companyId: string): Promise<Organization | null> {
    return this.findById(companyId);
  }

  async update(id: string, updateDto: UpdateOrganizationDto): Promise<Organization> {
    const organization = await this.findById(id);
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    
    Object.assign(organization, updateDto);
    
    return await this.organizationRepository.save(organization);
  }

  async create(organizationData: Partial<Organization>, userId?: string): Promise<Organization> {
    const organization = this.organizationRepository.create({
      ...organizationData,
      createdBy: userId,
    });
    
    return await this.organizationRepository.save(organization);
  }

  async updateLastActivity(id: string, lastActivityDate: Date): Promise<void> {
    const organization = await this.findById(id);
    if (organization) {
      organization.lastActivityAt = lastActivityDate;
      await this.organizationRepository.save(organization);
    }
  }

  async updateLogo(id: string, file: Express.Multer.File): Promise<string> {
    const organization = await this.findById(id);
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    
    // Ici, vous devriez implémenter la logique pour sauvegarder le fichier dans un service de stockage
    // et obtenir une URL publique
    const logoUrl = `https://storage.example.com/logos/${id}/${file.originalname}`;
    
    // Mettre à jour l'URL du logo dans la base de données
    organization.logo = logoUrl;
    await this.organizationRepository.save(organization);
    
    return logoUrl;
  }

  async getFiscalSettings(id: string): Promise<any> {
    const organization = await this.findById(id);
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    
    // Dans une implémentation réelle, ces données seraient stockées dans une table ou un champ JSON
    return {
      vatRegistered: organization.vatNumber ? true : false,
      vatNumber: organization.vatNumber || '',
      vatRate: 16, // Valeur par défaut ou stockée dans un champ
      taxPaymentFrequency: 'monthly',
      fiscalYearStart: {
        month: 1,
        day: 1,
      },
      taxationSystem: 'normal',
    };
  }

  async updateFiscalSettings(id: string, fiscalSettingsDto: any): Promise<any> {
    const organization = await this.findById(id);
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    
    // Mettre à jour les champs disponibles dans l'entité
    if (fiscalSettingsDto.vatRegistered !== undefined) {
      // Si l'organisation n'est pas assujettie à la TVA, on efface le numéro de TVA
      if (!fiscalSettingsDto.vatRegistered) {
        organization.vatNumber = undefined;
      } else if (fiscalSettingsDto.vatNumber) {
        organization.vatNumber = fiscalSettingsDto.vatNumber;
      }
    }
    
    // Vous pouvez ajouter d'autres champs fiscaux à l'entité Organization
    // ou créer une entité distincte pour les paramètres fiscaux
    
    await this.organizationRepository.save(organization);
    
    return this.getFiscalSettings(id);
  }

  async getBankDetails(id: string): Promise<any[]> {
    // Dans une implémentation réelle, vous récupéreriez ces données depuis une table dédiée
    return [
      {
        id: 'bank-1',
        bankName: 'Equity Bank',
        accountNumber: '1234567890',
        iban: '',
        swift: 'EQBLCDKI',
        currency: 'USD',
        isPrimary: true
      }
    ];
  }
  
  async addBankDetails(organizationId: string, bankDetailsDto: any): Promise<any> {
    // Vérifier que l'organisation existe
    const organization = await this.findById(organizationId);
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${organizationId} not found`);
    }
    
    // Dans une implémentation réelle, vous stockeriez ces données dans une table dédiée
    // et vous généreriez un ID unique
    const newBankDetails = {
      id: `bank-${Date.now()}`,
      ...bankDetailsDto,
      // Si c'est le premier compte bancaire, le définir comme principal
      isPrimary: bankDetailsDto.isPrimary === undefined ? true : bankDetailsDto.isPrimary
    };
    
    return newBankDetails;
  }
  
  async updateBankDetails(organizationId: string, bankDetailsId: string, bankDetailsDto: any): Promise<any> {
    // Vérifier que l'organisation existe
    const organization = await this.findById(organizationId);
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${organizationId} not found`);
    }
    
    // Dans une implémentation réelle, vous vérifieriez que les coordonnées bancaires existent
    // et qu'elles appartiennent à l'organisation
    const bankDetails = {
      id: bankDetailsId,
      bankName: 'Equity Bank',
      accountNumber: bankDetailsDto.accountNumber || '1234567890',
      iban: bankDetailsDto.iban || '',
      swift: bankDetailsDto.swift || 'EQBLCDKI',
      currency: bankDetailsDto.currency || 'USD',
      isPrimary: bankDetailsDto.isPrimary === undefined ? true : bankDetailsDto.isPrimary
    };
    
    return bankDetails;
  }
  
  async deleteBankDetails(organizationId: string, bankDetailsId: string): Promise<void> {
    // Vérifier que l'organisation existe
    const organization = await this.findById(organizationId);
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${organizationId} not found`);
    }
    
    // Dans une implémentation réelle, vous vérifieriez que les coordonnées bancaires existent,
    // qu'elles appartiennent à l'organisation, et vous les supprimeriez de la base de données
    
    // Si les coordonnées bancaires sont principales, vous devriez définir un autre compte comme principal
    
    // Cette méthode ne renvoie rien car le code d'état HTTP 200 et le message de succès sont gérés par le contrôleur
  }
}
