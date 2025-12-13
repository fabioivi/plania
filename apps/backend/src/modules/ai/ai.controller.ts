import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Sse,
  MessageEvent,
  Param,
  Get,
} from '@nestjs/common';
import { Observable, interval, map, takeWhile, concat, of } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  TeachingPlanGeneratorService,
  GenerateTeachingPlanDto,
} from './teaching-plan-generator.service';
import { LLMService } from './llm.service';
import { LLMProvider as LLMProviderEnum } from '../auth/llm-config.entity';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(
    private readonly teachingPlanGeneratorService: TeachingPlanGeneratorService,
    private readonly llmService: LLMService,
  ) { }

  /**
   * Generate teaching plan with Server-Sent Events for progress
   */
  @Sse('teaching-plans/generate/:diaryId')
  async generateTeachingPlanSSE(
    @Param('diaryId') diaryId: string,
    @Request() req,
  ): Promise<Observable<MessageEvent>> {
    const userId = req.user.id;
    const basePlanId = req.query.basePlanId as string | undefined;
    let generatedPlan: any = null;
    let currentProgress = 0;
    let currentMessage = 'Iniciando geração...';
    let isComplete = false;
    let hasError = false;
    let errorMessage = '';

    // Start generation in background
    this.teachingPlanGeneratorService
      .generatePlan(
        userId,
        { diaryId, basePlanId },
        (message: string, progress: number) => {
          currentMessage = message;
          currentProgress = progress;
        },
      )
      .then((plan) => {
        generatedPlan = plan;
        isComplete = true;
        currentProgress = 100;
        currentMessage = 'Plano gerado com sucesso!';
      })
      .catch((error) => {
        hasError = true;
        errorMessage = error.message || 'Erro ao gerar plano';
        currentMessage = errorMessage;
      });

    // Return SSE stream
    return interval(500).pipe(
      map((index): MessageEvent => {
        if (hasError) {
          return {
            data: {
              type: 'error',
              message: errorMessage,
            },
          };
        }

        if (isComplete && generatedPlan) {
          return {
            data: {
              type: 'complete',
              message: currentMessage,
              progress: 100,
              plan: generatedPlan,
            },
          };
        }

        return {
          data: {
            type: 'progress',
            message: currentMessage,
            progress: currentProgress,
          },
        };
      }),
      takeWhile((event: any) => {
        // Continue enquanto for 'progress'
        // Para quando for 'complete' (com ou sem plan) ou 'error'
        return event.data.type === 'progress';
      }, true),  // true = inclui o último evento antes de parar
    );
  }

  /**
   * Generate teaching plan (simple POST endpoint)
   */
  @Post('teaching-plans/generate')
  async generateTeachingPlan(
    @Request() req,
    @Body() dto: GenerateTeachingPlanDto,
  ) {
    const userId = req.user.id;
    const plan = await this.teachingPlanGeneratorService.generatePlan(userId, dto);

    return {
      success: true,
      plan,
    };
  }

  /**
   * List OpenRouter models for the authenticated user (uses user's OpenRouter config)
   */
  @Get('openrouter/models')
  async listOpenRouterModels(@Request() req) {
    const userId = req.user.id;

    // Get provider instance for OpenRouter specifically
    const provider = await this.llmService.getProvider(userId, LLMProviderEnum.OPENROUTER as any);

    // Only OpenRouterProvider exposes listModels
    // Use a duck-typed call
    if (typeof (provider as any).listModels !== 'function') {
      return { success: false, message: 'OpenRouter provider not available' };
    }

    try {
      const models = await (provider as any).listModels();
      return { success: true, models };
    } catch (e: any) {
      return { success: false, message: e.message || String(e) };
    }
  }

  /**
   * Improve a specific field of a teaching plan using AI
   */
  @Post('teaching-plans/:planId/improve')
  async improveField(
    @Param('planId') planId: string,
    @Request() req,
    @Body() body: {
      field: 'objetivoGeral' | 'objetivosEspecificos' | 'metodologia' | 'avaliacaoAprendizagem' | 'propostaTrabalho' | 'custom';
      currentContent: string;
      prompt?: string;
      planContext?: {
        unidadeCurricular?: string;
        curso?: string;
        ementa?: string;
      };
    },
  ) {
    const userId = req.user.id;
    const { field, currentContent, prompt, planContext } = body;

    try {
      const provider = await this.llmService.getProvider(userId);

      // Build the prompt based on the field
      let systemPrompt = `Você é um especialista em pedagogia e educação superior no Brasil. 
Sua tarefa é melhorar ou criar conteúdo para planos de ensino de forma profissional e acadêmica.
Responda APENAS com o conteúdo melhorado, sem explicações adicionais.
Use português brasileiro formal e acadêmico.`;

      let userPrompt = '';

      const context = planContext
        ? `Contexto:\n- Unidade Curricular: ${planContext.unidadeCurricular || 'N/A'}\n- Curso: ${planContext.curso || 'N/A'}\n- Ementa: ${planContext.ementa || 'N/A'}\n\n`
        : '';

      switch (field) {
        case 'objetivoGeral':
          userPrompt = `${context}Melhore o seguinte Objetivo Geral de um plano de ensino, tornando-o mais claro, mensurável e alinhado com as competências esperadas:\n\nObjetivo atual:\n${currentContent}\n\n${prompt ? `Instrução adicional: ${prompt}` : ''}`;
          break;
        case 'objetivosEspecificos':
          userPrompt = `${context}Melhore os seguintes Objetivos Específicos de um plano de ensino. Cada objetivo deve iniciar com verbo no infinitivo e ser observável/mensurável:\n\nObjetivos atuais:\n${currentContent}\n\n${prompt ? `Instrução adicional: ${prompt}` : ''}`;
          break;
        case 'metodologia':
          userPrompt = `${context}Sugira metodologias de ensino adequadas para esta disciplina. Inclua estratégias pedagógicas modernas como aprendizagem ativa, sala de aula invertida, etc. quando apropriado:\n\nMetodologia atual:\n${currentContent || 'Nenhuma definida'}\n\n${prompt ? `Instrução adicional: ${prompt}` : ''}`;
          break;
        case 'avaliacaoAprendizagem':
          userPrompt = `${context}Sugira instrumentos e critérios de avaliação da aprendizagem para esta disciplina. Considere avaliações formativas e somativas:\n\nAvaliações atuais:\n${currentContent || 'Nenhuma definida'}\n\n${prompt ? `Instrução adicional: ${prompt}` : ''}`;
          break;
        case 'propostaTrabalho':
          userPrompt = `${context}Expanda e melhore o conteúdo programático semanal a seguir, adicionando mais detalhes sobre atividades, recursos e técnicas de ensino:\n\nConteúdo atual:\n${currentContent}\n\n${prompt ? `Instrução adicional: ${prompt}` : ''}`;
          break;
        case 'custom':
          userPrompt = `${context}${prompt || 'Melhore o seguinte conteúdo:'}\n\nConteúdo:\n${currentContent}`;
          break;
        default:
          throw new Error(`Campo inválido: ${field}`);
      }

      const response = await provider.generateCompletion(userPrompt, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 2000,
      });

      return {
        success: true,
        field,
        improvedContent: response.trim(),
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Erro ao processar com IA',
      };
    }
  }
}
