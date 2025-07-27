import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prospect } from '../entities/prospect.entity';
import { Document } from '../entities/document.entity';
import { ContactHistory } from '../entities/contact-history.entity';
import { CreateProspectDto } from '../dto/create-prospect.dto';
import { UpdateProspectDto } from '../dto/update-prospect.dto';
import { ProspectFilterDto } from '../dto/prospect-filter.dto';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { CreateContactHistoryDto } from '../dto/create-contact-history.dto';

@Injectable()
export class ProspectService {
  constructor(
    @InjectRepository(Prospect)
    private prospectRepository: Repository<Prospect>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(ContactHistory)
    private contactHistoryRepository: Repository<ContactHistory>,
  ) {}

  async findAll(
    filters: ProspectFilterDto,
    page: number = 1,
    limit: number = 10
  ): Promise<{ prospects: Prospect[]; total: number }> {
    const { size, sector, status, min_revenue, max_revenue, institutionId } = filters;
    
    const queryBuilder = this.prospectRepository.createQueryBuilder('prospect');
    
    if (size) {
      queryBuilder.andWhere('prospect.size = :size', { size });
    }
    
    if (sector) {
      queryBuilder.andWhere('prospect.sector = :sector', { sector });
    }
    
    if (status) {
      queryBuilder.andWhere('prospect.status = :status', { status });
    }
    
    if (min_revenue) {
      queryBuilder.andWhere('prospect.annualRevenue >= :min_revenue', { min_revenue });
    }
    
    if (max_revenue) {
      queryBuilder.andWhere('prospect.annualRevenue <= :max_revenue', { max_revenue });
    }
    
    const total = await queryBuilder.getCount();
    
    queryBuilder
      .leftJoinAndSelect('prospect.documents', 'documents')
      .leftJoinAndSelect('prospect.contactHistory', 'contactHistory')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('prospect.createdAt', 'DESC');
    
    const prospects = await queryBuilder.getMany();
    
    return { prospects, total };
  }

  async findOne(id: string): Promise<Prospect> {
    const prospect = await this.prospectRepository.findOne({
      where: { id },
      relations: ['documents', 'contactHistory', 'analyses'],
    });
    
    if (!prospect) {
      throw new NotFoundException(`Prospect with ID ${id} not found`);
    }
    
    return prospect;
  }

  async create(createProspectDto: CreateProspectDto, userId: string): Promise<Prospect> {
    const prospect = this.prospectRepository.create({
      ...createProspectDto,
      // Ensure the assignedTo field is set to the user creating the prospect
      // if not explicitly specified in the DTO
      assignedTo: createProspectDto.assignedTo || userId,
    });
    
    return this.prospectRepository.save(prospect);
  }

  async update(id: string, updateProspectDto: UpdateProspectDto): Promise<Prospect> {
    const prospect = await this.findOne(id);
    
    // Merge the updated fields into the existing prospect
    const updatedProspect = this.prospectRepository.merge(prospect, updateProspectDto);
    
    return this.prospectRepository.save(updatedProspect);
  }

  async remove(id: string): Promise<void> {
    const prospect = await this.findOne(id);
    
    await this.prospectRepository.remove(prospect);
  }

  async addDocument(
    prospectId: string, 
    createDocumentDto: CreateDocumentDto, 
    userId: string
  ): Promise<Document> {
    const prospect = await this.findOne(prospectId);
    
    const document = this.documentRepository.create({
      ...createDocumentDto,
      prospectId,
      uploadedBy: userId,
    });
    
    return this.documentRepository.save(document);
  }

  async addContactHistory(
    prospectId: string, 
    createContactHistoryDto: CreateContactHistoryDto, 
    userId: string
  ): Promise<{ contactHistory: ContactHistory; prospect: Prospect }> {
    const prospect = await this.findOne(prospectId);
    
    const contactHistory = this.contactHistoryRepository.create({
      ...createContactHistoryDto,
      prospectId,
      createdBy: userId,
    });
    
    const savedContactHistory = await this.contactHistoryRepository.save(contactHistory);
    
    // Re-fetch the prospect with the updated contact history
    const updatedProspect = await this.findOne(prospectId);
    
    return { contactHistory: savedContactHistory, prospect: updatedProspect };
  }
}
