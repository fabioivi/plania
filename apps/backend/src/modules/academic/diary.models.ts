import { ApiProperty } from '@nestjs/swagger';

export class TeachingPlanModel {
  @ApiProperty({
    description: 'ID único do plano de ensino',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'ID do plano no sistema IFMS',
    example: '46332',
  })
  externalId: string;

  @ApiProperty({
    description: 'Status de aprovação do plano',
    example: 'Aguardando aprovação',
  })
  status: string;

  @ApiProperty({
    description: 'Status do coordenador pedagógico',
    example: 'Plano Pendente',
    required: false,
  })
  statusCoord?: string;

  @ApiProperty({
    description: 'Indica se o plano foi excluído',
    example: false,
  })
  excluido: boolean;

  @ApiProperty({
    description: 'Campus',
    example: 'Campus Nova Andradina',
    required: false,
  })
  campus?: string;

  @ApiProperty({
    description: 'Ano e semestre letivo',
    example: '2025/2',
    required: false,
  })
  anoSemestre?: string;

  @ApiProperty({
    description: 'Nome do curso',
    example: 'Curso Técnico em Informática',
    required: false,
  })
  curso?: string;

  @ApiProperty({
    description: 'Unidade curricular (disciplina)',
    example: 'GERÊNCIA E CONFIGURAÇÕES DE SERVIÇOS DE INTERNET',
    required: false,
  })
  unidadeCurricular?: string;

  @ApiProperty({
    description: 'Lista de professores',
    example: 'FABIO DUARTE DE OLIVEIRA',
    required: false,
  })
  professores?: string;

  @ApiProperty({
    description: 'Carga horária total',
    example: 60.0,
    required: false,
  })
  cargaHorariaTotal?: number;

  @ApiProperty({
    description: 'Número de semanas',
    example: 20,
    required: false,
  })
  numSemanas?: number;

  @ApiProperty({
    description: 'Número de aulas teóricas',
    example: 40,
    required: false,
  })
  numAulasTeorica?: number;

  @ApiProperty({
    description: 'Número de aulas práticas',
    example: 40,
    required: false,
  })
  numAulasPraticas?: number;

  @ApiProperty({
    description: 'Ementa da disciplina',
    example: 'Serviços de redes de computadores. Serviços de Internet...',
    required: false,
  })
  ementa?: string;

  @ApiProperty({
    description: 'Objetivo geral da unidade curricular',
    example: 'Esta disciplina tem por objetivo geral...',
    required: false,
  })
  objetivoGeral?: string;

  @ApiProperty({
    description: 'Objetivos específicos da unidade curricular',
    example: 'Fornecer elementos que permitam ao aluno...',
    required: false,
  })
  objetivosEspecificos?: string;

  @ApiProperty({
    description: 'Sistema de avaliação da aprendizagem',
    example: [
      {
        etapa: '1ª Parcial (NP1)',
        avaliacao: 'Atividades Semanais',
        instrumentos: 'Trabalhos',
        dataPrevista: '02/09/2025',
        valorMaximo: '10',
      },
    ],
    required: false,
    isArray: true,
  })
  avaliacaoAprendizagem?: any[];

  @ApiProperty({
    description: 'Observações sobre as avaliações',
    example: 'Todas as formas de avaliações e prazos aqui descritos...',
    required: false,
  })
  observacoesAvaliacoes?: string;

  @ApiProperty({
    description: 'Estratégias de recuperação da aprendizagem',
    example: 'A recuperação dos conteúdos propostos ocorrerá...',
    required: false,
  })
  recuperacaoAprendizagem?: string;

  @ApiProperty({
    description: 'Referências bibliográficas',
    example: 'Bibliografia Básica\nCOMER, D. E. Interligação em Redes...',
    required: false,
  })
  referencias?: string;

  @ApiProperty({
    description: 'Proposta de trabalho detalhada (cronograma)',
    example: [
      {
        mes: '8 - Agosto',
        periodo: '12 a 16',
        numAulas: '1',
        observacoes: '',
        conteudo: 'Serviços de redes de computadores',
        metodologia: 'Técnicas de Ensino: Aula prática...',
      },
    ],
    required: false,
    isArray: true,
  })
  propostaTrabalho?: any[];

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-12-05T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-12-05T10:30:00Z',
  })
  updatedAt: Date;
}

export class DiaryWithPlansModel {
  @ApiProperty({
    description: 'ID único do diário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'ID do diário no sistema IFMS',
    example: '79118',
  })
  externalId: string;

  @ApiProperty({
    description: 'Nome da disciplina',
    example: 'GERÊNCIA E CONFIGURAÇÕES DE SERVIÇOS DE INTERNET',
  })
  disciplina: string;

  @ApiProperty({
    description: 'Nome do curso',
    example: 'Técnico em Informática - Integrado',
  })
  curso: string;

  @ApiProperty({
    description: 'Código da turma',
    example: '20252055206B',
  })
  turma: string;

  @ApiProperty({
    description: 'Período letivo',
    example: '2025/2',
  })
  periodo: string;

  @ApiProperty({
    description: 'Lista de planos de ensino associados',
    type: [TeachingPlanModel],
    isArray: true,
  })
  teachingPlans: TeachingPlanModel[];

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-12-05T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-12-05T10:30:00Z',
  })
  updatedAt: Date;
}
