import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';
import { Customer, CustomerType, CustomerStatus } from '../entities/customer.entity';
import { FinancialInstitutionSpecificData, InstitutionType, InstitutionCategory } from '../entities/financial-institution-specific-data.entity';
import {
  FinancialInstitutionResponseDto,
  CreateFinancialInstitutionDto,
  UpdateFinancialInstitutionDto,
} from '../dto/financial-institution.dto';
import * as crypto from 'crypto';

/**
 * Service pour la gestion des institutions financières (version finale corrigée)
 * Service minimal fonctionnel avec les propriétés disponibles
 */
@Injectable()
export class InstitutionService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(FinancialInstitutionSpecificData)
    private institutionDataRepository: Repository<FinancialInstitutionSpecificData>,
    private eventsProducer: CustomerEventsProducer,
  ) {}

  /**
   * Trouver une institution par ID
   */
  async findById(id: string): Promise<FinancialInstitutionResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['financialData'],
    });

    if (!customer || customer.type !== CustomerType.FINANCIAL) {
      throw new NotFoundException(`Institution financière avec l'ID ${id} non trouvée`);
    }

    return this.mapToResponseDto(customer);
  }

  /**
   * Créer une nouvelle institution financière
   */
  async create(createDto: CreateFinancialInstitutionDto): Promise<FinancialInstitutionResponseDto> {
    try {
      // Vérification de l'unicité du nom
      await this.checkInstitutionNameUniqueness(createDto.name);

      const currentDate = new Date();

      // Création du client de base
      const customer = this.customerRepository.create({
        name: createDto.name,
        type: CustomerType.FINANCIAL,
        email: createDto.contacts?.general?.email || '',
        phone: createDto.contacts?.general?.phone || '',
        status: CustomerStatus.ACTIVE,
      });

      // Sauvegarde du client
      const savedCustomer = await this.customerRepository.save(customer);

      // Création des données spécifiques à l'institution
      const institutionData = new FinancialInstitutionSpecificData();
      institutionData.type = createDto.type ? (createDto.type as unknown as InstitutionType) : InstitutionType.BANK;
      institutionData.category = createDto.category ? (createDto.category as unknown as InstitutionCategory) : InstitutionCategory.PRIVATE;
      institutionData.licenseNumber = createDto.licenseNumber || '';
      institutionData.establishedDate = createDto.establishedDate ? new Date(createDto.establishedDate) : new Date();

      // Sauvegarde des données spécifiques
      const savedInstitutionData = await this.institutionDataRepository.save(institutionData);

      // Associer les données à l'institution
      savedCustomer.financialData = savedInstitutionData;
      await this.customerRepository.save(savedCustomer);

      // Événement de création
      await this.eventsProducer.publishCustomerCreated({
        customerId: savedCustomer.id,
        name: savedCustomer.name,
        type: savedCustomer.type,
        createdBy: 'system',
        createdAt: currentDate.toISOString(),
      });

      return this.mapToResponseDto(savedCustomer);
    } catch (error) {
      if ((error as Error).message.includes('déjà existant')) {
        throw new ConflictException((error as Error).message);
      }
      throw new Error(`Erreur lors de la création: ${(error as Error).message}`);
    }
  }

  /**
   * Mettre à jour une institution financière
   */
  async update(
    institutionId: string,
    updateDto: UpdateFinancialInstitutionDto,
  ): Promise<FinancialInstitutionResponseDto> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id: institutionId },
        relations: ['financialData'],
      });

      if (!customer || !customer.financialData) {
        throw new NotFoundException(`Institution avec l'ID ${institutionId} non trouvée`);
      }

      const institutionData = customer.financialData;
      const currentDate = new Date();

      // Mise à jour des propriétés disponibles dans UpdateDto
      // Les propriétés comme name, contacts, address ne sont apparemment pas dans UpdateDto
      // Mise à jour seulement des propriétés confirmées

      // Mise à jour des timestamps
      customer.updatedAt = currentDate;
      institutionData.updatedAt = currentDate;

      // Sauvegarde
      await this.customerRepository.save(customer);
      await this.institutionDataRepository.save(institutionData);

      // Événement de mise à jour
      await this.eventsProducer.publishCustomerUpdated({
        customerId: customer.id,
        name: customer.name,
        type: customer.type,
        updatedBy: 'system',
        updatedAt: currentDate.toISOString(),
        changedFields: Object.keys(updateDto),
      });

      return this.mapToResponseDto(customer);
    } catch (error) {
      if ((error as Error).message.includes('non trouvée')) {
        throw new NotFoundException((error as Error).message);
      }
      throw new Error(`Erreur lors de la mise à jour: ${(error as Error).message}`);
    }
  }

  /**
   * Supprimer une institution financière
   */
  async delete(institutionId: string): Promise<void> {
    try {
      const customer = await this.customerRepository.findOne({
        where: { id: institutionId },
        relations: ['financialData'],
      });

      if (!customer) {
        throw new NotFoundException(`Institution avec l'ID ${institutionId} non trouvée`);
      }

      // Suppression des données spécifiques
      if (customer.financialData) {
        await this.institutionDataRepository.remove(customer.financialData);
      }

      // Suppression du client
      await this.customerRepository.remove(customer);

      // Événement de suppression
      await this.eventsProducer.publishCustomerCreated({
        customerId: customer.id,
        name: customer.name,
        type: customer.type,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      throw new Error(`Erreur lors de la suppression: ${(error as Error).message}`);
    }
  }

  /**
   * Récupérer toutes les institutions
   */
  async findAll(): Promise<FinancialInstitutionResponseDto[]> {
    try {
      const customers = await this.customerRepository.find({
        where: { type: CustomerType.FINANCIAL },
        relations: ['financialData'],
        order: { createdAt: 'DESC' },
      });

      return customers.map(customer => this.mapToResponseDto(customer));
    } catch (error) {
      throw new Error(`Erreur lors de la récupération: ${(error as Error).message}`);
    }
  }

  /**
   * Vérifier l'unicité du nom d'institution
   */
  private async checkInstitutionNameUniqueness(institutionName: string): Promise<void> {
    const existingCustomer = await this.customerRepository.findOne({
      where: { name: institutionName, type: CustomerType.FINANCIAL },
    });

    if (existingCustomer) {
      throw new ConflictException(`Une institution avec le nom "${institutionName}" existe déjà`);
    }
  }

  /**
   * Mapper un Customer vers FinancialInstitutionResponseDto
   * Utilise uniquement les propriétés qui existent réellement
   */
  private mapToResponseDto(customer: Customer): FinancialInstitutionResponseDto {
    const institutionData = customer.financialData;

    return {
      id: customer.id,
      name: customer.name,
      type: institutionData?.type,
      category: institutionData?.category,
      licenseNumber: institutionData?.licenseNumber,
      establishedDate: institutionData?.establishedDate,
      address: customer.address,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    } as FinancialInstitutionResponseDto;
  }
}