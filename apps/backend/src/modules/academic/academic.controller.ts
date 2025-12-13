import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AcademicService } from './academic.service';
import { SaveCredentialDto } from './academic.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthQueueProcessor } from '../queue/auth-queue.processor';
import {
  ApiSaveCredential,
  ApiGetCredentials,
  ApiGetCredential,
  ApiTestCredential,
  ApiDeleteCredential,
} from './academic.swagger';
import {
  ApiSyncDiariesDecorator,
  ApiGetDiariesDecorator,
  ApiGetDiaryDecorator,
  ApiGetDiaryTeachingPlansDecorator,
  ApiGetDiaryWithPlansDecorator,
  ApiGetTeachingPlanDecorator,
  ApiGetDiaryContentDecorator,
  ApiGetDiaryContentStatsDecorator,
} from './diary.swagger';

@ApiTags('academic')
@Controller('academic')
@UseGuards(JwtAuthGuard)
export class AcademicController {
  constructor(
    private academicService: AcademicService,
    @InjectQueue('auth-queue') private authQueue: Queue,
    private authQueueProcessor: AuthQueueProcessor,
  ) {}

  @Post('credentials')
  @ApiSaveCredential()
  async saveCredential(@Request() req, @Body() dto: SaveCredentialDto) {
    return this.academicService.saveCredential(req.user.id, dto);
  }

  @Get('credentials')
  @ApiGetCredentials()
  async getCredentials(@Request() req) {
    return this.academicService.getCredentials(req.user.id);
  }

  @Get('credentials/:id')
  @ApiGetCredential()
  async getCredential(@Request() req, @Param('id') id: string) {
    return this.academicService.getCredential(req.user.id, id);
  }

  @Post('credentials/:id/test')
  @ApiTestCredential()
  async testCredential(@Request() req, @Param('id') id: string) {
    return this.academicService.testCredential(req.user.id, id);
  }

  @Delete('credentials/:id')
  @ApiDeleteCredential()
  async deleteCredential(@Request() req, @Param('id') id: string) {
    return this.academicService.deleteCredential(req.user.id, id);
  }

  @Post('diaries/sync')
  @ApiSyncDiariesDecorator()
  async syncDiaries(@Request() req) {
    // Get user's IFMS credential
    const credentials = await this.academicService.getCredentials(req.user.id);
    const ifmsCredential = credentials.find((c) => c.system === 'ifms');

    if (!ifmsCredential) {
      return { 
        success: false, 
        message: 'IFMS credential not found. Please configure your credentials first.' 
      };
    }

    if (!ifmsCredential.isVerified) {
      return { 
        success: false, 
        message: 'Credencial IFMS não verificada. Por favor, teste suas credenciais primeiro.' 
      };
    }

    // Queue diary sync job
    await this.authQueue.add('sync-diaries', {
      userId: req.user.id,
      credentialId: ifmsCredential.id,
    });

    return { 
      success: true,
      message: 'Sincronização de diários iniciada. Isso pode levar alguns instantes.' 
    };
  }

  @Get('diaries')
  @ApiGetDiariesDecorator()
  async getDiaries(@Request() req) {
    return this.academicService.getUserDiaries(req.user.id);
  }

  @Get('diaries/:diaryId')
  @ApiGetDiaryDecorator()
  async getDiary(@Request() req, @Param('diaryId') diaryId: string) {
    const diaries = await this.academicService.getUserDiaries(req.user.id);
    const diary = diaries.find((d) => d.id === diaryId);
    
    if (!diary) {
      return { success: false, message: 'Diary not found' };
    }
    
    return diary;
  }

  @Get('diaries/:diaryId/teaching-plans')
  @ApiGetDiaryTeachingPlansDecorator()
  async getDiaryTeachingPlans(@Request() req, @Param('diaryId') diaryId: string) {
    return this.academicService.getDiaryTeachingPlans(req.user.id, diaryId);
  }

  @Get('diaries/:diaryId/with-plans')
  @ApiGetDiaryWithPlansDecorator()
  async getDiaryWithPlans(@Request() req, @Param('diaryId') diaryId: string) {
    const diary = await this.academicService.getUserDiaries(req.user.id).then(
      (diaries) => diaries.find((d) => d.id === diaryId),
    );
    
    if (!diary) {
      return { success: false, message: 'Diary not found' };
    }

    const teachingPlans = await this.academicService.getDiaryTeachingPlans(
      req.user.id,
      diaryId,
    );

    return {
      ...diary,
      teachingPlans,
    };
  }

