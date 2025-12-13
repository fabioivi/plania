import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';

@Entity('diaries')
export class Diary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'external_id', unique: true })
  externalId: string; // ID do diário no sistema IFMS

  @Column()
  disciplina: string;

  @Column()
  curso: string;

  @Column()
  turma: string;

  @Column({ nullable: true })
  periodo: string;

  @Column({ name: 'carga_horaria', nullable: true })
  cargaHoraria: string;

  @Column({ nullable: true })
  modalidade: string;

  @Column({ type: 'int', default: 0 })
  aprovados: number;

  @Column({ type: 'int', default: 0 })
  reprovados: number;

  @Column({ name: 'em_curso', type: 'int', default: 0 })
  emCurso: number;

  @Column({ type: 'boolean', default: false })
  aprovado: boolean; // Se o diário já foi aprovado

  @Column({ name: 'ano_letivo', nullable: true })
  anoLetivo: string;

  @Column({ nullable: true })
  semestre: string;

  @Column({ name: 'data_abertura', type: 'timestamp', nullable: true })
  dataAbertura: Date; // Data de abertura do diário

  @Column({ name: 'data_fechamento', type: 'timestamp', nullable: true })
  dataFechamento: Date; // Data de fechamento do diário

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
