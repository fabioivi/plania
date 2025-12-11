import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LLMService } from '../ai/llm.service';
import { TeachingPlan } from '../academic/teaching-plan.entity';
import { Diary } from '../academic/diary.entity';
import { DiaryContent } from '../academic/diary-content.entity';
import { format, parseISO, startOfWeek, endOfWeek, differenceInWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import teachingPlanSchema from './teaching-plan.schema.json';
import Ajv from 'ajv';
import { buildTeachingPlanPrompt } from './teaching-plan-prompt';

export interface WeekSchedule {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  classes: {
    date: Date;
    timeRange: string;
    type: string;
    hours: number;
  }[];
  totalHours: number;
}

export interface GenerateTeachingPlanDto {
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
  recuperacaoAprrendizagem: string;
  propostaTrabalho: any[];
  // Campos que vêm do sistema (não gerar):
  // - ementa (já existe no plano scraped)
  // - cargaHoraria (vem do diário)
  // - referencias (já existe no plano scraped)
  // - datas (vem do diário)
}

@Injectable()
export class TeachingPlanGeneratorService {
  private readonly logger = new Logger(TeachingPlanGeneratorService.name);

  constructor(
    private readonly llmService: LLMService,
    @InjectRepository(Diary)
    private readonly diaryRepository: Repository<Diary>,
    @InjectRepository(DiaryContent)
    private readonly diaryContentRepository: Repository<DiaryContent>,
    @InjectRepository(TeachingPlan)
    private readonly teachingPlanRepository: Repository<TeachingPlan>,
  ) {}

  /**
   * Group diary classes by week
   */
  async getWeeklySchedule(diaryId: string): Promise<WeekSchedule[]> {
    const contents = await this.diaryContentRepository.find({
      where: { diaryId },
      order: { date: 'ASC' },
    });

    if (contents.length === 0) {
      return [];
    }

    const weekMap = new Map<string, WeekSchedule>();
    
    // Convert first date if needed
    const firstDateStr = typeof contents[0].date === 'string' 
      ? contents[0].date 
      : contents[0].date.toISOString();
    const firstDate = parseISO(firstDateStr);

    for (const content of contents) {
      const dateStr = typeof content.date === 'string'
        ? content.date
        : content.date.toISOString();
      const date = parseISO(dateStr);
      const weekStart = startOfWeek(date, { locale: ptBR });
      const weekEnd = endOfWeek(date, { locale: ptBR });
      const weekNumber = differenceInWeeks(date, firstDate) + 1;
      const weekKey = format(weekStart, 'yyyy-MM-dd');

      // Parse time range to calculate hours
      const timeMatch = content.timeRange.match(/(\d+)h/);
      const hours = timeMatch ? parseInt(timeMatch[1]) : 2; // Default 2 hours

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          weekNumber,
          startDate: weekStart,
          endDate: weekEnd,
          classes: [],
          totalHours: 0,
        });
      }

      const week = weekMap.get(weekKey)!;
      week.classes.push({
        date,
        timeRange: content.timeRange,
        type: content.type,
        hours,
      });
      week.totalHours += hours;
    }

    return Array.from(weekMap.values()).sort((a, b) => a.weekNumber - b.weekNumber);
  }

  /**
   * Build prompt for LLM to generate teaching plan
   */
  private buildPrompt(
    diary: Diary,
    weekSchedule: WeekSchedule[],
    existingPlans: TeachingPlan[],
    userInput?: Partial<GenerateTeachingPlanDto>,
  ): string {
    const anoSemestre = `${diary.anoLetivo}.${diary.semestre}`;
    const curso = diary.curso;
    const unidadeCurricular = diary.disciplina;
    const professores = diary.user?.name || 'Não informado';
    const cargaHorariaTotal = diary.cargaHoraria || weekSchedule.reduce((sum, week) => sum + week.totalHours, 0) + ' horas';
    const aulasTeoricas = 'Não especificado'; // TODO: extract from diary if available
    const aulasPraticas = 'Não especificado'; // TODO: extract from diary if available
    const ementa = existingPlans.length > 0 ? existingPlans[0].ementa : 'Não disponível';
    const objetivoGeral = existingPlans.length > 0 ? existingPlans[0].objetivoGeral : 'Não disponível';
    const objetivosEspecificos = existingPlans.length > 0 && existingPlans[0].objetivosEspecificos ? existingPlans[0].objetivosEspecificos.split('\n').filter(obj => obj.trim()) : ['Não disponíveis'];

    // Format weekSchedule for the prompt
    const semanas = weekSchedule.map(week => ({
      weekNumber: week.weekNumber,
      startDate: format(week.startDate, 'dd/MM/yyyy', { locale: ptBR }),
      endDate: format(week.endDate, 'dd/MM/yyyy', { locale: ptBR }),
      totalHours: week.totalHours,
      classes: week.classes.map(cls => ({
        date: format(cls.date, 'dd/MM (EEEE)', { locale: ptBR }),
        timeRange: cls.timeRange,
        type: cls.type,
        hours: cls.hours,
      })),
    }));

    return buildTeachingPlanPrompt({
      anoSemestre,
      curso,
      unidadeCurricular,
      professores,
      cargaHorariaTotal,
      aulasTeoricas,
      aulasPraticas,
      ementa,
      objetivoGeral,
      objetivosEspecificos,
      semanas,
      userObjectives: userInput?.objectives,
      userMethodology: userInput?.methodology,
      userNotes: userInput?.additionalNotes,
    });
  }

  /**
   * Generate teaching plan using AI
   */
  async generatePlan(
    userId: string,
    dto: GenerateTeachingPlanDto,
    onProgress?: (message: string, progress: number) => void,
  ): Promise<GeneratedTeachingPlan> {
    try {
      // Step 1: Load diary
      if (onProgress) onProgress('Carregando dados do diário...', 10);
      const diary = await this.diaryRepository.findOne({
        where: { id: dto.diaryId, userId },
        relations: ['user'],
      });

      if (!diary) {
        throw new NotFoundException('Diário não encontrado');
      }

      // Step 2: Get weekly schedule
      if (onProgress) onProgress('Analisando calendário de aulas...', 20);
      const weekSchedule = await this.getWeeklySchedule(dto.diaryId);

      if (weekSchedule.length === 0) {
        throw new Error('Nenhuma aula encontrada no diário. Sincronize o diário primeiro.');
      }

      // Step 3: Get existing teaching plans (for reference)
      if (onProgress) onProgress('Buscando planos de ensino existentes...', 30);
      const existingPlans = await this.teachingPlanRepository.find({
        where: { diaryId: dto.diaryId },
        order: { createdAt: 'DESC' },
      });

      // Step 4: Get LLM provider
      if (onProgress) onProgress('Conectando ao provedor de IA...', 40);
      const llmProvider = await this.llmService.getProvider(userId);

      // Step 5: Build prompt
      if (onProgress) onProgress('Preparando contexto para IA...', 50);
      const prompt = this.buildPrompt(diary, weekSchedule, existingPlans, dto);

      this.logger.debug('Generated prompt:', prompt);

      // Step 6: Generate with LLM
      if (onProgress) onProgress('Gerando plano de ensino com IA...', 60);
      
      const systemPrompt = `Você é um especialista em educação brasileira e elaboração de planos de ensino. 
Você conhece as diretrizes do MEC e as melhores práticas pedagógicas.
Sempre responda em português do Brasil.
Retorne APENAS JSON válido, sem markdown ou texto adicional.`;

      const response = await llmProvider.generateCompletion(prompt, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 8192,
        responseSchema: teachingPlanSchema,
      });

      // Step 7: Parse response (Gemini garante JSON válido com schema)
      if (onProgress) onProgress('Processando resposta...', 90);
      
      // Robust JSON extraction/parsing: providers sometimes return markdown
      // fences, streaming prefixes ("data: ...") or small wrappers. Try to
      // normalize before JSON.parse and log helpful diagnostics on failure.
      const extractJsonString = (raw: any): string | null => {
        if (!raw && raw !== 0) return null;
        if (typeof raw !== 'string') {
          try {
            return JSON.stringify(raw);
          } catch (e) {
            return null;
          }
        }

        let text = raw.trim();

        // Remove common markdown code fences
        if (text.startsWith('```')) {
          // remove first and last fences if present
          const fenceRemoved = text.replace(/^```\w*\n?/i, '').replace(/\n?```$/i, '');
          text = fenceRemoved.trim();
        }

        // Remove leading streaming prefixes like `data: ` per-line
        if (text.includes('\ndata:')) {
          const lines = text.split('\n');
          const cleaned = lines
            .map(l => l.startsWith('data:') ? l.slice(5).trim() : l)
            .join('\n');
          text = cleaned.trim();
        }

        // If the full text is valid JSON, return it quickly
        try {
          JSON.parse(text);
          return text;
        } catch (e) {
          // fallback: try to extract the first {...} or [...] block
          const m = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
          if (m && m[0]) return m[0];
          return null;
        }
      };

      let parsed: GeneratedTeachingPlan;
      const jsonStr = extractJsonString(response);
      if (!jsonStr) {
        this.logger.error('Não foi possível extrair JSON da resposta da IA. Pré-visualização:', String(response).slice(0, 2000));
        throw new Error('Resposta inválida do provedor LLM: JSON inválido ou não encontrado');
      }

      try {
        parsed = JSON.parse(jsonStr);
      } catch (e) {
        this.logger.error('Erro inesperado ao parsear JSON da IA (string extraída):', jsonStr.slice(0, 2000));
        throw new Error('Resposta inválida do provedor LLM: JSON inválido');
      }

      // Accept alternate shapes (best-effort mapping) and validate against schema
      const ajv = new Ajv({ allErrors: true, strict: false });
      const validate = ajv.compile(teachingPlanSchema as any);

      // If the provider returned an alternative wrapped structure, try to map it
      let candidate: any = parsed;
      if ((parsed as any)?.plano_de_ensino) {
        const p = (parsed as any).plano_de_ensino;
        // Best-effort mapping from provider-specific keys to our schema
        candidate = {
          objetivoGeral: p.objetivos_educacionais?.geral ?? p.informacoes_basicas?.objetivoGeral ?? '',
          objetivosEspecificos: p.objetivos_educacionais?.especificos ?? [],
          metodologia: p.objetivos_educacionais?.fundamentacao_pedagogica ?? p.metodologia ?? '',
          avaliacaoAprendizagem: [],
          recuperacaoAprrendizagem: '',
          propostaTrabalho: Array.isArray(p.proposta_de_trabalho_semanal)
            ? p.proposta_de_trabalho_semanal.map((w: any) => ({
                semana: w.semana,
                datas: w.periodo,
                tema: w.conteudo_programatico ?? w.tema ?? '',
                conteudo: w.conteudo_programatico ?? w.tema ?? '',
                atividades: '',
                tecnicasEnsino: w.tecnicas_de_ensino ?? [],
                recursosEnsino: w.recursos_didaticos ?? [],
                numAulas: w.aulas_previstas ?? w.numAulas ?? 0,
              }))
            : [],
        };

        // Try to extract some evaluation entries from weekly items
        try {
          const evals: any[] = [];
          for (const w of (p.proposta_de_trabalho_semanal || [])) {
            if (w.metodos_de_avaliacao) {
              evals.push({
                etapa: `Semana ${w.semana}`,
                avaliacao: JSON.stringify(w.metodos_de_avaliacao),
                instrumentos: '',
                dataPrevista: '',
                valorMaximo: 0,
              });
            }
          }
          if (evals.length) candidate.avaliacaoAprendizagem = evals;
          // Attempt to set recuperation from first week's estrategia_de_recuperacao
          candidate.recuperacaoAprrendizagem = p.proposta_de_trabalho_semanal?.[0]?.estrategias_de_recuperacao ?? '';
        } catch (e) {
          // ignore mapping errors
        }
      }

      // Normalize fields that may come as comma-separated strings into arrays
      try {
        if (candidate?.propostaTrabalho && Array.isArray(candidate.propostaTrabalho)) {
          candidate.propostaTrabalho = candidate.propostaTrabalho.map((item: any) => {
            const copy = { ...item };
            // Normalize tecnicasEnsino
            if (typeof copy.tecnicasEnsino === 'string') {
              copy.tecnicasEnsino = copy.tecnicasEnsino
                .split(/[\n;,]+/) // split on newline, semicolon or comma
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0);
            }
            if (!Array.isArray(copy.tecnicasEnsino)) {
              copy.tecnicasEnsino = Array.isArray(copy.tecnicasEnsino) ? copy.tecnicasEnsino : [];
            }

            // Normalize recursosEnsino
            if (typeof copy.recursosEnsino === 'string') {
              copy.recursosEnsino = copy.recursosEnsino
                .split(/[\n;,]+/)
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0);
            }
            if (!Array.isArray(copy.recursosEnsino)) {
              copy.recursosEnsino = Array.isArray(copy.recursosEnsino) ? copy.recursosEnsino : [];
            }

            return copy;
          });
        }
      } catch (e) {
        // If normalization fails, ignore and let AJV report the schema errors
      }

      // Validate candidate against schema
      const valid = validate(candidate);
      if (!valid) {
        const errors = (validate.errors || []).map((er: any) => `${er.instancePath} ${er.message}`).join('; ');
        this.logger.error('Resposta da IA não está conforme o schema:', errors, 'Resposta bruta:', parsed);
        throw new Error(`Resposta do provedor LLM não conforme ao schema: ${errors}`);
      }

      // Assign parsed to the validated/mapped candidate
      parsed = candidate as GeneratedTeachingPlan;

      if (!parsed) {
        this.logger.error('Não foi possível obter JSON válido do provedor LLM.');
        throw new Error('Não foi possível obter JSON válido do provedor LLM.');
      }

      this.logger.debug('Plano gerado pela IA:', JSON.stringify(parsed, null, 2));

      if (onProgress) onProgress('Plano gerado com sucesso!', 100);

      // Add data from existing plan (scraped from system)
      const finalPlan: GeneratedTeachingPlan = {
        ...parsed,
      };

      return finalPlan;
    } catch (error) {
      this.logger.error('Error generating teaching plan:', error);
      throw error;
    }
  }
}
