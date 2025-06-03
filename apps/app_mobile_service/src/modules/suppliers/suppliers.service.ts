import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier, SupplierCategory } from './entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private suppliersRepository: Repository<Supplier>,
  ) {}

  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    // Check if a supplier with the same email already exists
    const existingSupplier = await this.suppliersRepository.findOne({
      where: { email: createSupplierDto.email },
    });

    if (existingSupplier) {
      throw new ConflictException(`Supplier with email ${createSupplierDto.email} already exists`);
    }

    const supplier = this.suppliersRepository.create({
      ...createSupplierDto,
      totalPurchases: 0, // Initialize with zero purchases
    });

    return this.suppliersRepository.save(supplier);
  }

  async findAll(): Promise<Supplier[]> {
    return this.suppliersRepository.find({
      relations: ['products'],
    });
  }

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.suppliersRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.findOne(id);

    // Check if trying to update email to one that already exists with another supplier
    if (updateSupplierDto.email && updateSupplierDto.email !== supplier.email) {
      const existingSupplier = await this.suppliersRepository.findOne({
        where: { email: updateSupplierDto.email },
      });

      if (existingSupplier && existingSupplier.id !== id) {
        throw new ConflictException(`Supplier with email ${updateSupplierDto.email} already exists`);
      }
    }

    // Update the supplier with the new data
    Object.assign(supplier, updateSupplierDto);
    
    return this.suppliersRepository.save(supplier);
  }

  async remove(id: string): Promise<void> {
    const result = await this.suppliersRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }
  }

  async findByCategory(category: SupplierCategory): Promise<Supplier[]> {
    return this.suppliersRepository.find({
      where: { category },
      relations: ['products'],
    });
  }

  async updatePurchaseTotal(id: string, purchaseAmount: number): Promise<Supplier> {
    const supplier = await this.findOne(id);
    
    supplier.totalPurchases += purchaseAmount;
    supplier.lastPurchaseDate = new Date();
    
    return this.suppliersRepository.save(supplier);
  }
}