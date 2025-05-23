import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { RoleEntity } from './role.entity';
import { UserMfaSecretEntity } from './user-mfa-secret.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false }) // select: false to hide by default
  passwordHash: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToMany(() => RoleEntity, (role) => role.users, { eager: false, cascade: ['insert'] }) // eager: false by default, can be true if roles always needed
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles: RoleEntity[];

  @Column('simple-array', { nullable: true, select: false }) // Stores as text[], e.g., ["hash1", "hash2"]
  passwordHistory: string[]; // Array of previous password hashes

  @Column({ type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lockoutUntil: Date | null;

  @Column({ type: 'boolean', default: false })
  isMfaEnabled: boolean;

  // mfaSecret can be stored in UserMfaSecretEntity for separation of concerns
  // If UserMfaSecretEntity is used, this field might not be needed here.
  // @Column({ type: 'varchar', nullable: true, select: false })
  // mfaSecret?: string; // Encrypted

  @OneToOne(() => UserMfaSecretEntity, userMfaSecret => userMfaSecret.user, { cascade: true, nullable: true })
  @JoinColumn()
  mfaSecretDetails?: UserMfaSecretEntity;


  // For password reset
  @Column({ type: 'varchar', nullable: true, select: false })
  passwordResetToken?: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true, select: false })
  passwordResetExpires?: Date | null;


  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}