  @Get('teaching-plans/:planId')
  @ApiGetTeachingPlanDecorator()
  async getTeachingPlan(@Request() req, @Param('planId') planId: string) {
    return this.academicService.getTeachingPlan(req.user.id, planId);
  }

  @Post('teaching-plans/ai')
  @ApiOperation({ summary: 'Save an AI-generated teaching plan' })
  @ApiResponse({ status: 201, description: 'Teaching plan saved successfully' })
  @ApiResponse({ status: 404, description: 'Diary or base plan not found' })
  async saveAIGeneratedTeachingPlan(
    @Request() req,
    @Body() body: { diaryId: string; generatedPlan: any; basePlanId?: string },
  ) {
    const savedPlan = await this.academicService.saveAIGeneratedTeachingPlan(
      req.user.id,
      body.diaryId,
      body.generatedPlan,
      body.basePlanId,
    );
    return {
      success: true,
      plan: savedPlan,
    };
  }

  @Put('teaching-plans/:id')
  @ApiOperation({ summary: 'Update an existing teaching plan' })
  @ApiParam({ name: 'id', description: 'ID of the teaching plan' })
  @ApiResponse({ status: 200, description: 'Teaching plan updated successfully' })
  async updateTeachingPlanEndpoint(
    @Request() req,
    @Param('id') id: string,
    @Body() body: Partial<any>,
  ) {
    const updatedPlan = await this.academicService.updateTeachingPlan(id, body);
    return {
      success: true,
      plan: updatedPlan,
    };
  }

  @Delete('teaching-plans/:id')
  @ApiOperation({ summary: 'Delete an AI-generated teaching plan' })
  @ApiParam({ name: 'id', description: 'ID of the teaching plan' })
  @ApiResponse({ status: 200, description: 'Teaching plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Teaching plan not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete IFMS teaching plans' })
  async deleteTeachingPlan(
    @Request() req,
    @Param('id') id: string,
  ) {
    await this.academicService.deleteTeachingPlan(req.user.id, id);
    return {
      success: true,
      message: 'Plano de ensino excluído com sucesso',
    };
  }

  @Post('teaching-plans/:id/send')
  @ApiOperation({ summary: 'Send a teaching plan to IFMS' })
  @ApiParam({ name: 'id', description: 'ID of the teaching plan' })
  @ApiResponse({ status: 200, description: 'Teaching plan sent to IFMS successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or plan already sent' })
  @ApiResponse({ status: 404, description: 'Teaching plan or credentials not found' })
  async sendTeachingPlanToIFMS(@Request() req, @Param('id') id: string) {
    const result = await this.academicService.sendTeachingPlanToIFMS(req.user.id, id);
    return result;
  }

  @Get('diaries/:diaryId/content')
  @ApiGetDiaryContentDecorator()
  async getDiaryContent(@Request() req, @Param('diaryId') diaryId: string) {
    return this.academicService.getDiaryContent(req.user.id, diaryId);
  }

  @Get('diaries/:diaryId/content/stats')
  @ApiGetDiaryContentStatsDecorator()
  async getDiaryContentStats(@Request() req, @Param('diaryId') diaryId: string) {
    return this.academicService.getDiaryContentStats(req.user.id, diaryId);
  }

  @Post('diaries/:id/sync')
  @ApiOperation({ summary: 'Sincroniza um diário específico' })
  @ApiParam({ name: 'id', description: 'ID do diário' })
  @ApiResponse({ status: 200, description: 'Diário sincronizado com sucesso' })
  async syncDiary(@Request() req, @Param('id') id: string) {
    return this.authQueueProcessor.syncSpecificDiary(req.user.id, id);
  }

  @Post('teaching-plans/:id/sync')
  @ApiOperation({ summary: 'Sincroniza um plano de ensino específico' })
  @ApiParam({ name: 'id', description: 'ID do plano de ensino' })
  @ApiResponse({ status: 200, description: 'Plano sincronizado com sucesso' })
  async syncTeachingPlan(@Request() req, @Param('id') id: string) {
    return this.authQueueProcessor.syncSpecificTeachingPlan(req.user.id, id);
  }

