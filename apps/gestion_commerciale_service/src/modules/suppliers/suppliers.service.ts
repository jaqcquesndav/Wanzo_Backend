import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './entities/supplier.entity';
import { SupplierCategory } from './enums/supplier-category.enum';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

interface PaginationOptions {
  page?: number;
  limit?: number;
}

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private suppliersRepository: Repository<Supplier>,
  ) {}

  async create(createSupplierDto: CreateSupplierDto, userCompanyId: string): Promise<Supplier> {
    // Check if a supplier with the same email already exists
    if (createSupplierDto.email) {
      const existingSupplier = await this.suppliersRepository.findOne({
        where: { email: createSupplierDto.email },
      });

      if (existingSupplier) {
        throw new ConflictException(`Supplier with email ${createSupplierDto.email} already exists`);
      }
    }

    // Create the supplier entity
    const supplier = this.suppliersRepository.create({
      name: createSupplierDto.name,
      contactPerson: createSupplierDto.contactPerson,
      email: createSupplierDto.email,
      phoneNumber: createSupplierDto.phoneNumber,
      address: createSupplierDto.address,
      category: createSupplierDto.category || SupplierCategory.REGULAR,
      totalPurchases: createSupplierDto.totalPurchases || 0,
      lastPurchaseDate: createSupplierDto.lastPurchaseDate ? new Date(createSupplierDto.lastPurchaseDate) : undefined,
    });

    // Save the supplier 
    return await this.suppliersRepository.save(supplier);
  }  async findAll(userCompanyId: string, options: PaginationOptions = {}): Promise<{ items: Supplier[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await this.suppliersRepository.findAndCount({
      relations: ['products'],
      skip,
      take: limit,
      order: {
        name: 'ASC',
      },
    });

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, userCompanyId: string): Promise<Supplier> {
    const supplier = await this.suppliersRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }  async update(id: string, updateSupplierDto: UpdateSupplierDto, userCompanyId: string): Promise<Supplier> {
    // Get the supplier and verify it exists
    const supplier = await this.findOne(id, userCompanyId);
    
    // Check email uniqueness if it's being updated
    if (updateSupplierDto.email && updateSupplierDto.email !== supplier.email) {
      const existingSupplier = await this.suppliersRepository.findOne({
        where: { email: updateSupplierDto.email },
      });

      if (existingSupplier && existingSupplier.id !== id) {
        throw new ConflictException(`Supplier with email ${updateSupplierDto.email} already exists`);
      }
    }
    
    // Update supplier properties
    Object.assign(supplier, updateSupplierDto);
    
    // Save the updated supplier
    return this.suppliersRepository.save(supplier);
  }

  async remove(id: string, userCompanyId: string): Promise<void> {
    // Verify the supplier exists
    await this.findOne(id, userCompanyId);
    
    // Delete the supplier
    const result = await this.suppliersRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }
  }  async findByCategory(category: SupplierCategory): Promise<Supplier[]> {
    return this.suppliersRepository.find({
      where: { category },
      relations: ['products'],
    });
  }

  async updatePurchaseTotal(id: string, purchaseAmount: number): Promise<Supplier> {
    const supplier = await this.suppliersRepository.findOne({ 
      where: { id }
    });
    
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }
    
    supplier.totalPurchases += purchaseAmount;
    supplier.lastPurchaseDate = new Date();
    
    return this.suppliersRepository.save(supplier);
  }

  /**
   * Trouve ou crée automatiquement un fournisseur basé sur son numéro de téléphone
   * Si le fournisseur existe avec ce numéro, il est retourné
   * Sinon, un nouveau fournisseur est créé automatiquement
   */
  async findOrCreateByPhoneNumber(
    phoneNumber: string,
    supplierName?: string,
    userCompanyId?: string
  ): Promise<Supplier> {
    // Normaliser le numéro de téléphone (enlever espaces, tirets, etc.)
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    
    // Chercher un fournisseur existant avec ce numéro
    const existingSupplier = await this.suppliersRepository.findOne({
      where: { phoneNumber: normalizedPhone }
    });

    if (existingSupplier) {
      // Mettre à jour le nom si fourni et différent
      if (supplierName && supplierName !== existingSupplier.name) {
        existingSupplier.name = supplierName;
        return this.suppliersRepository.save(existingSupplier);
      }
      return existingSupplier;
    }

    // Créer un nouveau fournisseur
    const newSupplier = this.suppliersRepository.create({
      phoneNumber: normalizedPhone,
      name: supplierName || `Fournisseur ${normalizedPhone}`,
      category: SupplierCategory.REGULAR,
      totalPurchases: 0,
      paymentTerms: 'Net 30', // Valeur par défaut
      deliveryTimeInDays: 7, // Valeur par défaut
    });

    return this.suppliersRepository.save(newSupplier);
  }

  /**
   * Trouve un fournisseur par numéro de téléphone
   */
  async findByPhoneNumber(phoneNumber: string): Promise<Supplier | null> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    return this.suppliersRepository.findOne({
      where: { phoneNumber: normalizedPhone }
    });
  }

  /**
   * Normalise un numéro de téléphone en enlevant tous les caractères non numériques
   * sauf le + au début
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // Garder le + au début s'il existe, enlever tous les autres caractères non numériques
    const hasPlus = phoneNumber.startsWith('+');
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    return hasPlus ? `+${digitsOnly}` : digitsOnly;
  }
}
