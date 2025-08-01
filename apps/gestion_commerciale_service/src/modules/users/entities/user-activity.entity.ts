import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../auth/entities/user.entity';

export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  PROFILE_UPDATE = 'profile_update',
  SETTINGS_CHANGE = 'settings_change',
  CREATE_RECORD = 'create_record',
  UPDATE_RECORD = 'update_record',
  DELETE_RECORD = 'delete_record',
  VIEW_RECORD = 'view_record',
  EXPORT_DATA = 'export_data',
  IMPORT_DATA = 'import_data',
}

@Entity('user_activities')
export class UserActivity {
  @ApiProperty({
    description: 'Identifiant unique de l\'activité',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Utilisateur associé à l\'activité',
    type: () => User
  })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({
    description: 'ID de l\'utilisateur associé à l\'activité',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({
    description: 'Type d\'activité',
    enum: ActivityType,
    example: ActivityType.LOGIN
  })
  @Column({
    type: 'enum',
    enum: ActivityType,
    name: 'activity_type'
  })
  activityType: ActivityType;

  @ApiProperty({
    description: 'Description de l\'activité',
    example: 'Connexion réussie'
  })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({
    description: 'Module concerné par l\'activité',
    example: 'auth',
    nullable: true
  })
  @Column({ nullable: true })
  module: string;

  @ApiProperty({
    description: 'Identifiant de l\'enregistrement concerné',
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true
  })
  @Column({ name: 'record_id', nullable: true })
  recordId: string;

  @ApiProperty({
    description: 'Adresse IP de l\'utilisateur',
    example: '192.168.1.1',
    nullable: true
  })
  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @ApiProperty({
    description: 'Informations sur l\'appareil utilisé',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    nullable: true
  })
  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @ApiProperty({
    description: 'Métadonnées supplémentaires (au format JSON)',
    example: '{"old_value": "user1", "new_value": "user2"}',
    nullable: true
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ApiProperty({
    description: 'Date de création de l\'activité',
    example: '2025-01-01T00:00:00Z'
  })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
