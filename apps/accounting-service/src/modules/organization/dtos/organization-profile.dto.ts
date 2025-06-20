import { ApiProperty } from '@nestjs/swagger';

export class OrganizationProfileDto {
  @ApiProperty({ description: "ID de l'organisation" })
  id!: string;

  @ApiProperty({ description: "Nom de l'organisation" })
  name!: string;

  @ApiProperty({ description: "Adresse de l'organisation", required: false })
  address?: string;

  @ApiProperty({ description: "Numéro de TVA", required: false })
  vatNumber?: string;

  @ApiProperty({ description: "Numéro d'enregistrement de l'entreprise", required: false })
  registrationNumber?: string;

  @ApiProperty({ description: "Secteur d'activité", required: false })
  industry?: string;

  @ApiProperty({ description: "Site web de l'entreprise", required: false })
  website?: string;

  @ApiProperty({ description: "Date de création" })
  createdAt!: Date;

  @ApiProperty({ description: "Date de mise à jour" })
  updatedAt!: Date;
}
