import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { AcademicCredential } from '../academic/academic-credential.entity';
import { Plan } from '../plans/plan.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  password: string; // bcrypt hashed

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => AcademicCredential, (credential) => credential.user)
  academicCredentials: AcademicCredential[];

  @OneToMany(() => Plan, (plan) => plan.user)
  plans: Plan[];
}
