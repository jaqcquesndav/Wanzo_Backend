import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum RelatedEntityType {
  EXPENSE = 'Expense',
  SALE = 'Sale',
  CUSTOMER = 'Customer',
  SUPPLIER = 'Supplier',
  COMPANY_PROFILE = 'CompanyProfile',
  PRODUCT = 'Product',
  OTHER = 'Other',
}

@Entity('documents')
export class Document {
  @ApiProperty({ description: 'Unique identifier for the document', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID of the user who uploaded the document' })
  @Column()
  userId: string;

  @ApiProperty({ description: "ID of the company the user belongs to, if applicable", example: "b1f6c9c0-1b1a-4e2a-8c0a-9a3d2a1b0c0f", required: false })
  @Column({ nullable: true })
  companyId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true }) // Consider implications of user deletion
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ description: 'Original name of the uploaded file', example: 'invoice_march.pdf' })
  @Column()
  fileName: string;

  @ApiProperty({ description: 'MIME type of the file', example: 'application/pdf' })
  @Column()
  fileType: string; // MIME type

  @ApiProperty({ description: 'Size of the file in bytes', example: 102400 })
  @Column('bigint') // Use bigint for potentially large file sizes
  fileSize: number;

  @ApiProperty({ description: 'URL where the file is stored', example: 'https://storage.example.com/documents/invoice_march.pdf' })
  @Column()
  storageUrl: string; // URL from cloud storage (e.g., S3, Cloudinary)

  @ApiProperty({ description: "Public ID of the file in Cloudinary", example: "documents/xyzabc", required: false })
  @Column({ nullable: true })
  publicId?: string; // Public ID from Cloudinary

  @ApiProperty({ description: 'Category or type of the document', example: 'Invoice' })
  @Column()
  documentType: string; // E.g., 'Invoice', 'Contract', 'Report', 'ID_Card', 'Business_License'

  @ApiProperty({
    description: 'Type of the entity this document is related to (if any)',
    enum: RelatedEntityType,
    example: RelatedEntityType.EXPENSE,
    required: false,
  })
  @Column({
    type: 'enum',
    enum: RelatedEntityType,
    nullable: true,
  })
  relatedToEntityType?: RelatedEntityType;

  @ApiProperty({ description: 'ID of the entity this document is related to (if any)', example: 'f1c5c9c0-1b1a-4e2a-8c0a-9a3d2a1b0c0e', required: false })
  @Column({ nullable: true })
  relatedToEntityId?: string;

  @ApiProperty({ description: 'Optional description for the document', example: 'Monthly electricity bill for March 2025', required: false })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Tags for easier searching and categorization', example: ['invoice', 'utility', 'march2025'], isArray: true, required: false })
  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @ApiProperty({ description: 'Timestamp of when the document was uploaded' })
  @CreateDateColumn()
  uploadedAt: Date;

  @ApiProperty({ description: 'Timestamp of the last update to the document metadata' })
  @UpdateDateColumn()
  updatedAt: Date;
}
