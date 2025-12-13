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
import { Diary } from './diary.entity';

@Entity('teaching_plans')
export class TeachingPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'diary_id' })
  diaryId: string;

  @ManyToOne(() => Diary)
  @JoinColumn({ name: 'diary_id' })
  diary: Diary;

  @Column({ name: 'external_id', unique: true, nullable: true })
  externalId: string; // ID do plano no sistema IFMS (ex: 46332) - null para planos AI não enviados

  @Column({ name: 'source', default: 'ifms' })
  source: 'ifms' | 'ai'; // Origem: 'ifms' = scraped do IFMS, 'ai' = gerado por IA

  @Column({ name: 'base_plan_id', nullable: true })
  basePlanId: string; // ID do plano IFMS usado como base (se source='ai')

  @Column({ name: 'sent_to_ifms', default: false })
  sentToIFMS: boolean; // Se o plano AI foi enviado ao sistema IFMS

  @Column({ name: 'sent_at', nullable: true })
  sentAt: Date; // Data/hora de envio ao IFMS (se sentToIFMS=true)

  @Column({ name: 'status' })
  status: string; // Ex: "Aguardando aprovação", "Aprovado", "Em cadastro", "Gerado por IA - Rascunho"

  @Column({ name: 'status_coord', nullable: true })
  statusCoord: string; // Status do coordenador pedagógico

  @Column({ name: 'excluido', default: false })
  excluido: boolean; // Se o plano foi excluído

  // 01. IDENTIFICAÇÃO
  @Column({ name: 'campus', nullable: true })
  campus: string;

  @Column({ name: 'ano_semestre', nullable: true })
  anoSemestre: string;

  @Column({ name: 'curso', nullable: true })
  curso: string;

  @Column({ name: 'unidade_curricular', nullable: true })
  unidadeCurricular: string;

  @Column({ name: 'professores', type: 'text', nullable: true })
  professores: string; // Lista de professores separados por vírgula

  @Column({ name: 'carga_horaria_total', type: 'decimal', nullable: true })
  cargaHorariaTotal: number;

  @Column({ name: 'num_semanas', type: 'int', nullable: true })
  numSemanas: number;

  @Column({ name: 'num_aulas_teoricas', type: 'int', nullable: true })
  numAulasTeorica: number;

  @Column({ name: 'num_aulas_praticas', type: 'int', nullable: true })
  numAulasPraticas: number;

  // 02. EMENTA
  @Column({ name: 'ementa', type: 'text', nullable: true })
  ementa: string;

  // 03. OBJETIVO GERAL
  @Column({ name: 'objetivo_geral', type: 'text', nullable: true })
  objetivoGeral: string;

  // 04. OBJETIVOS ESPECÍFICOS
  @Column({ name: 'objetivos_especificos', type: 'text', nullable: true })
  objetivosEspecificos: string;

  // 05. AVALIAÇÃO DA APRENDIZAGEM
  @Column({ name: 'avaliacao_aprendizagem', type: 'json', nullable: true })
  avaliacaoAprendizagem: any[]; // Array de objetos com etapa, avaliação, instrumentos, datas, valor

  @Column({ name: 'observacoes_avaliacoes', type: 'text', nullable: true })
  observacoesAvaliacoes: string;

  // 06. RECUPERAÇÃO DA APRENDIZAGEM
  @Column({ name: 'recuperacao_aprendizagem', type: 'text', nullable: true })
  recuperacaoAprendizagem: string;

  // 07. REFERÊNCIAS
  @Column({ name: 'referencias', type: 'text', nullable: true })
  referencias: string;

  // 08. DETALHAMENTO DA PROPOSTA DE TRABALHO
  @Column({ name: 'proposta_trabalho', type: 'json', nullable: true })
  propostaTrabalho: Array<{
    mes: string;
    periodo: string;
    numAulas: string;
    observacoes: string | null;
    conteudo: string | null;
    metodologia: string;
    tecnicasEnsino: string[];
    recursosEnsino: string[];
  }>;

  // Diary Header Metadata (additional fields from diary page)
  @Column({ name: 'classe_completa', nullable: true })
  classeCompleta: string;

  @Column({ name: 'unidade_curricular_codigo', nullable: true })
  unidadeCurricularCodigo: string;

  @Column({ name: 'aulas_normais_criadas', type: 'int', nullable: true })
  aulasNormaisCriadas: number;

  @Column({ name: 'duracao_aula', nullable: true })
  duracaoAula: string; // "45min"

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
