import { Injectable, NotFoundException } from '@nestjs/common';
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
}
