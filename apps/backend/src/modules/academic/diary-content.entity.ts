import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Diary } from './diary.entity';

@Entity('diary_contents')
export class DiaryContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'diary_id' })
  diaryId: string;

  @ManyToOne(() => Diary)
  @JoinColumn({ name: 'diary_id' })
  diary: Diary;

  @Column({ name: 'content_id' })
  contentId: string; // ID do conteúdo no sistema IFMS (ex: "5703975")

  @Column({ name: 'obs_id' })
  obsId: string; // ID da observação no sistema IFMS (ex: "5703975")

  @Column({ type: 'date' })
  date: Date; // Data da aula

  @Column({ name: 'time_range' })
  timeRange: string; // Horário (ex: "08:30 às 09:15")

  @Column({ length: 1 })
  type: string; // Tipo: 'N' (Normal), 'A' (Antecipação), 'R' (Reposição)

  @Column({ name: 'is_non_presential', type: 'boolean', default: false })
  isNonPresential: boolean; // Se a aula é não presencial

  @Column({ type: 'text', nullable: true })
  content: string; // Conteúdo ministrado

  @Column({ type: 'text', nullable: true })
  observations: string; // Observações da aula

  @Column({ name: 'is_antecipation', type: 'boolean', default: false })
  isAntecipation: boolean; // Se é antecipação/reposição

  @Column({ name: 'original_content_id', nullable: true })
  originalContentId: string; // ID do conteúdo original (se for antecipação)

  @Column({ name: 'original_date', type: 'date', nullable: true })
  originalDate: Date; // Data original da aula (se for antecipação)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
