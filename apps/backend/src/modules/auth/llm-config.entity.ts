import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum LLMProvider {
  GEMINI = 'gemini',
  OPENAI = 'openai',
  CLAUDE = 'claude',
  GROK = 'grok',
  OPENROUTER = 'openrouter',
}

@Entity('llm_configs')
export class LLMConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: LLMProvider,
  })
  provider: LLMProvider;

  @Column({ type: 'text' })
  encryptedApiKey: string;

  @Column({ type: 'text' })
  iv: string;

  @Column({ type: 'text' })
  authTag: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  modelName: string; // e.g., 'gemini-pro', 'gpt-4', 'claude-3-opus'

  @Column({ type: 'jsonb', nullable: true })
  additionalConfig: Record<string, any>; // temperature, max_tokens, etc.

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;
}
