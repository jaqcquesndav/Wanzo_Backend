import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Nom de l\'entreprise',
    example: 'Wanzo Solutions',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Adresse de l\'entreprise',
    example: '123 Avenue des Champs-Élysées, 75008 Paris, France',
    required: false
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Numéro d\'enregistrement légal de l\'entreprise (SIRET, etc.)',
    example: '12345678900001',
    required: false
  })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  // Note: userId (creator) will be passed as a separate argument to the companyService.create method
  // by the AuthController or CompanyController, extracted from the authenticated user.
}
