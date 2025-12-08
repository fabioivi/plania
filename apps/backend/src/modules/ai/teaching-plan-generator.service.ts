import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LLMService } from '../ai/llm.service';
import { TeachingPlan } from '../academic/teaching-plan.entity';
import { Diary } from '../academic/diary.entity';
import { DiaryContent } from '../academic/diary-content.entity';
import { format, parseISO, startOfWeek, endOfWeek, differenceInWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    const totalWeeks = weekSchedule.length;
    const totalHours = weekSchedule.reduce((sum, week) => sum + week.totalHours, 0);

    let prompt = `Você é um assistente especializado em criar planos de ensino acadêmicos brasileiros seguindo as normas do MEC.

# INFORMAÇÕES DA DISCIPLINA
- Disciplina: ${diary.disciplina}
- Curso: ${diary.curso}
- Turma: ${diary.turma}
- Carga Horária Total: ${diary.cargaHoraria || totalHours + ' horas (calculado)'}\n`;

    if (diary.periodo) {
      prompt += `- Período: ${diary.periodo}\n`;
    }
    if (diary.anoLetivo && diary.semestre) {
      prompt += `- Ano/Semestre: ${diary.anoLetivo}.${diary.semestre}\n`;
    }

    prompt += `\n# CALENDÁRIO DE AULAS
Total de ${totalWeeks} semanas de aula, com ${totalHours} horas totais:\n\n`;

    weekSchedule.forEach((week) => {
      prompt += `Semana ${week.weekNumber} (${format(week.startDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(week.endDate, 'dd/MM/yyyy', { locale: ptBR })}): ${week.totalHours}h\n`;
      week.classes.forEach((cls) => {
        prompt += `  - ${format(cls.date, 'dd/MM (EEEE)', { locale: ptBR })}: ${cls.timeRange}\n`;
      });
    });

    // Add existing teaching plan as reference (ementa)
    if (existingPlans.length > 0 && existingPlans[0].ementa) {
      prompt += `\n# EMENTA OFICIAL (NÃO ALTERAR - já está no sistema):\n${existingPlans[0].ementa}\n`;
    }

    // Add existing objectives as reference
    if (existingPlans.length > 0 && existingPlans[0].objetivoGeral) {
      prompt += `\n# OBJETIVO GERAL (referência - pode adaptar se necessário):\n${existingPlans[0].objetivoGeral}\n`;
    }

    if (existingPlans.length > 0 && existingPlans[0].objetivosEspecificos) {
      prompt += `\n# OBJETIVOS ESPECÍFICOS (referência - pode adaptar se necessário):\n${existingPlans[0].objetivosEspecificos}\n`;
    }

    // Add existing references
    if (existingPlans.length > 0 && existingPlans[0].referencias) {
      prompt += `\n# REFERÊNCIAS BIBLIOGRÁFICAS (NÃO ALTERAR - já estão no sistema):\n${existingPlans[0].referencias}\n`;
    }

    // Add user preferences
    if (userInput?.objectives) {
      prompt += `\n# OBJETIVOS DESEJADOS PELO PROFESSOR:\n${userInput.objectives}\n`;
    }

    if (userInput?.methodology) {
      prompt += `\n# METODOLOGIA PREFERIDA:\n${userInput.methodology}\n`;
    }

    if (userInput?.additionalNotes) {
      prompt += `\n# OBSERVAÇÕES ADICIONAIS:\n${userInput.additionalNotes}\n`;
    }

    prompt += `\n# TAREFA
Gere um plano de ensino COMPLETO e DETALHADO no formato JSON com a seguinte estrutura:

IMPORTANTE - O que VOCÊ DEVE GERAR:
- objetivoGeral: Objetivo geral da disciplina (baseado na ementa fornecida)
- objetivosEspecificos: Lista de objetivos específicos (use bullet points •)
- metodologia: Descrição detalhada das estratégias metodológicas
- avaliacaoAprendizagem: Array de avaliações distribuídas ao longo do semestre, cada uma com os campos: etapa, avaliacao, instrumentos, dataPrevista, valorMaximo (veja exemplo abaixo)
- recuperacaoAprendizagem: Descrição do processo de recuperação
- propostaTrabalho: Array SEMANAL (${totalWeeks} semanas), cada semana deve conter os campos: conteudo (string), tecnicasEnsino (array de strings), recursosEnsino (array de strings), tema, atividades, datas

IMPORTANTE - O que NÃO DEVE GERAR (já está no sistema):
- ementa (será mantida do sistema acadêmico)
- cargaHoraria (vem do diário)
- referencias (serão mantidas do sistema acadêmico)
- datas das aulas (já foram fornecidas no calendário)

# EXEMPLO DE FORMATO JSON ESPERADO
{
  "objetivoGeral": "Objetivo geral da disciplina baseado na ementa fornecida",
  "objetivosEspecificos": "Lista de objetivos específicos (use bullet points •)",
  "metodologia": "Descrição das estratégias metodológicas que serão utilizadas",
  "avaliacaoAprendizagem": [
    {
      "etapa": "1ª Parcial (NP1)",
      "avaliacao": "Atividades Semanais",
      "instrumentos": "Trabalhos",
      "dataPrevista": "02/09/2025",
      "valorMaximo": 10
    }
  ],
  "recuperacaoAprendizagem": "Descrição do processo de recuperação",
  "propostaTrabalho": [
    {
      "semana": 1,
      "datas": "02/09/2025",
      "tema": "Tema da semana",
      "conteudo": "Conteúdo detalhado da semana",
      "atividades": "Atividades detalhadas",
      "tecnicasEnsino": ["Aula expositiva", "Estudo de caso"],
      "recursosEnsino": ["Projetor", "Laboratório"]
    }
  ]
}

REGRAS IMPORTANTES:
- A propostaTrabalho deve ter uma entrada para CADA SEMANA (${totalWeeks} semanas no total)
- Cada semana deve conter os campos: conteudo, tecnicasEnsino (array), recursosEnsino (array), tema, atividades, datas
- Distribua o conteúdo da EMENTA FORNECIDA ao longo das ${totalWeeks} semanas de forma equilibrada
- Use as horas semanais fornecidas para o campo "numAulas" se necessário
- Seja específico e detalhado em cada seção
- As avaliações devem estar distribuídas ao longo do semestre (sugestão: 3-4 avaliações)
- NÃO gere novas referências bibliográficas (use as existentes do sistema)
- NÃO modifique a ementa (use-a como base para o conteúdo)
- Retorne APENAS o JSON, sem texto adicional ou markdown`;

    return prompt;
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
      });

      // Step 7: Parse response and ensure well-formed JSON
      if (onProgress) onProgress('Processando resposta...', 90);
      // Remove markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      // Exemplo do JSON esperado (para instruir correções automáticas)
      const exampleStructure = {
        objetivoGeral: 'Objetivo geral da disciplina baseado na ementa fornecida',
        objetivosEspecificos: 'Lista de objetivos específicos (use bullet points •)',
        metodologia: 'Descrição das estratégias metodológicas que serão utilizadas',
        avaliacaoAprendizagem: [
          {
            etapa: '1ª Parcial (NP1)',
            avaliacao: 'Atividades Semanais',
            instrumentos: 'Trabalhos',
            dataPrevista: '02/09/2025',
            valorMaximo: 10,
          },
        ],
        recuperacaoAprendizagem: 'Descrição do processo de recuperação',
        propostaTrabalho: [
          {
            semana: 1,
            datas: '02/09/2025',
            tema: 'Tema da semana',
            conteudo: 'Conteúdo detalhado da semana',
            atividades: 'Atividades detalhadas',
            tecnicasEnsino: ['Aula expositiva', 'Estudo de caso'],
            recursosEnsino: ['Projetor', 'Laboratório'],
          },
        ],
      };

      const expectedJsonExample = JSON.stringify(exampleStructure, null, 2);

      let parsed: any = null;
      let lastResponse = cleanResponse;
      let attempts = 0;
      const maxRetries = 2;

      while (attempts <= maxRetries) {
        try {
          parsed = JSON.parse(lastResponse);
          break;
        } catch (e) {
          attempts++;
          this.logger.warn(`Falha ao parsear JSON da IA (tentativa ${attempts}): ${(e as Error).message}`);
          if (attempts > maxRetries) {
            this.logger.error('Erro ao parsear JSON da IA, resposta bruta:', lastResponse);
            throw new Error('Resposta inválida do provedor LLM: JSON inválido');
          }

          // Solicita correção ao LLM com instruções estritas
          const fixPrompt = `A resposta anterior NÃO era um JSON válido. Corrija APENAS o JSON e retorne SOMENTE o JSON válido sem texto adicional.\n\nFormato esperado de exemplo:\n${expectedJsonExample}\n\nResposta anterior:\n${lastResponse}\n\nCorrija e retorne somente o JSON válido.`;

          this.logger.debug('Enviando prompt de correção ao LLM');
          let corrected = await llmProvider.generateCompletion(fixPrompt, {
            systemPrompt,
            temperature: 0.0,
            maxTokens: 4096,
          });

          corrected = corrected.trim();
          if (corrected.startsWith('```')) {
            corrected = corrected.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          }

          lastResponse = corrected;
          // Loop tentará parsear novamente
        }
      }

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
