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
  ) {}

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
}
