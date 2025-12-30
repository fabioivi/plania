import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScrapingService } from './scraping.service';
import { SuapScraperProvider } from './providers/suap.scraper';
import { ScrapingDebugController } from './scraping-debug.controller';
import { ScrapingDebugService } from './scraping-debug.service';
import { ScrapingPoolService } from './scraping-pool.service';
import { PlaywrightService } from './services/playwright.service';
import { ScraperFactory } from './factories/scraper.factory';
import { IfmsScraperProvider } from './providers/ifms.scraper';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScrapingDebug } from './scraping-debug.entity';
import { SessionCacheService } from '../../common/services/session-cache.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ScrapingDebug])
  ],
  providers: [
    ScrapingService,
    SuapScraperProvider,
    ScrapingDebugService,
    ScrapingPoolService,
    PlaywrightService,
    ScraperFactory,
    IfmsScraperProvider,
    SessionCacheService,
  ],
  controllers: [ScrapingDebugController],
  exports: [ScrapingService, SuapScraperProvider, ScrapingDebugService, PlaywrightService, ScraperFactory, ScrapingPoolService],
})
export class ScrapingModule { }
