import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AcademicController } from './academic.controller';
import { AcademicService } from './academic.service';
import { AcademicCredential } from './academic-credential.entity';
import { Diary } from './diary.entity';
import { DiaryContent } from './diary-content.entity';
import { TeachingPlan } from './teaching-plan.entity';
import { TeachingPlanHistory } from './teaching-plan-history.entity';
import { CryptoService } from '../../common/services/crypto.service';
import { QueueModule } from '../queue/queue.module';
import { ScrapingModule } from '../scraping/scraping.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AcademicCredential,
      Diary,
      DiaryContent,
      TeachingPlan,
      TeachingPlanHistory,
    ]),
    BullModule.registerQueue({
      name: 'auth-queue',
    }),
    forwardRef(() => QueueModule),
    ScrapingModule,
  ],
  controllers: [AcademicController],
  providers: [
    AcademicService, 
    CryptoService,
  ],
  exports: [AcademicService],
})
export class AcademicModule {}