  @Post('diaries/:id/generate-from-plan')
  @ApiOperation({ summary: 'Gera conteúdo do diário baseado no plano de ensino' })
  @ApiParam({ name: 'id', description: 'ID do diário' })
  @ApiResponse({ status: 200, description: 'Conteúdo gerado com sucesso' })
  async generateDiaryContentFromPlan(
    @Request() req,
    @Param('id') diaryId: string,
    @Body() body: { teachingPlanId: string }
  ) {
    return this.academicService.generateDiaryContentFromPlan(
      req.user.id,
      diaryId,
      body.teachingPlanId
    );
  }

  @Post('diaries/:id/content/bulk')
  @ApiOperation({ summary: 'Salva múltiplos conteúdos do diário de uma vez' })
  @ApiParam({ name: 'id', description: 'ID do diário' })
  @ApiResponse({ status: 200, description: 'Conteúdos salvos com sucesso' })
  async saveDiaryContentBulk(
    @Request() req,
    @Param('id') diaryId: string,
    @Body() body: { contents: any[] }
  ) {
    return this.academicService.saveDiaryContentBulk(
      req.user.id,
      diaryId,
      body.contents
    );
  }

  @Post('diaries/:diaryId/content/:contentId/send')
  @ApiOperation({ summary: 'Envia conteúdo do diário para o sistema acadêmico IFMS' })
  @ApiParam({ name: 'diaryId', description: 'ID do diário' })
  @ApiParam({ name: 'contentId', description: 'ID do conteúdo a ser enviado' })
  @ApiResponse({ status: 200, description: 'Conteúdo enviado com sucesso' })
  @ApiResponse({ status: 404, description: 'Diário, conteúdo ou credenciais não encontrados' })
  async sendDiaryContentToSystem(
    @Request() req,
    @Param('diaryId') diaryId: string,
    @Param('contentId') contentId: string,
  ) {
    return this.academicService.sendDiaryContentToSystem(
      req.user.id,
      diaryId,
      contentId,
    );
  }

  @Post('diaries/:diaryId/content/send-bulk')
  @ApiOperation({ summary: 'Envia múltiplos conteúdos do diário para o sistema acadêmico IFMS' })
  @ApiParam({ name: 'diaryId', description: 'ID do diário' })
  @ApiResponse({ status: 200, description: 'Conteúdos enviados com sucesso' })
  @ApiResponse({ status: 404, description: 'Diário ou credenciais não encontrados' })
  async sendDiaryContentBulkToSystem(
    @Request() req,
    @Param('diaryId') diaryId: string,
    @Body() body: { contentIds: string[] },
  ) {
    return this.academicService.sendDiaryContentBulkToSystem(
      req.user.id,
      diaryId,
      body.contentIds,
    );
  }

  @Get('diaries/:diaryId/content/send-bulk-sse')
  @ApiOperation({ summary: 'Envia múltiplos conteúdos com progresso SSE' })
  @ApiParam({ name: 'diaryId', description: 'ID do diário' })
  async sendDiaryContentBulkSSE(
    @Request() req,
    @Param('diaryId') diaryId: string,
  ) {
    const contentIds = req.query.contentIds?.split(',') || [];
    
    req.res.setHeader('Content-Type', 'text/event-stream');
    req.res.setHeader('Cache-Control', 'no-cache');
    req.res.setHeader('Connection', 'keep-alive');

    const sendSSE = (data: any) => {
      req.res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      await this.academicService.sendDiaryContentBulkToSystem(
        req.user.id,
        diaryId,
        contentIds,
        (current: number, total: number, contentId: string, success: boolean, message: string) => {
          sendSSE({
            type: 'progress',
            current,
            total,
            contentId,
            success,
            message,
          });
        },
      ).then((result) => {
        sendSSE({
          type: 'complete',
          ...result,
        });
        req.res.end();
      }).catch((error) => {
        sendSSE({
          type: 'error',
          message: error.message,
        });
        req.res.end();
      });
    } catch (error) {
      sendSSE({
        type: 'error',
        message: error.message,
      });
      req.res.end();
    }
  }
}
