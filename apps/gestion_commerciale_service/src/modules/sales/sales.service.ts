import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, DeepPartial, FindOptionsWhere, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Sale, SaleStatus } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { UpdateSaleItemDto } from './dto/update-sale-item.dto';
import { CompleteSaleDto } from './dto/complete-sale.dto';
import { CancelSaleDto } from './dto/cancel-sale.dto';
import { Product } from '../inventory/entities/product.entity';
import { CustomersService } from '../customers/customers.service';
import { Customer } from '../customers/entities/customer.entity';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @Inject(forwardRef(() => CustomersService))
    private readonly customersService: CustomersService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createSaleDto: CreateSaleDto): Promise<Sale> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const { 
        customerId, 
        customerName, 
        items, 
        date, 
        dueDate, 
        notes, 
        paymentMethod, 
        paymentReference, 
        exchangeRate 
      } = createSaleDto;

      let customerEntity: Customer | null = null;
      if (customerId) {
        customerEntity = await transactionalEntityManager.findOne(Customer, { where: { id: customerId } });
        if (!customerEntity) {
          throw new NotFoundException(`Customer with ID "${customerId}" not found.`);
        }
      }

      let totalAmountInCdf = 0;
      const saleItemEntities: SaleItem[] = [];

      for (const itemDto of items) {
        const product = await transactionalEntityManager.findOne(Product, { where: { id: itemDto.productId } });
        if (!product) {
          throw new NotFoundException(`Product with ID "${itemDto.productId}" not found.`);
        }
        if (product.stockQuantity < itemDto.quantity) {
          throw new BadRequestException(`Not enough stock for product "${product.name}". Available: ${product.stockQuantity}, Requested: ${itemDto.quantity}`);
        }

        product.stockQuantity -= itemDto.quantity;
        await transactionalEntityManager.save(Product, product);

        // Calculate total price for the item
        const totalPrice = itemDto.quantity * itemDto.unitPrice - (itemDto.discount || 0);
        
        const saleItem = transactionalEntityManager.create(SaleItem, {
          product: product,
          productId: product.id,
          productName: itemDto.productName,
          quantity: itemDto.quantity,
          unitPrice: itemDto.unitPrice,
          discount: itemDto.discount || null,
          currencyCode: itemDto.currencyCode || 'CDF',
          taxRate: itemDto.taxRate || null,
          taxAmount: itemDto.taxRate ? (totalPrice * itemDto.taxRate / 100) : null,
          notes: itemDto.notes || null,
          totalPrice: totalPrice,
        });
        
        totalAmountInCdf += saleItem.totalPrice;
        saleItemEntities.push(saleItem);
      }
      
      const saleData: DeepPartial<Sale> = {
        items: saleItemEntities, 
        totalAmountInCdf: totalAmountInCdf,
        amountPaidInCdf: 0, // Initialize as unpaid
        date: new Date(date),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: SaleStatus.PENDING, // New sales start as pending
        customerName: customerName,
        notes: notes || null,
        paymentMethod: paymentMethod,
        paymentReference: paymentReference || null,
        exchangeRate: exchangeRate,
        syncStatus: 'created',
        userId: 'system', // This should be replaced with authenticated user ID in a real implementation
      };

      if (customerEntity) {
        saleData.customer = customerEntity;
        saleData.customerId = customerEntity.id;
      } else {
        saleData.customer = null;
        saleData.customerId = null;
      }
            
      const newSale = transactionalEntityManager.create(Sale, saleData);
      const savedSale = await transactionalEntityManager.save(Sale, newSale);

      if (customerEntity && totalAmountInCdf > 0) {
        await this.customersService.updateTotalPurchases(customerEntity.id, totalAmountInCdf, transactionalEntityManager);
      }
      
      const resultSale = await transactionalEntityManager.findOne(Sale, { where: { id: savedSale.id }, relations: ['customer', 'items', 'items.product'] });
      if (!resultSale) {
        throw new NotFoundException('Failed to retrieve the created sale after saving.');
      }
      return resultSale;
    });
  }

  async findAll(options?: {
    page?: number,
    limit?: number,
    dateFrom?: string,
    dateTo?: string,
    customerId?: string,
    status?: string,
    minAmount?: number,
    maxAmount?: number,
    sortBy?: string,
    sortOrder?: string,
  }): Promise<Sale[]> {
    const {
      page = 1,
      limit = 10,
      dateFrom,
      dateTo,
      customerId,
      status,
      minAmount,
      maxAmount,
      sortBy = 'date',
      sortOrder = 'desc',
    } = options || {};
    
    const skip = (page - 1) * limit;
    
    // Build where conditions
    const where: FindOptionsWhere<Sale> = {};
    
    // Handle date filtering
    if (dateFrom && dateTo) {
      where.date = Between(new Date(dateFrom), new Date(dateTo));
    } else if (dateFrom) {
      where.date = MoreThanOrEqual(new Date(dateFrom));
    } else if (dateTo) {
      where.date = LessThanOrEqual(new Date(dateTo));
    }
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    if (status) {
      where.status = status as any; 
    }
    
    // Handle amount filtering
    if (minAmount !== undefined && maxAmount !== undefined) {
      where.totalAmountInCdf = Between(minAmount, maxAmount);
    } else if (minAmount !== undefined) {
      where.totalAmountInCdf = MoreThanOrEqual(minAmount);
    } else if (maxAmount !== undefined) {
      where.totalAmountInCdf = LessThanOrEqual(maxAmount);
    }
    
    // Build order condition
    const order: Record<string, 'ASC' | 'DESC'> = {};
    order[sortBy] = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    
    return this.saleRepository.find({
      where,
      relations: ['customer', 'items', 'items.product'],
      skip,
      take: limit,
      order,
    });
  }
  
  // New method for marking a sale as completed
  async completeSale(id: string, completeSaleDto: CompleteSaleDto): Promise<Sale> {
    const { amountPaidInCdf, paymentMethod, paymentReference } = completeSaleDto;
    
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const sale = await transactionalEntityManager.findOne(Sale, { 
        where: { id }, 
        relations: ['items', 'customer'] 
      });
      
      if (!sale) {
        throw new NotFoundException(`Sale with ID "${id}" not found`);
      }
      
      if (sale.status === SaleStatus.CANCELLED) {
        throw new BadRequestException('Cannot complete a cancelled sale');
      }
      
      if (sale.status === SaleStatus.COMPLETED) {
        throw new BadRequestException('Sale is already completed');
      }
      
      // Update sale properties
      sale.amountPaidInCdf = amountPaidInCdf;
      sale.paymentMethod = paymentMethod;
      sale.paymentReference = paymentReference || null;
      
      // Mark as completed if the full amount is paid
      if (amountPaidInCdf >= sale.totalAmountInCdf) {
        sale.status = SaleStatus.COMPLETED;
      } else {
        sale.status = SaleStatus.PARTIALLY_PAID;
      }
      
      return transactionalEntityManager.save(Sale, sale);
    });
  }
  
  // New method for cancelling a sale
  async cancelSale(id: string, cancelSaleDto: CancelSaleDto): Promise<Sale> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const sale = await transactionalEntityManager.findOne(Sale, { 
        where: { id }, 
        relations: ['items', 'items.product'] 
      });
      
      if (!sale) {
        throw new NotFoundException(`Sale with ID "${id}" not found`);
      }
      
      if (sale.status === SaleStatus.CANCELLED) {
        throw new BadRequestException('Sale is already cancelled');
      }
      
      if (sale.status === SaleStatus.COMPLETED) {
        throw new BadRequestException('Cannot cancel a completed sale');
      }
      
      // Return products to inventory
      for (const item of sale.items) {
        const product = await transactionalEntityManager.findOne(Product, { where: { id: item.productId } });
        if (product) {
          product.stockQuantity += item.quantity;
          await transactionalEntityManager.save(Product, product);
        }
      }
      
      // Update sale status
      sale.status = SaleStatus.CANCELLED;
      
      // Add cancellation reason if provided
      if (cancelSaleDto.reason) {
        sale.notes = sale.notes 
          ? `${sale.notes}\nCancellation reason: ${cancelSaleDto.reason}`
          : `Cancellation reason: ${cancelSaleDto.reason}`;
      }
      
      return transactionalEntityManager.save(Sale, sale);
    });
  }

  async findOne(id: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({ where: { id }, relations: ['customer', 'items', 'items.product'] });
    if (!sale) {
      throw new NotFoundException(`Sale with ID "${id}" not found`);
    }
    return sale;
  }

  async update(id: string, updateSaleDto: UpdateSaleDto): Promise<Sale> {
    const saleToUpdate = await this.saleRepository.findOne({ 
      where: { id }, 
      relations: ['items', 'items.product', 'customer'] 
    });

    if (!saleToUpdate) {
      throw new NotFoundException(`Sale with ID "${id}" not found`);
    }

    const originalTotalAmountInCdf = saleToUpdate.totalAmountInCdf;
    const originalCustomerId = saleToUpdate.customer?.id;

    return this.dataSource.transaction(async transactionalEntityManager => {
      const { items: itemUpdates, customerId, date, ...otherUpdates } = updateSaleDto;

      // 1. Update top-level sale properties
      const updatePayload: DeepPartial<Sale> = { ...otherUpdates };

      if (date !== undefined) {
        updatePayload.date = new Date(date);
      }

      if (customerId !== undefined) { 
        if (customerId === null) { 
          updatePayload.customer = null;
          updatePayload.customerId = null;
        } else {
          const newCustomer = await transactionalEntityManager.findOne(Customer, { where: { id: customerId } });
          if (!newCustomer) {
            throw new NotFoundException(`New customer with ID "${customerId}" not found.`);
          }
          updatePayload.customer = newCustomer;
          updatePayload.customerId = newCustomer.id;
        }
      }
      
      transactionalEntityManager.merge(Sale, saleToUpdate, updatePayload); // Apply non-item updates to saleToUpdate

      // 2. Process SaleItem updates (add, update, delete)
      if (itemUpdates) {
        const existingItemsMap = new Map(saleToUpdate.items.map(item => [item.id, item]));
        const finalSaleItems: SaleItem[] = [];

        for (const itemUpdateDto of itemUpdates) {
          // Case 1: Existing item to update
          if (itemUpdateDto.id) {
            const existingItem = existingItemsMap.get(itemUpdateDto.id);
            if (!existingItem) {
              throw new BadRequestException(`SaleItem with ID "${itemUpdateDto.id}" not found in this sale.`);
            }

            const originalItemProduct = existingItem.product;
            const originalItemQuantity = existingItem.quantity;

            if (existingItem.productId !== itemUpdateDto.productId) {
              // Product for this item is changing
              if (originalItemProduct) {
                originalItemProduct.stockQuantity += originalItemQuantity;
                await transactionalEntityManager.save(Product, originalItemProduct);
              }
              
              const newProductForItem = await transactionalEntityManager.findOneBy(Product, { id: itemUpdateDto.productId });
              if (!newProductForItem) {
                throw new NotFoundException(`Product with ID "${itemUpdateDto.productId}" for item update not found.`);
              }
              // Vérifie si la quantité est définie et gère le cas où elle ne l'est pas
              const quantity = itemUpdateDto.quantity || originalItemQuantity;
              if (newProductForItem.stockQuantity < quantity) {
                throw new BadRequestException(`Not enough stock for new product "${newProductForItem.name}". Requested: ${quantity}, Available: ${newProductForItem.stockQuantity}`);
              }
              newProductForItem.stockQuantity -= quantity;
              await transactionalEntityManager.save(Product, newProductForItem);
              
              existingItem.product = newProductForItem;
              existingItem.productId = newProductForItem.id;
            } else {
              // Product is the same, quantity might change
              if (!originalItemProduct) throw new Error(`Consistency error: Product not found for existing item ${existingItem.id}`);
              
              // Vérifier si une nouvelle quantité est spécifiée
              if (typeof itemUpdateDto.quantity === 'number') {
                const quantityChange = itemUpdateDto.quantity - originalItemQuantity;
                if (quantityChange > 0) {
                  // Si on augmente la quantité, vérifier le stock disponible
                  if (originalItemProduct.stockQuantity < quantityChange) {
                    throw new BadRequestException(`Not enough stock for product "${originalItemProduct.name}". Additional needed: ${quantityChange}, Available: ${originalItemProduct.stockQuantity}`);
                  }
                  originalItemProduct.stockQuantity -= quantityChange;
                } else if (quantityChange < 0) {
                  // Si on diminue la quantité, restituer le stock
                  originalItemProduct.stockQuantity += Math.abs(quantityChange);
                }
                await transactionalEntityManager.save(Product, originalItemProduct);
              }
            }

            // Mettre à jour les propriétés avec des valeurs par défaut si non définies
            if (typeof itemUpdateDto.quantity === 'number') {
              existingItem.quantity = itemUpdateDto.quantity;
            }
            if (typeof itemUpdateDto.unitPrice === 'number') {
              existingItem.unitPrice = itemUpdateDto.unitPrice;
            }
            existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
            
            finalSaleItems.push(existingItem);
            existingItemsMap.delete(itemUpdateDto.id);
          } 
          // Case 2: New item to add
          else {
            // Vérifier que les champs obligatoires pour les nouveaux articles sont définis
            if (!itemUpdateDto.productId || !itemUpdateDto.quantity || !itemUpdateDto.unitPrice) {
              throw new BadRequestException('New sale items must have productId, quantity, and unitPrice defined');
            }
            
            const product = await transactionalEntityManager.findOneBy(Product, { id: itemUpdateDto.productId });
            if (!product) {
              throw new NotFoundException(`Product with ID "${itemUpdateDto.productId}" for new item not found.`);
            }
            
            // Maintenant on sait que quantity est défini
            const quantity = itemUpdateDto.quantity;
            const unitPrice = itemUpdateDto.unitPrice;
            
            if (product.stockQuantity < quantity) {
              throw new BadRequestException(`Not enough stock for product "${product.name}". Requested: ${quantity}, Available: ${product.stockQuantity}`);
            }
            product.stockQuantity -= quantity;
            await transactionalEntityManager.save(Product, product);

            const newSaleItem = transactionalEntityManager.create(SaleItem, {
              // sale: saleToUpdate, // Link established by TypeORM cascade on Sale save
              productId: product.id,
              product: product,
              quantity: quantity,
              unitPrice: unitPrice,
              totalPrice: quantity * unitPrice,
            });
            finalSaleItems.push(newSaleItem);
          }
        }

        // Case 3: Items to delete (those remaining in existingItemsMap)
        for (const itemToDelete of existingItemsMap.values()) {
          if (itemToDelete.product) {
            itemToDelete.product.stockQuantity += itemToDelete.quantity;
            await transactionalEntityManager.save(Product, itemToDelete.product);
          }
          await transactionalEntityManager.remove(SaleItem, itemToDelete);
        }
        saleToUpdate.items = finalSaleItems;
      }
      
      // 3. Recalculate totalAmount
      saleToUpdate.totalAmountInCdf = saleToUpdate.items.reduce((sum, item) => sum + item.totalPrice, 0);

      // 4. Save the updated sale (cascades to SaleItems)
      await transactionalEntityManager.save(Sale, saleToUpdate);
      
      // 5. Adjust customer's total purchases
      const newFinalCustomerId = saleToUpdate.customer?.id;
      const newFinalTotalAmount = saleToUpdate.totalAmountInCdf;

      if (originalCustomerId) {
        if (originalCustomerId !== newFinalCustomerId) { 
          await this.customersService.updateTotalPurchases(originalCustomerId, -originalTotalAmountInCdf, transactionalEntityManager);
        } else { 
          const amountDifference = newFinalTotalAmount - originalTotalAmountInCdf;
          if (amountDifference !== 0) {
            await this.customersService.updateTotalPurchases(originalCustomerId, amountDifference, transactionalEntityManager);
          }
        }
      }
      if (newFinalCustomerId && newFinalCustomerId !== originalCustomerId) {
        await this.customersService.updateTotalPurchases(newFinalCustomerId, newFinalTotalAmount, transactionalEntityManager);
      }
      
      // 6. Re-fetch the sale with all relations to return the complete updated entity
      const resultSale = await transactionalEntityManager.findOne(Sale, { 
        where: { id: saleToUpdate.id }, 
        relations: ['customer', 'items', 'items.product'] 
      });
      if (!resultSale) {
        this.logger.error(`Failed to retrieve the updated sale with ID "${id}" after saving and adjustments.`);
        throw new NotFoundException('Failed to retrieve the updated sale after saving.');
      }
      return resultSale;
    });
  }

  async remove(id: string): Promise<void> {
    return this.dataSource.transaction(async transactionalEntityManager => {
      const sale = await transactionalEntityManager.findOne(Sale, { where: { id }, relations: ['items', 'items.product', 'customer'] });
      if (!sale) {
        throw new NotFoundException(`Sale with ID "${id}" not found`);
      }

      const originalTotalAmount = sale.totalAmountInCdf;
      const saleCustomerId = sale.customer?.id;

      for (const item of sale.items) {
        const product = item.product; 
        if (product) {
          product.stockQuantity += item.quantity;
          await transactionalEntityManager.save(Product, product);
        }
      }

      const result = await transactionalEntityManager.delete(Sale, id);
      if (result.affected === 0) {
        throw new NotFoundException(`Sale with ID "${id}" not found during delete.`);
      }

      if (saleCustomerId && originalTotalAmount > 0) {
        await this.customersService.updateTotalPurchases(saleCustomerId, -originalTotalAmount, transactionalEntityManager);
      }
    });
  }
}
