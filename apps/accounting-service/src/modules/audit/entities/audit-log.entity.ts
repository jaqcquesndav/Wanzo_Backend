import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn()
  timestamp!: Date;

  @Column()
  action!: string; // 'create' | 'update' | 'delete'

  @Column()
  entityType!: string;

  @Column()
  entityId!: string;

  @Column()
  userId!: string;

  @Column()
  userName!: string;

  @Column()
  userRole!: string;

  @Column('jsonb')
  details!: {
    description: string;
    changes: {
      [fieldName: string]: [any, any]; // [newValue, oldValue]
    };
  };
}
