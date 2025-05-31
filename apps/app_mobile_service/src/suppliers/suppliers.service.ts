import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { User } from '../auth/entities/user.entity'; 
import { Company } from '../company/entities/company.entity'; // Assuming Company entity path

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    @InjectRepository(Company) // Inject CompanyRepository
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(createSupplierDto: CreateSupplierDto, companyId: string): Promise<Supplier> {
    const company = await this.companyRepository.findOneBy({ id: companyId });
    if (!company) {
      throw new NotFoundException(`Company with ID "${companyId}" not found`);
    }
    const newSupplier = this.supplierRepository.create({
      ...createSupplierDto,
      companyId: companyId,
      company: company, 
    });
    return this.supplierRepository.save(newSupplier);
  }

  async findAll(companyId: string, options: { page: number; limit: number }): Promise<{ data: Supplier[], count: number }> {
    const [data, count] = await this.supplierRepository.findAndCount({
      where: { companyId },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      order: { name: 'ASC' } // Default ordering
    });
    return { data, count };
  }

  async findOne(id: string, companyId: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({ where: { id, companyId } });
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID "${id}" not found in your company.`);
    }
    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto, companyId: string): Promise<Supplier> {
    // Ensure the supplier exists and belongs to the user's company
    const existingSupplier = await this.findOne(id, companyId); 

    const supplierToUpdate = await this.supplierRepository.preload({
      id: id,
      companyId: companyId, // Ensure context
      ...updateSupplierDto,
    });
    // Preload would return null if not found with id, but findOne already checked for companyId match.
    // However, it's good practice to ensure supplierToUpdate is not null if preload was used without prior findOne.
    if (!supplierToUpdate) { 
        throw new NotFoundException(`Supplier with ID "${id}" not found.`);
    }

    return this.supplierRepository.save(supplierToUpdate);
  }

  async remove(id: string, companyId: string): Promise<void> {
    // Ensure the supplier exists and belongs to the user's company before deleting
    await this.findOne(id, companyId);
    const result = await this.supplierRepository.delete({ id, companyId });
    if (result.affected === 0) {
      // This case should ideally be caught by findOne, but as a safeguard:
      throw new NotFoundException(`Supplier with ID "${id}" not found in your company.`);
    }
  }

  // Methods to update purchase-related info (could be called by a Purchases module)
  async updateTotalPurchases(supplierId: string, amount: number, companyId: string): Promise<void> {
    const supplier = await this.findOne(supplierId, companyId);
    supplier.totalPurchases = (parseFloat(supplier.totalPurchases as any) + amount);
    supplier.lastPurchaseDate = new Date();
    await this.supplierRepository.save(supplier);
  }
}
