import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateCompanyProfileDto {
  @ApiProperty({ description: "Nom de l'entreprise", required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: "Adresse de l'entreprise", required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: "Numéro de TVA", required: false })
  @IsOptional()
  @IsString()
  vatNumber?: string;

  @ApiProperty({ description: "Numéro d'enregistrement de l'entreprise", required: false })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiProperty({ description: "Secteur d'activité", required: false })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiProperty({ description: "Site web de l'entreprise", required: false })
  @IsOptional()
  @IsUrl()
  website?: string;
}
