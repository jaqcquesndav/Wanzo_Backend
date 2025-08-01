import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  // All fields from CreateCustomerDto are automatically made optional by PartialType
  // This is a class that extends CreateCustomerDto with all properties set as optional
}
