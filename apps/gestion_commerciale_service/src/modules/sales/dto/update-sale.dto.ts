import { PartialType } from '@nestjs/mapped-types';
import { CreateSaleDto } from './create-sale.dto';
import { IsOptional, IsArray, ValidateNested, ArrayMinSize, IsString, IsUUID, IsNotEmpty, IsNumber, Min, IsPositive } from 'class-validator'; // Added IsNumber, Min, IsPositive
import { Type } from 'class-transformer';
import { CreateSaleItemDto } from './create-sale-item.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSaleItemDto extends PartialType(CreateSaleItemDto) {
    @ApiProperty({
        description: 'Identifiant unique de l\'article de vente (pour mise à jour)',
        example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        required: false
    })
    @IsOptional()
    @IsString()
    id?: string; // ID of the existing sale item to update

    // Make properties that are required in CreateSaleItemDto also required here
    // to ensure UpdateSaleItemDto is assignable to CreateSaleItemDto.
    @ApiProperty({
        description: 'Identifiant unique du produit',
        example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        format: 'uuid',
        required: true
    })
    @IsUUID()
    @IsNotEmpty()
    productId: string;

    @ApiProperty({
        description: 'Quantité du produit vendu',
        example: 2,
        minimum: 1,
        required: true
    })
    @IsNumber()
    @IsPositive()
    @Min(1)
    quantity: number;    @ApiProperty({
        description: 'Prix unitaire au moment de la vente',
        example: 750.00,
        minimum: 0,
        required: true
    })
    @IsNumber()
    @Min(0)
    unitPrice: number;
}

export class UpdateSaleDto extends PartialType(CreateSaleDto) {
    @ApiProperty({
        description: 'Articles de la vente à mettre à jour',
        type: [UpdateSaleItemDto],
        required: false
    })
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
