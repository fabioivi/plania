import { Module, forwardRef } from '@nestjs/common';
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
    forwardRef(() => AcademicModule),
    ScrapingModule,
    SyncModule,
  ],
  providers: [AuthQueueProcessor],
  exports: [BullModule, AuthQueueProcessor],
})
export class QueueModule {}
