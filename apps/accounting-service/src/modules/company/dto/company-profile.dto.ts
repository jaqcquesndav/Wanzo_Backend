import { ApiProperty } from '@nestjs/swagger';

export class CompanyProfileDto {
  @ApiProperty({ description: "ID du compte client" })
  id!: string;

  @ApiProperty({ description: "Nom de l'entreprise" })
  name!: string;

  @ApiProperty({ description: "Adresse de l'entreprise" })
  address!: string;

  @ApiProperty({ description: "Numéro de TVA" })
  vatNumber!: string;

  @ApiProperty({ description: "Numéro d'enregistrement de l'entreprise" })
  registrationNumber!: string;

  @ApiProperty({ description: "Secteur d'activité" })
  industry!: string;

  @ApiProperty({ description: "Site web de l'entreprise" })
  website!: string;

  @ApiProperty({ description: "Date de création" })
  createdAt!: Date;

  @ApiProperty({ description: "Date de mise à jour" })
  updatedAt!: Date;
}
