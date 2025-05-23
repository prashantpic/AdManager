import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('user_mfa_secrets')
export class UserMfaSecretEntity {
  @PrimaryColumn('uuid') // This should be the User's ID
  userId: string;

  @OneToOne(() => UserEntity, user => user.mfaSecretDetails, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' }) // Specify the foreign key column
  user: UserEntity;

  @Column({ type: 'varchar', nullable: true, select: false }) // Encrypted
  pendingSecret?: string | null; // For MFA setup process

  @Column({ type: 'varchar', nullable: true, select: false }) // Encrypted
  confirmedSecret?: string | null; // Active MFA secret

  // Recovery codes should be hashed if stored, or encrypted.
  // Storing them directly is a security risk.
  // SDS mentions: "recoveryCodes: string[] (encrypted/hashed)"
  @Column('simple-array', { nullable: true, select: false })
  recoveryCodes: string[]; // Array of recovery codes (hashed or encrypted)

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}