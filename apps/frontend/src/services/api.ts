/**
 * @deprecated This file is deprecated. Use individual services from @/services/api instead:
 * - authService from '@/services/api/auth.service'
 * - academicService from '@/services/api/academic.service'
 * - llmService from '@/services/api/llm.service'
 * - aiService from '@/services/api/ai.service'
 *
 * This file is kept for backwards compatibility and will be removed in a future version.
 */

import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Envia cookies automaticamente
});

// Interceptor para adicionar token JWT automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

// Auth API
export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },
};

// Academic Credentials API
export interface AcademicCredential {
  id: string;
  system: string;
  username: string;
  isVerified: boolean;
  lastVerifiedAt: string | null;
  lastTestedAt: string | null;
  lastError: string | null;
  createdAt: string;
}

export interface SaveCredentialRequest {
  system: string;
  username: string;
  password: string;
}

export const academicApi = {
  async getCredentials(): Promise<AcademicCredential[]> {
    const response = await api.get<AcademicCredential[]>('/academic/credentials');
    return response.data;
  },

  async saveCredential(data: SaveCredentialRequest): Promise<AcademicCredential> {
    const response = await api.post<AcademicCredential>('/academic/credentials', data);
    return response.data;
  },

  async testCredential(id: string): Promise<{ success: boolean; isVerified: boolean; lastError: string | null; lastTestedAt: string | null }> {
    const response = await api.post(`/academic/credentials/${id}/test`);
    return response.data;
  },

  async deleteCredential(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/academic/credentials/${id}`);
    return response.data;
  },

  async syncDiaries(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/academic/diaries/sync');
    return response.data;
  },

  async getDiaries(): Promise<Diary[]> {
    const response = await api.get<Diary[]>('/academic/diaries');
    return response.data;
  },

  async getDiaryTeachingPlans(diaryId: string): Promise<TeachingPlan[]> {
    const response = await api.get<TeachingPlan[]>(`/academic/diaries/${diaryId}/teaching-plans`);
    return response.data;
  },

  async getDiaryWithPlans(diaryId: string): Promise<DiaryWithPlans> {
    const response = await api.get<DiaryWithPlans>(`/academic/diaries/${diaryId}/with-plans`);
    return response.data;
  },

  async getDiaryContent(diaryId: string): Promise<DiaryContent[]> {
    const response = await api.get<DiaryContent[]>(`/academic/diaries/${diaryId}/content?t=${Date.now()}`);
    return response.data;
  },

  async getDiaryContentStats(diaryId: string): Promise<{ total: number; realClasses: number; anticipations: number }> {
    const response = await api.get(`/academic/diaries/${diaryId}/content/stats?t=${Date.now()}`);
    return response.data;
  },

  async syncSpecificDiary(diaryId: string): Promise<{ success: boolean; diary: any; synced: number; realClasses: number; anticipations: number }> {
    const response = await api.post(`/academic/diaries/${diaryId}/sync`);
    return response.data;
  },

  async syncSpecificTeachingPlan(planId: string): Promise<{ success: boolean; plan: any }> {
    const response = await api.post(`/academic/teaching-plans/${planId}/sync`);
    return response.data;
  },

  async generateDiaryContentFromPlan(diaryId: string, teachingPlanId: string): Promise<{
    success: boolean;
    generatedCount: number;
    contents: DiaryContent[];
    diary: any;
    teachingPlan: any;
  }> {
    const response = await api.post(`/academic/diaries/${diaryId}/generate-from-plan`, { teachingPlanId });
    return response.data;
  },

  async saveDiaryContentBulk(diaryId: string, contents: Partial<DiaryContent>[]): Promise<{
    success: boolean;
    savedCount: number;
    contents: DiaryContent[];
  }> {
    const response = await api.post(`/academic/diaries/${diaryId}/content/bulk`, { contents });
    return response.data;
  },

  async sendDiaryContentToSystem(diaryId: string, contentId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    const response = await api.post(`/academic/diaries/${diaryId}/content/${contentId}/send`);
    return response.data;
  },

  async sendDiaryContentBulkToSystem(diaryId: string, contentIds: string[]): Promise<{
    success: boolean;
    total: number;
    succeeded: number;
    failed: number;
    results: Array<{
      contentId: string;
      success: boolean;
      message?: string;
    }>;
  }> {
    const response = await api.post(`/academic/diaries/${diaryId}/content/send-bulk`, { contentIds });
    return response.data;
  },
};

export interface Diary {
  id: string;
  externalId: string;
  disciplina: string;
  curso: string;
  turma: string;
  periodo: string | null;
  cargaHoraria: string | null;
  modalidade: string | null;
  aprovados: number;
  reprovados: number;
  emCurso: number;
  aprovado: boolean;
  anoLetivo: string | null;
  semestre: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryContent {
  id: string;
  contentId: string;
  obsId: string;
  date: string;
  timeRange: string;
  type: 'N' | 'A' | 'R'; // Normal, Antecipação, Reposição
  isNonPresential: boolean;
  content: string;
  observations: string;
  isAntecipation: boolean;
  originalContentId: string | null;
  originalDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeachingPlan {
  id: string;
  externalId: string;
  diaryId: string;
  status: string;
  statusCoord?: string;
  excluido: boolean;
  campus?: string;
  anoSemestre?: string;
  curso?: string;
  unidadeCurricular?: string;
  professores?: string;
  cargaHorariaTotal?: number;
  numSemanas?: number;
  numAulasTeorica?: number;
  numAulasPraticas?: number;
  ementa?: string;
  objetivoGeral?: string;
  objetivosEspecificos?: string;
  avaliacaoAprendizagem?: Array<{
    etapa: string;
    avaliacao: string;
    instrumentos: string;
    dataPrevista: string;
    valorMaximo: string;
  }>;
  observacoesAvaliacoes?: string;
  recuperacaoAprendizagem?: string;
  referencias?: string;
  propostaTrabalho?: Array<{
    mes: string;
    periodo: string;
    numAulas: string;
    observacoes: string;
    conteudo: string;
    metodologia: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryWithPlans extends Diary {
  teachingPlans: TeachingPlan[];
}

// LLM Config API
export interface LLMConfig {
  id: string;
  provider: 'gemini' | 'openai' | 'claude' | 'grok' | 'openrouter';
  modelName: string | null;
  isActive: boolean;
  additionalConfig: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveLLMConfigRequest {
  provider: 'gemini' | 'openai' | 'claude' | 'grok' | 'openrouter';
  apiKey: string;
  modelName?: string;
  isActive?: boolean;
  additionalConfig?: Record<string, any>;
}

export interface UpdateLLMConfigRequest {
  apiKey?: string;
  modelName?: string;
  isActive?: boolean;
  additionalConfig?: Record<string, any>;
}

export const llmConfigApi = {
  async getConfigs(): Promise<LLMConfig[]> {
    const response = await api.get<LLMConfig[]>('/llm-config');
    return response.data;
  },

  async getConfig(id: string): Promise<LLMConfig> {
    const response = await api.get<LLMConfig>(`/llm-config/${id}`);
    return response.data;
  },

  async saveConfig(data: SaveLLMConfigRequest): Promise<LLMConfig> {
    const response = await api.post<LLMConfig>('/llm-config', data);
    return response.data;
  },

  async updateConfig(id: string, data: UpdateLLMConfigRequest): Promise<LLMConfig> {
    const response = await api.put<LLMConfig>(`/llm-config/${id}`, data);
    return response.data;
  },

  async deleteConfig(id: string): Promise<void> {
    await api.delete(`/llm-config/${id}`);
  },

  async testApiKey(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>(`/llm-config/${id}/test`);
    return response.data;
  },
  async activateConfig(id: string): Promise<LLMConfig> {
    const response = await api.put<LLMConfig>(`/llm-config/${id}/activate`);
    return response.data;
  },
};

// AI Teaching Plan Generation API
export interface GenerateTeachingPlanRequest {
  diaryId: string;
  objectives?: string;
  methodology?: string;
  additionalNotes?: string;
}

export interface GeneratedTeachingPlan {
  objetivoGeral: string;
  objetivosEspecificos: string;
  metodologia: string;
  avaliacaoAprendizagem: any[];
  recuperacaoAprendizagem: string;
  propostaTrabalho: any[];
  // Campos do sistema (não gerados):
  // - ementa (do plano existente)
  // - referencias (do plano existente)
  // - cargaHoraria (do diário)
}

export const aiApi = {
  async generateTeachingPlan(data: GenerateTeachingPlanRequest): Promise<{ success: boolean; plan: GeneratedTeachingPlan }> {
    const response = await api.post<{ success: boolean; plan: GeneratedTeachingPlan }>('/ai/teaching-plans/generate', data);
    return response.data;
  },
};

// Re-export new services for backwards compatibility with new hooks
export { authService } from './api/auth.service';
export { academicService } from './api/academic.service';
export { llmService } from './api/llm.service';
export { aiService } from './api/ai.service';
