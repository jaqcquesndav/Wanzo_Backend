import { PartialType } from '@nestjs/mapped-types';
import { CreateSupplierDto } from './create-supplier.dto';
import { IsEmail, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { SupplierCategory } from '../entities/supplier.entity';

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {
  // All fields are inherited from CreateSupplierDto as optional
  // We can override or add additional validation here if needed
}
