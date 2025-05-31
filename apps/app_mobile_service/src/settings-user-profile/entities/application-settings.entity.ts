import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SocialMediaLinksDto } from '../dto/application-settings.dto'; // Assuming DTO can be used for structure

@Entity('application_settings')
export class ApplicationSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  companyName?: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  companyLogoUrl?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  defaultLanguage?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  dateFormat?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  timeFormat?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contactPhone?: string;

  @Column({ type: 'text', nullable: true })
  companyAddress?: string;

  @Column({ type: 'jsonb', nullable: true })
  socialMediaLinks?: SocialMediaLinksDto;

  @Column({ type: 'boolean', default: false })
  maintenanceMode: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
