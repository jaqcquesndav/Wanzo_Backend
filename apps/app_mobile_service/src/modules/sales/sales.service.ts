import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, DeepPartial } from 'typeorm';
import { Sale, PaymentStatus } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto, UpdateSaleItemDto } from './dto/update-sale.dto';
import { Product } from '../products/entities/product.entity';
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
      const { customerId, items, paymentStatus, saleDate, notes, userId, amountPaid, paymentMethodId } = createSaleDto;

      let customerEntity: Customer | null = null;
      if (customerId) {
        customerEntity = await transactionalEntityManager.findOne(Customer, { where: { id: customerId } });
        if (!customerEntity) {
          throw new NotFoundException(`Customer with ID "${customerId}" not found.`);
        }
      }

      let totalAmount = 0;
      const saleItemEntities: SaleItem[] = [];

      for (const itemDto of items) {
        const product = await transactionalEntityManager.findOne(Product, { where: { id: itemDto.productId } });
        if (!product) {
          throw new NotFoundException(`Product with ID "${itemDto.productId}" not found.`);
        }
        if (product.quantityInStock < itemDto.quantity) {
          throw new BadRequestException(`Not enough stock for product "${product.name}". Available: ${product.quantityInStock}, Requested: ${itemDto.quantity}`);
        }

        product.quantityInStock -= itemDto.quantity;
        await transactionalEntityManager.save(Product, product);

        const saleItem = transactionalEntityManager.create(SaleItem, {
          product: product,
          productId: product.id,
          quantity: itemDto.quantity,
          unitPrice: itemDto.unitPrice, 
          totalPrice: itemDto.quantity * itemDto.unitPrice,
        });
        
        totalAmount += saleItem.totalPrice;
        saleItemEntities.push(saleItem);
      }
      
      const saleData: DeepPartial<Sale> = {
        items: saleItemEntities, 
        totalAmount: totalAmount,
        saleDate: saleDate ? new Date(saleDate) : new Date(),
        paymentStatus: paymentStatus || PaymentStatus.PENDING,
        notes: notes || null, // Can be null if entity property `notes` is `string | null`
        userId: userId,
        amountPaid: amountPaid || 0,
        paymentMethodId: paymentMethodId || null, // Can be null if entity property `paymentMethodId` is `string | null`
      };

      if (customerEntity) {
        saleData.customer = customerEntity;
        saleData.customerId = customerEntity.id;
      } else {
        saleData.customer = null; // Explicitly set customer relation to null
        saleData.customerId = null; // Explicitly set customerId to null
      }
            
      const newSale = transactionalEntityManager.create(Sale, saleData);
      const savedSale = await transactionalEntityManager.save(Sale, newSale);

      if (customerEntity && totalAmount > 0) {
        await this.customersService.updateTotalPurchases(customerEntity.id, totalAmount, transactionalEntityManager);
      }
      
      const resultSale = await transactionalEntityManager.findOne(Sale, { where: { id: savedSale.id }, relations: ['customer', 'items', 'items.product'] });
      if (!resultSale) {
        throw new NotFoundException('Failed to retrieve the created sale after saving.');
      }
      return resultSale;
    });
  }

  async findAll(): Promise<Sale[]> {
    return this.saleRepository.find({ relations: ['customer', 'items', 'items.product'] });
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

    const originalTotalAmount = saleToUpdate.totalAmount;
    const originalCustomerId = saleToUpdate.customer?.id;

    return this.dataSource.transaction(async transactionalEntityManager => {
      const { items: itemUpdates, customerId, saleDate, ...otherUpdates } = updateSaleDto;

      // 1. Update top-level sale properties
      const updatePayload: DeepPartial<Sale> = { ...otherUpdates };

      if (saleDate !== undefined) {
        updatePayload.saleDate = new Date(saleDate);
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
                originalItemProduct.quantityInStock += originalItemQuantity;
                await transactionalEntityManager.save(Product, originalItemProduct);
              }
              
              const newProductForItem = await transactionalEntityManager.findOneBy(Product, { id: itemUpdateDto.productId });
              if (!newProductForItem) {
                throw new NotFoundException(`Product with ID "${itemUpdateDto.productId}" for item update not found.`);
              }
              if (newProductForItem.quantityInStock < itemUpdateDto.quantity) {
                throw new BadRequestException(`Not enough stock for new product "${newProductForItem.name}". Requested: ${itemUpdateDto.quantity}, Available: ${newProductForItem.quantityInStock}`);
              }
              newProductForItem.quantityInStock -= itemUpdateDto.quantity;
              await transactionalEntityManager.save(Product, newProductForItem);
              
              existingItem.product = newProductForItem;
              existingItem.productId = newProductForItem.id;
            } else {
              // Product is the same, quantity might change
              if (!originalItemProduct) throw new Error(`Consistency error: Product not found for existing item ${existingItem.id}`);
              const quantityChange = itemUpdateDto.quantity - originalItemQuantity;
              if (originalItemProduct.quantityInStock < quantityChange) {
                throw new BadRequestException(`Not enough stock for product "${originalItemProduct.name}". Additional needed: ${quantityChange}, Available: ${originalItemProduct.quantityInStock}`);
              }
              originalItemProduct.quantityInStock -= quantityChange;
              await transactionalEntityManager.save(Product, originalItemProduct);
            }

            existingItem.quantity = itemUpdateDto.quantity;
            existingItem.unitPrice = itemUpdateDto.unitPrice;
            existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
            
            finalSaleItems.push(existingItem);
            existingItemsMap.delete(itemUpdateDto.id);
          } 
          // Case 2: New item to add
          else {
            const product = await transactionalEntityManager.findOneBy(Product, { id: itemUpdateDto.productId });
            if (!product) {
              throw new NotFoundException(`Product with ID "${itemUpdateDto.productId}" for new item not found.`);
            }
            if (product.quantityInStock < itemUpdateDto.quantity) {
              throw new BadRequestException(`Not enough stock for product "${product.name}". Requested: ${itemUpdateDto.quantity}, Available: ${product.quantityInStock}`);
            }
            product.quantityInStock -= itemUpdateDto.quantity;
            await transactionalEntityManager.save(Product, product);

            const newSaleItem = transactionalEntityManager.create(SaleItem, {
              // sale: saleToUpdate, // Link established by TypeORM cascade on Sale save
              productId: product.id,
              product: product,
              quantity: itemUpdateDto.quantity,
              unitPrice: itemUpdateDto.unitPrice,
              totalPrice: itemUpdateDto.quantity * itemUpdateDto.unitPrice,
            });
            finalSaleItems.push(newSaleItem);
          }
        }

        // Case 3: Items to delete (those remaining in existingItemsMap)
        for (const itemToDelete of existingItemsMap.values()) {
          if (itemToDelete.product) {
            itemToDelete.product.quantityInStock += itemToDelete.quantity;
            await transactionalEntityManager.save(Product, itemToDelete.product);
          }
          await transactionalEntityManager.remove(SaleItem, itemToDelete);
        }
        saleToUpdate.items = finalSaleItems;
      }
      
      // 3. Recalculate totalAmount
      saleToUpdate.totalAmount = saleToUpdate.items.reduce((sum, item) => sum + item.totalPrice, 0);

      // 4. Save the updated sale (cascades to SaleItems)
      await transactionalEntityManager.save(Sale, saleToUpdate);
      
      // 5. Adjust customer's total purchases
      const newFinalCustomerId = saleToUpdate.customer?.id;
      const newFinalTotalAmount = saleToUpdate.totalAmount;

      if (originalCustomerId) {
        if (originalCustomerId !== newFinalCustomerId) { 
          await this.customersService.updateTotalPurchases(originalCustomerId, -originalTotalAmount, transactionalEntityManager);
        } else { 
          const amountDifference = newFinalTotalAmount - originalTotalAmount;
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

      const originalTotalAmount = sale.totalAmount;
      const saleCustomerId = sale.customer?.id;

      for (const item of sale.items) {
        const product = item.product; 
        if (product) {
          product.quantityInStock += item.quantity;
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
