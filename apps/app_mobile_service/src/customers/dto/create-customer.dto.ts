import { IsString, IsNotEmpty, IsOptional, IsEmail, IsPhoneNumber, IsUrl, IsNumber, Min } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsPhoneNumber(undefined) // Specify region if necessary, e.g., 'FR' for France
  @IsOptional()
  phoneNumber?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  // totalPurchases is likely calculated and not set directly on creation

  @IsUrl()
  @IsOptional()
  profilePicture?: string;
}
