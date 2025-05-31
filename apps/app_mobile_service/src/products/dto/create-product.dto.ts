import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsUUID, IsUrl, ValidateNested, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class AttributeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString() // Assuming categoryId is a string (e.g., UUID or ObjectId)
  @IsOptional()
  categoryId?: string;

  @IsString() // Assuming unitId is a string
  @IsOptional()
  unitId?: string;

  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @IsNumber()
  @Min(0)
  quantityInStock: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderLevel?: number;

  @IsString() // Assuming supplierId is a string
  @IsOptional()
  supplierId?: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDto)
  @IsOptional()
  attributes?: AttributeDto[];
}
