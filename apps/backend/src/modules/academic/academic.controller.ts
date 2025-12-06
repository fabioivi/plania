import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ApiTags } from '@nestjs/swagger';
import { AcademicService } from './academic.service';
import { SaveCredentialDto } from './academic.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
}
