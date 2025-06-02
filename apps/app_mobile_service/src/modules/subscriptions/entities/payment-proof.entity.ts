import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../auth/entities/user.entity'; // Assuming User entity

export enum PaymentProofStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('payment_proofs')
@Index(['userId', 'status'])
export class PaymentProof {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  invoiceId?: string; // Optional: if the proof is for a specific invoice

  @Column()
  subscriptionTierId?: string; // Optional: if the proof is for a specific tier purchase/renewal

  @Column()
  tokenPackageId?: string; // Optional: if the proof is for a token package purchase

  @Column()
  fileUrl: string; // URL to the uploaded payment proof file (e.g., on Cloudinary)

  @Column({ type: 'text', nullable: true })
  notes?: string; // Notes from the user submitting the proof

  @Column({
    type: 'enum',
    enum: PaymentProofStatus,
    default: PaymentProofStatus.PENDING,
  })
  status: PaymentProofStatus;

  @Column({ type: 'text', nullable: true })
  adminNotes?: string; // Notes from the admin reviewing the proof

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  submittedAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  reviewedAt?: Date;
}
