import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, Like } from 'typeorm';
import { Prospect } from '../entities/prospect.entity';
import { ProspectDocument, DocumentType } from '../entities/prospect-document.entity';
import { CreateProspectDto, UpdateProspectDto, ProspectFilterDto } from '../dtos/prospect.dto';

@Injectable()
export class ProspectService {
  delete(_id: string) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(Prospect)
    private prospectRepository: Repository<Prospect>,
    @InjectRepository(ProspectDocument)
    private documentRepository: Repository<ProspectDocument>,
  ) {}

  async create(createProspectDto: CreateProspectDto, institutionId: string, userId: string): Promise<Prospect> {
    const kiotaId = `KIOTA-PRS-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;

    const prospect = this.prospectRepository.create({
      ...createProspectDto,
      kiotaId,
      institutionId,
      createdBy: userId,
    });

    return await this.prospectRepository.save(prospect);
  }

  async findAll(
    filters: ProspectFilterDto & { institutionId?: string },
    page = 1,
    perPage = 10,
  ): Promise<{
    prospects: Prospect[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const where: any = {};

    if (filters.institutionId) {
      where.institutionId = filters.institutionId;
    }

    if (filters.size) {
      where.size = filters.size;
    }

    if (filters.sector) {
      where.sector = filters.sector;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.minRevenue) {
      where.annualRevenue = filters.maxRevenue 
        ? Between(filters.minRevenue, filters.maxRevenue)
        : MoreThanOrEqual(filters.minRevenue);
    }

    if (filters.search) {
      where.name = Like(`%${filters.search}%`);
    }

    const [prospects, total] = await this.prospectRepository.findAndCount({
      where,
      relations: ['analyses', 'documents'],
      skip: (page - 1) * perPage,
      take: perPage,
      order: { createdAt: 'DESC' },
    });

    return {
      prospects,
      total,
      page,
      perPage,
    };
  }

  async findById(id: string): Promise<Prospect> {
    const prospect = await this.prospectRepository.findOne({
      where: { id },
      relations: ['analyses', 'documents'],
    });

    if (!prospect) {
      throw new NotFoundException(`Prospect with ID ${id} not found`);
    }

    return prospect;
  }

  async update(id: string, updateProspectDto: UpdateProspectDto): Promise<Prospect> {
    const prospect = await this.findById(id);
    Object.assign(prospect, updateProspectDto);
    return await this.prospectRepository.save(prospect);
  }

  async addDocument(
    id: string,
    document: {
      name: string;
      type: string;
      cloudinaryUrl: string;
      description?: string;
      validUntil?: Date;
    },
    userId: string,
  ): Promise<ProspectDocument> {
    const prospect = await this.findById(id);

    const newDocument = this.documentRepository.create({
      prospectId: prospect.id,
      name: document.name,
      type: document.type as DocumentType,
      cloudinaryUrl: document.cloudinaryUrl,
      description: document.description,
      validUntil: document.validUntil,
      createdBy: userId,
    });

    return await this.documentRepository.save(newDocument);
  }

  async addContactHistory(
    id: string,
    contact: {
      type: string;
      notes: string;
      outcome: string;
      nextSteps?: string;
      assignedTo?: string;
    },
  ): Promise<Prospect> {
    const prospect = await this.findById(id);

    prospect.contactHistory.push({
      ...contact,
      date: new Date(),
    });

    return await this.prospectRepository.save(prospect);
  }
}