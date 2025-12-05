import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';

@Entity('academic_credentials')
export class AcademicCredential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.academicCredentials)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  system: string; // 'ifms', 'other-system', etc.

  @Column()
  username: string; // Not encrypted, just the username/email

  @Column({ type: 'text' })
  passwordEncrypted: string; // AES-256-GCM encrypted password

  @Column()
  passwordIv: string; // Initialization vector for decryption

  @Column()
  passwordAuthTag: string; // Authentication tag for verification

  @Column({ default: false })
  isVerified: boolean; // Whether credentials have been tested and work

  @Column({ type: 'timestamp', nullable: true })
  lastVerifiedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastTestedAt: Date; // Last time credentials were tested (success or failure)

  @Column({ type: 'text', nullable: true })
  lastError: string; // Last error message if test failed

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
