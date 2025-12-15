import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapingService } from './scraping.service';
import { ScrapingDebugService } from './scraping-debug.service';
import { ScrapingDebugController } from './scraping-debug.controller';
import { ScrapingDebug } from './scraping-debug.entity';
import { SessionCacheService } from '../../common/services/session-cache.service';
import { ScrapingPoolService } from './scraping-pool.service';

@Module({
  imports: [TypeOrmModule.forFeature([ScrapingDebug])],
  controllers: [ScrapingDebugController],
  providers: [
    ScrapingService,
    ScrapingDebugService,
    SessionCacheService,
    ScrapingPoolService,
  ],
  exports: [
    ScrapingService,
    ScrapingDebugService,
    SessionCacheService,
    ScrapingPoolService,
  ],
})
export class ScrapingModule {}
