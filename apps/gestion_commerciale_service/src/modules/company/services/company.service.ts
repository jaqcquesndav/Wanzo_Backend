import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../entities/company.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  async findById(id: string): Promise<Company | null> {
    return await this.companyRepository.findOneBy({ id });
  }

  async findByCompanyId(companyId: string): Promise<Company | null> {
    return this.findById(companyId);
  }

  /**
   * Créer ou mettre à jour une entreprise à partir d'un événement Kafka
   */
  async createOrUpdate(companyData: any): Promise<Company> {
    const existingCompany = await this.findById(companyData.id);
    
    if (existingCompany) {
      // Mettre à jour l'entreprise existante
      await this.companyRepository.update(companyData.id, {
        ...companyData,
        updatedAt: new Date()
      });
      
      // Récupérer l'entreprise mise à jour
      const updatedCompany = await this.findById(companyData.id);
      if (!updatedCompany) {
        throw new NotFoundException(`Company with ID ${companyData.id} not found after update`);
      }
      return updatedCompany;
    } else {
      // Créer une nouvelle entreprise
      const result = await this.companyRepository.insert({
        ...companyData,
        createdAt: companyData.createdAt || new Date(),
        updatedAt: new Date()
      });
      
      // Récupérer l'entreprise créée
      const newCompany = await this.findById(companyData.id);
      if (!newCompany) {
        throw new NotFoundException(`Company with ID ${companyData.id} not found after creation`);
      }
      return newCompany;
    }
  }

  /**
   * Mettre à jour une entreprise à partir d'un événement de mise à jour
   */
  async updateFromEvent(companyId: string, updatedFields: Record<string, any>): Promise<Company> {
    const company = await this.findById(companyId);
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }
    
    Object.assign(company, updatedFields, { updatedAt: new Date() });
    return await this.companyRepository.save(company);
  }

  /**
   * Récupérer toutes les entreprises avec pagination et recherche
   */
  async findAll(options: {
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ companies: Company[]; total: number; page: number; totalPages: number }> {
    const { search, page = 1, limit = 10 } = options;
    const queryBuilder = this.companyRepository.createQueryBuilder('company');

    if (search) {
      queryBuilder.where(
        'company.name ILIKE :search OR company.email ILIKE :search',
        { search: `%${search}%` }
      );
    }

    queryBuilder
      .orderBy('company.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [companies, total] = await queryBuilder.getManyAndCount();

    return {
      companies,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Créer une nouvelle entreprise
   */
  async create(companyData: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    taxNumber?: string;
    registrationNumber?: string;
    website?: string;
  }): Promise<Company> {
    // Vérifier si l'email existe déjà
    const existingCompany = await this.companyRepository.findOne({
      where: { email: companyData.email }
    });

    if (existingCompany) {
      throw new ConflictException('Company with this email already exists');
    }

    const company = this.companyRepository.create({
      ...companyData,
      id: `COMP-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return await this.companyRepository.save(company);
  }

  /**
   * Mettre à jour une entreprise
   */
  async update(id: string, updateData: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxNumber?: string;
    registrationNumber?: string;
    website?: string;
  }): Promise<Company> {
    const company = await this.findById(id);
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    // Vérifier l'unicité de l'email si elle est modifiée
    if (updateData.email && updateData.email !== company.email) {
      const existingCompany = await this.companyRepository.findOne({
        where: { email: updateData.email }
      });

      if (existingCompany) {
        throw new ConflictException('Company with this email already exists');
      }
    }

    Object.assign(company, updateData, { updatedAt: new Date() });
    return await this.companyRepository.save(company);
  }

  /**
   * Supprimer une entreprise
   */
  async delete(id: string): Promise<void> {
    const company = await this.findById(id);
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    await this.companyRepository.remove(company);
  }

  /**
   * Obtenir les statistiques d'une entreprise
   */
  async getStats(id: string): Promise<{
    totalPortfolios: number;
    activePortfolios: number;
    totalFinancingAmount: number;
    totalPayments: number;
    pendingPayments: number;
  }> {
    const company = await this.findById(id);
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    // TODO: Implémenter les vraies statistiques en interrogeant les autres services
    // Pour l'instant, retourner des valeurs par défaut
    return {
      totalPortfolios: 0,
      activePortfolios: 0,
      totalFinancingAmount: 0,
      totalPayments: 0,
      pendingPayments: 0
    };
  }
}
