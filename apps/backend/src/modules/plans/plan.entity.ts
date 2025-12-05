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

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.plans)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  discipline: string;

  @Column()
  disciplineCode: string;

  @Column()
  planCode: string;

  @Column()
  period: string;

  @Column()
  workload: number;

  @Column({ type: 'text', nullable: true })
  objectives: string;

  @Column({ type: 'jsonb', nullable: true })
  content: any; // Store structured plan data

  @Column({ default: 'draft' })
  status: string; // 'draft', 'submitted', 'approved'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
