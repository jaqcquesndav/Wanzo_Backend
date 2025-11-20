import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Calculer automatiquement les prix CDF si une autre devise est fournie
    const productData = { ...createProductDto };
    
    if (createProductDto.inputCurrencyCode && createProductDto.inputCurrencyCode !== 'CDF') {
      const exchangeRate = createProductDto.inputExchangeRate || 1.0;
      
      // Calculer les prix CDF si les prix en devise de saisie sont fournis
      if (createProductDto.costPriceInInputCurrency !== undefined) {
        productData.costPriceInCdf = createProductDto.costPriceInInputCurrency * exchangeRate;
      }
      
      if (createProductDto.sellingPriceInInputCurrency !== undefined) {
        productData.sellingPriceInCdf = createProductDto.sellingPriceInInputCurrency * exchangeRate;
      }
    } else {
      // Si pas de devise spécifiée ou CDF, copier les prix CDF vers les prix input
      productData.inputCurrencyCode = 'CDF';
      productData.inputExchangeRate = 1.0;
      productData.costPriceInInputCurrency = createProductDto.costPriceInCdf;
      productData.sellingPriceInInputCurrency = createProductDto.sellingPriceInCdf;
    }
    
    const newProduct = this.productRepository.create(productData);
    try {
      return await this.productRepository.save(newProduct);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new ConflictException('Product with this SKU already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<Product[]> { // Basic find all, pagination/filtering can be added
    return this.productRepository.find();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOneBy({ id });
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    // Recalculer les prix CDF si les données multi-devises sont mises à jour
    const productData = { ...updateProductDto };
    
    if (updateProductDto.inputCurrencyCode && updateProductDto.inputCurrencyCode !== 'CDF') {
      const exchangeRate = updateProductDto.inputExchangeRate || 1.0;
      
      // Recalculer les prix CDF si les prix en devise de saisie sont modifiés
      if (updateProductDto.costPriceInInputCurrency !== undefined) {
        productData.costPriceInCdf = updateProductDto.costPriceInInputCurrency * exchangeRate;
      }
      
      if (updateProductDto.sellingPriceInInputCurrency !== undefined) {
        productData.sellingPriceInCdf = updateProductDto.sellingPriceInInputCurrency * exchangeRate;
      }
    } else if (updateProductDto.inputCurrencyCode === 'CDF') {
      // Si retour à CDF, synchroniser les prix
      if (updateProductDto.costPriceInCdf !== undefined) {
        productData.costPriceInInputCurrency = updateProductDto.costPriceInCdf;
      }
      if (updateProductDto.sellingPriceInCdf !== undefined) {
        productData.sellingPriceInInputCurrency = updateProductDto.sellingPriceInCdf;
      }
      productData.inputExchangeRate = 1.0;
    }
    
    const product = await this.productRepository.preload({
      id: id,
      ...productData,
    });
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const result = await this.productRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
  }
}
