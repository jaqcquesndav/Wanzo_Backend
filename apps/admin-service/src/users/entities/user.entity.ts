import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { UserRole } from '../dtos/user.dto';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string | undefined;

  @Column({ type: 'varchar', unique: true })
  email: string | undefined;

  @Column({ type: 'varchar' })
  password: string | undefined;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole | undefined;

  // On stocke un tableau de permissions. 'simple-array' stocke sous forme CSV en base.
  @Column('simple-array', { nullable: true })
  permissions?: string[];

  @Column({ nullable: true })
  companyId?: string;
}
