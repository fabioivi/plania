import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LLMService } from './llm.service';
import { TeachingPlanGeneratorService } from './teaching-plan-generator.service';
import { AIController } from './ai.controller';
import { AuthModule } from '../auth/auth.module';
import { TeachingPlan } from '../academic/teaching-plan.entity';
import { Diary } from '../academic/diary.entity';
import { DiaryContent } from '../academic/diary-content.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TeachingPlan, Diary, DiaryContent]),
    AuthModule,
  ],
  controllers: [AIController],
  providers: [LLMService, TeachingPlanGeneratorService],
  exports: [LLMService, TeachingPlanGeneratorService],
})
export class AIModule {}
