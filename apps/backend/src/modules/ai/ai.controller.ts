import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Sse,
  MessageEvent,
  Param,
} from '@nestjs/common';
import { Observable, interval, map, takeWhile, concat, of } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  TeachingPlanGeneratorService,
  GenerateTeachingPlanDto,
} from './teaching-plan-generator.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(
    private readonly teachingPlanGeneratorService: TeachingPlanGeneratorService,
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
        { diaryId },
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
        return (
          event.data.type === 'progress' ||
          (event.data.type === 'complete' && !event.data.plan) ||
          event.data.type === 'error'
        );
      }, true),
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
}
