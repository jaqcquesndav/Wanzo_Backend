import { IsString, IsNotEmpty, IsOptional, IsEmail, IsPhoneNumber, IsUrl, IsNumber, Min, IsEnum, IsDate, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CustomerCategory } from '../entities/customer.entity';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Nom complet du client',
    example: 'John Doe',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'Numéro de téléphone du client',
    example: '+243999123456',
    required: true
  })
  @IsPhoneNumber(undefined)
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: 'Adresse email du client',
    example: 'john.doe@example.com',
    required: false
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Adresse postale du client',
    example: '123 rue de Paris, 75001 Paris, France',
    required: false
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Notes concernant le client',
    example: 'Client fidèle depuis 2023',
    required: false
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Montant total des achats (initialisation possible)',
    example: 0,
    required: false,
    default: 0
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalPurchases?: number;

  @ApiProperty({
    description: 'URL de la photo de profil du client',
    example: 'https://example.com/profiles/johndoe.jpg',
    required: false
  })
  @IsUrl()
  @IsOptional()
  profilePicture?: string;
  
  @ApiProperty({
    description: 'Date du dernier achat',
    example: '2025-07-10T14:30:00Z',
    required: false
  })
  @IsDateString()
  @IsOptional()
  lastPurchaseDate?: string;
  
  @ApiProperty({
    description: 'Catégorie du client',
    enum: CustomerCategory,
    example: CustomerCategory.REGULAR,
    default: CustomerCategory.REGULAR,
    required: false
  })
  @IsEnum(CustomerCategory)
  @IsOptional()
  category?: CustomerCategory;
}
