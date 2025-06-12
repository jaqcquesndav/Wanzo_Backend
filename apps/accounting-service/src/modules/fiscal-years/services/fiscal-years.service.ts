import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { FiscalYear, FiscalYearStatus } from '../entities/fiscal-year.entity';
import { CreateFiscalYearDto } from '../dtos/create-fiscal-year.dto';

@Injectable()
export class FiscalYearsService {
  constructor(
    @InjectRepository(FiscalYear)
    private fiscalYearRepository: Repository<FiscalYear>,
  ) {}

  async findAll(companyId: string): Promise<FiscalYear[]> {
    return this.fiscalYearRepository.find({
      where: { companyId },
      order: { startDate: 'DESC' }
    });
  }

  async findOne(id: string, companyId: string): Promise<FiscalYear> {
    const fiscalYear = await this.fiscalYearRepository.findOne({
      where: { id, companyId }
    });
    if (!fiscalYear) {
      throw new NotFoundException(`Fiscal year with ID ${id} not found`);
    }
    return fiscalYear;
  }

  async findByCode(code: string, companyId: string): Promise<FiscalYear> {
    const fiscalYear = await this.fiscalYearRepository.findOne({
      where: { code, companyId }
    });
    if (!fiscalYear) {
      throw new NotFoundException(`Fiscal year with code ${code} not found`);
    }
    return fiscalYear;
  }

  async create(createFiscalYearDto: CreateFiscalYearDto, companyId: string, userId: string): Promise<FiscalYear> {
    const fiscalYear = this.fiscalYearRepository.create({
      ...createFiscalYearDto,
      companyId,
      createdBy: userId,
    });
    return this.fiscalYearRepository.save(fiscalYear);
  }

  async closeFiscalYear(id: string, companyId: string, userId: string): Promise<FiscalYear> {
    const fiscalYear = await this.findOne(id, companyId);
    
    if (fiscalYear.status === FiscalYearStatus.CLOSED) {
      throw new Error('Fiscal year is already closed');
    }
    
    fiscalYear.status = FiscalYearStatus.CLOSED;
    return this.fiscalYearRepository.save(fiscalYear);
  }

  async setAuditStatus(id: string, companyId: string, auditInfo: any): Promise<FiscalYear> {
    const fiscalYear = await this.findOne(id, companyId);
    
    fiscalYear.auditStatus = {
      isAudited: true,
      auditor: {
        name: auditInfo.name,
        registrationNumber: auditInfo.registrationNumber,
      },
      auditedAt: new Date().toISOString(),
    };
    
    return this.fiscalYearRepository.save(fiscalYear);
  }
  async findCurrentFiscalYear(companyId: string): Promise<FiscalYear> {
    const today = new Date();
    
    const fiscalYear = await this.fiscalYearRepository.findOne({
      where: { 
        companyId,
        status: FiscalYearStatus.OPEN,
        startDate: LessThanOrEqual(today),
        endDate: MoreThanOrEqual(today)
      }
    });
    
    if (!fiscalYear) {
      throw new NotFoundException('No active fiscal year found for the current date');
    }
    
    return fiscalYear;
  }
}
