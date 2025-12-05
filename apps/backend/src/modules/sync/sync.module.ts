import { Module } from '@nestjs/common';
import { SyncEventsService } from './sync-events.service';
import { SyncEventsController } from './sync-events.controller';

@Module({
  controllers: [SyncEventsController],
  providers: [SyncEventsService],
  exports: [SyncEventsService],
})
export class SyncModule {}
