import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    // Avec l'héritage, Supplier hérite de Company, donc on crée directement
    // un Supplier avec tous les attributs nécessaires
    const newSupplier = this.supplierRepository.create({
      ...createSupplierDto,
    });
    return this.supplierRepository.save(newSupplier);
  }

  async findAll(options: { page: number; limit: number }): Promise<{ data: Supplier[], count: number }> {
    const [data, count] = await this.supplierRepository.findAndCount({
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      order: { name: 'ASC' } // Default ordering
    });
    return { data, count };
  }

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({ where: { id } });
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID "${id}" not found.`);
    }
    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto): Promise<Supplier> {
    // Ensure the supplier exists
    const existingSupplier = await this.findOne(id);

    const supplierToUpdate = await this.supplierRepository.preload({
      id: id,
      ...updateSupplierDto,
    });
    
    if (!supplierToUpdate) { 
        throw new NotFoundException(`Supplier with ID "${id}" not found.`);
    }

    return this.supplierRepository.save(supplierToUpdate);
  }

  async remove(id: string): Promise<void> {
    // Ensure the supplier exists before deleting
    await this.findOne(id);
    const result = await this.supplierRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Supplier with ID "${id}" not found.`);
    }
  }

  // Methods to update purchase-related info
  async updateTotalPurchases(supplierId: string, amount: number): Promise<void> {
    const supplier = await this.findOne(supplierId);
    supplier.totalPurchases = (parseFloat(supplier.totalPurchases as any) + amount);
    supplier.lastPurchaseDate = new Date();
    await this.supplierRepository.save(supplier);
  }
}
