import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AttachmentType } from '../dtos/declaration.dto';
import { Declaration } from './declaration.entity';

@Entity('declaration_attachments')
export class DeclarationAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  declarationId: string;

  @ManyToOne(() => Declaration, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'declarationId' })
  declaration: Declaration;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: AttachmentType
  })
  type: AttachmentType;

  @Column()
  url: string;

  @Column()
  size: number;

  @CreateDateColumn()
  uploadedAt: Date;
}
