import { IsString, IsNotEmpty, IsOptional, IsEmail, IsPhoneNumber, IsUrl, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
    example: '+33612345678',
    required: false
  })
  @IsPhoneNumber(undefined) // Specify region if necessary, e.g., 'FR' for France
  @IsOptional()
  phoneNumber?: string;

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

  // totalPurchases is likely calculated and not set directly on creation

  @ApiProperty({
    description: 'URL de la photo de profil du client',
    example: 'https://example.com/profiles/johndoe.jpg',
    required: false
  })
  @IsUrl()
  @IsOptional()
  profilePicture?: string;
}
