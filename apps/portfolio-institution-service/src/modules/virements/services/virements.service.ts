import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Disbursement, DisbursementStatus } from '../entities/disbursement.entity';
import { CreateDisbursementDto, UpdateDisbursementDto } from '../dtos/disbursement.dto';

@Injectable()
export class VirementsService {
  constructor(
    @InjectRepository(Disbursement)
    private disbursementRepository: Repository<Disbursement>,
  ) {}

  async findAll(filters: any = {}, page = 1, limit = 10): Promise<{ data: Disbursement[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.disbursementRepository.findAndCount({
      where: filters,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Disbursement> {
    const disbursement = await this.disbursementRepository.findOne({ where: { id } });
    if (!disbursement) {
      throw new NotFoundException(`Disbursement with ID ${id} not found`);
    }
    return disbursement;
  }

  async create(createDisbursementDto: CreateDisbursementDto): Promise<Disbursement> {
    const disbursement = this.disbursementRepository.create({
      ...createDisbursementDto,
      date: new Date(createDisbursementDto.date),
      status: DisbursementStatus.PENDING,
    });

    return this.disbursementRepository.save(disbursement);
  }

  async update(id: string, updateDisbursementDto: UpdateDisbursementDto): Promise<Disbursement> {
    const disbursement = await this.findOne(id);
    
    const updatedData: any = { ...updateDisbursementDto };
    
    // Process date fields if they exist
    if (updateDisbursementDto.valueDate) {
      updatedData.valueDate = new Date(updateDisbursementDto.valueDate);
    }
    
    if (updateDisbursementDto.executionDate) {
      updatedData.executionDate = new Date(updateDisbursementDto.executionDate);
    }

    const updatedDisbursement = this.disbursementRepository.merge(disbursement, updatedData);
    return this.disbursementRepository.save(updatedDisbursement);
  }

  async remove(id: string): Promise<void> {
    const disbursement = await this.findOne(id);
    await this.disbursementRepository.delete(disbursement.id);
  }

  async findByPortfolio(portfolioId: string): Promise<Disbursement[]> {
    return this.disbursementRepository.find({
      where: { portfolioId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByContract(contractReference: string): Promise<Disbursement[]> {
    return this.disbursementRepository.find({
      where: { contractReference },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: DisbursementStatus): Promise<Disbursement> {
    const disbursement = await this.findOne(id);
    disbursement.status = status;
    
    if (status === DisbursementStatus.COMPLETED) {
      disbursement.executionDate = new Date();
    }
    
    return this.disbursementRepository.save(disbursement);
  }
}
