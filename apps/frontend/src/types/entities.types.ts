/**
 * Domain Entities Types
 * Centralized types for domain entities used throughout the application
 */

// User entity
export interface User {
  id: string
  email: string
  name: string
}

// Academic Credential entity
export interface AcademicCredential {
  id: string
  system: string
  username: string
  isVerified: boolean
  lastVerifiedAt: string | null
  lastTestedAt: string | null
  lastError: string | null
  createdAt: string
}

// Diary entity
export interface Diary {
  id: string
  externalId: string
  disciplina: string
  curso: string
  turma: string
  periodo: string | null
  cargaHorariaRelogio: number | null
  cargaHorariaAulas: number | null
  modalidade: string | null
  aprovados: number
  reprovados: number
  emCurso: number
  aprovado: boolean
  anoLetivo: string | null
  semestre: string | null
  createdAt: string
  updatedAt: string
}

// Diary Content entity
export interface DiaryContent {
  id: string
  contentId: string
  obsId: string
  date: string
  timeRange: string
  type: 'N' | 'A' | 'R' // Normal, Antecipação, Reposição
  isNonPresential: boolean
  content: string
  observations: string
  isAntecipation: boolean
  originalContentId: string | null
  originalDate: string | null
  createdAt: string
  updatedAt: string
}

// Teaching Plan Evaluation Item
export interface TeachingPlanEvaluation {
  etapa: string
  avaliacao: string
  instrumentos: string
  dataPrevista: string
  valorMaximo: string
}

// Teaching Plan Work Proposal Item
export interface TeachingPlanWorkProposal {
  mes: string
  periodo: string
  numAulas: string
  observacoes: string
  conteudo: string
  metodologia: string
  tecnicasEnsino?: string[]
  recursosEnsino?: string[]
}

// Teaching Plan entity
export interface TeachingPlan {
  id: string
  externalId: string | null
  diaryId: string
  source: 'ifms' | 'ai' // Origem: scraped do IFMS ou gerado por IA
  basePlanId?: string | null // ID do plano IFMS usado como base (se source='ai')
  sentToIFMS: boolean // Se o plano AI foi enviado ao sistema IFMS
  sentAt?: string | null // Data/hora de envio ao IFMS
  status: string
  statusCoord?: string
  excluido: boolean
  campus?: string
  anoSemestre?: string
  curso?: string
  unidadeCurricular?: string
  professores?: string
  cargaHorariaTotal?: number
  numSemanas?: number
  numAulasTeorica?: number
  numAulasPraticas?: number
  ementa?: string
  objetivoGeral?: string
  objetivosEspecificos?: string
  avaliacaoAprendizagem?: TeachingPlanEvaluation[]
  observacoesAvaliacoes?: string
  recuperacaoAprendizagem?: string
  referencias?: string
  propostaTrabalho?: TeachingPlanWorkProposal[]
  createdAt: string
  updatedAt: string
}

// Diary with Teaching Plans (composite entity)
export interface DiaryWithPlans extends Diary {
  teachingPlans: TeachingPlan[]
}

// LLM Config entity
export type LLMProvider = 'gemini' | 'openai' | 'claude' | 'grok' | 'openrouter'

export interface LLMConfig {
  id: string
  provider: LLMProvider
  modelName: string | null
  isActive: boolean
  additionalConfig: Record<string, any> | null
  createdAt: string
  updatedAt: string
}

// Generated Teaching Plan (from AI)
export interface GeneratedTeachingPlan {
  objetivoGeral: string
  objetivosEspecificos: string
  metodologia: string
  avaliacaoAprendizagem: any[]
  recuperacaoAprendizagem: string
  propostaTrabalho: any[]
  // System fields (not generated):
  // - ementa (from existing plan)
  // - referencias (from existing plan)
  // - cargaHoraria (from diary)
}
