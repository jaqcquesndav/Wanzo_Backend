import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('companies')
export class Company {
  @ApiProperty({
    description: 'Identifiant unique de l\'entreprise',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nom de l\'entreprise',
    example: 'Wanzo SARL',
  })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({
    description: 'Numéro d\'enregistrement de l\'entreprise',
    example: 'RC/KIN/2023/12345',
  })
  @Column({ length: 100, unique: true })
  registrationNumber: string;

  @ApiProperty({
    description: 'Adresse de l\'entreprise',
    example: '123 Avenue des Martyrs, Kinshasa, RDC',
  })
  @Column({ type: 'text', nullable: true })
  address?: string;

  @ApiProperty({
    description: 'Numéro de téléphone',
    example: '+243 81 234 5678',
  })
  @Column({ length: 20, nullable: true })
  phone?: string;

  @ApiProperty({
    description: 'Adresse email',
    example: 'contact@wanzo.cd',
  })
  @Column({ length: 255, nullable: true })
  email?: string;

  @ApiProperty({
    description: 'Site web',
    example: 'https://www.wanzo.cd',
  })
  @Column({ length: 255, nullable: true })
  website?: string;

  @ApiProperty({
    description: 'Statut de l\'entreprise',
    example: true,
  })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Date de création de l\'enregistrement',
    example: '2023-08-01T12:30:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour',
    example: '2023-08-01T12:30:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
