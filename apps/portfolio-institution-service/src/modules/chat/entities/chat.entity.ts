import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ChatMessage } from './chat-message.entity';

export interface AIModel {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  contextLength: number;
}

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  kiotaId!: string;

  @Column()
  title!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column('uuid')
  userId!: string;

  // Ici, on utilise institutionId au lieu de companyId pour le module institution
  @Column('uuid', { nullable: true })
  institutionId?: string;

  @Column('jsonb', { nullable: true })
  context!: Record<string, any>;

  @Column('jsonb')
  model!: AIModel;

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, any>;

  @OneToMany(() => ChatMessage, message => message.chat)
  messages!: ChatMessage[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
