import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AuthQueueProcessor } from './auth-queue.processor';
import { AcademicModule } from '../academic/academic.module';
import { ScrapingModule } from '../scraping/scraping.module';
import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'auth-queue',
      },
      {
        name: 'scraping-queue',
      },
      {
        name: 'plans-queue',
      },
    ),
    AcademicModule,
    ScrapingModule,
    SyncModule,
  ],
  providers: [AuthQueueProcessor],
  exports: [BullModule],
})
export class QueueModule {}
