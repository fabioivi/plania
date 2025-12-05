import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TeachingPlan } from './teaching-plan.entity';

@Entity('teaching_plan_history')
@Index(['teachingPlanId', 'dataEvento'])
export class TeachingPlanHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'teaching_plan_id' })
  teachingPlanId: string;

  @ManyToOne(() => TeachingPlan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teaching_plan_id' })
  teachingPlan: TeachingPlan;

  @Column({ name: 'event_id' })
  eventId: string; // External ID from IFMS

  @Column({ name: 'situacao' })
  situacao: string; // "Aguardando aprovação", "Aprovado", etc.

  @Column({ name: 'observacoes', type: 'text', nullable: true })
  observacoes: string;

  @Column({ name: 'usuario' })
  usuario: string; // Username who made the change

  @Column({ name: 'data_evento', type: 'timestamp' })
  dataEvento: Date; // When the event occurred in IFMS

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date; // When we scraped this history entry
}
