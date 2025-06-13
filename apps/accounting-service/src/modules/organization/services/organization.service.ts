import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { UpdateOrganizationDto } from '../dtos/update-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async findById(id: string): Promise<Organization | null> {
    return await this.organizationRepository.findOneBy({ id });
  }

  async findByCompanyId(companyId: string): Promise<Organization | null> {
    return this.findById(companyId);
  }

  async update(id: string, updateDto: Partial<Organization>): Promise<Organization> {
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
}
