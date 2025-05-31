import { PartialType } from '@nestjs/mapped-types';
import { CreateSaleDto } from './create-sale.dto';
import { IsOptional, IsArray, ValidateNested, ArrayMinSize, IsString, IsUUID, IsNotEmpty, IsNumber, Min, IsPositive } from 'class-validator'; // Added IsNumber, Min, IsPositive
import { Type } from 'class-transformer';
import { CreateSaleItemDto } from './create-sale-item.dto';

export class UpdateSaleItemDto extends PartialType(CreateSaleItemDto) {
    @IsOptional()
    @IsString()
    id?: string; // ID of the existing sale item to update

    // Make properties that are required in CreateSaleItemDto also required here
    // to ensure UpdateSaleItemDto is assignable to CreateSaleItemDto.
    @IsUUID()
    @IsNotEmpty()
    productId: string;

    @IsNumber()
    @IsPositive()
    @Min(1)
    quantity: number;

    @IsNumber()
    @Min(0)
    unitPrice: number;
}

export class UpdateSaleDto extends PartialType(CreateSaleDto) {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @ArrayMinSize(1)
    @Type(() => UpdateSaleItemDto)
    items?: UpdateSaleItemDto[];

    // Note: Handling updates to line items in a sale can be complex.
    // You might need specific logic in the service to:
    // - Identify new items to add.
    // - Identify existing items to update (using the 'id' in UpdateSaleItemDto).
    // - Identify items to remove (e.g., by omitting them from the updated items array).
}
