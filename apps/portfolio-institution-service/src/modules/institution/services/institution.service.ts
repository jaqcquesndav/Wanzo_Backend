import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from '../entities/institution.entity';
import { InstitutionDocument, DocumentType } from '../entities/institution-document.entity';
import { CreateInstitutionDto, UpdateInstitutionDto } from '../dtos/institution.dto';

@Injectable()
export class InstitutionService {
  constructor(
    @InjectRepository(Institution)
    private institutionRepository: Repository<Institution>,
    @InjectRepository(InstitutionDocument)
    private documentRepository: Repository<InstitutionDocument>,
  ) {}

  async create(createInstitutionDto: CreateInstitutionDto, userId: string): Promise<Institution> {
    const kiotaId = `KIOTA-INS-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;

    // Create institution
    const { documents, ...institutionData } = createInstitutionDto;
    const institution = this.institutionRepository.create({
      ...institutionData,
      kiotaId,
      createdBy: userId,
      metadata: {},
      active: true,
    });

    const savedInstitution = await this.institutionRepository.save(institution) as unknown as Institution;

    // Create associated documents
    if (createInstitutionDto.documents) {
      const documents = createInstitutionDto.documents.map(doc => 
        this.documentRepository.create({
          institutionId: savedInstitution.id,
          name: doc.name,
          type: doc.type as DocumentType,
          cloudinaryUrl: doc.url,
          createdBy: userId,
        })
      );

    await this.documentRepository.save(documents);
    }

    return await this.findById(savedInstitution.id);
  }

  async findById(id: string): Promise<Institution> {
    const institution = await this.institutionRepository.findOneOrFail({
      where: { id },
      relations: ['documents', 'users'],
    }).catch(() => {
      throw new NotFoundException(`Institution with ID ${id} not found`);
    });

    return institution;
  }

  async update(id: string, updateInstitutionDto: UpdateInstitutionDto): Promise<Institution> {
    const institution = await this.findById(id);
    Object.assign(institution, updateInstitutionDto);
    return await this.institutionRepository.save(institution);
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
  ): Promise<InstitutionDocument> {
    const institution = await this.findById(id);

    const newDocument = this.documentRepository.create({
      institutionId: institution.id,
      name: document.name,
      type: document.type as DocumentType,
      cloudinaryUrl: document.cloudinaryUrl,
      description: document.description,
      validUntil: document.validUntil,
      createdBy: userId,
    });

    return await this.documentRepository.save(newDocument);
  }

  async getDocuments(id: string): Promise<InstitutionDocument[]> {
    const institution = await this.findById(id);
    return await this.documentRepository.find({
      where: { institutionId: institution.id },
      order: { createdAt: 'DESC' },
    });
  }
}