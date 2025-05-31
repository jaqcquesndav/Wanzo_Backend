import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../entities/company.entity';
import { CreateCompanyDto, UpdateCompanyDto } from '../dtos/company.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  async findAll(page = 1, perPage = 10): Promise<{ companies: Company[]; total: number; page: number; perPage: number }> {
    const [companies, total] = await this.companyRepository.findAndCount({
      skip: (page - 1) * perPage,
      take: perPage,
      order: { createdAt: 'DESC' },
    });

    return {
      companies,
      total,
      page,
      perPage,
    };
  }

  async findById(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async create(createCompanyDto: CreateCompanyDto, createdBy?: string): Promise<Company> {
    const kiotaId = `KIOTA-COM-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;
    
    const company = this.companyRepository.create({
      ...createCompanyDto,
      kiotaId,
      createdBy,
    });

    return await this.companyRepository.save(company);
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findById(id);
    Object.assign(company, updateCompanyDto);
    return await this.companyRepository.save(company);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const company = await this.findById(id);
    
    // Vérifier si l'entreprise a des utilisateurs actifs
    const usersCount = await this.companyRepository
      .createQueryBuilder('company')
      .leftJoin('company.users', 'user')
      .where('company.id = :id', { id })
      .andWhere('user.active = :active', { active: true })
      .getCount();
    
    if (usersCount > 0) {
      throw new BadRequestException('Cannot delete company with active users');
    }
    
    // Désactiver l'entreprise au lieu de la supprimer
    company.active = false;
    await this.companyRepository.save(company);
    
    return { success: true, message: 'Company deactivated successfully' };
  }

  async updateSubscription(
    id: string, 
    plan: string, 
    status: string, 
    expiresAt?: Date
  ): Promise<Company> {
    const company = await this.findById(id);
    
    company.subscriptionPlan = plan;
    company.subscriptionStatus = status;
    company.subscriptionExpiresAt = expiresAt;
    
    return await this.companyRepository.save(company);
  }
}