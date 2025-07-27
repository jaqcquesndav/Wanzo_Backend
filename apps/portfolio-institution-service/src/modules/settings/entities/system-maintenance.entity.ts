import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_maintenance')
export class SystemMaintenance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  startTime!: Date;

  @Column()
  endTime!: Date;

  @Column()
  message!: string;

  @Column({ default: false })
  notifyUsers!: boolean;

  @Column({ default: false })
  notificationSent!: boolean;

  @Column({ default: true })
  scheduled!: boolean;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
