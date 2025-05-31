import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MessageType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  SYSTEM = 'system'
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  senderId!: string;

  @Column()
  recipientId!: string;

  @Column({
    type: 'enum',
    enum: MessageType,
  })
  type!: MessageType;

  @Column('text')
  content!: string;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT
  })
  status!: MessageStatus;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}