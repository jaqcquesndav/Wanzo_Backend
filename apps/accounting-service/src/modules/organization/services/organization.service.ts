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

  async findByCompanyId(companyId: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOneBy({ id: companyId });
    
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${companyId} not found`);
    }
    
    return organization;
  }

  async update(companyId: string, updateOrganizationDto: UpdateOrganizationDto): Promise<Organization> {
    // Find the organization first
    const organization = await this.findByCompanyId(companyId);
    
    // Update the organization
    const updatedOrganization = {
      ...organization,
      ...updateOrganizationDto
    };
    
    // Save the changes and cast the result to Organization
    const saved = await this.organizationRepository.save(updatedOrganization);
    return saved as unknown as Organization;
  }

  async create(organizationData: any, userId: string): Promise<Organization> {
    const organization = this.organizationRepository.create({
      ...organizationData,
      createdBy: userId
    });
    
    // Save the entity and cast the result to Organization
    const saved = await this.organizationRepository.save(organization);
    return saved as unknown as Organization;
  }
}
