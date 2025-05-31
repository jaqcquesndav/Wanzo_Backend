import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity'; // Adjust path as needed

@Entity('app_settings')
export class AppSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' }) // Settings are user-specific
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string; // Foreign key for User

  @Column({ type: 'varchar', length: 50, default: 'light' }) // e.g., 'light', 'dark', 'system'
  theme: string;

  @Column({ type: 'varchar', length: 10, default: 'en' }) // Default language
  language: string;

  // Add other general app settings fields as needed
  // Example: marketingEmails, featureFlags, etc.
  @Column({ type: 'boolean', default: true })
  receiveMarketingEmails: boolean;

  @Column({ type: 'boolean', default: false })
  enableBetaFeatures: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
