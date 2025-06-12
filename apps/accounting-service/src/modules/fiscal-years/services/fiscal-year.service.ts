import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FiscalYear } from '../entities/fiscal-year.entity'; // Assuming this path is correct

@Injectable()
export class FiscalYearService {
  constructor(
    @InjectRepository(FiscalYear)
    private readonly fiscalYearRepository: Repository<FiscalYear>,
  ) {}

  /**
   * Find a fiscal year by its ID.
   * @param id - The ID of the fiscal year.
   * @returns The found fiscal year.
   * @throws NotFoundException if the fiscal year is not found.
   */
  async findById(id: string): Promise<FiscalYear> {
    const fiscalYear = await this.fiscalYearRepository.findOne({ where: { id } });
    if (!fiscalYear) {
      throw new NotFoundException(`FiscalYear with ID ${id} not found`);
    }
    return fiscalYear;
  }

  // Add other fiscal year related methods here if needed in the future
  // For example: findByCompanyAndDate, getCurrentFiscalYearForCompany, etc.
}
