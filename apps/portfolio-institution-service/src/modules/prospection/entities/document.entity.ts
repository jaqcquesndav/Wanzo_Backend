import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Prospect } from './prospect.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column()
  cloudinaryUrl: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  uploadedBy: string;

  @ManyToOne(() => Prospect, (prospect: any) => prospect.documents)
  @JoinColumn({ name: 'prospectId' })
  prospect: Prospect;

  @Column()
  prospectId: string;

  @CreateDateColumn()
  uploadedAt: Date;
}
