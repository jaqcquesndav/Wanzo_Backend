import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../auth/entities/user.entity'; // Adjust path as needed
import { BusinessSector } from './business-sector.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string; // Foreign key for User

  @Column({ type: 'varchar', length: 255, nullable: true })
  firstName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastName?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profilePictureUrl?: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  languagePreference?: string; // e.g., 'en', 'fr'

  @Column({ type: 'varchar', length: 50, nullable: true })
  timezone?: string; // e.g., 'Africa/Douala'

  // Business-related information
  @Column({ type: 'varchar', length: 255, nullable: true })
  businessName?: string;

  @ManyToOne(() => BusinessSector, (sector) => sector.userProfiles, { nullable: true, eager: true })
  @JoinColumn({ name: 'businessSectorId' })
  businessSector?: BusinessSector;

  @Column({ nullable: true })
  businessSectorId?: string;

  @Column({ type: 'text', nullable: true })
  businessDescription?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
