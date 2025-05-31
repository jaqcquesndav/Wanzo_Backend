import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  key!: string;

  @Column('jsonb')
  value!: any;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  isPublic!: boolean;

  @Column({ default: false })
  isSystem!: boolean;

  @Column({ nullable: true })
  institutionId?: string;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}