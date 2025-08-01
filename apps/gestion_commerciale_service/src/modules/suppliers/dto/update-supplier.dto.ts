import { PartialType } from '@nestjs/mapped-types';
import { CreateSupplierDto } from './create-supplier.dto';
import { IsEmail, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SupplierCategory } from '../enums/supplier-category.enum';

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {
  // All fields are inherited from CreateSupplierDto as optional
  // We can add additional Swagger documentation here if needed
}
